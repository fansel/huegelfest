"use client";

import React, { useState } from 'react';
import { useGroupsWebSocket } from '../hooks/useGroupsWebSocket';
import type { GroupData } from '../types';
import type { TabType, User, RegistrationWithId } from './types';
import { updateStatus } from '../../registration/actions/updateRegistrationStatus';
import { toast } from 'react-hot-toast';

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

/**
 * Groups Overview mit WebSocket-Integration über die bestehende Infrastruktur
 * Folgt dem Muster von Timeline und anderen Features
 */
export function GroupsOverviewWebSocket() {
  const { data, loading, connected, refreshData } = useGroupsWebSocket();
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
      // Toast für den ausführenden Admin
      const fieldName = field === 'paid' ? 'Bezahlt-Status' : 'Check-In-Status';
      toast.success(`${fieldName} aktualisiert`);
      // WebSocket wird das Update automatisch verbreiten
    }
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
      {/* Connection Status */}
      <div className="bg-gray-50 px-6 py-2 text-xs flex justify-between items-center border-b">
        <span>Groups Management</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={connected ? 'text-green-600' : 'text-red-600'}>
            {connected ? 'Live-Updates aktiv' : 'Verbindung getrennt'}
          </span>
          {!connected && (
            <button 
              onClick={refreshData}
              className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Neu laden
            </button>
          )}
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

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(group) => {
          setShowCreateGroup(false);
          toast.success('Gruppe erstellt');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
        }}
      />

      <EditGroupDialog
        group={editingGroup}
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        onGroupUpdated={(updatedGroup) => {
          setEditingGroup(null);
          toast.success('Gruppe aktualisiert');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
        }}
      />

      <DeleteGroupDialog
        groupId={deleteGroupId}
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onGroupDeleted={() => {
          setDeleteGroupId(null);
          toast.success('Gruppe gelöscht');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
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
          toast.success('Benutzer wurde zugewiesen');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
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
          toast.success('Anmeldung aktualisiert');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
        }}
      />

      <DeleteUserDialog
        userId={deleteUserId}
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onUserDeleted={() => {
          setDeleteUserId(null);
          toast.success('Benutzer gelöscht');
          // WebSocket broadcast wird automatisch andere Clients benachrichtigen
        }}
      />
    </div>
  );
} 