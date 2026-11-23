/**
 * Centralized Feature Flags for Production Releases
 *
 * `SUBSCRIPTIONS_ENABLED`:
 * Set to `false` until live Google Play Billing / RevenueCat SKUs are configured
 * and tested. When `false`, all Premium / PRO upgrade buttons, paywall modals,
 * and restore-purchases entries are cleanly hidden to comply with Google Play's
 * Payments and Broken Functionality policies.
 */
export const SUBSCRIPTIONS_ENABLED = false;

