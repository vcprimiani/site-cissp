export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price?: number;
  currency?: string;
  interval?: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SbJssKzz1es4LS',
    priceId: 'price_1Rg7FEFZjU9QP2AzCoxBfn4i',
    name: 'CISSPStudyGroup.com AI Question Generator',
    description: 'Study with unlimited practice question and granular control over question generation.',
    mode: 'subscription',
    price: 15.99,
    currency: 'usd',
    interval: 'month'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};