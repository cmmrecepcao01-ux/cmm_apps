
export interface User {
  id: string;
  name: string;
  role: string;
}

export interface AppConfig {
  theme: 'dark' | 'light';
  version: string;
}
