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
  onConnectionError?: (error: Error) => void;
}

export interface ExchangeCodeOptions {
  exchangeCodeForTokenEndpoint?: string;
  onConnectionError?: (error: Error) => void;
}

export default class Nylas {
  serverBaseUrl: string;

  constructor(props: NylasProps) {
    this.serverBaseUrl = props.serverBaseUrl;
  }

  async buildAuthUrl(opts: AuthUrlOptions): Promise<string | boolean> {
    try {
      const url =
        this.serverBaseUrl +
        (opts.generateAuthUrlEndpoint || DefaultEndpoints.GenerateAuthUrl);
      const rawResp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: opts.emailAddress,
          success_url: opts.successRedirectUrl,
        }),
      });

      return await rawResp.text();
    } catch (e: any) {
      console.warn(`Error fetching auth URL:`, e);
      opts.onConnectionError && opts.onConnectionError(e);
      return false;
    }
  }

  async authWithRedirect(opts: AuthUrlOptions): Promise<void | boolean> {
    const authUrl = await this.buildAuthUrl(opts);
    if (authUrl !== false && typeof authUrl === 'string') {
      window.location.href = authUrl;
    }

    return false;
  }

  async exchangeCodeForToken(
    authorizationCode: string,
    opts?: ExchangeCodeOptions
  ): Promise<string | boolean> {
    try {
      if (!authorizationCode) {
        console.warn("No valid authorization code detected")
        return false;
      }

      const url =
        this.serverBaseUrl +
        (opts?.exchangeCodeForTokenEndpoint ||
          DefaultEndpoints.ExchangeMailboxToken);
      const rawResp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: authorizationCode,
        }),
      });
      return await rawResp.text();
    } catch (e: any) {
      console.warn(`Error exchanging mailbox token:`, e);
      opts?.onConnectionError && opts.onConnectionError(e);
      return false;
    }
  }

  async exchangeCodeFromUrlForToken(
    opts?: ExchangeCodeOptions
  ): Promise<string | boolean> {
    const authorizationCode = new URLSearchParams(window.location.search).get(
      'code'
    );
    if (!authorizationCode) {
      console.warn("No valid authorization code detected")
      return false;
    }

    return await this.exchangeCodeForToken(authorizationCode, opts);
  }
}
