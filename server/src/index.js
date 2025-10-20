const createServer = require('./server');
const logger = require('./utils/logger');

(async () => {
  try {
    await createServer();
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
})();
