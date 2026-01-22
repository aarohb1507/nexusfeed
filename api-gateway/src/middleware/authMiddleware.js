const logger = require('../utils/logger')
const jwt = require('jsonwebtoken')
const http = require('http')

const validateToken = async (req, res, next) => {
    // Extract token from cookies
    const token = req.cookies.accessToken
    const refreshToken = req.cookies.refreshToken
    
    if (!token) {
        logger.warn('No access token found in cookies')
        return res.status(401).json({
            success: false,
            message: 'Access token missing. Please login.'
        })
    }

    // Verify the JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            // Token is invalid or expired
            if (err.name === 'TokenExpiredError' && refreshToken) {
                logger.info('Access token expired, attempting automatic refresh for user')
                
                // Parse identity service URL
                const identityUrl = new URL(process.env.IDENTITY_SERVICE_URL)
                
                const options = {
                    hostname: identityUrl.hostname,
                    port: identityUrl.port || 80,
                    path: '/api/refresh-token',
                    method: 'POST',
                    headers: {
                        'Cookie': `refreshToken=${refreshToken}`,
                        'Content-Type': 'application/json',
                        'Content-Length': 0
                    }
                }
                
                const refreshRequest = http.request(options, (refreshRes) => {
                    let data = ''
                    
                    refreshRes.on('data', (chunk) => {
                        data += chunk
                    })
                    
                    refreshRes.on('end', () => {
                        if (refreshRes.statusCode === 200) {
                            // Extract new access token from set-cookie header
                            const setCookieHeader = refreshRes.headers['set-cookie']
                            
                            if (setCookieHeader && Array.isArray(setCookieHeader)) {
                                const accessTokenCookie = setCookieHeader.find(cookie => 
                                    cookie.startsWith('accessToken=')
                                )
                                
                                if (accessTokenCookie) {
                                    // Parse token value from cookie string
                                    const newAccessToken = accessTokenCookie.split(';')[0].split('=')[1]
                                    
                                    try {
                                        // Verify the new token
                                        const newUser = jwt.verify(newAccessToken, process.env.JWT_SECRET)
                                        req.user = newUser
                                        
                                        // Forward the new cookie to client
                                        res.setHeader('Set-Cookie', setCookieHeader)
                                        
                                        logger.info('Token automatically refreshed for user: %s', newUser.id)
                                        return next()
                                    } catch (verifyError) {
                                        logger.error('Failed to verify refreshed token: %s', verifyError.message)
                                        return res.status(401).json({
                                            success: false,
                                            message: 'Token refresh verification failed. Please login again.'
                                        })
                                    }
                                }
                            }
                            
                            logger.warn('No valid access token cookie in refresh response')
                            return res.status(401).json({
                                success: false,
                                message: 'Failed to refresh token. Please login again.'
                            })
                        } else {
                            logger.warn('Refresh token endpoint returned status: %d', refreshRes.statusCode)
                            return res.status(401).json({
                                success: false,
                                message: 'Token refresh failed. Please login again.'
                            })
                        }
                    })
                })
                
                refreshRequest.on('error', (error) => {
                    logger.error('Error calling refresh token endpoint: %s', error.message)
                    return res.status(401).json({
                        success: false,
                        message: 'Token refresh failed. Please login again.'
                    })
                })
                
                refreshRequest.end()
                
            } else {
                // Invalid token or no refresh token available
                logger.warn('Invalid token: %s', err.message)
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token. Please login again.'
                })
            }
        } else {
            // Token is valid
            req.user = user
            next()
        }
    })
}

module.exports = {
    validateToken
}