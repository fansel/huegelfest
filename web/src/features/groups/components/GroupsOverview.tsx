"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "react-hot-toast";
import { getAllGroupsAction, getGroupStatsAction, createGroupAction, updateGroupAction, deleteGroupAction } from '../actions/groupActions';
import { getAllUsersAction, deleteUserAction } from '../../auth/actions/userActions';
import { getRegistrations } from '../../registration/actions/getRegistrations';
import { updateStatus } from '../../registration/actions/updateRegistrationStatus';
import { updateRegistrationAction } from '../../registration/actions/updateRegistration';
import type { GroupData, GroupAssignmentStats } from '../types';
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

export function GroupsOverview() {
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationWithId[]>([]);
  const [statistics, setStatistics] = useState<GroupAssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsResult, statsResult, registrationsData, usersData] = await Promise.all([
        getAllGroupsAction(),
        getGroupStatsAction(),
        getRegistrations(),
        getAllUsersAction()
      ]);

      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStatistics(statsResult.data);
      }

      setRegistrations(registrationsData);
      setUsers(usersData);

    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationStatusChange = async (field: 'paid' | 'checkedIn', value: boolean) => {
    if (!selectedRegistration) return;
    const res = await updateStatus(selectedRegistration._id, { [field]: value });
    if (res.success && res.updated) {
      setSelectedRegistration(sel => sel ? { ...sel, ...res.updated } as RegistrationWithId : sel);
      setRegistrations(regs => regs.map(r => r._id === selectedRegistration._id ? { ...r, ...res.updated } as RegistrationWithId : r));
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
            Gruppen ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-[#ff9900] text-[#ff9900]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benutzer ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'registrations'
                ? 'border-[#ff9900] text-[#ff9900]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Anmeldungen ({registrations.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ff9900]">{statistics.totalUsers}</div>
              <div className="text-sm text-gray-600">Gesamt Benutzer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.usersWithGroups}</div>
              <div className="text-sm text-gray-600">In Gruppen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statistics.usersWithoutGroups}</div>
              <div className="text-sm text-gray-600">Ohne Gruppe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.assignableGroups}</div>
              <div className="text-sm text-gray-600">Zuweisbare Gruppen</div>
            </div>
          </div>
        )}

        {/* Tab Components */}
        {activeTab === 'groups' && (
          <GroupsTab
            groups={groups}
            users={users}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onCreateGroup={() => setShowCreateGroup(true)}
            onEditGroup={setEditingGroup}
            onDeleteGroup={setDeleteGroupId}
            onAddUserToGroup={(groupId) => {
              setSelectedGroupForUser(groupId);
              setShowAddUserDialog(true);
            }}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            groups={groups}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onDeleteUser={setDeleteUserId}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'registrations' && (
          <RegistrationsTab
            registrations={registrations}
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
          setGroups(prev => [...prev, group]);
          toast.success('Gruppe erstellt');
        }}
      />

      <EditGroupDialog
        group={editingGroup}
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        onGroupUpdated={(updatedGroup) => {
          setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
          setEditingGroup(null);
          toast.success('Gruppe aktualisiert');
        }}
      />

      <DeleteGroupDialog
        groupId={deleteGroupId}
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onGroupDeleted={() => {
          if (deleteGroupId) {
            setGroups(groups => groups.filter(g => g.id !== deleteGroupId));
            loadData(); // Refresh data to update user assignments
            toast.success('Gruppe gelöscht');
          }
          setDeleteGroupId(null);
        }}
      />

      <AddUserToGroupDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        groupId={selectedGroupForUser}
        groups={groups}
        users={users}
        onUserAdded={() => {
          loadData();
          setShowAddUserDialog(false);
          setSelectedGroupForUser(null);
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
          setRegistrations(regs => 
            regs.map(r => 
              r._id === updatedRegistration._id 
                ? updatedRegistration
                : r
            )
          );
          setEditingRegistration(null);
          toast.success('Anmeldung aktualisiert');
        }}
      />

      <DeleteUserDialog
        userId={deleteUserId}
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onUserDeleted={() => {
          if (deleteUserId) {
            setUsers(users => users.filter(u => u.deviceId !== deleteUserId));
            toast.success('Benutzer gelöscht');
          }
          setDeleteUserId(null);
        }}
      />
    </div>
  );
} 