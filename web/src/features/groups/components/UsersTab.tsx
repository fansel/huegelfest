"use client";

import React, { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { toast } from "react-hot-toast";
import { Trash2, Search, Loader2 } from 'lucide-react';
import { assignUserToGroupAction, removeUserFromGroupAction } from '../actions/groupActions';
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
    return user.groupId ? groups.find(g => g.id === user.groupId) || null : null;
  };

  const getSelectDisplayValue = (user: User): string => {
    const userGroup = getUserGroup(user);
    return userGroup ? userGroup.name : "Keine Gruppe";
  };

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
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {userGroup.name}
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
                      <SelectValue>{getSelectDisplayValue(user)}</SelectValue>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <span>Keine Gruppe</span>
                      </div>
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
                            <span>{group.name}</span>
                            <span className="text-xs text-gray-500">
                              ({group.memberCount} Mitglieder)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => onDeleteUser(user.deviceId)}
                  disabled={isLoading}
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