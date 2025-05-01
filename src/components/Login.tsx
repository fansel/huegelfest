'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="bg-[#460b6c]/30 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm mx-4 border border-[#ff9900]/20">
      <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[#ff9900]">Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-[#ff9900] text-sm font-bold mb-2">
            Benutzername
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border border-[#ff9900]/20 rounded w-full py-2 px-3 bg-[#460b6c]/30 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-[#ff9900]/50 text-sm sm:text-base"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-[#ff9900] text-sm font-bold mb-2">
            Passwort
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border border-[#ff9900]/20 rounded w-full py-2 px-3 bg-[#460b6c]/30 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-[#ff9900]/50 text-sm sm:text-base"
          />
        </div>
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-[#ff9900] hover:bg-[#ff9900]/90 text-[#460b6c] font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[#ff9900]/50 text-sm sm:text-base transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
} 