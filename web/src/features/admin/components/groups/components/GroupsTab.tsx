"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { toast } from "react-hot-toast";
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  UserPlus,
  Minus,
  Plus,
  Shuffle,
  Search
} from 'lucide-react';
import { getGroupMembersAction, removeUserFromGroupAction, assignAllUnassignedUsersAction } from '../actions/groupActions';
import type { GroupData, GroupMember } from '../types';
import type { User } from './types';

interface GroupsTabProps {
  groups: GroupData[];
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onCreateGroup: () => void;
  onEditGroup: (group: GroupData) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddUserToGroup: (groupId: string) => void;
  onRefreshData: () => void;
}

export function GroupsTab({
  groups,
  users,
  searchTerm,
  setSearchTerm,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onAddUserToGroup,
  onRefreshData
}: GroupsTabProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassignedAssignableUsers = users.filter(u => !u.groupId && !u.isShadowUser);

  const loadGroupMembers = async (groupId: string) => {
    try {
      const result = await getGroupMembersAction(groupId);
      if (result.success && result.data) {
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: result.data!
        }));
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Gruppenmitglieder');
    }
  };

  // Effect: Reload expanded group members when main data changes
  useEffect(() => {
    // Reload member lists for all currently expanded groups when data changes
    expandedGroups.forEach(groupId => {
      loadGroupMembers(groupId);
    });
  }, [groups, users]); // Trigger when groups or users change

  const toggleGroupExpansion = async (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
      if (!groupMembers[groupId]) {
        await loadGroupMembers(groupId);
      }
    }
    setExpandedGroups(newExpanded);
  };

  const handleRemoveFromGroup = async (userId: string, groupId: string) => {
    try {
      const result = await removeUserFromGroupAction(userId);
      if (result.success) {
        toast.success('Benutzer aus Gruppe entfernt');
        onRefreshData();
        if (expandedGroups.has(groupId)) {
          loadGroupMembers(groupId);
        }
      } else {
        toast.error(result.error || 'Fehler beim Entfernen des Benutzers');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const assignAllUnassigned = async () => {
    try {
      const result = await assignAllUnassignedUsersAction();
      if (result.success) {
        const count = result.assignedCount || 0;
        if (count > 0) {
          toast.success(`${count} unzugewiesene Benutzer wurden Gruppen zugewiesen`);
        } else {
          toast.success('Alle Benutzer sind bereits Gruppen zugewiesen');
        }
        onRefreshData();
      } else {
        toast.error(result.error || 'Fehler beim Zuweisen der Benutzer');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Search Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Gruppen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {unassignedAssignableUsers.length > 0 && (
              <Button
                onClick={assignAllUnassigned}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                size="sm"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Alle zuweisen ({unassignedAssignableUsers.length})
              </Button>
            )}
            <Button
              onClick={onCreateGroup}
              className="bg-[#ff9900] text-[#2d0066] hover:bg-[#ff9900]/80 w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Gruppe
            </Button>
          </div>
        </div>

        {/* Mobile Groups Cards */}
        <div className="space-y-3">
          {filteredGroups.map(group => (
            <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full border flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-sm truncate">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditGroup(group)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      className="p-1.5 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {group.memberCount} Mitglieder
                    </Badge>
                    {group.isAssignable && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Zuweisbar
                      </Badge>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded text-sm"
                  >
                    {expandedGroups.has(group.id) ? (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span className="text-xs">Weniger</span>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-xs">Mehr</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Expanded Members */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      Mitglieder ({groupMembers[group.id]?.length || 0})
                    </span>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                      onClick={() => onAddUserToGroup(group.id)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                  
                  {groupMembers[group.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupMembers[group.id].map(member => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                        >
                          <span className="truncate flex-1 mr-2">{member.name}</span>
                          <button
                            onClick={() => handleRemoveFromGroup(member.userId, group.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic text-center py-2">
                      Keine Mitglieder
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
            placeholder="Gruppen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {unassignedAssignableUsers.length > 0 && (
            <Button
              onClick={assignAllUnassigned}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Alle zuweisen ({unassignedAssignableUsers.length})
            </Button>
          )}
          <Button
            onClick={onCreateGroup}
            className="bg-[#ff9900] text-[#2d0066] hover:bg-[#ff9900]/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Gruppe
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-2">
        {filteredGroups.map(group => (
          <div key={group.id} className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleGroupExpansion(group.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: group.color }}
                />
                <span className="font-medium">{group.name}</span>
                <Badge variant="outline">
                  {group.memberCount} Mitglieder
                </Badge>
                {group.isAssignable && (
                  <Badge className="bg-green-100 text-green-800">
                    Zuweisbar
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onEditGroup(group)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDeleteGroup(group.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Members */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Mitglieder ({groupMembers[group.id]?.length || 0})
                    </span>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onAddUserToGroup(group.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                  
                  {groupMembers[group.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupMembers[group.id].map(member => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <span>{member.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromGroup(member.userId, group.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Keine Mitglieder
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 