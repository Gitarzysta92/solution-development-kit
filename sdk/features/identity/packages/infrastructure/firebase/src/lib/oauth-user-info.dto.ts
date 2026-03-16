export type OAuthUserInfoDto = {
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
  // TODO(auth): split Google exchange response into provider-specific DTO and keep OAuthUserInfoDto provider-agnostic.
  idToken?: string;
};

