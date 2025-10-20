const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT) || 4000,
  corsOrigins: process.env.CORS_ORIGINS ? parseList(process.env.CORS_ORIGINS) : ['*'],
  defaultMode: process.env.TFL_MODE || 'tube',
  realtime: {
    pollInterval: Number(process.env.POLL_INTERVAL_MS) || 30000,
    stopPointIds: process.env.STOP_POINT_IDS ? parseList(process.env.STOP_POINT_IDS) : [
      '940GZZLUOXC',
      '940GZZLUKSX',
      '940GZZLUPAC'
    ]
  }
};
