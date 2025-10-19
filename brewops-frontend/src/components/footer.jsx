import React from 'react';
import { Mail, Phone, MapPin, Leaf } from 'lucide-react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          {/* Left Section - Company Info */}
          <div className="footer-left">
            <div className="footer-header">
              <Leaf className="footer-leaf-icon" />
              <h3 className="footer-title">Maleesha Tea Factory</h3>
            </div>
            
            <p className="footer-description">
              Crafting premium Ceylon tea with passion and tradition since generations. Experience the authentic taste of Sri Lankan highlands in every cup.
            </p>
            
            {/* Contact Information */}
            <div className="footer-contact-row">
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon" />
                <div>
                  <span className="footer-contact-label">Email</span>
                  <span className="footer-contact-value">brewopsTea@gmail.com</span>
                </div>
              </div>
              
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon" />
                <div>
                  <span className="footer-contact-label">Phone</span>
                  <span className="footer-contact-value">+94 711 738 453</span>
                </div>
              </div>
              
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon" />
                <div>
                  <span className="footer-contact-label">Location</span>
                  <span className="footer-contact-value">Omattha Road, Agalawattha<br />Mathugama, Sri Lanka</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Brand Card */}
          <div className="footer-right">
            <div className="footer-brand-card">
              <div className="footer-brand-header">
                <Leaf className="footer-brand-leaf" />
                <h1 className="footer-brand-name">BrewOps</h1>
              </div>
              <p className="footer-brand-tagline">PREMIUM CEYLON TEA</p>
              <div className="footer-brand-dots">
                <div className="footer-dot footer-dot-1"></div>
                <div className="footer-dot footer-dot-2"></div>
                <div className="footer-dot footer-dot-3"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">© 2025 Maleesha Tea Factory. Proudly brewing excellence.</p>
          <div className="footer-links">
            <span className="footer-link">Quality</span>
            <span className="footer-link">Tradition</span>
            <span className="footer-link">Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;