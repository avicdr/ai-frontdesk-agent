// src/lib/constants/billing.ts
// Centralized billing, pricing tiers, and crypto payment configurations for Domestic (India) and International clients

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: 'starter' | 'pro' | 'growth';
  name: string;
  badge?: string;
  chatsQuota: number;
  chatsDisplay: string;
  // Domestic INR
  priceInr: number;
  priceInrDisplay: string;
  // International USD
  priceUsd: number;
  priceUsdDisplay: string;
  description: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Practice',
    chatsQuota: 500,
    chatsDisplay: '500 AI chats/mo',
    priceInr: 999,
    priceInrDisplay: '₹999',
    priceUsd: 100,
    priceUsdDisplay: '$100',
    description: 'Perfect for small clinics getting started with AI reception',
    features: [
      '500 AI patient conversations/month',
      'WhatsApp integration',
      'Operating hours logic',
      'Gemini 1.5 Flash AI',
      'Up to 10 clinical services',
      'Google Calendar 2-way sync',
      '3-day grace period',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Clinic',
    badge: 'Recommended',
    chatsQuota: 2000,
    chatsDisplay: '2,000 AI chats/mo',
    priceInr: 1599,
    priceInrDisplay: '₹1,599',
    priceUsd: 250,
    priceUsdDisplay: '$250',
    description: 'Recommended for active practices with regular patient inquiries',
    features: [
      '2,000 AI patient conversations/month',
      'WhatsApp integration',
      'Google Calendar 2-way sync',
      'OpenAI auto-fallback',
      'Unlimited bookings',
      'Live human takeover inbox',
      'Appointment reminders',
      '7-day grace period',
    ],
  },
  {
    id: 'growth',
    name: 'Growth & Multi-Doctor',
    chatsQuota: 5000,
    chatsDisplay: '5,000 AI chats/mo',
    priceInr: 2999,
    priceInrDisplay: '₹2,999',
    priceUsd: 400,
    priceUsdDisplay: '$400',
    description: 'For growing clinics with multi-doctor rosters and high volume',
    features: [
      '5,000 AI patient conversations/month',
      'Multi-doctor calendar sync',
      'Custom clinical voice & knowledge',
      'Priority WhatsApp webhooks',
      'Dedicated account manager',
      'Advanced analytics',
      '14-day grace period',
    ],
  },
];

export interface CryptoNetworkOption {
  id: string;
  name: string;
  symbol: string;
  networkName: string;
  address: string;
  explorerTxBaseUrl: string;
  recommended?: boolean;
  memoOrTagRequired?: boolean;
  instructions: string;
}

export const CRYPTO_NETWORKS: CryptoNetworkOption[] = [
  {
    id: 'usdt_trc20',
    name: 'USDT (TRC-20)',
    symbol: 'USDT',
    networkName: 'TRON Network',
    address: process.env.NEXT_PUBLIC_CRYPTO_USDT_TRC20_ADDRESS || 'TG3XX5ExBkPp9nzdajDZGeTSHgLnTnn5A1',
    explorerTxBaseUrl: 'https://tronscan.org/#/transaction/',
    recommended: true,
    instructions: 'Send exact USDT amount on the TRON (TRC-20) network. Lowest network fees & fastest confirmation.',
  },
  {
    id: 'usdt_erc20',
    name: 'USDT (ERC-20)',
    symbol: 'USDT',
    networkName: 'Ethereum Mainnet',
    address: process.env.NEXT_PUBLIC_CRYPTO_USDT_ERC20_ADDRESS || '0x71C836e641Ac8093E114a8069a5a7FeDF804797B',
    explorerTxBaseUrl: 'https://etherscan.io/tx/',
    instructions: 'Send exact USDT amount on Ethereum network (ERC-20). Please ensure sufficient gas for the transfer.',
  },
  {
    id: 'usdc_polygon',
    name: 'USDC (Polygon)',
    symbol: 'USDC',
    networkName: 'Polygon POS',
    address: process.env.NEXT_PUBLIC_CRYPTO_USDC_POLYGON_ADDRESS || '0x71C836e641Ac8093E114a8069a5a7FeDF804797B',
    explorerTxBaseUrl: 'https://polygonscan.com/tx/',
    instructions: 'Send exact USDC amount on the Polygon network (low transaction gas fee).',
  },
  {
    id: 'eth',
    name: 'ETH (Ethereum)',
    symbol: 'ETH',
    networkName: 'Ethereum Mainnet',
    address: process.env.NEXT_PUBLIC_CRYPTO_ETH_ADDRESS || '0x71C836e641Ac8093E114a8069a5a7FeDF804797B',
    explorerTxBaseUrl: 'https://etherscan.io/tx/',
    instructions: 'Send equivalent ETH to our Ethereum deposit address.',
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    symbol: 'BTC',
    networkName: 'Bitcoin Native',
    address: process.env.NEXT_PUBLIC_CRYPTO_BTC_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    explorerTxBaseUrl: 'https://mempool.space/tx/',
    instructions: 'Send equivalent BTC to our Native SegWit Bitcoin address. Usually takes 1–3 network confirmations.',
  },
];

export const PLATFORM_UPI_VPA =
  process.env.NEXT_PUBLIC_PLATFORM_UPI_ID ||
  process.env.NEXT_PUBLIC_UPI_VPA ||
  'aviwasasleep@ptaxis';

/**
 * Determines whether a country / timezone is outside India.
 */
export function isInternationalClient(country?: string | null, timezone?: string | null): boolean {
  if (country) {
    const cleanCountry = country.trim().toUpperCase();
    if (cleanCountry === 'IN' || cleanCountry === 'INDIA') return false;
    return true;
  }
  if (timezone) {
    const cleanTz = timezone.trim().toLowerCase();
    if (cleanTz.includes('kolkata') || cleanTz.includes('calcutta') || cleanTz.includes('ist')) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Returns explorer link for a given crypto network and transaction hash.
 */
export function getCryptoExplorerUrl(networkId: string, txHash: string): string {
  const cleanHash = txHash.trim();
  const net = CRYPTO_NETWORKS.find(n => n.id === networkId);
  if (net) {
    return `${net.explorerTxBaseUrl}${cleanHash}`;
  }
  if (cleanHash.startsWith('0x')) {
    return `https://etherscan.io/tx/${cleanHash}`;
  }
  return `https://tronscan.org/#/transaction/${cleanHash}`;
}
