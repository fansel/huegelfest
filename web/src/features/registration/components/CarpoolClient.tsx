'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Car, MapPin, Clock, Users, Phone, Plus, Trash2, Calendar, ArrowRight, ArrowLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getRidesAction } from '../actions/getRides';
import { createRideAction } from '../actions/createRide';
import { updateRideAction } from '../actions/updateRide';
import { deleteRideAction } from '../actions/deleteRide';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { OfflineDisabled } from '@/shared/components/ui/OfflineDisabledButton';
import { useAuth } from '@/features/auth/AuthContext';
import { checkRegistrationStatusAction } from '../actions/register';
import useSWR from 'swr';

interface Ride {
  _id?: string;
  driver: string;
  direction: 'hinfahrt' | 'rückfahrt';
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: { name: string, contact?: string }[];
}

interface CarpoolClientProps {
  initialRides: Ride[];
}

const festivalDates = [
  { date: '2025-07-30', label: '30. Juli 2025' },
  { date: '2025-07-31', label: '31. Juli 2025' },
  { date: '2025-08-01', label: '1. August 2025' },
  { date: '2025-08-02', label: '2. August 2025' },
  { date: '2025-08-03', label: '3. August 2025' },
];

const festivalLocation = 'Hügelfest';

export default function CarpoolClient({ initialRides }: CarpoolClientProps) {
  const { deviceType } = useDeviceContext();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();
  const isMobile = deviceType === 'mobile';
  
  // SWR für Carpool-Daten mit verbessertem Offline-Caching
  const { data: rides = [], mutate, isLoading } = useSWR<Ride[]>(
    'carpool-rides',
    isOnline ? getRidesAction : null, // Nur online fetchen
    {
      fallbackData: initialRides, // Verwende initialRides als Fallback
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 Sekunden
      errorRetryInterval: isOnline ? 5000 : 30000, // Längere Retry-Zeit offline
      shouldRetryOnError: isOnline, // Kein Retry offline
    }
  );
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [showPassengerDialog, setShowPassengerDialog] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('all');
  const [filterDirection, setFilterDirection] = useState('all');
  const [registeredName, setRegisteredName] = useState<string>('');
  
  const [newRide, setNewRide] = useState<Omit<Ride, '_id' | 'passengers'>>({
    driver: '',
    direction: 'hinfahrt',
    start: '',
    destination: festivalLocation,
    date: festivalDates[1].date,
    time: '',
    seats: 1,
    contact: '',
  });

  const [passengerContact, setPassengerContact] = useState('');
  const [showPassengerContact, setShowPassengerContact] = useState<{ name: string, contact?: string } | null>(null);

  // Lade Anmeldedaten für automatische Namens-Befüllung
  useEffect(() => {
    const loadRegistrationData = async () => {
      if (user && isOnline) {
        try {
          const statusResult = await checkRegistrationStatusAction();
          if (statusResult.isRegistered && statusResult.name) {
            setRegisteredName(statusResult.name);
          }
        } catch (error) {
          console.log('Registrierungsstatus konnte nicht geladen werden (vermutlich offline)');
        }
      }
    };

    loadRegistrationData();
  }, [user, isOnline]);

  // Automatische Befüllung des Fahrernamens beim Öffnen des Dialogs
  useEffect(() => {
    if (showCreateDialog && registeredName && !newRide.driver) {
      setNewRide(prev => ({ ...prev, driver: registeredName }));
    }
  }, [showCreateDialog, registeredName, newRide.driver]);

  // Automatische Befüllung des Mitfahrernamens beim Öffnen des Dialogs
  useEffect(() => {
    if (showPassengerDialog && registeredName && !passengerName) {
      setPassengerName(registeredName);
    }
  }, [showPassengerDialog, registeredName, passengerName]);

  // Filter Logic
  const filteredRides = rides.filter(ride => {
    const matchesDate = !filterDate || filterDate === 'all' || ride.date === filterDate;
    const matchesDirection = !filterDirection || filterDirection === 'all' || ride.direction === filterDirection;
    return matchesDate && matchesDirection;
  });

  const handleCreateRide = async () => {
    const requiredLocation = newRide.direction === 'hinfahrt' ? newRide.start : newRide.destination;
    if (!newRide.driver || !requiredLocation || !newRide.contact || !newRide.time) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      const rideData = { ...newRide, passengers: [] };
      await createRideAction(rideData);
      toast.success('Fahrt erfolgreich erstellt!');
      setShowCreateDialog(false);
      setNewRide({
        driver: registeredName || '',
        direction: 'hinfahrt',
        start: '',
        destination: festivalLocation,
        date: festivalDates[1].date,
        time: '',
        seats: 1,
        contact: '',
      });
      mutate();
    } catch (error) {
      console.error('Fehler beim Erstellen der Fahrt:', error);
      toast.error('Fehler beim Erstellen der Fahrt');
    }
  };

  const handleJoinRide = async (rideId: string) => {
    if (!passengerName.trim()) {
      toast.error('Bitte Namen eingeben');
      return;
    }

    try {
      const ride = rides.find(r => r._id === rideId);
      if (!ride) return;

      if (ride.passengers.some(p => p.name === passengerName.trim())) {
        toast.error('Du bist bereits angemeldet');
        return;
      }

      if (ride.passengers.length >= ride.seats) {
        toast.error('Fahrt ist bereits voll');
        return;
      }

      const updatedPassengers = [...ride.passengers, { name: passengerName.trim(), contact: passengerContact.trim() }];
      await updateRideAction(rideId, { passengers: updatedPassengers });
      
      toast.success('Du bist jetzt als Mitfahrer angemeldet!');
      setPassengerName(registeredName || '');
      setPassengerContact('');
      setShowPassengerDialog(null);
      mutate();
    } catch (error) {
      console.error('Fehler beim Anmelden:', error);
      toast.error('Fehler beim Anmelden');
    }
  };

  const handleRemovePassenger = async (rideId: string, passengerToRemove: string) => {
    try {
      const ride = rides.find(r => r._id === rideId);
      if (!ride) return;

      const updatedPassengers = ride.passengers.filter(p => p.name !== passengerToRemove);
      await updateRideAction(rideId, { passengers: updatedPassengers });
      
      toast.success('Mitfahrer entfernt');
      mutate();
    } catch (error) {
      console.error('Fehler beim Entfernen:', error);
      toast.error('Fehler beim Entfernen');
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Fahrt wirklich löschen?')) return;

    try {
      await deleteRideAction(rideId);
      toast.success('Fahrt gelöscht');
      mutate();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleDirectionChange = (direction: 'hinfahrt' | 'rückfahrt') => {
    if (direction === 'hinfahrt') {
      setNewRide({
        ...newRide,
        direction,
        start: '',
        destination: festivalLocation
      });
    } else {
      setNewRide({
        ...newRide,
        direction,
        start: festivalLocation,
        destination: ''
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Sticky Filter Header im Timeline-Stil */}
      <div className={`sticky ${!isMobile ? 'top-16' : 'top-0'} z-10 bg-[#460b6c]/90 backdrop-blur-sm py-2 px-4`}>
        {/* Filter-Buttons im Timeline-Stil */}
        <div className="flex justify-center">
          <div className="flex space-x-2 overflow-x-auto pb-2 px-4">
            <button
              onClick={() => setFilterDirection('all')}
              className={`flex-shrink-0 p-2.5 rounded-full transition-colors duration-200 ${
                filterDirection === 'all'
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
              title="Alle Richtungen"
            >
              <Car className="text-lg" />
            </button>
            <button
              onClick={() => setFilterDirection('hinfahrt')}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 ${
                filterDirection === 'hinfahrt'
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
              title="Hinfahrt"
            >
              Hinfahrt
            </button>
            <button
              onClick={() => setFilterDirection('rückfahrt')}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 ${
                filterDirection === 'rückfahrt'
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
              title="Rückfahrt"
            >
              Rückfahrt
            </button>
          </div>
        </div>

        {/* Datum-Filter */}
        <div className="flex justify-center mt-2">
          <div className="flex space-x-2 overflow-x-auto pb-2 px-4">
            <button
              onClick={() => setFilterDate('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 ${
                filterDate === 'all'
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
            >
              Alle Tage
            </button>
            {festivalDates.map(({ date, label }) => (
              <button
                key={date}
                onClick={() => setFilterDate(date)}
                className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 ${
                  filterDate === date
                    ? 'bg-[#ff9900] text-[#460b6c]'
                    : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
                }`}
              >
                {label.split(' ')[0]} {label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Ride Button */}
      <div className="px-4 py-4">
        <OfflineDisabled actionType="write" showIcon={false}>
          <Dialog open={showCreateDialog && isOnline} onOpenChange={(open) => isOnline && setShowCreateDialog(open)}>
            <DialogTrigger asChild>
              <Button 
                className={`w-full font-semibold py-3 text-base ${
                  isOnline 
                    ? 'bg-[#ff9900] hover:bg-[#ff9900]/80 text-[#460b6c]' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                disabled={!isOnline}
                title={!isOnline ? 'Fahrt anbieten ist nur online möglich' : undefined}
              >
                <Plus className="h-5 w-5 mr-2" />
                {isOnline ? 'Fahrt anbieten' : 'Fahrt anbieten (offline)'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#460b6c] border-[#ff9900]/20">
              <DialogHeader>
                <DialogTitle className="text-[#ff9900] text-xl text-center">Neue Fahrt erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#ff9900]">Fahrer *</Label>
                  <Input
                    value={newRide.driver}
                    onChange={(e) => setNewRide({ ...newRide, driver: e.target.value })}
                    placeholder="Dein Name"
                    className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                  />
                </div>
                
                <div>
                  <Label className="text-[#ff9900]">Richtung *</Label>
                  <Select value={newRide.direction} onValueChange={handleDirectionChange}>
                    <SelectTrigger className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#460b6c] border-[#ff9900]/30">
                      <SelectItem value="hinfahrt" className="text-white hover:bg-[#ff9900]/20">Hinfahrt (zum Festival)</SelectItem>
                      <SelectItem value="rückfahrt" className="text-white hover:bg-[#ff9900]/20">Rückfahrt (vom Festival)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newRide.direction === 'hinfahrt' ? (
                  <div>
                    <Label className="text-[#ff9900]">Abfahrtsort *</Label>
                    <Input
                      value={newRide.start}
                      onChange={(e) => setNewRide({ ...newRide, start: e.target.value })}
                      placeholder="z.B. München, Bahnhof"
                      className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-[#ff9900]">Zielort *</Label>
                    <Input
                      value={newRide.destination}
                      onChange={(e) => setNewRide({ ...newRide, destination: e.target.value })}
                      placeholder="z.B. München, Bahnhof"
                      className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-[#ff9900]">Erreichbar über / Nachricht *</Label>
                  <Textarea
                    value={newRide.contact}
                    onChange={(e) => setNewRide({ ...newRide, contact: e.target.value })}
                    placeholder="z.B. WhatsApp: 0171/123456 / Telegram: @username / weitere Infos..."
                    className="mt-1 min-h-[80px] resize-none bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#ff9900]">Datum *</Label>
                    <Select value={newRide.date} onValueChange={(value) => setNewRide({ ...newRide, date: value })}>
                      <SelectTrigger className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#460b6c] border-[#ff9900]/30">
                        {festivalDates.map(({ date, label }) => (
                          <SelectItem key={date} value={date} className="text-white hover:bg-[#ff9900]/20">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-[#ff9900]">Zeit *</Label>
                    <Input
                      type="time"
                      value={newRide.time}
                      onChange={(e) => setNewRide({ ...newRide, time: e.target.value })}
                      className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-[#ff9900]">Plätze</Label>
                  <Select value={newRide.seats.toString()} onValueChange={(value) => setNewRide({ ...newRide, seats: parseInt(value) })}>
                    <SelectTrigger className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#460b6c] border-[#ff9900]/30">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()} className="text-white hover:bg-[#ff9900]/20">{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)} 
                    className="flex-1 border-[#ff9900]/50 text-[#ff9900] hover:bg-[#ff9900]/20"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleCreateRide} 
                    className="flex-1 bg-[#ff9900] hover:bg-[#ff9900]/80 text-[#460b6c]"
                  >
                    Erstellen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </OfflineDisabled>
      </div>

      {/* Rides List im Timeline-Card-Stil */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff9900] border-t-transparent"></div>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="text-center text-[#ff9900]/80 py-12 text-lg px-4">
          {rides.length === 0 ? (
            <>
              Noch keine Fahrten vorhanden.<br />
              Biete jetzt die erste Fahrt an!
            </>
          ) : (
            <>
              Keine Fahrten für diese Filter.<br />
              Versuche andere Optionen!
            </>
          )}
        </div>
      ) : (
        <div className="px-4">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
            <div className="space-y-4">
              {filteredRides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 relative ml-8"
                >
                  {/* Icon Badge wie bei Timeline */}
                  <div className="absolute -left-12 top-4 p-2 bg-[#ff9900]/20 rounded-full">
                    <Car className="text-[#ff9900] text-lg" />
                  </div>

                  {/* Header mit Fahrer und Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="text-[#ff9900] font-medium text-lg">{ride.driver}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            ride.direction === 'hinfahrt' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {ride.direction === 'hinfahrt' ? 'Hinfahrt' : 'Rückfahrt'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-[#ff9900] text-sm">
                        {new Date(ride.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} • {ride.time}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ride.passengers.length >= ride.seats 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {ride.passengers.length >= ride.seats ? 'Voll' : `${ride.seats - ride.passengers.length} frei`}
                      </span>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <MapPin className="h-4 w-4 text-[#ff9900]" />
                    <span>{ride.start}</span>
                    <ChevronRight className="h-4 w-4 text-[#ff9900]/60" />
                    <span>{ride.destination}</span>
                  </div>

                  {/* Contact Information */}
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    <Phone className="h-4 w-4 text-[#ff9900]" />
                    <span className="truncate">{ride.contact}</span>
                  </div>

                  {/* Passengers */}
                  {ride.passengers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-white/80 text-sm mb-2">Mitfahrer:</div>
                      <div className="flex flex-wrap gap-2">
                        {ride.passengers.map((passenger, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff9900]/20 text-[#ff9900] rounded-full text-xs border border-[#ff9900]/30 cursor-pointer hover:bg-[#ff9900]/30"
                            onClick={() => passenger.contact && setShowPassengerContact(passenger)}
                          >
                            <Users className="h-3 w-3" />
                            {passenger.name}
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleRemovePassenger(ride._id!, passenger.name); 
                              }}
                              className="hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {ride.passengers.length < ride.seats && (
                      <OfflineDisabled actionType="write" showIcon={false}>
                        <Dialog open={showPassengerDialog === ride._id && isOnline} onOpenChange={(open) => isOnline && setShowPassengerDialog(open ? ride._id! : null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`${
                                isOnline 
                                  ? 'border-[#ff9900] text-[#ff9900] hover:bg-[#ff9900] hover:text-[#460b6c]' 
                                  : 'border-gray-400 text-gray-500 cursor-not-allowed'
                              }`}
                              disabled={!isOnline}
                              title={!isOnline ? 'Mitfahren ist nur online möglich' : undefined}
                            >
                              {isOnline ? 'Mitfahren' : 'Mitfahren (offline)'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm bg-[#460b6c] border-[#ff9900]/20">
                            <DialogHeader>
                              <DialogTitle className="text-[#ff9900] text-base sm:text-xl text-center">
                                Mitfahren
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-[#ff9900]">Dein Name</Label>
                                <Input
                                  value={passengerName}
                                  onChange={(e) => setPassengerName(e.target.value)}
                                  placeholder="Wie soll dich der Fahrer nennen?"
                                  className="mt-1 bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                                />
                              </div>
                              <div>
                                <Label className="text-[#ff9900]">Erreichbar über / Nachricht (optional)</Label>
                                <Textarea
                                  value={passengerContact}
                                  onChange={(e) => setPassengerContact(e.target.value)}
                                  placeholder="z.B. Telegram: @user123 / WhatsApp: Max / Nachricht an den Fahrer ..."
                                  className="mt-1 min-h-[48px] resize-none bg-[#460b6c]/50 border-[#ff9900]/30 text-white placeholder:text-white/60"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowPassengerDialog(null)} 
                                  className="flex-1 border-[#ff9900]/50 text-[#ff9900] hover:bg-[#ff9900]/20" 
                                  size="sm"
                                >
                                  Abbrechen
                                </Button>
                                <Button 
                                  onClick={() => handleJoinRide(ride._id!)} 
                                  className="flex-1 bg-[#ff9900] hover:bg-[#ff9900]/80 text-[#460b6c]" 
                                  size="sm"
                                >
                                  Anmelden
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </OfflineDisabled>
                    )}
                    
                    <OfflineDisabled actionType="delete" showIcon={false}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => isOnline && handleDeleteRide(ride._id!)}
                        className={`${
                          isOnline 
                            ? 'border-red-500/50 text-red-300 hover:bg-red-500 hover:text-white' 
                            : 'border-gray-400 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isOnline}
                        title={!isOnline ? 'Löschen ist nur online möglich' : undefined}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </OfflineDisabled>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Dialog */}
      {showPassengerContact && (
        <Dialog open={!!showPassengerContact} onOpenChange={() => setShowPassengerContact(null)}>
          <DialogContent className="max-w-sm bg-[#460b6c] border-[#ff9900]/20">
            <DialogHeader>
              <DialogTitle className="text-[#ff9900] text-base sm:text-xl text-center">
                Kontakt / Nachricht von {showPassengerContact.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm sm:text-base whitespace-pre-line text-white/90 text-center">
              {showPassengerContact.contact || 'Keine Nachricht hinterlegt.'}
            </div>
            <div className="flex justify-end mt-2">
              <Button 
                onClick={() => setShowPassengerContact(null)} 
                variant="outline" 
                size="sm"
                className="border-[#ff9900] text-[#ff9900] hover:bg-[#ff9900] hover:text-[#460b6c]"
              >
                Schließen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 