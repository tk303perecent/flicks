// src/components/HeroSection.jsx
import React from 'react';
import FadeInWhenVisible from './FadeInWhenVisible'; // Animation wrapper for content
import StreamlineAnimation from './StreamlineAnimation'; // Background SVG animation

const HeroSection = () => {
  return (
    // Add relative positioning and overflow hidden for the background animation
    <main className="relative container mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden">

      {/* Background Animation Container */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-25 pointer-events-none"> {/* Position behind, low opacity, non-interactive */}
        <div className="w-[500px] max-w-[90%] h-[300px]"> {/* Constrain SVG size */}
          <StreamlineAnimation />
        </div>
      </div>

      {/* Foreground Text Content Container */}
      <div className="relative z-10 flex flex-col items-center"> {/* Position above animation */}

        {/* Wrap H1 with FadeInWhenVisible */}
        <FadeInWhenVisible className="w-full max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            Streamline Your Legal Workflow with <span className="text-accent-teal">CounselDocs</span>
          </h1>
        </FadeInWhenVisible>

        {/* Wrap P with FadeInWhenVisible */}
        <FadeInWhenVisible className="w-full max-w-3xl">
          <p className="text-lg md:text-xl text-medium-text mb-8">
            The intelligent platform designed for legal professionals to manage documents, collaborate securely, and save valuable time.
          </p>
        </FadeInWhenVisible>

        {/* Wrap Button Div with FadeInWhenVisible */}
        <FadeInWhenVisible>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Primary Button with refined hover */}
            <a
              href="#signup" // Assuming signup is handled elsewhere or later
              className="bg-accent-teal hover:bg-accent-teal-hover text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 ease-out transform hover:scale-105"
            >
              Get Started Free
            </a>
            {/* Secondary Button with refined hover */}
            <a
              href="#features" // Updated href to point to features section
              className="border-2 border-medium-text hover:border-light-text hover:text-light-text text-medium-text font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 ease-out transform hover:scale-105"
            >
              Learn More
            </a>
          </div>
        </FadeInWhenVisible>
      </div> {/* End Foreground Text Content Container */}

    </main>
  );
};

export default HeroSection;