'use client';

import { useState } from 'react';
import styles from './content.module.css';
import { FaTrain, FaCar, FaMapMarkerAlt, FaPhone, FaWhatsapp } from 'react-icons/fa';
import carpoolData from '@/data/carpool.json';
import Starfield from '@/components/Starfield';

interface Ride {
  id: number;
  driver: string;
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: string[];
}

export default function AnreiseContent() {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [showRideForm, setShowRideForm] = useState(false);
  const [showRideDetails, setShowRideDetails] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [formData, setFormData] = useState({
    type: 'hin',
    location: '',
    date: '',
    time: '',
    seats: 1,
    name: '',
    contact: ''
  });

  const [rides, setRides] = useState<Ride[]>(carpoolData.rides);

  const festivalDates = [
    { date: '2025-07-30', label: '30. Juli 2025' },
    { date: '2025-07-31', label: '31. Juli 2025' },
    { date: '2025-08-01', label: '1. August 2025' },
    { date: '2025-08-02', label: '2. August 2025' }
  ];

  // Funktion zum Speichern der Daten in der JSON-Datei
  const saveRides = async (updatedRides: Ride[]) => {
    try {
      const response = await fetch('/api/carpool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rides: updatedRides }),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Daten');
      }
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Funktion zum Aktualisieren der Rides
  const updateRides = (updatedRides: Ride[]) => {
    setRides(updatedRides);
    saveRides(updatedRides);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRide: Ride = {
      id: rides.length + 1,
      driver: formData.name,
      start: formData.type === 'hin' ? formData.location : 'Hügel',
      destination: formData.type === 'hin' ? 'Hügel' : formData.location,
      date: formData.date,
      time: formData.time,
      seats: formData.seats,
      contact: formData.contact,
      passengers: []
    };
    
    const updatedRides = [...rides, newRide];
    updateRides(updatedRides);
    
    setShowRideForm(false);
    setFormData({
      type: 'hin',
      location: '',
      date: '',
      time: '',
      seats: 1,
      name: '',
      contact: ''
    });
  };

  const handleJoinRide = (rideId: number) => {
    setShowRideDetails(showRideDetails === rideId ? null : rideId);
  };

  const handleAddPassenger = (rideId: number) => {
    if (!passengerName.trim()) return;
    
    const updatedRides = rides.map(ride => {
      if (ride.id === rideId && ride.passengers.length < ride.seats) {
        return {
          ...ride,
          passengers: [...ride.passengers, passengerName]
        };
      }
      return ride;
    });
    
    updateRides(updatedRides);
    setPassengerName('');
  };

  const handleRemovePassenger = (rideId: number, passengerIndex: number) => {
    const updatedRides = rides.map(ride => {
      if (ride.id === rideId) {
        const newPassengers = [...ride.passengers];
        newPassengers.splice(passengerIndex, 1);
        return {
          ...ride,
          passengers: newPassengers
        };
      }
      return ride;
    });
    
    updateRides(updatedRides);
  };

  const handleDeleteRide = (rideId: number) => {
    if (window.confirm('Bist du sicher, dass du diese Fahrt löschen möchtest?')) {
      const updatedRides = rides.filter(ride => ride.id !== rideId);
      updateRides(updatedRides);
    }
  };

  return (
    <div className="min-h-screen bg-[#460b6c] text-[#ff9900] font-mono">
      <Starfield />
      <div className={styles.container}>
        <h1 className={styles.mainTitle}>Wie kommst du zum Hügel?</h1>
        <p className={styles.subtitle}>
          Ob Bahn, Auto oder Mitfahrgelegenheit – hier findest du alles, damit du entspannt beim Hügelfest ankommst.
        </p>

        <div className={styles.travelOptions}>
          <div 
            className={styles.travelOption}
            onClick={() => setActiveOption(activeOption === 'train' ? null : 'train')}
          >
            <FaTrain className={styles.travelOptionIcon} />
            <h2 className={styles.travelOptionTitle}>Mit dem Zug</h2>
          </div>

          <div 
            className={styles.travelOption}
            onClick={() => setActiveOption(activeOption === 'car' ? null : 'car')}
          >
            <FaCar className={styles.travelOptionIcon} />
            <h2 className={styles.travelOptionTitle}>Mit dem Auto</h2>
          </div>
        </div>

        {/* Train Details */}
        <div className={`${styles.detailsSection} ${activeOption === 'train' ? styles.active : ''}`}>
          <h2 className={styles.detailsTitle}>Mit der Bahn zum Hügel</h2>
          <div className={styles.detailsContent}>
            <p>Der nächste Bahnhof heißt <span className={styles.highlightText}>Truchtlachingen</span>.</p>
            <p>Von da aus holen wir euch gerne ab.</p>
            
            <p>Einfach anrufen oder per WhatsApp kurz schreiben:</p>
            <div className={styles.highlightText}>
              <FaPhone /> 0123 456789
            </div>
            
            <p>Shuttle-Zeiten: ca. 10:00 bis 20:00 Uhr, alle 30 Minuten.</p>
          </div>
        </div>

        {/* Car Details */}
        <div className={`${styles.detailsSection} ${activeOption === 'car' ? styles.active : ''}`}>
          <h2 className={styles.detailsTitle}>Mit dem Auto an den Hügel</h2>
          <div className={styles.detailsContent}>
            <p>Adresse für&apos;s Navi:</p>
            <div className={styles.highlightText}>
              <FaMapMarkerAlt /> Hügelweg 123, 12345 Truchtlachingen
            </div>
            
            <p>Oder einfach auf Google Maps suchen: <span className={styles.highlightText}>Hügelfest 2025</span>.</p>
            
            <p>Parkplätze gibt&apos;s direkt am Gelände – einfach den Schildern folgen.</p>
          </div>

          {/* Ride Share Section */}
          <div className={styles.rideShareSection}>
            <h3 className={styles.rideShareTitle}>Mitfahrbörse</h3>
            <p className={styles.rideShareSubtitle}>
              Du hast noch Platz im Auto? Oder suchst eine Mitfahrt?
              Trag dich hier ein und findet euch zusammen.
            </p>

            <div className={styles.rideCards}>
              {rides.map(ride => (
                <div key={ride.id} className={styles.mobileCard}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Fahrer:</span>
                    <span className={styles.cardValue}>{ride.driver}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Route:</span>
                    <span className={styles.cardValue}>{ride.start} → {ride.destination}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Wann:</span>
                    <span className={styles.cardValue}>{ride.date}, {ride.time}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Plätze:</span>
                    <span className={styles.cardValue}>
                      {ride.passengers.length >= ride.seats ? (
                        <span className={styles.fullText}>voll</span>
                      ) : (
                        `${ride.seats - ride.passengers.length} von ${ride.seats}`
                      )}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleJoinRide(ride.id)}
                    >
                      {showRideDetails === ride.id ? 'Details verbergen' : 'Mitfahren'}
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteRide(ride.id)}
                    >
                      Löschen
                    </button>
                  </div>
                  {showRideDetails === ride.id && (
                    <div className={styles.rideDetails}>
                      <div className={styles.contactInfo}>
                        <p>Kontakt: {ride.contact}</p>
                        <div className={styles.contactActions}>
                          <a 
                            href={`tel:${ride.contact}`}
                            className={styles.contactButton}
                          >
                            <FaPhone /> Anrufen
                          </a>
                          <a 
                            href={`https://wa.me/${ride.contact.replace(/\D/g, '')}`}
                            className={styles.contactButton}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaWhatsapp /> WhatsApp
                          </a>
                        </div>
                      </div>
                      {ride.passengers.length < ride.seats && (
                        <div className={styles.passengerForm}>
                          <input
                            type="text"
                            value={passengerName}
                            onChange={(e) => setPassengerName(e.target.value)}
                            placeholder="Dein Name"
                            className={styles.passengerInput}
                          />
                          <button
                            className={styles.actionButton}
                            onClick={() => handleAddPassenger(ride.id)}
                          >
                            Mitfahren
                          </button>
                        </div>
                      )}
                      {ride.passengers.length > 0 && (
                        <div className={styles.passengerList}>
                          <h4>Mitfahrer:</h4>
                          {ride.passengers.map((passenger, index) => (
                            <div key={index} className={styles.passengerItem}>
                              <span>{passenger}</span>
                              <button
                                className={styles.removeButton}
                                onClick={() => handleRemovePassenger(ride.id, index)}
                              >
                                Entfernen
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              className={styles.actionButton}
              onClick={() => setShowRideForm(!showRideForm)}
            >
              Leute mitnehmen
            </button>

            {showRideForm && (
              <div className={styles.formSection}>
                <h3 className={styles.formTitle}>Fahrt anbieten</h3>
                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label>Willst du Hin- oder Rückfahrt anbieten?</label>
                    <select name="type" value={formData.type} onChange={handleInputChange}>
                      <option value="hin">Hinfahrt</option>
                      <option value="zurueck">Rückfahrt</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Start- oder Zielort (einer ist ja eh Hügel)</label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="z.B. München" 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Datum</label>
                    <select name="date" value={formData.date} onChange={handleInputChange}>
                      <option value="">Bitte wählen</option>
                      {festivalDates.map(date => (
                        <option key={date.date} value={date.date}>{date.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Uhrzeit</label>
                    <input 
                      type="time" 
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Wieviele Plätze hast du frei?</label>
                    <input 
                      type="number" 
                      name="seats"
                      value={formData.seats}
                      onChange={handleInputChange}
                      min="1" 
                      max="8" 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dein Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Kontakt (Handynummer/WhatsApp)</label>
                    <input 
                      type="text" 
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="z.B. 0123 456789" 
                    />
                  </div>
                  <button type="submit" className={styles.actionButton}>
                    Absenden
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-300">
          Bitte beachte, dass wir keine Garantie für die Verfügbarkeit der Mitfahrgelegenheiten übernehmen können.
          Wir empfehlen, die Kontaktdaten der Fahrer*innen zu nutzen, um Details direkt zu klären.
        </p>
      </div>
    </div>
  );
} 