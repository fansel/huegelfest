interface SiteConfig {
  baseUrl: string;
  name: string;
  description: string;
}

export function getSiteConfig(): SiteConfig {
  // Default to localhost if no BASE_URL is provided
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return {
    baseUrl,
    name: 'Hügelfest',
    description: 'Die offizielle Progressive Web App für das Hügelfest'
  };
} 