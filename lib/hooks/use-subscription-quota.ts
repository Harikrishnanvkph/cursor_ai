"use client"

import { useAuth } from '@/components/auth/AuthProvider';
import {
  TIER_CONFIG,
  FREE_BASELINE_CONFIG,
  type SubscriptionTier,
} from '@/lib/subscription-config';

export function useSubscriptionQuota() {
  const { user } = useAuth();
  const rawTier = (user?.subscription_tier || 'free') as SubscriptionTier;
  const tier: SubscriptionTier = TIER_CONFIG[rawTier] ? rawTier : 'free';
  const isPro = tier === 'pro';
  const isLite = tier === 'lite';
  const isPaid = isPro || isLite;
  const config = TIER_CONFIG[tier];

  // Monthly Free AI Credits (10/month)
  const freeAiCreditsLimit =
    user?.free_ai_credits_limit ?? FREE_BASELINE_CONFIG.monthlyFreeAiCredits;
  const freeAiCreditsUsed = user?.free_ai_credits_used ?? user?.ai_credits_used ?? 0;
  const freeAiCreditsRemaining =
    user?.free_ai_credits_remaining ?? Math.max(0, freeAiCreditsLimit - freeAiCreditsUsed);

  // Never-Expiring Purchased AI Credits
  const purchasedAiCredits = user?.purchased_ai_credits ?? 0;

  // Combined AI Credit Totals
  const currentTotalRemaining = freeAiCreditsRemaining + purchasedAiCredits;
  const aiCreditsLimit =
    user?.ai_credits_limit && user.ai_credits_limit >= currentTotalRemaining
      ? user.ai_credits_limit
      : Math.max(config.aiCreditsLimit, freeAiCreditsLimit + purchasedAiCredits);
  const aiCreditsUsed = freeAiCreditsUsed;
  const aiCreditsRemaining =
    user?.ai_credits_remaining ?? currentTotalRemaining;

  // Cloud Save Credits (Permanent + Active Expiring Grants)
  const permanentCloudCredits =
    user?.permanent_cloud_credits ?? FREE_BASELINE_CONFIG.permanentCloudCredits;
  const bonusCloudCredits = user?.bonus_cloud_credits ?? 0;
  const activeCloudGrants = user?.active_cloud_grants ?? [];
  const cloudChartsLimit =
    user?.cloud_charts_limit ?? permanentCloudCredits + bonusCloudCredits;
  const savedChartsCount = user?.saved_charts_count ?? 0;
  const cloudChartsRemaining =
    user?.cloud_charts_remaining ?? Math.max(0, cloudChartsLimit - savedChartsCount);

  const firstAiBonusClaimed = Boolean(user?.first_ai_bonus_claimed);
  const hasCredits = aiCreditsRemaining > 0;
  const hasStorageSlots = savedChartsCount < cloudChartsLimit;
  const creditsResetAt = user?.credits_reset_at;

  return {
    user,
    tier,
    isPro,
    isLite,
    isPaid,
    // Monthly Free AI breakdown
    freeAiCreditsLimit,
    freeAiCreditsUsed,
    freeAiCreditsRemaining,
    // Purchased AI breakdown
    purchasedAiCredits,
    // Total AI
    aiCreditsLimit,
    aiCreditsUsed,
    aiCreditsRemaining,
    // Cloud breakdown
    permanentCloudCredits,
    bonusCloudCredits,
    activeCloudGrants,
    cloudChartsLimit,
    savedChartsCount,
    cloudChartsRemaining,
    firstAiBonusClaimed,
    hasCredits,
    hasStorageSlots,
    creditsResetAt,
    config,
  };
}
