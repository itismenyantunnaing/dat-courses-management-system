// store/zustandStores/notification_store.ts
import { NotificationSettings } from "@/types/notification";
import { NotificationStoreType } from "../types";

type StoreSet = (
  fn: (state: NotificationStoreType) => Partial<NotificationStoreType>
) => void;
type StoreGet = () => NotificationStoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const notificationStore = (set: StoreSet, get: StoreGet): NotificationStoreType => ({
  notifications: [],
  unreadCount: 0,
  notificationSettings: null,
  isLoading: false,
  isUpdating: false,

  // ✅ NEW: Add WebSocket notification to mainStore
  addWebSocketNotification: (wsNotification: any) => {
    const { notifications, unreadCount } = get();
    
    // Convert to mainStore format
    const dbNotification = {
      id: wsNotification.notificationId || wsNotification.id || Date.now(),
      message: wsNotification.message || 'New notification',
      type: wsNotification.notificationType || wsNotification.type?.toUpperCase() || 'COURSE',
      read: false,
      createdAt: wsNotification.createdAt || new Date().toISOString(),
      courseId: wsNotification.courseId || wsNotification.referenceId,
      certificateId: wsNotification.certificateId,
    };
    
    // Check if already exists (avoid duplicates)
    const exists = notifications.some((n: any) => n.id === dbNotification.id);
    if (!exists) {
      set({
        notifications: [dbNotification, ...notifications],
        unreadCount: unreadCount + 1,
      });
      console.log('✅ Notification synced to mainStore');
      return true;
    }
    return false;
  },

  fetch_Notifications: async (employeeId: string, unreadOnly: boolean = false) => {
    if (!employeeId) {
      set(() => ({ notifications: [] }));
      return;
    }

    set(() => ({ isLoading: true }));

    try {
      const url = new URL(`${apiUrl}/api/notifications`);
      url.searchParams.append('employeeId', employeeId);
      if (unreadOnly) {
        url.searchParams.append('unreadOnly', 'true');
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notifications = await response.json();
      set(() => ({ notifications, isLoading: false }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set(() => ({ notifications: [], isLoading: false }));
    }
  },

  // Fetch unread count - uses RequestParam
  fetch_UnreadCount: async (employeeId: string) => {
    if (!employeeId) {
      set(() => ({ unreadCount: 0 }));
      return;
    }

    try {
      const url = new URL(`${apiUrl}/api/notifications/unread-count`);
      url.searchParams.append('employeeId', employeeId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      set(() => ({ unreadCount: result.count || 0 }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
      set(() => ({ unreadCount: 0 }));
    }
  },

  // Mark a single notification as read - uses RequestParam
  mark_NotificationRead: async (id: number, employeeId: string) => {
    const previousData = get().notifications;
    const previousUnreadCount = get().unreadCount;

    const notificationIndex = previousData.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return `Notification with ID "${id}" not found.`;
    }

    const updatedNotifications = previousData.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );

    const wasUnread = !previousData[notificationIndex].read;
    const newUnreadCount = wasUnread ? Math.max(0, previousUnreadCount - 1) : previousUnreadCount;

    set(() => ({
      notifications: updatedNotifications,
      unreadCount: newUnreadCount
    }));

    try {
      const url = new URL(`${apiUrl}/api/notifications/${id}/read`);
      url.searchParams.append('employeeId', employeeId);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await get().fetch_UnreadCount(employeeId);
      return `Notification marked as read successfully`;

    } catch (error) {
      console.error('Error marking notification as read:', error);
      set(() => ({
        notifications: previousData,
        unreadCount: previousUnreadCount
      }));
      return `Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Mark all notifications as read - uses RequestParam
  mark_AllNotificationsRead: async (employeeId: string) => {
    const previousData = get().notifications;
    const previousUnreadCount = get().unreadCount;

    const updatedNotifications = previousData.map((n) => ({
      ...n,
      read: true
    }));

    set(() => ({
      notifications: updatedNotifications,
      unreadCount: 0
    }));

    try {
      const url = new URL(`${apiUrl}/api/notifications/read-all`);
      url.searchParams.append('employeeId', employeeId);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await get().fetch_UnreadCount(employeeId);
      return `All notifications marked as read successfully`;

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set(() => ({
        notifications: previousData,
        unreadCount: previousUnreadCount
      }));
      return `Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Fetch notification notificationSettings for an employee
  fetch_NotificationSettings: async (employeeId: string) => {
    if (!employeeId) {
      set(() => ({ notificationSettings: null }));
      return;
    }

    set(() => ({ isLoading: true }));

    try {
      const response = await fetch(`${apiUrl}/api/notificationSettings/settings/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notificationSettings = await response.json();
      set(() => ({ notificationSettings, isLoading: false }));
    } catch (error) {
      console.error('Error fetching notification notificationSettings:', error);
      set(() => ({ notificationSettings: null, isLoading: false }));
    }
  },

  // Update notification notificationSettings
  update_NotificationSettings: async (notificationSettings: NotificationSettings) => {
    const previousSettings = get().notificationSettings;

    // Optimistically update the notificationSettings in the UI
    set(() => ({
      notificationSettings: notificationSettings,
      isUpdating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/notificationSettings/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const updatedSettings = await response.json();

      set(() => ({
        notificationSettings: updatedSettings,
        isUpdating: false
      }));

      return `Notification notificationSettings updated successfully`;

    } catch (error) {
      console.error('Error updating notification notificationSettings:', error);

      // Rollback to original state if the API fails
      set(() => ({
        notificationSettings: previousSettings,
        isUpdating: false
      }));

      return `Failed to update notification notificationSettings: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});