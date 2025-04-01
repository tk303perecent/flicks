// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes - CORRECTED DESTRUCTURING
    const { data: { subscription } } = supabase.auth.onAuthStateChange( // <-- Get 'subscription' from 'data'
      (_event, session) => {
        setSession(session);
        // ... other logic
      }
    );

    // Cleanup function: Call unsubscribe on the actual subscription object
    return () => {
      subscription?.unsubscribe(); // <-- Use the 'subscription' variable
    };
  }, []); // Empty dependency array

  const value = {
    session,
    user: session?.user ?? null,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};