// packages/frontend/src/shared/config/schema.ts
import { z } from 'zod';

const EnvironmentSchema = z.object({
  apiBaseUrl: z.string()
    .url('API_BASE_URL must be a valid URL')
    .refine(url => !url.includes('frontend'), {
      message: 'API_BASE_URL cannot point to frontend domain'
    }),
  appBaseUrl: z.string().url('APP_URL must be a valid URL'),
  devInitData: z.string().optional(),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentSchema>;