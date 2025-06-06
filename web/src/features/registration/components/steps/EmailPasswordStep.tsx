"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { FormStep, InputField } from './FormComponents';
import type { StepProps } from './types';
import { checkUsernameAvailability } from '@/features/auth/actions/checkUsername';
import { validateEmailAvailability } from '@/features/auth/actions/validateEmail';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

interface EmailPasswordStepProps extends StepProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  setIsValid: (isValid: boolean) => void;
}

export function EmailPasswordStep({ 
  form, 
  setForm, 
  password, 
  setPassword, 
  confirmPassword, 
  setConfirmPassword, 
  setIsValid
}: EmailPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);
  
  // Debounce email changes to prevent too many API calls
  const debouncedEmail = useDebounce(form.email, 500);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
  };

  const passwordsMatch = password === confirmPassword;
  const isPasswordStrong = password.length >= 8;

  // Username-Verfügbarkeit prüfen
  useEffect(() => {
    const checkUsername = async () => {
      const username = (form as any).username;
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        setUsernameError(null);
        return;
      }

      if (!isValidUsername(username)) {
        setUsernameAvailable(false);
        setUsernameError('Username: 3-30 Zeichen, nur Buchstaben, Zahlen und _');
        return;
      }

      setCheckingUsername(true);
      setUsernameError(null);
      
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameAvailable(result.available);
        if (!result.available && result.error) {
          setUsernameError(result.error);
        }
      } catch (error) {
        console.error('Fehler beim Prüfen des Usernames:', error);
        setUsernameAvailable(null);
        setUsernameError('Fehler beim Prüfen des Username');
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [(form as any).username]);

  // Validate email when it changes (debounced)
  useEffect(() => {
    const validateEmail = async () => {
      if (!debouncedEmail) {
        setEmailError(undefined);
        return;
      }

      setIsValidating(true);
      const result = await validateEmailAvailability(debouncedEmail);
      setIsValidating(false);

      if (!result.isAvailable) {
        setEmailError(result.error);
      } else {
        setEmailError(undefined);
      }
    };

    validateEmail();
  }, [debouncedEmail]);

  // Validate form
  useEffect(() => {
    if (!setIsValid) return; // Early return if setIsValid is not provided
    
    const isEmailValid = !emailError && (
      !form.email || // Email ist optional, also ist leere Email gültig
      (typeof form.email === 'string' && form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) !== null)
    );
    const isPasswordValid = password.length >= 8;
    const doPasswordsMatch = password === confirmPassword;
    
    setIsValid(isPasswordValid && doPasswordsMatch && isEmailValid);
  }, [form.email, password, confirmPassword, emailError, setIsValid]);

  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-4">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-[#ff9900]" />
          <Lock className="w-6 h-6 text-[#ff9900]" />
        </div>
        <span className="text-sm text-[#460b6c]/80 text-center">
          Erstelle einen Account für deine Anmeldung
        </span>
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="username" className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Username *
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={(form as any).username || ''}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 py-4 px-7 pr-12 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2"
              placeholder="deinusername"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {checkingUsername && (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-[#ff9900] rounded-full"></div>
              )}
              {!checkingUsername && usernameAvailable === true && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {!checkingUsername && usernameAvailable === false && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          {usernameError && (
            <span className="text-red-500 text-sm">{usernameError}</span>
          )}
          {(form as any).username && isValidUsername((form as any).username) && usernameAvailable === true && (
            <span className="text-green-500 text-sm">Username ist verfügbar ✓</span>
          )}
        </div>

        {/* E-Mail (optional) */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="email" className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-Mail <span className="text-sm text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            id="email"
            type="email"
            value={form.email || ''}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={`w-full rounded-lg border border-gray-300 py-4 px-7 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2 ${emailError ? 'border-red-500' : ''}`}
            placeholder="deine@email.de (optional, für Passwort-Reset)"
          />
            {isValidating && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#ff9900] border-t-transparent"></div>
              </div>
            )}
          </div>
          {emailError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{emailError}</AlertDescription>
            </Alert>
          )}
          <div className="text-sm text-gray-600 mt-1">
            E-Mail ist optional und wird nur für Passwort-Resets verwendet. Es ist keine Verifizierung erforderlich.
          </div>
        </div>

        {/* Passwort */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="password" className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Passwort *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 py-4 px-7 pr-12 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2"
              placeholder="Mindestens 8 Zeichen"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {password && !isPasswordStrong && (
            <span className="text-red-500 text-sm">Passwort muss mindestens 8 Zeichen lang sein</span>
          )}
        </div>

        {/* Passwort bestätigen */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="confirmPassword" className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Passwort bestätigen *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 py-4 px-7 pr-12 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2"
              placeholder="Passwort wiederholen"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <span className="text-red-500 text-sm">Passwörter stimmen nicht überein</span>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Sicher:</strong> Dein Account wird automatisch erstellt und du wirst eingeloggt. 
          Das Passwort wird sicher verschlüsselt gespeichert.
        </p>
      </div>
    </FormStep>
  );
} 