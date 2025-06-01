'use client';

import React, { useState } from 'react';
import { HelpCircle, Info, ChefHat, Shield, MessageSquare, Euro } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import ConceptCard from './ConceptCard';
import { conceptsData } from '../data/conceptsData';
import type { ConceptTab } from '../types';

export default function ConceptsClient() {
  const [activeTab, setActiveTab] = useState<ConceptTab>('allgemein');

  const getConceptsByTab = (tab: ConceptTab) => {
    switch (tab) {
      case 'allgemein':
        return conceptsData.filter(concept => concept.id === 'allgemein');
      case 'kochen-putzen':
        return conceptsData.filter(concept => concept.id === 'kochen-putzen');
      case 'awareness':
        return conceptsData.filter(concept => concept.id === 'awareness');
      case 'feedback':
        return conceptsData.filter(concept => concept.id === 'feedback');
      case 'finanzen':
        return conceptsData.filter(concept => concept.id === 'finanzen');
      default:
        return [];
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-[#ff9900]" />
          <h2 className="text-xl font-bold text-[#ff9900]">FAQ</h2>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ConceptTab)}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/10 border border-[#ff9900]/20 h-12">
            <TabsTrigger 
              value="allgemein" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900] p-2 h-full"
              title="Allgemein"
            >
              <Info className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="kochen-putzen" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900] p-2 h-full"
              title="Kochen & Putzen"
            >
              <ChefHat className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="awareness" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900] p-2 h-full"
              title="Awareness"
            >
              <Shield className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900] p-2 h-full"
              title="Feedback"
            >
              <MessageSquare className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="finanzen" 
              className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-white text-[#ff9900] p-2 h-full"
              title="Finanzen"
            >
              <Euro className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="allgemein" className="space-y-6">
            {getConceptsByTab('allgemein').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="kochen-putzen" className="space-y-6">
            {getConceptsByTab('kochen-putzen').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="awareness" className="space-y-6">
            {getConceptsByTab('awareness').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            {getConceptsByTab('feedback').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>

          <TabsContent value="finanzen" className="space-y-6">
            {getConceptsByTab('finanzen').map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 