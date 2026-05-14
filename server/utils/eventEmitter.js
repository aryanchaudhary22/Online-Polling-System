/**
 * Custom EventEmitter Module
 * Demonstrates: EventEmitter in Node.js
 */

const EventEmitter = require('events');

class PollEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Allow up to 20 listeners
  }

  // Custom method to emit poll events
  emitPollCreated(poll) {
    this.emit('poll-created', poll);
  }

  emitPollDeleted(pollId) {
    this.emit('poll-deleted', pollId);
  }

  emitPollUpdated(poll) {
    this.emit('poll-updated', poll);
  }
}

module.exports = new PollEventEmitter();






