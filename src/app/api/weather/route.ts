import { NextResponse } from 'next/server';
import { executeGetWeather } from '@/lib/tools/executor/get-weather-executor';
import { getLocationFromCoordinates, fetchWeatherData } from '@/lib/tools/executor/get-weather-executor';
import type { GetWeatherOutput } from '@/lib/tools/get-weather';

export async function POST(request: Request) {
  try {
    const { location, lat, lon } = await request.json();

    // Validate input
    if (!location && (lat === undefined || lon === undefined)) {
      return NextResponse.json(
        { error: 'Either location or coordinates (lat/lon) must be provided' },
        { status: 400 }
      );
    }

    let weatherData: GetWeatherOutput;

    if (location) {
      // Use existing server-side executor for location-based queries
      weatherData = await executeGetWeather({ location });
    } else {
      // Handle coordinate-based queries
      const locationName = await getLocationFromCoordinates(lat!, lon!);
      const { currentData, forecastData } = await fetchWeatherData(lat!, lon!);

      // Process current weather data
      const current = {
        location: locationName,
        temperature: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        conditions: currentData.weather[0].main,
        description: currentData.weather[0].description,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        pressure: currentData.main.pressure,
        visibility: currentData.visibility / 1000, // Convert to km
        uvIndex: 0, // UV index requires separate API call
      };

      // Process forecast data (next 5 days)
      const forecast = [];
      const dailyData = forecastData.list.filter((_: any, index: number) => index % 8 === 0); // Every 24 hours (8 * 3-hour intervals)

      for (let i = 0; i < Math.min(5, dailyData.length); i++) {
        const day = dailyData[i];
        forecast.push({
          date: new Date(day.dt * 1000).toLocaleDateString(),
          temperature: {
            high: Math.round(day.main.temp_max),
            low: Math.round(day.main.temp_min),
          },
          conditions: day.weather[0].main,
          description: day.weather[0].description,
          humidity: day.main.humidity,
          precipitation: day.rain ? day.rain['3h'] || 0 : 0,
        });
      }

      weatherData = { current, forecast };
    }

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Weather API error:', error);

    // Return fallback data in case of error
    const fallbackData = {
      current: {
        location: location || 'Unknown Location',
        temperature: 0,
        feelsLike: 0,
        humidity: 0,
        conditions: 'Unknown',
        description: 'Weather data unavailable',
        windSpeed: 0,
        pressure: 0,
        visibility: 0,
        uvIndex: 0,
      },
      forecast: [],
    };

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', data: fallbackData },
      { status: 500 }
    );
  }
}
