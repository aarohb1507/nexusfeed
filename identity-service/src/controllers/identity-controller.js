const User = require('../models/User')
const { generateTokens } = require('../utils/generateToken')
const logger = require('../utils/Logger')
const {validateRegistration} = require('../utils/validation')
const {validateLogin} = require('../utils/validation')
const {RefreshToken} = require('../models/RefreshTokens')

//user-registeration

const registerUser = async (req, res, next) => {
    logger.info("Hit registerUser endpoint")
    try {
        const {error} = validateRegistration(req.body)
        if (error){
            logger.warn("Validation failed during user registration: %s", error.details[0].message)
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(err => ({
                    field: err.context.key,
                    message: err.message
                }))
            })
        }
        const { username, email, password } = req.body
        let user = await User.findOne({ $or: [ { email }, { username } ] })
        if (user){
            logger.warn("Registration attempt with existing email or username: %s, %s", email, username)
            return res.status(409).json({
                success: false,
                message: "Email or Username already in use"
            })
        }
        user = new User({username, email, password})
        await user.save()
        logger.warn("New user registered: %s", user._id)
        
        // Delete any existing refresh tokens for this user (cleanup)
        await RefreshToken.deleteMany({ user: user._id })
        
        const { accessToken, refreshToken } = await generateTokens(user)
        
        // Set tokens in httpOnly cookies
        // Use 'lax' for development (cross-port), 'strict' for production (same domain)
        const sameSitePolicy = process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: sameSitePolicy,
            maxAge: 20 * 60 * 1000 // 20 minutes
        })
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: sameSitePolicy,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                userId: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
         logger.error("Error during user registration: %s", error.message)
         return res.status(500).json({
            success: false,
            message: "Internal Server Error"
         })
    }

}

//user-login
const loginUser = async (req, res, next) => {
    logger.info("Hit loginUser endpoint")
    try{
        const {error} = validateLogin(req.body)
        if (error){
            logger.warn("Validation failed during user login: %s", error.details[0].message)
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(err => ({
                    field: err.context.key,
                    message: err.message
                }))
            })
        }
         const {email, password} = req.body
         const user = await User.findOne({email})
         if (!user){
            logger.warn("Login attempt with unregistered email: %s", email)
            return res.status(401).json({
                success: false,
                message: "The email does not exist."
            })
         }
         //check for password match
        const isMatch = await user.comparePassword(password)
        if (!isMatch){
            logger.warn("Invalid password attempt for email: %s", email)
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            })
        }
        //if the password matches
        // Delete any existing refresh tokens for this user (ensure single active token)
        await RefreshToken.deleteMany({ user: user._id })
        
        const {accessToken, refreshToken} = await generateTokens(user)
        
        // Set tokens in httpOnly cookies
        // Use 'lax' for development (cross-port), 'strict' for production (same domain)
        const sameSitePolicy = process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: sameSitePolicy,
            maxAge: 20 * 60 * 1000 // 20 minutes
        })
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: sameSitePolicy,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                userId: user._id,
                username: user.username,
                email: user.email
            }
        })

    }catch(error){
        logger.error("Error during user login: %s", error.message)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}
//refresh-token
const refreshTokenUser = async (req, res, next) => {
    try {
        logger.info("Hit refreshTokenUser endpoint")
    // Read refresh token from cookies
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken){
        logger.warn("Refresh token not provided in cookies")
        return res.status(401).json({
            success: false,
            message: "Refresh token is required. Please login again."
        })
    }
    //further implementation needed
    const storedToken = await RefreshToken.findOne({token: refreshToken})
    if (!storedToken){
        logger.warn("Invalid refresh token attempt: %s", refreshToken)
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token"
        })
    }
    //additional logic to generate new tokens goes here
    if(storedToken.expiresAt < new Date()){
        logger.warn("Expired refresh token attempt: %s", refreshToken)
        return res.status(401).json({
            success: false,
            message: "Refresh token has expired"
        })
    }
    //generate new ACCESS TOKEN ONLY (keep same refresh token)
    const user = await User.findById(storedToken.user)
    if (!user){
        logger.warn("User not found for refresh token: %s", refreshToken)
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    
    // Generate ONLY new access token, reuse the same refresh token
    const newAccessToken = require('jsonwebtoken').sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, {expiresIn: '20m'})
    
    // DO NOT delete refresh token - we reuse it for the full 7 days
    
    // Set ONLY new access token cookie, refresh token stays the same
    // Use 'lax' for development (cross-port), 'strict' for production (same domain)
    const sameSitePolicy = process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    
    res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: sameSitePolicy,
        maxAge: 20 * 60 * 1000 // 20 minutes
    })
    
    // DO NOT set new refresh token cookie - we reuse the existing one
    
    return res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully"
    })


} catch (error) {
        logger.error("Error during refresh token processing: %s", error.message)
         return res.status(500).json({
            success: false,
            message: "Internal Server Error"
         })
    }
    
}
//logout

const logoutUser = async (req, res, next) => {
    logger.info("Hit logoutUser endpoint")
    try {
        const refreshToken = req.cookies.refreshToken
    if (!refreshToken){
        logger.warn("Refresh token not provided in logout request")
        return res.status(400).json({
            success: false,
            message: "Refresh token is required"
        })
    }
    await RefreshToken.deleteOne({token: refreshToken})
    
    // Clear cookies - must use same sameSite policy as when setting
    const sameSitePolicy = process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: sameSitePolicy
    })
    
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: sameSitePolicy
    })
    
    logger.info("User logged out successfully, refresh token invalidated: %s", refreshToken)
    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
    } catch (error) {
        logger.error("Error during logging out: %s", error.message)
         return res.status(500).json({
            success: false,
            message: "Internal Server Error"
         })
    }
}

module.exports = {
    registerUser, loginUser, refreshTokenUser, logoutUser
}