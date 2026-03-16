export type AuthSession = {
  token: string;
  refreshToken: string;
  expiresIn: string;
  uid: string;
};

export function resolveAuthBffUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  return window.location.origin;
}

export function resolveCookieDomain(): string | null {
  if (typeof window === 'undefined') return null;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;

  if (host.endsWith('.threesixty.dev')) {
    const parts = host.split('.');
    if (parts.length >= 4) {
      return `.${parts.slice(1).join('.')}`;
    }
  }

  const parts = host.split('.');
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  return null;
}

export function persistAuthCookie(session: AuthSession): void {
  const maxAge = Number.parseInt(session.expiresIn, 10);
  const cookieParts = [
    `auth_token=${encodeURIComponent(session.token)}`,
    'Path=/',
    'SameSite=Lax',
    Number.isFinite(maxAge) ? `Max-Age=${maxAge}` : 'Max-Age=3600',
  ];

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieParts.push('Secure');
  }

  const domain = resolveCookieDomain();
  if (domain) {
    cookieParts.push(`Domain=${domain}`);
  }

  document.cookie = cookieParts.join('; ');
}

export function getReturnUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('returnUrl');
  if (!fromQuery) {
    return '/';
  }
  return fromQuery;
}
