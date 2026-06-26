export function base64EncodeUrl(str: string): string {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
