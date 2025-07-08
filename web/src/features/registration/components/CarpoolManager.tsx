'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Car, MapPin, Clock, Users, Phone, Plus, Trash2, Calendar, User, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getRidesAction } from '../actions/getRides';
import { createRideAction } from '../actions/createRide';
import { updateRideAction } from '../actions/updateRide';
import { deleteRideAction } from '../actions/deleteRide';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';

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

const festivalLocation = 'Hügelfest';

export default function CarpoolManager() {
  const { deviceType } = useDeviceContext();
  const { festivalDays, loading: festivalDaysLoading } = useFestivalDays();
  const isMobile = deviceType === 'mobile';
  
  // Transform festival days to the expected format for carpool dates
  const festivalDates = useMemo(() => {
    if (!festivalDays || festivalDays.length === 0) return [];
    
    // Convert from "31.07." format to date objects and create the expected structure
    const currentYear = new Date().getFullYear();
    return [
      { date: `${currentYear}-07-30`, label: '30. Juli 2025' }, // Day before festival
      ...festivalDays.map((day, index) => {
        // Parse day format "31.07." to create proper date
        const [dayNum, month] = day.replace('.', '').split('.');
        const monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        const formattedDate = `${currentYear + 1}-${month.padStart(2, '0')}-${dayNum.padStart(2, '0')}`;
        const label = `${dayNum}. ${monthNames[parseInt(month)]} ${currentYear + 1}`;
        return { date: formattedDate, label };
      })
    ];
  }, [festivalDays]);
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [showPassengerDialog, setShowPassengerDialog] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('all');
  const [filterDirection, setFilterDirection] = useState('all');
  
  const [newRide, setNewRide] = useState<Omit<Ride, '_id' | 'passengers'>>({
    driver: '',
    direction: 'hinfahrt',
    start: '',
    destination: festivalLocation,
    date: '',
    time: '',
    seats: 1,
    contact: '',
  });

  const [passengerContact, setPassengerContact] = useState('');
  const [showPassengerContact, setShowPassengerContact] = useState<{ name: string, contact?: string } | null>(null);

  // Update default date when festivalDates become available
  useEffect(() => {
    if (festivalDates.length > 1 && !newRide.date) {
      setNewRide(prev => ({ ...prev, date: festivalDates[1].date }));
    }
  }, [festivalDates, newRide.date]);

  const loadRides = async () => {
    try {
      setLoading(true);
      const data = await getRidesAction();
      setRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrten:', error);
      toast.error('Fehler beim Laden der Fahrten');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, []);

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
        driver: '',
        direction: 'hinfahrt',
        start: '',
        destination: festivalLocation,
        date: festivalDates.length > 1 ? festivalDates[1].date : '',
        time: '',
        seats: 1,
        contact: '',
      });
      loadRides();
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
      setPassengerName('');
      setPassengerContact('');
      setShowPassengerDialog(null);
      loadRides();
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
      loadRides();
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
      loadRides();
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

  // Show loading state if festival days are still loading
  if (festivalDaysLoading || festivalDates.length === 0) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff9900] border-t-transparent"></div>
            <span className="text-[#ff9900] text-lg">Festival-Daten werden geladen...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Car className="h-8 w-8 text-[#ff9900]" />
          <h1 className="text-2xl font-bold text-[#ff9900]">Mitfahrgelegenheiten</h1>
        </div>
      </div>

      {/* Filter and Create Button */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-1">
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Richtung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Richtungen</SelectItem>
                <SelectItem value="hinfahrt">Hinfahrt</SelectItem>
                <SelectItem value="rückfahrt">Rückfahrt</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="bg-white border-gray-300">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Datum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Tage</SelectItem>
                {festivalDates.map(({ date, label }) => (
                  <SelectItem key={date} value={date}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-[#ff9900] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Fahrt anbieten
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#460b6c] text-xl text-center">Neue Fahrt erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[#460b6c]">Fahrer *</Label>
                <Input
                  value={newRide.driver}
                  onChange={(e) => setNewRide({ ...newRide, driver: e.target.value })}
                  placeholder="Dein Name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-[#460b6c]">Richtung *</Label>
                <Select value={newRide.direction} onValueChange={handleDirectionChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hinfahrt">Hinfahrt (zum Festival)</SelectItem>
                    <SelectItem value="rückfahrt">Rückfahrt (vom Festival)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newRide.direction === 'hinfahrt' ? (
                <div>
                  <Label className="text-[#460b6c]">Abfahrtsort *</Label>
                  <Input
                    value={newRide.start}
                    onChange={(e) => setNewRide({ ...newRide, start: e.target.value })}
                    placeholder="z.B. München, Bahnhof"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-[#460b6c]">Zielort *</Label>
                  <Input
                    value={newRide.destination}
                    onChange={(e) => setNewRide({ ...newRide, destination: e.target.value })}
                    placeholder="z.B. München, Bahnhof"
                    className="mt-1"
                  />
                </div>
              )}
              
              <div>
                <Label className="text-[#460b6c]">Erreichbar über / Nachricht *</Label>
                <Textarea
                  value={newRide.contact}
                  onChange={(e) => setNewRide({ ...newRide, contact: e.target.value })}
                  placeholder="z.B. WhatsApp: 0171/123456 / Telegram: @username / weitere Infos..."
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#460b6c]">Datum *</Label>
                  <Select value={newRide.date} onValueChange={(value) => setNewRide({ ...newRide, date: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {festivalDates.map(({ date, label }) => (
                        <SelectItem key={date} value={date}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#460b6c]">Zeit *</Label>
                  <Input
                    type="time"
                    value={newRide.time}
                    onChange={(e) => setNewRide({ ...newRide, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-[#460b6c]">Plätze</Label>
                <Select value={newRide.seats.toString()} onValueChange={(value) => setNewRide({ ...newRide, seats: parseInt(value) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={handleCreateRide} className="flex-1 bg-[#ff9900] hover:bg-orange-600">
                  Erstellen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rides List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff9900] border-t-transparent"></div>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {rides.length === 0 ? 'Noch keine Fahrten' : 'Keine Treffer'}
          </h3>
          <p className="text-sm text-gray-500">
            {rides.length === 0 ? 'Biete die erste Fahrt an!' : 'Versuche andere Filter-Optionen'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRides.map((ride) => (
            <div
              key={ride._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 my-2 px-3 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#ff9900] to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-base truncate flex-1 min-w-0">{ride.driver}</span>
                  <span className={`inline-block px-2 py-0.5 rounded mr-1 text-xs font-medium ${ride.direction === 'hinfahrt' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-purple-100 text-purple-800 border border-purple-200'}`}>
                    {ride.direction === 'hinfahrt' ? 'Hinfahrt' : 'Rückfahrt'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ride.passengers.length >= ride.seats ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {ride.passengers.length >= ride.seats ? 'Voll' : `${ride.seats - ride.passengers.length} frei`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span className="truncate break-words">{ride.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <MapPin className="h-3 w-3 text-[#ff9900]" />
                  <span className="break-words">{ride.start}</span>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span className="break-words text-gray-600">{ride.destination}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(ride.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{ride.time}</span>
                  </span>
                </div>
                {ride.passengers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ride.passengers.map((passenger, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs border border-blue-200 cursor-pointer hover:bg-blue-200"
                        onClick={() => passenger.contact && setShowPassengerContact(passenger)}
                      >
                        {passenger.name}
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRemovePassenger(ride._id!, passenger.name); 
                          }}
                          className="hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  {ride.passengers.length < ride.seats && (
                    <Dialog open={showPassengerDialog === ride._id} onOpenChange={(open) => setShowPassengerDialog(open ? ride._id! : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-[#ff9900] text-[#ff9900] hover:bg-[#ff9900] hover:text-white text-xs">
                          Mitfahren
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-[#460b6c] text-base sm:text-xl text-center">
                            Mitfahren
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[#460b6c]">Dein Name</Label>
                            <Input
                              value={passengerName}
                              onChange={(e) => setPassengerName(e.target.value)}
                              placeholder="Wie soll dich der Fahrer nennen?"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-[#460b6c]">Erreichbar über / Nachricht (optional)</Label>
                            <Textarea
                              value={passengerContact}
                              onChange={(e) => setPassengerContact(e.target.value)}
                              placeholder="z.B. Telegram: @user123 / WhatsApp: Max / Nachricht an den Fahrer ..."
                              className="mt-1 min-h-[48px] resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowPassengerDialog(null)} className="flex-1" size="sm">
                              Abbrechen
                            </Button>
                            <Button onClick={() => handleJoinRide(ride._id!)} className="flex-1 bg-[#ff9900] hover:bg-orange-600" size="sm">
                              Anmelden
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRide(ride._id!)}
                className="bg-red-100 border-red-200 text-red-700 hover:bg-red-500 hover:text-white text-xs px-3 ml-2 self-start"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Contact Dialog */}
      {showPassengerContact && (
        <Dialog open={!!showPassengerContact} onOpenChange={() => setShowPassengerContact(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[#460b6c] text-base sm:text-xl text-center">
                Kontakt / Nachricht von {showPassengerContact.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm sm:text-base whitespace-pre-line text-gray-800 text-center">
              {showPassengerContact.contact || 'Keine Nachricht hinterlegt.'}
            </div>
            <div className="flex justify-end mt-2">
              <Button onClick={() => setShowPassengerContact(null)} variant="outline" size="sm">
                Schließen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}