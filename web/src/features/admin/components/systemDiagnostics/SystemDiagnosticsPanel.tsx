'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSystemStatus, getSystemLogs, type SystemStatus, type LogEntry, getScheduledPushEvents } from '@/lib/actions/systemDiagnostics';
import { format } from 'date-fns';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';

interface SystemDiagnosticsPanelProps {
  onBack?: () => void;
}

export default function SystemDiagnosticsPanel({ onBack }: SystemDiagnosticsPanelProps = {}) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Scheduled Push Events
  const [scheduledEvents, setScheduledEvents] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  // WebSocket listener for real-time status updates
  useGlobalWebSocket({
    topicFilter: ['system-status-updated'],
    onMessage: (message) => {
      if (message.topic === 'system-status-updated') {
        // Safely cast the payload to the expected type
        const newStatus = message.payload as SystemStatus;
        setStatus(newStatus);
      }
    },
  });

  // Filter logs based on selected level
  const filteredLogs = useMemo(() => {
    if (!selectedLevel) return logs;
    return logs.filter(log => log.level === selectedLevel);
  }, [logs, selectedLevel]);

  const loadStatus = async () => {
    try {
      const systemStatus = await getSystemStatus();
      setStatus(systemStatus);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const systemLogs = await getSystemLogs(200);
      setLogs(systemLogs);
    } catch (error) {
      console.error('Failed to load system logs:', error);
    }
  };

  const loadScheduledEvents = async () => {
    setLoadingScheduled(true);
    try {
      const events = await getScheduledPushEvents();
      setScheduledEvents(events);
    } catch (error) {
      setScheduledEvents([]);
    }
    setLoadingScheduled(false);
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadLogs()]);
    setLoading(false);
  };

  const refreshLogs = async () => {
    await loadLogs();
  };

  useEffect(() => {
    refreshData();
    loadScheduledEvents();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
      loadScheduledEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'running':
        return 'text-green-600 bg-green-50';
      case 'disconnected':
      case 'inactive':
      case 'stopped':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getReadyStateText = (readyState: number) => {
    switch (readyState) {
      case 0: return 'Verbindend';
      case 1: return 'Verbunden';
      case 2: return 'Schließend';
      case 3: return 'Geschlossen';
      default: return 'Unbekannt';
    }
  };

  const getReadyStateColor = (readyState: number) => {
    switch (readyState) {
      case 1: return 'text-green-600 bg-green-50';
      case 0: return 'text-yellow-600 bg-yellow-50';
      case 2:
      case 3: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              ← Zurück
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-900">System-Diagnostics</h2>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading ? 'Laden...' : 'Aktualisieren'}
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {status && Object.entries(status.services).map(([service, serviceStatus]) => (
          <div key={service} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 capitalize">
                {service === 'websockets' ? 'WebSockets' : service}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(serviceStatus)}`}>
                {serviceStatus}
              </span>
            </div>
            {service === 'websockets' && status.websocketStats && (
              <div className="mt-2 text-xs text-gray-500">
                {status.websocketStats.totalConnections} Verbindungen,{' '}
                {status.websocketStats.totalDevices} Geräte
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiken</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {status && Object.entries(status.stats).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Push Events Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Geplante Agenda-Nachrichten</h3>
        {loadingScheduled ? (
          <div className="text-gray-500 py-8 text-center">Lade geplante Nachrichten...</div>
        ) : scheduledEvents.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">Keine geplanten Nachrichten vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 font-semibold">Zeitpunkt</th>
                  <th className="px-3 py-2 font-semibold">Empfänger</th>
                  <th className="px-3 py-2 font-semibold">Typ</th>
                  <th className="px-3 py-2 font-semibold">Nachricht</th>
                  <th className="px-3 py-2 font-semibold">Wiederholung</th>
                </tr>
              </thead>
              <tbody>
                {scheduledEvents.map((event) => (
                  <tr key={event._id} className="border-b last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{format(new Date(event.schedule), 'dd.MM.yyyy HH:mm')}</td>
                    <td className="px-3 py-2">
                      {event.sendToAll ? (
                        <span className="text-green-700 font-semibold">Alle</span>
                      ) : event.groupId ? (
                        <span className="text-blue-700 font-semibold">Gruppe<br />{event.groupId}</span>
                      ) : event.subscribers && event.subscribers.length > 0 ? (
                        <span className="text-gray-700">User<br />{event.subscribers.map((id: string) => id.toString()).join(', ')}</span>
                      ) : (
                        <span className="text-gray-400">Unbekannt</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold">{event.title}</td>
                    <td className="px-3 py-2">{event.body}</td>
                    <td className="px-3 py-2">{event.repeat === 'recurring' ? 'Wiederkehrend' : 'Einmalig'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WebSocket Connections */}
      {status?.websocketStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            WebSocket-Verbindungen ({status.websocketStats.totalDevices || 0} Geräte)
          </h3>
          
          {(status.websocketStats.devicesList && status.websocketStats.devicesList.length > 0) ? (
            <div className="space-y-2">
              {status.websocketStats.devicesList.map((device, index) => (
                <div 
                  key={device.userId} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${device.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {device.userId}
                      </div>
                      <div className="text-xs text-gray-500">
                        User ID • {device.connected ? 'Aktiv' : 'Inaktiv'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getReadyStateColor(device.readyState)}`}>
                      {getReadyStateText(device.readyState)}
                    </span>
                    <div className="text-xs text-gray-500">
                      State: {device.readyState}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Connection Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Verbindungsübersicht</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-blue-900">Gesamt</div>
                    <div className="text-blue-700">{status.websocketStats.totalConnections || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Aktive Geräte</div>
                    <div className="text-blue-700">
                      {status.websocketStats.devicesList?.filter(d => d.connected).length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Verbunden</div>
                    <div className="text-blue-700">
                      {status.websocketStats.devicesList?.filter(d => d.readyState === 1).length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Offline</div>
                    <div className="text-blue-700">
                      {status.websocketStats.devicesList?.filter(d => !d.connected).length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">Keine aktiven WebSocket-Verbindungen</div>
              <div className="text-xs text-gray-400 mt-1">
                Geräte verbinden sich automatisch, wenn sie die App öffnen
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Logs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System-Logs</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Alle Level</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <button
              onClick={refreshLogs}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Aktualisieren'}
            </button>
          </div>
        </div>

        {/* Live Logs Display */}
        <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 font-mono text-sm">
          {filteredLogs.length > 0 ? (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start space-x-2 p-2 rounded ${
                    log.level === 'error' ? 'bg-red-50 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-50 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs px-1 rounded uppercase font-medium ${
                    log.level === 'error' ? 'bg-red-200 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    [{log.source}]
                  </span>
                  <span className="flex-1 break-words">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {loading ? 'Logs werden geladen...' : 'Keine Logs verfügbar'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 