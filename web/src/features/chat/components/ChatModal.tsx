'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { X, Send, MessageCircle, Crown, Users, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import toast from 'react-hot-toast';
import { 
  getActivityChatAction, 
  getGroupChatAction, 
  sendActivityChatAction, 
  sendGroupChatAction,
  getActivityDetailsAction,
  getGroupMembersAction,
  type ChatMessageResponse,
  type ActivityDetails,
  type GroupMember
} from '../actions/chatActions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId?: string;
  groupId?: string;
  title: string;
  isAdminView?: boolean;
  showInfoOnOpen?: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  activityId,
  groupId,
  title,
  isAdminView = false,
  showInfoOnOpen = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(showInfoOnOpen);
  const [activityDetails, setActivityDetails] = useState<ActivityDetails | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const swrKey = isOpen ? (activityId ? `chat/activity/${activityId}` : groupId ? `chat/group/${groupId}` : null) : null;

  const fetcher = async (url: string) => {
    const [type, id] = url.split('/').slice(1);
    let result;
    if (type === 'activity' && id) {
      result = await getActivityChatAction(id);
    } else if (type === 'group' && id) {
      const cleanGroupId = String(id).trim();
      if (cleanGroupId === '[object Object]') {
        console.error('[ChatModal] GroupId is an object, cannot load messages:', id);
        toast.error('Ungültige Gruppen-ID - kann Nachrichten nicht laden');
        throw new Error('Ungültige Gruppen-ID');
      }
      result = await getGroupChatAction(cleanGroupId);
    }
    if (result?.success && result.messages) {
      return result.messages;
    }
    toast.error(result?.error || 'Fehler beim Laden der Nachrichten');
    throw new Error(result?.error || 'Fehler beim Laden der Nachrichten');
  };

  const { data: messages = [], error, mutate, isLoading: loading } = useSWR<ChatMessageResponse[]>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Mark chat as viewed when modal opens with an activityId
  useEffect(() => {
    if (isOpen && activityId) {
      localStorage.setItem(`chat_last_viewed_${activityId}`, new Date().toISOString());
    }
  }, [isOpen, activityId]);

  // WebSocket for live updates
  useGlobalWebSocket({
    onMessage: (msg: any) => {
      if ((msg.topic === 'ACTIVITY_CHAT_MESSAGE' && msg.payload.data?.activityId === activityId) ||
          (msg.topic === 'GROUP_CHAT_MESSAGE' && msg.payload.data?.groupId === groupId)) {
        mutate();
      }
    },
    topicFilter: ['ACTIVITY_CHAT_MESSAGE', 'GROUP_CHAT_MESSAGE']
  });

  // Set showInfo on open
  useEffect(() => {
    if (isOpen) {
      setShowInfo(showInfoOnOpen);
    }
  }, [isOpen, showInfoOnOpen]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load details and revalidate messages when modal opens
  useEffect(() => {
    if (isOpen && (activityId || groupId)) {
      mutate();
      loadDetails();
    }
  }, [isOpen, activityId, groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadDetails = async () => {
    try {
      if (activityId) {
        const result = await getActivityDetailsAction(activityId);
        if (result.success && result.activity) {
          setActivityDetails(result.activity);
        }
      } else if (groupId) {
        // Validate and clean groupId before using it
        const cleanGroupId = String(groupId).trim();
        
        // Check if it's actually an object string representation
        if (cleanGroupId === '[object Object]') {
          console.error('[ChatModal] GroupId is an object, cannot proceed:', groupId);
          return;
        }
        
        console.log('[ChatModal] Loading details for groupId:', cleanGroupId, 'Original:', groupId);
        const result = await getGroupMembersAction(cleanGroupId);
        if (result.success) {
          setGroupMembers(result.members || []);
          setGroupName(result.groupName || '');
        } else {
          console.error('[ChatModal] Error loading group members:', result.error);
        }
      }
    } catch (error) {
      console.error('Error loading details:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      let result;
      if (activityId) {
        result = await sendActivityChatAction({
          content: messageContent,
          activityId
        });
      } else if (groupId) {
        // Validate and clean groupId before using it
        const cleanGroupId = String(groupId).trim();
        
        // Check if it's actually an object string representation
        if (cleanGroupId === '[object Object]') {
          console.error('[ChatModal] GroupId is an object, cannot send message:', groupId);
          toast.error('Ungültige Gruppen-ID - kann Nachricht nicht senden');
          setNewMessage(messageContent); // Restore message
          return;
        }
        
        console.log('[ChatModal] Sending message to groupId:', cleanGroupId, 'Original:', groupId);
        result = await sendGroupChatAction({
          content: messageContent,
          groupId: cleanGroupId
        });
      }

      if (result?.success) {
        // No longer need to manually reload, WebSocket will handle it
      } else {
        console.error('[ChatModal] Error sending message:', result?.error);
        toast.error(result?.error || 'Fehler beim Senden der Nachricht');
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm', { locale: de });
    } else {
      return format(date, 'dd.MM HH:mm', { locale: de });
    }
  };

  const getMessageStyle = (message: ChatMessageResponse) => {
    if (message.isAdminMessage) {
      return 'bg-[#ff9900]/10 border-l-4 border-[#ff9900]';
    }
    return 'bg-white/5';
  };

  const isResponsibleUser = (userId: string) => {
    if (activityId && activityDetails?.responsibleUsers) {
      return activityDetails.responsibleUsers.some(user => user._id === userId) || false;
    }
    return false;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 w-screen h-dvh max-w-none max-h-none m-0 p-0 bg-[#460b6c] flex flex-col rounded-none">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#ff9900]/20 p-4 pr-16 bg-[#460b6c] relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageCircle className="h-5 w-5 text-[#ff9900] flex-shrink-0" />
              <h3 className="text-[#ff9900] font-semibold text-lg truncate">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo(!showInfo)}
                className="h-10 w-10 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10"
                title="Info anzeigen"
              >
                <Users className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        {showInfo && (
          <div className="flex-shrink-0 border-b border-[#ff9900]/20 bg-[#ff9900]/5">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#ff9900] font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {activityId ? 'Aufgaben-Info' : 'Gruppen-Mitglieder'}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfo(false)}
                  className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900]"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              {activityId && activityDetails ? (
                <div className="space-y-3">
                  {activityDetails.responsibleUsers.length > 0 && (
                    <div>
                      <h5 className="text-[#ff9900]/80 text-sm font-medium mb-2">Hauptverantwortliche:</h5>
                      <div className="space-y-1">
                        {activityDetails.responsibleUsers.map(user => (
                          <div key={user._id} className="flex items-center gap-2 text-sm text-white">
                            <Crown className="h-3 w-3 text-[#ff9900]" />
                            {user.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activityDetails.groupName && (
                    <div>
                      <h5 className="text-[#ff9900]/80 text-sm font-medium mb-1">Gruppe:</h5>
                      <div className="text-sm text-white">{activityDetails.groupName}</div>
                    </div>
                  )}
                  <div className="p-3 bg-white/5 rounded-lg border border-[#ff9900]/20">
                    <h5 className="text-[#ff9900]/80 text-sm font-medium mb-2">📝 Hinweis:</h5>
                    <p className="text-sm text-white/80">
                      Dies ist der <strong>Aufgaben-Chat</strong>. Hier können alle Gruppenmitglieder sowie beteiligte Admins schreiben.
                    </p>
                  </div>
                </div>
              ) : groupId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[#ff9900]/80 text-sm font-medium">
                      {groupMembers.length} Mitglied{groupMembers.length !== 1 ? 'er' : ''}:
                    </h5>
                    {groupName && (
                      <span className="text-sm bg-[#ff9900] text-white px-3 py-1 rounded-full">
                        {groupName}
                      </span>
                    )}
                  </div>
                  
                  {groupMembers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {groupMembers.map((member, index) => (
                        <div 
                          key={member._id} 
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-[#ff9900]/10"
                        >
                          <div className="w-8 h-8 bg-[#ff9900]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#ff9900] font-medium text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">{member.name}</div>
                            <div className="text-xs text-white/60">Gruppenmitglied</div>
                          </div>
                          <div className="text-sm text-[#ff9900]/60">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 mx-auto mb-2 text-[#ff9900]/40" />
                      <p className="text-sm text-white/60">Keine Mitglieder gefunden</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-white/5 rounded-lg border border-[#ff9900]/20">
                    <h5 className="text-[#ff9900]/80 text-sm font-medium mb-2">👥 Hinweis:</h5>
                    <p className="text-sm text-white/80">
                      Dies ist der <strong>Gruppen-Chat</strong>. Hier können nur die Mitglieder eurer Gruppe schreiben.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[#ff9900]/60">Lade Nachrichten...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-[#ff9900]/40" />
                  <p className="text-[#ff9900]/60">Noch keine Nachrichten</p>
                  <p className="text-[#ff9900]/40 text-sm mt-1">Starte die Unterhaltung!</p>
                </div>
              </div>
            ) : (
              Array.isArray(messages) && messages.length > 0 ? (
                messages.map((message, index) => (
                  <div
                    key={message._id || `message-${index}`}
                    className={`p-4 rounded-lg ${getMessageStyle(message)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-base font-medium ${
                        message.isAdminMessage ? 'text-[#ff9900]' : 'text-white'
                      } flex items-center gap-2`}>
                        {message.userName}
                        {message.isAdminMessage && (
                          <span className="text-xs bg-[#ff9900] text-[#460b6c] px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                        {activityId && isResponsibleUser(message.userId) && (
                          <div title="Hauptverantwortlich">
                            <Crown className="h-4 w-4 text-[#ff9900]" />
                          </div>
                        )}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-white whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-[#ff9900]/40" />
                    <p className="text-[#ff9900]/60">Keine Nachrichten verfügbar</p>
                  </div>
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-[#ff9900]/20 p-4 bg-[#460b6c]">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht schreiben..."
              className="flex-1 h-12 bg-white/10 border-[#ff9900]/20 text-white placeholder:text-gray-400 focus:border-[#ff9900] focus:ring-[#ff9900] text-base"
              disabled={sending}
              maxLength={1000}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="h-12 px-6 bg-[#ff9900] hover:bg-orange-600 text-[#460b6c] font-medium"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-[#460b6c]/30 border-t-[#460b6c] rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal; 