'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

// Tipos
type UserType = 'CLIENT' | 'DELIVERY_PERSON' | 'PROVIDER' | 'ADMIN'
type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'SCOOTER'

interface Provider {
  id: string
  storeName: string
  storeDescription?: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  storeImage?: string
  isOpen: boolean
  products: { id: string; name: string; price: number; providerId: string }[]
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  providerId: string
  provider?: { storeName: string }
  isAvailable: boolean
}

interface DeliveryPerson {
  id: string
  vehicleType: VehicleType
  rating: number
  totalDeliveries: number
  isAvailable: boolean
  currentLatitude?: number
  currentLongitude?: number
  plateNumber?: string
  vehicleColor?: string
  vehicleBrand?: string
  user?: { name: string; phone?: string; profileImage?: string }
}

interface LandingPageProps {
  user: { id: string; name: string; userType: UserType; phone?: string; profileImage?: string; client?: { latitude?: number; longitude?: number; address?: string } } | null
  providers: Provider[]
  products: Product[]
  deliveryPersons: DeliveryPerson[]
  onLoginClick: () => void
  onAddToCart: (product: Product) => void
  onDeliveryRequest: () => void
}

const vehicleIcons: Record<VehicleType, string> = {
  MOTORCYCLE: '🏍️',
  BICYCLE: '🚲',
  CAR: '🚗',
  SCOOTER: '🛵',
}

const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'Restaurante', name: 'Restaurantes', icon: '🍴' },
  { id: 'Pizzaria', name: 'Pizzarias', icon: '🍕' },
  { id: 'Mercado', name: 'Mercados', icon: '🛒' },
  { id: 'Farmácia', name: 'Farmácias', icon: '💊' },
  { id: 'Lanches', name: 'Lanches', icon: '🍔' },
]

export default function LandingPage({
  user,
  providers,
  products,
  deliveryPersons,
  onLoginClick,
  onAddToCart,
  onDeliveryRequest
}: LandingPageProps) {
  const [mainTab, setMainTab] = useState<'services' | 'delivery'>('services')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientLocation, setClientLocation] = useState<[number, number] | null>(null)

  const mapCenter: [number, number] = clientLocation || [
    user?.client?.latitude || -25.9653,
    user?.client?.longitude || 32.5892,
  ]

  useEffect(() => {
    if (!navigator.geolocation) return
    const watcher = navigator.geolocation.watchPosition(
      (pos) => setClientLocation([pos.coords.latitude, pos.coords.longitude]),
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  const distanceKm = (from: [number, number], to: [number, number]) => {
    const [lat1, lon1] = from
    const [lat2, lon2] = to
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const nearestProviders = getFilteredProviders()
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      provider: p,
      distance: distanceKm(mapCenter, [p.latitude as number, p.longitude as number]),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)

  const nearestDeliveryPersons = getSortedDeliveryPersons()
    .filter((dp) => dp.currentLatitude && dp.currentLongitude)
    .map((dp) => ({
      dp,
      distance: distanceKm(mapCenter, [dp.currentLatitude as number, dp.currentLongitude as number]),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)

  // Filtrar produtos
  const getFilteredProducts = () => {
    let filtered = products
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const provider = providers.find(prov => prov.id === p.providerId)
        return provider?.category === selectedCategory
      })
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }

  // Filtrar prestadores
  const getFilteredProviders = () => {
    let filtered = providers
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.storeDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }

  // Calcular distância simulada
  const calculateDistance = (lat?: number, lng?: number): number => {
    if (!lat || !lng) return Math.random() * 5 + 0.5
    return Math.random() * 3 + 0.5
  }

  // Tempo estimado
  const calculateTime = (distance: number, vehicle: VehicleType): number => {
    const speeds = { MOTORCYCLE: 25, BICYCLE: 15, CAR: 20, SCOOTER: 22 }
    return Math.round((distance / speeds[vehicle]) * 60)
  }

  // Entregadores ordenados por distância
  const getSortedDeliveryPersons = () => {
    return [...deliveryPersons]
      .map(dp => ({ ...dp, distance: calculateDistance(dp.currentLatitude, dp.currentLongitude) }))
      .sort((a, b) => a.distance - b.distance)
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('pt-MZ')} MT`

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Banner */}
        <Card className="mb-6 overflow-hidden shadow-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">🛵 EntregasMoz</h2>
                <p className="text-white/90">Entregas rápidas em toda Moçambique!</p>
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-white/20 text-white">🍔 Restaurantes</Badge>
                  <Badge className="bg-white/20 text-white">🏪 Mercados</Badge>
                  <Badge className="bg-white/20 text-white">📦 Encomendas</Badge>
                </div>
              </div>
              <div className="hidden md:block text-6xl">🛵</div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            className={`flex-1 py-3 text-lg font-medium ${mainTab === 'services' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setMainTab('services')}
          >
            🏪 Serviços
          </Button>
          <Button
            className={`flex-1 py-3 text-lg font-medium ${mainTab === 'delivery' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setMainTab('delivery')}
          >
            🏍️ Entregadores Perto
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Input
            className="bg-white shadow-md pl-12 py-3 text-lg border-0"
            placeholder="🔍 Buscar serviços, restaurantes, produtos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-6 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                className={`rounded-full whitespace-nowrap px-4 py-2 ${selectedCategory === cat.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* SERVICES TAB */}
        {mainTab === 'services' && (
          <>
            {/* Services Feed */}
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🏪 Serviços Disponíveis
              <Badge variant="secondary" className="text-sm">{getFilteredProviders().length}</Badge>
            </h2>

            <div className="space-y-4 mb-8">
              {getFilteredProviders().map(provider => (
                <Card key={provider.id} className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                  <div className="flex">
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 flex items-center justify-center text-5xl shrink-0">
                      {provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : provider.category === 'Farmácia' ? '💊' : '🛒'}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{provider.storeName}</h3>
                          <p className="text-gray-500 text-sm">{provider.category}</p>
                        </div>
                        <Badge variant={provider.isOpen ? 'default' : 'secondary'} className={`${provider.isOpen ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                          {provider.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{provider.storeDescription}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>📍 {provider.address || 'Maputo'}</span>
                        <span>📦 {provider.products.length} produtos</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Products Feed */}
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🍽️ Produtos em Destaque
              <Badge variant="secondary" className="text-sm">{getFilteredProducts().length}</Badge>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredProducts().map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-3xl shrink-0">
                        {product.name.toLowerCase().includes('pizza') ? '🍕' :
                          product.name.toLowerCase().includes('coca') || product.name.toLowerCase().includes('bebida') ? '🥤' :
                            product.name.toLowerCase().includes('hamb') ? '🍔' : '🍽️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className="bg-green-500 hover:bg-green-600">
                            {formatCurrency(product.price)}
                          </Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            🏪 {product.provider?.storeName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-gradient-to-r from-orange-500 to-red-500"
                      onClick={() => user ? onAddToCart(product) : onLoginClick()}
                    >
                      {user ? '🛒 Adicionar ao Carrinho' : '🔐 Entrar para Pedir'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* DELIVERY TAB */}
        {mainTab === 'delivery' && (
          <>
            {/* Real-time map */}
            <Card className="mb-6 overflow-hidden shadow-xl">
              <div className="h-80 relative">
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-[500]">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    🗺️ Mapa de Maputo
                    <Badge className="bg-green-500 text-xs">Ao Vivo</Badge>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {clientLocation ? 'GPS do navegador ativo' : 'Sem GPS do navegador - usando posição padrão'}
                  </p>
                </div>

                <MapContainer
                  key={`${mapCenter[0].toFixed(4)}-${mapCenter[1].toFixed(4)}`}
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />

                  <CircleMarker center={mapCenter} radius={10} pathOptions={{ color: '#2563EB', fillColor: '#3B82F6', fillOpacity: 0.85 }}>
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>👤 Você</Tooltip>
                    <Popup>
                      <div className="min-w-48">
                        <div className="flex items-center gap-2 mb-2">
                          {user?.profileImage && (
                            <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="font-bold">👤 {user?.name || 'Visitante'}</p>
                            {user?.phone && <p className="text-xs text-gray-500">📞 {user.phone}</p>}
                          </div>
                        </div>
                        {user?.client?.address && <p className="text-xs">📍 {user.client.address}</p>}
                        <p className="text-xs text-blue-700 mt-1">
                          {clientLocation ? 'Localização real do navegador (cliente)' : 'Localização estimada'}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>

                  {nearestProviders.map(({ provider, distance }) => (
                    <Polyline
                      key={`line-provider-${provider.id}`}
                      positions={[
                        mapCenter,
                        [provider.latitude as number, provider.longitude as number],
                      ]}
                      pathOptions={{ color: '#F97316', weight: 2, opacity: 0.6, dashArray: '6, 8' }}
                    >
                      <Tooltip sticky>
                        <span className="text-xs">Até {provider.storeName}: {distance.toFixed(1)} km</span>
                      </Tooltip>
                    </Polyline>
                  ))}

                  {nearestDeliveryPersons.map(({ dp, distance }) => (
                    <Polyline
                      key={`line-delivery-${dp.id}`}
                      positions={[
                        mapCenter,
                        [dp.currentLatitude as number, dp.currentLongitude as number],
                      ]}
                      pathOptions={{ color: '#10B981', weight: 2, opacity: 0.6, dashArray: '3, 7' }}
                    >
                      <Tooltip sticky>
                        <span className="text-xs">Até {dp.user?.name || 'Entregador'}: {distance.toFixed(1)} km</span>
                      </Tooltip>
                    </Polyline>
                  ))}

                  {getFilteredProviders().filter(p => p.latitude && p.longitude).map((provider) => (
                    <CircleMarker
                      key={`provider-${provider.id}`}
                      center={[provider.latitude as number, provider.longitude as number]}
                      radius={9}
                      pathOptions={{ color: provider.isOpen ? '#15803D' : '#B91C1C', fillColor: provider.isOpen ? '#22C55E' : '#EF4444', fillOpacity: 0.85 }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>🏪 {provider.storeName}</Tooltip>
                      <Popup>
                        <div className="min-w-52">
                          <div className="flex items-center gap-2 mb-2">
                            {provider.storeImage && (
                              <img src={provider.storeImage} alt={provider.storeName} className="w-10 h-10 rounded-lg object-cover" />
                            )}
                            <div>
                              <p className="font-bold">🏪 {provider.storeName}</p>
                              <p className="text-xs text-gray-500">{provider.category || 'Prestador'}</p>
                            </div>
                          </div>
                          {provider.address && <p className="text-xs">📍 {provider.address}</p>}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                  {getSortedDeliveryPersons().filter(dp => dp.currentLatitude && dp.currentLongitude).map((dp) => (
                    <CircleMarker
                      key={`delivery-${dp.id}`}
                      center={[dp.currentLatitude as number, dp.currentLongitude as number]}
                      radius={8}
                      pathOptions={{ color: '#0F766E', fillColor: dp.isAvailable ? '#10B981' : '#6B7280', fillOpacity: 0.9 }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                        {vehicleIcons[dp.vehicleType]} {dp.user?.name || 'Entregador'}
                      </Tooltip>
                      <Popup>
                        <div className="min-w-56">
                          <div className="flex items-center gap-2 mb-2">
                            {dp.user?.profileImage && (
                              <img src={dp.user.profileImage} alt={dp.user.name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <div>
                              <p className="font-bold">🏍️ {dp.user?.name || 'Entregador'}</p>
                              <p className="text-xs text-gray-500">⭐ {dp.rating.toFixed(1)} • {dp.totalDeliveries} entregas</p>
                            </div>
                          </div>
                          {dp.user?.phone && <p className="text-xs">📞 {dp.user.phone}</p>}
                          {dp.plateNumber && <p className="text-xs">🪪 {dp.plateNumber}</p>}
                          {(dp.vehicleBrand || dp.vehicleColor) && (
                            <p className="text-xs">🚘 {dp.vehicleBrand || ''} {dp.vehicleColor || ''}</p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </Card>

            {/* Delivery Persons List */}
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🏍️ Entregadores Próximos
              <Badge className="bg-green-500">{deliveryPersons.length}</Badge>
            </h3>

            <div className="space-y-3 mb-6">
              {getSortedDeliveryPersons().map((dp) => {
                const timeMinutes = calculateTime(dp.distance || 0, dp.vehicleType)
                return (
                  <Card key={dp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl text-white">
                        {vehicleIcons[dp.vehicleType]}
                      </div>
                      <div className="flex-1">
                        {user ? (
                          <>
                            <p className="font-medium">{dp.user?.name || 'Entregador'}</p>
                            <p className="text-xs text-gray-500">⭐ {dp.rating.toFixed(1)} • {dp.totalDeliveries} entregas</p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-400">🔒 Login para ver detalhes</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">📍 {(dp.distance || 0).toFixed(1)} km</p>
                        <p className="text-xs text-gray-400">⏱️ ~{timeMinutes} min</p>
                      </div>
                      <Badge className={dp.isAvailable ? 'bg-green-500' : 'bg-gray-400'}>
                        {dp.isAvailable ? 'Disponível' : 'Ocupado'}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Request Delivery CTA */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">📦 Precisa enviar uma encomenda?</h3>
                <p className="text-white/80 mb-4">Transporte ponto a ponto, rápido e seguro!</p>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-100"
                  onClick={() => user ? onDeliveryRequest() : onLoginClick()}
                >
                  {user ? '🏍️ Solicitar Entregador' : '🔐 Entrar para Solicitar'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 shrink-0 hidden xl:block">
        <div className="sticky top-24 space-y-4">
          {/* Quick Stats */}
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <p className="text-3xl font-bold text-orange-500">{providers.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Fornecedores</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-500">{deliveryPersons.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Entregadores</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-500">{products.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Produtos</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-500">24/7</p>
                  <p className="text-xs text-gray-500 font-medium">Disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promo Card */}
          <Card className="shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute top-0 right-0 text-6xl opacity-20">🎉</div>
              <h3 className="font-bold text-lg relative z-10">Primeira Entrega Grátis!</h3>
              <p className="text-sm text-white/80 mt-1 relative z-10">Cadastre-se agora e ganhe frete grátis.</p>
              {!user && (
                <Button
                  size="sm"
                  className="mt-3 bg-white text-orange-500 hover:bg-orange-100 relative z-10"
                  onClick={onLoginClick}
                >
                  Criar Conta Grátis
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Delivery Request Card */}
          <Card className="shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white overflow-hidden cursor-pointer hover:shadow-xl transition-shadow" onClick={() => user ? onDeliveryRequest() : onLoginClick()}>
            <CardContent className="p-4 relative">
              <div className="absolute top-0 right-0 text-6xl opacity-20">📦</div>
              <h3 className="font-bold text-lg relative z-10">📦 Enviar Encomenda</h3>
              <p className="text-sm text-white/80 mt-1 relative z-10">
                Transporte ponto a ponto. Rápido e seguro!
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm relative z-10">
                <span className="bg-white/20 px-2 py-1 rounded">🏍️ Moto</span>
                <span className="bg-white/20 px-2 py-1 rounded">🚗 Carro</span>
              </div>
              <Button
                size="sm"
                className="mt-3 bg-white text-blue-600 hover:bg-blue-100 relative z-10 w-full"
              >
                {user ? 'Solicitar Transporte' : 'Entrar para Solicitar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
