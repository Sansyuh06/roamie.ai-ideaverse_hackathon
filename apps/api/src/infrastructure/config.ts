import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Try loading from api root first, then monorepo root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const configSchema = z.object({
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  ANTHROPIC_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  AWS_REGION: z.string().default('us-east-1'),
  USE_BEDROCK: z.string().default('true'),
  S3_BUCKET: z.string().default(''),
});

function loadConfig() {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Configuration validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;

// Startup warnings for optional-but-important config
if (!config.S3_BUCKET) {
  console.warn('⚠️  S3_BUCKET not set — receipt image uploads will be skipped.');
}
if (config.USE_BEDROCK === 'true' && !process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
  console.warn('⚠️  USE_BEDROCK=true but no AWS credentials found — will fall back to Ollama.');
}
