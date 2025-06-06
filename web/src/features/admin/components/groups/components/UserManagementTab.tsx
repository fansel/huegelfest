import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Mail, CheckCircle, AlertCircle, Search, Shield, Users, Clock, MoreVertical, UserCheck, UserX, Eye, EyeOff, Key, Archive } from 'lucide-react';
import { sendPasswordResetAction } from '@/features/auth/actions/passwordReset';
import { changeUserRoleAction, changeShadowUserStatusAction } from '@/features/auth/actions/userActions';
import { useAuth } from '@/features/auth/AuthContext';
import toast from 'react-hot-toast';
import type { GroupData } from '../types';
import { assignUserToGroupAction } from '../actions/groupActions';

// Vereinheitlichter User-Typ
export interface UserManagementUser {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  role: 'user' | 'admin';
  emailVerified?: boolean;
  isShadowUser?: boolean;
  groupId?: string;
  lastLogin?: Date;
  createdAt?: Date;
}

interface UserManagementTabProps {
  users: UserManagementUser[];
  groups: GroupData[];
  onRefreshUsers: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({ users, groups, onRefreshUsers }) => {
  const { user: currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserManagementUser | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [sentResets, setSentResets] = useState<Set<string>>(new Set());
  const [groupAssignLoading, setGroupAssignLoading] = useState<string | null>(null);

  // Debug: Logge alle User und deren Shadow-Status
  console.log('Alle User:', users.map(u => ({ name: u.name, isShadowUser: u.isShadowUser })));

  // Filter
  const filteredUsers = users.filter(u => !u.isShadowUser && (
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  // Filter für Shadow-Archiv
  const shadowUsers = users.filter(u => u.isShadowUser === true && (
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  // Statistiken
  const stats = {
    total: filteredUsers.length,
    withGroups: filteredUsers.filter(u => u.groupId).length,
    withoutGroups: filteredUsers.filter(u => !u.groupId).length,
    admins: filteredUsers.filter(u => u.role === 'admin').length,
    assignableGroups: groups.filter(g => g.isAssignable).length,
  };

  // Gruppen-Name
  const getUserGroup = (user: UserManagementUser) => user.groupId ? groups.find(g => g.id === user.groupId) : null;

  // Aktionen
  const handleSendPasswordReset = async (user: UserManagementUser) => {
    if (!user.email) {
      toast.error('Dieser User hat keine E-Mail-Adresse hinterlegt');
      return;
    }
    setIsSendingReset(true);
    setSelectedUser(user);
    setOpenDropdown(null);
    try {
      const result = await sendPasswordResetAction(user.email);
      if (result.success) {
        setSentResets(prev => new Set(prev).add(user._id));
        toast.success(`Passwort-Reset-Link an ${user.name} gesendet`);
      } else {
        toast.error(result.error || 'Fehler beim Senden des Reset-Links');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSendingReset(false);
      setSelectedUser(null);
    }
  };

  const handleChangeUserRole = async (user: UserManagementUser, newRole: 'user' | 'admin') => {
    if (user._id === currentUser?.id && newRole === 'user') {
      toast.error('Sie können sich nicht selbst die Admin-Berechtigung entziehen');
      return;
    }
    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);
    try {
      const result = await changeUserRoleAction(user._id, newRole);
      if (result.success) {
        toast.success(`${user.name} ist jetzt ${newRole === 'admin' ? 'Admin' : 'normaler User'}`);
        onRefreshUsers();
      } else {
        toast.error(result.error || 'Fehler beim Ändern der Rolle');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingUser(false);
      setSelectedUser(null);
    }
  };

  const handleChangeShadowStatus = async (user: UserManagementUser, isShadowUser: boolean) => {
    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);
    try {
      const result = await changeShadowUserStatusAction(user._id, isShadowUser);
      if (result.success) {
        toast.success(`${user.name} ist jetzt ${isShadowUser ? 'Shadow User' : 'sichtbarer User'}`);
        onRefreshUsers();
      } else {
        toast.error(result.error || 'Fehler beim Ändern des Shadow-Status');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingUser(false);
      setSelectedUser(null);
    }
  };

  const handleAssignToGroup = async (user: UserManagementUser, groupId: string) => {
    setGroupAssignLoading(user._id);
    try {
      const result = await assignUserToGroupAction(user._id, groupId);
      if (result.success) {
        toast.success('Gruppe zugewiesen');
        onRefreshUsers();
      } else {
        toast.error(result.error || 'Fehler beim Zuweisen der Gruppe');
      }
    } catch (error) {
      toast.error('Fehler beim Zuweisen der Gruppe');
    } finally {
      setGroupAssignLoading(null);
    }
  };

  // UI
  if (!isAdmin) {
    return <div className="p-6 text-red-600">Keine Berechtigung für User-Management.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">Benutzerverwaltung</div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setShowArchive(!showArchive)}
        >
          {showArchive ? (
            <>
              <Eye className="h-4 w-4" /> Aktive User anzeigen
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" /> Archiv anzeigen ({shadowUsers.length})
            </>
          )}
        </Button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-[#ff9900]">{stats.total}</div>
          <div className="text-sm text-gray-600">Gesamt Benutzer</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{stats.withGroups}</div>
          <div className="text-sm text-green-600">Mit Gruppe</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700">{stats.withoutGroups}</div>
          <div className="text-sm text-orange-600">Ohne Gruppe</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{stats.admins}</div>
          <div className="text-sm text-red-600">Admins</div>
        </div>
      </div>

      {/* Suche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="User suchen (Name, E-Mail, Username)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User-Liste oder Archiv */}
      {!showArchive ? (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Keine User gefunden</div>
          ) : (
            filteredUsers.map(user => {
              const userGroup = getUserGroup(user);
              return (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        {sentResets.has(user._id) && (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" /> Reset gesendet
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {user.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> <span className="font-mono">{user.email}</span>
                          </div>
                        ) : (
                          <div className="text-orange-600">
                            <AlertCircle className="h-3 w-3 inline mr-1" /> Keine E-Mail hinterlegt
                          </div>
                        )}
                        {user.username && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> <span>@{user.username}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" /> <span>Letzter Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('de-DE') : 'Nie'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSendingReset || isUpdatingUser}
                        className="border-gray-300 hover:bg-gray-50"
                        onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {openDropdown === user._id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {user.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendPasswordReset(user)}
                            className="bg-white"
                            disabled={!user.email || isSendingReset || isUpdatingUser}
                          >
                            <Key className="mr-2 h-3 w-3" />
                            {sentResets.has(user._id) ? 'Reset erneut senden' : 'Passwort-Reset'}
                          </Button>
                        )}
                        {user.role === 'admin' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeUserRole(user, 'user')}
                            className="bg-white"
                            disabled={user._id === currentUser?.id || isUpdatingUser}
                          >
                            <UserX className="mr-2 h-3 w-3" /> Admin entfernen
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeUserRole(user, 'admin')}
                            className="bg-white"
                            disabled={isUpdatingUser}
                          >
                            <UserCheck className="mr-2 h-3 w-3" /> Zu Admin machen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeShadowStatus(user, true)}
                          className="bg-white"
                          disabled={isUpdatingUser}
                        >
                          <EyeOff className="mr-2 h-3 w-3" /> Als Shadow User
                        </Button>
                        {/* Gruppen Dropdown */}
                        <Select
                          value={user.groupId || 'NONE'}
                          onValueChange={value => handleAssignToGroup(user, value)}
                          disabled={groupAssignLoading === user._id}
                        >
                          <SelectTrigger className="w-48 bg-white">
                            <SelectValue>
                              {groupAssignLoading === user._id ? (
                                <span className="flex items-center gap-2">
                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                                  Speichere...
                                </span>
                              ) : userGroup ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: userGroup.color }} />
                                  {userGroup.name}
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-gray-300" /> Keine Gruppe
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Keine Gruppe</SelectItem>
                            {groups.map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                                  {group.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Shadow-Archiv
        <div className="space-y-3">
          {shadowUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Keine Shadow User im Archiv</div>
          ) : (
            shadowUsers.map(user => (
              <div key={user._id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="opacity-75">
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100">Shadow</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {user.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> <span className="font-mono">{user.email}</span>
                        </div>
                      ) : (
                        <div className="text-orange-600">
                          <AlertCircle className="h-3 w-3 inline mr-1" /> Keine E-Mail hinterlegt
                        </div>
                      )}
                      {user.username && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> <span>@{user.username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" /> <span>Letzter Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('de-DE') : 'Nie'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {openDropdown === user._id && (
                  <div className="mt-3 p-3 bg-white rounded-lg border space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeShadowStatus(user, false)}
                        className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                        disabled={isUpdatingUser}
                      >
                        <Eye className="mr-2 h-3 w-3" /> Sichtbar machen
                      </Button>
                      {user.role === 'admin' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeUserRole(user, 'user')}
                          className="bg-white"
                          disabled={user._id === currentUser?.id || isUpdatingUser}
                        >
                          <UserX className="mr-2 h-3 w-3" /> Admin entfernen
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeUserRole(user, 'admin')}
                          className="bg-white"
                          disabled={isUpdatingUser}
                        >
                          <UserCheck className="mr-2 h-3 w-3" /> Zu Admin machen
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}; 