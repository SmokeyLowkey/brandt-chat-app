'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UploadItem {
  id: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'complete' | 'failed';
  progress: number;
  tenantId: string;
  documentId?: string;
  error?: string;
  startTime: number;
  lastUpdated: number;
}

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (upload: Omit<UploadItem, 'id' | 'startTime' | 'lastUpdated'>) => string;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  // Use regular state instead of localStorage
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  
  // Initialize from localStorage on mount only
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedUploads = window.localStorage.getItem('document-uploads');
        if (storedUploads) {
          setUploads(JSON.parse(storedUploads));
        }
      }
    } catch (error) {
      console.error('Error reading uploads from localStorage:', error);
    }
  }, []);
  
  // Save to localStorage when uploads change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && uploads.length > 0) {
        window.localStorage.setItem('document-uploads', JSON.stringify(uploads));
      }
    } catch (error) {
      console.error('Error saving uploads to localStorage:', error);
    }
  }, [uploads]);
  
  // Clean up stale uploads on mount (older than 24 hours)
  useEffect(() => {
    const now = Date.now();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    
    setUploads(prev => 
      prev.filter(upload => now - upload.lastUpdated < DAY_IN_MS)
    );
  }, []);
  
  // Add a new upload
  const addUpload = (upload: Omit<UploadItem, 'id' | 'startTime' | 'lastUpdated'>) => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    
    const newUpload: UploadItem = {
      ...upload,
      id,
      startTime: now,
      lastUpdated: now,
    };
    
    setUploads(prev => [...prev, newUpload]);
    return id;
  };
  
  // Update an existing upload
  const updateUpload = (id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id 
          ? { ...upload, ...updates, lastUpdated: Date.now() } 
          : upload
      )
    );
  };
  
  // Remove an upload
  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };
  
  // Cancel an upload in progress
  const cancelUpload = (id: string) => {
    setUploads(prev =>
      prev.map(upload =>
        upload.id === id
          ? { ...upload, status: 'failed', error: 'Upload cancelled by user', lastUpdated: Date.now() }
          : upload
      )
    );
  };
  
  // Clear completed uploads
  const clearCompleted = () => {
    setUploads(prev =>
      prev.filter(upload =>
        upload.status !== 'complete' && upload.status !== 'failed'
      )
    );
  };
  
  return (
    <UploadContext.Provider value={{
      uploads,
      addUpload,
      updateUpload,
      removeUpload,
      cancelUpload,
      clearCompleted
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
}