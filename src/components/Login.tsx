'use client';

import { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string;
}

export default function Login({ onLogin, error }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      await onLogin(username, password);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#460b6c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#ff9900]">
            Admin Login
          </h2>
        </div>
        {(error || loginError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error || loginError}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Benutzername
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#ff9900]/20 placeholder-[#ff9900]/60 text-[#ff9900] rounded-t-md focus:outline-none focus:ring-[#ff9900] focus:border-[#ff9900] focus:z-10 sm:text-sm bg-[#460b6c]/30"
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#ff9900]/20 placeholder-[#ff9900]/60 text-[#ff9900] rounded-b-md focus:outline-none focus:ring-[#ff9900] focus:border-[#ff9900] focus:z-10 sm:text-sm bg-[#460b6c]/30"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#460b6c] ${
                isLoading ? 'bg-[#ff9900]/50 cursor-not-allowed' : 'bg-[#ff9900] hover:bg-[#ff9900]/80'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff9900]`}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 