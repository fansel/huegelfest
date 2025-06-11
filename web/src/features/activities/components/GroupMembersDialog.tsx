'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Users, Loader2 } from 'lucide-react';
import { getGroupMembersAction, type GroupMember } from '@/features/chat/actions/chatActions';
import toast from 'react-hot-toast';

interface GroupMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName: string | null;
}

export const GroupMembersDialog: React.FC<GroupMembersDialogProps> = ({ isOpen, onClose, groupId, groupName }) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      const fetchMembers = async () => {
        setLoading(true);
        setMembers([]); // Clear previous members
        try {
          const result = await getGroupMembersAction(groupId);
          if (result.success && result.members) {
            setMembers(result.members);
          } else {
            toast.error(result.error || 'Fehler beim Laden der Gruppenmitglieder.');
          }
        } catch (error) {
            toast.error('Ein unerwarteter Fehler ist aufgetreten.');
            console.error(error);
        } finally {
            setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [isOpen, groupId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#460b6c] border-[#ff9900]/20 text-white max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-[#ff9900] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gruppe: {groupName || '...'}
          </DialogTitle>
          <DialogDescription className="text-[#ff9900]/70">
            Liste aller Mitglieder in dieser Gruppe.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 text-[#ff9900] animate-spin" />
            </div>
          ) : members.length > 0 ? (
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member._id} className="flex items-center gap-3 p-2 bg-white/5 rounded-md border border-white/10">
                  <div className="w-8 h-8 bg-[#ff9900]/20 rounded-full flex items-center justify-center font-bold text-[#ff9900] flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{member.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-[#ff9900]/70 py-8">Keine Mitglieder für diese Gruppe gefunden.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 