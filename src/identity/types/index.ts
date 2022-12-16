/** Config - configuration required to init a nylas session */
export interface Config {
  /** ClientID - Nylas Client ID */
  clientId: string;
  /** RedirectURI - RedirectURI of your app */
  redirectUri: string;
  /** AccessType - Type of access you request from token (defaults to offline) */
  accessType?: string;
  /** Domain - Your Nylas Auth domain */
  domain?: string;
  /** Store - Set a store for handling sessions for node env only */
  store?: Store;
  hosted?: boolean;
}
/** AuthConfig - configuration required to generate an oAuth link */
export interface AuthConfig {
  proivder?: string;
  scope?: Array<string>;
  loginHint?: string;
  prompt?: string;
  metadata?: string;
  state?: string;
  settings?: any;
  hosted?: boolean;
  popup?: boolean;
}
/** IDToken - format of openID token */
export interface IDToken {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash?: string;
  iat: number;
  exp: number;
  name?: string;
  given_name?: string;
  family_name?: string;
  nick_name?: string;
  picture?: string;
  gender?: string;
  locale?: string;
}
/** CodeExcangeResponse - code exchange payload */
export interface CodeExcangeResponse {
  access_token: string;
  grant_id: string;
  id_token: string;
  token_type: string;
  scope: string;
}
/** ProviderListResponse - format of the provider response */
export interface ProviderListResponse {
  success: boolean;
  data: ProviderList[];
}
/** ProviderList- format of data of the ProviderListResponse */
export interface ProviderList {
  provider: string;
  type: string;
  settings: any;
  name: string;
}

/** Store - Interface for implementing your custom store for handling sessions */
export interface Store {
  set(key: string, value: string): Promise<string | null>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<null>;
}
