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
  /**
   * Make a GET request
   * @param url The URL to make the GET call to
   * @param headers Additional headers to set for the call
   * @return The raw response object
   * @throws If the HTTP response code is non 2xx
   */
  static async get({ url, headers }: GetOptions): Promise<Response> {
    return await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        Accept: 'application/json',
      },
    }).then(this._handleErrorResponse);
  }

  /**
   * Make a POST request
   * @param url The URL to make the POST call to
   * @param body The JSON body to send
   * @param headers Additional headers to set for the call
   * @return The raw response object
   * @throws If the HTTP response code is non 2xx
   */
  static async post({ url, body, headers }: PostOptions): Promise<Response> {
    return await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then(this._handleErrorResponse);
  }

  /**
   * Checks if the response HTTP code is an error code, and if so, throws an error
   * @param response The raw response object
   * @throws If the HTTP response code is non 2xx
   * @private
   */
  private static _handleErrorResponse(response: Response): Response {
    if (response.status > 299) {
      response.text().then((text) => {
        return new Error(
          `Error encountered during request. Status: ${response.status}. Message: ${text}`
        );
      });
    }

    return response;
  }
}
