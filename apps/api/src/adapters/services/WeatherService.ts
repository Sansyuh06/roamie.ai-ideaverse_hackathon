import { IWeatherService } from '../../domain/interfaces';
import { WeatherForecast } from '../../domain/entities';

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 80: 'Slight rain showers',
  95: 'Thunderstorm',
};

// When the live API is unavailable we return NO weather rather than
// fabricating data — the itinerary simply omits weather for that run.
const EMPTY_FORECAST: WeatherForecast = { daily: [] };

export class WeatherService implements IWeatherService {
  async getForecast(lat: number, lng: number, days: number = 7): Promise<WeatherForecast> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=${days}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const data = await res.json() as any;

      return {
        daily: data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
          precipitationProbability: data.daily.precipitation_probability_max[i],
          weatherCode: data.daily.weather_code[i],
          description: WEATHER_DESCRIPTIONS[data.daily.weather_code[i]] || 'Unknown',
        })),
      };
    } catch (error) {
      console.warn('Weather API unavailable — proceeding without weather data (no fabricated values)');
      return EMPTY_FORECAST;
    }
  }
}
