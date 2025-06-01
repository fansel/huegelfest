"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Search, Plus } from 'lucide-react';
import { assignUserToGroupAction } from '../../actions/groupActions';
import type { GroupData } from '../../types';
import type { User } from '../types';

interface AddUserToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
  groups: GroupData[];
  users: User[];
  onUserAdded: () => void;
}

export function AddUserToGroupDialog({ 
  open, 
  onOpenChange, 
  groupId, 
  groups, 
  users, 
  onUserAdded 
}: AddUserToGroupDialogProps) {
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const selectedGroup = groupId ? groups.find(g => g.id === groupId) : null;
  
  const availableUsers = users.filter(user => 
    (!user.groupId || user.groupId !== groupId) &&
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleAddUser = async (deviceId: string) => {
    if (!groupId) return;
    
    try {
      const result = await assignUserToGroupAction(deviceId, groupId);
      if (result.success) {
        onUserAdded();
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>
            Benutzer zu Gruppe hinzufügen
            {selectedGroup && (
              <span className="text-sm font-normal text-gray-600 block">
                Gruppe: {selectedGroup.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verfügbare Benutzer</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Benutzer suchen..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {availableUsers.map(user => (
                <div
                  key={user.deviceId}
                  className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ 
                        backgroundColor: user.groupId 
                          ? groups.find(g => g.id === user.groupId)?.color || '#cccccc'
                          : '#cccccc' 
                      }}
                    />
                    <span className="font-medium">{user.name}</span>
                    {user.groupName && (
                      <Badge variant="outline" className="text-xs">
                        {user.groupName}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddUser(user.deviceId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              ))}
              {availableUsers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  {userSearchTerm ? 'Keine passenden Benutzer gefunden' : 'Keine verfügbaren Benutzer'}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 