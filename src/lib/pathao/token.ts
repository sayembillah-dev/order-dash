import { connectDB } from "@/lib/mongodb";
import { PathaoTokenState } from "@/lib/models/PathaoTokenState";
import { getPathaoEnvConfig } from "@/lib/pathao/env";

const TOKEN_URL_PATH = "/aladdin/api/v1/issue-token";

type IssueTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  message?: string;
};

function parseIssueTokenJson(text: string): IssueTokenResponse {
  try {
    return JSON.parse(text) as IssueTokenResponse;
  } catch {
    return {};
  }
}

async function postIssueToken(
  baseUrl: string,
  body: Record<string, string>,
): Promise<IssueTokenResponse> {
  const res = await fetch(`${baseUrl}${TOKEN_URL_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const data = parseIssueTokenJson(text);

  if (!res.ok) {
    const msg =
      data.message ||
      (text.trim().slice(0, 200) || `Pathao token error (${res.status})`);
    throw new Error(msg);
  }

  return data;
}

async function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSec: number,
): Promise<void> {
  await connectDB();
  const skewMs = 60_000;
  const accessExpiresAt =
    Date.now() + Math.max(0, expiresInSec) * 1000 - skewMs;

  await PathaoTokenState.findByIdAndUpdate(
    "singleton",
    {
      $set: {
        refreshToken,
        accessToken,
        accessExpiresAt,
      },
    },
    { upsert: true },
  );
}

async function issuePasswordGrant(): Promise<void> {
  const cfg = getPathaoEnvConfig();
  const data = await postIssueToken(cfg.baseUrl, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "password",
    username: cfg.username,
    password: cfg.password,
  });

  const access = data.access_token;
  const refresh = data.refresh_token;
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 0;

  if (!access || !refresh) {
    throw new Error(
      data.message ||
        "Pathao token response missing access_token or refresh_token.",
    );
  }

  await saveTokens(access, refresh, expiresIn || 3600);
}

async function issueRefreshGrant(refreshToken: string): Promise<void> {
  const cfg = getPathaoEnvConfig();
  const data = await postIssueToken(cfg.baseUrl, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const access = data.access_token;
  const refresh = data.refresh_token ?? refreshToken;
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 0;

  if (!access) {
    throw new Error(data.message || "Pathao refresh response missing access_token.");
  }

  await saveTokens(access, refresh, expiresIn || 3600);
}

/**
 * Returns a valid Bearer access token, refreshing or re-authenticating as needed.
 */
export async function getPathaoAccessToken(): Promise<string> {
  await connectDB();

  const doc = await PathaoTokenState.findById("singleton").lean();

  const now = Date.now();

  if (
    doc &&
    doc.accessToken &&
    typeof doc.accessExpiresAt === "number" &&
    doc.accessExpiresAt > now
  ) {
    return doc.accessToken;
  }

  if (doc?.refreshToken) {
    try {
      await issueRefreshGrant(doc.refreshToken);
    } catch {
      await issuePasswordGrant();
    }
  } else {
    await issuePasswordGrant();
  }

  const fresh = await PathaoTokenState.findById("singleton").lean();
  if (!fresh?.accessToken) {
    throw new Error("Pathao token state missing after issuance.");
  }
  return fresh.accessToken;
}
