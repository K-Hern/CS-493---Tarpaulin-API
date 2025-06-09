const redis = require('redis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';

let redisClient;

const TOKEN_COUNT = 3;
const REFRESH_RATE = 0.0003;

async function initRedis() {
  redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  try {
    await redisClient.connect();
    console.log('== Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
}


async function rateLimit(req, res, next) {
  if (!redisClient || !redisClient.isOpen) {
    console.warn('Redis not available, skipping rate limiting');
    return next();
  }

  const ip = req.ip;
  const currentTime = Date.now();
  
  try {
    const exists = await redisClient.exists(ip);

    if (!exists) {
      await redisClient.hSet(ip, { token_count: TOKEN_COUNT, last_time: currentTime });
    }
    
    const userToken = await redisClient.hGetAll(ip);
    userToken.token_count = parseInt(userToken.token_count, 10);
    userToken.last_time = parseInt(userToken.last_time, 10);

    const elapsedTime = currentTime - userToken.last_time;
    const tokensToAdd = Math.floor(elapsedTime * REFRESH_RATE);
    
    userToken.token_count = Math.min(TOKEN_COUNT, userToken.token_count + tokensToAdd);
    userToken.last_time = currentTime;

    if (userToken.token_count > 0) {
      userToken.token_count -= 1;
      await redisClient.hSet(ip, userToken);
      next();
    } else {
      res.status(429).json({ error: "Too many requests" });
    }
  } catch (err) {
    console.error('Rate limiting error:', err);
    next();
  }
}

module.exports = {
  initRedis,
  rateLimit
};
