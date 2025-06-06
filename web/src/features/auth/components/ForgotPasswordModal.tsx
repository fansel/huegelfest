'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Mail, CheckCircle, AlertCircle, X } from 'lucide-react';
import { sendPasswordResetAction } from '../actions/passwordReset';
import toast from 'react-hot-toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendPasswordResetAction(email);
      
      if (result.success) {
        setEmailSent(true);
        toast.success('Reset-E-Mail wurde gesendet!');
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten');
        toast.error(result.error || 'Fehler beim Senden der E-Mail');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] pointer-events-none">
      <Card 
        className="w-full max-w-md relative pointer-events-auto"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-2 top-2 p-2"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-[#ff9900]/20 rounded-full flex items-center justify-center">
            {emailSent ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Mail className="h-6 w-6 text-[#ff9900]" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-[#460b6c]">
            {emailSent ? 'E-Mail gesendet!' : 'Passwort vergessen?'}
          </CardTitle>
          <CardDescription>
            {emailSent 
              ? 'Wir haben dir einen Reset-Link gesendet'
              : 'Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Falls ein Account mit der E-Mail-Adresse <strong>{email}</strong> existiert, 
                  wurde ein Reset-Link gesendet. Überprüfe dein Postfach und den Spam-Ordner.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Nächste Schritte:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Öffne dein E-Mail-Postfach</li>
                  <li>Klicke auf den Link in der E-Mail</li>
                  <li>Setze ein neues Passwort fest</li>
                  <li>Der Link ist 10 Minuten gültig</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Schließen
                </Button>
                <Button 
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="flex-1 bg-[#ff9900] hover:bg-[#ff9900]/90"
                >
                  Erneut senden
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                  E-Mail-Adresse
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex-1 bg-[#ff9900] hover:bg-[#ff9900]/90"
                >
                  {isLoading ? 'Wird gesendet...' : 'Reset-Link senden'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 