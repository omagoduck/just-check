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
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
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
  Leaf,
  ChevronDown,
  Check
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

interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (message: string, attachments?: File[], modelId?: string) => void;
  isLoading?: boolean;
  isAiGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
  suggestions?: string[];
  onAttachmentUpload?: (files: File[]) => void;
  onLiveVoiceChat?: () => void;
  initialModelId?: string;
  maxInputCharacterLength?: number;
}
interface AttachedFile {
  id: string;
  file: File;
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
  initialModelId = "fast",
  maxInputCharacterLength,
  ...props
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<{ [id: string]: string }>({});
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(0));

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

  // #region This codeblock is soully for auto focus on load. If you want to remove auto focus, just delete this block.
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

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isLoading || isAiGenerating) return;

    onSubmit?.(inputValue.trim(), attachedFiles.map(f => f.file), selectedModelId);
    setInputValue("");

    Object.values(filePreviewUrls).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    setAttachedFiles([]);
    setFilePreviewUrls({});
    setShowAttachments(false);
    setShowSuggestions(false);
  }, [inputValue, isLoading, isAiGenerating, onSubmit, attachedFiles, filePreviewUrls]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      setShowAttachments(false);
      setShowSuggestions(false);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (!newFiles.length) return;

    const newPreviewUrls: { [id: string]: string } = {};

    const uniqueNewFiles = newFiles.filter(newFile =>
      !attachedFiles.some(existingFile =>
        existingFile.file.name === newFile.name && existingFile.file.size === newFile.size
      )
    );

    if (uniqueNewFiles.length < newFiles.length) {
      console.warn("Duplicate files were detected and not added.");
    }

    const filesWithIds = uniqueNewFiles.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
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

    setShowAttachments(false);

    if (event.target) {
      event.target.value = '';
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
  const canSubmit = inputValue.trim().length > 0 && !isLoading && !isAiGenerating && !isOverLimit;

  return (
    <TooltipProvider>
      <div className="relative w-full">
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800/95 backdrop-blur-lg border border-neutral-600/50 rounded-xl shadow-2xl z-20"
          >
            <div className="p-2">
              <p className="text-xs text-neutral-400 mb-2 px-2">Suggestions</p>
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700/50 rounded-lg transition-colors duration-150"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main input container */}
        <div className={cn(
          "flex w-full items-end space-x-3 p-2 rounded-2xl transition-all duration-300 shadow-xl",
          "bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90",
          "border border-neutral-700/30 backdrop-blur-xl",
          isFocused && "ring-2 ring-emerald-500/30 border-emerald-500/30",
          isLoading && "opacity-90",
          className
        )} {...props}>

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
                      {attachedFiles.map(({ id, file }) => {
                        const previewUrl = filePreviewUrls[id];
                        const FileIcon = getFileIcon(file);
                        const isImage = file.type.startsWith('image/');

                        return (
                          <motion.div
                            key={id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700/50 hover:border-neutral-600/50 shadow-md"
                          >
                            {isImage && previewUrl ? (
                              <div className="relative">
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-20 h-20 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-1 left-1.5 right-1.5 text-xs">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-white font-medium truncate cursor-default">{file.name}</p>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{file.name}</p></TooltipContent>
                                  </Tooltip>
                                  <p className="text-neutral-300">
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
                                        'text-neutral-400'
                                  )} />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-1 left-1.5 right-1.5 text-xs">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-white font-medium truncate cursor-default">{truncateFileName(file.name)}</p>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{file.name}</p></TooltipContent>
                                  </Tooltip>
                                  <p className="text-neutral-300">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => removeAttachment(id)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Remove file</p></TooltipContent>
                            </Tooltip>
                            {!isImage && (
                              <div className="absolute top-1 left-1 bg-neutral-900/80 px-1.5 py-0.5 rounded-sm text-xs font-mono text-neutral-300 transition-opacity duration-200">
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
                  "!bg-transparent text-white placeholder:text-neutral-400 text-base leading-relaxed",
                  "pr-4 pb-4 min-h-[32px] transition-all duration-200",
                  isOverLimit && "text-red-200"
                )}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                rows={1}
              />

              {/* TODO || EXPERIMENTAL: This is under consideration */}
              {maxInputCharacterLength && (
                <div className={cn(
                  "absolute bottom-2 right-4 text-[10px] font-medium transition-colors duration-200",
                  isOverLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-neutral-500"
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
                    className="bg-neutral-700/40 text-neutral-300 hover:text-white hover:bg-neutral-600/60 rounded-xl transition-all duration-200 h-9 px-3"
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm">Attach</span>
                  </Button>

                  {showAttachments && (
                    <div className="absolute bottom-full left-0 mb-2 bg-neutral-800/95 backdrop-blur-lg border border-neutral-600/50 rounded-xl shadow-xl z-10 p-2 min-w-[160px]">
                      <button
                        onClick={() => imageFileInputRef.current?.click()}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700/50 rounded-lg transition-colors"
                      >
                        <Image className="h-4 w-4 text-blue-400" />
                        <span>Upload Image</span>
                      </button>
                      <button
                        onClick={() => generalFileInputRef.current?.click()}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700/50 rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4 text-green-400" />
                        <span>Upload File</span>
                      </button>
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
                      className="h-9 px-3 gap-2 bg-neutral-700/40 text-neutral-300 hover:text-white hover:bg-neutral-600/60 rounded-xl transition-all duration-200"
                    >
                      <Leaf className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">
                        {UIModels.find(m => m.id === selectedModelId)?.name || "Model"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-neutral-800/95 backdrop-blur-lg border-neutral-700/50 text-neutral-200"
                  >
                    {UIModels.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModelId(model.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 focus:bg-neutral-700/50 cursor-pointer",
                          selectedModelId === model.id && "bg-emerald-500/10 focus:bg-emerald-500/15"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            "font-medium transition-colors",
                            selectedModelId === model.id ? "text-emerald-400" : "text-neutral-200"
                          )}>
                            {model.name}
                          </span>
                          {selectedModelId === model.id && (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                          {model.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "text-neutral-400 hover:text-white hover:bg-neutral-600/50 rounded-xl transition-all duration-200 h-9 w-9",
                        isRecording && "bg-red-500/20 text-red-400 animate-pulse ring-2 ring-red-500/30"
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neutral-400 hover:text-white hover:bg-neutral-600/50 rounded-xl transition-all duration-200 h-9 w-9"
                      disabled={isLoading}
                      onClick={onLiveVoiceChat}
                    >
                      <AudioLines className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Live Voice Chat</p>
                  </TooltipContent>
                </Tooltip>

                {isAiGenerating ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleStopGenerating}
                        className={cn(
                          "rounded-xl transition-all duration-300 h-9 w-9 p-0 shadow-lg",
                          "bg-red-600 hover:bg-red-700 text-white hover:shadow-xl hover:scale-105 animate-pulse-slow"
                        )}
                      >
                        <Square className="h-4 w-4" />
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
                            ? "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white hover:shadow-xl hover:scale-105 animate-pulse-slow"
                            : "bg-neutral-700/50 text-neutral-500 cursor-not-allowed"
                        )}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{canSubmit ? "Send message" : "Enter a message to send"}</p>
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
                  <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/50 border border-neutral-700/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-3 w-full mr-2">
                      <div className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
                      <div className="w-full h-8">
                        <VoiceVisualizer isListening={isRecording} audioData={audioData} />
                      </div>
                    </div>
                    <button
                      onClick={toggleRecording}
                      className="text-neutral-400 hover:text-white transition-colors flex-shrink-0"
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
