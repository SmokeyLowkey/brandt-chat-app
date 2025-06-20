/**
 * S3 utility functions for file operations
 */

/**
 * Generate a pre-signed URL for uploading a file to S3
 */
export async function getUploadUrl(
  filename: string,
  contentType: string,
  overrideTenantId?: string
): Promise<{
  uploadUrl: string;
  key: string;
  fileUrl: string;
}> {
  try {
    const response = await fetch('/api/s3/generate-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        contentType,
        overrideTenantId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

/**
 * Generate a pre-signed URL for downloading a file from S3
 */
export async function getDownloadUrl(key: string): Promise<string> {
  try {
    const response = await fetch('/api/s3/generate-download-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate download URL');
    }

    const data = await response.json();
    return data.downloadUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

// Track active upload requests so they can be cancelled
const activeUploads: Map<string, XMLHttpRequest> = new Map();

/**
 * Upload a file to S3 using a pre-signed URL
 */
export async function uploadFileToS3(
  file: File,
  onProgress?: (progress: number) => void,
  overrideTenantId?: string
): Promise<{
  key: string;
  url: string;
}> {
  try {
    // Check if the file is a PDF
    const isPdf =
      file.type.includes('pdf') ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new Error('Only PDF files are supported');
    }
    
    // Step 1: Get the pre-signed URL
    const { uploadUrl, key, fileUrl } = await getUploadUrl(file.name, file.type, overrideTenantId);

    // Step 2: Upload the file with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Store the XHR request so it can be cancelled
      activeUploads.set(key, xhr);
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        // Remove from active uploads
        activeUploads.delete(key);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ key, url: fileUrl });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        activeUploads.delete(key);
        reject(new Error('Network error occurred during upload'));
      });
      
      // Handle abort
      xhr.addEventListener('abort', () => {
        activeUploads.delete(key);
        reject(new Error('Upload was cancelled'));
      });
      
      // Set timeout to 5 minutes
      xhr.timeout = 5 * 60 * 1000;
      xhr.addEventListener('timeout', () => {
        activeUploads.delete(key);
        reject(new Error('Upload timed out'));
      });
      
      // Send the request
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Cancel an active upload by S3 key
 */
export function cancelUpload(key: string): boolean {
  const xhr = activeUploads.get(key);
  if (xhr) {
    xhr.abort();
    activeUploads.delete(key);
    return true;
  }
  return false;
}

/**
 * Get the public URL for a file in S3
 */
export function getPublicS3Url(key: string): string {
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'brandt-chat-app';
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ca-central-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}