const express = require('express');
const router = express.Router();
const {createPost, getAllPosts, getPost, deletePost} = require('../controller/post-controller');
const {authenticateUser} = require('../middleware/authMiddleware');
const {createPostLimiter, deletePostLimiter} = require('../middleware/rateLimiters');

// Rate limiter BEFORE auth, auth BEFORE controller
router.post('/create-post', createPostLimiter, authenticateUser, createPost)
router.get('/all-posts', authenticateUser, getAllPosts)
router.get('/:id', authenticateUser, getPost)
router.delete('/delete/:id', deletePostLimiter, authenticateUser, deletePost)

module.exports = router;