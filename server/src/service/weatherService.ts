import dotenv from 'dotenv';
dotenv.config();

// TODO: Define an interface for the Coordinates object
interface Coordinates {
  latitude: number;
  longitude: number;
}

// TODO: Define a class for the Weather object
class Weather {
  constructor(
    public city: string,
    public date: string,
    public temperature: number,
    public description: string,
    public humidity: number,
    public windSpeed: number,
    public icon: string
  ) {}
}

// TODO: Complete the WeatherService class
class WeatherService {
  private baseURL: string = process.env.API_BASE_URL || 'https://api.openweathermap.org';
  private apiKey: string = process.env.API_KEY || '';

  private async fetchLocationData(query: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/geo/1.0/direct?q=${query}&limit=1&appid=${this.apiKey}`);
    return response.json();
  }

  private destructureLocationData(locationData: any): Coordinates {
    return {
      latitude: locationData[0].lat,
      longitude: locationData[0].lon
    };
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}&units=metric`;
  }

  private buildForecastQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}&units=metric`;
  }

  private async fetchAndDestructureLocationData(city: string): Promise<Coordinates> {
    const locationData = await this.fetchLocationData(city);
    return this.destructureLocationData(locationData);
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<any> {
    const response = await fetch(this.buildWeatherQuery(coordinates));
    return response.json();
  }

  private async fetchForecastData(coordinates: Coordinates): Promise<any> {
    const response = await fetch(this.buildForecastQuery(coordinates));
    return response.json();
  }

  private parseCurrentWeather(response: any, city: string): Weather {
    console.log("Temperature:", response.main.temp);
    return new Weather(
      city,
      new Date().toISOString().split("T")[0],
      response.main.temp,
      response.weather[0].description,
      response.main.humidity,
      response.wind.speed,
      response.weather[0].icon 
    );
  }

  async getWeatherForCity(city: string): Promise<any[]> {
    try {
      const coordinates = await this.fetchAndDestructureLocationData(city);
  
      const weatherData = await this.fetchWeatherData(coordinates);
  
      const forecastData = await this.fetchForecastData(coordinates);
  
      const dailyForecast = forecastData.list
        .filter((entry: any) => entry.dt_txt.includes("12:00:00"))
        .map((entry: any) => ({
          city,
          date: entry.dt_txt.split(" ")[0],
          icon: entry.weather[0].icon,
          iconDescription: entry.weather[0].description,
          tempF: entry.main.temp,
          windSpeed: entry.wind.speed,
          humidity: entry.main.humidity,
        }));
  
      return [
        this.parseCurrentWeather(weatherData, city), 
        ...dailyForecast.slice(0, 5),
      ];
    } catch (error) {
      console.error(`Failed to get weather for ${city}:`, error);
      throw new Error('Unable to fetch weather data.');
    }
  }
}

export default new WeatherService();

