import Request from './request';

enum DefaultEndpoints {
  buildAuthUrl = '/nylas/generate-auth-url',
  exchangeCodeForToken = '/nylas/exchange-mailbox-token',
}

export interface NylasProps {
  /**
   * URL of the backend server configured with the Nylas middleware or Nylas routes implemented.
   */
  serverBaseUrl: string;
}

export interface AuthUrlOptions {
  /**
   * URL to redirect to upon successful authentication
   */
  successRedirectUrl: string;

  /**
   * Email address of the account to authenticate
   */
  emailAddress?: string;

  /**
   * URL to override the endpoint for building the authentication URL
   */
  buildAuthUrlEndpoint?: string;
}

export interface ExchangeCodeOptions {
  /**
   * URL to override the endpoint for exchanging the code for the access token
   */
  exchangeCodeForTokenEndpoint?: string;
}

export default class Nylas {
  /**
   * URL of the backend server configured with the Nylas middleware or Nylas routes implemented.
   */
  serverBaseUrl: string;

  constructor(props: NylasProps) {
    this.serverBaseUrl = props.serverBaseUrl;
  }

  /**
   * Builds the URL for authenticating users to your application via Hosted Authentication
   * @param opts Configuration for building the URL
   * @return URL for authentication
   * @throws If the HTTP response code is non 2xx
   * @throws If the server doesn't respond with a URL
   */
  async buildAuthUrl(opts: AuthUrlOptions): Promise<string> {
    const url =
      this.serverBaseUrl +
      (opts.buildAuthUrlEndpoint || DefaultEndpoints.buildAuthUrl);
    const rawResp = await Request.post({
      url,
      body: {
        email_address: opts.emailAddress,
        success_url: opts.successRedirectUrl,
      },
    });
    const authUrl = await rawResp.text();
    if (!authUrl || authUrl.length == 0) {
      throw new Error('No auth URL was returned from the server.');
    }

    return authUrl;
  }

  /**
   * Builds and redirects to the URL for authenticating users to your application via Hosted Authentication
   * @param opts Configuration for building the URL
   * @throws If window is not defined
   * @throws If the HTTP response code is non 2xx
   * @throws If the server doesn't respond with a URL
   */
  async authWithRedirect(opts: AuthUrlOptions): Promise<void> {
    browserCheck();

    window.location.href = await this.buildAuthUrl(opts);
  }

  /**
   * Exchange the Nylas authorization code for a Nylas access token
   * @param authorizationCode Nylas authorization code
   * @param opts Configuration for the token exchange
   * @throws If no authorization code was provided
   * @throws If the HTTP response code is non 2xx
   * @throws If the server doesn't respond with an access token
   */
  async exchangeCodeForToken(
    authorizationCode: string,
    opts?: ExchangeCodeOptions
  ): Promise<string> {
    if (!authorizationCode) {
      throw new Error('No valid authorization code detected');
    }

    const url =
      this.serverBaseUrl +
      (opts?.exchangeCodeForTokenEndpoint ||
        DefaultEndpoints.exchangeCodeForToken);
    const rawResp = await Request.post({
      url,
      body: {
        token: authorizationCode,
      },
    });
    const accessToken = await rawResp.text();
    if (!accessToken || accessToken.length == 0) {
      throw new Error('No access token was returned from the server.');
    }

    return accessToken;
  }

  /**
   * Parses the URL for the Nylas authorization code for a Nylas access token
   * @param opts Configuration for the token exchange
   * @throws If window is not defined
   * @throws If no authorization code was provided
   * @throws If the HTTP response code is non 2xx
   * @throws If the server doesn't respond with an access token
   */
  async exchangeCodeFromUrlForToken(
    opts?: ExchangeCodeOptions
  ): Promise<string> {
    browserCheck();

    const authorizationCode = new URLSearchParams(window.location.search).get(
      'code'
    );
    return await this.exchangeCodeForToken(authorizationCode, opts);
  }
}

/**
 * Simple browser check
 * @throws If window is not defined
 */
const browserCheck = () => {
  if (window && typeof window !== 'undefined') {
    throw new Error(
      'You are trying to use a browser function without a browser.'
    );
  }
};
