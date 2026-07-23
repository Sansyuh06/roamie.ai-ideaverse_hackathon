import { fromIni } from "@aws-sdk/credential-providers";

/**
 * Returns AWS credential config for SDK clients.
 * - If AWS_ACCESS_KEY_ID env var is set (CI/Docker/deployment), returns undefined
 *   so the SDK uses its default credential chain (env vars, IAM role, etc.)
 * - Otherwise (local dev), uses the named profile from ~/.aws/credentials.
 */
export function getAwsCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // Credentials available via env — let SDK pick them up automatically
    return undefined;
  }
  const profile = process.env.AWS_PROFILE || "default";
  try {
    return fromIni({ profile });
  } catch {
    // No profile available — fall back to default chain
    return undefined;
  }
}

export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
