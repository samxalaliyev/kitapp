/**
 * Litera Production Cloud Crash & Error Reporting Infrastructure
 * 
 * Lightweight, zero-native-dependency, 100% crash-proof.
 * Captures all unhandled JavaScript exceptions and dispatches to remote cloud logging.
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorContext {
  componentStack?: string;
  userId?: string;
  userRole?: string;
  currentScreen?: string;
  extra?: Record<string, any>;
}

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

class CrashReporter {
  private currentUser: { id: string; email?: string } | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Hook into global unhandled JS exceptions in React Native environment
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
      console.log('[CrashReporter] Initialized in resilient cloud-ready mode.');
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
      console.warn('[CrashReporter:Exception]', payload.name, payload.message);
    } else {
      console.error('[CRASH_LOG]', JSON.stringify(payload));
    }

    // If Sentry DSN is configured, send via Sentry REST API asynchronously without native bloat
    if (SENTRY_DSN) {
      this.sendToSentry(errObj, payload).catch(() => {});
    }
  }

  private async sendToSentry(error: Error, payload: any) {
    try {
      // Parse DSN: https://<key>@<host>/<projectId>
      const match = SENTRY_DSN.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
      if (!match) return;
      const [, key, host, projectId] = match;
      const endpoint = `https://${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`;

      const event = {
        event_id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        platform: 'javascript',
        exception: {
          values: [
            {
              type: error.name || 'Error',
              value: error.message || 'Unknown error',
              stacktrace: {
                frames: (error.stack || '')
                  .split('\n')
                  .slice(1, 15)
                  .map((line) => ({ filename: line.trim(), function: '?' })),
              },
            },
          ],
        },
        user: this.currentUser || undefined,
        extra: payload.context?.extra,
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {});
    } catch {
      // Completely silent failover
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
