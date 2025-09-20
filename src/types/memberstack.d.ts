declare module '@memberstack/dom' {
  export interface Member {
    id: string;
    email: string;
    customFields?: {
      captainName?: string;
      boatName?: string;
      homePort?: string;
      [key: string]: any;
    };
    createdAt?: string;
  }

  export interface MemberstackDOM {
    getCurrentMember(): Promise<{ data: Member | null; errors?: any[] }>;
    loginWithPassword(params: { email: string; password: string }): Promise<{ data: Member | null; errors?: any[] }>;
    signupWithPassword(params: { email: string; password: string; customFields?: any; planId?: string }): Promise<{ data: Member | null; errors?: any[] }>;
    logout(): Promise<void>;
    openModal(type: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD' | 'PROFILE', params?: any): Promise<unknown>;
    hideModal(): void;
    updateMember(params: { customFields?: any }): Promise<{ data: Member | null; errors?: any[] }>;
    onReady: Promise<{ data: Member | null; loggedIn: boolean }>;
    onLogin(callback: () => void): void;
    onLogout(callback: () => void): void;
  }

  export function init(config: { publicKey: string }): Promise<MemberstackDOM>;
  
  // Re-export commonly used functions
  export const login: MemberstackDOM['loginWithPassword'];
  export const signup: MemberstackDOM['signupWithPassword'];
  export const logout: MemberstackDOM['logout'];
  export const updateMember: MemberstackDOM['updateMember'];
}
