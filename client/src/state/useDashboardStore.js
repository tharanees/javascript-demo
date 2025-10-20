import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  selectedSymbol: 'BTCUSDT',
  realtime: {},
  globalMetrics: null,
  connectionStatus: 'disconnected',
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol.toUpperCase() }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  upsertSnapshot: (symbol, snapshot) =>
    set((state) => ({ realtime: { ...state.realtime, [symbol]: snapshot } })),
  setGlobalMetrics: (metrics) => set({ globalMetrics: metrics })
}));

export default useDashboardStore;
