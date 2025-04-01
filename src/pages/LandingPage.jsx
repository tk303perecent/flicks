// src/pages/LandingPage.jsx
import React from 'react';
import HeroSection from '../components/HeroSection';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import About from '../components/About';
import Testimonials from '../components/Testimonials';

const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <Features />
      <Pricing />
      <About />
      <Testimonials />
    </>
  );
};

export default LandingPage;