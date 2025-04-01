// src/components/Testimonials.jsx
import React from 'react';
import { motion } from 'framer-motion'; // Make sure motion is imported
import FadeInWhenVisible from './FadeInWhenVisible';

const Testimonials = () => {
  // Re-use or define stagger variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2 // Stagger the appearance of testimonials
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Placeholder data (replace with real data later)
  const testimonialData = [
    {
      id: 1,
      imageSrc: "/images/headshot1.jpg", // Path to your image in public/images
      quote: "CounselDocs completely transformed our firm's document workflow. What used to take hours now takes minutes. Indispensable.",
      name: "David Chen",
      title: "Managing Partner, Chen & Associates"
    },
    {
      id: 2,
      imageSrc: "/images/headshot2.jpg", // Path to your image in public/images
      quote: "The collaboration features are incredibly secure and easy to use. Sharing sensitive documents with clients has never been simpler or safer.",
      name: "Michael Rodriguez",
      title: "Senior Attorney, Rodriguez Legal Group"
    },
    {
      id: 3,
      imageSrc: "/images/headshot3.jpg", // Path to your image in public/images
      quote: "As a solo practitioner, staying organized is key. CounselDocs keeps all my cases, deadlines, and documents perfectly streamlined. Highly recommend!",
      name: "Thomas Evans",
      title: "Attorney at Law"
    }
  ];

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-pleasant-grey">
      <div className="container mx-auto px-6">
        {/* Section Heading */}
        <FadeInWhenVisible>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            Hear From Professionals Like You
          </h2>
        </FadeInWhenVisible>

        {/* Testimonials Grid - Apply Stagger Animation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }} // Trigger when grid is slightly visible
        >
          {testimonialData.map((testimonial) => (
            // Individual Testimonial Card
            <motion.div
              key={testimonial.id}
              variants={itemVariants} // Animate each card
              className="bg-navbar-grey p-6 rounded-lg shadow-lg text-center flex flex-col" // Added flex-col
            >
              <img
                // Use the src from placeholder data - **MAKE SURE you have these images in public/images/**
                src={testimonial.imageSrc}
                alt={`Headshot of ${testimonial.name}`}
                // Styling for circular headshot
                className="w-20 h-20 rounded-full object-cover mx-auto mb-5 border-2 border-accent-teal" // Added border
              />
              <p className="text-base italic text-light-text mb-4 flex-grow"> {/* Added flex-grow */}
                "{testimonial.quote}"
              </p>
              <p className="text-medium-text font-semibold mt-auto"> {/* Added mt-auto */}
                 - {testimonial.name}, <span className="block text-sm font-normal">{testimonial.title}</span>
              </p>
            </motion.div>
          ))}
        </motion.div> {/* End Testimonials Grid */}
      </div>
    </section>
  );
};

export default Testimonials;