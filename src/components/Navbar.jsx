// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX, FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom'; // Using Link for internal navigation
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMobileMenuOpen(false);
  };

  // Close user menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);


  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Logged out successfully');
      navigate('/'); // Navigate to home after logout
    } catch (error) {
      console.error('Error logging out:', error.message);
      alert(`Error logging out: ${error.message}`);
    }
  };

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
          <Link to="/" className="text-2xl font-bold text-white hover:text-accent-teal">
            CounselDocs
          </Link>
        </div>

        {/* --- Right Side (Desktop) --- */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Standard Links (Using <a> for potential anchor links) */}
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
                  <Link
                    // to="/flicks-club" // Old incorrect path
                    to="/flicks"       // <-- CORRECTED PATH HERE
                    className="block px-4 py-2 text-sm text-light-text hover:bg-pleasant-grey"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Flicks Club
                  </Link>
                  {/* Add other user links here */}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-pleasant-grey"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Login Button if not logged in
            <Link
              to="/login"
              className="bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold py-2 px-4 rounded transition duration-200"
            >
              Log In
            </Link>
          )}
        </div>
      </div>

      {/* --- Mobile Menu (Dropdown) --- */}
      <div className={`absolute top-full left-0 right-0 bg-navbar-grey shadow-lg md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {/* Standard Links */}
          <a href="/#features" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="/#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
          <a href="/#about" className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text" onClick={() => setIsMobileMenuOpen(false)}>About</a>

           {/* Conditional Mobile User Links / Login Button */}
           {session ? (
             <>
               {/* Flicks Club Link (Mobile) */}
               <Link
                 // to="/flicks-club" // Old incorrect path
                 to="/flicks"       // <-- CORRECTED PATH HERE
                 className="block px-3 py-2 rounded-md text-base font-medium text-medium-text hover:bg-gray-700 hover:text-light-text"
                 onClick={() => setIsMobileMenuOpen(false)}
               >
                 Flicks Club
               </Link>
               {/* Logout Button (Mobile) */}
               <button
                 onClick={handleLogout}
                 className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-gray-700 hover:text-red-400"
               >
                 Log Out
               </button>
             </>
           ) : (
             // Login Button (Mobile)
             <Link
               to="/login"
               className="block w-full mt-2 px-3 py-2 text-center bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded transition duration-200"
               onClick={() => setIsMobileMenuOpen(false)}
             >
               Log In
             </Link>
           )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;