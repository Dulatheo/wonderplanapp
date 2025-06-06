import {defineAuth, secret} from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('LOGINWITHGOOGLE_CLIENT_ID'),
        clientSecret: secret('LOGINWITHGOOGLE_CLIENT_SECRET'),
        scopes: ['email'],
      },
      signInWithApple: {
        clientId: secret('APPLE_CLIENT_ID'),
        keyId: secret('APPLE_KEY_ID'),
        privateKey: secret('APPLE_PRIVATE_KEY'),
        teamId: secret('APPLE_TEAM_ID'),
        scopes: ['email'],
      },
      callbackUrls: ['myapp://callback/'],
      logoutUrls: ['myapp://signout/'],
    },
  },
});
