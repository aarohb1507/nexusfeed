const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const RedisStoreModule = require('rate-limit-redis');
const RedisStore = RedisStoreModule.default || RedisStoreModule;
const logger = require('../utils/logger');

const redisClient = new Redis(process.env.REDIS_URL);

const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2400, // Increased 3x from 800 (12x total from original 200)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('IP %s exceeded global rate limit', req.ip);
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

const uploadMediaLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 600, // Increased 3x from 200 (12x total from original 50)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('IP %s exceeded uploadMedia rate limit', req.ip);
        return res.status(429).json({
            success: false,
            message: 'Too many media uploads. Please wait before uploading again.'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

const getMediaLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // Increased to 1000 for read-only by-ids endpoint (concurrent UI requests)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('IP %s exceeded getAllMedias rate limit', req.ip);
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down.'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

module.exports = {
    globalRateLimiter,
    uploadMediaLimiter,
    getMediaLimiter
};