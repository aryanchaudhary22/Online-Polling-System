import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreatePoll from './components/CreatePoll';
import ViewPoll from './components/ViewPoll';
import PollResults from './components/PollResults';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<ViewPoll />} />
          <Route path="/poll/:id/results" element={<PollResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;






