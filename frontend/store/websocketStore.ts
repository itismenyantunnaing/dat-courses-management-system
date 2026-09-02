// store/websocketStore.ts
import { create } from 'zustand';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { mainStore } from './mainStore';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  courseId?: number;
  certificateId?: number;
  announcementId?: number;
  title?: string;
  isAnnouncement?: boolean;
}

interface NotificationState {
  // Connection state
  isConnected: boolean;
  stompClient: Client | null;

  // Notification data
  notifications: Notification[];
  unreadCount: number;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Check if in the browser
const isBrowser = typeof window !== 'undefined';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const resolveWebSocketUrl = (): string => {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) return explicitWsUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) return `${trimTrailingSlash(apiUrl)}/ws`;

  if (isBrowser) {
    return `${window.location.protocol}//${window.location.hostname}:8080/ws`;
  }

  return 'http://localhost:8080/ws';
};
// Module-level lock to prevent two overlapping connect() calls from
// creating two separate STOMP clients (e.g. React StrictMode double-invoke,
// or two components both calling connect() on mount).
let isConnecting = false;

export const webScoketStore = create<NotificationState>((set, get) => ({
  // Initial state
  isConnected: false,
  stompClient: null,
  notifications: [],
  unreadCount: 0,

  // CONNECT - This is the main connection function
  connect: async () => {
    // Prevent SSR issues - only run in browser
    if (!isBrowser) {
      return;
    }

    // Prevent duplicate connections
    if (isConnecting) {
      return;
    }

    const { stompClient, isConnected } = get();

    if (stompClient?.connected || isConnected) {
      return;
    }

    isConnecting = true;

    // Create SockJS instance (the transport layer)
    const wsUrl = resolveWebSocketUrl();

    // Tracks the active subscription so we can unsubscribe before
    // re-subscribing on every reconnect (STOMP auto-reconnects and will
    // call onConnect again - without this, subscriptions stack up and
    // every message gets handled multiple times).
    let currentSubscription: StompSubscription | null = null;

    // Create STOMP client
    const client = new Client({
      // Link SockJS to STOMP client
      webSocketFactory: () => new SockJS(wsUrl),

      // Optional: Add auth headers if needed
      connectHeaders: {
        // Authorization: `Bearer ${localStorage.getItem('token')}`,
      },


      // This runs when connection is SUCCESSFUL (including every reconnect)
      onConnect: () => {
        set({ isConnected: true });
        isConnecting = false;

        // Get current user ID from mainStore
        const mainStoreState = mainStore.getState();
        const profile = mainStoreState.profile;
        const employeeId = profile?.id;

        //  Subscribe to user-specific topic (where backend sends notifications)
        if (employeeId) {
          // Unsubscribe any stale subscription before creating a new one.
          // This is what actually prevents duplicate handling after a reconnect.
          currentSubscription?.unsubscribe();

          const userTopic = `/topic/notifications/${employeeId}`;

          currentSubscription = client.subscribe(userTopic, (message: IMessage) => {
            try {
              // Parse the notification data
              const data = JSON.parse(message.body);

              // Determine if this is an announcement notification
              const notificationType = data.notificationType?.toUpperCase() || data.type?.toUpperCase() || '';
              const isAnnouncement = notificationType === 'ANNOUNCEMENT' || 
                                     data.type === 'ANNOUNCEMENT' || 
                                     data.notificationType === 'ANNOUNCEMENT';

              // Create notification object for websocket store
              const notification: Notification = {
                id: data.notificationId?.toString() || data.id || Date.now().toString(),
                message: data.message || 'New notification',
                title: data.title || 'Notification',
                type: notificationType.toLowerCase() as 'info' | 'success' | 'warning' | 'error',
                timestamp: new Date(data.createdAt || data.timestamp || Date.now()),
                read: false,
                courseId: data.courseId || data.referenceId,
                certificateId: data.certificateId,
                announcementId: data.announcementId,
                isAnnouncement: isAnnouncement,
              };

              //  Update webScoketStore
              set((state) => {
                // Exact id dedupe - catches the same message delivered twice
                const idDuplicate = state.notifications.some(
                  (n) => n.id === notification.id
                );
                if (idDuplicate) {
                  console.warn('🔁 Skipped exact-id duplicate:', notification.id);
                  return state;
                }

                // Composite dedupe - catches two DIFFERENT messages (different
                // ids) describing the same course event within a short window.
                // This is what actually fixes the "course shows twice" case,
                // since the backend is very likely sending two distinct
                // notifications for the same course action.
                if (notification.courseId != null) {
                  const compositeDuplicate = state.notifications.some(
                    (n) =>
                      n.courseId === notification.courseId &&
                      n.type === notification.type &&
                      Math.abs(n.timestamp.getTime() - notification.timestamp.getTime()) < 3000
                  );
                  if (compositeDuplicate) {
                    console.warn(
                      '🔁 Skipped composite course duplicate:',
                      notification.courseId,
                      notification.id
                    );
                    return state;
                  }
                }

                return {
                  notifications: [notification, ...state.notifications],
                  unreadCount: state.unreadCount + 1,
                };
              });

              //  ALSO update mainStore's notification store
              try {
                const mainStoreState = mainStore.getState();
                const currentNotifications = mainStoreState.notifications || [];

                // Convert to match mainStore's notification format
                const mainStoreNotification = {
                  id: parseInt(notification.id) || Date.now(),
                  message: notification.message,
                  type: notificationType || 'COURSE',
                  read: false,
                  createdAt: notification.timestamp.toISOString(),
                  courseId: notification.courseId,
                  certificateId: notification.certificateId,
                  announcementId: notification.announcementId,
                  isAnnouncement: isAnnouncement,
                };

                // Check if notification already exists (avoid duplicates),
                // same composite check applied here too.
                const exists = currentNotifications.some((n: any) => {
                  if (n.id === mainStoreNotification.id) return true;
                  if (
                    mainStoreNotification.courseId != null &&
                    n.courseId === mainStoreNotification.courseId &&
                    n.type === mainStoreNotification.type
                  ) {
                    const nTime = new Date(n.createdAt).getTime();
                    const newTime = new Date(mainStoreNotification.createdAt).getTime();
                    return Math.abs(nTime - newTime) < 3000;
                  }
                  return false;
                });

                if (!exists) {
                  mainStore.setState({
                    notifications: [mainStoreNotification, ...currentNotifications],
                    unreadCount: (mainStoreState.unreadCount || 0) + 1,
                  });
                }
              } catch (error) {
                console.error('Error updating mainStore:', error);
              }

              // Optional: Show browser notification
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                new Notification(notification.title || 'New Notification', {
                  body: notification.message,
                  icon: '/notification-icon.png',
                });
              }
            } catch (error) {
              console.error('Error parsing notification:', error);
            }
          });
        } else {
          console.warn('⚠️ No employee ID found, cannot subscribe to user topic');
        }
      },

      // Handle disconnection
      onDisconnect: () => {
        set({ isConnected: false });
      },

      // Handle errors
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        set({ isConnected: false });
        isConnecting = false;
      },

      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        set({ isConnected: false });
        isConnecting = false;
      },

      // Auto-reconnect settings
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Save client reference
    set({ stompClient: client });

    client.activate();
  },

  // Disconnect function
  disconnect: () => {
    const { stompClient } = get();
    if (stompClient) {
      stompClient.deactivate();
      set({
        stompClient: null,
        isConnected: false,
      });
    }
    isConnecting = false;
  },

  // Mark a single notification as read
  markAsRead: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
      unreadCount: 0,
    }));
  },

  // Clear all notifications
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));