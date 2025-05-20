export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  emailUpdates: boolean;
}

export interface UserProfile extends User {
  createdAt: string;
  lastActive?: string;
}

export interface UserProfileUpdateParams {
  name?: string;
  phone?: string;
  avatar?: string;
  settings?: Partial<UserSettings>;
} 