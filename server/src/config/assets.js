'use strict';

/**
 * Supported asset master list — 50 coins tracked in INR
 * id: CoinGecko canonical ID
 * symbol: uppercase trading symbol
 * name: display name
 * category: sector tag (used in UI filtering)
 */
const ASSETS = [
  // ── Layer 1 ──────────────────────────────────────────────────────────────
  { id: 'bitcoin',          symbol: 'BTC',   name: 'Bitcoin',           category: 'layer1' },
  { id: 'ethereum',         symbol: 'ETH',   name: 'Ethereum',          category: 'layer1' },
  { id: 'solana',           symbol: 'SOL',   name: 'Solana',            category: 'layer1' },
  { id: 'binancecoin',      symbol: 'BNB',   name: 'BNB',               category: 'layer1' },
  { id: 'ripple',           symbol: 'XRP',   name: 'XRP',               category: 'layer1' },
  { id: 'cardano',          symbol: 'ADA',   name: 'Cardano',           category: 'layer1' },
  { id: 'avalanche-2',      symbol: 'AVAX',  name: 'Avalanche',         category: 'layer1' },
  { id: 'tron',             symbol: 'TRX',   name: 'TRON',              category: 'layer1' },
  { id: 'polkadot',         symbol: 'DOT',   name: 'Polkadot',          category: 'layer1' },
  { id: 'cosmos',           symbol: 'ATOM',  name: 'Cosmos',            category: 'layer1' },
  { id: 'near',             symbol: 'NEAR',  name: 'NEAR Protocol',     category: 'layer1' },
  { id: 'algorand',         symbol: 'ALGO',  name: 'Algorand',          category: 'layer1' },
  { id: 'stellar',          symbol: 'XLM',   name: 'Stellar',           category: 'layer1' },
  { id: 'hedera-hashgraph', symbol: 'HBAR',  name: 'Hedera',            category: 'layer1' },
  { id: 'fantom',           symbol: 'FTM',   name: 'Fantom',            category: 'layer1' },
  { id: 'flow',             symbol: 'FLOW',  name: 'Flow',              category: 'layer1' },
  { id: 'multiversx',       symbol: 'EGLD',  name: 'MultiversX',        category: 'layer1' },

  // ── Layer 2 / Scaling ─────────────────────────────────────────────────────
  { id: 'matic-network',    symbol: 'MATIC', name: 'Polygon',           category: 'layer2' },
  { id: 'arbitrum',         symbol: 'ARB',   name: 'Arbitrum',          category: 'layer2' },
  { id: 'optimism',         symbol: 'OP',    name: 'Optimism',          category: 'layer2' },
  { id: 'loopring',         symbol: 'LRC',   name: 'Loopring',          category: 'layer2' },

  // ── DeFi ─────────────────────────────────────────────────────────────────
  { id: 'uniswap',          symbol: 'UNI',   name: 'Uniswap',           category: 'defi' },
  { id: 'aave',             symbol: 'AAVE',  name: 'Aave',              category: 'defi' },
  { id: 'chainlink',        symbol: 'LINK',  name: 'Chainlink',         category: 'defi' },
  { id: 'maker',            symbol: 'MKR',   name: 'Maker',             category: 'defi' },
  { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound', category: 'defi' },
  { id: 'curve-dao-token',  symbol: 'CRV',   name: 'Curve DAO',         category: 'defi' },
  { id: 'sushi',            symbol: 'SUSHI', name: 'SushiSwap',         category: 'defi' },
  { id: 'yearn-finance',    symbol: 'YFI',   name: 'yearn.finance',     category: 'defi' },
  { id: '1inch',            symbol: '1INCH', name: '1inch Network',     category: 'defi' },
  { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix',   category: 'defi' },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap',       category: 'defi' },

  // ── Meme ─────────────────────────────────────────────────────────────────
  { id: 'dogecoin',         symbol: 'DOGE',  name: 'Dogecoin',          category: 'meme' },
  { id: 'shiba-inu',        symbol: 'SHIB',  name: 'Shiba Inu',         category: 'meme' },
  { id: 'pepe',             symbol: 'PEPE',  name: 'Pepe',              category: 'meme' },

  // ── Infrastructure ────────────────────────────────────────────────────────
  { id: 'filecoin',         symbol: 'FIL',   name: 'Filecoin',          category: 'infra' },
  { id: 'theta-token',      symbol: 'THETA', name: 'Theta Network',     category: 'infra' },
  { id: 'basic-attention-token', symbol: 'BAT', name: 'Basic Attention Token', category: 'infra' },
  { id: 'storj',            symbol: 'STORJ', name: 'Storj',             category: 'infra' },
  { id: 'ocean-protocol',   symbol: 'OCEAN', name: 'Ocean Protocol',    category: 'infra' },

  // ── Gaming / NFT / Metaverse ──────────────────────────────────────────────
  { id: 'the-sandbox',      symbol: 'SAND',  name: 'The Sandbox',       category: 'gaming' },
  { id: 'decentraland',     symbol: 'MANA',  name: 'Decentraland',      category: 'gaming' },
  { id: 'enjincoin',        symbol: 'ENJ',   name: 'Enjin Coin',        category: 'gaming' },
  { id: 'axie-infinity',    symbol: 'AXS',   name: 'Axie Infinity',     category: 'gaming' },
  { id: 'chiliz',           symbol: 'CHZ',   name: 'Chiliz',            category: 'gaming' },

  // ── Exchange Tokens ───────────────────────────────────────────────────────
  { id: 'okb',              symbol: 'OKB',   name: 'OKB',               category: 'exchange' },

  // ── Privacy ───────────────────────────────────────────────────────────────
  { id: 'monero',           symbol: 'XMR',   name: 'Monero',            category: 'privacy' },

  // ── Store of Value ────────────────────────────────────────────────────────
  { id: 'litecoin',         symbol: 'LTC',   name: 'Litecoin',          category: 'store-of-value' },
  { id: 'bitcoin-cash',     symbol: 'BCH',   name: 'Bitcoin Cash',      category: 'store-of-value' },
  { id: 'vechain',          symbol: 'VET',   name: 'VeChain',           category: 'supply-chain' },
];

// Fast lookup maps
const ASSET_BY_ID = new Map(ASSETS.map(a => [a.id, a]));
const ASSET_BY_SYMBOL = new Map(ASSETS.map(a => [a.symbol.toUpperCase(), a]));

// All CoinGecko IDs as a comma-separated string (for bulk market call)
const ALL_IDS = ASSETS.map(a => a.id).join(',');

// Default top-5 pairs to stream live order books for
const ORDERBOOK_PAIRS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'];

module.exports = { ASSETS, ASSET_BY_ID, ASSET_BY_SYMBOL, ALL_IDS, ORDERBOOK_PAIRS };
