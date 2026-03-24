import express from 'express';
import { getMovieRecommendations, chatWithBot } from '../controllers/ai.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// @route   GET api/ai/recommendations
// @desc    Get AI movie recommendations based on user booking history
// @access  Private
router.get('/recommendations', verifyToken, getMovieRecommendations);

// @route   POST api/ai/chat
// @desc    Chat with CINEMAGO bot (public access)
// @access  Public
router.post('/chat', chatWithBot);

export default router;
