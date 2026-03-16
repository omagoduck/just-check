"use client";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useIsMobile } from "@/hooks/use-mobile";
import { isWebSpeechRecognitionSupported } from "@/lib/input-speech-recognition/providers/web-speech-api";
import { useInputModality } from "@/hooks/use-input-modality";
import VoiceVisualizer from "./voice-visualizer";
import {
  Plus,
  Settings2,
  Mic,
  AudioLines,
  ArrowUp,
  Paperclip,
  Image,
  FileText,
  X,
  Square,
  Stone,
  ChevronDown,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Zap
} from "lucide-react";
import { UIModels } from "@/lib/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// The MAX_FILES constant is hardcoded rn. Different use cases or user tiers may require different limits.
// TODO || P8: Suggestion: Consider making this configurable via props or environment 
const MAX_FILES = 5;

interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (message: string, attachments?: Array<{ url: string; originalName: string; mimeType: string }>, modelId?: string) => void;
  isLoading?: boolean;
  isAiGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
  suggestions?: string[];
  onAttachmentUpload?: (files: File[]) => void;
  onLiveVoiceChat?: () => void;
  initialUIModelId?: string;
  maxInputCharacterLength?: number;
  /** Whether user is on the free plan */
  isFreeUser?: boolean;
  /** Whether user has remaining allowance to send messages */
  hasAllowance?: boolean;
  /** Percentage of allowance remaining (0-100) */
  remainingPercentage?: number;
  /** When the current allowance period ends (ISO string) */
  allowanceResetTime?: string | null;
  /** Whether allowance data is still loading */
  isLoadingAllowance?: boolean;
}
interface AttachedFile {
  id: string;
  file: File;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  uploadResult?: {
    url: string;
    originalName: string;
    mimeType: string;
  };
  error?: string;
}

export function ChatInput({
  className,
  onSubmit,
  isLoading = false,
  isAiGenerating = false,
  onStopGenerating,
  placeholder = "Ask me anything... (Shift + Enter for new line)",
  suggestions = [],
  onAttachmentUpload,
  onLiveVoiceChat,
  initialUIModelId = "fast",
  maxInputCharacterLength,
  isFreeUser = false,
  hasAllowance = true,
  remainingPercentage = 100,
  allowanceResetTime = null,
  isLoadingAllowance = false,
  ...props
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedUIModelId, setSelectedUIModelId] = useState(initialUIModelId);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<{ [id: string]: string }>({});
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  const dragCounterRef = useRef(0);

  const isVoiceSupported = isWebSpeechRecognitionSupported();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const innerAttachmentsRef = useRef<HTMLDivElement>(null);
  const [animatedHeight, setAnimatedHeight] = useState<number | 'auto'>(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  // #region This codeblock is responsible for auto focus on load. If you want to remove auto focus, just delete this block.
  // Auto-focus on the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  // #endregion

  // Handle dynamic height of attachment preview
  useLayoutEffect(() => {
    if (attachedFiles.length > 0) {
      if (innerAttachmentsRef.current) {
        setAnimatedHeight(innerAttachmentsRef.current.scrollHeight);
      }
    } else {
      setAnimatedHeight(0);
    }
  }, [attachedFiles]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showAttachments && attachmentsRef.current && !attachmentsRef.current.contains(target)) {
        setShowAttachments(false);
      }

      if (showSuggestions && suggestionsRef.current && !suggestionsRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };

    if (showAttachments || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachments, showSuggestions]);

  // Compute upload states (used in processFiles and canSubmit)
  const hasUploadsInProgress = attachedFiles.some(f => f.uploadStatus === 'pending' || f.uploadStatus === 'uploading');
  const hasFailedUploads = attachedFiles.some(f => f.uploadStatus === 'error');
  const isAtFileLimit = attachedFiles.length >= MAX_FILES;

  // Handle drag and drop with counter pattern for robustness
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Required to allow drop
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  // Handle paste (copy-paste file upload)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // clipboardData.files is more reliable for multi-file pastes from file explorer
    const filesFromList = Array.from(e.clipboardData.files);

    if (filesFromList.length > 0) {
      e.preventDefault();
      processFiles(filesFromList);
      return;
    }

    // Fallback to items for pasted images (e.g. screenshot from clipboard)
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('application/') || item.type.startsWith('text/'))) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  }, []);

  const processFiles = async (files: File[]) => {

    const newPreviewUrls: { [id: string]: string } = {};

    const uniqueNewFiles = files.filter(newFile =>
      !attachedFiles.some(existingFile =>
        existingFile.file.name === newFile.name && existingFile.file.size === newFile.size
      )
    );

    if (uniqueNewFiles.length < files.length) {
      const duplicateCount = files.length - uniqueNewFiles.length;
      toast.warning('Duplicate files skipped', {
        description: `${duplicateCount} file${duplicateCount > 1 ? 's were' : ' was'} already attached.`,
      });
    }

    // Enforce maximum file count limit
    const currentCount = attachedFiles.length;
    const availableSlots = MAX_FILES - currentCount;
    
    if (availableSlots <= 0) {
      toast.error('Maximum files reached', {
        description: `You can attach up to ${MAX_FILES} files. Remove some files to add more.`,
      });
      return;
    }

    const filesToAdd = uniqueNewFiles.slice(0, availableSlots);
    
    if (filesToAdd.length < uniqueNewFiles.length) {
      const rejectedCount = uniqueNewFiles.length - filesToAdd.length;
      toast.error('File limit exceeded', {
        description: `Only ${filesToAdd.length} file${filesToAdd.length > 1 ? 's were' : ' was'} added. Maximum ${MAX_FILES} files allowed. ${rejectedCount} file${rejectedCount > 1 ? 's were' : ' was'} skipped.`,
      });
    }

    const filesWithIds: AttachedFile[] = filesToAdd.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      uploadStatus: 'pending',
    }));

    filesWithIds.forEach(fileWithId => {
      const preview = createFilePreview(fileWithId.file);
      if (preview) {
        newPreviewUrls[fileWithId.id] = preview;
      }
    });

    setAttachedFiles(prev => [...prev, ...filesWithIds]);
    setFilePreviewUrls(prev => ({ ...prev, ...newPreviewUrls }));

    if (onAttachmentUpload) {
      onAttachmentUpload(filesWithIds.map(f => f.file));
    }

    await Promise.all(filesWithIds.map(fileWithId => uploadFile(fileWithId)));
  };

  // Enhanced input handling with debounced suggestions
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (value.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions]);

  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      Object.values(filePreviewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [filePreviewUrls]);

  const createFilePreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.includes('pdf')) return FileText;
    if (file.type.includes('document') || file.type.includes('text')) return FileText;
    return Paperclip;
  };

  const getFileDisplayName = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return 'FILE';

    const typeMap: { [key: string]: string } = {
      'ai': 'AI', 'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'csv': 'CSV',
    };

    return typeMap[extension]?.toUpperCase() || extension.toUpperCase().substring(0, 4);
  };

  const truncateFileName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    const extensionIndex = name.lastIndexOf('.');
    if (extensionIndex === -1) {
      return name.substring(0, maxLength - 3) + '...';
    }
    const extension = name.substring(extensionIndex);
    const nameWithoutExt = name.substring(0, extensionIndex);
    if (nameWithoutExt.length < 2) return name;
    const keepLength = maxLength - extension.length - 3;
    if (keepLength < 1) {
      return '...' + extension.substring(0, 4);
    }
    return `${nameWithoutExt.substring(0, keepLength)}...${extension}`;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading || isAiGenerating) return;

    const hasUploadsInProgress = attachedFiles.some(f => f.uploadStatus === 'pending' || f.uploadStatus === 'uploading');
    const hasFailedUploads = attachedFiles.some(f => f.uploadStatus === 'error');

    if (hasUploadsInProgress) {
      setUploadError('Please wait for all files to finish uploading.');
      return;
    }

    if (hasFailedUploads) {
      setUploadError('Some files failed to upload. Please remove them and try again.');
      return;
    }

    try {
      const processedAttachments = attachedFiles
        .filter(f => f.uploadStatus === 'success' && f.uploadResult)
        .map(f => f.uploadResult!);

      onSubmit?.(inputValue.trim(), processedAttachments, selectedUIModelId);
      setInputValue('');

      // Cleanup blob URLs
      Object.values(filePreviewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      setAttachedFiles([]);
      setFilePreviewUrls({});
      setShowAttachments(false);
      setShowSuggestions(false);
      // Only clear error on successful submit
      setUploadError(null);
    } catch (error) {
      console.error('Submit error:', error);
      setUploadError(error instanceof Error ? error.message : 'Submit failed');
      // Don't cleanup on error - keep attachments for retry
    }
  }, [inputValue, isLoading, isAiGenerating, onSubmit, attachedFiles, filePreviewUrls]);

  const inputModality = useInputModality()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (inputModality !== "touch") {
        event.preventDefault();
        handleSubmit();
      }
    } else if (event.key === 'Escape') {
      setShowAttachments(false);
      setShowSuggestions(false);
      // Cancels an active drag-and-drop operation
      if (isDragging) {
        setIsDragging(false);
        dragCounterRef.current = 0;
      }
    }
  };

  const handleStopGenerating = useCallback(() => {
    onStopGenerating?.();
  }, [onStopGenerating]);

  const stopAudioProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioData(new Uint8Array(0));
  }, []);

  const startAudioProcessing = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Media Devices API not supported.");
        return;
      }

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(analyserRef.current);

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      // In your startAudioProcessing function
      const processAudio = () => {
        if (analyserRef.current && dataArrayRef.current) {
          // FIX: Add a type assertion to satisfy the strict type definition
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
          setAudioData(new Uint8Array(dataArrayRef.current));
        }
        animationFrameRef.current = requestAnimationFrame(processAudio);
      };

      animationFrameRef.current = requestAnimationFrame(processAudio);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
    }
  }, []);

  const {
    start: startSpeechRecognition,
    stop: stopSpeechRecognition,
    transcript,
  } = useSpeechRecognition({ providerName: 'web-speech' });

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Main effect to orchestrate audio processing and speech recognition
  useEffect(() => {
    // This effect should only run when isRecording is true.
    if (isRecording) {
      startAudioProcessing();
      startSpeechRecognition();

      // The returned cleanup function is the key.
      // It will run when `isRecording` becomes false or when the component unmounts.
      return () => {
        stopAudioProcessing();
        stopSpeechRecognition();
      };
    }
  }, [isRecording, startAudioProcessing, stopAudioProcessing, startSpeechRecognition, stopSpeechRecognition]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (!newFiles.length) return;

    // Close modal immediately
    setShowAttachments(false);

    // Reset input value immediately
    if (event.target) {
      event.target.value = '';
    }

    // Process files, but catch any errors to avoid unhandled rejections
    try {
      await processFiles(newFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const uploadFile = async (fileWithId: AttachedFile) => {
    setAttachedFiles(prev => prev.map(f => 
      f.id === fileWithId.id ? { ...f, uploadStatus: 'uploading' as const } : f
    ));

    try {
      const formData = new FormData();
      formData.append('files', fileWithId.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      const uploadedFile = result.files[0];

      setAttachedFiles(prev => prev.map(f => 
        f.id === fileWithId.id ? { 
          ...f, 
          uploadStatus: 'success' as const,
          uploadResult: {
            url: uploadedFile.attachmentUrl,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
          }
        } : f
      ));
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setAttachedFiles(prev => prev.map(f => 
        f.id === fileWithId.id ? { 
          ...f, 
          uploadStatus: 'error' as const,
          error: errorMessage
        } : f
      ));
      toast.error('File upload failed', {
        description: `${fileWithId.file.name}: ${errorMessage}`,
      });
    }
  };

  const removeAttachment = (idToRemove: string) => {
    const fileToRemove = attachedFiles.find(f => f.id === idToRemove);
    if (!fileToRemove) return;

    if (filePreviewUrls[idToRemove] && filePreviewUrls[idToRemove].startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrls[idToRemove]);
    }

    setAttachedFiles(prev => prev.filter(f => f.id !== idToRemove));
    setFilePreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[idToRemove];
      return newUrls;
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const characterCount = inputValue.length;
  const isNearLimit = maxInputCharacterLength ? characterCount >= maxInputCharacterLength * 0.9 : false;
  const isOverLimit = maxInputCharacterLength ? characterCount > maxInputCharacterLength : false;
  const canSubmit = inputValue.trim().length > 0 && !isLoading && !isAiGenerating && !isOverLimit && !hasUploadsInProgress && !hasFailedUploads && hasAllowance;

  return (
    <TooltipProvider>
      <div className="relative w-full">
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 right-0 mb-2 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl z-20"
          >
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2 px-2">Suggestions</p>
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-150"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Allowance exhausted banner - always rendered to prevent layout shift during page transitions */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            !isLoadingAllowance && !hasAllowance ? "max-h-24 mb-2 opacity-100" : "max-h-0 mb-0 opacity-0"
          )}
        >
          <div className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border",
            isFreeUser
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-orange-500/10 border-orange-500/30 text-orange-200"
          )}>
            <div className="flex items-center gap-3 min-w-0">
              {isFreeUser ? (
                <Zap className="h-5 w-5 shrink-0 text-amber-400" />
              ) : (
                <Clock className="h-5 w-5 shrink-0 text-orange-400" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {isFreeUser
                    ? "Free access is temporarily unavailable due to heavy demand."
                    : "Your allowance has ended for this period."}
                </p>
                {!isFreeUser && allowanceResetTime && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Resets at {new Date(allowanceResetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/upgrade"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isFreeUser
                  ? "bg-amber-500 hover:bg-amber-500/80 text-amber-950"
                  : "bg-orange-500 hover:bg-orange-500/80 text-orange-950"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade
            </Link>
          </div>
        </div>

        {/* Main input container */}
        <div
          className={cn(
            "flex w-full items-end space-x-3 p-2 rounded-2xl transition-all duration-300 shadow-xl relative",
            "bg-linear-to-br from-card/90 via-secondary/90 to-card/90",
            "border border-border/30 backdrop-blur-xl",
            isFocused && "ring-2 ring-primary/30 border-primary/30",
            isLoading && "opacity-90",
            isDragging && "ring-2 ring-primary/50 border-primary/50 bg-primary/5",
            className
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="region"
          aria-label="Chat input with file upload"
          {...props}
        >
          {/* Screen reader live region for drag status announcements */}
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {isDragging ? 'Drag and drop area active. Release to upload files.' : ''}
          </div>
          
          {/* Drag and drop overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary"
              >
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Paperclip className="h-8 w-8" />
                  <p className="text-sm font-medium">Drop files here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FIX: Removed space-y-2 from this container. Spacing is now handled by children. */}
          <div className="flex flex-col w-full">
            {/* Enhanced attached files preview */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <motion.div
                  // FIX: Added marginBottom to animation to prevent layout shift
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: animatedHeight, marginBottom: "8px" }} // 8px is tailwind's mb-2
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div ref={innerAttachmentsRef} className="pb-2">
                    <motion.div
                      layout
                      className="flex flex-wrap gap-3"
                    >
                      {attachedFiles.map(({ id, file, uploadStatus, error }) => {
                        const previewUrl = filePreviewUrls[id];
                        const FileIcon = getFileIcon(file);
                        const isImage = file.type.startsWith('image/');

                        return (
                          <motion.div
                            key={id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative bg-muted rounded-lg overflow-hidden border border-border hover:border-border/80 shadow-md"
                          >
                            {(uploadStatus === 'pending' || uploadStatus === 'uploading') && (
                              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  <span className="text-xs text-foreground">
                                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            )}
                            {uploadStatus === 'error' && (
                              <div className="absolute inset-0 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => {
                                        const fileToRetry = attachedFiles.find(f => f.id === id);
                                        if (fileToRetry) uploadFile(fileToRetry);
                                      }}
                                      className="w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center transition-colors"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Retry upload</p></TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                            {isImage && previewUrl ? (
                              <div className="relative">
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-20 h-20 object-cover"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-1 left-1.5 right-1.5 text-xs">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-foreground font-medium truncate cursor-default">{file.name}</p>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{file.name}</p></TooltipContent>
                                  </Tooltip>
                                  <p className="text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-20 h-20 flex items-center justify-center p-2">
                                  <FileIcon className={cn(
                                    "h-8 w-8",
                                    file.type.includes('pdf') ? 'text-red-400' :
                                      file.type.includes('doc') || file.type.includes('text') ? 'text-blue-400' :
                                        'text-muted-foreground'
                                  )} />
                                </div>
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-1 left-1.5 right-1.5 text-xs">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-white font-medium truncate cursor-default">{truncateFileName(file.name)}</p>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{file.name}</p></TooltipContent>
                                  </Tooltip>
                                  <p className="text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => removeAttachment(id)}
                                  className="absolute top-1 right-1 w-6 h-6 text-foreground rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-20"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Remove file</p></TooltipContent>
                            </Tooltip>
                            {!isImage && (
                              <div className="absolute top-1 left-1 bg-card/80 px-1.5 py-0.5 rounded-sm text-xs font-mono text-muted-foreground transition-opacity duration-200">
                                {getFileDisplayName(file)}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main input area */}
            {/* FIX: Added mb-2 here to create space between this and the toolbar */}
            <div className="relative mb-2">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                className={cn(
                  "flex-1 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
                  "bg-transparent! text-foreground placeholder:text-muted-foreground text-base leading-relaxed",
                  "pr-4 pb-4 min-h-8 transition-all duration-200",
                  isOverLimit && "text-red-200"
                )}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                onPaste={handlePaste}
                rows={1}
              />

              {/* TODO || EXPERIMENTAL: This is under consideration */}
              {maxInputCharacterLength && (
                <div className={cn(
                  "absolute bottom-2 right-4 text-[10px] font-medium transition-colors duration-200",
                  isOverLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {characterCount} / {maxInputCharacterLength}
                </div>
              )}
            </div>

            {/* Enhanced toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative" ref={attachmentsRef}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-all duration-200 h-9 px-3",
                      isAtFileLimit && "opacity-50"
                    )}
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <Plus className="h-4 w-4" />
                    {!isMobile && <span className="text-sm">Attach</span>}
                  </Button>

                  {showAttachments && (
                    <div className="absolute bottom-full left-0 mb-2 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl z-10 p-2 min-w-40">
                      <button
                        onClick={() => !isAtFileLimit && imageFileInputRef.current?.click()}
                        disabled={isAtFileLimit}
                        className={cn(
                          "flex items-center space-x-2 w-full px-3 py-2 text-sm rounded-lg transition-colors",
                          isAtFileLimit
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Image className={cn("h-4 w-4", isAtFileLimit ? "text-muted-foreground/50" : "text-blue-400")} />
                        <span>Upload Image</span>
                      </button>
                      <button
                        onClick={() => !isAtFileLimit && generalFileInputRef.current?.click()}
                        disabled={isAtFileLimit}
                        className={cn(
                          "flex items-center space-x-2 w-full px-3 py-2 text-sm rounded-lg transition-colors",
                          isAtFileLimit
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <FileText className={cn("h-4 w-4", isAtFileLimit ? "text-muted-foreground/50" : "text-green-400")} />
                        <span>Upload File</span>
                      </button>
                      {isAtFileLimit && (
                        <p className="text-xs text-muted-foreground px-3 py-1 mt-1 border-t border-border">
                          Maximum {MAX_FILES} files reached
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-all duration-200"
                    >
                      <Stone className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {UIModels.find(m => m.id === selectedUIModelId)?.name || "Model"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-card/95 backdrop-blur-lg border-border text-foreground"
                  >
                    {UIModels.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedUIModelId(model.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 focus:bg-muted/50 cursor-pointer",
                          selectedUIModelId === model.id && "bg-primary/10 focus:bg-primary/15"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            "font-medium transition-colors",
                            selectedUIModelId === model.id ? "text-primary" : "text-foreground"
                          )}>
                            {model.name}
                          </span>
                          {selectedUIModelId === model.id && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {model.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isVoiceSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-all duration-200 h-9 w-9",
                          isRecording && "bg-destructive/20 text-destructive animate-pulse ring-2 ring-destructive/30"
                        )}
                        onClick={toggleRecording}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{isRecording ? "Stop recording" : "Start voice input"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-all duration-200 h-9 w-9"
                      disabled={isLoading}
                      onClick={onLiveVoiceChat}
                    >
                      <AudioLines className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Live Voice Chat</p>
                  </TooltipContent>
                </Tooltip> */}

                {isAiGenerating ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleStopGenerating}
                        className={cn(
                          "rounded-xl transition-all duration-300 h-9 w-9 p-0 shadow-lg",
                          "bg-muted hover:bg-muted/80 text-muted-foreground hover:shadow-xl hover:scale-105 animate-pulse-slow"
                        )}
                      >
                        <Square className="h-4 w-4 fill-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Stop generating response</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={cn(
                          "rounded-xl transition-all duration-300 h-9 w-9 p-0 shadow-lg",
                          canSubmit
                            ? "bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground hover:shadow-xl hover:scale-105 animate-pulse-slow"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-t-2 border-primary-foreground rounded-full animate-spin"></div>
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>
                        {canSubmit
                          ? "Send message"
                          : !hasAllowance
                            ? isFreeUser
                              ? "Free access is temporarily unavailable"
                              : "Allowance exhausted - wait for reset or upgrade"
                            : "Enter a message to send"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Status indicators */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  // FIX: Added marginTop to animation to prevent layout shift
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: "8px" }} // 8px is tailwind's mt-2
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-1 bg-card/50 border border-border rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-3 w-full mr-2">
                      <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse shrink-0" />
                      <div className="w-full h-8">
                        <VoiceVisualizer isListening={isRecording} audioData={audioData} />
                      </div>
                    </div>
                    <button
                      onClick={toggleRecording}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={imageFileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={generalFileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
}

export default ChatInput;
