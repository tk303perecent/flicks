// src/components/About.jsx
import React from 'react';
// Make sure FadeInWhenVisible is imported if you are using it directly inside About
import FadeInWhenVisible from './FadeInWhenVisible';

const About = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-navbar-grey"> {/* Use ID for linking */}
      <div className="container mx-auto px-6">
        <FadeInWhenVisible> {/* Assuming you wrap content like this */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            About CounselDocs
          </h2>
        </FadeInWhenVisible>

        <FadeInWhenVisible> {/* Assuming you wrap content like this */}
          <div className="max-w-4xl mx-auto text-lg text-light-text space-y-6">
            <p>
              CounselDocs was founded by legal and technology professionals who saw firsthand the challenges modern law firms face with managing overwhelming amounts of documentation, ensuring secure collaboration, and meeting critical deadlines.
            </p>
            <p className="text-accent-teal font-semibold text-xl">
              Our mission is simple: To empower legal professionals with intelligent, intuitive, and secure tools that streamline workflows, reduce administrative burden, and allow them to focus on what they do best – practicing law.
            </p>
            <p>
              We believe technology should simplify, not complicate. That's why CounselDocs is built with a user-centric approach, focusing on ease of use, robust security, and features that directly address the pain points of the legal industry. We are committed to continuous improvement and partnering with our users to build the future of legal practice management.
            </p>
          </div>
        </FadeInWhenVisible>
      </div>
    </section>
  );
};

export default About;