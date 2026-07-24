const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Type definitions based on backend SystemConfig
export interface SystemConfig {
  id: number;
  fileUploadSizeMb: number;
  sessionTimeoutMinutes: number;
  jwtExpiryHours: number;
  maxLoginAttempts: number;
  activeSmtpProvider?: "GMAIL" | "OUTLOOK";
  gmailHost?: string;
  gmailPort?: number;
  gmailUsername?: string;
  gmailPassword?: string;
  outlookHost?: string;
  outlookPort?: number;
  outlookUsername?: string;
  outlookPassword?: string;
}

export interface SystemConfig_StoreType {
  systemConfig: SystemConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetch_SystemConfig: () => Promise<void>;
  update_SystemConfig: (config: Partial<SystemConfig>) => Promise<SystemConfig>;
}

export const systemConfigStore = (set: any, get: any) => ({
  systemConfig: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetch_SystemConfig: async (force = false) => {
    // Skip fetch if already have systemConfig already exists and not forced
    if (!force && get().systemConfig && !get().isLoading) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const headers = get().getAuthHeaders ? get().getAuthHeaders() : {};
      const response = await fetch(`${apiUrl}/api/system-config`, {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) throw new Error("Failed to fetch system config");
      
      const data = await response.json();
      set({ systemConfig: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  update_SystemConfig: async (config: Partial<SystemConfig>) => {
    set({ isSaving: true, error: null });
    try {
      const headers = get().getAuthHeaders ? get().getAuthHeaders() : {};
      const response = await fetch(`${apiUrl}/api/system-config`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) throw new Error("Failed to update system config");
      
      const data = await response.json();
      set({ systemConfig: data, isSaving: false });
      return data;
    } catch (error) {
      set({ error: (error as Error).message, isSaving: false });
      throw error;
    }
  }
});