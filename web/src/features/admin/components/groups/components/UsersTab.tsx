"use client";

import React, { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { toast } from "react-hot-toast";
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { Trash2, Search, Loader2 } from 'lucide-react';
import { assignUserToGroupAction, removeUserFromGroupAction } from '../actions/groupActions';
import AdminMagicCodeButton from '../../../../magic-codes/components/AdminMagicCodeButton';
import type { GroupData } from '../types';
import type { User } from './types';

interface UsersTabProps {
  users: User[];
  groups: GroupData[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onDeleteUser: (userId: string) => void;
  onRefreshData: () => void;
}

export function UsersTab({
  users,
  groups,
  searchTerm,
  setSearchTerm,
  onDeleteUser,
  onRefreshData
}: UsersTabProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignToGroup = async (deviceId: string, groupId: string) => {
    setLoadingUsers(prev => new Set(prev).add(deviceId));
    try {
      const result = await assignUserToGroupAction(deviceId, groupId);
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
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const handleRemoveFromGroup = async (deviceId: string, groupId: string) => {
    setLoadingUsers(prev => new Set(prev).add(deviceId));
    try {
      const result = await removeUserFromGroupAction(deviceId);
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
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const getUserGroup = (user: User): GroupData | null => {
    const foundGroup = user.groupId ? groups.find(g => g.id === user.groupId) || null : null;
    
    // Debug logging
    if (user.groupId && !foundGroup) {
      console.warn(`[UsersTab] Group not found for user ${user.name}:`, {
        userGroupId: user.groupId,
        availableGroups: groups.map(g => ({ id: g.id, name: g.name }))
      });
    }
    
    return foundGroup;
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Benutzer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mobile Users Cards */}
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const userGroup = getUserGroup(user);
            const isLoading = loadingUsers.has(user.deviceId);
            
            return (
              <div
                key={user.deviceId}
                className="border border-gray-200 rounded-lg p-3 space-y-3"
              >
                {/* User Info */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border flex-shrink-0"
                    style={{ 
                      backgroundColor: userGroup?.color || '#cccccc'
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 font-mono truncate">{user.deviceId}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <AdminMagicCodeButton
                      deviceId={user.deviceId}
                      userName={user.name}
                      variant="outline"
                      size="sm"
                    />
                    <button
                      onClick={() => onDeleteUser(user.deviceId)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Current Group Display */}
                {userGroup && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: userGroup.color }}
                    />
                    <span className="flex-1 truncate">
                      {userGroup.name}
                      {!userGroup.isAssignable && (
                        <span className="text-orange-600 ml-1">(gesperrt)</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Group Assignment */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600">Gruppe zuweisen:</div>
                  <Select
                    value={user.groupId || "NONE"}
                    onValueChange={async (value) => {
                      if (value === "NONE") {
                        if (user.groupId) {
                          await handleRemoveFromGroup(user.deviceId, user.groupId);
                        }
                      } else {
                        await handleAssignToGroup(user.deviceId, value);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-white">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-sm">Speichere...</span>
                        </div>
                      ) : (
                        <SelectValue>
                          {userGroup ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: userGroup.color }}
                              />
                              <span className="text-sm truncate">{userGroup.name}</span>
                              {!userGroup.isAssignable && (
                                <span className="text-xs text-orange-600">(gesperrt)</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <span className="text-sm">Keine Gruppe</span>
                            </div>
                          )}
                        </SelectValue>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          <span>Keine Gruppe</span>
                        </div>
                      </SelectItem>
                      {groups.map(group => (
                        <SelectItem 
                          key={group.id} 
                          value={group.id}
                          disabled={!group.isAssignable}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span className="truncate">{group.name}</span>
                            {!group.isAssignable && (
                              <span className="text-xs text-orange-600 ml-1">(gesperrt)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Benutzer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map(user => {
          const userGroup = getUserGroup(user);
          const isLoading = loadingUsers.has(user.deviceId);
          
          // Debug logging
          console.log(`[UsersTab] User ${user.name}:`, {
            groupId: user.groupId,
            userGroup: userGroup?.name,
            selectValue: user.groupId || "NONE"
          });
          
          return (
            <div
              key={user.deviceId}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border transition-colors duration-200"
                  style={{ 
                    backgroundColor: userGroup?.color || '#cccccc'
                  }}
                />
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-gray-500 font-mono">{user.deviceId}</span>
                {userGroup && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    userGroup.isAssignable 
                      ? 'bg-gray-100 text-gray-600' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {userGroup.name}
                    {!userGroup.isAssignable && ' (gesperrt)'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={user.groupId || "NONE"}
                  onValueChange={async (value) => {
                    if (value === "NONE") {
                      if (user.groupId) {
                        await handleRemoveFromGroup(user.deviceId, user.groupId);
                      }
                    } else {
                      await handleAssignToGroup(user.deviceId, value);
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-48 bg-white focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900]">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Speichere...</span>
                      </div>
                    ) : (
                      <SelectValue>
                        {userGroup ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: userGroup.color }}
                            />
                            <span>{userGroup.name}</span>
                            {!userGroup.isAssignable && (
                              <span className="text-xs text-orange-600">(gesperrt)</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                            <span>Keine Gruppe</span>
                          </div>
                        )}
                      </SelectValue>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <span>Keine Gruppe</span>
                      </div>
                    </SelectItem>
                    {groups.map(group => (
                      <SelectItem 
                        key={group.id} 
                        value={group.id}
                        disabled={!group.isAssignable}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span>{group.name}</span>
                          {!group.isAssignable && (
                            <span className="text-xs text-orange-600 ml-1">(gesperrt)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AdminMagicCodeButton
                  deviceId={user.deviceId}
                  userName={user.name}
                  variant="outline"
                  size="sm"
                />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteUser(user.deviceId)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 