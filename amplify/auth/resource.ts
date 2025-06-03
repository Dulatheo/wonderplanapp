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
      callbackUrls: ['myapp://callback/'],
      logoutUrls: ['myapp://signout/'],
    },
  },
});
