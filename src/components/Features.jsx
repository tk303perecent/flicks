// src/components/Features.jsx
import React from 'react';
import { motion } from 'framer-motion';
import FadeInWhenVisible from './FadeInWhenVisible';
import { FiFileText, FiUsers, FiCheckSquare } from 'react-icons/fi';

const Features = () => {
  // Stagger animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2 // Time delay between each child animating in
      }
    }
  };

  // Variants for individual feature cards
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section id="features" className="py-16 md:py-24 bg-navbar-grey">
      <div className="container mx-auto px-6 text-center">
        {/* Animate the heading separately */}
         <FadeInWhenVisible>
           <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
             Features Designed for Peak Legal Efficiency
           </h2>
        </FadeInWhenVisible>

        {/* Stagger container for the grid */}
        <motion.div
           className="grid grid-cols-1 md:grid-cols-3 gap-8"
           variants={containerVariants}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.1 }}
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="bg-pleasant-grey p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <FiFileText size={40} className="text-accent-teal mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Intelligent Document Management</h3>
            {/* Updated Placeholder Text */}
            <p className="text-medium-text">
              Stop searching, start finding. Instantly locate any case file, pleading, or contract with powerful search and intuitive organization. Version control included.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="bg-pleasant-grey p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <FiUsers size={40} className="text-accent-teal mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Seamless & Secure Collaboration</h3>
            {/* Updated Placeholder Text */}
            <p className="text-medium-text">
              Work securely with clients, co-counsel, and staff. Share documents, gather feedback, and manage permissions with bank-level encryption and granular controls.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="bg-pleasant-grey p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <FiCheckSquare size={40} className="text-accent-teal mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Automated Task & Deadline Tracking</h3>
            {/* Updated Placeholder Text */}
            <p className="text-medium-text">
              Never miss a crucial date. Assign tasks, set reminders, and automatically track court deadlines based on rules, ensuring your cases stay on schedule.
            </p>
          </motion.div>
        </motion.div> {/* End Stagger Container */}
      </div>
    </section>
  );
};

export default Features;