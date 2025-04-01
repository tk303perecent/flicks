// src/components/TermsOfService.jsx
import React from 'react';

const TermsOfService = () => {
  return (
    // This component would typically be rendered on its own route, e.g., /terms
    <div className="bg-pleasant-grey min-h-screen py-16 md:py-24 text-light-text">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-medium-text pb-4">
          Terms of Service
        </h1>
        <div className="space-y-6 text-medium-text prose prose-invert prose-lg max-w-none"> {/* Basic prose styling */}
           <p>
            <strong>Last Updated: [Insert Date]</strong>
          </p>
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the CounselDocs website and service (the "Service") operated by [Your Company Name] ("us", "we", or "our").
          </p>
          <p>
            Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service. <strong>This is placeholder text. You must replace this with legally compliant Terms of Service drafted or reviewed by legal counsel.</strong>
          </p>

          <h2>Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. [Placeholder - Detail account responsibilities, security].
          </p>

          <h2>Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of [Your Company Name] and its licensors. [Placeholder].
          </p>

          {/* Add other standard sections: User Content, Prohibited Uses, Termination, Limitation of Liability, Disclaimer, Governing Law, Changes, Contact Us */}

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us: [Placeholder - Provide Contact Information].
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;