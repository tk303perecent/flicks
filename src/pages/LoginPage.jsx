// src/pages/LoginPage.jsx
import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Import the default theme
import { supabase } from '../supabaseClient'; // Import your client
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const LoginPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth(); // Get session from context

  // Redirect if user is already logged in
  useEffect(() => {
    if (session) {
      // Redirect to a dashboard or home page after login
      // You might want a dedicated '/dashboard' route later
      navigate('/');
    }
  }, [session, navigate]);

  return (
    // Center the Auth component on the page
    <div className="bg-pleasant-grey min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-navbar-grey p-10 rounded-xl shadow-lg">
           <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                Sign in to CounselDocs
              </h2>
           </div>
           {/* Supabase Auth UI Component */}
           <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa, // Apply the default theme
                // Customize further if needed:
                variables: {
                  default: {
                    colors: {
                      brand: '#38B2AC', // Your accent-teal
                      brandAccent: '#319795', // Your accent-teal-hover
                      // You can override many other colors here
                    },
                  },
                },
                extend: true, // Allow extending the theme not just overriding
                // Override specific class names if necessary:
                // className: {
                //   button: 'my-custom-button-class',
                // },
              }}
              theme="dark" // Use the dark variant of the theme
              providers={['google', 'github']} // Optional: Add OAuth providers configured in Supabase
              // socialLayout="horizontal" // Optional: Layout for social buttons
              redirectTo="http://localhost:5173/" // Where to redirect after successful login (adjust if needed)
              // view='sign_in' // Can force 'sign_in' or 'sign_up' view
              showLinks={true} // Show links for password recovery, signup
              magicLink={false} // Set to true to enable passwordless magic link login
           />
        </div>
    </div>
  );
};

export default LoginPage;