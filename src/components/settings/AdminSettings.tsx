'use client';

import { useState, useEffect } from 'react';

interface AdminSettingsProps {
  showAdmin: boolean;
  onToggle: (value: boolean) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminSettings({ showAdmin, onToggle, isAuthenticated, onLogout }: AdminSettingsProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Admin-Oberfläche</span>
          <span className="text-[#ff9900]/60 text-sm">Aktiviere die Admin-Funktionen</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showAdmin}
              onChange={() => onToggle(!showAdmin)}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
          </label>
          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="text-[#ff9900]/60 hover:text-[#ff9900] transition-colors p-2 hover:bg-[#460b6c]/20 rounded-full"
              title="Ausloggen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 