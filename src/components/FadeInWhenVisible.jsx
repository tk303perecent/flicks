// src/components/FadeInWhenVisible.jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion'; // <= Import useReducedMotion

const FadeInWhenVisible = ({ children, className }) => {
  const shouldReduceMotion = useReducedMotion(); // <= Use the hook

  // Define base variants
  const baseVariants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 20 }
  };

  // Define variants for reduced motion (just fade)
  const reducedVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      // Conditionally set transition duration to 0 if motion is reduced
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
      // Conditionally choose the variants based on user preference
      variants={shouldReduceMotion ? reducedVariants : baseVariants}
    >
      {children}
    </motion.div>
  );
};

export default FadeInWhenVisible;