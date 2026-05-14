import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for new polls
    newSocket.on('new-poll', (poll) => {
      setPolls((prev) => [poll, ...prev]);
    });

    // Listen for deleted polls
    newSocket.on('poll-deleted', (pollId) => {
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    });

    // Fetch polls
    fetchPolls();

    return () => {
      newSocket.close();
    };
  }, []);

  const handleDeletePoll = async (pollId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setDeleting(pollId);
    try {
      await axios.delete(`${API_URL}/polls/${pollId}`);
      // Poll will be removed from list via Socket.IO event
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/polls`);
      setPolls(response.data.polls || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Online Polling System
        </h1>
        <p className="text-lg text-gray-600">
          Create, share, and view real-time poll results
        </p>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No polls available yet.</p>
          <Link
            to="/create"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition relative"
            >
              {/* Delete button - X icon in top right corner */}
              <button
                onClick={(e) => handleDeletePoll(poll.id, e)}
                disabled={deleting === poll.id}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete poll"
              >
                {deleting === poll.id ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 pr-8">
                {poll.title}
              </h3>
              {poll.description && (
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                  {poll.description}
                </p>
              )}
              
              {/* Poll Options Preview */}
              {poll.options && poll.options.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Options:</p>
                  <div className="space-y-1">
                    {poll.options.slice(0, 3).map((option, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded">
                        {option}
                      </div>
                    ))}
                    {poll.options.length > 3 && (
                      <p className="text-xs text-gray-500 italic">+ {poll.options.length - 3} more option(s)</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="capitalize">{poll.questionType.replace('-', ' ')}</span>
                <span className="font-semibold">{poll.totalVotes || 0} votes</span>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/poll/${poll.id}`}
                  className="flex-1 bg-primary-600 text-white text-center px-4 py-2 rounded-md hover:bg-primary-700 transition"
                >
                  Vote
                </Link>
                <Link
                  to={`/poll/${poll.id}/results`}
                  className="flex-1 bg-gray-200 text-gray-700 text-center px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;


