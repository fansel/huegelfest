export interface ConceptSection {
  id: string;
  title: string;
  icon: string;
  content: ConceptContent;
}

export interface ConceptContent {
  introduction?: string;
  sections: ConceptSubSection[];
}

export interface ConceptSubSection {
  title: string;
  content: string | ConceptTable;
}

export interface ConceptTable {
  type: 'table';
  headers: string[];
  rows: string[][];
  footer?: string;
}

export type ConceptTab = 'awareness' | 'finances' | 'general'; 