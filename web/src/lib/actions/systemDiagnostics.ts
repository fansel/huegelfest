'use server';

import { connectDB } from '../db/connector';
import { webPushService } from '../webpush/webPushService';
import { User } from '../db/models/User';
import { Subscriber } from '../db/models/Subscriber';
import { Event } from '../db/models/Event';
import { Activity } from '../db/models/Activity';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import mongoose from 'mongoose';
import { getAgendaClient } from '../pushScheduler/agenda';
import { broadcast } from '../websocket/broadcast';

export interface SystemStatus {
  services: {
    database: 'connected' | 'disconnected' | 'error';
    webpush: 'active' | 'inactive' | 'error';
    scheduler: 'running' | 'stopped' | 'error';
    websockets: 'connected' | 'disconnected' | 'error';
  };
  stats: {
    totalUsers: number;
    totalSubscribers: number;
    activeJobs: number;
    pendingEvents: number;
    totalActivities: number;
    agendaJobs: number;
  };
  websocketStats?: {
    totalConnections: number;
    totalDevices: number;
    devicesList: Array<{userId: string, connected: boolean, readyState: number}>;
    connectionsByDevice: Record<string, number>;
  };
  lastUpdated: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: any;
}

// In-memory log storage
const logStorage: LogEntry[] = [];

// Log collection system for diagnostics
let logCollection: any[] = [];
const MAX_LOGS = 1000;

// Intercept console logs for diagnostics (server-side only)
// Note: This runs only on the server, no window object available
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Override console methods to capture logs
['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
  (console as any)[level] = (...args: any[]) => {
    // Call original console method
    (originalConsole as any)[level](...args);
    
    // Capture for diagnostics
    try {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('[') && message.includes(']')) {
        // Parse structured log messages
        const match = message.match(/\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/);
        if (match) {
          const [, timestamp, logLevel, source, logMessage] = match;
          addLogToCollection(logLevel.toLowerCase(), source, logMessage || message);
        } else {
          addLogToCollection(level, 'console', message);
        }
      } else {
        addLogToCollection(level, 'console', message);
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  };
});

function addLogToCollection(level: string, source: string, message: string) {
  const logEntry = {
    timestamp: new Date(),
    level,
    source,
    message,
    metadata: {}
  };
  
  logCollection.unshift(logEntry);
  
  // Keep only the last MAX_LOGS entries
  if (logCollection.length > MAX_LOGS) {
    logCollection = logCollection.slice(0, MAX_LOGS);
  }
}

async function getWebSocketStatistics(): Promise<{
  totalConnections: number;
  totalDevices: number;
  devicesList: Array<{userId: string, connected: boolean, readyState: number}>;
  connectionsByDevice: Record<string, number>;
} | null> {
  try {
    // In production, we need to call the internal endpoint
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `http://localhost:${process.env.PORT || 3000}`
      : `http://localhost:${process.env.PORT || 3000}`;
    
    const response = await fetch(`${baseUrl}/internal/websocket-stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json() as {
        totalConnections: number;
        totalDevices: number;
        devicesList: Array<{userId: string, connected: boolean, readyState: number}>;
        connectionsByDevice: Record<string, number>;
      };
      return data;
    } else {
      console.warn('Could not fetch WebSocket stats:', response.status);
      return null;
    }
  } catch (error) {
    console.warn('Error fetching WebSocket stats:', error);
    return null;
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    await connectDB();

    // Check service statuses with proper typing - use let to allow reassignment
    let services: SystemStatus['services'] = {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      webpush: webPushService.isInitialized() ? 'active' : 'inactive',
      scheduler: 'running', // Assume running if no errors
      websockets: 'disconnected' // Will be updated below
    };

    // Get WebSocket statistics
    const websocketStats = await getWebSocketStatistics();
    if (websocketStats && websocketStats.totalConnections > 0) {
      services = { ...services, websockets: 'connected' };
    } else if (websocketStats) {
      services = { ...services, websockets: 'disconnected' };
    } else {
      services = { ...services, websockets: 'error' };
    }

    // Get statistics
    const [
      totalUsers,
      totalSubscribers,
      pendingEvents,
      totalActivities,
      scheduledPushEvents
    ] = await Promise.all([
      User.countDocuments(),
      Subscriber.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Activity.countDocuments(),
      ScheduledPushEvent.countDocuments({ active: true })
    ]);

    // Get Agenda job count
    let agendaJobs = 0;
    try {
      const agenda = await getAgendaClient();
      const jobs = await agenda.jobs({});
      agendaJobs = jobs.length;
    } catch (error) {
      console.error('Failed to get agenda jobs:', error);
    }

    const stats = {
      totalUsers,
      totalSubscribers,
      activeJobs: agendaJobs,
      pendingEvents,
      totalActivities,
      agendaJobs
    };

    return {
      services,
      stats,
      websocketStats: websocketStats || undefined,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('[SystemDiagnostics] Error fetching status:', error);
    
    return {
      services: {
        database: 'error',
        webpush: 'error',
        scheduler: 'error',
        websockets: 'error'
      },
      stats: {
        totalUsers: 0,
        totalSubscribers: 0,
        activeJobs: 0,
        pendingEvents: 0,
        totalActivities: 0,
        agendaJobs: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export async function getSystemLogs(limit: number = 100): Promise<LogEntry[]> {
  try {
    // Combine memory collection with database logs
    const memoryLogs = logCollection.slice(0, limit).map(log => ({
      id: `mem-${log.timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: log.timestamp.toISOString(),
      level: log.level as 'info' | 'warn' | 'error' | 'debug',
      source: log.source,
      message: log.message,
      metadata: log.metadata
    }));

    // Try to get additional logs from database
    try {
      await connectDB();
      const db = mongoose.connection.db;
      if (db) {
        const dbLogs = await db.collection('system_logs')
          .find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();
        
        const formattedDbLogs = dbLogs.map((log: any) => ({
          id: `db-${log._id}`,
          timestamp: log.timestamp.toISOString(),
          level: log.level as 'info' | 'warn' | 'error' | 'debug',
          source: log.source,
          message: log.message,
          metadata: log.metadata || {}
        }));

        // Combine and deduplicate by timestamp and message
        const allLogs = [...memoryLogs, ...formattedDbLogs];
        const uniqueLogs = allLogs.filter((log, index, self) => 
          index === self.findIndex(l => l.timestamp === log.timestamp && l.message === log.message)
        );

        return uniqueLogs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      } else {
        return memoryLogs;
      }
        
    } catch (dbError) {
      console.warn('Could not fetch database logs:', dbError);
      return memoryLogs;
    }
  } catch (error) {
    console.error('Failed to get system logs:', error);
    return [];
  }
}

export async function addLogEntry(level: string, source: string, message: string, metadata: any = {}) {
  try {
    await connectDB();
    
    const logEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      metadata
    };

    // Store in database
    const db = mongoose.connection.db;
    if (db) {
      await db.collection('system_logs').insertOne(logEntry);
    }
    
    // Also keep in memory collection
    addLogToCollection(level, source, message);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to store log entry:', error);
    return { success: false, error: String(error) };
  }
}

// Returns all future, active scheduled push events
export async function getScheduledPushEvents() {
  await connectDB();
  const now = new Date();
  const events = await ScheduledPushEvent.find({ active: true, schedule: { $gte: now } })
    .sort({ schedule: 1 })
    .lean();

  // Convert all fields to plain values
  return events.map(event => ({
    _id: event._id?.toString?.() ?? String(event._id),
    title: event.title,
    body: event.body,
    repeat: event.repeat,
    schedule: event.schedule instanceof Date ? event.schedule.toISOString() : String(event.schedule),
    active: event.active,
    subscribers: (event.subscribers || []).map((id: any) => id?.toString?.() ?? String(id)),
    sendToAll: event.sendToAll,
    groupId: event.groupId ? event.groupId.toString() : undefined,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt),
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : String(event.updatedAt),
    agendaJobId: event.agendaJobId ? String(event.agendaJobId) : undefined,
  }));
}

export async function getAgendaStatistics() {
  const agenda = await getAgendaClient();
  const jobs = await agenda.jobs({});
  // ... existing code ...
}

export async function broadcastSystemStatus() {
  const status = await getSystemStatus();
  await broadcast('system-status-updated', status);
} 