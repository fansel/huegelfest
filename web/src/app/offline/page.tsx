import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Huegelfest',
  description: 'Sie sind offline. Einige Funktionen sind eingeschränkt verfügbar.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sie sind offline</h1>
        <p className="text-gray-600 mb-4">
          Einige Funktionen sind derzeit eingeschränkt verfügbar. Sobald Sie wieder online sind, werden alle Funktionen automatisch wiederhergestellt.
        </p>
        <div className="flex items-center text-yellow-600">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Eingeschränkter Funktionsumfang</span>
        </div>
      </div>
    </div>
  );
} 