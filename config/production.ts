/**
 * Production Configuration
 * Contains production-specific settings and optimizations
 */

export const productionConfig = {
  // Enable/disable logging in production
  enableLogging: false,

  // API timeouts (in milliseconds)
  apiTimeout: 30000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // Cache configuration
  cacheEnabled: true,
  cacheDuration: 3600000, // 1 hour in ms

  // Performance monitoring
  enablePerformanceMonitoring: true,

  // Error tracking (integrate with services like Sentry)
  errorTrackingEnabled: false, // Set to true when Sentry is configured

  // Feature flags
  features: {
    enableAnalytics: false, // Set to true when analytics is configured
    enableCrashReporting: false, // Set to true when crash reporting is configured
    enableOfflineMode: false,
  },

  // Security settings
  security: {
    enforceHttps: true,
    validateCertificates: true,
  },

  // App metadata
  app: {
    name: "TogetherApp",
    version: "1.0.0",
    buildNumber: "1",
  },
};

// Development configuration override
export const developmentConfig = {
  ...productionConfig,
  enableLogging: true,
  errorTrackingEnabled: false,
  features: {
    ...productionConfig.features,
    enableAnalytics: false,
    enableCrashReporting: false,
  },
};

// Get configuration based on environment
export const getConfig = () => {
  return __DEV__ ? developmentConfig : productionConfig;
};
