import {
  createKeyValueStorageFromCookieStorageAdapter,
  createUserPoolsTokenProvider,
  createAWSCredentialsAndIdentityIdProvider,
  runWithAmplifyServerContext,
} from "aws-amplify/adapter-core";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth/server";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { generateClient } from "aws-amplify/api/server";
import type {
  LibraryOptions,
  FetchAuthSessionOptions,
} from "@aws-amplify/core";
import type {
  GraphQLOptionsV6,
  GraphQLResponseV6,
} from "@aws-amplify/api-graphql";
import config from "../amplifyconfiguration.json";

// parse the content of `amplifyconfiguration.json` into the shape of ResourceConfig
const amplifyConfig = parseAmplifyConfig(config);

// create the Amplify used token cookies names array
const userPoolClientId = amplifyConfig.Auth!.Cognito.userPoolClientId;
const lastAuthUserCookieName = `CognitoIdentityServiceProvider.${userPoolClientId}.LastAuthUser`;

// create a GraphQL client that can be used in a server context
const gqlServerClient = generateClient({ config: amplifyConfig });

const getAmplifyAuthKeys = (lastAuthUser: string) =>
  ["idToken", "accessToken", "refreshToken", "clockDrift"]
    .map(
      (key) =>
        `CognitoIdentityServiceProvider.${userPoolClientId}.${lastAuthUser}.${key}`
    )
    .concat(lastAuthUserCookieName);

export function setupAmplifyServerApi(cookies: any) {
  // Get the last auth user cookie value using Astro's `Astro.cookies` API
  const lastAuthUserCookie = cookies.get(lastAuthUserCookieName).value;

  // Get all Amplify auth token cookie names
  const authKeys = lastAuthUserCookie
    ? getAmplifyAuthKeys(lastAuthUserCookie)
    : [];

  // Create a key-value map of cookie name => cookie value
  const amplifyCookies = authKeys.reduce<
    Record<string, string | null | undefined>
  >(
    (result, key) => ({
      ...result,
      [key]: cookies.get(key).value,
    }),
    {}
  );

  // Create a key value storage based on the Astro cookies
  const keyValueStorage = createKeyValueStorageFromCookieStorageAdapter({
    get(name) {
      return { name, value: amplifyCookies[name] as string };
    },
    getAll() {
      return Object.entries(amplifyCookies).map(([name, value]) => ({
        name,
        value,
      })) as any;
    },
    // Implement set method to store tokens back to Astro cookies if needed
    set(name, value) {
      // Implement logic to set the cookie value using Astro.cookies.set(...)
    },
    delete(name) {
      // Implement logic to delete the cookie using Astro.cookies.delete(...)
    },
  });

  // Create a token provider
  const tokenProvider = createUserPoolsTokenProvider(
    amplifyConfig.Auth!,
    keyValueStorage
  );

  // Create a credentials provider
  const credentialsProvider = createAWSCredentialsAndIdentityIdProvider(
    amplifyConfig.Auth!,
    keyValueStorage
  );

  // Create the libraryOptions object
  const libraryOptions: LibraryOptions = {
    Auth: {
      tokenProvider,
      credentialsProvider,
    },
  };

  const AmplifyServerApi = {
    Auth: {
      fetchAuthSession: (options: FetchAuthSessionOptions) =>
        runWithAmplifyServerContext(
          amplifyConfig,
          libraryOptions,
          (contextSpec) => fetchAuthSession(contextSpec, options)
        ),
      fetchUserAttributes: () =>
        runWithAmplifyServerContext(
          amplifyConfig,
          libraryOptions,
          (contextSpec) => fetchUserAttributes(contextSpec)
        ),
      getCurrentUser: () =>
        runWithAmplifyServerContext(
          amplifyConfig,
          libraryOptions,
          (contextSpec) => getCurrentUser(contextSpec)
        ),
    },
    GraphQL: {
      client: {
        // Follow this typing to ensure the`graphql` API return type can
        // be inferred correctly according to your queries and mutations
        graphql: <
          FALLBACK_TYPES = unknown,
          TYPED_GQL_STRING extends string = string,
        >(
          options: GraphQLOptionsV6<FALLBACK_TYPES, TYPED_GQL_STRING>,
          additionalHeaders?: Record<string, string>
        ) =>
          runWithAmplifyServerContext<
            GraphQLResponseV6<FALLBACK_TYPES, TYPED_GQL_STRING>
          >(amplifyConfig, libraryOptions, (contextSpec) =>
            gqlServerClient.graphql(contextSpec, options, additionalHeaders)
          ),
      },
    },
  };

  return AmplifyServerApi;
}
