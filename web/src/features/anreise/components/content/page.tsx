'use client';

import { useState, useEffect } from 'react';
import styles from './content.module.css';
import { Train, Car, MapPin, Phone, PhoneCall } from 'lucide-react';

interface Ride {
  _id?: string;
  driver: string;
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: string[];
}

interface ContentProps {
  allowClipboard?: boolean;
}

export default function AnreiseContent({ allowClipboard = false }: ContentProps) {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [showRideForm, setShowRideForm] = useState(false);
  const [showRideDetails, setShowRideDetails] = useState<string | null>(null);
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

  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    const loadCarpoolData = async () => {
      try {
        const response = await fetch('/api/carpool');
        if (response.ok) {
          const data = await response.json();
          setRides(data.rides);
        } else {
          console.warn('Carpool-Daten nicht gefunden, verwende leeres Array');
          setRides([]);
        }
      } catch (error) {
        console.warn('Fehler beim Laden der Carpool-Daten, verwende leeres Array');
        setRides([]);
      }
    };

    loadCarpoolData();
  }, []);

  const festivalDates = [
    { date: '2025-07-30', label: '30. Juli 2025' },
    { date: '2025-07-31', label: '31. Juli 2025' },
    { date: '2025-08-01', label: '1. August 2025' },
    { date: '2025-08-02', label: '2. August 2025' }
  ];

  // Funktion zum Speichern der Daten in der JSON-Datei
  const saveRides = async (updatedRides: Ride[]) => {
    try {
      const ride = updatedRides[0];
      const method = ride._id ? 'PUT' : 'POST';
      const url = '/api/carpool';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ride),
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
      driver: formData.name,
      start: formData.type === 'hin' ? formData.location : 'Hügel',
      destination: formData.type === 'hin' ? 'Hügel' : formData.location,
      date: formData.date,
      time: formData.time,
      seats: formData.seats,
      contact: formData.contact,
      passengers: []
    };
    
    // Speichere die Fahrt in der Datenbank
    saveRides([newRide]);
    
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

  const handleJoinRide = (rideId: string) => {
    setShowRideDetails(showRideDetails === rideId ? null : rideId);
  };

  const handleAddPassenger = (rideId: string) => {
    if (!passengerName.trim()) return;
    
    const updatedRides = rides.map(ride => {
      if (ride._id === rideId && ride.passengers.length < ride.seats) {
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

  const handleRemovePassenger = (rideId: string, passengerIndex: number) => {
    const updatedRides = rides.map(ride => {
      if (ride._id === rideId) {
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

  const handleDeleteRide = async (rideId: string) => {
    if (window.confirm('Bist du sicher, dass du diese Fahrt löschen möchtest?')) {
      try {
        const response = await fetch(`/api/carpool?id=${rideId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Löschen der Fahrt');
        }
        
        const updatedRides = rides.filter(ride => ride._id !== rideId);
        setRides(updatedRides);
      } catch (error) {
        console.error('Fehler:', error);
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 p-4 sm:p-6">
        <p className={styles.subtitle}>
          Ob Bahn, Auto oder Mitfahrgelegenheit – hier findest du alles, damit du entspannt beim Hügelfest ankommst.
        </p>

        <div className={styles.travelOptions}>
          <div 
            className={styles.travelOption}
            onClick={() => setActiveOption(activeOption === 'train' ? null : 'train')}
          >
            <Train className={styles.travelOptionIcon} />
            <h2 className={styles.travelOptionTitle}>Mit der Bahn</h2>
          </div>

          <div 
            className={styles.travelOption}
            onClick={() => setActiveOption(activeOption === 'car' ? null : 'car')}
          >
            <Car className={styles.travelOptionIcon} />
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
              <Phone /> 0123 456789
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
              <MapPin /> Hügelweg 123, 12345 Truchtlachingen
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
                <div key={ride._id} className={styles.mobileCard}>
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
                      onClick={() => ride._id && handleJoinRide(ride._id)}
                    >
                      {showRideDetails === ride._id ? 'Details verbergen' : 'Mitfahren'}
                    </button>
                    {showRideDetails === ride._id && (
                      <div className={styles.rideDetails}>
                        <div className={styles.passengerSection}>
                          <h4>Mitfahrer</h4>
                          <div className={styles.passengerList}>
                            {ride.passengers.map((passenger, index) => (
                              <div key={index} className={styles.passengerItem}>
                                {passenger}
                                <button
                                  className={styles.removeButton}
                                  onClick={() => ride._id && handleRemovePassenger(ride._id, index)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          {ride.passengers.length < ride.seats && (
                            <div className={styles.addPassenger}>
                              <input
                                type="text"
                                value={passengerName}
                                onChange={(e) => setPassengerName(e.target.value)}
                                placeholder="Dein Name"
                                className={styles.passengerInput}
                              />
                              <button
                                className={styles.addButton}
                                onClick={() => ride._id && handleAddPassenger(ride._id)}
                              >
                                Hinzufügen
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className={styles.deleteButton}
                          onClick={() => ride._id && handleDeleteRide(ride._id)}
                        >
                          Fahrt löschen
                        </button>
                      </div>
                    )}
                  </div>
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