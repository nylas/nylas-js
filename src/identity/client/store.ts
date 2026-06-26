import { IDToken, Store } from "../types/index";
import jwtDecode from "jwt-decode";
import { Buffer } from "buffer";

import local from "./localStorage";

const PKCE_KEY = "pkce"; // eslint-disable-line no-use-before-define
const IDTOKEN_KEY = "id_token"; // eslint-disable-line no-use-before-define
const SCOPES_KEY = "scopes"; // eslint-disable-line no-use-before-define
const REFRESH_TOKEN_KEY = "ref_token"; // eslint-disable-line no-use-before-define
const ACCESS_TOKEN_KEY = "acc_token"; // eslint-disable-line no-use-before-define

export class Storage {
  private Storage: Store = new local();
  public constructor(store?: Store) {
    // if window object not present set up
    if (!window) {
      if (store) {
        this.Storage = store;
        return;
      }
      throw new Error("No storage set for session handling");
    }
  }
  public setPKCE(value: string) {
    const encrypt = Buffer.from(value);
    this.Storage.set(PKCE_KEY, encrypt.toString("base64"));
  }
  public async getPKCE(): Promise<string | null> {
    try {
      const pkce = await this.Storage.get(PKCE_KEY);
      if (pkce) {
        const b = Buffer.from(pkce, "base64");
        return b.toString("utf8");
      }
    } catch (error) {
      return null;
    }
    return null;
  }
  public removePKCE() {
    this.Storage.remove(PKCE_KEY);
  }
  public setRefreshToken(token: string) {
    this.Storage.set(REFRESH_TOKEN_KEY, token);
  }
  public async getRefreshToken(): Promise<string | null> {
    const tokString = await this.Storage.get(REFRESH_TOKEN_KEY);
    return tokString;
  }
  public removeRefreshToken() {
    this.Storage.remove(REFRESH_TOKEN_KEY);
  }
  public setAccessToken(token: string) {
    this.Storage.set(ACCESS_TOKEN_KEY, token);
  }
  public async getAccessToken(): Promise<string | null> {
    const tokString = await this.Storage.get(ACCESS_TOKEN_KEY);
    return tokString;
  }
  public removeAccessToken() {
    this.Storage.remove(ACCESS_TOKEN_KEY);
  }
  public setIDToken(token: string) {
    this.Storage.set(IDTOKEN_KEY, token);
  }
  public async getIDToken(): Promise<IDToken | null> {
    const tokString = await this.Storage.get(IDTOKEN_KEY);
    if (tokString) {
      const token: IDToken = jwtDecode(tokString);
      return token;
    }
    return null;
  }
  public removeIDToken() {
    this.Storage.remove(IDTOKEN_KEY);
  }
  public setScopes(token: string) {
    this.Storage.set(SCOPES_KEY, token);
  }
  public async getScopes(): Promise<string | null> {
    const scopes = await this.Storage.get(SCOPES_KEY);
    return scopes;
  }
  public removeScopes() {
    this.Storage.remove(SCOPES_KEY);
  }
}
