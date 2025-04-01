// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

// Import Providers and base CSS
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Import Page/Layout Components needed for routing
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import FlicksClub from './pages/FlicksClub.jsx';
import Stats from './pages/Stats.jsx';
import Suggested from './pages/Suggested.jsx'; // <-- 1. IMPORT the new Suggested component

// Optional: Import an error page component
// import ErrorPage from './pages/ErrorPage';

// --- Define Routes using createBrowserRouter ---
const router = createBrowserRouter([
  {
    // == Routes using the main Layout (Navbar/Footer) ==
    element: <Layout />,
    // errorElement: <ErrorPage />, // Optional error element
    children: [
      { index: true, element: <LandingPage /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "terms", element: <TermsOfService /> },
      { path: "flicks", element: <FlicksClub /> }, // Uses "/flicks" path
      { path: "stats", element: <Stats /> },
      { path: "suggested", element: <Suggested /> }, // <-- 2. ADD the route for /suggested
    ],
  },
  {
    // == Routes WITHOUT the main Layout ==
    path: "/login",
    element: <LoginPage />,
  },
  // Optional: Catch-all 404 route
  // { path: "*", element: <NotFoundPage /> }
]);
// --- End Route Definition ---


// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);