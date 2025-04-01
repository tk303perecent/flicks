// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // <= IMPORT Link

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navbar-grey py-8">
      <div className="container mx-auto px-6 text-center text-medium-text">
        <div className="mb-4">
          {/* Use Link for internal routing */}
          <Link to="/privacy" className="mx-2 hover:text-light-text">Privacy Policy</Link>
          |
          <Link to="/terms" className="mx-2 hover:text-light-text">Terms of Service</Link>
        </div>
        <p>© {currentYear} CounselDocs. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;