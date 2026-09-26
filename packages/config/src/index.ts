/**
 * @onemoon/config
 * Shared configuration constants and environment defaults
 */

export const APP_CONFIG = {
  name: 'OneMoon',
  version: '0.1.0',
  description: 'Enterprise Cybersecurity & Threat Intelligence Platform',
  defaultApiPort: 3001,
  defaultMlPort: 8000,
  defaultRedisPort: 6379,
  defaultPostgresPort: 5432,
} as const;

export type AppConfig = typeof APP_CONFIG;
