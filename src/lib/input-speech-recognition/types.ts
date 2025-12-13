export type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface RecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechRecognitionProvider {
  /**
   * Starts the speech recognition process.
   * This might involve opening a microphone stream or starting a connection.
   */
  start(): void;

  /**
   * Stops the speech recognition process.
   * For real-time providers, this stops listening.
   * For post-recording providers, this may trigger the processing step.
   */
  stop(): void;

  // --- Event Handlers ---
  onStatusChange: (status: RecognitionStatus) => void;
  onResult: (result: RecognitionResult) => void;
  onError: (error: Error) => void;
}