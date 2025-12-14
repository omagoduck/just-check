/**
 * Server-side executor for the getWeather tool
 */

import type { GetWeatherInput, GetWeatherOutput, WeatherData, ForecastDay } from '../get-weather';

// Utility function to get location from coordinates
const getLocationFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    // Using OpenWeatherMap's reverse geocoding API
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get location name');
    }
    
    const data = await response.json();
    if (data.length > 0) {
      return `${data[0].name}, ${data[0].country}`;
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error('Error getting location name:', error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
};

// Utility function to make weather API calls
const fetchWeatherData = async (lat: number, lon: number) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  const baseUrl = 'https://api.openweathermap.org/data/2.5';
  
  // Fetch current weather and forecast in parallel
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(`${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
    fetch(`${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
  ]);

  if (!currentResponse.ok) {
    throw new Error('Failed to fetch current weather data');
  }
  
  if (!forecastResponse.ok) {
    throw new Error('Failed to fetch weather forecast data');
  }

  const currentData = await currentResponse.json();
  const forecastData = await forecastResponse.json();

  return { currentData, forecastData };
};

/**
 * Execute the getWeather tool on the server side
 */
export async function executeGetWeather(
  { location }: GetWeatherInput
): Promise<GetWeatherOutput> {
  try {
    let lat: number;
    let lon: number;
    let locationName: string;

    // If location is provided, use it directly
    if (location) {
      // Geocode the location
      const geocodeResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );
      
      if (!geocodeResponse.ok) {
        throw new Error('Failed to geocode location');
      }
      
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.length === 0) {
        throw new Error(`Location "${location}" not found`);
      }
      
      lat = geocodeData[0].lat;
      lon = geocodeData[0].lon;
      locationName = `${geocodeData[0].name}, ${geocodeData[0].country}`;
    } else {
      // For server-side, we can't use browser geolocation, so throw an error
      throw new Error('Location is required for server-side weather queries');
    }

    // Fetch weather data
    const { currentData, forecastData } = await fetchWeatherData(lat, lon);

    // Process current weather data
    const current: WeatherData = {
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
    const forecast: ForecastDay[] = [];
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

    return {
      current,
      forecast,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    
    // Return fallback data in case of error
    return {
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
  }
}

