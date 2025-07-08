import { supabase } from '../lib/supabase';

interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl?: string;
  cancelUrl?: string;
  couponCode?: string;
  promotionCode?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> => {
  const { priceId, mode, successUrl, cancelUrl, couponCode, promotionCode } = params;
  
  // Get the current user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('User must be authenticated to create checkout session');
  }

  // Default URLs
  const defaultSuccessUrl = `${window.location.origin}/`;
  const defaultCancelUrl = `${window.location.origin}/`;

  const requestBody: any = {
    price_id: priceId,
    mode,
    success_url: successUrl || defaultSuccessUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
  };

  // Add coupon or promotion code if provided
  if (couponCode) {
    requestBody.coupon_code = couponCode;
  }
  if (promotionCode) {
    requestBody.promotion_code = promotionCode;
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return data;
};

export const redirectToCheckout = async (params: CreateCheckoutSessionParams): Promise<void> => {
  try {
    const { url } = await createCheckoutSession(params);
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};