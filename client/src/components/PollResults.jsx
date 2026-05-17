import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API_URL = 'https://online-polling-system-i9if.onrender.com';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

const PollResults = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchPoll();

    // Initialize Socket.IO for real-time updates
    const newSocket = io('https://online-polling-system-i9if.onrender.com');
    setSocket(newSocket);

    // Join poll room
    newSocket.emit('join-poll', id);

    // Listen for poll updates
    newSocket.on('poll-updated', (updatedPoll) => {
      if (updatedPoll._id === id || updatedPoll.id === id) {
        setPoll(updatedPoll);
        updateChartData(updatedPoll);
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
      updateChartData(response.data.poll);
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (pollData) => {
    if (!pollData || !pollData.options) return;

    const data = pollData.options.map((option, index) => ({
      name: option,
      votes: pollData.votes?.[index] || 0,
      percentage: pollData.totalVotes
        ? ((pollData.votes?.[index] || 0) / pollData.totalVotes * 100).toFixed(1)
        : 0
    }));

    setChartData(data);
  };

  const copyShareLink = () => {
    const shareLink = window.location.origin + `/poll/${id}`;
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  console.log("POLL DATA:", poll);

  if (!poll) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Poll not found.</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
        {poll.description && (
          <p className="text-gray-600 mb-4">{poll.description}</p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Type: {poll.questionType}</span>
          <span className="text-lg font-semibold text-primary-600">
            Total Votes: {poll.totalVotes || 0}
          </span>
        </div>

        <div className="border-t pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Share this poll:</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={window.location.origin + `/poll/${id}`}
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

      {poll.totalVotes === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No votes yet. Be the first to vote!</p>
          <Link
            to={`/poll/${id}`}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition"
          >
            Vote Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Results (Bar Chart)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#0ea5e9" name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Results (Pie Chart)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percentage, votes }) => 
                    votes > 0 ? `${name}: ${percentage}%` : ''
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="votes"
                  isAnimationActive={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${props.payload.name}: ${value} votes (${props.payload.percentage}%)`,
                    'Votes'
                  ]}
                />
                <Legend 
                  formatter={(value, entry) => {
                    const data = chartData.find(d => d.name === value);
                    return `${value} (${data?.votes || 0} votes)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Results Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detailed Results
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Option
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.votes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-primary-600 h-4 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to={`/poll/${id}`}
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition"
        >
          Vote on this Poll
        </Link>
      </div>
    </div>
  );
};

export default PollResults;

