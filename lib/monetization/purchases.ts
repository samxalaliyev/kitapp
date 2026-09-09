/**
 * Litera Google Play Billing & In-App Purchases (RevenueCat) Wrapper
 * 
 * Complies with Google Play Developer Policy for digital subscriptions:
 * - Direct Google Play Billing integration via RevenueCat
 * - Full "Restore Purchases" compliance for users switching devices
 * - Fallback simulation mode for Expo Go / web / local development
 */

import { Platform } from 'react-native';
import { crashReporter } from '@/lib/crash-reporter';
import type { SubscriptionPlan } from '@/lib/permissions/rbac';

export const PRODUCT_IDS = {
  MONTHLY: 'litera_premium_monthly',
  YEARLY: 'litera_premium_yearly',
} as const;

export const ENTITLEMENT_ID = 'premium';

export interface PurchaseResult {
  success: boolean;
  plan?: SubscriptionPlan;
  userCancelled?: boolean;
  errorMessage?: string;
}

export interface RestoreResult {
  success: boolean;
  hasActiveSubscription: boolean;
  activePlan?: SubscriptionPlan;
  errorMessage?: string;
}

// Safely attempt to load react-native-purchases if installed and running natively
let PurchasesSDK: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require('react-native-purchases');
  PurchasesSDK = module.default || module;
} catch (e) {
  // Running in Expo Go, web, or testing environment without native purchases binary
  PurchasesSDK = null;
}

class PurchasesService {
  private isConfigured = false;
  private currentUserId: string | null = null;

  /**
   * Initializes RevenueCat / Google Play Billing.
   * Call once during app launch or after user authentication.
   */
  public async init(userId?: string) {
    if (this.isConfigured && this.currentUserId === userId) return;

    this.currentUserId = userId || null;

    if (!PurchasesSDK) {
      if (__DEV__) {
        console.log('[PurchasesService] Native Purchases SDK not available. Using development simulator mode.');
      }
      this.isConfigured = true;
      return;
    }

    try {
      const apiKey =
        Platform.OS === 'android'
          ? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;

      if (!apiKey) {
        if (__DEV__) {
          console.warn('[PurchasesService] EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY not configured. Falling back to development mode.');
        }
        this.isConfigured = true;
        return;
      }

      await PurchasesSDK.configure({
        apiKey,
        appUserID: userId || undefined,
      });

      this.isConfigured = true;
      if (__DEV__) {
        console.log('[PurchasesService] Initialized with Google Play Billing.');
      }
    } catch (error) {
      crashReporter.captureException(error, { extra: { context: 'PurchasesService.init' } });
      this.isConfigured = true;
    }
  }

  /**
   * Triggers the official Google Play Billing sheet for the chosen subscription plan.
   */
  public async purchase(plan: SubscriptionPlan): Promise<PurchaseResult> {
    if (plan === 'free') {
      return { success: true, plan: 'free' };
    }

    if (!this.isConfigured) {
      await this.init(this.currentUserId || undefined);
    }

    const targetProductId = plan === 'premium_yearly' ? PRODUCT_IDS.YEARLY : PRODUCT_IDS.MONTHLY;

    // Real Native RevenueCat Execution
    if (PurchasesSDK && process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY) {
      try {
        const offerings = await PurchasesSDK.getOfferings();
        let packageToPurchase = null;

        if (offerings.current && offerings.current.availablePackages) {
          packageToPurchase = offerings.current.availablePackages.find(
            (p: any) => p.product.identifier === targetProductId || (plan === 'premium_yearly' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY')
          );
        }

        let purchaseInfo: any;
        if (packageToPurchase) {
          purchaseInfo = await PurchasesSDK.purchasePackage(packageToPurchase);
        } else {
          // Fallback to direct product purchase if package not grouped in default offering
          purchaseInfo = await PurchasesSDK.purchaseProduct(targetProductId);
        }

        const entitlements = purchaseInfo?.customerInfo?.entitlements?.active;
        const isEntitled = !!entitlements && Object.keys(entitlements).length > 0;

        if (isEntitled) {
          return { success: true, plan };
        } else {
          return { success: false, errorMessage: 'Subscription entitlement could not be verified.' };
        }
      } catch (error: any) {
        if (error.userCancelled) {
          return { success: false, userCancelled: true };
        }
        crashReporter.captureException(error, { extra: { context: 'PurchasesService.purchase', plan } });
        return { success: false, errorMessage: error.message || 'Payment failed' };
      }
    }

    // Development / Simulator Fallback Mode (e.g. testing in Expo Go)
    if (__DEV__) {
      console.log(`[PurchasesService:DEV] Simulating Google Play purchase for plan: ${plan}`);
    }
    await new Promise((res) => setTimeout(res, 600));
    return { success: true, plan };
  }

  /**
   * Restores user's existing Google Play subscriptions across device switches or reinstallations.
   * Required by Google Play and Apple App Store review guidelines.
   */
  public async restore(): Promise<RestoreResult> {
    if (!this.isConfigured) {
      await this.init(this.currentUserId || undefined);
    }

    if (PurchasesSDK && process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY) {
      try {
        const customerInfo = await PurchasesSDK.restorePurchases();
        const activeEntitlements = customerInfo?.entitlements?.active || {};
        const activeKeys = Object.keys(activeEntitlements);

        if (activeKeys.length > 0) {
          const firstEntitlement = activeEntitlements[activeKeys[0]];
          const productId = firstEntitlement.productIdentifier;
          const plan: SubscriptionPlan =
            productId === PRODUCT_IDS.MONTHLY ? 'premium_monthly' : 'premium_yearly';

          return {
            success: true,
            hasActiveSubscription: true,
            activePlan: plan,
          };
        }

        return {
          success: true,
          hasActiveSubscription: false,
        };
      } catch (error: any) {
        crashReporter.captureException(error, { extra: { context: 'PurchasesService.restore' } });
        return {
          success: false,
          hasActiveSubscription: false,
          errorMessage: error.message || 'Failed to restore purchases',
        };
      }
    }

    // Development / Simulator Mode
    if (__DEV__) {
      console.log('[PurchasesService:DEV] Simulated restore completed.');
    }
    await new Promise((res) => setTimeout(res, 500));
    return {
      success: true,
      hasActiveSubscription: false,
    };
  }

  /**
   * Checks current subscription entitlement status on Google Play.
   */
  public async checkStatus(): Promise<{ isPremium: boolean; plan: SubscriptionPlan }> {
    if (!PurchasesSDK || !process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY) {
      return { isPremium: false, plan: 'free' };
    }

    try {
      const customerInfo = await PurchasesSDK.getCustomerInfo();
      const active = customerInfo?.entitlements?.active || {};
      const activeKeys = Object.keys(active);

      if (activeKeys.length > 0) {
        const productId = active[activeKeys[0]].productIdentifier;
        return {
          isPremium: true,
          plan: productId === PRODUCT_IDS.MONTHLY ? 'premium_monthly' : 'premium_yearly',
        };
      }
    } catch (e) {
      // Ignore network errors on passive check
    }

    return { isPremium: false, plan: 'free' };
  }
}

export const purchasesService = new PurchasesService();
