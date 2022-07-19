export interface GetOptions {
  url: string;
  headers?: Record<string, string>;
}

export interface PostOptions {
  url: string;
  body: Record<string, string>;
  headers?: Record<string, string>;
}

export default class Request {
  static async get({ url, headers }: GetOptions): Promise<Response> {
    return await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        Accept: 'application/json',
      },
    }).then((response) => {
      this._handleErrorResponse(response);

      return response;
    });
  }

  static async post({ url, body, headers }: PostOptions): Promise<Response> {
    return await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then((response) => {
      this._handleErrorResponse(response);

      return response;
    });
  }

  private static _handleErrorResponse(response: Response): void {
    if (response.status > 299) {
      response.text().then((text) => {
        return new Error(
          `Error encountered during request. Status: ${response.status}. Message: ${text}`
        );
      });
    }
  }
}
