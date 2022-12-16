import { Config, AuthConfig, IDToken, ProviderList } from "./types/index";
import { Storage } from "./client/store";
import { sha256 } from "js-sha256";
import { Buffer } from "buffer";
import { v4 as uuid } from "uuid";
import { base64EncodeUrl } from "./helpers/index";


export { Config, AuthConfig };
export class NylasSessions {
  private clientId: string;
  private clientSecret?: string;
  private redirectUri: string;
  private accessType = "offline";
  private domain = "http://api.nylas.com";
  private versioned = false
  private Storage: Storage;

  private hosted = false;

  public constructor(config: Config) {
    window.addEventListener;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    if (config.domain) {
      this.domain = config.domain;
      const versionedPart = this.domain.substring(this.domain.length - 3)
      if (versionedPart.includes("/v")){
        this.versioned = true
      }
    }
    this.Storage = new Storage();
    if (config.hosted) {
      this.hosted = config.hosted;
    }
    this.codeExchange(null)
    setInterval(async () => {
      const tok = await this.Storage.getIDToken();
      if (tok) {
        const timestamp = Math.floor(Date.now() / 1000);
        if (tok.exp > timestamp) {
          const timeLeft =  tok.exp - timestamp
          if (timeLeft < 600 && timeLeft % 60 === 0) { // If 10 minutes until token expires we try a re-auth every minute
            await this.tokenExchange()
          }
        } else {
          await this.tokenExchange()
          const payload: CustomEventInit = { detail: tok };
          window.dispatchEvent(new CustomEvent("onSessionExpired", payload));
        }
      }
    }, 1000);
  }
  // Validates ID token expiration
  public async validateToken(tok: IDToken | null): Promise<boolean> {
    let token = tok
    if (tok){
      token = await this.Storage.getIDToken();
    }
    if (!token) {
      return false;
    }
    try {
      const response: any = await fetch(
        `${this.domain}/connect/tokeninfo?id_token=${token}`,
        {
          method: "GET",
        }
      );
      const responseData = await response.json();
      if (!responseData.data){

        return false
      }
      return true
    } catch (error) {
      return false
    }
  }

  // Gets domain of UAS
  public getDomain() {
    return this.domain;
  }

  // Gets auth link
  public async auth(config: AuthConfig) {
    if (this.hosted && (this.domain === window.location.origin || (this.versioned && this.domain.includes(window.location.origin)))) {
      await this.hostedSetCodeChallenge();
    }
    const url = await this.generateAuthURL(config);
    if (config.popup) {
      this.popUp(url);
      return;
    }
    return url;
  }

  // Generates auth URL
  private async generateAuthURL(config: AuthConfig): Promise<string> {
    const codeChallenge = await this.getCodeChallege();
    let url = `${this.domain}/connect/auth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&access_type=${this.accessType}&response_type=code`;
    if (codeChallenge) {
      url += `&code_challenge=${codeChallenge}&code_challenge_method=S256&options=rotate_refresh_token`;
    }
    if (config.proivder) {
      url += `&provider=${config.proivder}`;
    }
    if (config.loginHint) {
      url += `&login_hint=${config.loginHint}`;
    }
    if (config.scope) {
      url += `&scope=${config.scope.join(" ")}`;
    }
    if (config.prompt) {
      url += `&prompt=${config.prompt}`;
    }
    if (config.metadata) {
      url += `&metadata=${config.metadata}`;
    }
    if (config.state) {
      url += `&state=${config.state}`;
    }
    return url;
  }

  // Generates UUID code challenge
  private async generateCodeChallenge() {
    const codeVerifier = await this.Storage.getPKCE();
    if (codeVerifier) {
      return;
    }
    const codeChallenge = uuid();
    this.Storage.setPKCE(codeChallenge);
    return;
  }

  // Gets code challenge from URL query params
  private async hostedSetCodeChallenge() {
    if (!this.hosted) {
      throw console.error("Method only used with hosted flag enabled");
    }
    const params = new URLSearchParams(window.location.search);
    const codeChallenge = params.get("code_challenge");
    if (!codeChallenge) {
      const codeVerifier = await this.Storage.getPKCE();
      if (codeVerifier) {
        return;
      }
      console.warn(
        "Code challenge is recomended"
      );
      return
    }
    this.Storage.setPKCE(codeChallenge);
  }
// Gets code challenge from store
  private async getCodeChallege(): Promise<string> {
    if (this.hosted && (this.domain === window.location.origin || (this.versioned && this.domain.includes(window.location.origin)))) {
      const params = new URLSearchParams(window.location.search);
      const codeChallenge = params.get("code_challenge");
      if (!codeChallenge) {
        console.warn(
          "Code challenge is recomended"
        );
        return "";
      }
      return codeChallenge;
    }
    const codeVerifier = await this.Storage.getPKCE();
    if (codeVerifier) {
      const codeChallengeHashed = sha256(codeVerifier);
      let codeChallengeEncrypted =
        Buffer.from(codeChallengeHashed).toString("base64");
      codeChallengeEncrypted = base64EncodeUrl(codeChallengeEncrypted);
      return codeChallengeEncrypted;
    }
    return "";
  }
  // checks if user is logged in
  public async isLoggedIn(): Promise<boolean> {
    // if hosted identity isLoggedIn always returns false
    if (this.hosted && (this.domain === window.location.origin || (this.versioned && this.domain.includes(window.location.origin)))) {
      return false;
    }
    const tok = await this.Storage.getIDToken();
    if (tok) {
      const valid = await this.validateToken(tok)
      return valid;
    }
    await this.generateCodeChallenge();
    return false;
  }

  // Logges out user removes all instances of user
  public async logout() {
    const profile = await this.getProfile()
    this.Storage.removeIDToken();
    this.Storage.removeRefreshToken();
    this.Storage.removeAccessToken();
    this.Storage.removeScopes();
    const payload: CustomEventInit = { detail: profile };
    window.dispatchEvent(new CustomEvent("onLogoutSuccess", payload));
  }

  // Gets profile info from ID token
  public async getProfile(): Promise<IDToken | null> {
    const tok = await this.Storage.getIDToken();
    if (tok) {
      return tok;
    }
    return null;
  }
  // Gets scopes info from storage
  public async getScopes(): Promise<IDToken | null> {
    const tok = await this.Storage.getIDToken();
    if (tok) {
      return tok;
    }
    return null;
  }

  // IMAP authentication
  public async authIMAP(data: any): Promise<any> {
    const codeChallenge = await this.getCodeChallege();
    const payload = {
      imap_username: data.username,
      imap_password: data.password,
      host: data.hostIMAP,
      port: data.portIMAP,
      type: data.type,
      smtp_host: data.hostSMTP,
      smtp_port: data.portSMTP,
      redirect_uri: this.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      public_application_id: this.clientId,
    };
    const response: any = await fetch(`${this.domain}/connect/login/imap`, {
      method: "POST", // or 'PUT'
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const responseData = await response.json();
    return responseData;
  }

  // Detects email
  public async detectEmail(email: string): Promise<any> {
    const response: any = await fetch(
      `${this.versioned?this.domain:this.domain+"/connect"}/providers/detect?client_id=${this.clientId}&email=${email}`,
      {
        method: "POST", // or 'PUT'
        headers: new Headers({ "content-type": "application/json" }),
      }
    );
    const responseData = await response.json();
    return responseData.data;
  }
  // Gets app info from UAS
  public async applicationInfo(): Promise<any> {
    const response: any = await fetch(
      `${this.versioned?this.domain:this.domain+"/connect"}/applications?client_id=${this.clientId}`,
      {
        method: "GET", // or 'PUT'
        headers: new Headers({ "content-type": "application/json" }),
      }
    );
    const responseData = await response.json();
    return responseData.data;
  }

  // Gets providers form UAS
  public async getAvailableProviders(): Promise<ProviderList[] | null> {
    const response: any | undefined = await fetch(
      `${this.domain}/connect/providers/find?client_id=${this.clientId}`,
      {
        method: "GET", // or 'PUT'
        headers: new Headers({ "content-type": "application/json" }),
      }
    );
    if (response) {
      const responseData = await response.json();
      const providers = responseData.data;
      return providers;
    }
    return null;
  }
  // EVENT HOOKS
  public onLoginSuccess(callback: any): void {
    window.addEventListener("onLoginSuccess", (e) => callback(e));
  }
  public onLogoutSuccess(callback: any): void {
    window.addEventListener("onLogoutSuccess", (e) => callback(e));
  }
  public onLoginFail(callback: any): void {
    window.addEventListener("onLoginFail", (e) => callback(e));
  }
  public onTokenRefreshSuccess(callback: any): void {
    window.addEventListener("onTokenRefreshSuccess", (e) => callback(e));
  }
  public onTokenRefreshFail(callback: any): void {
    window.addEventListener("onTokenRefreshFail", (e) => callback(e));
  }
  public onSessionExpired(callback: any): void {
    window.addEventListener("onSessionExpired", (e) => callback(e));
  }
  // Exchanges code for ID token and refresh and access tokens
  public async codeExchange(search: string | null) {
    let params = new URLSearchParams(window.location.search);
    if (search) {
      params = new URLSearchParams(search);
    }
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");

    if (error && errorDescription && errorCode) {
      const payload: CustomEventInit = {
        detail: { error, errorDescription, errorCode },
      };
      window.dispatchEvent(new CustomEvent("onLoginFail", payload));
      window.history.pushState({}, document.title, window.location.pathname);
      return false;
    }
    if (!code) {
      return false;
    }
    // If popup window stop internal code exchange
    if (window.opener && window.name === "uas-popup") {
      return false;
    }
    // Get PKCE code_challenge from local storage
    const codeVerifier = await this.Storage.getPKCE();
    if (!codeVerifier) {
      return false;
    }
    // Prepare request
    try {
      const payload = {
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code: code,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      };
      const response: any = await fetch(`${this.domain}/connect/token`, {
        method: "POST", // or 'PUT'
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();

      // Parse response
      // Store ID token
      if (responseData) {
        if (responseData.error){
          const payload: CustomEventInit = { detail: responseData };
          window.dispatchEvent(new CustomEvent("onLoginFail", payload));
          return true;
        }
        if (responseData.id_token) {
          this.Storage.setIDToken(responseData.id_token);
        } 
        if (responseData.refresh_token) {
          this.Storage.setRefreshToken(responseData.refresh_token);
        } 
        if (responseData.access_token) {
          this.Storage.setAccessToken(responseData.access_token);
        }
        if (responseData.scope) {
          this.Storage.setScopes(responseData.scope);
        }
        if (state){
          responseData.state = state
        }
        const payload: CustomEventInit = { detail: responseData };
        window.dispatchEvent(new CustomEvent("onLoginSuccess", payload));
        window.history.pushState({}, document.title, window.location.pathname);
      }
      this.Storage.removePKCE();
      return true;
      // Remove PKCE code_challenge from local storage
    } catch (error: any) {
      const payload: CustomEventInit = { detail: error };
      window.dispatchEvent(new CustomEvent("onLoginFail", payload));
      window.history.pushState({}, document.title, window.location.pathname);
      return false;
    }
  }

  // Token Exchange for session  maintenece
  public async tokenExchange() {
    const refresh = await this.Storage.getRefreshToken();
    try {
      const payload = {
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        refresh_token: refresh,
        grant_type: "refresh_token",
      };
      const response: any = await fetch(`${this.domain}/connect/token`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();

      // Parse response
      // Store ID token
      if (responseData) {
        if (responseData.error){
          const payload: CustomEventInit = { detail: responseData };
          window.dispatchEvent(new CustomEvent("onTokenRefreshFail", payload));
          return true;
        }
        if (responseData.id_token) {
          this.Storage.setIDToken(responseData.id_token);
        } 
        if (responseData.refresh_token) {
          this.Storage.setRefreshToken(responseData.refresh_token);
        } 
        if (responseData.access_token) {
          this.Storage.setAccessToken(responseData.access_token);
        } 
        const payload: CustomEventInit = { detail: responseData };
        window.dispatchEvent(new CustomEvent("onTokenRefreshSuccess", payload));
        return true;
      }
      // Remove PKCE code_challenge from local storage
      this.Storage.removePKCE();
    } catch (error: any) {
      const payload: CustomEventInit = { detail: error };
      window.dispatchEvent(new CustomEvent("onTokenRefreshFail", payload));
      return false;
    }
  }

  // Regulates POPUP behaivior
  public async popUp(url: string) {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    const title = `uas-popup`;
    const popupURL = url;
    const externalPopup = window.open(
      popupURL,
      title,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    if (!externalPopup) {
      return;
    }

    const timer = setInterval(async () => {
      if (externalPopup.closed) {
        const payload: CustomEventInit = {
          detail: { error_description: "OAuth provider window closed" },
        };
        window.dispatchEvent(new CustomEvent("onLoginFail", payload));
        timer && clearInterval(timer);
        return;
      }
      try {
        const currentUrl = externalPopup.location.href.split("?");
        if (!currentUrl[0]) {
          return;
        }
        if (currentUrl[0] === this.redirectUri && currentUrl.length > 1) {
          const success = await this.codeExchange(
            externalPopup.location.search
          );
          externalPopup.close();
          if (success) {
            location.reload();
          }
          timer && clearInterval(timer);
          return;
        }
      } catch (error) {
        return;
      }
    }, 500);
  }
}
