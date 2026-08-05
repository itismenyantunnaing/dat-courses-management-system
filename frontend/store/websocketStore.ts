// store/websocketStore.ts
import { create } from 'zustand';
import { Client, IMessage } from '@stomp/stompjs';
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
  title?: string;
}

interface NotificationState {
  // Connection state
  isConnected: boolean;
  stompClient: Client | null;

  // Notification data
  notifications: Notification[];
  unreadCount: number;

  // Actions
  connect: () => void;
  disconnect: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Check if in the browser
const isBrowser = typeof window !== 'undefined';

export const webScoketStore = create<NotificationState>((set, get) => ({
  // Initial state
  isConnected: false,
  stompClient: null,
  notifications: [],
  unreadCount: 0,

  // CONNECT - This is the main connection function
  connect: () => {
    // Prevent SSR issues - only run in browser
    if (!isBrowser) {
      console.log('Skipping connection - not in browser');
      return;
    }

    // Prevent duplicate connections
    const { stompClient, isConnected } = get();

    if (stompClient?.connected || isConnected) {
      console.log('Already connected');
      return;
    }

    console.log('🔌 Connecting to notification service...');

    // Create SockJS instance (the transport layer)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
    const socket = new SockJS(wsUrl);
    console.log('✓ SockJS instance created');

    // Create STOMP client
    const client = new Client({
      // Link SockJS to STOMP client
      webSocketFactory: () => socket,

      // Optional: Add auth headers if needed
      connectHeaders: {
        // Authorization: `Bearer ${localStorage.getItem('token')}`,
      },

      // Debug logging
      debug: (str) => {
        console.log('📡 STOMP Debug:', str);
      },

      // This runs when connection is SUCCESSFUL
      onConnect: () => {
        console.log('✅ STOMP connection established!');
        set({ isConnected: true });

        // Get current user ID from mainStore
        const mainStoreState = mainStore.getState();
        const profile = mainStoreState.profile;
        const employeeId = profile?.id;

        console.log('👤 Current user ID:', employeeId);

        // ✅ Subscribe to user-specific topic (where backend sends notifications)
        if (employeeId) {
          const userTopic = `/topic/notifications/${employeeId}`;

          client.subscribe(userTopic, (message: IMessage) => {


            try {
              // Parse the notification data
              const data = JSON.parse(message.body);
              alert(`📢 ${data.message}`);
              // Create notification object for websocket store
              const notification: Notification = {
                id: data.notificationId?.toString() || data.id || Date.now().toString(),
                message: data.message || 'New notification',
                title: data.title || 'Notification',
                type: data.notificationType?.toLowerCase() || 'info',
                timestamp: new Date(data.createdAt || data.timestamp || Date.now()),
                read: false,
                courseId: data.courseId || data.referenceId,
                certificateId: data.certificateId,
              };

              // ✅ Update webScoketStore
              set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
              }));

              // ✅ ALSO update mainStore's notification store
              try {
                const mainStoreState = mainStore.getState();
                const currentNotifications = mainStoreState.notifications || [];

                // Convert to match mainStore's notification format
                const mainStoreNotification = {
                  id: parseInt(notification.id) || Date.now(),
                  message: notification.message,
                  type: notification.type?.toUpperCase() || 'COURSE',
                  read: false,
                  createdAt: notification.timestamp.toISOString(),
                  courseId: notification.courseId,
                  certificateId: notification.certificateId,
                };

                // Check if notification already exists (avoid duplicates)
                const exists = currentNotifications.some((n: any) => n.id === mainStoreNotification.id);
                if (!exists) {
                  // Update mainStore using the notificationStore's set method
                  // Since mainStore has notificationStore methods, we can call them
                  // But we need to update the state directly
                  mainStore.setState({
                    notifications: [mainStoreNotification, ...currentNotifications],
                    unreadCount: (mainStoreState.unreadCount || 0) + 1,
                  });
                  console.log('✅ Notification added to mainStore');
                }
              } catch (error) {
                console.error('Error updating mainStore:', error);
              }

              // Optional: Show browser notification
              if (typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted') {
                new Notification(notification.title || 'New Notification', {
                  body: notification.message,
                  icon: '/notification-icon.png',
                });
              }

            } catch (error) {
              console.error('Error parsing notification:', error);
            }
          });

          console.log(`✅ Subscribed to ${userTopic}`);
        } else {
          console.warn('⚠️ No employee ID found, cannot subscribe to user topic');
        }

        // ✅ Also subscribe to generic topic as fallback (for testing)
        console.log('📡 Also subscribing to generic topic: /topic/notifications');
        client.subscribe('/topic/notifications', (message: IMessage) => {
          console.log('🔔 Generic topic message received:', message.body);
          // Handle generic messages here too
        });

        console.log('✅ All subscriptions complete!');
      },

      // Handle disconnection
      onDisconnect: () => {
        console.log('❌ STOMP connection disconnected');
        set({ isConnected: false });
      },

      // Handle errors
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        set({ isConnected: false });
      },

      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        set({ isConnected: false });
      },

      // Auto-reconnect settings
      reconnectDelay: 5000,      // Try to reconnect every 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Save client reference
    set({ stompClient: client });

    // ACTIVATE THE CONNECTION - THIS IS WHERE IT ACTUALLY CONNECTS
    console.log('🚀 Activating connection...');
    client.activate();
  },

  // Disconnect function
  disconnect: () => {
    const { stompClient } = get();
    if (stompClient) {
      console.log('🔌 Disconnecting...');
      stompClient.deactivate();
      set({
        stompClient: null,
        isConnected: false,
      });
    }
  },

  // Mark a single notification as read
  markAsRead: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length,
      };
    });
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(notif => ({ ...notif, read: true })),
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