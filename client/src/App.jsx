import React from 'react';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary-600 mb-4">
                🏠 SLIIT Accommodation System
              </h1>
              <p className="text-gray-600 text-lg">
                Phase 0 Setup Complete ✅
              </p>
              <p className="text-gray-500 mt-2">
                Frontend and Backend initialized successfully!
              </p>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
