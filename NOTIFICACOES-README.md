# Sistema de Notificações Push - EntregasMoz

Este sistema permite enviar notificações push para entregadores e prestadores de serviço, **mesmo quando o app não está aberto**.

## 🚀 Como Funciona

1. **Service Worker**: Registra o navegador para receber notificações
2. **Inscrição**: Usuário se inscreve para receber notificações
3. **Servidor**: Envia notificações via API do navegador
4. **Push Service**: Google/Firefox/Apple entregam a notificação

## 📱 Implementação Simples

### 1. Adicionar o Componente de Gerenciamento

```tsx
import { NotificationManager } from '@/components/notifications/notification-manager';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <NotificationManager />
    </div>
  );
}
```

### 2. Usar o Hook em Qualquer Componente

```tsx
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function MyComponent() {
  const { isSubscribed, subscribe, sendNotification } = usePushNotifications();

  const handleTest = () => {
    sendNotification('user-id', 'Olá!', 'Teste de notificação');
  };

  return (
    <div>
      <button onClick={subscribe}>
        {isSubscribed ? 'Inscrito' : 'Inscrever-se'}
      </button>
      <button onClick={handleTest}>Testar</button>
    </div>
  );
}
```

### 3. Integrar com Sistema de Pedidos

```typescript
import { handleNewOrder, handleOrderAssigned } from '@/lib/order-notifications';

// Quando criar pedido
await handleNewOrder({ order, provider, client });

// Quando atribuir a entregador
await handleOrderAssigned({ order, deliveryPerson, provider });
```

## 🔔 Tipos de Notificação

### Para Entregadores:
- **Novo pedido disponível**
- **Pedido atribuído**
- **Pedido pronto para retirada**
- **Cliente confirmou entrega**

### Para Prestadores:
- **Novo pedido recebido**
- **Entregador a caminho**
- **Pedido entregue**

## 🔧 Configuração Técnica

### Variáveis de Ambiente (.env.local)
```env
# Chaves VAPID para notificações push
VAPID_PUBLIC_KEY=sua-chave-publica-aqui
VAPID_PRIVATE_KEY=sua-chave-privada-aqui
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica-aqui
```

### Arquivos Criados:
- `public/sw.js` - Service Worker
- `src/hooks/use-push-notifications.ts` - Hook React
- `src/lib/notifications.ts` - Funções utilitárias
- `src/lib/order-notifications.ts` - Integração com pedidos
- `src/components/notifications/notification-manager.tsx` - Componente UI
- `src/app/api/notifications/` - APIs backend

### Banco de Dados:
- `PushSubscription` - Inscrições dos usuários
- `Notification` - Histórico de notificações

## 🎯 Cenários de Uso

### Novo Pedido
```typescript
// Notifica prestador
await notifyProvider(providerId, {
  title: 'Novo Pedido!',
  body: 'Você recebeu um pedido de João Silva',
  type: 'ORDER_NEW'
});

// Notifica entregadores disponíveis
await notifyAvailableDeliveryPersons({
  title: 'Pedido Disponível',
  body: 'Novo pedido para entrega na Av. Eduardo Mondlane',
  type: 'DELIVERY_AVAILABLE'
});
```

### Pedido Atribuído
```typescript
await notifyDeliveryPerson(deliveryPersonId, {
  title: 'Pedido Atribuído',
  body: 'Entregue em: Rua dos Desportistas, 123',
  type: 'ORDER_ASSIGNED'
});
```

## 🔒 Segurança

- **VAPID Keys**: Autenticam o servidor com os push services
- **HTTPS**: Obrigatório para notificações push
- **Permissões**: Usuário deve permitir notificações
- **Dados**: Apenas dados essenciais são enviados

## 📊 Monitoramento

Verifique no banco de dados:
```sql
-- Ver inscrições ativas
SELECT COUNT(*) FROM "PushSubscription" WHERE "isActive" = true;

-- Ver notificações enviadas
SELECT type, COUNT(*) FROM "Notification" GROUP BY type;
```

## 🚨 Troubleshooting

### Notificações não chegam:
1. Verificar se usuário permitiu notificações
2. Verificar se Service Worker está registrado
3. Verificar chaves VAPID
4. Verificar logs do servidor

### Erro de permissão:
```javascript
// Verificar status
console.log(Notification.permission); // 'granted', 'denied', 'default'
```

## 🎉 Pronto!

Agora seus entregadores e prestadores receberão notificações em tempo real, mesmo com o app fechado! 📱🔔