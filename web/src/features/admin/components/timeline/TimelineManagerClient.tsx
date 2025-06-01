"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import AdminTimelineTab from './AdminTimelineTab';
import AdminCategoriesTab from './AdminCategoriesTab';

// Props interface for initial data
interface TimelineManagerClientProps {
  initialCategories?: any[];
  initialDays?: any[];
  initialEventsByDay?: Record<string, any[]>;
}

/**
 * Client Component für Timeline Manager - einfache Tab-Navigation
 */
export const TimelineManagerClient: React.FC<TimelineManagerClientProps> = ({ 
  initialCategories,
  initialDays,
  initialEventsByDay 
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories'>('timeline');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'timeline' | 'categories')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="timeline" className="text-sm font-medium">
            Timeline verwalten
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-sm font-medium">
            Kategorien verwalten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <AdminTimelineTab 
            initialDays={initialDays || []}
            initialEventsByDay={initialEventsByDay || {}}
            initialCategories={initialCategories || []}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <AdminCategoriesTab 
            initialCategories={initialCategories || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimelineManagerClient; 