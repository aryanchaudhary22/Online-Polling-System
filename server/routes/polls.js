/**
 * Poll Routes
 * Demonstrates: Express Router, express-validator, Request/Response objects
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pollManager = require('../utils/pollManager');
const { compressData, decompressData } = require('../utils/dataCompression');

// Get Socket.IO instance (will be set by server)
let io = null;
router.setSocketIO = (socketIO) => {
  io = socketIO;
};

/**
 * GET /api/polls
 * Get all polls
 */
router.get('/', async (req, res) => {
  try {
    const polls = await pollManager.getAllPolls();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      count: polls.length,
      polls: polls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching polls',
      error: error.message
    });
  }
});

/**
 * GET /api/polls/:id
 * Get poll by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await pollManager.getPollById(id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.status(200).json({
      success: true,
      poll: poll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching poll',
      error: error.message
    });
  }
});

/**
 * POST /api/polls
 * Create a new poll
 * Demonstrates: express-validator, body-parser
 */
router.post('/', [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('questionType')
    .optional()
    .isIn(['single-choice', 'multiple-choice', 'rating', 'text'])
    .withMessage('Invalid question type'),
  body('options')
    .isArray({ min: 2 })
    .withMessage('At least 2 options are required')
    .custom((options) => {
      if (options.length < 2) {
        throw new Error('At least 2 options are required');
      }
      return true;
    }),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean')
], async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const result = await pollManager.createPoll(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Poll created successfully',
        poll: result.poll
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating poll',
      error: error.message
    });
  }
});

/**
 * POST /api/polls/:id/vote
 * Submit a vote
 */
router.post('/:id/vote', [
  body('optionIndex')
    .isInt({ min: 0 })
    .withMessage('Valid option index is required'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { optionIndex, isAnonymous = true } = req.body;
    
    const result = await pollManager.addVote(id, optionIndex, isAnonymous);
    
    if (result.success) {
      // Emit Socket.IO update for real-time results
      if (io) {
        io.to(`poll-${id}`).emit('poll-updated', result.poll);
      }
      
      res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        poll: result.poll
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
});

/**
 * DELETE /api/polls/:id
 * Delete a poll
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pollManager.deletePoll(id);
    
    if (result.success) {
      // Emit Socket.IO update for real-time deletion notification
      if (io) {
        io.emit('poll-deleted', id);
      }
      
      res.status(200).json({
        success: true,
        message: 'Poll deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting poll',
      error: error.message
    });
  }
});

/**
 * GET /api/polls/:id/export
 * Export poll data (demonstrates Stream and Compression)
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await pollManager.getPollById(id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Compress the poll data
    const compressed = await compressData(poll);
    
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="poll-${id}.json.gz"`);
    res.status(200).send(compressed);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting poll',
      error: error.message
    });
  }
});

module.exports = router;

