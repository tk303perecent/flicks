// src/components/StreamlineAnimation.jsx
import React from 'react';
import { motion } from 'framer-motion';

// --- Configuration ---
const NUM_RECTS = 50; // How many rectangles
const RECT_WIDTH = 10;
const RECT_HEIGHT = 14;
const VIEWBOX_WIDTH = 400; // Width of the SVG canvas
const VIEWBOX_HEIGHT = 200; // Height of the SVG canvas
const SPREAD = 150; // How spread out the initial clutter is around the center
const FINAL_LINE_Y = VIEWBOX_HEIGHT / 2; // Vertical position of the final line
const FINAL_SPACING = 15; // Spacing between rects in the final line

// --- Helper to generate initial random positions ---
const generateInitialState = () => {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * SPREAD;
  return {
    x: VIEWBOX_WIDTH / 2 + Math.cos(angle) * radius - RECT_WIDTH / 2,
    y: VIEWBOX_HEIGHT / 2 + Math.sin(angle) * radius - RECT_HEIGHT / 2,
    opacity: 0.3 + Math.random() * 0.4, // Start semi-transparent
    rotate: Math.random() * 60 - 30, // Slight random initial rotation
  };
};

// --- Helper to calculate final streamlined positions ---
const calculateTargetState = (index) => {
  const totalWidth = (NUM_RECTS - 1) * FINAL_SPACING;
  const startX = (VIEWBOX_WIDTH - totalWidth) / 2;
  return {
    x: startX + index * FINAL_SPACING,
    y: FINAL_LINE_Y - RECT_HEIGHT / 2,
    opacity: 0.6, // End slightly more opaque
    rotate: 0, // Straighten up
  };
};

// --- The Animation Component ---
const StreamlineAnimation = () => {
  const rects = React.useMemo(() => {
    const generatedRects = [];
    for (let i = 0; i < NUM_RECTS; i++) {
      generatedRects.push({
        id: i,
        initial: generateInitialState(),
        target: calculateTargetState(i),
      });
    }
    return generatedRects;
  }, []); // Use useMemo to generate only once

  return (
    // SVG container - preserveAspectRatio helps with scaling
    <motion.svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full text-medium-text" // Use Tailwind color, full size of parent
      aria-hidden="true" // Hide from screen readers
    >
      {rects.map((rect, i) => (
        <motion.rect
          key={rect.id}
          initial={rect.initial}
          animate={{ // Animate on load/mount
            ...rect.target,
            transition: {
              duration: 2.0,        // Animation duration
              delay: 0.5 + i * 0.03, // Stagger start times slightly after initial delay
              ease: [0.43, 0.13, 0.23, 0.96], // Custom cubic bezier for smooth ease-in-out
            },
          }}
          width={RECT_WIDTH}
          height={RECT_HEIGHT}
          fill="currentColor" // Inherit color from SVG parent (text-medium-text)
          rx="1" // Slightly rounded corners
        />
      ))}
    </motion.svg>
  );
};

export default StreamlineAnimation;