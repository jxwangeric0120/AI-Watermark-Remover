export enum AppMode {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessedResult {
  originalUrl: string;
  processedUrl?: string;
  type: 'image' | 'video';
}

// Augment the global AIStudio interface.
// We avoid redeclaring properties on Window to prevent conflicts with existing definitions.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
