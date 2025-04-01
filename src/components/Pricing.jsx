// src/components/Pricing.jsx
import React from 'react';
import { motion } from 'framer-motion';
import FadeInWhenVisible from './FadeInWhenVisible';
import { FiCheck } from 'react-icons/fi'; // Checkmark icon

const Pricing = () => {
  // Stagger animation for pricing cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  // Placeholder Pricing Data
  const pricingTiers = [
    {
      id: 'solo',
      name: 'Solo Practitioner',
      price: '$49',
      frequency: '/ month',
      description: 'Ideal for individual lawyers getting started.',
      features: [
        'Up to 500 Documents',
        'Secure Cloud Storage (10GB)',
        'Basic Collaboration Tools',
        'Task Management',
        'Email Support'
      ],
      buttonText: 'Get Started',
      highlight: false,
    },
    {
      id: 'team',
      name: 'Small Firm / Team',
      price: '$89',
      frequency: '/ month',
      description: 'Perfect for growing firms and teams.',
      features: [
        'Unlimited Documents',
        'Secure Cloud Storage (50GB)',
        'Advanced Collaboration',
        'Deadline Tracking & Rules',
        'Priority Email & Chat Support'
      ],
      buttonText: 'Choose Team Plan',
      highlight: true, // Highlight this plan
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Contact Us',
      frequency: '',
      description: 'Tailored solutions for large firms.',
      features: [
        'Everything in Team, plus:',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Advanced Security & Compliance',
        'Personalized Onboarding'
      ],
      buttonText: 'Request Demo',
      highlight: false,
    }
  ];


  return (
    <section id="pricing" className="py-16 md:py-24 bg-pleasant-grey"> {/* Use ID for linking */}
      <div className="container mx-auto px-6 text-center">
        <FadeInWhenVisible>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-medium-text mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your firm's needs. No hidden fees, cancel anytime.
          </p>
        </FadeInWhenVisible>

        {/* Pricing Grid - Staggered */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.id}
              variants={itemVariants}
              className={`bg-navbar-grey p-8 rounded-lg shadow-lg flex flex-col ${tier.highlight ? 'border-2 border-accent-teal relative' : 'border border-gray-700'}`} // Highlight style
            >
              {/* Highlight Badge */}
              {tier.highlight && (
                <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-accent-teal text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
              <p className="text-medium-text mb-4 h-12">{tier.description}</p> {/* Fixed height for description */}

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-medium-text">{tier.frequency}</span>
              </div>

              <ul className="text-left text-light-text space-y-2 mb-8 flex-grow">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <FiCheck className="text-accent-teal w-5 h-5 mr-2 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#signup" // Link to signup or specific plan signup page later
                className={`mt-auto w-full inline-block py-3 px-6 rounded-lg font-semibold transition-all duration-200 ease-out transform hover:scale-105 ${tier.highlight
                    ? 'bg-accent-teal hover:bg-accent-teal-hover text-white'
                    : 'bg-pleasant-grey hover:bg-gray-600 text-light-text border border-medium-text'
                  }`}
              >
                {tier.buttonText}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;