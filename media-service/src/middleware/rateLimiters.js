const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const RedisStoreModule = require('rate-limit-redis');
const RedisStore = RedisStoreModule.default || RedisStoreModule;
const logger = require('../utils/logger');

const redisClient = new Redis(process.env.REDIS_URL);

const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 800, // Increased 4x from 200
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
    max: 200, // Increased 4x from 50
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
    max: 80, // Increased 4x from 20
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