'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Switch } from '@/components/ui/switch'
import LandingPage from '@/components/views/LandingPage'

// Dynamically import Map component (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

// Types
type UserType = 'CLIENT' | 'DELIVERY_PERSON' | 'PROVIDER' | 'ADMIN'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'
type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'SCOOTER'
type PaymentMethod = 'MPESA' | 'EMOLA' | 'VISA' | 'MANUAL' | 'CASH'
type LicenseType = 'TRIAL' | 'STARTER' | 'GROW' | 'PRO' | 'BASIC' | 'ACTIVE' | 'TOP' | 'MONTHLY' | 'SEMESTRAL' | 'ANNUAL'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  userType: UserType
  isBlocked?: boolean
  profileImage?: string
  qrCode?: string
  client?: { id: string; address?: string; latitude?: number; longitude?: number; cityId?: string }
  deliveryPerson?: { 
    id: string
    vehicleType: VehicleType
    isAvailable: boolean
    rating: number
    totalDeliveries: number
    currentLatitude?: number
    currentLongitude?: number
    licenseId?: string
    licenseExpiresAt?: string
    isPremium?: boolean
    cityId?: string
    plateNumber?: string
    vehicleColor?: string
    vehicleBrand?: string
    cashOnHand?: number
  }
  provider?: { 
    id: string
    storeName: string
    storeDescription?: string
    category?: string
    address?: string
    latitude?: number
    longitude?: number
    isOpen: boolean
    licenseId?: string
    licenseExpiresAt?: string
    isPremium?: boolean
    cityId?: string
    storeImage?: string
  }
  admin?: { id: string }
}

interface Provider {
  id: string
  storeName: string
  storeDescription?: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  isOpen: boolean
  licenseExpiresAt?: string
  isPremium?: boolean
  products: Product[]
  storeImage?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  providerId: string
  provider?: { id: string; storeName: string; storeDescription?: string; category?: string; address?: string; latitude?: number; longitude?: number }
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
  user?: { name: string; profileImage?: string }
  licenseExpiresAt?: string
  isPremium?: boolean
  distance?: number
  deliveryFee?: number
  estimatedTime?: number
  plateNumber?: string
  vehicleColor?: string
  vehicleBrand?: string
  cashOnHand?: number
  qrCode?: string
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  deliveryFee: number
  deliveryAddress?: string
  createdAt: string
  providerId?: string
  deliveryPersonId?: string
  items: { id: string; productId: string; quantity: number; price: number; product: Product }[]
  provider?: { id: string; storeName: string; storeDescription?: string; category?: string; address?: string; latitude?: number; longitude?: number; storeImage?: string }
  deliveryPerson?: { id: string; user: { name: string; profileImage?: string }; rating: number; vehicleType: VehicleType; plateNumber?: string; vehicleColor?: string; vehicleBrand?: string }
  ratings?: Rating[]
  qrCode?: string
  paymentMethod?: PaymentMethod
  isCashPaid?: boolean
  transferReceipt?: string
  trackingPoints?: { latitude: number; longitude: number; timestamp: string }[]
}

interface CartItem { product: Product; quantity: number }

interface City {
  id: string
  name: string
  province: string
  latitude: number
  longitude: number
  isActive: boolean
}

interface License {
  id: string
  name: string
  type: LicenseType
  priceProvider: number
  priceDelivery: number
  durationDays: number
  description?: string
  isActive: boolean
  // Novos campos para planos
  targetUserType?: 'PROVIDER' | 'DELIVERY_PERSON' | 'BOTH'
  isTrial?: boolean
  isFree?: boolean
  transactionFeePercent?: number
  ordersIncluded?: number
  orderExcessFee?: number
  productsLimit?: number
  hasHighlight?: boolean
  hasPriority?: boolean
  deliveriesIncluded?: number
  deliveryExcessFee?: number
  hasInsurance?: boolean
  hasVerifiedBadge?: boolean
}

interface Payment {
  id: string
  userId: string
  amount: number
  method: PaymentMethod
  status: string
  receiptImage?: string
  receiptNumber?: string
  createdAt: string
  user?: { name: string; email: string }
  provider?: { storeName: string }
  deliveryPerson?: { user: { name: string } }
}

interface Rating {
  id: string
  orderId: string
  giverId: string
  receiverId: string
  rating: number
  comment?: string
  targetType: 'PROVIDER' | 'DELIVERY'
}

interface AdminStats {
  totalUsers: number
  totalProviders: number
  totalDeliveryPersons: number
  totalOrders: number
  totalPayments: number
  totalRevenue: number
}

interface AdminSettings {
  mpesaNumber?: string
  emolaNumber?: string
  platformFeePercent?: number
}

interface DeliveryFeeConfig {
  id: string
  cityId?: string
  cityName?: string
  baseFee: number
  perKmFee: number
  minFee: number
  maxDistance: number
  platformCommissionPercent: number
}

interface TrackingPoint {
  latitude: number
  longitude: number
  timestamp: string
}

type QRConfirmType = 'PICKUP' | 'DELIVERY' | 'CASH_PAYMENT'

interface QRScanResult {
  orderId: string
  type: QRConfirmType
  order?: Order
  deliveryPerson?: DeliveryPerson
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-500' },
  PREPARING: { label: 'Preparando', color: 'bg-orange-500' },
  READY: { label: 'Pronto', color: 'bg-green-500' },
  PICKED_UP: { label: 'Em Entrega', color: 'bg-purple-500' },
  DELIVERED: { label: 'Entregue', color: 'bg-gray-500' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500' },
}

const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'Restaurante', name: 'Restaurantes', icon: '🍴' },
  { id: 'Pizzaria', name: 'Pizzarias', icon: '🍕' },
  { id: 'Mercado', name: 'Mercados', icon: '🛒' },
]

const vehicleIcons: Record<VehicleType, string> = {
  MOTORCYCLE: '🏍️',
  BICYCLE: '🚲',
  CAR: '🚗',
  SCOOTER: '🛵',
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  MPESA: '📱 M-Pesa',
  EMOLA: '📱 e-Mola',
  VISA: '💳 Visa',
  MANUAL: '📄 Manual (Comprovativo)',
  CASH: '💵 Dinheiro (Cash)',
}

const licenseTypeLabels: Record<LicenseType, string> = {
  TRIAL: 'Trial (10 dias)',
  STARTER: 'Starter',
  GROW: 'Grow',
  PRO: 'Pro',
  BASIC: 'Básico',
  ACTIVE: 'Ativo',
  TOP: 'Top',
  MONTHLY: 'Mensal (30 dias)',
  SEMESTRAL: 'Semestral (180 dias)',
  ANNUAL: 'Anual (365 dias)',
}

// Maputo coordinates
const MAPUTO_CENTER: [number, number] = [-25.9653, 32.5892]

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate delivery fee based on distance
function calculateDeliveryFee(distanceKm: number): number {
  const baseFee = 50 // MT
  const perKmFee = 20 // MT per km
  return Math.round(baseFee + (distanceKm * perKmFee))
}

// Calculate estimated time
function calculateTime(distanceKm: number, vehicleType: VehicleType = 'MOTORCYCLE'): number {
  const speeds: Record<VehicleType, number> = {
    MOTORCYCLE: 35,
    BICYCLE: 15,
    CAR: 25,
    SCOOTER: 30,
  }
  const speed = speeds[vehicleType] || 30
  return (distanceKm / speed) * 60
}

// Check if license is expired
function isLicenseExpired(expiresAt?: string): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt) < new Date()
}

// Get days until license expires
function getDaysUntilExpiry(expiresAt?: string): number {
  if (!expiresAt) return 0
  const now = new Date()
  const expiry = new Date(expiresAt)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// Leaflet reference (loaded dynamically)
let leafletLib: typeof import('leaflet').default | null = null

const getLeaflet = async () => {
  if (!leafletLib && typeof window !== 'undefined') {
    leafletLib = await import('leaflet').then(m => m.default)
  }
  return leafletLib
}

// Custom marker icon
const createCustomIcon = (emoji: string, color: string = 'blue', photoUrl?: string) => {
  if (typeof window === 'undefined' || !leafletLib) return null
  
  if (photoUrl) {
    return leafletLib.divIcon({
      html: `<div style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid ${color}; overflow: hidden; background: ${color};">
        <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.parentElement.innerHTML='${emoji}'" />
      </div>`,
      className: 'custom-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })
  }
  
  return leafletLib.divIcon({
    html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Mini map marker component that ensures leaflet is loaded
function MiniMapMarker({ position }: { position: [number, number] }) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null)
  
  useEffect(() => {
    getLeaflet().then(() => {
      const newIcon = createCustomIcon('🏍️', '#10B981')
      setTimeout(() => setIcon(newIcon), 0)
    })
  }, [])
  
  if (!icon) return null
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="text-center p-2">
          <p className="font-bold">📍 Você está aqui</p>
          <p className="text-xs text-gray-500">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
        </div>
      </Popup>
    </Marker>
  )
}

// Location Hook
function useLocation() {
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load leaflet library
    getLeaflet()
    
    if (!navigator.geolocation) {
      setTimeout(() => {
        setError('Geolocalização não suportada')
        setLoading(false)
      }, 0)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude])
        setLoading(false)
        setError(null)
      },
      () => {
        setTimeout(() => {
          setError('Usando localização padrão (Maputo)')
          setLocation(MAPUTO_CENTER)
          setLoading(false)
        }, 0)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, error, loading }
}

// Real Map Component
function RealMap({ 
  userLocation, 
  providers, 
  deliveryPersons, 
  user, 
  onLoginClick,
  onProviderSelect,
  trackingPoints,
  orderRoute,
  showRoute
}: { 
  userLocation: [number, number]
  providers: Provider[]
  deliveryPersons: DeliveryPerson[]
  user: User | null
  onLoginClick: () => void
  onProviderSelect: (provider: Provider) => void
  trackingPoints?: TrackingPoint[]
  orderRoute?: { provider: [number, number]; client: [number, number]; deliveryPerson?: [number, number] }
  showRoute?: boolean
}) {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden shadow-xl border-2 border-gray-200">
      <MapContainer
        center={userLocation}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Circle */}
        <Circle 
          center={userLocation} 
          radius={500}
          pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.15 }}
        />
        
        {/* User Location Marker */}
        <Marker 
          position={userLocation}
          icon={createCustomIcon('📍', '#3B82F6', user?.profileImage)}
        >
          <Popup>
            <div className="text-center p-2">
              <p className="font-bold text-lg">📍 Sua Localização</p>
              <p className="text-xs text-gray-500">
                {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Order Route Polyline */}
        {showRoute && orderRoute && (
          <>
            {/* Provider to Client route */}
            <Polyline 
              positions={[orderRoute.provider, orderRoute.client]}
              pathOptions={{ color: '#F97316', weight: 3, opacity: 0.7, dashArray: '10, 10' }}
            />
            {/* Delivery person to Provider route */}
            {orderRoute.deliveryPerson && (
              <Polyline 
                positions={[orderRoute.deliveryPerson, orderRoute.provider]}
                pathOptions={{ color: '#22C55E', weight: 3, opacity: 0.7, dashArray: '5, 10' }}
              />
            )}
          </>
        )}

        {/* Tracking Polyline */}
        {trackingPoints && trackingPoints.length > 1 && (
          <Polyline 
            positions={trackingPoints.map(p => [p.latitude, p.longitude])}
            pathOptions={{ color: '#8B5CF6', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Provider Markers */}
        {providers.filter(p => p.latitude && p.longitude).map((provider) => {
          const lat = provider.latitude!
          const lng = provider.longitude!
          const distance = calculateDistance(userLocation[0], userLocation[1], lat, lng)
          const timeMinutes = calculateTime(distance, 'MOTORCYCLE')
          const deliveryFee = calculateDeliveryFee(distance)
          const emoji = provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : '🛒'
          const color = provider.isOpen ? '#22C55E' : '#EF4444'
          
          return (
            <Marker 
              key={provider.id}
              position={[lat, lng]}
              icon={createCustomIcon(emoji, color, provider.storeImage)}
            >
              <Popup>
                <div className="p-2 min-w-56">
                  <div className="flex items-center gap-2 mb-2">
                    {provider.storeImage && (
                      <img src={provider.storeImage} alt={provider.storeName} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-bold text-lg">{provider.storeName}</p>
                      <p className="text-sm text-gray-500">{provider.category}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-1">{provider.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={provider.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                      {provider.isOpen ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">📍 Distância:</span>
                      <span className="font-bold text-orange-600">{distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">⏱️ Tempo estimado:</span>
                      <span className="font-bold text-green-600">{Math.round(timeMinutes)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">🚚 Taxa de entrega:</span>
                      <span className="font-bold text-purple-600">{deliveryFee} MT</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500"
                    onClick={() => onProviderSelect(provider)}
                  >
                    Ver Produtos
                  </Button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Delivery Person Markers */}
        {deliveryPersons.filter(dp => dp.currentLatitude && dp.currentLongitude).map((dp) => {
          const lat = dp.currentLatitude!
          const lng = dp.currentLongitude!
          const distance = calculateDistance(userLocation[0], userLocation[1], lat, lng)
          const timeMinutes = calculateTime(distance, dp.vehicleType)
          
          return (
            <Marker 
              key={dp.id}
              position={[lat, lng]}
              icon={createCustomIcon(vehicleIcons[dp.vehicleType], '#10B981', dp.user?.profileImage)}
            >
              <Popup>
                <div className="p-2 min-w-52">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {dp.user?.profileImage && (
                          <img src={dp.user.profileImage} alt={dp.user.name} className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-lg">{dp.user?.name || 'Entregador'}</p>
                          <div className="flex items-center gap-1 text-sm">
                            <span>⭐ {dp.rating.toFixed(1)}</span>
                            <span>•</span>
                            <span>{dp.totalDeliveries} entregas</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={dp.isAvailable ? 'bg-green-500 mt-2' : 'bg-gray-500 mt-2'}>
                        {dp.isAvailable ? 'Disponível' : 'Ocupado'}
                      </Badge>
                      {dp.plateNumber && (
                        <p className="text-xs mt-2 text-gray-600">🪪 Matrícula: <span className="font-bold">{dp.plateNumber}</span></p>
                      )}
                      {(dp.vehicleColor || dp.vehicleBrand) && (
                        <p className="text-xs text-gray-600">
                          🏍️ {dp.vehicleBrand || ''} {dp.vehicleColor || ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-bold text-gray-400">🔒 Entregador</p>
                  )}
                  <Separator className="my-2" />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">📍 Distância:</span>
                      <span className="font-bold text-orange-600">{distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">⏱️ Chega em:</span>
                      <span className="font-bold text-green-600">{Math.round(timeMinutes)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">🏍️ Veículo:</span>
                      <span>{vehicleIcons[dp.vehicleType]}</span>
                    </div>
                  </div>
                  {!user && (
                    <Button size="sm" className="w-full mt-2 bg-orange-500" onClick={onLoginClick}>
                      🔐 Ver Detalhes
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

// Delivery Person Location Tracker
function DeliveryPersonTracker({ user, cities, onLicenseRenew }: { user: User; cities: City[]; onLicenseRenew: () => void }) {
  const { location, error: locationError, loading: locationLoading } = useLocation()
  const [isAvailable, setIsAvailable] = useState(user.deliveryPerson?.isAvailable ?? false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [todayDeliveries, setTodayDeliveries] = useState(0)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [cashOnHand, setCashOnHand] = useState(user.deliveryPerson?.cashOnHand || 0)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [scannerInput, setScannerInput] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [transferReceipt, setTransferReceipt] = useState('')
  const [transferAmount, setTransferAmount] = useState(0)

  const licenseExpired = isLicenseExpired(user.deliveryPerson?.licenseExpiresAt)
  const daysUntilExpiry = getDaysUntilExpiry(user.deliveryPerson?.licenseExpiresAt)

  // Load today's stats and orders
  useEffect(() => {
    const loadData = async () => {
      if (!user.deliveryPerson?.id) return
      try {
        const res = await fetch(`/api/orders?deliveryPersonId=${user.deliveryPerson.id}`)
        const data = await res.json()
        const orders = data.orders || []
        const today = new Date().toDateString()
        const todayOrders = orders.filter((o: Order) => 
          new Date(o.createdAt).toDateString() === today && o.status === 'DELIVERED'
        )
        
        // Separate pending and active orders
        const pending = orders.filter((o: Order) => o.status === 'READY')
        const active = orders.filter((o: Order) => ['PICKED_UP', 'CONFIRMED', 'PREPARING'].includes(o.status))
        
        setTimeout(() => {
          setPendingOrders(pending)
          setActiveOrders(active)
          setTodayDeliveries(todayOrders.length)
          setTodayEarnings(todayOrders.reduce((sum: number, o: Order) => sum + (o.deliveryFee * 0.8), 0))
          
          // Calculate cash on hand from CASH payments not yet transferred
          const cashOrders = orders.filter((o: Order) => o.paymentMethod === 'CASH' && o.status === 'DELIVERED' && !o.transferReceipt)
          setCashOnHand(cashOrders.reduce((sum: number, o: Order) => sum + o.totalAmount + o.deliveryFee, 0))
        }, 0)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [user.deliveryPerson?.id])

  // Update location when it changes
  useEffect(() => {
    if (location && user.deliveryPerson?.id) {
      setTimeout(() => setIsUpdating(true), 0)
      fetch('/api/location', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          latitude: location[0],
          longitude: location[1],
          isAvailable,
          userType: 'DELIVERY_PERSON',
        }),
      }).then(() => {
        // Also update tracking if there's an active order
        if (activeOrders.length > 0) {
          fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: activeOrders[0].id,
              deliveryPersonId: user.deliveryPerson?.id,
              latitude: location[0],
              longitude: location[1],
            }),
          })
        }
        setTimeout(() => {
          setLastUpdate(new Date())
          setIsUpdating(false)
        }, 0)
      }).catch(() => setTimeout(() => setIsUpdating(false), 0))
    }
  }, [location, user.id, user.deliveryPerson?.id, isAvailable, activeOrders])

  // Load licenses
  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const res = await fetch('/api/licenses')
        const data = await res.json()
        setLicenses(data.licenses || [])
      } catch (error) {
        console.error('Error loading licenses:', error)
      }
    }
    loadLicenses()
  }, [])

  const toggleAvailability = async () => {
    const newAvailable = !isAvailable
    setIsAvailable(newAvailable)
    
    if (location) {
      await fetch('/api/location', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          latitude: location[0],
          longitude: location[1],
          isAvailable: newAvailable,
          userType: 'DELIVERY_PERSON',
        }),
      })
    }
  }

  const confirmPickup = async (orderId: string) => {
    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type: 'PICKUP',
          deliveryPersonId: user.deliveryPerson?.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Move order from pending to active
        setPendingOrders(prev => prev.filter(o => o.id !== orderId))
        const order = pendingOrders.find(o => o.id === orderId)
        if (order) {
          setTimeout(() => setActiveOrders(prev => [...prev, { ...order, status: 'PICKED_UP' }]), 0)
        }
        setShowScannerModal(false)
        setScannerInput('')
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error confirming pickup:', error)
    }
  }

  const confirmDelivery = async (orderId: string) => {
    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type: 'DELIVERY',
          deliveryPersonId: user.deliveryPerson?.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId))
        setShowScannerModal(false)
        setScannerInput('')
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error confirming delivery:', error)
    }
  }

  const markCashReceived = async (orderId: string) => {
    try {
      await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type: 'CASH_PAYMENT',
          deliveryPersonId: user.deliveryPerson?.id,
          isCashPaid: true,
        }),
      })
      // Update local state
      setActiveOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, isCashPaid: true } : o
      ))
    } catch (error) {
      console.error('Error marking cash received:', error)
    }
  }

  const submitTransferReceipt = async () => {
    try {
      // Submit transfer receipt for cash on hand
      await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CASH_PAYMENT',
          deliveryPersonId: user.deliveryPerson?.id,
          transferReceipt,
          amount: transferAmount,
        }),
      })
      setCashOnHand(prev => prev - transferAmount)
      setShowCashModal(false)
      setTransferReceipt('')
      setTransferAmount(0)
    } catch (error) {
      console.error('Error submitting transfer:', error)
    }
  }

  const handleScanQR = () => {
    // Simulate QR code scan - look up order by QR code
    const order = [...pendingOrders, ...activeOrders].find(o => 
      o.qrCode === scannerInput || o.id === scannerInput || o.id.slice(-6) === scannerInput
    )
    if (order) {
      setSelectedOrder(order)
    } else {
      alert('QR Code não encontrado')
    }
  }

  // Generate QR Code for delivery person (simplified - just shows ID)
  const deliveryPersonQR = user.deliveryPerson?.qrCode || `DEL-${user.deliveryPerson?.id?.slice(-8)}`

  return (
    <>
      <div className="space-y-4">
        {/* Main Panel */}
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                🏍️ Painel do Entregador
              </span>
              <div className="flex items-center gap-2 text-sm">
                {locationLoading ? (
                  <span className="animate-pulse">📍 Obtendo GPS...</span>
                ) : locationError ? (
                  <span className="text-yellow-200">⚠️ {locationError}</span>
                ) : location ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    GPS Ativo
                    {isUpdating && <span className="animate-spin">⚡</span>}
                  </span>
                ) : null}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* License Status */}
            <div className={`p-3 rounded-lg ${licenseExpired ? 'bg-red-50 border border-red-200' : daysUntilExpiry <= 7 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">📜 Licença</p>
                  <p className={`text-xs ${licenseExpired ? 'text-red-600' : daysUntilExpiry <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {licenseExpired ? '❌ Expirada' : `✅ Ativa - ${daysUntilExpiry} dias restantes`}
                  </p>
                </div>
                <Button size="sm" variant={licenseExpired ? 'destructive' : 'outline'} onClick={() => setShowLicenseModal(true)}>
                  {licenseExpired ? 'Renovar' : 'Ver Planos'}
                </Button>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-bold text-lg">Status</p>
                <p className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                  {isAvailable ? '🟢 Disponível para entregas' : '🔴 Indisponível'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                  className="data-[state=checked]:bg-green-500"
                  disabled={licenseExpired}
                />
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-orange-50 rounded-lg text-center border border-orange-200">
                <p className="text-2xl font-bold text-orange-500">
                  {user.deliveryPerson?.totalDeliveries || 0}
                </p>
                <p className="text-xs text-gray-500">Total Entregas</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center border border-green-200">
                <p className="text-2xl font-bold text-green-500">
                  ⭐ {user.deliveryPerson?.rating.toFixed(1) || '5.0'}
                </p>
                <p className="text-xs text-gray-500">Avaliação</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                <p className="text-2xl font-bold text-blue-500">{todayDeliveries}</p>
                <p className="text-xs text-gray-500">Hoje</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center border border-purple-200">
                <p className="text-2xl font-bold text-purple-500">
                  {todayEarnings.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">MT Hoje</p>
              </div>
            </div>

            {/* Cash on Hand */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm flex items-center gap-1">💵 Cash em Mãos</p>
                  <p className="text-lg font-bold text-yellow-700">{cashOnHand.toLocaleString('pt-MZ')} MT</p>
                </div>
                {cashOnHand > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowCashModal(true)}>
                    Transferir
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => setShowQRModal(true)}>
                <span className="text-xl">📱</span>
                <span className="text-xs">Meu QR</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => setShowScannerModal(true)}>
                <span className="text-xl">📷</span>
                <span className="text-xs">Escanear QR</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1 relative">
                <span className="text-xl">📦</span>
                <span className="text-xs">Pendentes</span>
                {pendingOrders.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500">{pendingOrders.length}</Badge>
                )}
              </Button>
            </div>

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">📦 Pedidos Prontos para Retirada ({pendingOrders.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-2">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="p-2 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">#{order.id.slice(-6)}</p>
                          <p className="text-xs text-gray-500">{order.provider?.storeName}</p>
                          <p className="text-xs text-green-600 font-medium">
                            {order.paymentMethod === 'CASH' && '💵 Pagamento em Dinheiro'}
                          </p>
                        </div>
                        <Button size="sm" className="bg-green-500" onClick={() => {
                          setSelectedOrder(order)
                          setShowScannerModal(true)
                        }}>
                          Retirar
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">🚚 Entregas em Andamento ({activeOrders.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-2">
                  {activeOrders.map(order => (
                    <div key={order.id} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">#{order.id.slice(-6)}</p>
                          <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                          <p className="text-xs font-bold text-green-600">
                            {(order.totalAmount + order.deliveryFee).toLocaleString('pt-MZ')} MT
                          </p>
                          <p className="text-xs">
                            <Badge className={order.paymentMethod === 'CASH' ? 'bg-yellow-500' : 'bg-green-500'}>
                              {order.paymentMethod === 'CASH' ? '💵 Cash' : '💳 Pago'}
                            </Badge>
                            {order.paymentMethod === 'CASH' && !order.isCashPaid && (
                              <Button size="sm" variant="outline" className="ml-2 text-xs h-6" onClick={() => markCashReceived(order.id)}>
                                Recebi
                              </Button>
                            )}
                          </p>
                        </div>
                        <Badge className={`${statusConfig[order.status].color} text-white`}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Vehicle Info */}
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <span className="text-3xl">{vehicleIcons[user.deliveryPerson?.vehicleType || 'MOTORCYCLE']}</span>
              <div className="flex-1">
                <p className="font-medium">Veículo</p>
                <p className="text-sm text-gray-500">
                  {user.deliveryPerson?.vehicleType === 'MOTORCYCLE' ? 'Motocicleta' :
                   user.deliveryPerson?.vehicleType === 'BICYCLE' ? 'Bicicleta' :
                   user.deliveryPerson?.vehicleType === 'CAR' ? 'Carro' : 'Scooter'}
                </p>
                {user.deliveryPerson?.plateNumber && (
                  <p className="text-xs text-gray-600">🪪 {user.deliveryPerson.plateNumber}</p>
                )}
                {(user.deliveryPerson?.vehicleColor || user.deliveryPerson?.vehicleBrand) && (
                  <p className="text-xs text-gray-600">
                    {user.deliveryPerson.vehicleBrand} {user.deliveryPerson.vehicleColor}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📱 Seu QR Code</DialogTitle>
            <DialogDescription>Mostre este código para o cliente confirmar a entrega</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-green-500">
              <div className="text-center">
                <p className="text-4xl mb-2">📱</p>
                <p className="font-mono text-xs font-bold">{deliveryPersonQR}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              O cliente pode escanear este código para ver seus dados e confirmar a entrega
            </p>
            {user.profileImage && (
              <img src={user.profileImage} alt="Profile" className="w-16 h-16 rounded-full mt-4 border-2 border-green-500" />
            )}
            <p className="font-medium mt-2">{user.name}</p>
            <p className="text-sm text-gray-500">⭐ {user.deliveryPerson?.rating.toFixed(1)} • {user.deliveryPerson?.totalDeliveries} entregas</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Modal */}
      <Dialog open={showScannerModal} onOpenChange={setShowScannerModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📷 Escanear QR Code</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code do pedido ou insira o código manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedOrder ? (
              <>
                {/* Simulated Scanner Input */}
                <div className="space-y-2">
                  <Label>Código do Pedido</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={scannerInput}
                      onChange={e => setScannerInput(e.target.value)}
                      placeholder="Ex: ABC123 ou ID completo"
                    />
                    <Button onClick={handleScanQR}>Buscar</Button>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  <p>ou simule a câmera:</p>
                  <Button variant="outline" className="mt-2 w-full" onClick={() => {
                    if (pendingOrders.length > 0) {
                      setSelectedOrder(pendingOrders[0])
                    } else if (activeOrders.length > 0) {
                      setSelectedOrder(activeOrders[0])
                    }
                  }}>
                    📷 Simular Scan do Próximo Pedido
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Order Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold">#{selectedOrder.id.slice(-6)}</p>
                    <Badge className={`${statusConfig[selectedOrder.status].color} text-white`}>
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                  
                  {selectedOrder.provider && (
                    <p className="text-sm">🏪 {selectedOrder.provider.storeName}</p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    {selectedOrder.items.map(item => (
                      <p key={item.id} className="text-xs text-gray-600">
                        {item.quantity}x {item.product.name}
                      </p>
                    ))}
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">
                      {(selectedOrder.totalAmount + selectedOrder.deliveryFee).toLocaleString('pt-MZ')} MT
                    </span>
                  </div>
                  
                  {selectedOrder.paymentMethod === 'CASH' && (
                    <p className="text-sm text-yellow-600 font-bold mt-2">
                      💵 Pagamento em Dinheiro - Colete do cliente!
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedOrder.status === 'READY' && (
                    <Button 
                      className="w-full bg-green-500"
                      onClick={() => confirmPickup(selectedOrder.id)}
                    >
                      ✓ Confirmar Retirada
                    </Button>
                  )}
                  {selectedOrder.status === 'PICKED_UP' && (
                    <Button 
                      className="w-full bg-blue-500"
                      onClick={() => confirmDelivery(selectedOrder.id)}
                    >
                      ✓ Confirmar Entrega
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => {
                    setSelectedOrder(null)
                    setScannerInput('')
                  }}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Transfer Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>💵 Transferir Cash</DialogTitle>
            <DialogDescription>
              Envie comprovativo da transferência para a plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Cash em Mãos</p>
              <p className="text-2xl font-bold text-yellow-700">{cashOnHand.toLocaleString('pt-MZ')} MT</p>
            </div>
            
            <div className="space-y-2">
              <Label>Valor a Transferir</Label>
              <Input 
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(parseFloat(e.target.value) || 0)}
                placeholder="Valor em MT"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comprovativo (Base64 ou URL)</Label>
              <Textarea 
                value={transferReceipt}
                onChange={e => setTransferReceipt(e.target.value)}
                placeholder="Cole o comprovativo aqui..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCashModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-green-500" onClick={submitTransferReceipt} disabled={!transferReceipt || transferAmount <= 0}>
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* License Payment Modal */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">📜 Planos para Entregadores</DialogTitle>
            <DialogDescription>Escolha o melhor plano para suas entregas</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {licenses
              .filter(l => l.isActive && !l.isTrial && (l.targetUserType === 'DELIVERY_PERSON' || l.targetUserType === 'BOTH') && ['BASIC', 'ACTIVE', 'TOP'].includes(l.type))
              .sort((a, b) => a.priceDelivery - b.priceDelivery)
              .map((license) => (
                <Card 
                  key={license.id} 
                  className="cursor-pointer transition-all hover:shadow-lg border"
                  onClick={() => {
                    setShowLicenseModal(false)
                    // Open payment modal with selected license
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-center">{license.name}</CardTitle>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{license.priceDelivery.toLocaleString('pt-MZ')} MT</p>
                      <p className="text-xs text-gray-500">/mês</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Taxa por Entrega</span>
                      <span className="font-medium">{license.transactionFeePercent || 5}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Entregas Incluídas</span>
                      <span className="font-medium">{license.deliveriesIncluded || '∞'}/mês</span>
                    </div>
                    <div className="pt-2 space-y-1">
                      {license.hasPriority && (
                        <p className="text-green-600 text-xs">✓ Prioridade em pedidos</p>
                      )}
                      {license.hasInsurance && (
                        <p className="text-green-600 text-xs">✓ Seguro por entrega</p>
                      )}
                      {license.hasVerifiedBadge && (
                        <p className="text-green-600 text-xs">✓ Badge verificado</p>
                      )}
                      {!license.hasPriority && !license.hasInsurance && !license.hasVerifiedBadge && (
                        <p className="text-gray-400 text-xs">Recursos básicos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Admin Dashboard Component
function AdminDashboard({ user, onRefresh }: { user: User; onRefresh: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [settings, setSettings] = useState<AdminSettings>({})
  const [licenses, setLicenses] = useState<License[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [feeConfigs, setFeeConfigs] = useState<DeliveryFeeConfig[]>([])
  const [adminTab, setAdminTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [showLicenseEditModal, setShowLicenseEditModal] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showFeeConfigModal, setShowFeeConfigModal] = useState(false)
  const [editingFeeConfig, setEditingFeeConfig] = useState<DeliveryFeeConfig | null>(null)
  // TRIAL management states
  const [usersWithoutLicense, setUsersWithoutLicense] = useState<User[]>([])
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [selectedTrialUser, setSelectedTrialUser] = useState<User | null>(null)
  const [trialIsFree, setTrialIsFree] = useState(true)
  const [trialPrice, setTrialPrice] = useState(0)
  const [creatingTrial, setCreatingTrial] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [statsRes, usersRes, paymentsRes, settingsRes, licensesRes, citiesRes, feeConfigsRes] = await Promise.all([
          fetch('/api/admin?action=stats'),
          fetch('/api/admin?action=users'),
          fetch('/api/admin?action=payments'),
          fetch('/api/admin?action=settings'),
          fetch('/api/licenses'),
          fetch('/api/cities'),
          fetch('/api/admin?action=fee-configs'),
        ])
        
        const [statsData, usersData, paymentsData, settingsData, licensesData, citiesData, feeConfigsData] = await Promise.all([
          statsRes.json(), usersRes.json(), paymentsRes.json(), settingsRes.json(), licensesRes.json(), citiesRes.json(), feeConfigsRes.json()
        ])
        
        setTimeout(() => {
          setStats(statsData.stats || null)
          setUsers(usersData.users || [])
          setPayments(paymentsData.payments || [])
          setSettings(settingsData.settings || {})
          setLicenses(licensesData.licenses || [])
          setCities(citiesData.cities || [])
          setFeeConfigs(feeConfigsData.feeConfigs || [])
          setLoading(false)
        }, 0)
      } catch (error) {
        console.error('Error loading admin data:', error)
        setTimeout(() => setLoading(false), 0)
      }
    }
    loadData()
  }, [])

  const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-block', userId, isBlocked: !isBlocked }),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !isBlocked } : u))
    } catch (error) {
      console.error('Error toggling user block:', error)
    }
  }

  const confirmPayment = async (paymentId: string, confirm: boolean) => {
    try {
      await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status: confirm ? 'COMPLETED' : 'CANCELLED' }),
      })
      setPayments(prev => prev.filter(p => p.id !== paymentId))
    } catch (error) {
      console.error('Error confirming payment:', error)
    }
  }

  const updateSettings = async (newSettings: AdminSettings) => {
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', settings: newSettings }),
      })
      setSettings(newSettings)
      setShowSettingsModal(false)
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const updateLicense = async (licenseId: string, data: Partial<License>) => {
    try {
      await fetch('/api/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, ...data }),
      })
      setLicenses(prev => prev.map(l => l.id === licenseId ? { ...l, ...data } : l))
      setShowLicenseEditModal(false)
      setEditingLicense(null)
    } catch (error) {
      console.error('Error updating license:', error)
    }
  }

  const updateFeeConfig = async (configId: string, data: Partial<DeliveryFeeConfig>) => {
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fee-config', configId, ...data }),
      })
      setFeeConfigs(prev => prev.map(c => c.id === configId ? { ...c, ...data } : c))
      setShowFeeConfigModal(false)
      setEditingFeeConfig(null)
    } catch (error) {
      console.error('Error updating fee config:', error)
    }
  }

  // Load users without license
  const loadUsersWithoutLicense = async () => {
    try {
      const res = await fetch('/api/admin?action=usersWithoutLicense')
      const data = await res.json()
      setTimeout(() => setUsersWithoutLicense(data.users || []), 0)
    } catch (error) {
      console.error('Error loading users without license:', error)
    }
  }

  // Create TRIAL license
  const createTrialLicense = async () => {
    if (!selectedTrialUser) return
    setCreatingTrial(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTrial',
          data: {
            userId: selectedTrialUser.id,
            isFree: trialIsFree,
            price: trialIsFree ? 0 : trialPrice,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowTrialModal(false)
        setSelectedTrialUser(null)
        setTrialIsFree(true)
        setTrialPrice(0)
        loadUsersWithoutLicense()
        onRefresh()
        alert(`Licença TRIAL criada com sucesso! Expira em 10 dias.`)
      } else {
        alert(data.error || 'Erro ao criar licença TRIAL')
      }
    } catch (error) {
      console.error('Error creating TRIAL:', error)
      alert('Erro ao criar licença TRIAL')
    }
    setCreatingTrial(false)
  }

  // Load users without license when tab changes
  useEffect(() => {
    if (adminTab === 'trials') {
      loadUsersWithoutLicense()
    }
  }, [adminTab])

  if (loading) {
    return <Card><CardContent className="py-8 text-center"><p>Carregando...</p></CardContent></Card>
  }

  return (
    <div className="space-y-4">
      {/* Admin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'users', label: '👥 Usuários', icon: '👥' },
          { id: 'licenses', label: '📜 Licenças', icon: '📜' },
          { id: 'trials', label: '🎁 Gerenciar TRIAL', icon: '🎁' },
          { id: 'payments', label: '💳 Pagamentos', icon: '💳' },
          { id: 'settings', label: '⚙️ Configurações', icon: '⚙️' },
          { id: 'fees', label: '🚚 Taxas de Entrega', icon: '🚚' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={adminTab === tab.id ? 'default' : 'outline'}
            className={adminTab === tab.id ? 'bg-orange-500 text-white' : ''}
            onClick={() => setAdminTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {adminTab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm opacity-80">Total Usuários</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalProviders}</p>
              <p className="text-sm opacity-80">Prestadores</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalDeliveryPersons}</p>
              <p className="text-sm opacity-80">Entregadores</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm opacity-80">Total Pedidos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalPayments}</p>
              <p className="text-sm opacity-80">Pagamentos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalRevenue?.toLocaleString('pt-MZ') || 0}</p>
              <p className="text-sm opacity-80">MT Receita</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {adminTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>👥 Gerenciar Usuários</CardTitle>
            <CardDescription>{users.length} usuários registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email} • {u.userType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={u.isBlocked ? 'bg-red-500' : 'bg-green-500'}>
                      {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={u.isBlocked ? 'default' : 'destructive'}
                      onClick={() => toggleUserBlock(u.id, u.isBlocked || false)}
                    >
                      {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Licenses Tab */}
      {adminTab === 'licenses' && (
        <Card>
          <CardHeader>
            <CardTitle>📜 Gerenciar Licenças</CardTitle>
            <CardDescription>Defina os preços e durações das licenças</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {licenses.map(license => (
                <div key={license.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold">{license.name}</p>
                    <p className="text-sm text-gray-500">{licenseTypeLabels[license.type]} • {license.durationDays} dias</p>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-orange-600">Prestador: {license.priceProvider.toLocaleString('pt-MZ')} MT</span>
                      <span className="text-green-600">Entregador: {license.priceDelivery.toLocaleString('pt-MZ')} MT</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingLicense(license)
                    setShowLicenseEditModal(true)
                  }}>
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TRIAL Management Tab */}
      {adminTab === 'trials' && (
        <Card>
          <CardHeader>
            <CardTitle>🎁 Gerenciar Licenças TRIAL</CardTitle>
            <CardDescription>Crie licenças trial de 10 dias para usuários sem licença ativa</CardDescription>
          </CardHeader>
          <CardContent>
            {usersWithoutLicense.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Todos os usuários têm licença ativa</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {usersWithoutLicense.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={u.provider ? 'bg-orange-500' : 'bg-green-500'}>
                            {u.provider ? '🏪 Prestador' : '🏍️ Entregador'}
                          </Badge>
                          {u.provider?.licenseExpiresAt && (
                            <span className="text-xs text-red-500">
                              Expirou: {new Date(u.provider.licenseExpiresAt).toLocaleDateString('pt-MZ')}
                            </span>
                          )}
                          {u.deliveryPerson?.licenseExpiresAt && (
                            <span className="text-xs text-red-500">
                              Expirou: {new Date(u.deliveryPerson.licenseExpiresAt).toLocaleDateString('pt-MZ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-green-500 to-emerald-600"
                      onClick={() => {
                        setSelectedTrialUser(u)
                        setShowTrialModal(true)
                      }}
                    >
                      Criar Trial
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {adminTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle>💳 Pagamentos Pendentes</CardTitle>
            <CardDescription>Comprovativos aguardando confirmação</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.filter(p => p.status === 'PENDING').length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum pagamento pendente</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {payments.filter(p => p.status === 'PENDING').map(payment => (
                  <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{payment.user?.name || 'Usuário'}</p>
                        <p className="text-sm text-gray-500">{payment.user?.email}</p>
                      </div>
                      <Badge className="bg-yellow-500">{payment.amount.toLocaleString('pt-MZ')} MT</Badge>
                    </div>
                    {payment.receiptNumber && (
                      <p className="text-xs text-gray-500 mb-2">Ref: {payment.receiptNumber}</p>
                    )}
                    {payment.receiptImage && (
                      <div className="mb-2">
                        <img src={payment.receiptImage} alt="Comprovativo" className="max-h-32 rounded border" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-500" onClick={() => confirmPayment(payment.id, true)}>
                        ✓ Confirmar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => confirmPayment(payment.id, false)}>
                        ✕ Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {adminTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Configurações</CardTitle>
            <CardDescription>Números de pagamento e taxas da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">📱 M-Pesa</p>
                <p className="text-2xl font-bold text-purple-600">{settings.mpesaNumber || 'Não definido'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">📱 e-Mola</p>
                <p className="text-2xl font-bold text-green-600">{settings.emolaNumber || 'Não definido'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">📊 Taxa da Plataforma</p>
                <p className="text-2xl font-bold text-orange-600">{settings.platformFeePercent || 10}%</p>
              </div>
            </div>
            <Button onClick={() => setShowSettingsModal(true)}>Editar Configurações</Button>
          </CardContent>
        </Card>
      )}

      {/* Delivery Fees Tab */}
      {adminTab === 'fees' && (
        <Card>
          <CardHeader>
            <CardTitle>🚚 Taxas de Entrega por Cidade</CardTitle>
            <CardDescription>Configure as taxas de entrega para cada cidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {feeConfigs.map(config => (
                <div key={config.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{config.cityName || 'Global'}</p>
                    <p className="text-xs text-gray-500">
                      Base: {config.baseFee} MT | Km: {config.perKmFee} MT | Comissão: {config.platformCommissionPercent}%
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingFeeConfig(config)
                    setShowFeeConfigModal(true)
                  }}>
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Edit Modal */}
      <Dialog open={showLicenseEditModal} onOpenChange={setShowLicenseEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Licença</DialogTitle>
          </DialogHeader>
          {editingLicense && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  value={editingLicense.name} 
                  onChange={e => setEditingLicense({ ...editingLicense, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço Prestador (MT)</Label>
                <Input 
                  type="number"
                  value={editingLicense.priceProvider} 
                  onChange={e => setEditingLicense({ ...editingLicense, priceProvider: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Preço Entregador (MT)</Label>
                <Input 
                  type="number"
                  value={editingLicense.priceDelivery} 
                  onChange={e => setEditingLicense({ ...editingLicense, priceDelivery: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Duração (dias)</Label>
                <Input 
                  type="number"
                  value={editingLicense.durationDays} 
                  onChange={e => setEditingLicense({ ...editingLicense, durationDays: parseInt(e.target.value) })}
                />
              </div>
              <Button className="w-full" onClick={() => updateLicense(editingLicense.id, editingLicense)}>
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Configurações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número M-Pesa</Label>
              <Input 
                value={settings.mpesaNumber || ''} 
                onChange={e => setSettings({ ...settings, mpesaNumber: e.target.value })}
                placeholder="84XXXXXXX"
              />
            </div>
            <div>
              <Label>Número e-Mola</Label>
              <Input 
                value={settings.emolaNumber || ''} 
                onChange={e => setSettings({ ...settings, emolaNumber: e.target.value })}
                placeholder="85XXXXXXX"
              />
            </div>
            <div>
              <Label>Taxa da Plataforma (%)</Label>
              <Input 
                type="number"
                value={settings.platformFeePercent || 10} 
                onChange={e => setSettings({ ...settings, platformFeePercent: parseFloat(e.target.value) })}
              />
            </div>
            <Button className="w-full" onClick={() => updateSettings(settings)}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Config Modal */}
      <Dialog open={showFeeConfigModal} onOpenChange={setShowFeeConfigModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Taxa de Entrega</DialogTitle>
          </DialogHeader>
          {editingFeeConfig && (
            <div className="space-y-4">
              <div>
                <Label>Taxa Base (MT)</Label>
                <Input 
                  type="number"
                  value={editingFeeConfig.baseFee} 
                  onChange={e => setEditingFeeConfig({ ...editingFeeConfig, baseFee: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Por Km (MT)</Label>
                <Input 
                  type="number"
                  value={editingFeeConfig.perKmFee} 
                  onChange={e => setEditingFeeConfig({ ...editingFeeConfig, perKmFee: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Taxa Mínima (MT)</Label>
                <Input 
                  type="number"
                  value={editingFeeConfig.minFee} 
                  onChange={e => setEditingFeeConfig({ ...editingFeeConfig, minFee: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Comissão da Plataforma (%)</Label>
                <Input 
                  type="number"
                  value={editingFeeConfig.platformCommissionPercent} 
                  onChange={e => setEditingFeeConfig({ ...editingFeeConfig, platformCommissionPercent: parseFloat(e.target.value) })}
                />
              </div>
              <Button className="w-full" onClick={() => updateFeeConfig(editingFeeConfig.id, editingFeeConfig)}>
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* TRIAL Creation Modal */}
      <Dialog open={showTrialModal} onOpenChange={setShowTrialModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🎁 Criar Licença TRIAL</DialogTitle>
            <DialogDescription>Criar licença de 10 dias para o usuário</DialogDescription>
          </DialogHeader>
          {selectedTrialUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedTrialUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{selectedTrialUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedTrialUser.email}</p>
                    <Badge className={selectedTrialUser.provider ? 'bg-orange-500 mt-1' : 'bg-green-500 mt-1'}>
                      {selectedTrialUser.provider ? '🏪 Prestador' : '🏍️ Entregador'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Duração:</strong> 10 dias<br/>
                  <strong>Expira em:</strong> {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-MZ')}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Tipo de Trial</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={trialIsFree ? 'default' : 'outline'}
                    className={`flex-1 ${trialIsFree ? 'bg-green-500' : ''}`}
                    onClick={() => {
                      setTimeout(() => {
                        setTrialIsFree(true)
                        setTrialPrice(0)
                      }, 0)
                    }}
                  >
                    🆓 Gratuito
                  </Button>
                  <Button 
                    variant={!trialIsFree ? 'default' : 'outline'}
                    className={`flex-1 ${!trialIsFree ? 'bg-orange-500' : ''}`}
                    onClick={() => setTimeout(() => setTrialIsFree(false), 0)}
                  >
                    💰 Pago
                  </Button>
                </div>
              </div>

              {!trialIsFree && (
                <div className="space-y-2">
                  <Label>Valor do Trial (MT)</Label>
                  <Input 
                    type="number"
                    value={trialPrice}
                    onChange={e => setTrialPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Valor em MT"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setShowTrialModal(false)
                    setSelectedTrialUser(null)
                    setTrialIsFree(true)
                    setTrialPrice(0)
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={createTrialLicense}
                  disabled={creatingTrial || (!trialIsFree && trialPrice <= 0)}
                >
                  {creatingTrial ? 'Criando...' : 'Criar Trial de 10 dias'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Provider Dashboard Component
function ProviderDashboard({ user, providers, onRefresh }: { user: User; providers: Provider[]; onRefresh: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('MPESA')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedOrderForQR, setSelectedOrderForQR] = useState<Order | null>(null)

  const provider = providers.find(p => p.id === user.provider?.id)
  const licenseExpired = isLicenseExpired(user.provider?.licenseExpiresAt)
  const daysUntilExpiry = getDaysUntilExpiry(user.provider?.licenseExpiresAt)

  useEffect(() => {
    const loadData = async () => {
      if (!user.provider?.id) return
      try {
        const res = await fetch(`/api/orders?providerId=${user.provider.id}`)
        const data = await res.json()
        setTimeout(() => setOrders(data.orders || []), 0)
      } catch (error) {
        console.error('Error loading provider orders:', error)
      }
    }
    loadData()

    const loadLicenses = async () => {
      try {
        const res = await fetch('/api/licenses')
        const data = await res.json()
        setTimeout(() => setLicenses(data.licenses || []), 0)
      } catch (error) {
        console.error('Error loading licenses:', error)
      }
    }
    loadLicenses()
  }, [user.provider?.id])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const toggleStoreOpen = async () => {
    try {
      await fetch('/api/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: user.provider?.id, isOpen: !provider?.isOpen }),
      })
      onRefresh()
    } catch (error) {
      console.error('Error toggling store:', error)
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PREPARING')
  const completedOrders = orders.filter(o => o.status === 'DELIVERED')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <div className="space-y-4">
      {/* License Status */}
      <Card className={`border-2 ${licenseExpired ? 'border-red-300 bg-red-50' : daysUntilExpiry <= 7 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">📜 Status da Licença</p>
              <p className={`text-sm ${licenseExpired ? 'text-red-600' : daysUntilExpiry <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                {licenseExpired ? '❌ Sua licença expirou! Renove para continuar operando.' : 
                 daysUntilExpiry <= 7 ? `⚠️ Sua licença expira em ${daysUntilExpiry} dias.` :
                 `✅ Licença ativa - ${daysUntilExpiry} dias restantes`}
              </p>
            </div>
            <Button onClick={() => setShowLicenseModal(true)} variant={licenseExpired ? 'destructive' : 'default'}>
              {licenseExpired ? 'Renovar Agora' : 'Ver Planos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Store Status */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>🏪 {provider?.storeName || 'Minha Loja'}</span>
            <div className="flex items-center gap-2">
              <Badge className={provider?.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                {provider?.isOpen ? 'Aberta' : 'Fechada'}
              </Badge>
              <Switch
                checked={provider?.isOpen ?? true}
                onCheckedChange={toggleStoreOpen}
                disabled={licenseExpired}
              />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-orange-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
            <p className="text-xs text-gray-500">Pedidos Pendentes</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
            <p className="text-xs text-gray-500">Concluídos</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString('pt-MZ')}</p>
            <p className="text-xs text-gray-500">MT Receita</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Pedidos Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhum pedido pendente</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {pendingOrders.map(order => (
                <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">#{order.id.slice(-6)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('pt-MZ')}</p>
                    </div>
                    <Badge className={statusConfig[order.status].color + ' text-white'}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1 mb-2">
                    {order.items.map(item => (
                      <p key={item.id}>{item.quantity}x {item.product.name} - {(item.price * item.quantity).toLocaleString('pt-MZ')} MT</p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <Button size="sm" className="bg-blue-500" onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}>
                        Confirmar
                      </Button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <Button size="sm" className="bg-orange-500" onClick={() => updateOrderStatus(order.id, 'PREPARING')}>
                        Preparando
                      </Button>
                    )}
                    {order.status === 'PREPARING' && (
                      <Button size="sm" className="bg-green-500" onClick={() => updateOrderStatus(order.id, 'READY')}>
                        Pronto
                      </Button>
                    )}
                    {order.status === 'READY' && (
                      <Button size="sm" className="bg-purple-500" onClick={() => {
                        setSelectedOrderForQR(order)
                        setShowQRModal(true)
                      }}>
                        📱 Ver QR Code
                      </Button>
                    )}
                    {order.paymentMethod === 'CASH' && (
                      <Badge className="bg-yellow-500">💵 Cash</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Modal */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">📜 Planos para Prestadores</DialogTitle>
            <DialogDescription>Escolha o melhor plano para sua loja</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {licenses
              .filter(l => l.isActive && !l.isTrial && (l.targetUserType === 'PROVIDER' || l.targetUserType === 'BOTH') && ['STARTER', 'GROW', 'PRO'].includes(l.type))
              .sort((a, b) => a.priceProvider - b.priceProvider)
              .map((license) => (
                <Card 
                  key={license.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedLicense?.id === license.id ? 'ring-2 ring-green-500 shadow-lg' : 'border'}`}
                  onClick={() => setSelectedLicense(license)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-center">{license.name}</CardTitle>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{license.priceProvider.toLocaleString('pt-MZ')} MT</p>
                      <p className="text-xs text-gray-500">/mês</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Taxa Transação</span>
                      <span className="font-medium">{license.transactionFeePercent || 5}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Pedidos Incluídos</span>
                      <span className="font-medium">{license.ordersIncluded || '∞'}/mês</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Limite Produtos</span>
                      <span className="font-medium">{license.productsLimit || '∞'}</span>
                    </div>
                    <div className="pt-2 space-y-1">
                      {license.hasHighlight && (
                        <p className="text-green-600 text-xs">✓ Destaque na plataforma</p>
                      )}
                      {license.hasPriority && (
                        <p className="text-green-600 text-xs">✓ Prioridade em pedidos</p>
                      )}
                      {!license.hasHighlight && !license.hasPriority && (
                        <p className="text-gray-400 text-xs">Recursos básicos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {selectedLicense && (
            <div className="pt-4 border-t mt-4">
              <p className="font-medium mb-2">Método de Pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                {(['MPESA', 'EMOLA', 'VISA', 'MANUAL'] as PaymentMethod[]).map(method => (
                  <Button
                    key={method}
                    variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                    className={selectedPaymentMethod === method ? 'bg-green-500' : ''}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {paymentMethodLabels[method]}
                  </Button>
                ))}
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => {
                  setShowLicenseModal(false)
                  setShowPaymentModal(true)
                }}
              >
                Assinar {selectedLicense.name} - {selectedLicense.priceProvider.toLocaleString('pt-MZ')} MT
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💳 Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPaymentMethod === 'MANUAL' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Envie o comprovativo de pagamento para:</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Banco: BIM</p>
                  <p className="font-medium">Conta: 123456789</p>
                  <p className="font-medium">Referência: {user.provider?.id?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <Label>Número do Recibo/Transação</Label>
                  <Input placeholder="Ex: 12345678" />
                </div>
                <div>
                  <Label>Comprovativo (imagem)</Label>
                  <Input type="file" accept="image/*" />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Será redirecionado para:</p>
                <p className="text-2xl font-bold">{paymentMethodLabels[selectedPaymentMethod]}</p>
                <p className="text-lg font-bold text-green-600 mt-2">{selectedLicense?.priceProvider.toLocaleString('pt-MZ')} MT</p>
              </div>
            )}
            <Button className="w-full" onClick={() => setShowPaymentModal(false)}>
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal for Order */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📱 QR Code do Pedido</DialogTitle>
            <DialogDescription>
              Mostre este código para o entregador escanear
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForQR && (
            <div className="flex flex-col items-center py-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-purple-500">
                <div className="text-center">
                  <p className="text-4xl mb-2">📦</p>
                  <p className="font-mono text-xs font-bold">#{selectedOrderForQR.id.slice(-6)}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedOrderForQR.qrCode || `ORD-${selectedOrderForQR.id.slice(-8)}`}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                O entregador deve escanear este código para confirmar a retirada
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
                <p className="text-sm font-medium">Pedido #{selectedOrderForQR.id.slice(-6)}</p>
                <div className="mt-2 space-y-1">
                  {selectedOrderForQR.items.map(item => (
                    <p key={item.id} className="text-xs text-gray-600">
                      {item.quantity}x {item.product.name}
                    </p>
                  ))}
                </div>
                <Separator className="my-2" />
                <p className="font-bold text-green-600">
                  Total: {(selectedOrderForQR.totalAmount + selectedOrderForQR.deliveryFee).toLocaleString('pt-MZ')} MT
                </p>
                {selectedOrderForQR.paymentMethod === 'CASH' && (
                  <Badge className="bg-yellow-500 mt-2">💵 Pagamento em Dinheiro</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Rating Modal Component
function RatingModal({ 
  order, 
  user, 
  onClose, 
  onSubmit 
}: { 
  order: Order
  user: User
  onClose: () => void
  onSubmit: () => void
}) {
  const [providerRating, setProviderRating] = useState(5)
  const [providerComment, setProviderComment] = useState('')
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [deliveryComment, setDeliveryComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submitRating = async () => {
    setLoading(true)
    try {
      // Rate provider
      if (order.providerId) {
        await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            giverId: user.id,
            receiverId: order.providerId,
            rating: providerRating,
            comment: providerComment,
            targetType: 'PROVIDER',
          }),
        })
      }

      // Rate delivery person
      if (order.deliveryPersonId) {
        await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            giverId: user.id,
            receiverId: order.deliveryPersonId,
            rating: deliveryRating,
            comment: deliveryComment,
            targetType: 'DELIVERY',
          }),
        })
      }

      onSubmit()
      onClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>⭐ Avaliar Pedido</DialogTitle>
          <DialogDescription>Como foi sua experiência?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Provider Rating */}
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="font-medium mb-2">🏪 {order.provider?.storeName || 'Prestador'}</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`text-2xl ${star <= providerRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setProviderRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Comentário (opcional)"
              value={providerComment}
              onChange={e => setProviderComment(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Delivery Person Rating */}
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="font-medium mb-2">🏍️ {order.deliveryPerson?.user?.name || 'Entregador'}</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`text-2xl ${star <= deliveryRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setDeliveryRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Comentário (opcional)"
              value={deliveryComment}
              onChange={e => setDeliveryComment(e.target.value)}
              className="bg-white"
            />
          </div>

          <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500" onClick={submitRating} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', phone: '', userType: 'CLIENT' as UserType,
    address: '', vehicleType: 'MOTORCYCLE' as VehicleType, plateNumber: '',
    vehicleColor: '', vehicleBrand: '',
    storeName: '', storeDescription: '', category: '', storeAddress: '',
    cityId: '',
    profileImage: '',
    storeImage: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  
  const [providers, setProviders] = useState<Provider[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [availableDeliveryPersons, setAvailableDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [cities, setCities] = useState<City[]>([])
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'landing' | 'cart' | 'checkout' | 'orders' | 'delivery-request'>('landing')
  const [mainTab, setMainTab] = useState<'services' | 'delivery'>('services')
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('MPESA')

  const { location: userLocation, loading: locationLoading } = useLocation()

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const timer = setTimeout(() => setMapLoaded(true), 100)
    return () => {
      clearTimeout(timer)
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      const timer = setTimeout(() => setUser(parsedUser), 0)
      return () => clearTimeout(timer)
    }
  }, [])

  // Load cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch('/api/cities')
        const data = await res.json()
        setTimeout(() => setCities(data.cities || []), 0)
      } catch (error) {
        console.error('Error loading cities:', error)
      }
    }
    loadCities()
  }, [])

  // Load public data
  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const [providersRes, productsRes, deliveryRes] = await Promise.all([
          fetch('/api/providers'), fetch('/api/products'), fetch('/api/delivery-persons')
        ])
        const [providersData, productsData, deliveryData] = await Promise.all([
          providersRes.json(), productsRes.json(), deliveryRes.json()
        ])
        setProviders(providersData.providers || [])
        setAllProducts(productsData.products || [])
        setDeliveryPersons(deliveryData.deliveryPersons || [])
      } catch (error) {
        console.error('Error loading public data:', error)
      }
    }
    loadPublicData()
    
    // Refresh data every 5 seconds for near real-time updates
    const interval = setInterval(loadPublicData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Load user data when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      if (user.userType === 'CLIENT' && user.client?.id) {
        try {
          const res = await fetch(`/api/orders?clientId=${user.client.id}`)
          const data = await res.json()
          setOrders(data.orders || [])
          setDeliveryAddress(user.client?.address || '')
        } catch (error) {
          console.error('Error loading orders:', error)
        }
      }
    }
    loadUserData()
  }, [user])

  // Auth functions
  const login = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setShowAuthModal(false)
      } else {
        alert(data.error || 'Erro ao fazer login')
      }
    } catch {
      alert('Erro ao fazer login')
    }
    setLoading(false)
  }

  const register = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!registerForm.cityId) {
        alert('Cidade é obrigatória para concluir o cadastro!')
        setLoading(false)
        return
      }

      if (registerForm.userType === 'DELIVERY_PERSON' && !registerForm.plateNumber) {
        alert('Matrícula é obrigatória para entregadores!')
        setLoading(false)
        return
      }
      
      const body: Record<string, unknown> = {
        name: registerForm.name, email: registerForm.email, password: registerForm.password,
        phone: registerForm.phone, userType: registerForm.userType,
        profileImage: registerForm.profileImage,
      }
      if (registerForm.userType === 'CLIENT') {
        body.address = registerForm.address
        body.cityId = registerForm.cityId
      }
      else if (registerForm.userType === 'DELIVERY_PERSON') {
        body.vehicleType = registerForm.vehicleType
        body.plateNumber = registerForm.plateNumber // Required
        body.vehicleColor = registerForm.vehicleColor // Optional
        body.vehicleBrand = registerForm.vehicleBrand // Optional
        body.cityId = registerForm.cityId
      } else if (registerForm.userType === 'PROVIDER') {
        body.storeName = registerForm.storeName
        body.storeDescription = registerForm.storeDescription
        body.category = registerForm.category
        body.storeAddress = registerForm.storeAddress
        body.cityId = registerForm.cityId
        body.storeImage = registerForm.storeImage
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setShowAuthModal(false)
      } else {
        alert(data.error || 'Erro ao registrar')
      }
    } catch {
      alert('Erro ao registrar')
    }
    setLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setCart([])
    setOrders([])
    setView('landing')
  }

  // Cart functions
  const addToCart = (product: Product) => {
    if (!user) { setShowAuthModal(true); return }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
    } else {
      setCart(prev => prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const getCartItemCount = () => cart.reduce((count, item) => count + item.quantity, 0)
  
  const getDeliveryFee = useCallback(() => {
    if (!userLocation || cart.length === 0) return 100
    const firstProduct = cart[0].product
    const provider = providers.find(p => p.id === firstProduct.providerId)
    if (!provider?.latitude || !provider?.longitude) return 100
    return calculateDeliveryFee(calculateDistance(userLocation[0], userLocation[1], provider.latitude, provider.longitude))
  }, [userLocation, cart, providers])

  // Order functions
  const proceedToCheckout = async () => {
    if (!user) { setShowAuthModal(true); return }
    if (cart.length === 0) return
    
    const firstProduct = cart[0].product
    const provider = providers.find(p => p.id === firstProduct.providerId)
    
    try {
      const res = await fetch('/api/delivery-persons')
      const data = await res.json()
      
      // Calculate delivery fee and time for each delivery person
      const deliveryPersonsWithFees = (data.deliveryPersons || [])
        .filter((dp: DeliveryPerson) => dp.isAvailable && dp.currentLatitude && dp.currentLongitude)
        .map((dp: DeliveryPerson) => {
          const distanceToProvider = provider?.latitude && provider?.longitude && dp.currentLatitude && dp.currentLongitude
            ? calculateDistance(provider.latitude, provider.longitude, dp.currentLatitude, dp.currentLongitude)
            : 999
          const distanceToClient = userLocation && dp.currentLatitude && dp.currentLongitude
            ? calculateDistance(userLocation[0], userLocation[1], dp.currentLatitude, dp.currentLongitude)
            : 0
          const totalDistance = distanceToProvider + distanceToClient
          const fee = calculateDeliveryFee(totalDistance)
          const time = calculateTime(totalDistance, dp.vehicleType)
          
          return {
            ...dp,
            distance: totalDistance,
            deliveryFee: fee,
            estimatedTime: time,
          }
        })
        .sort((a: DeliveryPerson, b: DeliveryPerson) => a.distance - b.distance)
      
      setAvailableDeliveryPersons(deliveryPersonsWithFees)
      setView('checkout')
    } catch (error) {
      console.error('Error loading delivery persons:', error)
    }
  }

  const createOrder = async () => {
    if (!user?.client?.id || cart.length === 0) return
    setLoading(true)
    try {
      const providerId = cart[0].product.providerId
      if (!providerId) { alert('Erro: produto sem fornecedor'); setLoading(false); return }

      // Calculate delivery fee using API
      const provider = providers.find(p => p.id === providerId)
      let deliveryFee = getDeliveryFee()
      
      if (provider?.latitude && provider?.longitude && userLocation) {
        try {
          const feeRes = await fetch('/api/delivery-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originLat: provider.latitude,
              originLng: provider.longitude,
              destLat: userLocation[0],
              destLng: userLocation[1],
              cityId: user.client?.cityId,
            }),
          })
          const feeData = await feeRes.json()
          if (feeData.fee) deliveryFee = feeData.fee
        } catch (error) {
          console.error('Error calculating delivery fee:', error)
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.client.id,
          providerId,
          items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
          deliveryAddress,
          deliveryFee,
          deliveryPersonId: selectedDeliveryPerson?.id,
          paymentMethod: selectedPaymentMethod,
        }),
      })
      const data = await res.json()
      
      if (data.order) {
        setCart([])
        setSelectedDeliveryPerson(null)
        setView('orders')
        const ordersRes = await fetch(`/api/orders?clientId=${user.client.id}`)
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
        alert('Pedido criado com sucesso!')
      } else {
        alert(data.error || 'Erro ao criar pedido')
      }
    } catch (error) {
      console.error('Create order error:', error)
      alert('Erro ao criar pedido')
    }
    setLoading(false)
  }

  // Filter functions
  const getFilteredProducts = () => {
    let filtered = allProducts
    if (selectedProvider) {
      filtered = filtered.filter(p => p.providerId === selectedProvider.id)
    }
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

  // Sort delivery persons by distance
  const getSortedDeliveryPersons = () => {
    if (!userLocation) return deliveryPersons
    return [...deliveryPersons]
      .filter(dp => dp.currentLatitude && dp.currentLongitude)
      .map(dp => ({
        ...dp,
        distance: calculateDistance(userLocation[0], userLocation[1], dp.currentLatitude!, dp.currentLongitude!)
      }))
      .sort((a, b) => a.distance - b.distance)
  }

  const refreshData = async () => {
    try {
      const [providersRes, productsRes] = await Promise.all([
        fetch('/api/providers'), fetch('/api/products')
      ])
      const [providersData, productsData] = await Promise.all([
        providersRes.json(), productsRes.json()
      ])
      setProviders(providersData.providers || [])
      setAllProducts(productsData.products || [])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl">🛵</span>
            </div>
            <div>
              <h1 className="font-bold text-xl">EntregasMoz</h1>
              <p className="text-xs text-white/80">Entregas em Moçambique</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.userType === 'CLIENT' && (
                  <>
                    <Button variant="ghost" className="text-white relative hover:bg-white/20" onClick={() => setView('cart')}>
                      🛒
                      {getCartItemCount() > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs">{getCartItemCount()}</Badge>
                      )}
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setView('orders')}>📦</Button>
                  </>
                )}
                <Separator orientation="vertical" className="h-6 bg-white/30" />
                <span className="text-sm hidden md:block">
                  {user.userType === 'ADMIN' ? '👑 Admin' : user.name}
                </span>
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={logout}>👋</Button>
              </>
            ) : (
              <Button className="bg-white text-orange-600 hover:bg-orange-100 font-bold px-4" onClick={() => setShowAuthModal(true)}>
                🔐 Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {authTab === 'login' ? '🔐 Entrar' : '✨ Criar Conta'}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input type="password" placeholder="••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={login} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-3 mt-3">
              {/* Photo Upload for All Users */}
              <div className="space-y-1">
                <Label>Foto de Perfil</Label>
                <div className="flex gap-2 items-center">
                  {registerForm.profileImage && (
                    <img src={registerForm.profileImage} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
                  )}
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setRegisterForm({ ...registerForm, profileImage: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Tipo de Conta</Label>
                <Select value={registerForm.userType} onValueChange={(v) => setRegisterForm({ ...registerForm, userType: v as UserType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">👤 Cliente</SelectItem>
                    <SelectItem value="DELIVERY_PERSON">🏍️ Entregador</SelectItem>
                    <SelectItem value="PROVIDER">🏪 Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input type="password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              </div>

              {/* City Selection */}
              <div className="space-y-1">
                <Label>Cidade *</Label>
                <Select value={registerForm.cityId} onValueChange={(v) => setRegisterForm({ ...registerForm, cityId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
                  <SelectContent>
                    {cities.filter(c => c.isActive).map(city => (
                      <SelectItem key={city.id} value={city.id}>{city.name} - {city.province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!registerForm.cityId && <p className="text-xs text-red-500">Cidade é obrigatória</p>}
              </div>

              {registerForm.userType === 'CLIENT' && (
                <div className="space-y-1">
                  <Label>Endereço</Label>
                  <Input value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} />
                </div>
              )}

              {registerForm.userType === 'DELIVERY_PERSON' && (
                <>
                  <div className="space-y-1">
                    <Label>Veículo</Label>
                    <Select value={registerForm.vehicleType} onValueChange={(v) => setRegisterForm({ ...registerForm, vehicleType: v as VehicleType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOTORCYCLE">🏍️ Motocicleta</SelectItem>
                        <SelectItem value="BICYCLE">🚲 Bicicleta</SelectItem>
                        <SelectItem value="CAR">🚗 Carro</SelectItem>
                        <SelectItem value="SCOOTER">🛵 Scooter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Matrícula <span className="text-red-500">*</span></Label>
                    <Input 
                      value={registerForm.plateNumber} 
                      onChange={e => setRegisterForm({ ...registerForm, plateNumber: e.target.value })}
                      placeholder="Obrigatório"
                      className={!registerForm.plateNumber ? 'border-red-300' : ''}
                    />
                    {!registerForm.plateNumber && <p className="text-xs text-red-500">Campo obrigatório</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Marca do Veículo <span className="text-gray-400 text-xs">(opcional)</span></Label>
                      <Input 
                        value={registerForm.vehicleBrand} 
                        onChange={e => setRegisterForm({ ...registerForm, vehicleBrand: e.target.value })}
                        placeholder="Ex: Honda"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Cor do Veículo <span className="text-gray-400 text-xs">(opcional)</span></Label>
                      <Input 
                        value={registerForm.vehicleColor} 
                        onChange={e => setRegisterForm({ ...registerForm, vehicleColor: e.target.value })}
                        placeholder="Ex: Vermelho"
                      />
                    </div>
                  </div>
                </>
              )}

              {registerForm.userType === 'PROVIDER' && (
                <>
                  <div className="space-y-1">
                    <Label>Nome da Loja</Label>
                    <Input value={registerForm.storeName} onChange={e => setRegisterForm({ ...registerForm, storeName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select value={registerForm.category} onValueChange={(v) => setRegisterForm({ ...registerForm, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurante">Restaurante</SelectItem>
                        <SelectItem value="Pizzaria">Pizzaria</SelectItem>
                        <SelectItem value="Mercado">Mercado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Endereço da Loja</Label>
                    <Input value={registerForm.storeAddress} onChange={e => setRegisterForm({ ...registerForm, storeAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Foto da Loja</Label>
                    <div className="flex gap-2 items-center">
                      {registerForm.storeImage && (
                        <img src={registerForm.storeImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover border-2 border-green-500" />
                      )}
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setRegisterForm({ ...registerForm, storeImage: reader.result as string })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={register} disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* ADMIN DASHBOARD */}
        {user?.userType === 'ADMIN' && (
          <AdminDashboard user={user} onRefresh={refreshData} />
        )}

        {/* DELIVERY PERSON DASHBOARD */}
        {user?.userType === 'DELIVERY_PERSON' && (
          <div className="space-y-4">
            <DeliveryPersonTracker user={user} cities={cities} onLicenseRenew={refreshData} />
            
            {/* Mini Map showing delivery person's location */}
            {mapLoaded && userLocation && (
              <Card className="shadow-lg">
                <CardHeader className="py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🗺️ Sua Localização no Mapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[300px] rounded-b-lg overflow-hidden">
                    <MapContainer
                      center={userLocation}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Circle 
                        center={userLocation} 
                        radius={200}
                        pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2 }}
                      />
                      <MiniMapMarker position={userLocation} />
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* PROVIDER DASHBOARD */}
        {user?.userType === 'PROVIDER' && (
          <ProviderDashboard user={user} providers={providers} onRefresh={refreshData} />
        )}

        {/* CLIENT / LANDING VIEW */}
        {view === 'landing' && user?.userType !== 'DELIVERY_PERSON' && user?.userType !== 'PROVIDER' && user?.userType !== 'ADMIN' && (
          <LandingPage
            user={user}
            providers={providers}
            products={allProducts}
            deliveryPersons={deliveryPersons}
            onLoginClick={() => setShowAuthModal(true)}
            onAddToCart={(product) => addToCart(product)}
            onDeliveryRequest={() => user ? setView('delivery-request') : setShowAuthModal(true)}
          />
        )}

        {/* DELIVERY REQUEST VIEW */}
        {view === 'delivery-request' && user && user.userType === 'CLIENT' && (
          <div className="py-6">
            {/* Use dynamic import for delivery request panel */}
            {(() => {
              const DeliveryRequestPanel = dynamic(
                () => import('@/components/delivery/DeliveryRequestPanel'),
                { ssr: false, loading: () => <div className="p-8 text-center">Carregando...</div> }
              )
              return (
                <DeliveryRequestPanel
                  user={{ id: user.id, name: user.name, phone: user.phone || undefined }}
                  onClose={() => setView('landing')}
                />
              )
            })()}
          </div>
        )}

        {/* CART VIEW */}
        {view === 'cart' && user && user.userType === 'CLIENT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">🛒 Carrinho</h2>
              <Button variant="outline" size="sm" onClick={() => setView('landing')}>← Voltar</Button>
            </div>
            {cart.length === 0 ? (
              <Card><CardContent className="py-8 text-center">
                <p className="text-gray-500">Carrinho vazio</p>
                <Button className="mt-2 bg-orange-500" onClick={() => setView('landing')}>Ver Produtos</Button>
              </CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  {cart.map(item => (
                    <Card key={item.product.id}>
                      <CardContent className="py-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">{item.product.price.toLocaleString('pt-MZ')} MT</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>-</Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>+</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="h-fit sticky top-20">
                  <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{getCartTotal().toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Entrega</span>
                      <span>{getDeliveryFee()} MT</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-green-600">{(getCartTotal() + getDeliveryFee()).toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <Button className="w-full bg-orange-500" onClick={proceedToCheckout}>
                      Finalizar →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT VIEW with Delivery Person Selection */}
        {view === 'checkout' && user && user.userType === 'CLIENT' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">📍 Checkout</h2>
              <Button variant="outline" size="sm" onClick={() => setView('cart')}>← Voltar</Button>
            </div>

            {/* Delivery Address */}
            <Card>
              <CardHeader><CardTitle className="text-sm">📍 Endereço de Entrega</CardTitle></CardHeader>
              <CardContent>
                <Textarea 
                  value={deliveryAddress} 
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                />
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader><CardTitle className="text-sm">💳 Método de Pagamento</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(['MPESA', 'EMOLA', 'VISA', 'CASH'] as PaymentMethod[]).map(method => (
                    <Button
                      key={method}
                      variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                      className={`h-16 flex flex-col gap-1 ${selectedPaymentMethod === method ? 'bg-green-500' : ''}`}
                      onClick={() => setSelectedPaymentMethod(method)}
                    >
                      <span className="text-lg">
                        {method === 'MPESA' ? '📱' : method === 'EMOLA' ? '📱' : method === 'VISA' ? '💳' : '💵'}
                      </span>
                      <span className="text-xs">{paymentMethodLabels[method]}</span>
                    </Button>
                  ))}
                </div>
                {selectedPaymentMethod === 'CASH' && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      💵 Você pagará em dinheiro no momento da entrega. Prepare o valor exato!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Person Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏍️ Escolha o Entregador</CardTitle>
                <CardDescription>Selecione o entregador de sua preferência</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableDeliveryPersons.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhum entregador disponível no momento</p>
                  ) : (
                    availableDeliveryPersons.slice(0, 5).map((dp) => (
                      <div 
                        key={dp.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedDeliveryPerson?.id === dp.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDeliveryPerson(dp)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                            {dp.user?.profileImage ? (
                              <img src={dp.user.profileImage} alt={dp.user.name} className="w-full h-full object-cover" />
                            ) : (
                              vehicleIcons[dp.vehicleType]
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dp.user?.name || 'Entregador'}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>⭐ {dp.rating.toFixed(1)}</span>
                              <span>{dp.totalDeliveries} entregas</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{dp.deliveryFee?.toLocaleString('pt-MZ') || getDeliveryFee()} MT</p>
                            <p className="text-xs text-gray-500">~{Math.round(dp.estimatedTime || 15)} min</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📍 {(dp.distance || 0).toFixed(1)} km de distância</span>
                          <span>🏍️ {dp.vehicleType === 'MOTORCYCLE' ? 'Motocicleta' : dp.vehicleType === 'BICYCLE' ? 'Bicicleta' : dp.vehicleType === 'CAR' ? 'Carro' : 'Scooter'}</span>
                          {dp.plateNumber && <span>🪪 {dp.plateNumber}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader><CardTitle className="text-sm">📋 Resumo do Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>{(item.product.price * item.quantity).toLocaleString('pt-MZ')} MT</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{getCartTotal().toLocaleString('pt-MZ')} MT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>🚚 Taxa de Entrega</span>
                  <span className="font-medium text-green-600">
                    {(selectedDeliveryPerson?.deliveryFee || getDeliveryFee()).toLocaleString('pt-MZ')} MT
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">
                    {(getCartTotal() + (selectedDeliveryPerson?.deliveryFee || getDeliveryFee())).toLocaleString('pt-MZ')} MT
                  </span>
                </div>
                <div className="mt-2">
                  <Badge className={selectedPaymentMethod === 'CASH' ? 'bg-yellow-500' : 'bg-green-500'}>
                    {paymentMethodLabels[selectedPaymentMethod]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setView('cart')}>
                ← Voltar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600" 
                onClick={createOrder} 
                disabled={loading || !deliveryAddress}
              >
                {loading ? 'Processando...' : 'Confirmar Pedido ✓'}
              </Button>
            </div>
          </div>
        )}

        {/* ORDERS VIEW with Rating */}
        {view === 'orders' && user && user.userType === 'CLIENT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">📦 Meus Pedidos</h2>
              <Button variant="outline" size="sm" onClick={() => setView('landing')}>← Voltar</Button>
            </div>
            {orders.length === 0 ? (
              <Card><CardContent className="py-8 text-center">
                <p className="text-gray-500">Nenhum pedido</p>
                <Button className="mt-2 bg-orange-500" onClick={() => setView('landing')}>Fazer Pedido</Button>
              </CardContent></Card>
            ) : (
              orders.map(order => (
                <Card key={order.id}>
                  <div className={`h-1 ${statusConfig[order.status].color}`} />
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">#{order.id.slice(-6)}</span>
                      <Badge className={`${statusConfig[order.status].color} text-white text-xs`}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span>{(item.price * item.quantity).toLocaleString('pt-MZ')} MT</span>
                        </div>
                      ))}
                    </div>
                    {order.deliveryPerson && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>🏍️ {order.deliveryPerson.user.name}</span>
                        <span>⭐ {order.deliveryPerson.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <div className="font-bold">
                        <span>Total: </span>
                        <span className="text-green-600">{(order.totalAmount + order.deliveryFee).toLocaleString('pt-MZ')} MT</span>
                      </div>
                      {order.status === 'DELIVERED' && !order.ratings?.length && (
                        <Button 
                          size="sm" 
                          className="bg-yellow-500"
                          onClick={() => {
                            setRatingOrder(order)
                            setShowRatingModal(true)
                          }}
                        >
                          ⭐ Avaliar
                        </Button>
                      )}
                      {order.status === 'DELIVERED' && order.ratings?.length && (
                        <Badge className="bg-green-500">✓ Avaliado</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && ratingOrder && user && (
          <RatingModal
            order={ratingOrder}
            user={user}
            onClose={() => {
              setShowRatingModal(false)
              setRatingOrder(null)
            }}
            onSubmit={() => {
              // Refresh orders
              if (user.client?.id) {
                fetch(`/api/orders?clientId=${user.client.id}`)
                  .then(res => res.json())
                  .then(data => setOrders(data.orders || []))
              }
            }}
          />
        )}
      </main>
    </div>
  )
}
