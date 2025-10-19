import React, { useEffect, useRef, useState } from 'react';
import CountUp from './CountUp';
import './stats.css';

export default function Stats() {
  const statsRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.3 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { number: 50, suffix: '+', label: 'Years of Excellence' },
    { number: 1000, suffix: '+', label: 'Tea Pluckers Supported' },
    { number: 500, suffix: 'K+', label: 'Cups Served Daily' },
    { number: 25, suffix: '+', label: 'Countries Exported' }
  ];

  return (
    <section ref={statsRef} className="stats-section" id="stats">
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <div className="stat-number">
                <span className="stat-number-gradient">
                  {visible ? <CountUp end={stat.number} suffix={stat.suffix} /> : '0'}
                </span>
              </div>
              <p className="stat-label">{stat.label}</p>
              <div className="stat-underline" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
