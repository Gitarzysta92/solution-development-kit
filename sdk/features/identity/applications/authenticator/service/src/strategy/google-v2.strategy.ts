import {
  AuthSessionDto,
  IAuthenticationStrategy,
  IdentityCreationDto,
} from '@sdk/features/identity/libs/authentication';
import { err, isErr, ok, Result } from '@sdk/kernel/standard';
import {
  FirebaseGoogleCodeExchanger,
  FirebaseRestSessionGateway,
  FirebaseTokenGenerator,
  FirebaseUserProvisioner,
} from '@sdk/extras/identity-firebase';

export class GoogleV2AuthenticationStrategy implements IAuthenticationStrategy {
  static readonly provider = 'google-v2';

  static appliesTo(provider: string): boolean {
    return provider.toLowerCase() === this.provider;
  }

  constructor(
    private readonly code: string,
    private readonly redirectUri: string,
    private readonly codeVerifier: string,
    private readonly codeExchanger: FirebaseGoogleCodeExchanger,
    private readonly firebaseUserProvisioner: FirebaseUserProvisioner,
    private readonly firebaseTokenGenerator: FirebaseTokenGenerator,
    private readonly firebaseRestSessionGateway: FirebaseRestSessionGateway
  ) {}

  async execute(): Promise<Result<IdentityCreationDto & AuthSessionDto, Error>> {
    const userInfoResult = await this.codeExchanger.exchangeCode(
      this.code,
      this.redirectUri,
      this.codeVerifier
    );
    if (isErr(userInfoResult)) {
      return err(userInfoResult.error);
    }

    const googleUser = userInfoResult.value;
    if (!googleUser.idToken) {
      return err(new Error('Google id_token was not returned by exchanger'));
    }

    const sessionResult = await this.firebaseRestSessionGateway.signInWithIdp(
      googleUser.idToken,
      'google.com',
      this.redirectUri
    );
    if (isErr(sessionResult)) {
      const errorCode = (sessionResult.error as { code?: string }).code;
      if (errorCode === 'EMAIL_EXISTS') {
        const existingUserResult = await this.firebaseUserProvisioner.getUserByEmail(
          googleUser.email
        );
        if (isErr(existingUserResult)) {
          return err(existingUserResult.error);
        }

        const tokenResult = await this.firebaseTokenGenerator.generateToken(
          existingUserResult.value.uid
        );
        if (isErr(tokenResult)) {
          return err(tokenResult.error);
        }

        const existingSessionResult = await this.firebaseRestSessionGateway.signInWithCustomToken(
          tokenResult.value
        );
        if (isErr(existingSessionResult)) {
          return err(existingSessionResult.error);
        }

        return ok({
          token: existingSessionResult.value.token,
          uid: existingUserResult.value.uid,
          email: googleUser.email,
          provider: GoogleV2AuthenticationStrategy.provider,
          claim: googleUser.email,
          identityType: 'email',
          identityId: existingUserResult.value.uid,
          kind: 'user',
          expiresIn: existingSessionResult.value.expiresIn,
          refreshToken: existingSessionResult.value.refreshToken,
        });
      }
      return err(sessionResult.error);
    }

    return ok({
      token: sessionResult.value.token,
      uid: sessionResult.value.uid,
      email: googleUser.email,
      provider: GoogleV2AuthenticationStrategy.provider,
      claim: googleUser.email,
      identityType: 'email',
      identityId: sessionResult.value.uid,
      kind: 'user',
      expiresIn: sessionResult.value.expiresIn,
      refreshToken: sessionResult.value.refreshToken,
    });
  }
}
