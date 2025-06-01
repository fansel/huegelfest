"use client";

import React from 'react';
import WorkingGroupsManager from './WorkingGroupManager';

/**
 * WebSocket-Wrapper für den WorkingGroupsManager
 * Direkte Weiterleitung ohne Props
 */

const WorkingGroupManagerWebSocket: React.FC = () => {
  return (
    <WorkingGroupsManager />
  );
};

export default WorkingGroupManagerWebSocket; 