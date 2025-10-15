import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './publicNav.css';

const PublicNav = ({ scrollToSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="public-nav">
      <div className="public-nav-container">
        <div className="public-nav-logo">
          Maleesha Tea
        </div>
        <div className="public-nav-links">
          {['Home', 'About', 'Tours', 'Contact'].map((item) => (
            <button 
              key={item}
              onClick={() => scrollToSection && scrollToSection(item)}
              className="public-nav-link"
            >
              {item}
              <span className="public-nav-link-underline" />
            </button>
          ))}
          <Link
            to="/login"
            className="public-nav-login-btn"
          >
            Log In
          </Link>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="public-nav-mobile-toggle"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="public-nav-mobile">
          <div className="public-nav-mobile-content">
            {['Home', 'About', 'Tours', 'Contact'].map((item) => (
              <button 
                key={item}
                onClick={() => {
                  scrollToSection && scrollToSection(item);
                  setIsMenuOpen(false);
                }}
                className="public-nav-mobile-link"
              >
                {item}
              </button>
            ))}
            <Link
              to="/login"
              className="public-nav-mobile-login"
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNav;
