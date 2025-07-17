declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface EnhancedConversionData {
  email?: string;
  phone?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface ConversionEventData {
  send_to: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
  user_data?: EnhancedConversionData;
}

/**
 * Track Google Ads conversion with Enhanced Conversions
 * @param eventName - The conversion event name (e.g., 'conversion', 'sign_up', 'begin_checkout')
 * @param data - The conversion data including user_data for Enhanced Conversions
 */
export const trackGoogleAdsConversion = (
  eventName: string,
  data: ConversionEventData
): void => {
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('Google Ads tracking not available');
    return;
  }

  try {
    window.gtag('event', eventName, data);
    console.log(`Google Ads ${eventName} tracked:`, data);
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error);
  }
};

/**
 * Track purchase conversion with Enhanced Conversions
 * @param transactionId - Stripe session ID or transaction ID
 * @param value - Purchase value
 * @param currency - Currency code (default: USD)
 * @param userData - User data for Enhanced Conversions
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  userData?: EnhancedConversionData
): void => {
  trackGoogleAdsConversion('conversion', {
    send_to: 'AW-17287675778/ndgYCOGS1OcaEIL_s7NA',
    value,
    currency,
    transaction_id: transactionId,
    user_data: userData
  });
};

/**
 * Track signup conversion with Enhanced Conversions
 * @param userData - User data for Enhanced Conversions
 */
export const trackSignup = (userData?: EnhancedConversionData): void => {
  trackGoogleAdsConversion('sign_up', {
    send_to: 'AW-17287675778/ndgYCOGS1OcaEIL_s7NA',
    user_data: userData
  });
};

/**
 * Track begin checkout with Enhanced Conversions
 * @param value - Purchase value
 * @param items - Array of items being purchased
 * @param currency - Currency code (default: USD)
 * @param userData - User data for Enhanced Conversions
 */
export const trackBeginCheckout = (
  value: number,
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>,
  currency: string = 'USD',
  userData?: EnhancedConversionData
): void => {
  trackGoogleAdsConversion('begin_checkout', {
    send_to: 'AW-17287675778/ndgYCOGS1OcaEIL_s7NA',
    value,
    currency,
    items,
    user_data: userData
  });
};

/**
 * Track page view with Enhanced Conversions
 * @param pageTitle - Page title
 * @param pageLocation - Page URL
 * @param userData - User data for Enhanced Conversions
 */
export const trackPageView = (
  pageTitle: string,
  pageLocation: string,
  userData?: EnhancedConversionData
): void => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  try {
    window.gtag('config', 'AW-17287675778', {
      page_title: pageTitle,
      page_location: pageLocation,
      user_data: userData
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}; 