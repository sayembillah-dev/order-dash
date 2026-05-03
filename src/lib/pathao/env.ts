/**
 * Server-only Pathao API configuration from environment.
 */

export function getPathaoBaseUrl(): string {
  const raw =
    process.env.PATHAO_BASE_URL?.trim() || "https://api-hermes.pathao.com";
  return raw.replace(/\/+$/, "");
}

export type PathaoEnvConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  storeId: number;
  username: string;
  password: string;
};

export function getPathaoEnvConfig(): PathaoEnvConfig {
  const baseUrl = getPathaoBaseUrl();
  const clientId = process.env.PATHAO_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.PATHAO_CLIENT_SECRET?.trim() ?? "";
  const storeRaw = process.env.PATHAO_STORE_ID?.trim() ?? "";
  const username = process.env.PATHAO_USERNAME?.trim() ?? "";
  const password = process.env.PATHAO_PASSWORD?.trim() ?? "";
  const storeId = Number(storeRaw);

  if (!clientId || !clientSecret) {
    throw new Error(
      "Pathao API is not configured: set PATHAO_CLIENT_ID and PATHAO_CLIENT_SECRET.",
    );
  }
  if (!Number.isFinite(storeId) || storeId <= 0) {
    throw new Error(
      "Pathao API is not configured: set PATHAO_STORE_ID to your merchant store id.",
    );
  }
  if (!username || !password) {
    throw new Error(
      "Pathao API is not configured: set PATHAO_USERNAME and PATHAO_PASSWORD for token issuance.",
    );
  }

  return {
    baseUrl,
    clientId,
    clientSecret,
    storeId,
    username,
    password,
  };
}
