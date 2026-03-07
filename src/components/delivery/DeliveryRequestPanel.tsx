'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

// Tipos
type PackageSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE'
type UrgencyLevel = 'NORMAL' | 'EXPRESS' | 'URGENT'
type PaymentMethod = 'CASH' | 'MPESA' | 'EMOLA'

interface DeliveryRequestPanelProps {
  user: {
    id: string
    name: string
    phone?: string
  }
  onClose?: () => void
}

// Configurações
const PACKAGE_SIZES: Record<PackageSize, { label: string; desc: string }> = {
  SMALL: { label: 'Pequeno', desc: 'Até 5kg (ex: documentos, celular)' },
  MEDIUM: { label: 'Médio', desc: '5-15kg (ex: caixa de sapatos)' },
  LARGE: { label: 'Grande', desc: '15-30kg (ex: eletrônicos)' },
  EXTRA_LARGE: { label: 'Extra Grande', desc: '30kg+ (ex: móveis)' }
}

const URGENCY_LEVELS: Record<UrgencyLevel, { label: string; desc: string; multiplier: string }> = {
  NORMAL: { label: 'Normal', desc: '1-2 horas', multiplier: '1x' },
  EXPRESS: { label: 'Expresso', desc: '30-60 min', multiplier: '1.5x' },
  URGENT: { label: 'Urgente', desc: '15-30 min', multiplier: '2x' }
}

const VEHICLE_ICONS: Record<string, string> = {
  MOTORCYCLE: '🏍️',
  BICYCLE: '🚲',
  CAR: '🚗',
  SCOOTER: '🛵'
}

const formatCurrency = (value: number) => `${value.toLocaleString('pt-MZ')} MT`

export default function DeliveryRequestPanel({ user, onClose }: DeliveryRequestPanelProps) {
  const [step, setStep] = useState<'pickup' | 'delivery' | 'package' | 'confirm'>('pickup')
  const [loading, setLoading] = useState(false)
  
  // Ponto de recolha
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupContactName, setPickupContactName] = useState('')
  const [pickupContactPhone, setPickupContactPhone] = useState('')
  
  // Ponto de entrega
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryContactName, setDeliveryContactName] = useState('')
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('')
  
  // Detalhes da encomenda
  const [packageDescription, setPackageDescription] = useState('')
  const [packageSize, setPackageSize] = useState<PackageSize>('SMALL')
  const [urgency, setUrgency] = useState<UrgencyLevel>('NORMAL')
  const [observations, setObservations] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  
  // Entregadores e solicitação
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState(null)
  const [createdRequest, setCreatedRequest] = useState(null)
  const [estimatedPrice, setEstimatedPrice] = useState(150)

  // Criar solicitação
  const submitRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/delivery-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          pickupAddress,
          pickupLatitude: -25.9653,
          pickupLongitude: 32.5892,
          pickupContactName,
          pickupContactPhone,
          deliveryAddress,
          deliveryLatitude: -25.9653,
          deliveryLongitude: 32.5892,
          deliveryContactName,
          deliveryContactPhone,
          packageDescription,
          packageSize,
          urgency,
          observations,
          paymentMethod
        })
      })

      const data = await response.json()
      
      if (data.request) {
        setCreatedRequest(data.request)
        setDeliveryPersons(data.availableDeliveryPersons || [])
        setStep('confirm')
      } else {
        alert(data.error || 'Erro ao criar solicitação')
      }
    } catch (error) {
      console.error('Error:', error)
      // Para demo, simular sucesso
      setStep('confirm')
    }
    setLoading(false)
  }

  // Próximo passo
  const nextStep = () => {
    if (step === 'pickup') setStep('delivery')
    else if (step === 'delivery') setStep('package')
    else if (step === 'package') submitRequest()
  }

  // Passo anterior
  const prevStep = () => {
    if (step === 'delivery') setStep('pickup')
    else if (step === 'package') setStep('delivery')
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl">
            📦
          </div>
          <div>
            <h2 className="text-xl font-bold">Enviar Encomenda</h2>
            <p className="text-sm text-gray-500">Transporte ponto a ponto</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>✕</Button>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['pickup', 'delivery', 'package', 'confirm'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-blue-500 text-white' : 
              ['pickup', 'delivery', 'package', 'confirm'].indexOf(step) > i 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-1 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Ponto de Recolha */}
      {step === 'pickup' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>📍 Ponto de Recolha</CardTitle>
            <CardDescription>Onde o entregador vai buscar a encomenda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endereço *</Label>
              <Input 
                placeholder="Ex: Av. Julius Nyerere, 123, Maputo" 
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
              />
            </div>
            <Separator />
            <p className="font-medium">👤 Dados de quem disponibiliza</p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input 
                  placeholder="Nome da pessoa" 
                  value={pickupContactName}
                  onChange={e => setPickupContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input 
                  placeholder="+258 84 XXX XXXX" 
                  value={pickupContactPhone}
                  onChange={e => setPickupContactPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500"
                onClick={nextStep}
                disabled={!pickupAddress || !pickupContactName || !pickupContactPhone}
              >
                Próximo →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Ponto de Entrega */}
      {step === 'delivery' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>🏁 Ponto de Entrega</CardTitle>
            <CardDescription>Onde a encomenda será entregue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endereço *</Label>
              <Input 
                placeholder="Ex: Av. Samora Machel, 456, Matola" 
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
              />
            </div>
            <Separator />
            <p className="font-medium">👤 Dados de quem vai receber</p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input 
                  placeholder="Nome da pessoa" 
                  value={deliveryContactName}
                  onChange={e => setDeliveryContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input 
                  placeholder="+258 84 XXX XXXX" 
                  value={deliveryContactPhone}
                  onChange={e => setDeliveryContactPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>← Voltar</Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500"
                onClick={nextStep}
                disabled={!deliveryAddress || !deliveryContactName || !deliveryContactPhone}
              >
                Próximo →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Detalhes da Encomenda */}
      {step === 'package' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>📦 Detalhes da Encomenda</CardTitle>
            <CardDescription>Informações sobre o que será transportado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição da Encomenda *</Label>
              <Textarea 
                placeholder="Descreva o que será transportado..." 
                value={packageDescription}
                onChange={e => setPackageDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Tamanho do Pacote *</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PACKAGE_SIZES).map(([key, val]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      packageSize === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setPackageSize(key as PackageSize)}
                  >
                    <p className="font-medium">{val.label}</p>
                    <p className="text-xs text-gray-500">{val.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Urgência da Entrega</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(URGENCY_LEVELS).map(([key, val]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      urgency === key 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setUrgency(key as UrgencyLevel)}
                  >
                    <p className="font-medium">{val.label}</p>
                    <p className="text-xs text-gray-500">{val.desc}</p>
                    <Badge className="mt-1" variant={key === 'URGENT' ? 'destructive' : 'secondary'}>
                      {val.multiplier}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                placeholder="Alguma informação adicional..." 
                value={observations}
                onChange={e => setObservations(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">💵 Dinheiro (Cash)</SelectItem>
                  <SelectItem value="MPESA">📱 M-Pesa</SelectItem>
                  <SelectItem value="EMOLA">📱 e-Mola</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Preço estimado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(estimatedPrice)}</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>← Voltar</Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500"
                onClick={nextStep}
                disabled={!packageDescription || loading}
              >
                {loading ? 'Buscando entregadores...' : 'Buscar Entregadores →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Confirmação */}
      {step === 'confirm' && (
        <Card className="shadow-lg border-green-200 bg-green-50">
          <CardContent className="py-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white text-4xl">
              ✓
            </div>
            <h3 className="text-2xl font-bold mt-4 text-green-800">Solicitação Enviada!</h3>
            <p className="text-gray-600 mt-2">Seu pedido foi enviado. Aguarde a confirmação do entregador.</p>
            
            <div className="mt-6 p-4 bg-white rounded-xl max-w-sm mx-auto">
              <p className="font-medium">Resumo</p>
              <p className="text-sm text-gray-500 mt-2">
                De: {pickupAddress}<br />
                Para: {deliveryAddress}<br />
                Preço: {formatCurrency(estimatedPrice)}
              </p>
            </div>

            <Button 
              className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500"
              onClick={onClose}
            >
              Concluir
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
