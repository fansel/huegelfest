import React from 'react';
import { FavoriteButton } from '../../favorites/components/FavoriteButton';
import { HelpCircle } from 'lucide-react';

interface TimelineEventCardProps {
  event: any;
  dayTitle: string;
  category?: { icon: string };
  getIconComponent: (iconName: string) => React.ComponentType<any>;
  favoriteButtonProps?: {
    item: {
      id: string;
      type: 'timeline' | 'group' | 'announcement';
      data: any;
    };
  };
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  dayTitle,
  category,
  getIconComponent,
  favoriteButtonProps,
}) => {
  const IconComponent = category ? getIconComponent(category.icon) : HelpCircle;
  
  // Stabile ID-Generierung: Event-ID bevorzugen, Fallback auf composite ID für Kompatibilität
  const getFavoriteId = () => {
    // Wenn Event eine echte ID hat, diese verwenden
    if (event._id || event.id) {
      return event._id || event.id;
    }
    // Fallback auf alte Methode für Events ohne ID
    return `${dayTitle}-${event.time}-${event.title}`;
  };

  return (
    <div className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#ff9900]/20 rounded-full">
            <IconComponent className="text-[#ff9900] text-lg" />
          </div>
          <div>
            <h3 className="text-[#ff9900] font-medium">{event.title}</h3>
            {event.description && (
              <p className="text-white/80 text-sm mt-1">{event.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-[#ff9900] text-sm">{event.time}</div>
          <FavoriteButton
            item={favoriteButtonProps?.item ?? {
              id: getFavoriteId(),
              type: 'timeline' as const,
              data: { 
                ...event, 
                dayTitle,
                // Für Fallback-Matching speichern wir zusätzliche Identifiers
                compositeId: `${dayTitle}-${event.time}-${event.title}`,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}; 