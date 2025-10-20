const levels = ['debug', 'info', 'warn', 'error'];
const currentLevel = process.env.LOG_LEVEL || 'info';
const currentIdx = levels.indexOf(currentLevel);

const timestamp = () => new Date().toISOString();

const logFactory = (level) => (...args) => {
  if (levels.indexOf(level) < currentIdx) {
    return;
  }
  console[level === 'debug' ? 'log' : level](`[${timestamp()}] [${level.toUpperCase()}]`, ...args);
};

module.exports = levels.reduce((acc, level) => {
  acc[level] = logFactory(level);
  return acc;
}, {});
