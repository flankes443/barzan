export interface HTMLProject {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  text: string;
  timestamp: string;
}

export interface HTMLTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  html: string;
  css: string;
  js: string;
}

export type CodeTab = 'html' | 'css' | 'js';

export interface DeviceConfig {
  model: 'iphone15' | 'iphone14' | 'iphone8';
  color: string;
  orientation: 'portrait' | 'landscape';
  showBezel: boolean;
  scale: number;
}
