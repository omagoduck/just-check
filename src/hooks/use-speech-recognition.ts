import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createSpeechProvider } from '../lib/input-speech-recognition/factory';
import { RecognitionStatus } from '../lib/input-speech-recognition/types';

interface UseSpeechRecognitionOptions {
  providerName: string;
}

export function useSpeechRecognition({ providerName }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to hold the transcript to avoid recreating callbacks.
  const transcriptRef = useRef('');
  // Use a ref to hold the status to make callbacks stable.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const provider = useMemo(() => {
    try {
      const instance = createSpeechProvider(providerName);
      
      // The provider will call these methods to update the hook's state.
      instance.onStatusChange = (newStatus) => {
        console.log("Status Change:", newStatus);
        setStatus(newStatus);
      };
      
      instance.onError = (err) => {
        console.error("Speech Recognition Error:", err);
        setError(err);
        setStatus('error');
      };
      
      instance.onResult = ({ transcript: newTranscript, isFinal }) => {
        if (isFinal) {
          // On final result, append to the ref and update state.
          transcriptRef.current += newTranscript + ' ';
          setTranscript(transcriptRef.current);
        } else {
          // For interim results, show the current ref + the new interim part.
          setTranscript(transcriptRef.current + newTranscript);
        }
      };

      return instance;
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to create speech provider");
      console.error(err);
      setError(err);
      setStatus('error');
      return null;
    }
  }, [providerName]);

  const start = useCallback(() => {
    if (!provider || statusRef.current === 'listening') return;
    try {
      transcriptRef.current = ''; // Reset transcript on start
      setTranscript('');
      setError(null);
      provider.start();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to start speech recognition");
      setError(err);
      setStatus('error');
    }
  }, [provider]);

  const stop = useCallback(() => {
    if (!provider || statusRef.current !== 'listening') return;
    provider.stop();
  }, [provider]);

  // Cleanup: ensure the provider is stopped when the component unmounts.
  useEffect(() => {
    return () => {
      if (provider) {
        provider.stop();
      }
    };
  }, [provider]);

  return {
    start,
    stop,
    status,
    transcript,
    error,
    isListening: status === 'listening',
    isProcessing: status === 'processing',
  };
}