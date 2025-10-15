import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CTA.css';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-particles">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="cta-particle" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 2}s` 
            }} 
          />
        ))}
      </div>
      <div className="cta-container">
        <h2 className="cta-title">
          Ready to Experience<br />
          <span className="cta-title-highlight">Premium Ceylon Tea?</span>
        </h2>
        <p className="cta-description">Join thousands of tea lovers who have discovered the perfect cup</p>
      </div>
    </section>
  );
}
