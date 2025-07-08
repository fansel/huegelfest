import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { 
  User as UserIcon,
  Calendar,
  Phone,
  Send,
  Car as CarIcon,
  Train as TrainIcon,
  Bike as BikeIcon,
  HelpCircle,
  Bed,
  Tent,
  Stethoscope,
  AlertTriangle,
  Shield,
  ChefHat,
  Camera,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Save
} from 'lucide-react';
import { getUserRegistrationByUserIdAction } from '@/features/admin/actions/userRegistrationActions';
import { useCentralFestivalDays } from '@/shared/hooks/useCentralFestivalDays';
import { updateStatus } from '@/features/registration/actions/updateRegistrationStatus';
import toast from 'react-hot-toast';

interface UserRegistrationDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RegistrationData {
  _id: string;
  name: string;
  days: number[];
  contactType?: string;
  contactInfo?: string;
  travelType: string;
  sleepingPreference: string;
  isMedic: boolean;
  canStaySober: boolean;
  wantsAwareness: boolean;
  wantsKitchenHelp: boolean;
  allowsPhotos: boolean;
  paid: boolean;
  checkedIn: boolean;
  programContribution?: string;
  equipment?: string;
  wantsToOfferWorkshop?: string;
  lineupContribution?: string;
  allergies?: string;
  concerns?: string;
  createdAt: string;
}

function formatDateBerlin(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function UserRegistrationDialog({ 
  userId, 
  userName, 
  open, 
  onOpenChange 
}: UserRegistrationDialogProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const { data: centralDays, loading: festivalDaysLoading } = useCentralFestivalDays();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert central festival days to legacy format for display
  const FESTIVAL_DAYS = useMemo(() => {
    if (!centralDays || centralDays.length === 0) return [];
    
    return centralDays.map((day: any) => {
      try {
        const date = new Date(day.date);
        const dayNum = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${dayNum}.${month}.`;
      } catch (error) {
        console.error('Error converting festival day:', day, error);
        return '01.01.'; // Fallback
      }
    });
  }, [centralDays]);

  useEffect(() => {
    if (open && userId) {
      loadRegistration();
    } else {
      setRegistration(null);
      setError(null);
      setIsEditing(false);
    }
  }, [open, userId]);

  const loadRegistration = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserRegistrationByUserIdAction(userId);
      if (result.success && result.data) {
        setRegistration(result.data);
      } else {
        setError(result.error || 'Anmeldung nicht gefunden');
      }
    } catch (err) {
      setError('Fehler beim Laden der Anmeldung');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (field: 'paid' | 'checkedIn', value: boolean) => {
    if (!registration) return;
    
    setIsUpdating(true);
    try {
      const result = await updateStatus(registration._id, { [field]: value });
      if (result.success && result.updated) {
        setRegistration(prev => prev ? { ...prev, ...result.updated } : prev);
        const fieldName = field === 'paid' ? 'Bezahlt-Status' : 'Check-In-Status';
        toast.success(`${fieldName} aktualisiert`);
      } else {
        toast.error(result.error || 'Fehler beim Aktualisieren des Status');
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userId) return null;

  const content = (
    <div className="flex flex-col gap-6 text-[#460b6c] overflow-y-auto max-h-[70vh]">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9900]"></div>
          <span className="ml-2">Lade Anmeldung...</span>
        </div>
      )}

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {registration && !loading && (
        <>
          {/* Header mit Benutzerinfo und Status */}
          <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-[#460b6c] flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#ff9900]" />
                {registration.name}
              </h2>
              <div className="flex gap-2">
                <button
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${
                    registration.paid 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}
                  type="button"
                  onClick={() => handleStatusChange('paid', !registration.paid)}
                >
                  {registration.paid ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {registration.paid ? 'Bezahlt' : 'Unbezahlt'}
                </button>

                <button
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${
                    registration.checkedIn 
                      ? 'bg-orange-100 text-orange-700 border-orange-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}
                  type="button"
                  onClick={() => handleStatusChange('checkedIn', !registration.checkedIn)}
                >
                  <Info className="w-4 h-4" /> {registration.checkedIn ? 'Angemeldet' : 'Unangemeldet'}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Erstellt: {formatDateBerlin(registration.createdAt)}
            </div>
          </div>

          {/* Grunddaten */}
          <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
            <h3 className="font-semibold text-[#460b6c] mb-3">Grunddaten</h3>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Zeitraum:</span>
              <span>{FESTIVAL_DAYS[registration.days[0]]} – {FESTIVAL_DAYS[registration.days[registration.days.length - 1]]}</span>
            </div>

            {/* Contact Information */}
            {registration.contactType && registration.contactType !== 'none' && registration.contactInfo && registration.contactInfo.trim() && (
              <div className="flex items-center gap-2">
                {registration.contactType === 'phone' ? <Phone className="w-4 h-4 text-[#ff9900]" /> : <Send className="w-4 h-4 text-[#ff9900]" />}
                <span className="font-medium">{registration.contactType === 'phone' ? 'Telefon:' : 'Telegram:'}</span>
                <span>{registration.contactInfo}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {registration.travelType === 'auto' && <CarIcon className="w-4 h-4 text-[#ff9900]" />}
              {registration.travelType === 'zug' && <TrainIcon className="w-4 h-4 text-[#ff9900]" />}
              {registration.travelType === 'fahrrad' && <BikeIcon className="w-4 h-4 text-[#ff9900]" />}
              {registration.travelType === 'andere' && <HelpCircle className="w-4 h-4 text-[#ff9900]" />}
              <span className="font-medium">Anreise:</span>
              <span>{registration.travelType === 'zug' ? 'Zug' : registration.travelType === 'auto' ? 'Auto' : registration.travelType === 'fahrrad' ? 'Fahrrad' : 'Andere'}</span>
            </div>

            <div className="flex items-center gap-2">
              {registration.sleepingPreference === 'bed' && <Bed className="w-4 h-4 text-[#ff9900]" />}
              {registration.sleepingPreference === 'tent' && <Tent className="w-4 h-4 text-[#ff9900]" />}
              {registration.sleepingPreference === 'car' && <CarIcon className="w-4 h-4 text-[#ff9900]" />}
              <span className="font-medium">Schlafplatz:</span>
              <span>{registration.sleepingPreference === 'bed' ? 'Bett' : registration.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span>
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
            <h3 className="font-semibold text-[#460b6c] mb-3">Engagement</h3>
            
            {registration.isMedic && (
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Sanitäter:in</span>
              </div>
            )}

            {registration.canStaySober && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Kann nüchtern fahren</span>
              </div>
            )}

            {registration.wantsAwareness && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Awareness-Team</span>
              </div>
            )}

            {registration.wantsKitchenHelp && (
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-green-600" />
                <span className="font-medium">Küchen-Hilfe</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Fotos:</span>
              <span>{registration.allowsPhotos ? 'Erlaubt' : 'Nicht erlaubt'}</span>
            </div>

            {registration.programContribution && registration.programContribution !== 'nein' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Programmpunkt:</span>
                  <Badge variant="secondary">
                    {registration.programContribution === 'ja_ohne_idee' ? 'Ja, ohne Idee' : 
                     registration.programContribution === 'ja_mit_idee' ? 'Ja, mit Idee' : 
                     registration.programContribution}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Zusätzliche Informationen */}
          {(registration.equipment || registration.wantsToOfferWorkshop || registration.lineupContribution || registration.allergies || registration.concerns) && (
            <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
              <h3 className="font-semibold text-[#460b6c] mb-3">Zusätzliche Informationen</h3>
              
              {registration.equipment && (
                <div>
                  <span className="font-medium">Equipment:</span>
                  <p className="mt-1 text-sm bg-white/50 p-2 rounded">{registration.equipment}</p>
                </div>
              )}

              {registration.wantsToOfferWorkshop && (
                <div>
                  <span className="font-medium">Workshop-Angebot:</span>
                  <p className="mt-1 text-sm bg-white/50 p-2 rounded">{registration.wantsToOfferWorkshop}</p>
                </div>
              )}

              {registration.lineupContribution && (
                <div>
                  <span className="font-medium">Line-Up Beitrag:</span>
                  <p className="mt-1 text-sm bg-white/50 p-2 rounded">{registration.lineupContribution}</p>
                </div>
              )}

              {registration.allergies && (
                <div>
                  <span className="font-medium">Allergien:</span>
                  <p className="mt-1 text-sm bg-white/50 p-2 rounded">{registration.allergies}</p>
                </div>
              )}

              {registration.concerns && (
                <div>
                  <span className="font-medium">Anliegen:</span>
                  <p className="mt-1 text-sm bg-white/50 p-2 rounded">{registration.concerns}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md p-4 bg-white max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-center text-lg">
                Anmeldung von {userName}
              </DialogTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // TODO: Implement save functionality
                        setIsEditing(false);
                        toast.success('Änderungen gespeichert');
                      }}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[90vw] p-6 bg-white max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-center">
              Anmeldung von {userName}
            </DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // TODO: Implement save functionality
                      setIsEditing(false);
                      toast.success('Änderungen gespeichert');
                    }}
                    disabled={isUpdating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
} 