"use client"

import { useAuth } from '@/components/auth/AuthProvider';
import { TIER_CONFIG, type SubscriptionTier } from '@/lib/subscription-config';

export function useSubscriptionQuota() {
  const { user } = useAuth();
  const rawTier = (user?.subscription_tier || 'free') as SubscriptionTier;
  const tier: SubscriptionTier = TIER_CONFIG[rawTier] ? rawTier : 'free';
  const isPro = tier === 'pro';
  const config = TIER_CONFIG[tier];

  const aiCreditsLimit = user?.ai_credits_limit ?? config.aiCreditsLimit;
  const aiCreditsUsed = user?.ai_credits_used ?? 0;
  const aiCreditsRemaining = user?.ai_credits_remaining ?? Math.max(0, aiCreditsLimit - aiCreditsUsed);
  const cloudChartsLimit = user?.cloud_charts_limit ?? config.cloudChartsLimit;
  const savedChartsCount = user?.saved_charts_count ?? 0;
  const hasCredits = aiCreditsRemaining > 0;
  const hasStorageSlots = savedChartsCount < cloudChartsLimit;
  const creditsResetAt = user?.credits_reset_at;

  return {
    user,
    tier,
    isPro,
    aiCreditsLimit,
    aiCreditsUsed,
    aiCreditsRemaining,
    cloudChartsLimit,
    savedChartsCount,
    hasCredits,
    hasStorageSlots,
    creditsResetAt,
    config,
  };
}
