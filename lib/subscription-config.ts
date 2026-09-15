/**
 * Centralized Subscription Configuration
 * Single source of truth for pricing, limits, and tier metadata.
 * Mirrors server/src/services/subscriptionService.js TIER_CONFIG.
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface TierDefinition {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number | string;
  priceYearly: number | string;
  aiCreditsLimit: number;
  cloudChartsLimit: number;
  description: string;
  badge?: string;
  features: string[];
}

export const TIER_CONFIG: Record<SubscriptionTier, TierDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    aiCreditsLimit: 10,
    cloudChartsLimit: 10,
    description: 'Essential AI charting and complete, unrestricted access to our Advanced Editor.',
    badge: 'Free Forever',
    features: [
      'Complete Access to Advanced Editor page/tool',
      '10 AI credits per month',
      'Maximum 10 cloud saving',
      'Crisp client-side PNG exports',
      'Standard formatting templates',
      'Full vector canvas & decoration tools',
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 5,
    priceYearly: 4, // $4/mo billed annually ($48/yr)
    aiCreditsLimit: 50,
    cloudChartsLimit: 30,
    description: 'Best for data analysts, professional designers, and creators who need higher capacity.',
    badge: 'Most Popular',
    features: [
      'Complete Access to Advanced Editor page/tool',
      '50 AI credits per month',
      'Maximum 30 cloud saving',
      'High-fidelity Vector SVG & 4K PNG exports',
      'Tiptap rich text surrounding HTML layouts',
      'Multi-Zone Infographic Templates & Custom Presets',
      'Priority AI prompt processing pipeline',
      'Automated Supabase database sync',
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    aiCreditsLimit: 1000,
    cloudChartsLimit: 1000,
    description: 'Tailored visual assets, robust team workspaces, and custom integrations.',
    badge: 'Custom Scale',
    features: [
      'Everything in Pro Plan',
      'Unlimited saved active charts & drafts',
      'Custom team workspaces & permissions',
      'Enterprise SSO, SAML & Okta authentication',
      'Dedicated account developer specialist',
      '99.9% uptime SLA commitments',
    ]
  }
};
