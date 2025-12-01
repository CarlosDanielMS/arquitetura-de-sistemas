import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis-cache",
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Connect to Redis
redis.connect().catch((err) => {
  console.error("❌ Redis connection failed:", err.message);
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

/**
 * Cache middleware for orders service
 * @param {number} seconds - TTL in seconds (Infinity for no expiration)
 * @param {string} keyPrefix - Prefix for cache keys
 */
export default function cache(seconds, keyPrefix = "orders") {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `${keyPrefix}:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        console.log(`⚡ Cache HIT: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`🔍 Cache MISS: ${key}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (body) => {
        // Cache the response
        if (seconds === Infinity) {
          redis.set(key, JSON.stringify(body)).catch((err) => {
            console.error(`❌ Failed to cache ${key}:`, err.message);
          });
        } else {
          redis.setex(key, seconds, JSON.stringify(body)).catch((err) => {
            console.error(`❌ Failed to cache ${key}:`, err.message);
          });
        }

        // Call original json method
        originalJson(body);
      };

      next();
    } catch (err) {
      console.error("⚠️ Cache middleware error:", err.message);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'orders:*')
 */
export async function invalidateCache(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (err) {
    console.error("❌ Cache invalidation failed:", err.message);
  }
}

export { redis };