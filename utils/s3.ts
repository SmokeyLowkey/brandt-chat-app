/**
 * S3 utility functions for file operations
 */

/**
 * Generate a pre-signed URL for uploading a file to S3
 */
export async function getUploadUrl(filename: string, contentType: string): Promise<{
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

/**
 * Upload a file to S3 using a pre-signed URL
 */
export async function uploadFileToS3(
  file: File,
  onProgress?: (progress: number) => void
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
    const { uploadUrl, key, fileUrl } = await getUploadUrl(file.name, file.type);

    // Step 2: Upload the file directly to S3
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return {
      key,
      url: fileUrl,
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Get the public URL for a file in S3
 */
export function getPublicS3Url(key: string): string {
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'brandt-chat-app';
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ca-central-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}