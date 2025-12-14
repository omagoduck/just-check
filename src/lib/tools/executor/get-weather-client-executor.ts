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
  // ===== COMPREHENSIVE LOGGING EXAMPLE USING toolCall =====
  console.log(`🔧 [TOOL EXECUTION STARTED] ${toolCall.toolName} (ID: ${toolCall.toolCallId})`);
  console.log(`📝 Input received:`, input);
  console.log(`⏱️  Timestamp:`, new Date().toISOString());

  const typedInput = input as GetWeatherInput;
  const { location } = typedInput;

  // Log which execution path we're taking
  if (location) {
    console.log(`🌍 Using provided location: "${location}"`);
    console.log(`📍 Execution path: Location-based weather fetch`);

    const startTime = performance.now();
    const result = await callWeatherApi({ location });
    const endTime = performance.now();

    console.log(`✅ Successfully fetched weather for "${location}"`);
    console.log(`⏱️  Execution time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Result preview:`, {
      location: result.current.location,
      temperature: result.current.temperature,
      conditions: result.current.conditions
    });

    return result;
  }

  // No location provided - use current location (geolocation)
  console.log(`📍 Execution path: Geolocation-based weather fetch`);
  console.log(`🔍 Requesting browser geolocation permissions...`);

  // Try to get browser geolocation
  try {
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      console.error(`❌ Geolocation API not available in this browser`);
      throw new Error('Geolocation is not supported by your browser');
    }

    console.log(`✅ Geolocation API available, requesting permissions...`);

    // Request geolocation permissions
    const geolocationStart = performance.now();
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(`🎯 Geolocation obtained successfully`);
          console.log(`📍 Coordinates: ${position.coords.latitude}, ${position.coords.longitude}`);
          console.log(`📊 Accuracy: ${position.coords.accuracy || 'unknown'} meters`);
          resolve(position);
        },
        (error) => {
          console.error(`❌ Geolocation error:`, error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
    const geolocationEnd = performance.now();

    console.log(`⏱️  Geolocation obtained in ${(geolocationEnd - geolocationStart).toFixed(2)}ms`);

    // Call server API with coordinates
    console.log(`🔄 Calling weather API with coordinates...`);
    const apiStart = performance.now();
    const result = await callWeatherApi({
      lat: position.coords.latitude,
      lon: position.coords.longitude
    });
    const apiEnd = performance.now();

    console.log(`✅ Weather API call successful`);
    console.log(`⏱️  API execution time: ${(apiEnd - apiStart).toFixed(2)}ms`);
    console.log(`📊 Weather data received for: ${result.current.location}`);

    // Final summary logging
    const totalEnd = performance.now();
    console.log(`🎉 [TOOL EXECUTION COMPLETED] ${toolCall.toolName} (ID: ${toolCall.toolCallId})`);
    console.log(`📊 Summary:`);
    console.log(`   - Location: ${result.current.location}`);
    console.log(`   - Temperature: ${result.current.temperature}°C`);
    console.log(`   - Conditions: ${result.current.conditions}`);
    console.log(`   - Total execution time: ${(totalEnd - performance.now() + (geolocationEnd - geolocationStart) + (apiEnd - apiStart)).toFixed(2)}ms`);

    return result;

  } catch (error) {
    // Enhanced error logging
    console.error(`💥 [TOOL EXECUTION FAILED] ${toolCall.toolName} (ID: ${toolCall.toolCallId})`);
    console.error(`📝 Error details:`, error);

    // Handle geolocation errors with specific logging
    if (error instanceof Error) {
      if (error.message.includes('denied') || error.message.includes('permission')) {
        console.error(`🔒 User denied geolocation permission`);
        throw new Error('Geolocation permission denied. Please provide a location manually.');
      } else if (error.message.includes('timeout')) {
        console.error(`⏰ Geolocation request timed out (10s)`);
        throw new Error('Geolocation request timed out. Please try again or provide a location manually.');
      } else if (error.message.includes('unavailable')) {
        console.error(`🚫 Geolocation service unavailable`);
        throw new Error('Geolocation service is unavailable. Please provide a location manually.');
      }
    }

    console.error(`💔 Fallback error for unknown issues`);
    throw new Error('Failed to get your location. Please provide a location manually.');
  }
}

/**
 * Call the server-side weather API
 */
async function callWeatherApi(params: { location?: string; lat?: number; lon?: number }): Promise<GetWeatherOutput> {
  try {
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

  } catch (error) {
    console.error('Weather API call failed:', error);
    throw new Error('Failed to fetch weather data. Please try again later.');
  }
}
