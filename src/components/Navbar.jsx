// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX, FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom'; // Using Link for internal navigation
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { session, loading } = useAuth(); // Assuming AuthContext provides a loading state
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // --- DEBUG LOGGING ---
  // Log the session status whenever the component renders or session/loading changes
  useEffect(() => {
    console.log('Navbar Effect: Auth Loading:', loading, 'Session:', session);
  }, [session, loading]);
  // --- END DEBUG LOGGING ---

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false); // Close user menu if mobile opens
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMobileMenuOpen(false); // Close mobile menu if user opens
  };

  // Close user menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the userMenuRef element
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    // Add event listener only when the user menu is open
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]); // Re-run effect when isUserMenuOpen changes


  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    try {
      console.log('Attempting logout...'); // Log logout attempt
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout Error:', error); // Log specific error
        throw error;
      }
      console.log('Logged out successfully via Supabase.');
      // Note: The session state update should happen via AuthContext's onAuthStateChange
      navigate('/'); // Navigate to home after logout
    } catch (error) {
      console.error('Error during handleLogout:', error.message);
      alert(`Error logging out: ${error.message}`);
    }
  };

  // Helper function to close menus on link click
  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // --- DEBUG LOGGING ---
  console.log('Navbar Rendering. Auth Loading:', loading, 'Session:', session);
  // --- END DEBUG LOGGING ---

  // Optional: Show a loading indicator or simplified navbar while auth state is resolving
  // if (loading) {
  //   return (
  //     <nav className="sticky top-0 z-50 bg-navbar-grey shadow-md p-4 relative">
  //       <div className="container mx-auto flex justify-between items-center">
  //          <div className="flex items-center space-x-4">
  //             <span className="text-2xl font-bold text-white">CounselDocs</span>
  //          </div>
  //          <div className="text-medium-text">Loading user...</div>
  //       </div>
  //     </nav>
  //   );
  // }

  return (
    <nav className="sticky top-0 z-50 bg-navbar-grey shadow-md p-4 relative">
      <div className="container mx-auto flex justify-between items-center">
        {/* --- Left Side --- */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-light-text hover:text-accent-teal focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" onClick={closeMenus} className="text-2xl font-bold text-white hover:text-accent-teal">
            CounselDocs
          </Link>
        </div>

        {/* --- Right Side (Desktop) --- */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Standard Links (Using <a> for potential anchor links or external links) */}
          <a href="/#features" className="text-medium-text hover:text-light-text">Features</a>
          <a href="/#pricing" className="text-medium-text hover:text-light-text">Pricing</a>
          <a href="/#about" className="text-medium-text hover:text-light-text">About</a>

          {/* Conditional User Menu / Login Button */}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              {/* User Icon Button */}
              <button
                onClick={toggleUserMenu}
                className="flex items-center text-medium-text hover:text-light-text focus:outline-none"
                aria-label="User menu"
              >
                <FiUser size={24} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-navbar-grey rounded-md shadow-lg py-1 z-50 border border-gray-700">
                  {/* --- DASHBOARD LINK (DESKTOP) --- */}
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-light-text hover:bg-pleasant-grey"
                    onClick={closeMenus} // Close menu on click
                  >
                    Dashboard
                  </Link>
                   {/* --- END DASHBOARD LINK --- */}
                  <Link
                    to="/flicks"
                    className="block px-4 py-2 text-sm text-light-text hover:bg-pleasant-grey"
                    onClick={closeMenus} // Close menu on click
                  >
                    Flicks Club
                  </Link>
                  {/* Add other user links here (e.g., Settings, Profile) */}
                  <button
                    onClick={handleLogout} // handleLogout already closes menus
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-pleasant-grey"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Login Button if not logged in and not loading
            !loading && ( // Only show login if not actively loading session
                <Link
                to="/login"
                className="bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold py-2 px-4 rounded transition duration-200"
                >
                Log In
                </Link>
            )
          )}
           {/* Optional: Show loading indicator while checking session */}
           {loading && <span className="text-medium-text">Checking...</span>}
        </div>

         {/* --- Mobile Right Side (Login/User or Loading Indicator) --- */}
         <div className="md:hidden flex items-center">
            {loading ? (
                <span className="text-medium-text text-sm">Checking...</span>
            ) : !session ? (
                 <Link
                    to="/login"
                    onClick={closeMenus}
                    className="bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold py-1 px-3 text-sm rounded transition duration-200"
                >
                    Log In
                </Link>
            ) : (
                 // When logged in on mobile, the user icon isn't usually shown here,
                 // access is via the main menu button (FiMenu) on the left.
                 // So, render nothing here when logged in.
                 null
            )}
         </div>
      </div>

      {/* --- Mobile Menu (Dropdown) --- */}
      {/* Only render dropdown content if the menu is open */}
      {isMobileMenuOpen && (
        <div className={`absolute top-full left-0 right-0 bg-navbar-grey shadow-lg md:hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Standard Links */}
            <a href="/#features" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={closeMenus}>Features</a>
            <a href="/#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={closeMenus}>Pricing</a>
            <a href="/#about" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={closeMenus}>About</a>

            {/* Conditional Mobile User Links */}
            {/* Only show user links if session exists (and ideally not loading, though session check implies loading is done) */}
            {session && (
                <>
                <hr className="border-gray-600 my-2" /> {/* Separator */}
                {/* --- DASHBOARD LINK (MOBILE) --- */}
                <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text"
                    onClick={closeMenus} // Close menu on click
                >
                    Dashboard
                </Link>
                {/* --- END DASHBOARD LINK --- */}
                <Link
                    to="/flicks"
                    className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text"
                    onClick={closeMenus} // Close menu on click
                >
                    Flicks Club
                </Link>
                {/* Logout Button (Mobile) */}
                <button
                    onClick={handleLogout} // handleLogout already closes menus
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-gray-700 hover:text-red-400"
                >
                    Log Out
                </button>
                </>
            )}
            {/* Note: Login button for mobile is handled in the top bar now */}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;