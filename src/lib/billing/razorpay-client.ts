// src/lib/billing/razorpay-client.ts
// Client-side helper for seamless Razorpay Checkout integration (Domestic INR & International USD)

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayOptions {
  key?: string;
  amount: number; // in subunits (paise or cents)
  currency: 'INR' | 'USD';
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

export async function openRazorpayModal(options: RazorpayOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Unable to initialize Razorpay checkout. Please check your internet connection.');
  }

  const razorpayKey =
    options.key ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    'rzp_test_placeholder';

  const rzp = new (window as any).Razorpay({
    key: razorpayKey,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Arenova AI Front Desk',
    description: options.description || 'AI Receptionist Practice Subscription',
    image: '/arenova.png',
    order_id: options.order_id,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.theme?.color || '#E84B2C',
    },
    modal: {
      ondismiss: options.modal?.ondismiss,
      backdropclose: false,
    },
    handler: options.handler,
  });

  rzp.open();
}
