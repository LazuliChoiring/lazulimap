import { useState, useEffect } from 'react';
import { getCalendarInfo, CalendarInfo } from '../utils/calendar';

export interface WeatherInfo {
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
}

export interface EnvironmentState {
  weather: WeatherInfo | null;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  filter: string;
  calendar: CalendarInfo;
}

export function useEnvironment(amapKey: string) {
  const [env, setEnv] = useState<EnvironmentState>({
    weather: null,
    timeOfDay: 'day',
    filter: 'none',
    calendar: getCalendarInfo()
  });

  useEffect(() => {
    // 1. Determine time of day
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      let timeOfDay: EnvironmentState['timeOfDay'] = 'day';
      
      if (hour >= 5 && hour < 7) timeOfDay = 'dawn';
      else if (hour >= 7 && hour < 17) timeOfDay = 'day';
      else if (hour >= 17 && hour < 19) timeOfDay = 'dusk';
      else timeOfDay = 'night';
      
      return timeOfDay;
    };

    // 2. Fetch Hangzhou weather via AMap API
    const fetchWeather = async () => {
      try {
        // Hangzhou adcode is 330100
        const response = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?city=330100&key=${amapKey}`);
        const data = await response.json();
        
        if (data.status === '1' && data.lives && data.lives.length > 0) {
          return data.lives[0] as WeatherInfo;
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      }
      return null;
    };

    const updateEnv = async () => {
      const timeOfDay = updateTimeOfDay();
      let weather = await fetchWeather();
      
      // Fallback data if API fails
      if (!weather) {
        weather = {
          weather: '晴',
          temperature: '22',
          winddirection: '南',
          windpower: '≤3',
          humidity: '45',
          reporttime: new Date().toISOString()
        };
      }
      
      // 3. Determine filter based on weather and time
      let filter = 'none';
      
      // Weather logic - extremely safe check
      const weatherText = weather?.weather || '';
      const isRainy = weatherText.includes('雨');
      const isCloudy = weatherText.includes('阴') || weatherText.includes('多云');
      
      if (isRainy) {
        // "烟雨江南" - Misty, blue-grey
        filter = 'contrast(90%) brightness(95%) sepia(20%) hue-rotate(180deg) saturate(80%)';
      } else if (timeOfDay === 'dusk') {
        // "南屏晚钟" - Golden, warm
        filter = 'sepia(40%) saturate(150%) hue-rotate(-10deg) brightness(90%) contrast(110%)';
      } else if (timeOfDay === 'night') {
        // Deep night
        filter = 'brightness(70%) contrast(120%) saturate(70%) hue-rotate(200deg)';
      } else if (timeOfDay === 'dawn') {
        // Soft morning
        filter = 'brightness(105%) saturate(90%) sepia(10%) hue-rotate(10deg)';
      } else if (isCloudy) {
        // Soft grey
        filter = 'saturate(85%) brightness(102%) contrast(95%)';
      }

      setEnv({ 
        weather, 
        timeOfDay, 
        filter,
        calendar: getCalendarInfo()
      });
    };

    updateEnv();
    const interval = setInterval(updateEnv, 1000 * 60); // Update every minute for clock
    return () => clearInterval(interval);
  }, [amapKey]);

  return env;
}
