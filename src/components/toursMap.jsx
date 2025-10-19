import React from 'react';
import { MapPin } from 'lucide-react';
import './toursMap.css';

export default function ToursMap() {
  const mapCenter = { lat: 6.555103856339234, lng: 80.18148954466014 };
  
  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`, '_blank');
  };

  return (
    <section id="tours" className="tours-section">
      <div className="tours-container">
        <div className="tours-header">
          <h2 className="tours-title">
            <span className="tours-title-line1">Visit Our</span>
            <br />
            <span className="tours-title-line2">Tea Factory</span>
          </h2>
          <p className="tours-subtitle">Located in the heart of Sri Lanka's tea country, experience our heritage firsthand</p>
        </div>

        <div className="tours-grid">
          <div className="map-card-wrapper">
            <div className="map-card">
              <div className="map-placeholder" onClick={openInGoogleMaps}>
                <div className="map-placeholder-content">
                  <MapPin className="map-icon" />
                  <h3 className="map-title">Maleesha Tea Factory</h3>
                  <p className="map-address">Omaththa Road, Agalawatta, Mathugama</p>
                  <button className="map-view-button">
                    View on Google Maps
                  </button>
                </div>

                <div className="live-badge">
                  <div className="live-indicator" />
                  <span className="live-text">Live</span>
                </div>
              </div>

              <div className="card-info">
                <div className="card-info-header">
                  <h4 className="card-info-title">Maleesha Tea Factory</h4>
                  <button 
                    onClick={openInGoogleMaps}
                    className="directions-button"
                  >
                    <MapPin className="directions-icon" />
                    Get Directions
                  </button>
                </div>
                <p className="card-address">Maleesha Tea Factory, Omaththa Road, Agalawatta, Mathugama</p>
                <div className="button-grid">
                  <button 
                    onClick={openInGoogleMaps}
                    className="map-action-button"
                  >
                    Open in Maps
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/@${mapCenter.lat},${mapCenter.lng},3a,75y,90t/data=!3m6!1e1`, '_blank')}
                    className="map-action-button"
                  >
                    Street View
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-card-content">
                <div className="info-icon address">
                  <div className="info-icon-inner" />
                </div>
                <div className="info-text-wrapper">
                  <h4 className="info-title">Factory Address</h4>
                  <p className="info-text">Maleesha Tea Factory, Omaththa Road, Agalawatta, Mathugama, Sri Lanka</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-content">
                <div className="info-icon hours">
                  <div className="info-icon-inner" />
                </div>
                <div className="info-text-wrapper">
                  <h4 className="info-title">Operating Hours</h4>
                  <p className="info-text">Monday - Saturday: 8:00 AM - 5:00 PM</p>
                  <p className="info-text">Sunday: 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-content">
                <div className="info-icon contact">
                  <div className="info-icon-inner" />
                </div>
                <div className="info-text-wrapper">
                  <h4 className="info-title">Contact Info</h4>
                  <p className="info-text">+94 XX XXX XXXX</p>
                  <p className="info-text">info@brewopstea.lk</p>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="primary-button">Schedule Factory Tour</button>
              <button className="secondary-button">Download Location Details</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
