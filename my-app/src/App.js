import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import DefaultPage from './DefaultPage.js'
import LoginPage from './LoginPage.js';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<DefaultPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;