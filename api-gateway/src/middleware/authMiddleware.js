const logger = require('../utils/logger')
const jwt = require('jsonwebtoken')

const validateToken = (req, res, next) => {
    // Extract token from cookies
    const token = req.cookies.accessToken
    
    if (!token) {
        logger.warn('No access token found in cookies')
        return res.status(401).json({
            success: false,
            message: 'Access token missing. Please login.'
        })
    }

    // Verify the JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token: %s', err.message)
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token. Please refresh or login again.'
            })
        }
        req.user = user
        next()
    })
}

module.exports = {
    validateToken
}