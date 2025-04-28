import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare, Heart, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { getDeviceReactions, saveDeviceReaction, removeDeviceReaction } from '@/lib/cookies';

interface AnnouncementCardProps {
  announcement: {
    id: number;
    title: string;
    content: string;
    created_at: string;
    reactions: {
      type: string;
      count: number;
    }[];
  };
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [reactions, setReactions] = useState(announcement.reactions);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    // Lade Benutzer-Reaktion aus Cookies
    const deviceReactions = getDeviceReactions();
    const deviceId = Object.keys(deviceReactions).find(
      key => deviceReactions[key].announcementId === announcement.id
    );
    
    if (deviceId) {
      setUserReaction(deviceReactions[deviceId].type);
    }

    // Synchronisiere Reaktionen mit Cookies
    const cookieReactions = getDeviceReactions();
    const newReactions = [...announcement.reactions];
    
    // Zähle alle Reaktionen aus den Cookies
    const reactionCounts: { [key: string]: number } = {};
    Object.values(cookieReactions).forEach(reaction => {
      if (reaction.announcementId === announcement.id) {
        reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
      }
    });

    // Aktualisiere die Reaktionen basierend auf den Cookies
    Object.entries(reactionCounts).forEach(([type, count]) => {
      const existingIndex = newReactions.findIndex(r => r.type === type);
      if (existingIndex !== -1) {
        newReactions[existingIndex].count = count;
      } else {
        newReactions.push({ type, count });
      }
    });

    // Entferne Reaktionen, die nicht mehr in den Cookies sind
    newReactions.forEach((reaction, index) => {
      if (!reactionCounts[reaction.type]) {
        newReactions.splice(index, 1);
      }
    });

    setReactions(newReactions);
  }, [announcement.id, announcement.reactions]);

  const handleReaction = (type: string) => {
    const newReactions = [...reactions];
    
    if (userReaction === type) {
      // Reaktion entfernen
      const reactionIndex = newReactions.findIndex(r => r.type === type);
      if (reactionIndex !== -1) {
        newReactions[reactionIndex].count--;
        if (newReactions[reactionIndex].count === 0) {
          newReactions.splice(reactionIndex, 1);
        }
      }
      setUserReaction(null);
      removeDeviceReaction(announcement.id);
    } else {
      // Alte Reaktion entfernen
      if (userReaction) {
        const oldReactionIndex = newReactions.findIndex(r => r.type === userReaction);
        if (oldReactionIndex !== -1) {
          newReactions[oldReactionIndex].count--;
          if (newReactions[oldReactionIndex].count === 0) {
            newReactions.splice(oldReactionIndex, 1);
          }
        }
      }
      
      // Neue Reaktion hinzufügen
      const reactionIndex = newReactions.findIndex(r => r.type === type);
      if (reactionIndex === -1) {
        newReactions.push({ type, count: 1 });
      } else {
        newReactions[reactionIndex].count++;
      }
      
      setUserReaction(type);
      saveDeviceReaction(announcement.id, type);
    }
    
    setReactions(newReactions);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <h3 className="text-lg font-semibold">{announcement.title}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(announcement.created_at), {
              addSuffix: true,
              locale: de
            })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{announcement.content}</p>
        <div className="flex items-center space-x-2">
          <Button
            variant={userReaction === 'thumbs_up' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleReaction('thumbs_up')}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {reactions.find(r => r.type === 'thumbs_up')?.count || 0}
          </Button>
          <Button
            variant={userReaction === 'thumbs_down' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleReaction('thumbs_down')}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {reactions.find(r => r.type === 'thumbs_down')?.count || 0}
          </Button>
          <Button
            variant={userReaction === 'heart' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleReaction('heart')}
          >
            <Heart className="h-4 w-4 mr-1" />
            {reactions.find(r => r.type === 'heart')?.count || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            0
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 