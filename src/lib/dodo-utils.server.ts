import 'server-only';

import { getRequiredEnv } from '@/lib/env-utils.server';

export type DodoEnvironment = 'live_mode' | 'test_mode';

export const DODO_ENVIRONMENT: DodoEnvironment =
  process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';

export const DODO_API_URL =
  DODO_ENVIRONMENT === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';

export const DODO_API_KEY = getRequiredEnv('DODO_PAYMENTS_API_KEY');

export const DODO_RETURN_URL =
  `${getRequiredEnv('NEXT_PUBLIC_APP_URL')}/checkout/return`;
