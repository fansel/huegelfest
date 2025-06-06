"use client";

import React, { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { toast } from "react-hot-toast";
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { 
  Search, 
  Loader2, 
  Shield, 
  Users, 
  Filter,
  UserPlus,
  MoreVertical,
  Trash2,
  FileText,
  Key,
  Mail,
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
  UserCheck,
  UserX
} from 'lucide-react';
import { assignUserToGroupAction, removeUserFromGroupAction } from '../actions/groupActions';
import { sendPasswordResetAction } from '@/features/auth/actions/passwordReset';
import { changeUserRoleAction, changeShadowUserStatusAction } from '@/features/auth/actions/userActions';
import type { GroupData } from '../types';
import type { User } from './types';
import { useAuth } from '@/features/auth/AuthContext';

interface IntegratedUsersTabProps {
  users: User[];
  groups: GroupData[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onDeleteUser: (userId: string) => void;
  onRefreshData: () => void;
  onShowUserRegistration?: (userId: string, userName: string) => void;
}

type GroupFilter = 'all' | 'with-group' | 'without-group' | string;
type SortOption = 'name' | 'email' | 'group' | 'role' | 'created';

export function IntegratedUsersTab({
  users,
  groups,
  searchTerm,
  setSearchTerm,
  onDeleteUser,
  onRefreshData,
  onShowUserRegistration
}: IntegratedUsersTabProps) {
  const { deviceType } = useDeviceContext();
  const { user: currentUser } = useAuth();
  const isMobile = deviceType === 'mobile';
  
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState<Set<string>>(new Set());
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<Set<string>>(new Set());

  const handleRefreshData = () => {
    onRefreshData();
  };

  // Filter users based on search term and group filter
  const filteredUsers = users.filter(user => {
    // Shadow-User ausschließen
    if (user.isShadowUser) return false;
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (groupFilter) {
      case 'all':
        return true;
      case 'with-group':
        return !!user.groupId;
      case 'without-group':
        return !user.groupId;
      default:
        return user.groupId === groupFilter;
    }
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'email':
        return a.email.localeCompare(b.email);
      case 'group':
        const groupA = a.groupId ? groups.find(g => g.id === a.groupId)?.name || '' : '';
        const groupB = b.groupId ? groups.find(g => g.id === b.groupId)?.name || '' : '';
        return groupA.localeCompare(groupB);
      case 'role':
        return a.role.localeCompare(b.role);
      case 'created':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  const handleAssignToGroup = async (userId: string, groupId: string) => {
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      const result = await assignUserToGroupAction(userId, groupId);
      if (result.success) {
        toast.success('Benutzer zur Gruppe hinzugefügt');
        onRefreshData();
      } else {
        toast.error(result.error || 'Fehler beim Hinzufügen des Benutzers');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRemoveFromGroup = async (userId: string, groupId: string) => {
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      const result = await removeUserFromGroupAction(userId);
      if (result.success) {
        toast.success('Benutzer aus Gruppe entfernt');
        onRefreshData();
      } else {
        toast.error(result.error || 'Fehler beim Entfernen des Benutzers');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!user.email) {
      toast.error('Dieser Benutzer hat keine E-Mail-Adresse');
      return;
    }

    setResetPasswordLoading(prev => new Set(prev).add(user._id));
    try {
      const result = await sendPasswordResetAction(user.email);
      if (result.success) {
        toast.success('Passwort-Reset-Link gesendet');
      } else {
        toast.error(result.error || 'Fehler beim Senden des Reset-Links');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setResetPasswordLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(user._id);
        return newSet;
      });
    }
  };

  const handleChangeUserRole = async (user: User, newRole: 'user' | 'admin') => {
    if (user._id === currentUser?.id && newRole === 'user') {
      toast.error('Sie können sich nicht selbst die Admin-Berechtigung entziehen');
      return;
    }

    setIsUpdatingRole(prev => new Set(prev).add(user._id));
    try {
      const result = await changeUserRoleAction(user._id, newRole);
      
      if (result.success) {
        toast.success(`${user.name} ist jetzt ${newRole === 'admin' ? 'Admin' : 'normaler User'}`);
        onRefreshData();
      } else {
        toast.error(result.error || 'Fehler beim Ändern der Rolle');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingRole(prev => {
        const newSet = new Set(prev);
        newSet.delete(user._id);
        return newSet;
      });
    }
  };

  const handleChangeShadowStatus = async (userId: string, isShadow: boolean) => {
    setLoadingUsers(prev => new Set(prev).add(userId));
    setShowActionsFor(null);

    try {
      const result = await changeShadowUserStatusAction(userId, isShadow);
      
      if (result.success) {
        toast.success(`Benutzer wurde ${isShadow ? 'als Shadow User markiert' : 'aus dem Shadow-Modus entfernt'}`);
        onRefreshData();
      } else {
        toast.error(result.error || 'Fehler beim Ändern des Shadow-Status');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getUserGroup = (user: User): GroupData | null => {
    return user.groupId ? groups.find(g => g.id === user.groupId) || null : null;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group statistics for display
  const groupStats = {
    total: users.filter(u => !u.isShadowUser).length, // Shadow-User aus Statistik ausschließen
    withGroups: users.filter(u => !u.isShadowUser && u.groupId).length,
    withoutGroups: users.filter(u => !u.isShadowUser && !u.groupId).length,
    admins: users.filter(u => !u.isShadowUser && u.role === 'admin').length,
    moderators: 0, // No moderator role in this system
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Header */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Benutzer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="text-sm text-gray-600">
              {sortedUsers.length} von {users.length} Benutzer
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Gruppe</label>
                <Select value={groupFilter} onValueChange={(value) => setGroupFilter(value as GroupFilter)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Gruppen</SelectItem>
                    <SelectItem value="with-group">Mit Gruppe</SelectItem>
                    <SelectItem value="without-group">Ohne Gruppe</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Sortierung</label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="group">Gruppe</SelectItem>
                    <SelectItem value="role">Rolle</SelectItem>
                    <SelectItem value="created">Erstellt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{groupStats.withGroups}</div>
            <div className="text-xs text-blue-600">Mit Gruppe</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-lg font-bold text-orange-600">{groupStats.withoutGroups}</div>
            <div className="text-xs text-orange-600">Ohne Gruppe</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-lg font-bold text-red-600">{groupStats.admins}</div>
            <div className="text-xs text-red-600">Admins</div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {sortedUsers.map(user => {
            const userGroup = getUserGroup(user);
            const isLoading = loadingUsers.has(user._id);
            const isPasswordLoading = resetPasswordLoading.has(user._id);
            const showActions = showActionsFor === user._id;
            
            return (
              <div
                key={user._id}
                className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white shadow-sm"
              >
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ 
                        backgroundColor: userGroup?.color || '#e5e7eb'
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{user.name}</h3>
                        {getRoleIcon(user.role)}
                      </div>
                      <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Actions Toggle */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setShowActionsFor(showActions ? null : user._id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                {/* Actions Menu */}
                {showActions && (
                  <div className="border-t pt-2 space-y-1">
                    {onShowUserRegistration && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3 py-1.5 h-auto text-sm text-gray-700"
                        onClick={() => {
                          onShowUserRegistration(user._id, user.name);
                          setShowActionsFor(null);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Anmeldung anzeigen</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-1.5 h-auto text-sm text-gray-700"
                      onClick={() => {
                        handleResetPassword(user);
                        setShowActionsFor(null);
                      }}
                      disabled={isPasswordLoading}
                    >
                      <Key className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {isPasswordLoading ? 'Setzt zurück...' : 'Passwort zurücksetzen'}
                      </span>
                    </Button>

                    {/* Admin Role Toggle */}
                    {user.role === 'admin' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3 py-1.5 h-auto text-sm text-gray-700"
                        onClick={() => {
                          handleChangeUserRole(user, 'user');
                          setShowActionsFor(null);
                        }}
                        disabled={user._id === currentUser?.id || isUpdatingRole.has(user._id)}
                      >
                        <UserX className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {isUpdatingRole.has(user._id) ? 'Aktualisiere...' : 'Admin entfernen'}
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3 py-1.5 h-auto text-sm text-gray-700"
                        onClick={() => {
                          handleChangeUserRole(user, 'admin');
                          setShowActionsFor(null);
                        }}
                        disabled={isUpdatingRole.has(user._id)}
                      >
                        <UserCheck className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {isUpdatingRole.has(user._id) ? 'Aktualisiere...' : 'Zu Admin machen'}
                        </span>
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-1.5 h-auto text-sm text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => {
                        handleChangeShadowStatus(user._id, true);
                        setShowActionsFor(null);
                      }}
                      disabled={loadingUsers.has(user._id)}
                    >
                      {loadingUsers.has(user._id) ? (
                        <Loader2 className="mr-2 h-4 w-4 flex-shrink-0 animate-spin" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">Als Shadow User markieren</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-1.5 h-auto text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        onDeleteUser(user._id);
                        setShowActionsFor(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Benutzer löschen</span>
                    </Button>
                  </div>
                )}

                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                  </div>
                  {user.isShadowUser && (
                    <div className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      Shadow User
                    </div>
                  )}
                </div>

                {/* Group Assignment */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Gruppe zuweisen:</label>
                  <Select
                    value={user.groupId || "NONE"}
                    onValueChange={async (value) => {
                      if (value === "NONE") {
                        if (user.groupId) {
                          await handleRemoveFromGroup(user._id, user.groupId);
                        }
                      } else {
                        await handleAssignToGroup(user._id, value);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Wird aktualisiert...
                          </span>
                        ) : userGroup ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: userGroup.color }}
                            />
                            <span className="truncate">{userGroup.name}</span>
                            {!userGroup.isAssignable && (
                              <span className="text-orange-600 text-xs">(gesperrt)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Keine Gruppe</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">
                        <span className="text-gray-500">Keine Gruppe</span>
                      </SelectItem>
                      {groups
                        .filter(group => group.isAssignable)
                        .map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              <span className="truncate">{group.name}</span>
                              <span className="text-xs text-gray-500">
                                ({groups.find(g => g.id === group.id)?.memberCount || 0})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Erstellt: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}</div>
                  {user.lastActivity && (
                    <div>Letzte Aktivität: {new Date(user.lastActivity).toLocaleDateString('de-DE')}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              Passen Sie Ihre Suchkriterien oder Filter an.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Benutzer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Select value={groupFilter} onValueChange={(value) => setGroupFilter(value as GroupFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Gruppe filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gruppen</SelectItem>
                <SelectItem value="with-group">Mit Gruppe</SelectItem>
                <SelectItem value="without-group">Ohne Gruppe</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">E-Mail</SelectItem>
                <SelectItem value="group">Gruppe</SelectItem>
                <SelectItem value="role">Rolle</SelectItem>
                <SelectItem value="created">Erstellt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-gray-600">
            {sortedUsers.length} von {users.length} Benutzer
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-700">{groupStats.total}</div>
          <div className="text-sm text-gray-600">Gesamt</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{groupStats.withGroups}</div>
          <div className="text-sm text-blue-600">Mit Gruppe</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{groupStats.withoutGroups}</div>
          <div className="text-sm text-orange-600">Ohne Gruppe</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{groupStats.admins}</div>
          <div className="text-sm text-red-600">Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gruppe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gruppe zuweisen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map(user => {
                const userGroup = getUserGroup(user);
                const isLoading = loadingUsers.has(user._id);
                const isPasswordLoading = resetPasswordLoading.has(user._id);
                const showActions = showActionsFor === user._id;
                
                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ 
                            backgroundColor: userGroup?.color || '#e5e7eb'
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          <div className="text-xs text-gray-500 font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </div>
                        {user.isShadowUser && (
                          <div className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            Shadow
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userGroup ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: userGroup.color }}
                          />
                          <span className="text-sm text-gray-900 truncate max-w-32">{userGroup.name}</span>
                          {!userGroup.isAssignable && (
                            <span className="text-xs text-orange-600">(gesperrt)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Keine Gruppe</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={user.groupId || "NONE"}
                        onValueChange={async (value) => {
                          if (value === "NONE") {
                            if (user.groupId) {
                              await handleRemoveFromGroup(user._id, user.groupId);
                            }
                          } else {
                            await handleAssignToGroup(user._id, value);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue>
                            {isLoading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Wird aktualisiert...
                              </span>
                            ) : userGroup ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: userGroup.color }}
                                />
                                <span className="truncate">{userGroup.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Keine Gruppe</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">
                            <span className="text-gray-500">Keine Gruppe</span>
                          </SelectItem>
                          {groups
                            .filter(group => group.isAssignable)
                            .map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                  <span className="truncate">{group.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({groups.find(g => g.id === group.id)?.memberCount || 0})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => setShowActionsFor(showActions ? null : user._id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {showActions && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              {onShowUserRegistration && (
                                <button
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    onShowUserRegistration(user._id, user.name);
                                    setShowActionsFor(null);
                                  }}
                                >
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">Anmeldung anzeigen</span>
                                </button>
                              )}
                              
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                onClick={() => {
                                  handleResetPassword(user);
                                  setShowActionsFor(null);
                                }}
                                disabled={isPasswordLoading}
                              >
                                <Key className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {isPasswordLoading ? 'Setzt zurück...' : 'Passwort zurücksetzen'}
                                </span>
                              </button>

                              {/* Admin Role Toggle */}
                              {user.role === 'admin' ? (
                                <button
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    handleChangeUserRole(user, 'user');
                                    setShowActionsFor(null);
                                  }}
                                  disabled={user._id === currentUser?.id || isUpdatingRole.has(user._id)}
                                >
                                  <UserX className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {isUpdatingRole.has(user._id) ? 'Aktualisiere...' : 'Admin entfernen'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    handleChangeUserRole(user, 'admin');
                                    setShowActionsFor(null);
                                  }}
                                  disabled={isUpdatingRole.has(user._id)}
                                >
                                  <UserCheck className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {isUpdatingRole.has(user._id) ? 'Aktualisiere...' : 'Zu Admin machen'}
                                  </span>
                                </button>
                              )}
                              
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 text-purple-600"
                                onClick={() => {
                                  handleChangeShadowStatus(user._id, true);
                                  setShowActionsFor(null);
                                }}
                                disabled={loadingUsers.has(user._id)}
                              >
                                {loadingUsers.has(user._id) ? (
                                  <Loader2 className="mr-2 h-4 w-4 flex-shrink-0 animate-spin" />
                                ) : (
                                  <EyeOff className="mr-2 h-4 w-4 flex-shrink-0" />
                                )}
                                <span className="truncate">Als Shadow User markieren</span>
                              </button>
                              
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                onClick={() => {
                                  onDeleteUser(user._id);
                                  setShowActionsFor(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Benutzer löschen</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer gefunden</h3>
          <p className="mt-1 text-sm text-gray-500">
            Passen Sie Ihre Suchkriterien oder Filter an.
          </p>
        </div>
      )}
    </div>
  );
} 