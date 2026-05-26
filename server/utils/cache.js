const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;
let useMemoryFallback = false;
const memoryCache = new Map();

const initCache = () => {
  if (redisClient) return;

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn(`Redis connection failed ${times} times. Falling back to in-memory cache.`);
          useMemoryFallback = true;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server for caching');
      useMemoryFallback = false;
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Cache Client Error: ${err.message}`);
      useMemoryFallback = true;
    });
  } catch (err) {
    logger.error(`Failed to initialize Redis client: ${err.message}`);
    useMemoryFallback = true;
  }
};

// Initialize immediately
initCache();

/**
 * Get data from cache.
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
const get = async (key) => {
  if (useMemoryFallback) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Cache Get Error [Key: ${key}]: ${err.message}`);
    return null;
  }
};

/**
 * Set data in cache.
 * @param {string} key - Cache key
 * @param {any} value - Value to store
 * @param {number} ttlSeconds - Time-to-live in seconds (optional)
 */
const set = async (key, value, ttlSeconds = 300) => {
  if (useMemoryFallback) {
    memoryCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (err) {
    logger.error(`Cache Set Error [Key: ${key}]: ${err.message}`);
  }
};

/**
 * Delete data from cache.
 * @param {string} key - Cache key
 */
const del = async (key) => {
  if (useMemoryFallback) {
    memoryCache.delete(key);
    return;
  }

  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Cache Del Error [Key: ${key}]: ${err.message}`);
  }
};

/**
 * Clear multiple keys matching a pattern.
 * @param {string} pattern - Key pattern (e.g. 'services:*')
 */
const clearPattern = async (pattern) => {
  if (useMemoryFallback) {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regexPattern.test(key)) {
        memoryCache.delete(key);
      }
    }
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    logger.error(`Cache clearPattern Error [Pattern: ${pattern}]: ${err.message}`);
  }
};

module.exports = {
  get,
  set,
  del,
  clearPattern,
  redisClient,
};
