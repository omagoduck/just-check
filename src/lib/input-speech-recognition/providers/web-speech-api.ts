import { RecognitionResult, RecognitionStatus, SpeechRecognitionProvider } from "../types";

// --- START: Manual Type Definitions for Web Speech API ---
// This is a workaround for projects that don't have the "dom.speech" lib in their tsconfig.
// The preferred solution is to install `@types/dom-speech-recognition`.

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

// This interface is intentionally incomplete, only containing what's used.
interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
}

// --- END: Manual Type Definitions ---


// Fallback for browsers that use the `webkit` prefix.
const BrowserSpeechRecognition: SpeechRecognitionStatic | null =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;


export class WebSpeechApiProvider implements SpeechRecognitionProvider {
  private recognition: SpeechRecognition | null = null;

  // These will be overridden by the useSpeechRecognition hook.
  onStatusChange: (status: RecognitionStatus) => void = () => {};
  onResult: (result: RecognitionResult) => void = () => {};
  onError: (error: Error) => void = () => {};

  constructor() {
    if (!BrowserSpeechRecognition) {
      console.error("Speech Recognition API is not supported in this browser.");
      return;
    }
    this.recognition = new BrowserSpeechRecognition();
    this.recognition.continuous = true; // Keep listening even after a pause.
    this.recognition.interimResults = true; // Get real-time, non-final results.

    this.recognition.onstart = () => {
      this.onStatusChange('listening');
    };

    this.recognition.onend = () => {
      this.onStatusChange('idle');
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore 'no-speech' errors which fire if you stop talking.
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      this.onError(new Error(event.error));
      this.onStatusChange('error');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const combinedTranscript = finalTranscript || interimTranscript;

      // Report results for real-time feedback.
      if (combinedTranscript) {
        this.onResult({ transcript: combinedTranscript, isFinal: !!finalTranscript });
      }
    };
  }

  public start(): void {
    if (!this.recognition) {
       this.onError(new Error("Speech recognition is not supported or failed to initialize."));
       return;
    }
    try {
        this.recognition.start();
    } catch(e) {
        console.error("Error starting speech recognition:", e)
        this.onError(e instanceof Error ? e : new Error("Failed to start"));
    }
  }

  public stop(): void {
    if (!this.recognition) return;

    try {
        // Using abort() is a more forceful and reliable way to ensure the microphone is released immediately.
        this.recognition.abort();
    } catch(e) {
        // Catching potential errors if stop is called when not in a valid state.
        console.error("Error stopping speech recognition:", e);
    }
    // Manually trigger status change, as the 'onend' event might be delayed or not fire after an abort.
    this.onStatusChange('idle');
  }
}