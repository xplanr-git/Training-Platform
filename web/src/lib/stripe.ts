import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';

let client: Stripe | null = null;

/** Lazily-constructed Stripe client (server-only). */
export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(env.stripeSecretKey(), { apiVersion: '2025-02-24.acacia' });
  }
  return client;
}

/**
 * SaaS plans. `priceId` is read from env so the same code works across Stripe
 * environments. Limits gate features/usage (see plan-limits helper).
 */
export interface Plan {
  id: string;
  name: string;
  priceEnv: string;
  activeLearnerLimit: number;
}

export const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceEnv: 'STRIPE_PRICE_STARTER', activeLearnerLimit: 50 },
  { id: 'pro', name: 'Pro', priceEnv: 'STRIPE_PRICE_PRO', activeLearnerLimit: 500 },
  { id: 'business', name: 'Business', priceEnv: 'STRIPE_PRICE_BUSINESS', activeLearnerLimit: 5000 },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceIdForPlan(planId: string): string | null {
  const plan = planById(planId);
  if (!plan) return null;
  return process.env[plan.priceEnv] ?? null;
}
