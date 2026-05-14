/**
 * Poll Manager Module
 * Demonstrates: MongoDB operations, Callbacks, Promises, async/await
 */

const Poll = require('../models/Poll');
const eventEmitter = require('./eventEmitter');
const { compressData, decompressData } = require('./dataCompression');

/**
 * Read polls using callback (demonstrates callbacks with MongoDB)
 */
function readPollsCallback(callback) {
  Poll.find({})
    .lean()
    .exec((err, polls) => {
      if (err) {
        return callback(err, null);
      }
      // Convert _id to id and votes Map to Object
      const formattedPolls = polls.map((poll) => ({
        ...poll,
        id: poll._id.toString(),
        votes: poll.votes || {},
        _id: undefined,
        __v: undefined,
      }));
      callback(null, formattedPolls);
    });
}

/**
 * Read polls using Promise (demonstrates Promises with MongoDB)
 */
function readPollsPromise() {
  return Poll.find({})
    .lean()
    .exec()
    .then((polls) => {
      return polls.map((poll) => ({
        ...poll,
        id: poll._id.toString(),
        votes: poll.votes || {},
        _id: undefined,
        __v: undefined,
      }));
    });
}

/**
 * Get all polls (using async/await - demonstrates async/await)
 */
async function getAllPolls() {
  try {
    const polls = await Poll.find({}).lean();
    return polls.map((poll) => ({
      ...poll,
      id: poll._id.toString(),
      votes: poll.votes || {},
      _id: undefined,
      __v: undefined,
    }));
  } catch (error) {
    console.error('Error reading polls:', error);
    return [];
  }
}

/**
 * Get poll by ID
 */
async function getPollById(pollId) {
  try {
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return null;
    }
    return {
      ...poll,
      id: poll._id.toString(),
      votes: poll.votes || {},
      _id: undefined,
      __v: undefined,
    };
  } catch (error) {
    console.error('Error reading poll:', error);
    return null;
  }
}

/**
 * Create a new poll
 */
async function createPoll(pollData) {
  try {
    // Initialize votes object for all options
    const votesMap = new Map();
    pollData.options.forEach((_, index) => {
      votesMap.set(index.toString(), 0);
    });

    const newPoll = new Poll({
      title: pollData.title,
      description: pollData.description || '',
      questionType: pollData.questionType || 'single-choice',
      options: pollData.options || [],
      votes: votesMap,
      totalVotes: 0,
      isAnonymous: pollData.isAnonymous !== false,
      allowMultiple: pollData.allowMultiple || false,
      voteDetails: [],
    });

    const savedPoll = await newPoll.save();
    
    // Convert to plain object for event emission
    const pollObj = savedPoll.toJSON();
    
    // Emit event using EventEmitter
    eventEmitter.emitPollCreated(pollObj);
    
    return { success: true, poll: pollObj };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, message: 'Failed to create poll' };
  }
}

/**
 * Add vote to poll
 */
async function addVote(pollId, optionIndex, isAnonymous = true) {
  try {
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return { success: false, message: 'Poll not found' };
    }

    // Initialize votes map if needed
    if (!poll.votes) {
      poll.votes = new Map();
    }

    // Convert Map to Object for manipulation, then back to Map
    let votesObj;
    if (poll.votes instanceof Map) {
      votesObj = Object.fromEntries(poll.votes);
    } else {
      votesObj = poll.votes || {};
    }

    // Increment vote count
    const key = optionIndex.toString();
    votesObj[key] = (votesObj[key] || 0) + 1;
    
    // Convert back to Map (MongoDB stores Maps)
    poll.votes = new Map(Object.entries(votesObj));
    poll.totalVotes = (poll.totalVotes || 0) + 1;

    // Store vote details
    if (!poll.voteDetails) {
      poll.voteDetails = [];
    }
    
    poll.voteDetails.push({
      optionIndex,
      timestamp: new Date(),
      isAnonymous,
    });

    const updatedPoll = await poll.save();
    
    // Convert to plain object for event emission
    const pollObj = updatedPoll.toJSON();
    
    // Emit event
    eventEmitter.emitPollUpdated(pollObj);
    
    return { success: true, poll: pollObj };
  } catch (error) {
    console.error('Error adding vote:', error);
    return { success: false, message: 'Failed to add vote' };
  }
}

/**
 * Delete poll
 */
async function deletePoll(pollId) {
  try {
    const result = await Poll.findByIdAndDelete(pollId);
    
    if (!result) {
      return { success: false, message: 'Poll not found' };
    }

    eventEmitter.emitPollDeleted(pollId);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { success: false, message: 'Failed to delete poll' };
  }
}

/**
 * Export polls data using Stream (demonstrates Stream module)
 * Note: This can be adapted for MongoDB streams if needed
 */
function exportPollsStream() {
  // For MongoDB, we can use cursor streams
  return Poll.find({}).cursor();
}

module.exports = {
  getAllPolls,
  getPollById,
  createPoll,
  addVote,
  deletePoll,
  readPollsCallback,
  exportPollsStream,
};
