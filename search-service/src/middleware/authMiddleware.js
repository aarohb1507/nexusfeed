const logger = require('../utils/logger');

const authenticateUser = (req, res, next) => {
    logger.info("Authenticating user for protected route");
    
    // Trust the x-user-id header forwarded by API Gateway (gateway already validated JWT)
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
        logger.warn('No x-user-id header found - API Gateway should have validated and forwarded this');
        return res.status(401).json({
            success: false,
            message: 'Authentication required. User ID not provided by gateway.'
        });
    }

    // Attach user info to request
    req.user = {
        id: userId
    };
    logger.info('User authenticated via gateway: %s', req.user.id);
    next();
}

module.exports = {
    authenticateUser
}