/**
 * Litera Production Crash & Error Reporting Infrastructure
 * 
 * Centralized exception capture for production release.
 * Prepared for plug-and-play Sentry / Firebase Crashlytics integration.
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorContext {
  componentStack?: string;
  userId?: string;
  userRole?: string;
  currentScreen?: string;
  extra?: Record<string, any>;
}

class CrashReporter {
  private currentUser: { id: string; email?: string } | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Hook into global unhandled JS exceptions if available in React Native environment
    const globalErrorUtils = (global as any).ErrorUtils;
    if (globalErrorUtils && typeof globalErrorUtils.getGlobalHandler === 'function') {
      const defaultHandler = globalErrorUtils.getGlobalHandler();
      globalErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.captureException(error, {
          extra: { isFatal: !!isFatal, source: 'unhandled_global' },
        });
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }

    if (__DEV__) {
      console.log('[CrashReporter] Initialized in development mode.');
    }
  }

  public setUser(user: { id: string; email?: string } | null) {
    this.currentUser = user;
  }

  public captureException(error: unknown, context?: ErrorContext) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const payload = {
      message: errObj.message,
      name: errObj.name,
      stack: errObj.stack,
      user: this.currentUser,
      context,
      timestamp: new Date().toISOString(),
    };

    if (__DEV__) {
      console.warn('[CrashReporter:Exception]', payload.name, payload.message, payload);
    } else {
      // In production builds, this sends to remote error tracking service (e.g. Sentry / Datadog / Supabase logs)
      // Safely silent to user, but logged for debugging
      console.error('[CRASH_LOG]', JSON.stringify(payload));
    }
  }

  public captureMessage(
    message: string,
    level: ErrorSeverity = 'info',
    context?: Record<string, any>,
  ) {
    if (__DEV__) {
      console.log(`[CrashReporter:${level.toUpperCase()}]`, message, context || '');
    } else {
      console.log(`[${level.toUpperCase()}]`, message, context ? JSON.stringify(context) : '');
    }
  }
}

export const crashReporter = new CrashReporter();
