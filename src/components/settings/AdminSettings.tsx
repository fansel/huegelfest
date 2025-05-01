'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSettingsProps {
  showAdmin: boolean;
  onToggle: (value: boolean) => void;
  onNavigateToAdmin: () => void;
}

export default function AdminSettings({ 
  showAdmin, 
  onToggle, 
  onNavigateToAdmin
}: AdminSettingsProps) {
  const { isAuthenticated, login, logout, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleToggle = async (value: boolean) => {
    if (value && !isAuthenticated) {
      setShowLoginForm(true);
    } else if (isAuthenticated) {
      onToggle(value);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setShowLoginForm(false);
      setUsername('');
      setPassword('');
      onToggle(true);
    } catch (err) {
      // Fehler wird bereits im AuthContext behandelt
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onToggle(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCancel = () => {
    setShowLoginForm(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Admin-Oberfläche</span>
          <span className="text-[#ff9900]/60 text-sm">Aktiviere die Admin-Funktionen</span>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showAdmin}
              onChange={() => handleToggle(!showAdmin)}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
          </label>
        </div>
      </div>

      {showLoginForm && (
        <div className="mt-4 p-4 bg-[#460b6c]/20 rounded-lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-[#ff9900] text-sm font-medium mb-1">
                Benutzername
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#460b6c]/30 border border-[#ff9900]/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#ff9900]/50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[#ff9900] text-sm font-medium mb-1">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#460b6c]/30 border border-[#ff9900]/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#ff9900]/50"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-[#ff9900] text-[#460b6c] py-2 px-4 rounded-md font-medium hover:bg-[#ff9900]/90 transition-colors"
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-[#ff9900] text-[#ff9900] py-2 px-4 rounded-md font-medium hover:bg-[#ff9900]/10 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {isAuthenticated && showAdmin && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onNavigateToAdmin}
            className="flex-1 bg-[#ff9900] text-[#460b6c] py-2 px-4 rounded-md font-medium hover:bg-[#ff9900]/90 transition-colors"
          >
            Admin öffnen
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 border border-[#ff9900] text-[#ff9900] py-2 px-4 rounded-md font-medium hover:bg-[#ff9900]/10 transition-colors"
          >
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
} 