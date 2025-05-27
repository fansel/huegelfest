'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { ConceptSection, ConceptSubSection, ConceptTable } from '../types';

interface ConceptCardProps {
  concept: ConceptSection;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept }) => {
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.HelpCircle;
  };

  const IconComponent = getIconComponent(concept.icon);

  const renderContent = (content: string | ConceptTable) => {
    if (typeof content === 'string') {
      return (
        <div className="text-[#ff9900]/90 leading-relaxed">
          {content.split('\n').map((paragraph, index) => (
            <p key={index} className={index > 0 ? 'mt-4' : ''}>
              {paragraph}
            </p>
          ))}
        </div>
      );
    }

    if (content.type === 'table') {
      return (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#ff9900]/30">
                  {content.headers.map((header, index) => (
                    <th
                      key={index}
                      className="text-left py-2 px-2 font-semibold text-[#ff9900] text-xs"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-[#ff9900]/10 hover:bg-white/5 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`py-2 px-2 text-[#ff9900]/90 text-xs ${
                          cellIndex === 0 ? 'font-medium' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {content.footer && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-[#ff9900]/20">
              <div className="text-[#ff9900]/90 text-sm leading-relaxed">
                {content.footer.split('\n').map((line, index) => (
                  <p key={index} className={index > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-[#ff9900]/20 hover:border-[#ff9900]/40 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#ff9900]">
          <IconComponent className="h-6 w-6" />
          {concept.title}
        </CardTitle>
        {concept.content.introduction && (
          <p className="text-[#ff9900]/80 text-sm leading-relaxed">
            {concept.content.introduction}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {concept.content.sections.map((section: ConceptSubSection, index: number) => (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-semibold text-[#ff9900] border-b border-[#ff9900]/20 pb-2">
              {section.title}
            </h3>
            {renderContent(section.content)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ConceptCard; 