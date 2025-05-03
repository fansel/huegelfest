declare module 'soundcloud-downloader' {
  export function download(url: string, clientID: string, axiosInstance: any): Promise<any>;
  export function getSetInfo(url: string, clientID: string, axiosInstance: any): Promise<{
    tracks: Array<{
      title: string;
      permalink_url: string;
    }>;
  }>;
} 