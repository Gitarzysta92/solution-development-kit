import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AuthSession,
  getReturnUrl,
  persistAuthCookie,
  resolveAuthBffUrl,
} from './auth-session.util';
import { createPkce, createState } from './pkce.util';

const OAUTH_STATE_KEY = 'sdk.auth.oauth.state';
const OAUTH_VERIFIER_KEY = 'sdk.auth.oauth.verifier';
const OAUTH_RETURN_URL_KEY = 'sdk.auth.oauth.returnUrl';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly authBffUrl = resolveAuthBffUrl();

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async loginWithEmailPassword(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set('');

    try {
      const response = await firstValueFrom(
        this.http.post<AuthSession>(`${this.authBffUrl}/auth/signin`, {
          email: this.form.controls.email.value,
          password: this.form.controls.password.value,
        })
      );
      persistAuthCookie(response);
      this.redirectAfterLogin(getReturnUrl());
    } catch {
      this.error.set('Invalid credentials. Please try again.');
    } finally {
      this.pending.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (this.pending()) return;

    this.pending.set(true);
    this.error.set('');

    try {
      const { codeVerifier, codeChallenge } = await createPkce();
      const state = createState();
      const returnUrl = getReturnUrl();
      const redirectUri = `${window.location.origin}/auth/callback`;

      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      sessionStorage.setItem(OAUTH_VERIFIER_KEY, codeVerifier);
      sessionStorage.setItem(OAUTH_RETURN_URL_KEY, returnUrl);

      const params = new URLSearchParams({
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      window.location.assign(
        `${this.authBffUrl}/auth/oauth/google/authorize?${params.toString()}`
      );
    } catch {
      this.error.set('Cannot start Google login right now.');
      this.pending.set(false);
    }
  }

  private redirectAfterLogin(returnUrl: string): void {
    if (
      returnUrl.startsWith('http://') ||
      returnUrl.startsWith('https://') ||
      returnUrl.startsWith('/')
    ) {
      window.location.assign(returnUrl);
      return;
    }

    window.location.assign('/');
  }
}

export const OAuthStorageKeys = {
  state: OAUTH_STATE_KEY,
  verifier: OAUTH_VERIFIER_KEY,
  returnUrl: OAUTH_RETURN_URL_KEY,
} as const;
