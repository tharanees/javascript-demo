const { performance } = require('perf_hooks');

class TimedCache {
  constructor(defaultTtl) {
    this.defaultTtl = defaultTtl;
    this.store = new Map();
  }

  set(key, value, ttl = this.defaultTtl) {
    const expiresAt = performance.now() + ttl;
    this.store.set(key, { value, expiresAt });
    return value;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < performance.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  wrap(key, ttl, factory) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    return Promise.resolve(factory()).then((value) => this.set(key, value, ttl));
  }

  delete(key) {
    this.store.delete(key);
  }
}

module.exports = TimedCache;
