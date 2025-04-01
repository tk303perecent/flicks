// src/components/BackgroundPosters.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Simple component to render the floating images
function BackgroundPosters({ imageUrls = [] }) {
  // Don't render anything if there are no URLs to prevent errors
  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  return (
    // Container covering the whole screen, behind content, non-interactive
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {imageUrls.map((url, index) => (
        <motion.img
          // Using URL + index might be needed if duplicate filenames could occur temporarily
          // If filenames are guaranteed unique (e.g., based on UUID), URL alone is fine.
          key={url + index}
          src={url}
          alt="" // Alt text is empty as these are purely decorative
          // Basic styling - adjust size, opacity as needed
          className="absolute block opacity-10 sm:opacity-15 w-32 h-auto sm:w-48 rounded shadow-lg"
          // Framer Motion animation properties
          initial={{ // Random starting position off-screen or faded
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            scale: Math.random() * 0.4 + 0.6, // Random scale between 0.6 and 1.0
            opacity: 0,
          }}
          animate={{ // Animate to a new random position and fade in/out
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            opacity: [0, 0.15, 0.15, 0.15, 0], // Fade in, stay visible, fade out
            scale: Math.random() * 0.4 + 0.6,
          }}
          transition={{
            duration: Math.random() * 25 + 35, // Random duration (35-60 seconds)
            repeat: Infinity, // Loop forever
            repeatType: "loop", // Jump back to start smoothly (or use "mirror")
            ease: "linear", // Smooth, constant movement
            delay: Math.random() * 10, // Stagger the start time of each image
          }}
          // Hide the image element if the file fails to load (e.g., wrong filename)
          onError={(e) => {
            e.target.style.display = 'none';
            console.warn(`Background poster failed to load: ${url}`);
          }}
          loading="lazy" // Lazy load images
        />
      ))}
    </div>
  );
}

export default BackgroundPosters;