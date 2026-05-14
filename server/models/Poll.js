/**
 * Poll Model
 * MongoDB Schema for Polls
 */

const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    questionType: {
      type: String,
      enum: ['single-choice', 'multiple-choice', 'rating', 'text'],
      default: 'single-choice',
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length >= 2;
        },
        message: 'At least 2 options are required',
      },
    },
    votes: {
      type: Map,
      of: Number,
      default: {},
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    allowMultiple: {
      type: Boolean,
      default: false,
    },
    voteDetails: {
      type: [
        {
          optionIndex: Number,
          timestamp: Date,
          isAnonymous: Boolean,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Convert Map to Object for JSON serialization
        if (ret.votes instanceof Map) {
          ret.votes = Object.fromEntries(ret.votes);
        } else if (ret.votes && typeof ret.votes === 'object') {
          // Already an object, just ensure it's properly formatted
          ret.votes = ret.votes;
        }
        // Convert _id to id
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Initialize votes Map when creating new polls
pollSchema.pre('save', function () {
  if (this.isNew && (!this.votes || Object.keys(this.votes).length === 0)) {
    const votesMap = new Map();
    this.options.forEach((_, index) => {
      votesMap.set(index.toString(), 0);
    });
    this.votes = votesMap;
  }
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;

