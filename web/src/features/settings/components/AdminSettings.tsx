'use client';

import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import { useAuth } from '@/features/auth/AuthContext';

export default function AdminSettings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { isAuthenticated, isAdmin, login, logout, error, loading } = useAuth();

  const handleToggle = (value: boolean) => {
    if (value && !isAuthenticated) {
      setShowLoginForm(true);
    } else if (!value && isAuthenticated) {
      logout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
    setUsername('');
    setPassword('');
    setShowLoginForm(false);
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
          <span className="text-[#ff9900]/60 text-sm">
            Aktiviere die Admin-Funktionen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isAuthenticated}
              onChange={() => handleToggle(!isAuthenticated)}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
          </label>
        </div>
      </div>

      {/** Login-Modal für Admin-Login */}
      <Modal
        isOpen={showLoginForm && !isAuthenticated}
        onClose={handleCancel}
        title="Admin-Login"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-[#ff9900]/30 border-t-[#ff9900] rounded-full animate-spin mb-4"></div>
            <span className="text-[#ff9900]">Anmeldung läuft ...</span>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-[#ff9900] text-sm font-medium mb-2"
              >
                Benutzername
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#460b6c]/30 border border-[#ff9900]/20 rounded-md text-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
                placeholder="Benutzername eingeben"
                autoFocus
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[#ff9900] text-sm font-medium mb-2"
              >
                Admin-Passwort
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#460b6c]/30 border border-[#ff9900]/20 rounded-md text-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
                placeholder="Passwort eingeben"
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2 flex-row-reverse w-full">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#ff9900] text-[#460b6c] rounded-md hover:bg-[#ff9900]/80 transition-colors"
                disabled={loading}
              >
                {loading ? 'Anmelden...' : 'Anmelden'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-[#460b6c] text-[#ff9900] rounded-md hover:bg-[#460b6c]/80 transition-colors"
                disabled={loading}
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
