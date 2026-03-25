import { IAuthenticationStrategy } from '@sdk/features/identity/libs/authentication';
import {
  FirebaseGoogleCodeExchanger,
  FirebaseRestSessionGateway,
  FirebaseTokenGenerator,
  FirebaseUserProvisioner,
} from '@sdk/extras/identity-firebase';
import { GoogleV2AuthenticationStrategy } from './google-v2.strategy';

export class GoogleV2AuthenticationStrategyFactory {
  constructor(
    private readonly codeExchanger: FirebaseGoogleCodeExchanger,
    private readonly firebaseUserProvisioner: FirebaseUserProvisioner,
    private readonly firebaseTokenGenerator: FirebaseTokenGenerator,
    private readonly firebaseRestSessionGateway: FirebaseRestSessionGateway
  ) {}

  create(code: string, redirectUri: string, codeVerifier: string): IAuthenticationStrategy {
    return new GoogleV2AuthenticationStrategy(
      code,
      redirectUri,
      codeVerifier,
      this.codeExchanger,
      this.firebaseUserProvisioner,
      this.firebaseTokenGenerator,
      this.firebaseRestSessionGateway
    );
  }
}
