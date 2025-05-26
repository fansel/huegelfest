"use client";

import React, { useState } from 'react';
import { toast } from "react-hot-toast";
import { useGroupsPolling } from '../hooks/useGroupsPolling';
import { createGroupAction, updateGroupAction, deleteGroupAction } from '../actions/groupActions';
import { deleteUserAction } from '../../auth/actions/userActions';
import { updateStatus } from '../../registration/actions/updateRegistrationStatus';
import type { GroupData } from '../types';
import type { TabType, User, RegistrationWithId } from './types';

import { GroupsTab } from './GroupsTab';
import { UsersTab } from './UsersTab';
import { RegistrationsTab } from './RegistrationsTab';
import { CreateGroupDialog } from './dialogs/CreateGroupDialog';
import { EditGroupDialog } from './dialogs/EditGroupDialog';
import { DeleteGroupDialog } from './dialogs/DeleteGroupDialog';
import { AddUserToGroupDialog } from './dialogs/AddUserToGroupDialog';
import { RegistrationDetailDialog } from './dialogs/RegistrationDetailDialog';
import { EditRegistrationDialog } from './dialogs/EditRegistrationDialog';
import { DeleteUserDialog } from './dialogs/DeleteUserDialog';

interface GroupsOverviewPollingProps {
  pollInterval?: number; // Polling-Intervall in Millisekunden (default: 10000)
}

export function GroupsOverviewPolling({ pollInterval = 10000 }: GroupsOverviewPollingProps) {
  const { data, loading, polling, lastFetch, refreshData, startPolling, stopPolling } = useGroupsPolling({
    pollInterval,
    enablePolling: true
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedGroupForUser, setSelectedGroupForUser] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithId | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<RegistrationWithId | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleRegistrationStatusChange = async (field: 'paid' | 'checkedIn', value: boolean) => {
    if (!selectedRegistration) return;
    const res = await updateStatus(selectedRegistration._id, { [field]: value });
    if (res.success && res.updated) {
      setSelectedRegistration(sel => sel ? { ...sel, ...res.updated } as RegistrationWithId : sel);
      // Daten werden automatisch über Polling synchronisiert
    }
  };

  // Zeit seit letztem Update formatieren
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Nie';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `vor ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `vor ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `vor ${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Auto-Update Status */}
      <div className="bg-gray-50 px-6 py-2 text-xs flex justify-between items-center border-b">
        <span>Groups Management</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${polling ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
            <span className={polling ? 'text-green-600' : 'text-orange-600'}>
              {polling ? `Auto-Update aktiv (${pollInterval/1000}s)` : 'Auto-Update pausiert'}
            </span>
          </div>
          
          <span className="text-gray-500">
            Letzte Aktualisierung: {formatLastUpdate(lastFetch)}
          </span>
          
          <div className="flex gap-2">
            <button 
              onClick={refreshData}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Sofort aktualisieren"
            >
              ↻ Neu laden
            </button>
            
            {polling ? (
              <button 
                onClick={stopPolling}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                title="Auto-Update pausieren"
              >
                ⏸ Pausieren
              </button>
            ) : (
              <button 
                onClick={startPolling}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                title="Auto-Update starten"
              >
                ▶ Starten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'groups'
                ? 'border-[#ff9900] text-[#ff9900]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gruppen ({data.groups.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-[#ff9900] text-[#ff9900]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benutzer ({data.users.length})
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'registrations'
                ? 'border-[#ff9900] text-[#ff9900]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Anmeldungen ({data.registrations.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Statistics */}
        {data.statistics && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ff9900]">{data.statistics.totalUsers}</div>
              <div className="text-sm text-gray-600">Gesamt Benutzer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.statistics.usersWithGroups}</div>
              <div className="text-sm text-gray-600">In Gruppen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.statistics.usersWithoutGroups}</div>
              <div className="text-sm text-gray-600">Ohne Gruppe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.statistics.assignableGroups}</div>
              <div className="text-sm text-gray-600">Zuweisbare Gruppen</div>
            </div>
          </div>
        )}

        {/* Tab Components */}
        {activeTab === 'groups' && (
          <GroupsTab
            groups={data.groups}
            users={data.users}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onCreateGroup={() => setShowCreateGroup(true)}
            onEditGroup={setEditingGroup}
            onDeleteGroup={setDeleteGroupId}
            onAddUserToGroup={(groupId) => {
              setSelectedGroupForUser(groupId);
              setShowAddUserDialog(true);
            }}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={data.users}
            groups={data.groups}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onDeleteUser={setDeleteUserId}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'registrations' && (
          <RegistrationsTab
            registrations={data.registrations}
            onSelectRegistration={setSelectedRegistration}
            onEditRegistration={setEditingRegistration}
          />
        )}
      </div>

      {/* Dialogs - Nach Aktionen wird automatisch über Polling aktualisiert */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(group) => {
          setShowCreateGroup(false);
          // Sofort aktualisieren nach dem Erstellen
          setTimeout(refreshData, 500);
        }}
      />

      <EditGroupDialog
        group={editingGroup}
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        onGroupUpdated={(updatedGroup) => {
          setEditingGroup(null);
          setTimeout(refreshData, 500);
        }}
      />

      <DeleteGroupDialog
        groupId={deleteGroupId}
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onGroupDeleted={() => {
          setDeleteGroupId(null);
          setTimeout(refreshData, 500);
        }}
      />

      <AddUserToGroupDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        groupId={selectedGroupForUser}
        groups={data.groups}
        users={data.users}
        onUserAdded={() => {
          setShowAddUserDialog(false);
          setSelectedGroupForUser(null);
          setTimeout(refreshData, 500);
        }}
      />

      <RegistrationDetailDialog
        registration={selectedRegistration}
        open={!!selectedRegistration}
        onOpenChange={(open) => !open && setSelectedRegistration(null)}
        onStatusChange={handleRegistrationStatusChange}
      />

      <EditRegistrationDialog
        registration={editingRegistration}
        open={!!editingRegistration}
        onOpenChange={(open) => !open && setEditingRegistration(null)}
        onRegistrationUpdated={(updatedRegistration) => {
          setEditingRegistration(null);
          setTimeout(refreshData, 500);
        }}
      />

      <DeleteUserDialog
        userId={deleteUserId}
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onUserDeleted={() => {
          setDeleteUserId(null);
          setTimeout(refreshData, 500);
        }}
      />
    </div>
  );
} 