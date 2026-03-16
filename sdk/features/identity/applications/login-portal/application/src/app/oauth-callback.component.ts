import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AuthSession,
  persistAuthCookie,
  resolveAuthBffUrl,
} from './auth-session.util';
import { OAuthStorageKeys } from './login-page.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="callback">
      <section class="card">
        <h1>{{ statusTitle() }}</h1>
        <p>{{ statusMessage() }}</p>
      </section>
    </main>
  `,
  styles: [
    `
      .callback {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f7fb;
        padding: 1rem;
      }

      .card {
        width: min(420px, 100%);
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
        padding: 1.5rem;
      }
    `,
  ],
})
export class OAuthCallbackComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authBffUrl = resolveAuthBffUrl();
  readonly statusTitle = signal('Finishing sign-in...');
  readonly statusMessage = signal('Please wait.');

  ngOnInit(): void {
    void this.finishGoogleSignIn();
  }

  private async finishGoogleSignIn(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem(OAuthStorageKeys.state);
    const codeVerifier = sessionStorage.getItem(OAuthStorageKeys.verifier);
    const returnUrl = sessionStorage.getItem(OAuthStorageKeys.returnUrl) ?? '/';
    const redirectUri = `${window.location.origin}/auth/callback`;

    if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
      this.statusTitle.set('Sign-in failed');
      this.statusMessage.set('OAuth validation failed. Please try again.');
      return;
    }

    try {
      const session = await firstValueFrom(
        this.http.post<AuthSession>(`${this.authBffUrl}/auth/signin/oauth`, {
          provider: 'google',
          code,
          redirectUri,
          codeVerifier,
        })
      );

      persistAuthCookie(session);
      this.cleanup();
      window.location.assign(returnUrl);
    } catch {
      this.statusTitle.set('Sign-in failed');
      this.statusMessage.set('Google sign-in could not be completed.');
    }
  }

  private cleanup(): void {
    sessionStorage.removeItem(OAuthStorageKeys.state);
    sessionStorage.removeItem(OAuthStorageKeys.verifier);
    sessionStorage.removeItem(OAuthStorageKeys.returnUrl);
  }
}
