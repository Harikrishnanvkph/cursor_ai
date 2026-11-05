/**
 * Centralized Credit Packs & Quota Configuration
 * Single source of truth for AI Credits | Cloud Credits packs and Free baseline.
 * Mirrors server/src/services/subscriptionService.js
 */

export type SubscriptionTier = 'free' | 'lite' | 'pro' | 'enterprise';
export type CreditPackId = 'ai_lite' | 'ai_pro' | 'cloud_lite' | 'cloud_pro';
export type CreditCategory = 'ai' | 'cloud';

export interface CreditPackDefinition {
  id: CreditPackId;
  category: CreditCategory;
  name: string;
  userTitle: string;
  priceUsd: number;
  priceInr?: number;
  headlineGrant: string;
  subHeadline: string;
  ctaLabel: string;
  badge?: string;
  popular?: boolean;
  aiCredits?: number;
  cloudCredits?: number;
  firstPaymentCloudBonus?: number;
  validityLabel?: string;
  validityMonths?: number | null;
  features: {
    text: string;
    highlight?: boolean;
    highlightWord?: string;
    firstPurchaseOnly?: boolean;
  }[];
}

export interface FreeCardDefinition {
  category: CreditCategory;
  userTitle: string;
  priceUsd: number;
  headlineGrant: string;
  badge: string;
  features: {
    text: string;
  }[];
}

export const FREE_BASELINE_CONFIG = {
  monthlyFreeAiCredits: 10,
  permanentCloudCredits: 5,
  firstAiPurchaseCloudBonus: 5,
  summaryText: 'Every account includes 10 Free AI Credits / month + 5 Permanent Cloud Save Credits (Never Expire).',
};

export const FREE_CARD_BY_CATEGORY: Record<CreditCategory, FreeCardDefinition> = {
  ai: {
    category: 'ai',
    userTitle: 'Free',
    priceUsd: 0,
    headlineGrant: '10 AI credits / month',
    badge: 'Free Forever',
    features: [
      { text: 'Resets every month' },
      { text: 'Free Advanced Editor' },
      { text: '5 cloud save credits (Never Expire)' },
      { text: 'Free Share, Export' },
    ],
  },
  cloud: {
    category: 'cloud',
    userTitle: 'Free',
    priceUsd: 0,
    headlineGrant: '5 cloud save credits',
    badge: 'Free Forever',
    features: [
      { text: 'Never Expire' },
      { text: '10 Free AI credits / month' },
      { text: 'Free Advanced Editor' },
      { text: 'Free Share, Export' },
    ],
  },
};

export const AI_CREDIT_PACKS: CreditPackDefinition[] = [
  {
    id: 'ai_lite',
    category: 'ai',
    name: 'Lite',
    userTitle: 'Lite User',
    priceUsd: 2,
    priceInr: 99,
    headlineGrant: '+15 AI credits',
    subHeadline: 'One-time payment',
    ctaLabel: 'Buy Lite',
    badge: 'Starter',
    aiCredits: 15,
    firstPaymentCloudBonus: 5,
    validityLabel: 'Never Expire',
    validityMonths: null,
    features: [
      { text: 'Everything in Free', highlight: true, highlightWord: 'Free' },
      { text: 'Credits Never Expire', highlight: true, highlightWord: 'Never Expire' },
      {
        text: '+5 cloud save credits (on first payment only - Never Expire)',
        firstPurchaseOnly: true,
      },
      { text: 'Faster Customer Support' },
    ],
  },
  {
    id: 'ai_pro',
    category: 'ai',
    name: 'Pro',
    userTitle: 'Pro User',
    priceUsd: 5,
    priceInr: 249,
    headlineGrant: '+60 AI credits',
    subHeadline: 'One-time payment',
    ctaLabel: 'Buy Pro',
    badge: 'Most Popular',
    popular: true,
    aiCredits: 60,
    firstPaymentCloudBonus: 5,
    validityLabel: 'Never Expire',
    validityMonths: null,
    features: [
      { text: 'Everything in Free', highlight: true, highlightWord: 'Free' },
      { text: 'Credits Never Expire', highlight: true, highlightWord: 'Never Expire' },
      {
        text: '+5 cloud save credits (on first payment only - Never Expire)',
        firstPurchaseOnly: true,
      },
      { text: 'Faster Customer Support' },
    ],
  },
];

export const CLOUD_CREDIT_PACKS: CreditPackDefinition[] = [
  {
    id: 'cloud_lite',
    category: 'cloud',
    name: 'Lite',
    userTitle: 'Lite User',
    priceUsd: 2,
    priceInr: 99,
    headlineGrant: '+10 cloud save credits',
    subHeadline: 'One-time payment',
    ctaLabel: 'Buy Lite',
    badge: 'Starter',
    cloudCredits: 10,
    validityLabel: 'for 2 months',
    validityMonths: 2,
    features: [
      { text: 'Everything in Free', highlight: true, highlightWord: 'Free' },
      { text: 'Valid for 2 months', highlight: true, highlightWord: '2 months' },
      { text: 'Stacks with your permanent cloud credits' },
      { text: 'Faster Customer Support' },
    ],
  },
  {
    id: 'cloud_pro',
    category: 'cloud',
    name: 'Pro',
    userTitle: 'Pro User',
    priceUsd: 5,
    priceInr: 249,
    headlineGrant: '+15 cloud save credits',
    subHeadline: 'One-time payment',
    ctaLabel: 'Buy Pro',
    badge: 'Most Popular',
    popular: true,
    cloudCredits: 15,
    validityLabel: 'for 6 months',
    validityMonths: 6,
    features: [
      { text: 'Everything in Free', highlight: true, highlightWord: 'Free' },
      { text: 'Valid for 6 months', highlight: true, highlightWord: '6 months' },
      { text: 'Stacks with your permanent cloud credits' },
      { text: 'Faster Customer Support' },
    ],
  },
];

export const ALL_CREDIT_PACKS: Record<CreditPackId, CreditPackDefinition> = {
  ai_lite: AI_CREDIT_PACKS[0],
  ai_pro: AI_CREDIT_PACKS[1],
  cloud_lite: CLOUD_CREDIT_PACKS[0],
  cloud_pro: CLOUD_CREDIT_PACKS[1],
};

export const CUSTOM_REQUEST_CONFIG = {
  title: 'Custom Request',
  contactLabel: 'Contact',
  email: 'sales@aichartor.com',
  description: 'Need custom volume credits, team seats, or tailored enterprise solutions?',
};

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
    cloudChartsLimit: 5,
    description: '10 Free AI Credits every month and 5 Permanent Cloud Save Credits.',
    badge: 'Free Baseline',
    features: [
      '10 Free AI credits per month',
      '5 Permanent cloud save credits (Never Expire)',
      'Free Advanced Editor',
      'Free Share, Export',
    ],
  },
  lite: {
    id: 'lite',
    name: 'Lite',
    priceMonthly: 2,
    priceYearly: 2,
    aiCreditsLimit: 25,
    cloudChartsLimit: 10,
    description: 'Lite credit pack supporter.',
    badge: 'Lite',
    features: [
      '+15 AI credits (Never Expire)',
      '+5 Cloud save credits (on first payment only - Never Expire)',
      'Free Advanced Editor',
      'Free Share, Export',
      'Faster Customer Support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 5,
    priceYearly: 5,
    aiCreditsLimit: 70,
    cloudChartsLimit: 10,
    description: 'Pro credit pack supporter.',
    badge: 'Pro',
    features: [
      '+60 AI credits (Never Expire)',
      '+5 Cloud save credits (on first payment only - Never Expire)',
      'Free Advanced Editor',
      'Free Share, Export',
      'Faster Customer Support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Custom',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    aiCreditsLimit: 1000,
    cloudChartsLimit: 1000,
    description: 'Custom volume credits and tailored plans via sales@aichartor.com.',
    badge: 'Custom',
    features: ['Custom AI & Cloud credit packs', 'Dedicated support'],
  },
};
