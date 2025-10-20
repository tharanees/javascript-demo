import { create } from 'zustand';

const MAX_TRADE_HISTORY = 80;
const MAX_PRICE_POINTS = 180;

export const useDashboardStore = create((set, get) => ({
  availableSymbols: [],
  selectedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'],
  primarySymbol: 'BTCUSDT',
  tickerData: {},
  priceHistory: {},
  depthData: {},
  trades: {},
  setAvailableSymbols: (symbols) => set({ availableSymbols: symbols }),
  setSelectedSymbols: (symbols) => {
    const sanitized = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
    const nextSymbols = sanitized.length ? sanitized : ['BTCUSDT'];
    set({
      selectedSymbols: nextSymbols,
      primarySymbol: nextSymbols.includes(get().primarySymbol) ? get().primarySymbol : nextSymbols[0],
    });
  },
  setPrimarySymbol: (symbol) => set({ primarySymbol: symbol.toUpperCase() }),
  upsertTicker: (symbol, ticker) =>
    set((state) => {
      const upper = symbol.toUpperCase();
      const lastPrice = Number(ticker.lastPrice ?? ticker.c ?? ticker.price ?? 0);
      const change = Number(ticker.priceChangePercent ?? ticker.P ?? 0);
      const volume = Number(ticker.volume ?? ticker.v ?? 0);
      const quoteVolume = Number(ticker.quoteVolume ?? ticker.q ?? 0);

      const history = state.priceHistory[upper] || [];
      const nextHistory =
        lastPrice > 0
          ? [...history, { time: Date.now(), price: lastPrice }].slice(-MAX_PRICE_POINTS)
          : history;

      return {
        tickerData: {
          ...state.tickerData,
          [upper]: {
            symbol: upper,
            lastPrice,
            priceChangePercent: change,
            highPrice: Number(ticker.highPrice ?? ticker.h ?? 0),
            lowPrice: Number(ticker.lowPrice ?? ticker.l ?? 0),
            openPrice: Number(ticker.openPrice ?? ticker.o ?? 0),
            volume,
            quoteVolume,
          },
        },
        priceHistory: {
          ...state.priceHistory,
          [upper]: nextHistory,
        },
      };
    }),
  setDepth: (symbol, depth) =>
    set((state) => ({
      depthData: {
        ...state.depthData,
        [symbol.toUpperCase()]: depth,
      },
    })),
  addTrade: (symbol, trade) =>
    set((state) => {
      const upper = symbol.toUpperCase();
      const trades = state.trades[upper] || [];
      const nextTrades = [{
        id: trade.a ?? trade.id,
        price: Number(trade.p ?? trade.price ?? 0),
        quantity: Number(trade.q ?? trade.quantity ?? 0),
        timestamp: trade.T ?? trade.timestamp ?? Date.now(),
        isBuyerMaker: Boolean(trade.m ?? trade.isBuyerMaker),
      }, ...trades].slice(0, MAX_TRADE_HISTORY);

      return {
        trades: {
          ...state.trades,
          [upper]: nextTrades,
        },
      };
    }),
  resetTrades: (symbol, trades) =>
    set((state) => ({
      trades: {
        ...state.trades,
        [symbol.toUpperCase()]: trades,
      },
    })),
  resetDepth: (symbol, depth) =>
    set((state) => ({
      depthData: {
        ...state.depthData,
        [symbol.toUpperCase()]: depth,
      },
    })),
}));
