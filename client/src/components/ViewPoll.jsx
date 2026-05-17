import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'https://online-polling-system-i9if.onrender.com';

const ViewPoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [textResponse, setTextResponse] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchPoll();
    const currentUrl = window.location.origin + `/poll/${id}`;
    setShareLink(currentUrl);

    // Initialize Socket.IO
    const newSocket = io('https://online-polling-system-i9if.onrender.com');
    setSocket(newSocket);

    // Join poll room
    newSocket.emit('join-poll', id);

    // Listen for poll updates
    newSocket.on('poll-updated', (updatedPoll) => {
      if (updatedPoll.id === id) {
        setPoll(updatedPoll);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [id]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/polls/${id}`);
      setPoll(response.data.poll);
    } catch (error) {
      console.error('Error fetching poll:', error);
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!poll) return;

    let optionIndex = null;

    if (poll.questionType === 'single-choice') {
      if (selectedOption === null) {
        alert('Please select an option');
        return;
      }
      optionIndex = selectedOption;
    } else if (poll.questionType === 'multiple-choice') {
      if (selectedOptions.length === 0) {
        alert('Please select at least one option');
        return;
      }
      // For multiple choice, submit first selection (can be extended)
      optionIndex = selectedOptions[0];
    } else if (poll.questionType === 'rating') {
      if (rating === 0) {
        alert('Please select a rating');
        return;
      }
      optionIndex = rating - 1; // Rating 1-5 maps to option index 0-4
    } else if (poll.questionType === 'text') {
      if (!textResponse.trim()) {
        alert('Please enter a response');
        return;
      }
      // For text, we'll use the first option as placeholder
      optionIndex = 0;
    }

    setSubmitting(true);

    try {
      // Submit vote via HTTP (Socket.IO update will be emitted from server)
      await axios.post(`${API_URL}/api/polls/${id}/vote`, {
        optionIndex,
        isAnonymous: poll.isAnonymous
      });

      setVoted(true);
      setTimeout(() => {
        navigate(`/poll/${id}/results`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Poll not found.</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  if (voted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vote Submitted!
          </h2>
          <p className="text-gray-600 mb-4">Redirecting to results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-gray-600 mb-4">{poll.description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Type: {poll.questionType}</span>
            <span>{poll.totalVotes || 0} votes</span>
          </div>
        </div>

        <div className="mb-6">
          {poll.questionType === 'single-choice' && (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedOption === index
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="option"
                    value={index}
                    checked={selectedOption === index}
                    onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {poll.questionType === 'multiple-choice' && (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedOptions.includes(index)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(index)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOptions([...selectedOptions, index]);
                      } else {
                        setSelectedOptions(
                          selectedOptions.filter((i) => i !== index)
                        );
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {poll.questionType === 'rating' && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`w-16 h-16 rounded-full text-2xl font-bold transition ${
                      rating >= value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-600">
                {rating > 0 ? `Selected: ${rating}/5` : 'Select a rating (1-5)'}
              </p>
            </div>
          )}

          {poll.questionType === 'text' && (
            <div>
              <textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your response..."
              />
            </div>
          )}
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleVote}
            disabled={submitting}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Vote'}
          </button>
          <Link
            to={`/poll/${id}/results`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition"
          >
            View Results
          </Link>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Share this poll:</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPoll;

