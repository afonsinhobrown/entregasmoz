'use client';

import { useEffect, useState } from 'react';
import { NotificationManager } from '@/components/notifications/notification-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Users, Store, Truck } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<{ userType: string } | null>(null);

  useEffect(() => {
    // Attempt to parse user from localStorage on mount
    try {
      const storedUserString = localStorage.getItem('entregasmoz-user');
      if (storedUserString) {
        setUser(JSON.parse(storedUserString));
      } else {
        // Fallback for demo
        setUser({ userType: 'ADMIN' });
      }
    } catch {
      setUser({ userType: 'ADMIN' });
    }
  }, []);

  if (!user) return null;

  const userType = user.userType;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {userType === 'DELIVERY_PERSON' ? 'Entregador' :
           userType === 'PROVIDER' ? 'Prestador' : 'Administrador'}
        </Badge>
      </div>

      {/* Sistema de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Receba alertas mesmo com o app fechado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationManager />
        </CardContent>
      </Card>

      {/* Cards de funcionalidades baseadas no tipo de usuário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userType === 'DELIVERY_PERSON' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Meus Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize pedidos atribuídos e histórico de entregas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Novos pedidos, atualizações de status, confirmações
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {userType === 'PROVIDER' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Minha Loja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerencie produtos, pedidos e configurações da loja
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Novos pedidos, entregadores a caminho, confirmações
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {userType === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Administração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerencie usuários, pedidos, pagamentos e configurações
                </p>
              </CardContent>
            </Card>
        )}
      </div>

      {/* Instruções de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar as notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">1. Clique em "Inscrever-se" para ativar notificações</p>
          <p className="text-sm">2. Permita notificações quando solicitado pelo navegador</p>
          <p className="text-sm">3. Receba alertas de novos pedidos e atualizações</p>
          <p className="text-sm">4. Funciona mesmo com o navegador fechado!</p>
        </CardContent>
      </Card>
    </div>
  );
}