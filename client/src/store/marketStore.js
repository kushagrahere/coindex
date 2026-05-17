import { create } from 'zustand';

export const useMarketStore = create((set, get) => ({
  assets:          [],       // Full ticker batch from WS
  orderbookMap:    {},       // { 'BTC-INR': { bids, asks, spread, ... } }
  wsConnected:     false,
  wsLatency:       null,
  lastUpdated:     null,
  trending:        { gainers: [], losers: [] },

  // Called by WebSocket hook on TICKER_BATCH
  setAssets: (assets) => {
    set({ assets, lastUpdated: Date.now() });
  },

  // Called by WebSocket hook on ORDERBOOK
  setOrderbook: (data) => {
    set(state => ({
      orderbookMap: { ...state.orderbookMap, [data.symbol]: data },
    }));
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsLatency:   (ms)        => set({ wsLatency: ms }),

  // Derived getters
  getAsset: (id) => get().assets.find(a => a.id === id) || null,
  getAssetBySymbol: (symbol) => get().assets.find(a => a.symbol === symbol.toUpperCase()) || null,
  getOrderbook: (symbol) => get().orderbookMap[symbol] || null,

  getTopAssets: (n = 10) =>
    [...get().assets].sort((a, b) => a.rank - b.rank).slice(0, n),

  getTopGainers: (n = 5) =>
    [...get().assets].sort((a, b) => b.change24h - a.change24h).slice(0, n),

  getTopLosers: (n = 5) =>
    [...get().assets].sort((a, b) => a.change24h - b.change24h).slice(0, n),
}));
