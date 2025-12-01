import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherTool } from '../tools/weather-tool.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Weather Tool', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Set up environment variable
    process.env.OPEN_WEATHER_API_KEY = 'test-api-key';
  });

  describe('weatherTool definition', () => {
    it('should have correct structure', () => {
      expect(weatherTool).toBeDefined();
      expect(weatherTool.description).toBe('Get the weather for a location in Japan');
      expect(weatherTool.parameters).toBeDefined();
      expect(weatherTool.parameters.type).toBe('object');
      expect(weatherTool.parameters.properties.location).toBeDefined();
      expect(weatherTool.execute).toBeInstanceOf(Function);
    });
  });

  describe('weatherTool.execute', () => {
    it('should return weather information for valid location', async () => {
      // Mock successful API response
      const mockWeatherData = {
        weather: [{ description: '晴れ' }],
        main: {
          temp: 25,
          temp_min: 20,
          temp_max: 28,
          humidity: 60,
        },
        wind: {
          speed: 3.5,
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherData,
      });

      const result = await weatherTool.execute({ location: '東京都' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('api.openweathermap.org/data/2.5/weather');
      expect(callUrl).toContain('JP');
      expect(result).toContain('東京都');
      expect(result).toContain('晴れ');
      expect(result).toContain('25℃');
    });

    it('should handle 404 error for invalid location', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await weatherTool.execute({ location: '存在しない場所' });

      expect(result).toContain('天気情報が見つかりませんでした');
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await weatherTool.execute({ location: '東京都' });

      expect(result).toContain('天気情報を取得できませんでした');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherTool.execute({ location: '東京都' });

      expect(result).toContain('天気情報を取得できませんでした');
      expect(result).toContain('Network error');
    });

    it('should handle missing API key', async () => {
      // Save original value
      const originalKey = process.env.OPEN_WEATHER_API_KEY;
      delete process.env.OPEN_WEATHER_API_KEY;

      const result = await weatherTool.execute({ location: '東京都' });

      expect(result).toContain('天気情報を取得できませんでした');
      expect(result).toContain('APIキーが設定されていません');

      // Restore original value
      process.env.OPEN_WEATHER_API_KEY = originalKey;
    });

    it('should include date in response', async () => {
      const mockWeatherData = {
        weather: [{ description: '曇り' }],
        main: {
          temp: 18,
          temp_min: 15,
          temp_max: 22,
          humidity: 70,
        },
        wind: {
          speed: 2.0,
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherData,
      });

      const result = await weatherTool.execute({ location: '大阪' });

      // Check that result includes current date in YYYY/M/D format
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const expectedDate = `${year}/${month}/${day}`;

      expect(result).toContain(expectedDate);
    });
  });
});
