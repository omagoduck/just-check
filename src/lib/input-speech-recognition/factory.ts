import { SpeechRecognitionProvider } from "./types";
import { WebSpeechApiProvider } from "./providers/web-speech-api";

/**
 * A factory function to select and instantiate the desired speech recognition provider.
 * @param providerName - The name of the provider to use (e.g., 'web-speech').
 * @returns An instance of the selected speech recognition provider.
 */
export function createSpeechProvider(providerName: string): SpeechRecognitionProvider {
  switch (providerName) {
    case 'web-speech':
      return new WebSpeechApiProvider();
    // In the future, other providers can be added here:
    // case 'google-cloud':
    //   return new GoogleCloudProvider();
    // case 'azure-speech':
    //   return new AzureSpeechProvider();
    default:
      throw new Error(`Unsupported speech recognition provider: ${providerName}`);
  }
}