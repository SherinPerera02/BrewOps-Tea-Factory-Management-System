import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Play, Pause, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './hero.css';

export default function Hero() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroImages = ['/background.jpg','/tea_1.jpg','/tea.jpg','/pic_01.jpg','/pic_02.jpg'];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % heroImages.length), 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section id="home" className="hero-section">
      <div className="hero-background">
        {heroImages.map((img, idx) => (
          <div 
            key={idx} 
            className={`hero-slide ${idx === currentSlide ? 'active' : 'inactive'}`} 
            style={{ 
              backgroundImage: `url('${img}')`, 
              transform: `translateY(${scrollY * 0.5}px) scale(${idx === currentSlide ? 1 : 1.1})` 
            }} 
          />
        ))}
        <div className="hero-gradient-overlay" />
      </div>

      <div className="hero-particles">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="hero-particle" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 3}s`, 
              animationDuration: `${3 + Math.random() * 2}s` 
            }} 
          />
        ))}
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          <span className="hero-title-gradient">CRAFT</span>
          <br />
          <span className="hero-title-dark">THE FUTURE</span>
        </h1>
        <p className="hero-subtitle">Where ancient Ceylon tea traditions meet cutting-edge innovation.</p>

        <div className="hero-buttons">
          <button 
            onClick={() => navigate('/login')}
            className="hero-primary-button"
          >
            <span className="hero-primary-button-content">
              Start Journey 
              <ChevronRight className="hero-button-icon" />
            </span>
            <div className="hero-primary-button-bg" />
          </button>

          <button 
            className="hero-secondary-button" 
            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
          >
            {isVideoPlaying ? <Pause /> : <Play />} 
            Watch Story
          </button>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span className="hero-scroll-text">Scroll to explore</span>
        <ArrowDown className="hero-scroll-icon" />
      </div>

      <div className="hero-slide-indicators">
        {heroImages.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrentSlide(idx)} 
            className={`hero-slide-indicator ${idx === currentSlide ? 'active' : ''}`} 
          />
        ))}
      </div>
    </section>
  );
}
