
export enum Tab {
  FIRE = 'fire',
  ARCADE = 'arcade',
  CHAT = 'chat',
  PEOPLE = 'people',
  SETTINGS = 'settings'
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  locked: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  image: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
  bio?: string;
  interests?: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
  youtubeId?: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type AiMode = 'fast' | 'pro';
