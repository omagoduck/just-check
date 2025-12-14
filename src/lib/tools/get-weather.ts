import { z } from 'zod';

// Type definitions for getWeather tool
export interface GetWeatherInput {
  location?: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  conditions: string;
  description: string;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
}

export interface ForecastDay {
  date: string;
  temperature: {
    high: number;
    low: number;
  };
  conditions: string;
  description: string;
  humidity: number;
  precipitation: number;
}

export interface GetWeatherOutput {
  current: WeatherData;
  forecast: ForecastDay[];
}

// Weather tool definition with executor
export const getWeatherTool = {
  description: 'Get current weather and forecast for a location. Keep empty for user\'s current location.',
  inputSchema: z.object({
    location: z.string().optional().describe('Location to get weather for (e.g., "London, UK" or "New York"). Keep empty for user\'s current location.'),
  }) as z.ZodType<GetWeatherInput>,
};
