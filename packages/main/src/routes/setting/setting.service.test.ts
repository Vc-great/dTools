// Mock modules before importing the service
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn((name: string) => {
      return name === 'userData' ? '/mock/userData' : '/mock/documents';
    })
  }
}));

vi.mock('fs/promises');
vi.mock('path');

import { SettingService } from './setting.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

const mockFs = fs as any;
const mockApp = app as any;
const mockPath = path as any;

describe('SettingService', () => {
  let settingService: SettingService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApp.getVersion.mockReturnValue('1.0.0');
    mockApp.getPath.mockImplementation((name: string) => {
      return name === 'userData' ? '/mock/userData' : '/mock/documents';
    });

    mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'));
    mockPath.dirname.mockImplementation((filePath: string) => filePath.split('/').slice(0, -1).join('/'));
    mockPath.resolve.mockImplementation((p: string) => p);

    settingService = new SettingService();
  });

  describe('getSettings', () => {
    it('should create default settings when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await settingService.getSettings();

      expect(result.dataFolderPath).toBe('/mock/documents/dTools');
      expect(result.version).toBe('1.0.0');
      expect(typeof result.lastModified).toBe('number');

      // Verify that writeFile was called to create settings
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/mock/userData/settings.json',
        expect.stringContaining('"dataFolderPath": "/mock/documents/dTools"'),
        'utf-8'
      );
    });

    it('should return existing settings when file exists', async () => {
      const mockSettings = {
        dataFolderPath: '/custom/path',
        version: '1.0.0',
        lastModified: 1234567890
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSettings));

      const result = await settingService.getSettings();

      expect(result).toEqual(mockSettings);
      expect(mockFs.readFile).toHaveBeenCalledWith('/mock/userData/settings.json', 'utf-8');
    });

    it('should handle read file errors', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(settingService.getSettings()).rejects.toThrow('无法读取设置文件');
    });
  });

  describe('updateDataPath', () => {
    it('should return unchanged message when paths are same', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        dataFolderPath: '/old/path',
        version: '1.0.0',
        lastModified: 1234567890
      }));

      const result = await settingService.updateDataFolderPath('/old/path');

      expect(result.success).toBe(true);
      expect(result.message).toBe('数据路径未更改');
      expect(result.newDataPath).toBe('/old/path');
    });

    it('should successfully update data path', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        dataFolderPath: '/old/path',
        version: '1.0.0',
        lastModified: 1234567890
      }));

      mockPath.resolve.mockImplementation((p: string) => p === '/old/path' ? '/old/path' : '/new/path');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await settingService.updateDataFolderPath('/new/path');

      expect(result.success).toBe(true);
      expect(result.message).toBe('数据路径更新成功');
      expect(result.newDataPath).toBe('/new/path');

      // Verify settings file was updated
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/mock/userData/settings.json',
        expect.stringContaining('"dataFolderPath": "/new/path"'),
        'utf-8'
      );
    });

    it('should handle update errors gracefully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        dataFolderPath: '/old/path',
        version: '1.0.0',
        lastModified: 1234567890
      }));

      mockPath.resolve.mockImplementation((p: string) => p === '/old/path' ? '/old/path' : '/new/path');
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const result = await settingService.updateDataFolderPath('/new/path');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无法创建目录');
      expect(result.newDataPath).toBe('/new/path');
    });
  });
});
