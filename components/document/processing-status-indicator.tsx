'use client';

import { useState } from 'react';
import { useUploads } from '@/providers/upload-provider';
import { useDocumentStatus } from '@/hooks/use-document-status';
import { FileText, X, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function ProcessingStatusIndicator() {
  const { uploads, clearCompleted, cancelUpload } = useUploads();
  const { isPolling } = useDocumentStatus(); // This will poll for status updates
  const [isOpen, setIsOpen] = useState(false);
  
  // Count uploads by status
  const uploading = uploads.filter(u => u.status === 'uploading').length;
  const processing = uploads.filter(u => u.status === 'processing').length;
  const completed = uploads.filter(u => u.status === 'complete').length;
  const failed = uploads.filter(u => u.status === 'failed').length;
  
  // Total active uploads (uploading or processing)
  const activeCount = uploading + processing;
  
  // Don't render anything if no uploads
  if (uploads.length === 0) {
    return null;
  }
  
  return (
    <div className="relative">
      {/* Status Indicator Button */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 flex items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FileText className="h-5 w-5 text-gray-600" />
        {activeCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full">
            {activeCount}
          </span>
        )}
        <span className="ml-2 text-sm font-medium text-gray-700">Documents</span>
      </button>
      
      {/* Status Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Document Processing</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {uploads.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No documents being processed
              </div>
            ) : (
              <div>
                {/* Status Summary */}
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {uploading > 0 && (
                      <div className="bg-blue-100 p-2 rounded">
                        <span className="font-medium">{uploading}</span>
                        <span className="block">Uploading</span>
                      </div>
                    )}
                    {processing > 0 && (
                      <div className="bg-amber-100 p-2 rounded">
                        <span className="font-medium">{processing}</span>
                        <span className="block">Processing</span>
                      </div>
                    )}
                    {completed > 0 && (
                      <div className="bg-green-100 p-2 rounded">
                        <span className="font-medium">{completed}</span>
                        <span className="block">Completed</span>
                      </div>
                    )}
                    {failed > 0 && (
                      <div className="bg-red-100 p-2 rounded">
                        <span className="font-medium">{failed}</span>
                        <span className="block">Failed</span>
                      </div>
                    )}
                  </div>
                  
                  {(completed > 0 || failed > 0) && (
                    <button
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 w-full text-center"
                      onClick={() => clearCompleted()}
                    >
                      Clear completed/failed
                    </button>
                  )}
                </div>
                
                {/* Document List */}
                <ul className="divide-y divide-gray-200">
                  {uploads.map((upload) => (
                    <li key={upload.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {upload.status === 'uploading' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {upload.status === 'processing' && (
                            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                          )}
                          {upload.status === 'complete' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {upload.status === 'failed' && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {upload.fileName}
                            </p>
                            {(upload.status === 'uploading' || upload.status === 'processing') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 -mt-1 -mr-1"
                                onClick={() => cancelUpload(upload.id)}
                                title="Cancel upload"
                              >
                                <XCircle className="h-4 w-4 text-gray-500 hover:text-red-500" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {upload.status === 'uploading' && `Uploading (${upload.progress}%)`}
                            {upload.status === 'processing' && 'Processing...'}
                            {upload.status === 'complete' && 'Processing complete'}
                            {upload.status === 'failed' && (upload.error || 'Processing failed')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(upload.startTime), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}