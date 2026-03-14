/**
 * Client-side executor for the getWeather tool
 * Handles browser geolocation and calls server-side API
 */

import type { GetWeatherInput, GetWeatherOutput } from '../get-weather';
import type { ClientToolCall } from '../client-executors';

/**
 * Execute the getWeather tool on the client side
 * Uses browser geolocation when no location is provided
 */
export async function executeGetWeatherClient(
  input: unknown,
  toolCall: ClientToolCall
): Promise<GetWeatherOutput> {
  const typedInput = input as GetWeatherInput;
  const { location } = typedInput;

  if (location) {
    try {
      return await callWeatherApi({ location });
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data. Please try again later.');
    }
  }

  // No location provided - use current location (geolocation)
  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    try {
      return await callWeatherApi({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      });
    } catch (apiError) {
      console.error('Weather API error:', apiError);
      throw new Error('Failed to fetch weather data. Please try again later.');
    }

  } catch (error) {
    // Handle geolocation errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('denied') || error.message.includes('permission')) {
        throw new Error('Geolocation permission denied. Please provide a location manually.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Geolocation request timed out. Please try again or provide a location manually.');
      } else if (error.message.includes('unavailable')) {
        throw new Error('Geolocation service is unavailable. Please provide a location manually.');
      }
    }

    throw new Error('Failed to get your location. Please provide a location manually.');
  }
}

/**
 * Call the server-side weather API
 */
async function callWeatherApi(params: { location?: string; lat?: number; lon?: number }): Promise<GetWeatherOutput> {
  const response = await fetch('/api/weather', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status}`);
  }

  return await response.json();
}
