const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toMs = (value, unit) => {
  const map = { seconds: 1000, minutes: 60000, hours: 3600000 };
  return value * (map[unit] || 1);
};

module.exports = {
  app: {
    port: Number(process.env.PORT) || 4000,
    host: process.env.HOST || '0.0.0.0'
  },
  binance: {
    restBaseUrl: process.env.BINANCE_REST_URL || 'https://api.binance.com',
    wsBaseUrl: process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443',
    defaultSymbols: (process.env.DEFAULT_SYMBOLS || 'BTCUSDT,ETHUSDT,SOLUSDT')
      .split(',')
      .map((s) => s.trim().toUpperCase())
  },
  cache: {
    defaultTtl: Number(process.env.CACHE_TTL_MS) || 15000,
    symbolTtl: Number(process.env.SYMBOL_CACHE_TTL_MS) || toMs(1, 'minutes')
  },
  telemetry: {
    heartbeatInterval: Number(process.env.HEARTBEAT_INTERVAL_MS) || 5000
  }
};
