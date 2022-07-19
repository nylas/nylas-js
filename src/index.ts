import Request from './request';

enum DefaultEndpoints {
  GenerateAuthUrl = '/nylas/generate-auth-url',
  ExchangeMailboxToken = '/nylas/exchange-mailbox-token',
}

export interface NylasProps {
  serverBaseUrl: string;
}

export interface AuthUrlOptions {
  successRedirectUrl: string;
  emailAddress?: string;
  generateAuthUrlEndpoint?: string;
}

export interface ExchangeCodeOptions {
  exchangeCodeForTokenEndpoint?: string;
}

export default class Nylas {
  serverBaseUrl: string;

  constructor(props: NylasProps) {
    this.serverBaseUrl = props.serverBaseUrl;
  }

  async buildAuthUrl(opts: AuthUrlOptions): Promise<string> {
    let authUrl = '';
    try {
      const url =
        this.serverBaseUrl +
        (opts.generateAuthUrlEndpoint || DefaultEndpoints.GenerateAuthUrl);
      const rawResp = await Request.post({
        url,
        body: {
          email_address: opts.emailAddress,
          success_url: opts.successRedirectUrl,
        },
      });

      authUrl = await rawResp.text();
    } catch (e: any) {
      console.warn(`Error fetching auth URL:`, e);
      throw e;
    }

    if (!authUrl || authUrl.length == 0) {
      throw new Error('No auth URL was returned from the server.');
    }

    return authUrl;
  }

  async authWithRedirect(opts: AuthUrlOptions): Promise<void> {
    browserCheck();

    window.location.href = await this.buildAuthUrl(opts);
  }

  async exchangeCodeForToken(
    authorizationCode: string,
    opts?: ExchangeCodeOptions
  ): Promise<string> {
    if (!authorizationCode) {
      throw new Error('No valid authorization code detected');
    }

    let accessToken = '';
    try {
      const url =
        this.serverBaseUrl +
        (opts?.exchangeCodeForTokenEndpoint ||
          DefaultEndpoints.ExchangeMailboxToken);
      const rawResp = await Request.post({
        url,
        body: {
          token: authorizationCode,
        },
      });
      accessToken = await rawResp.text();
    } catch (e: any) {
      console.warn(`Error exchanging the code for an access token:`, e);
      throw e;
    }

    if (!accessToken || accessToken.length == 0) {
      throw new Error('No access token was returned from the server.');
    }

    return accessToken;
  }

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

const browserCheck = () => {
  if (window && typeof window !== 'undefined') {
    throw new Error(
      'You are trying to use a browser function without a browser.'
    );
  }
};
