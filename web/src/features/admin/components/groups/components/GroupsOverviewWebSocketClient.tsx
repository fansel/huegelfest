"use client";

import React, { useState } from 'react';
import { useGroupsWebSocket } from '../hooks/useGroupsWebSocket';
import type { GroupData } from '../types';
import type { TabType, User, RegistrationWithId } from './types';
import type { GroupsData } from '../actions/fetchGroupsData';
import { updateStatus } from '../../../../registration/actions/updateRegistrationStatus';
import { toast } from 'react-hot-toast';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';

import { GroupsTab } from './GroupsTab';
import { IntegratedUsersTab } from './IntegratedUsersTab';
import { RegistrationsTab } from './RegistrationsTab';
import { CreateGroupDialog } from './dialogs/CreateGroupDialog';
import { EditGroupDialog } from './dialogs/EditGroupDialog';
import { DeleteGroupDialog } from './dialogs/DeleteGroupDialog';
import { AddUserToGroupDialog } from './dialogs/AddUserToGroupDialog';
import { RegistrationDetailDialog } from './dialogs/RegistrationDetailDialog';
import { EditRegistrationDialog } from './dialogs/EditRegistrationDialog';
import { DeleteUserDialog } from './dialogs/DeleteUserDialog';
import { UserRegistrationDialog } from '../../users/UserRegistrationDialog';
import { UserManagementActions } from '../../users/UserManagementActions';
import { UserManagementTab } from './UserManagementTab';

interface GroupsOverviewWebSocketProps {
  initialData: GroupsData;
}

/**
 * Groups Overview mit WebSocket-Integration über die bestehende Infrastruktur
 * Folgt dem Muster von Timeline und anderen Features
 * Responsive Design: Desktop = Tabs, Mobile = Card-Layout
 */
export function GroupsOverviewWebSocketClient({ initialData }: GroupsOverviewWebSocketProps) {
  const { data, loading, connected, refreshData } = useGroupsWebSocket(initialData);
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [activeTab, setActiveTab] = useState<TabType>('users'); // Start with users tab as default
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  
  // Dialog states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedGroupForUser, setSelectedGroupForUser] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithId | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<RegistrationWithId | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // User Registration Dialog states
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

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

  const handleShowUserRegistration = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowUserRegistration(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Daten...</div>
      </div>
    );
  }

  // Mobile Layout: Kompakte Card-basierte Navigation
  if (isMobile) {
    return (
      <div className="bg-white min-h-screen">
        {/* Mobile Connection Status - Verbesserte Stabilität */}
        <div className="bg-gray-50 px-4 py-2 text-xs flex justify-between items-center border-b">
          <span className="font-medium">Groups Manager</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-1000 ${connected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            <span className={`transition-colors duration-1000 ${connected ? 'text-green-600' : 'text-orange-600'}`}>
              {connected ? 'Live' : 'Offline'}
            </span>
            {!connected && (
              <button 
                onClick={refreshData}
                className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Laden
              </button>
            )}
          </div>
        </div>

        {/* Mobile Statistics Cards */}
        {data.statistics && (
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="bg-gradient-to-br from-[#ff9900]/10 to-[#ff9900]/5 p-4 rounded-lg border border-[#ff9900]/20">
              <div className="text-xl font-bold text-[#ff9900]">{data.statistics.totalUsers}</div>
              <div className="text-xs text-gray-600">Gesamt Benutzer</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-lg border border-green-500/20">
              <div className="text-xl font-bold text-green-600">{data.statistics.usersWithGroups}</div>
              <div className="text-xs text-gray-600">In Gruppen</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-4 rounded-lg border border-orange-500/20">
              <div className="text-xl font-bold text-orange-600">{data.statistics.usersWithoutGroups}</div>
              <div className="text-xs text-gray-600">Ohne Gruppe</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-lg border border-blue-500/20">
              <div className="text-xl font-bold text-blue-600">{data.statistics.assignableGroups}</div>
              <div className="text-xs text-gray-600">Zuweisbar</div>
            </div>
          </div>
        )}

        {/* Mobile Tab Navigation - Horizontal Scroll */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 space-x-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Benutzer ({data.users.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Gruppen ({data.groups.length})
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'registrations'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Anmeldungen ({data.registrations.length})
            </button>
          </div>
        </div>

        {/* Mobile Tab Content with padding */}
        <div className="p-4">
          {activeTab === 'users' && (
            <UserManagementTab
              users={data.users.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                username: u.username, // Use actual username from database instead of generating fake one
                role: u.role,
                emailVerified: true, // Default, da nicht im Typ vorhanden
                isShadowUser: u.isShadowUser === true,
                groupId: u.groupId,
                lastLogin: u.lastActivity,
                createdAt: u.createdAt,
              }))}
              groups={data.groups}
              onRefreshUsers={refreshData}
              showArchive={showArchive}
              setShowArchive={setShowArchive}
              shadowUsers={data.users.filter(u => u.isShadowUser === true)}
            />
          )}

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

          {activeTab === 'registrations' && (
            <RegistrationsTab
              registrations={data.registrations}
              onSelectRegistration={setSelectedRegistration}
              onEditRegistration={setEditingRegistration}
            />
          )}
        </div>

        {/* Mobile Dialogs verwenden bereits responsive Patterns */}
        <CreateGroupDialog
          open={showCreateGroup}
          onOpenChange={setShowCreateGroup}
          onGroupCreated={(group) => {
            setShowCreateGroup(false);
            toast.success('Gruppe erstellt');
          }}
        />

        <EditGroupDialog
          group={editingGroup}
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          onGroupUpdated={(updatedGroup) => {
            setEditingGroup(null);
            toast.success('Gruppe aktualisiert');
          }}
        />

        <DeleteGroupDialog
          groupId={deleteGroupId}
          open={!!deleteGroupId}
          onOpenChange={(open) => !open && setDeleteGroupId(null)}
          onGroupDeleted={() => {
            setDeleteGroupId(null);
            toast.success('Gruppe gelöscht');
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
          }}
        />

        <DeleteUserDialog
          userId={deleteUserId}
          open={!!deleteUserId}
          onOpenChange={(open) => !open && setDeleteUserId(null)}
          onUserDeleted={() => {
            setDeleteUserId(null);
            toast.success('Benutzer gelöscht');
          }}
        />

        <UserRegistrationDialog
          userId={selectedUserId}
          userName={selectedUserName}
          open={showUserRegistration}
          onOpenChange={(open) => {
            if (!open) {
              setShowUserRegistration(false);
              setSelectedUserId(null);
              setSelectedUserName('');
            }
          }}
        />
      </div>
    );
  }

  // Desktop Layout: Original Layout beibehalten
  return (
    <div className="bg-white min-h-screen">
      {/* Connection Status - Verbesserte Anzeige */}
      <div className="bg-gray-50 px-6 py-2 text-xs flex justify-between items-center border-b">
        <span>Groups Management</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-1000 ${connected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className={`transition-colors duration-1000 ${connected ? 'text-green-600' : 'text-orange-600'}`}>
            {connected ? 'Live-Updates aktiv' : 'Netzwerk stabilisiert sich'}
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
        {activeTab === 'users' && (
          <UserManagementTab
            users={data.users.map(u => ({
              _id: u._id,
              name: u.name,
              email: u.email,
              username: u.username, // Use actual username from database instead of generating fake one
              role: u.role,
              emailVerified: true, // Default, da nicht im Typ vorhanden
              isShadowUser: u.isShadowUser === true,
              groupId: u.groupId,
              lastLogin: u.lastActivity,
              createdAt: u.createdAt,
            }))}
            groups={data.groups}
            onRefreshUsers={refreshData}
            showArchive={showArchive}
            setShowArchive={setShowArchive}
            shadowUsers={data.users.filter(u => u.isShadowUser === true)}
          />
        )}

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

      <UserRegistrationDialog
        userId={selectedUserId}
        userName={selectedUserName}
        open={showUserRegistration}
        onOpenChange={(open) => {
          if (!open) {
            setShowUserRegistration(false);
            setSelectedUserId(null);
            setSelectedUserName('');
          }
        }}
      />
    </div>
  );
} 