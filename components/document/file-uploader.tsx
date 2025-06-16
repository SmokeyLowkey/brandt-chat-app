"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { uploadFileToS3 } from "@/utils/s3";
import { DocumentService } from "@/services/document-service";

interface FileUploaderProps {
  onUploadComplete?: (documentId: string) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recentlyUploadedFiles, setRecentlyUploadedFiles] = useState<string[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Update progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));
      
      // Simulate progress updates for this file
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min(prev[file.name] + 5, 95)
        }));
      }, 200);

      // Upload file to S3
      const { key, url } = await uploadFileToS3(file);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 100
      }));

      // console.log(`File ${file.name} uploaded to S3:`, { key, url });

      // Notify the server about the uploaded document
      const documentResponse = await fetch('/api/s3/document-created', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
        }),
      });

      if (!documentResponse.ok) {
        throw new Error(`Failed to create document record for ${file.name}`);
      }

      const document = await documentResponse.json();
      // console.log(`Document created for ${file.name}:`, document);
      
      // Return the document ID
      return document.documentId || null;
    } catch (error: any) {
      console.error(`Error uploading ${file.name}:`, error);
      
      // Update progress to show error
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: -1 // Use -1 to indicate error
      }));
      
      // Show error toast
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Error uploading {file.name}</p>
          <p className="text-sm">{error.message}</p>
        </div>,
        {
          duration: 5000,
        }
      );
      
      return null;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !session?.user?.tenantId) {
      toast.error("Please select files to upload");
      return;
    }

    try {
      setIsUploading(true);
      setTotalFiles(selectedFiles.length);
      setCurrentFileIndex(0);
      
      const documentIds: string[] = [];
      const uploadedFileNames: string[] = [];
      
      // Upload files sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentFileIndex(i);
        const file = selectedFiles[i];
        
        const documentId = await uploadFile(file);
        if (documentId) {
          documentIds.push(documentId);
          uploadedFileNames.push(file.name);
          
          // Call the callback with the first document ID if provided
          if (i === 0 && onUploadComplete) {
            // console.log("Calling onUploadComplete with documentId:", documentId);
            onUploadComplete(documentId);
          }
        }
      }
      
      // Show success toast
      if (uploadedFileNames.length > 0) {
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {uploadedFileNames.length === 1 
                ? "Document uploaded successfully!" 
                : `${uploadedFileNames.length} documents uploaded successfully!`}
            </p>
            <p className="text-sm">Your documents are now being processed and will be available soon.</p>
          </div>,
          {
            duration: 5000,
          }
        );
        
        // Track recently uploaded files
        setRecentlyUploadedFiles(prev => [...uploadedFileNames, ...prev]);
        setUploadComplete(true);
      }
      
      setIsUploading(false);
      clearSelectedFiles();
      
      // Force a complete window refresh after a short delay
      setTimeout(() => {
        // console.log("Performing full window refresh to update document list");
        window.location.reload();
      }, 2000);
      
      // Reset upload complete status after a delay
      setTimeout(() => {
        setUploadComplete(false);
      }, 7000);
    } catch (error: any) {
      console.error("Upload error:", error);
      
      setIsUploading(false);
      
      // Show a more detailed error message
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Error uploading documents</p>
          <p className="text-sm">{error.message}</p>
          <p className="text-xs mt-1">Please try again or contact support if the issue persists.</p>
        </div>,
        {
          duration: 7000,
        }
      );
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = (): number => {
    if (Object.keys(uploadProgress).length === 0) return 0;
    
    const totalProgress = Object.values(uploadProgress).reduce((sum, progress) => {
      // Skip error states (-1)
      return progress >= 0 ? sum + progress : sum;
    }, 0);
    
    const validProgressCount = Object.values(uploadProgress).filter(p => p >= 0).length;
    return validProgressCount > 0 ? totalProgress / validProgressCount : 0;
  };

  return (
    <Card className="border-2 border-dashed rounded-lg">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-gray-100 p-3">
            <Upload className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">Upload documents</p>
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: PDF, DOCX, TXT, XLSX (up to 16MB)
            </p>
          </div>

          {isUploading ? (
            <div className="w-full max-w-xs">
              <Progress value={calculateOverallProgress()} className="h-2 w-full" />
              <p className="text-sm text-gray-500 mt-2">
                Uploading file {currentFileIndex + 1} of {totalFiles} ({Math.round(calculateOverallProgress())}%)
              </p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center justify-between mt-2 text-xs">
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  <span>
                    {progress === -1 ? (
                      <span className="text-red-500">Failed</span>
                    ) : progress === 100 ? (
                      <span className="text-green-500">Complete</span>
                    ) : (
                      <span>{progress}%</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="w-full max-w-xs border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.txt,.xlsx"
                multiple
              />
              
              {selectedFiles.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelectedFiles();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Drag and drop files here, or click to browse
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedFiles.length > 0 && !isUploading && (
            <Button 
              onClick={handleUpload}
              className="bg-[#E31937] hover:bg-[#c01730] text-white"
            >
              Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Documents` : 'Document'}
            </Button>
          )}

          {uploadComplete && (
            <div className="w-full max-w-xs mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-800">Upload Complete</p>
              </div>
              <p className="text-xs text-green-700 mt-1">Your documents are being processed and will be available soon.</p>
            </div>
          )}
          
          {recentlyUploadedFiles.length > 0 && !uploadComplete && (
            <div className="w-full max-w-xs mt-2">
              <p className="text-sm font-medium text-gray-700">Recently uploaded:</p>
              <ul className="mt-1 text-sm text-gray-500 max-h-32 overflow-y-auto">
                {recentlyUploadedFiles.map((fileName, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span className="truncate">{fileName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            <span>
              Documents will be processed and made available to the AI assistant
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}