import { useEffect, useState } from 'react';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Registrar service worker
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registrado:', registration);
          
          // Verificar se já existe uma inscrição
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return false;

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        console.log('Permissão negada para notificações');
        return false;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;

      // Inscrever para push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Enviar inscrição para o servidor
      const storedUser = localStorage.getItem('entregasmoz-user');
      const userId = storedUser ? JSON.parse(storedUser).id : null;

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!)
          }
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        console.log('Inscrito para notificações push');
        return true;
      } else {
        console.error('Erro ao salvar inscrição');
        return false;
      }
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remover do servidor
        const storedUser = localStorage.getItem('entregasmoz-user');
        const userId = storedUser ? JSON.parse(storedUser).id : null;

        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        // Cancelar inscrição local
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log('Cancelada inscrição para notificações');
        return true;
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      return false;
    }

    return false;
  };

  const sendNotification = async (userId: string, title: string, body: string, type?: string, data?: any) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          type,
          data
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error };
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    sendNotification
  };
}

// Funções auxiliares
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}