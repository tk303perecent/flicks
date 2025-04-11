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
import Suggested from './pages/Suggested.jsx';
import DashboardLayout from './pages/Dashboard/DashboardLayout.jsx';
// --- ADDED IMPORT for Study Page ---
import FlashcardsStudy from './pages/Dashboard/FlashcardsStudy.jsx'; // Adjust path if necessary
// --- END ADDED IMPORT ---
import Games from './pages/Games.jsx';

// Optional: Import an error page component
// import ErrorPage from './pages/ErrorPage';
// Optional: Import a ProtectedRoute component if you have one
// import ProtectedRoute from './components/ProtectedRoute';

// --- Define Routes using createBrowserRouter ---
const router = createBrowserRouter([
    {
        // == Routes using the main Layout (Navbar/Footer) ==
        element: <Layout />, // Your main app navbar/footer layout
        // errorElement: <ErrorPage />, // Optional error element for layout routes
        children: [
            { index: true, element: <LandingPage /> }, // Home page at "/"
            { path: "privacy", element: <PrivacyPolicy /> },
            { path: "terms", element: <TermsOfService /> },

            // --- Authenticated Routes (Consider wrapping with ProtectedRoute) ---
            // Note: If you have a ProtectedRoute component, wrap elements like this:
            // element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>

            {
                path: "dashboard",
                element: <DashboardLayout />
                // Example with protection: element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            },
            {
                path: "flicks",
                element: <FlicksClub />
                // Example with protection: element: <ProtectedRoute><FlicksClub /></ProtectedRoute>
            },
            {
                path: "stats",
                element: <Stats />
                // Example with protection: element: <ProtectedRoute><Stats /></ProtectedRoute>
            },
            {
                path: "suggested",
                element: <Suggested />
                // Example with protection: element: <ProtectedRoute><Suggested /></ProtectedRoute>
            },

            // --- ADDED ROUTE for Flashcard Study Page ---
            {
                path: "dashboard/study/:deckId", // Matches the navigate() path
                element: <FlashcardsStudy />
                // Example with protection: element: <ProtectedRoute><FlashcardsStudy /></ProtectedRoute>
            },
            // --- END ADDED ROUTE ---

            {
                path: "games",
                element: <Games />
                // Example with protection: element: <ProtectedRoute><Games /></ProtectedRoute>
            },

            // --- End Authenticated Routes ---
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
        <AuthProvider> {/* AuthProvider wraps everything */}
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>,
);