// src/components/PrivacyPolicy.jsx
import React from 'react';

const PrivacyPolicy = () => {
  return (
    // This component would typically be rendered on its own route, e.g., /privacy
    // Styling assumes it might be shown within the main layout temporarily or on a dedicated page.
    <div className="bg-pleasant-grey min-h-screen py-16 md:py-24 text-light-text">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-medium-text pb-4">
          Privacy Policy
        </h1>
        <div className="space-y-6 text-medium-text prose prose-invert prose-lg max-w-none"> {/* Basic prose styling */}
          <p>
            <strong>Last Updated: [Insert Date]</strong>
          </p>
          <p>
            [Your Company Name] ("us", "we", or "our") operates the CounselDocs website and service (the "Service").
          </p>
          <p>
            This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data. <strong>This is placeholder text. You must replace this with a legally compliant privacy policy drafted or reviewed by legal counsel.</strong>
          </p>

          <h2>Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you. [Placeholder - Describe types of data collected: Personal Data, Usage Data, Tracking & Cookies Data].
          </p>

          <h2>Use of Data</h2>
          <p>
            [Your Company Name] uses the collected data for various purposes: [Placeholder - List purposes: To provide and maintain the Service, To notify you about changes, To allow participation in interactive features, To provide customer care and support, To provide analysis, To monitor usage, To detect/prevent technical issues].
          </p>

          <h2>Security of Data</h2>
          <p>
            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. [Placeholder - Briefly describe security measures].
          </p>

          {/* Add other standard sections: Transfer of Data, Disclosure of Data, Service Providers, Links to Other Sites, Children's Privacy, Changes to This Policy, Contact Us */}

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us: [Placeholder - Provide Contact Information].
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;