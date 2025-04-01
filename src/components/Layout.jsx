// src/components/Layout.jsx
import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom'; // Ensure ScrollRestoration is imported
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet /> {/* Page content renders here */}
      </main>
      <Footer />
      <ScrollRestoration /> {/* Ensure this is still here */}
    </>
  );
};

export default Layout;