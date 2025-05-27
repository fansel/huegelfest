'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import ConceptCard from './ConceptCard';
import { conceptsData } from '../data/conceptsData';
import type { ConceptTab } from '../types';

export default function ConceptsClient() {
  const [activeTab, setActiveTab] = useState<ConceptTab>('awareness');

  const getConceptsByTab = (tab: ConceptTab) => {
    switch (tab) {
      case 'awareness':
        return conceptsData.filter(concept => concept.id === 'awareness');
      case 'finances':
        return conceptsData.filter(concept => concept.id === 'finances');
      case 'general':
        return conceptsData.filter(concept => 
          concept.id !== 'awareness' && concept.id !== 'finances'
        );
      default:
        return [];
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-[#ff9900]" />
          <h2 className="text-xl font-bold text-[#ff9900]">Konzepte</h2>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ConceptTab)}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border border-[#ff9900]/20">
            <TabsTrigger 
              value="awareness" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900]"
            >
              Awareness
            </TabsTrigger>
            <TabsTrigger 
              value="finances" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900]"
            >
              Finanzen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="awareness" className="space-y-6">
            {getConceptsByTab('awareness').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            {getConceptsByTab('finances').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            {getConceptsByTab('general').length > 0 ? (
              getConceptsByTab('general').map((concept) => (
                <ConceptCard key={concept.id} concept={concept} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">
                  Weitere Konzepte folgen
                </h3>
                <p className="text-[#ff9900]/80 text-sm">
                  Hier werden zukünftig weitere Konzepte und Informationen zum Festival verfügbar sein.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 