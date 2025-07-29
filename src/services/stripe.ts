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
  
  console.log('Stripe: Creating checkout session with params:', { priceId, mode, successUrl, cancelUrl });
  
  // Get the current users session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('Stripe: Session error:', sessionError);
    throw new Error('User must be authenticated to create checkout session');
  }

  console.log('Stripe: User session obtained, user ID:', session.user.id);

  // Default URLs
  const defaultSuccessUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://www.cissp.app/success?session_id={CHECKOUT_SESSION_ID}'
      : `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
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

  console.log('Stripe: Making request to edge function with body:', requestBody);

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
  console.log('Stripe: Function URL:', functionUrl);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Stripe: Response status:', response.status);
    console.log('Stripe: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('Stripe: Error response data:', errorData);
      } catch (parseError) {
        console.error('Stripe: Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Stripe: Success response:', { sessionId: data.sessionId, hasUrl: !!data.url });
    return data;
  } catch (error: any) {
    console.error('Stripe: Fetch error:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to reach the payment service. Please check your connection and try again.');
    }
    throw error;
  }
};

export const redirectToCheckout = async (params: CreateCheckoutSessionParams): Promise<void> => {
  try {
    // Get the current user's email
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    
    // Use the new Stripe URL and append email as query parameter
    const baseUrl = 'https://buy.stripe.com/eVqaEX2HwfXybFzfHhfEk04';
    const checkoutUrl = userEmail ? `${baseUrl}?prefilled_email=${encodeURIComponent(userEmail)}` : baseUrl;
    
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};