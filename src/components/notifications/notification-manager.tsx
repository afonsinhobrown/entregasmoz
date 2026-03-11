'use client';

import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Send } from 'lucide-react';
import { useState } from 'react';

export function NotificationManager() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, sendNotification } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    await subscribe();
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    await unsubscribe();
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    const storedUser = localStorage.getItem('entregasmoz-user');
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    if (!userId) {
      alert('Usuário não identificado. Por favor, faça login novamente.');
      return;
    }

    setIsLoading(true);
    await sendNotification(
      userId,
      'Teste de Notificação',
      'Esta é uma notificação de teste do sistema EntregasMoz!',
      'TEST',
      { url: '/orders' }
    );
    setIsLoading(false);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Push</CardTitle>
          <CardDescription>Seu navegador não suporta notificações push</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações mesmo com o app fechado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
            {permission === 'granted' ? 'Permitido' : permission === 'denied' ? 'Negado' : 'Pendente'}
          </Badge>
          {isSubscribed && <Badge variant="outline">Inscrito</Badge>}
        </div>

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? 'Inscrevendo...' : 'Inscrever-se'}
            </Button>
          ) : (
            <Button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BellOff className="h-4 w-4" />
              {isLoading ? 'Cancelando...' : 'Cancelar inscrição'}
            </Button>
          )}

          <Button
            onClick={handleTestNotification}
            disabled={isLoading || !isSubscribed}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Testar
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>• Receba alertas de novos pedidos</p>
          <p>• Notificações de entregas atribuídas</p>
          <p>• Atualizações de status de pedidos</p>
          <p>• Funciona mesmo com o navegador fechado</p>
        </div>
      </CardContent>
    </Card>
  );
}