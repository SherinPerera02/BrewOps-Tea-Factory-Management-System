import React from 'react';
import PublicNav from '../components/publicNav';
import Hero from '../components/hero';
import Stats from '../components/stats';
import ToursMap from '../components/toursMap';
import CTA from '../components/CTA';
import Footer from '../components/footer';
import '../styles/HomePage.css';
import '../styles/home-responsive.css';

const Homepage = () => {
  // Function to scroll to different sections
  const scrollToSection = (sectionName) => {
    const sectionId = sectionName.toLowerCase();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="homepage-wrapper">
      <PublicNav scrollToSection={scrollToSection} />

      {/* Floating cursor effect (kept at page level) */}
      <FloatingCursor />

      <Hero />
      
      {/* About section wrapper - points to stats */}
      <div id="about">
        <Stats />
      </div>
      
      {/* Tours section */}
      <ToursMap />
      
      {/* Contact section wrapper */}
      <div id="contact">
        <CTA />
        <Footer />
      </div>
    </div>
  );
};

const FloatingCursor = () => (
  <div className="floating-cursor" style={{ left: -9999, top: -9999 }} />
);
export default Homepage;
