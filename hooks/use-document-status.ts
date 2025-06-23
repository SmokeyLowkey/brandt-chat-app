'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTenant } from '@/providers/tenant-provider';
import { useUploads } from '@/providers/upload-provider';

export function useDocumentStatus() {
  const { data: session } = useSession();
  const { tenantId } = useTenant();
  const { uploads, updateUpload } = useUploads();
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Find documents that need status updates
  const getDocumentsToCheck = () => {
    return uploads.filter(upload => 
      upload.status === 'processing' && 
      upload.documentId && 
      upload.tenantId === tenantId
    );
  };
  
  // Poll for document status updates
  const pollDocumentStatus = async () => {
    if (!session || !tenantId) return;
    
    const documentsToCheck = getDocumentsToCheck();
    if (documentsToCheck.length === 0) {
      setIsPolling(false);
      return;
    }
    
    setIsPolling(true);
    
    try {
      // Get document IDs to check
      const documentIds = documentsToCheck.map(doc => doc.documentId).filter(Boolean);
      
      // Fetch status updates for these documents
      const response = await fetch(`/api/tenants/${tenantId}/documents/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch document status updates');
      }
      
      const statusUpdates = await response.json();
      
      // Update document statuses
      for (const update of statusUpdates) {
        const upload = documentsToCheck.find(doc => doc.documentId === update.id);
        if (upload) {
          // Check if the document is processed and update the status accordingly
          if (update.status === 'PROCESSED') {
            console.log(`Document ${update.id} is now processed, updating UI status to complete`);
            updateUpload(upload.id, {
              status: 'complete',
              error: undefined,
            });
          } else if (update.status === 'FAILED') {
            console.log(`Document ${update.id} processing failed, updating UI status`);
            updateUpload(upload.id, {
              status: 'failed',
              error: update.error,
            });
          } else {
            // Keep as processing
            updateUpload(upload.id, {
              status: 'processing',
              error: undefined,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error polling for document status:', error);
    }
  };
  
  // Start polling when there are documents to check
  useEffect(() => {
    if (!session || !tenantId) return;
    
    const documentsToCheck = getDocumentsToCheck();
    
    if (documentsToCheck.length > 0 && !isPolling) {
      // Start polling with a shorter interval for more responsive updates
      pollingIntervalRef.current = setInterval(pollDocumentStatus, 3000);
      setIsPolling(true);
      console.log(`Started polling for ${documentsToCheck.length} documents`);
    } else if (documentsToCheck.length === 0 && isPolling) {
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('Stopped polling as all documents are processed');
      }
      setIsPolling(false);
    }
    
    // Initial poll
    if (documentsToCheck.length > 0) {
      pollDocumentStatus();
    }
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [session, tenantId, uploads, isPolling]);
  
  return { isPolling };
}