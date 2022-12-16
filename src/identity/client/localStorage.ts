import { Store } from "../types/index";

class LocalStorge implements Store {
  public get(key: string): Promise<null | string> {
    return new Promise((res) => {
      const record = window.localStorage.getItem(key);
      res(record);
    });
  }
  public async remove(key: string): Promise<null> {
    window.localStorage.removeItem(key);
    return new Promise((res) => {
      res(null);
    });
  }
  public set(key: string, value: string): Promise<null | string> {
    window.localStorage.setItem(key, value);
    return new Promise((res) => {
      res(null);
    });
  }
}
export default LocalStorge;
