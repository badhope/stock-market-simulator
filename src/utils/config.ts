import fs from 'fs';
import path from 'path';
import { Config } from '../types/index.js';

const DEFAULT_CONFIG: Config = {
  defaultPlatforms: [],
  dataDir: '.data'
};

let config: Config | null = null;
let configPath: string | null = null;

export function initConfig(baseDir: string): Config {
  configPath = path.join(baseDir, 'config.json');
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    config = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } else {
    config = { ...DEFAULT_CONFIG };
    saveConfig();
  }
  
  return config as Config;
}

export function getConfig(): Config {
  if (config === null) {
    throw new Error('Config not initialized');
  }
  return config as Config;
}

export function updateConfig(updates: Partial<Config>): void {
  if (!config) {
    throw new Error('Config not initialized');
  }
  config = { ...config, ...updates };
  saveConfig();
}

function saveConfig(): void {
  if (!configPath || !config) return;
  
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getDataPath(filename: string): string {
  const cfg = getConfig();
  return path.join(cfg.dataDir, filename);
}

export function ensureDataDir(): void {
  const cfg = getConfig();
  if (!fs.existsSync(cfg.dataDir)) {
    fs.mkdirSync(cfg.dataDir, { recursive: true });
  }
}
