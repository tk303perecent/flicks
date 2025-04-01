// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import LoginPage from './pages/LoginPage'; // <= IMPORT
import './index.css';

function App() {
  return (
    <Routes>
      {/* Routes WITH Navbar/Footer */}
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsOfService />} />
        {/* Add other protected routes here later */}
        {/* <Route path="dashboard" element={<Dashboard />} /> */}
      </Route>

      {/* Route WITHOUT Navbar/Footer */}
      <Route path="/login" element={<LoginPage />} /> {/* <= ADD LOGIN ROUTE HERE */}

      {/* Optional: Add a 404 Not Found route */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;