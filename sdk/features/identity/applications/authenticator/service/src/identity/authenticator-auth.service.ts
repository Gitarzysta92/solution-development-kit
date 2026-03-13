import { err, ok, Result } from '@sdk/kernel/standard';
import type { IIdTokenVerifier, VerifiedIdTokenDto } from '@sdk/extras/identity-firebase';
import type { IAuthenticationStrategy } from '@sdk/features/identity/libs/authentication';
import type { AuthSessionDto } from '@sdk/features/identity/libs/authentication';
import { IdentityAuthenticationService } from '@sdk/features/identity/libs/authentication';
import type { IIdentityProvider } from '@sdk/features/identity/libs/authentication';
import type { IAuthenticationEventEmitter } from '@sdk/features/identity/libs/authentication';
import type { IAuthenticationRefreshToken } from '@sdk/features/identity/libs/authentication';

export type ValidateRequiredResult = VerifiedIdTokenDto;
export type ValidateOptionalResult =
  | { authenticated: true; principal: VerifiedIdTokenDto }
  | { authenticated: false; anonymous: true };

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization || typeof authorization !== 'string') return null;
  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1] || null;
}

export class AuthenticatorAuthService {
  private readonly authService: IdentityAuthenticationService;

  constructor(
    private readonly idTokenVerifier: IIdTokenVerifier,
    identityProvider: IIdentityProvider,
    eventsEmitter: IAuthenticationEventEmitter,
    refreshToken: IAuthenticationRefreshToken
  ) {
    this.authService = new IdentityAuthenticationService(
      identityProvider,
      eventsEmitter,
      refreshToken
    );
  }

  async authenticate(strategy: IAuthenticationStrategy): Promise<Result<AuthSessionDto, Error>> {
    return this.authService.authenticate(strategy);
  }

  async refresh(refreshToken: string): Promise<Result<AuthSessionDto, Error>> {
    return this.authService.refresh(refreshToken);
  }

  async validateRequired(authorization: string | undefined): Promise<Result<ValidateRequiredResult, Error>> {
    const token = getBearerToken(authorization);
    if (!token) {
      return err(new Error('Missing or invalid Authorization header'));
    }
    return this.idTokenVerifier.verifyIdToken(token);
  }

  async validateOptional(authorization: string | undefined): Promise<Result<ValidateOptionalResult, Error>> {
    const token = getBearerToken(authorization);
    if (!token) {
      return ok({ authenticated: false, anonymous: true });
    }
    const result = await this.idTokenVerifier.verifyIdToken(token);
    if (result.ok) {
      return ok({ authenticated: true, principal: result.value });
    }
    return ok({ authenticated: false, anonymous: true });
  }
}
