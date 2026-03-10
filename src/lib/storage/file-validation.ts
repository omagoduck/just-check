import { fileTypeFromBlob } from 'file-type';

/**
 * Supported file types for upload
 * Currently only images, but extensible for future file types
 */
export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_MIME_TYPES] as const;

/**
 * Validation error types for better error handling
 */
export enum FileValidationErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TOO_MANY_FILES = 'TOO_MANY_FILES',
  UNSUPPORTED_MIME_TYPE = 'UNSUPPORTED_MIME_TYPE',
  INVALID_FILE_CONTENT = 'INVALID_FILE_CONTENT',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
}

export interface FileValidationError {
  type: FileValidationErrorType;
  message: string;
  fileName?: string;
  details?: string;
}

/**
 * Validates a single file's size
 */
export function validateFileSize(
  file: File,
  maxSize: number,
  fileName?: string
): FileValidationError | null {
  if (file.size > maxSize) {
    return {
      type: FileValidationErrorType.FILE_TOO_LARGE,
      message: `File ${fileName || file.name} exceeds size limit of ${formatBytes(maxSize)}`,
      fileName: file.name,
      details: `Actual size: ${formatBytes(file.size)}`,
    };
  }
  return null;
}

/**
 * Validates the number of files
 */
export function validateFileCount(
  count: number,
  maxFiles: number
): FileValidationError | null {
  if (count > maxFiles) {
    return {
      type: FileValidationErrorType.TOO_MANY_FILES,
      message: `Too many files. Maximum ${maxFiles} allowed.`,
      details: `Received ${count} files`,
    };
  }
  return null;
}

/**
 * Validates MIME type from browser (basic check)
 */
export function validateMimeType(
  file: File,
  allowedTypes: readonly string[]
): FileValidationError | null {
  if (!allowedTypes.includes(file.type)) {
    return {
      type: FileValidationErrorType.UNSUPPORTED_MIME_TYPE,
      message: `File ${file.name} has unsupported MIME type: ${file.type}`,
      fileName: file.name,
      details: `Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  return null;
}

/**
 * Validates actual file content using magic number detection
 * This is the critical security check that prevents disguised malicious files
 */
export async function validateFileContent(
  file: File,
  allowedTypes: readonly string[]
): Promise<FileValidationError | null> {
  try {
    // Use file-type library to detect actual file type from content
    const detectedType = await fileTypeFromBlob(file);

    if (!detectedType) {
      return {
        type: FileValidationErrorType.INVALID_FILE_CONTENT,
        message: `File ${file.name} could not be identified as a valid file`,
        fileName: file.name,
        details: 'The file content does not match any known file signature',
      };
    }

    // Check if detected MIME type is allowed
    if (!allowedTypes.includes(detectedType.mime)) {
      return {
        type: FileValidationErrorType.INVALID_FILE_CONTENT,
        message: `File ${file.name} is not a supported file type. Detected: ${detectedType.mime}`,
        fileName: file.name,
        details: `Allowed types: ${allowedTypes.join(', ')}. Detected extension: .${detectedType.ext}`,
      };
    }

    // Warn if extension doesn't match detected type (with alias support)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const extensionAliases: Record<string, string[]> = {
      jpg: ['jpeg'],
      jpe: ['jpeg'],
      jfif: ['jpeg'],
    };
    
    if (fileExt) {
      const isMatch = fileExt === detectedType.ext || 
        extensionAliases[fileExt]?.includes(detectedType.ext);
      if (!isMatch) {
        console.warn(
          `File ${file.name} has extension .${fileExt} but content indicates .${detectedType.ext}`
        );
      }
    }

    return null;
  } catch (error) {
    return {
      type: FileValidationErrorType.FILE_CORRUPTED,
      message: `File ${file.name} appears to be corrupted or unreadable`,
      fileName: file.name,
      details: error instanceof Error ? error.message : 'Unknown error during validation',
    };
  }
}

/**
 * Comprehensive file validation that runs all checks
 */
export async function validateFile(
  file: File,
  options: {
    maxSize: number;
    maxFiles?: number; // Not used per-file but for overall count
    allowedTypes: readonly string[];
  }
): Promise<FileValidationError | null> {
  // Size validation
  const sizeError = validateFileSize(file, options.maxSize);
  if (sizeError) return sizeError;

  // MIME type validation (browser-provided)
  const mimeError = validateMimeType(file, options.allowedTypes);
  if (mimeError) return mimeError;

  // Content validation (magic numbers)
  const contentError = await validateFileContent(file, options.allowedTypes);
  if (contentError) return contentError;

  return null;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validation result for batch operations
 */
export interface BatchValidationResult {
  validFiles: File[];
  errors: FileValidationError[];
}

/**
 * Validate multiple files and separate valid from invalid
 */
export async function validateFiles(
  files: File[],
  options: {
    maxSize: number;
    maxFiles: number;
    allowedTypes: readonly string[];
  }
): Promise<BatchValidationResult> {
  const errors: FileValidationError[] = [];
  const validFiles: File[] = [];

  // First check count
  const countError = validateFileCount(files.length, options.maxFiles);
  if (countError) {
    errors.push(countError);
    return { validFiles: [], errors };
  }

  // Validate each file in parallel
  const validationResults = await Promise.allSettled(
    files.map(file => validateFile(file, {
      maxSize: options.maxSize,
      allowedTypes: options.allowedTypes,
    }))
  );

  validationResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      errors.push(result.value);
    } else if (result.status === 'fulfilled') {
      validFiles.push(files[index]);
    } else {
      errors.push({
        type: FileValidationErrorType.FILE_CORRUPTED,
        message: `Failed to validate ${files[index].name}`,
        fileName: files[index].name,
        details: result.reason instanceof Error ? result.reason.message : 'Unknown validation error',
      });
    }
  });

  return { validFiles, errors };
}
