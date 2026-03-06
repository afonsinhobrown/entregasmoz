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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Switch } from '@/components/ui/switch'

// Dynamically import Map component (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Types
type UserType = 'CLIENT' | 'DELIVERY_PERSON' | 'PROVIDER'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'
type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'SCOOTER'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  userType: UserType
  client?: { id: string; address?: string; latitude?: number; longitude?: number }
  deliveryPerson?: { id: string; vehicleType: VehicleType; isAvailable: boolean; rating: number; totalDeliveries: number; currentLatitude?: number; currentLongitude?: number }
  provider?: { id: string; storeName: string; storeDescription?: string; category?: string; address?: string; latitude?: number; longitude?: number; isOpen: boolean }
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
  products: Product[]
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
  user?: { name: string }
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  deliveryFee: number
  deliveryAddress?: string
  createdAt: string
  items: { id: string; productId: string; quantity: number; price: number; product: Product }[]
  provider?: { storeName: string }
  deliveryPerson?: { user: { name: string }; rating: number; vehicleType: VehicleType }
}

interface CartItem { product: Product; quantity: number }

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

// Leaflet reference (loaded dynamically)
let leafletLib: typeof import('leaflet').default | null = null

const getLeaflet = async () => {
  if (!leafletLib && typeof window !== 'undefined') {
    leafletLib = await import('leaflet').then(m => m.default)
  }
  return leafletLib
}

// Custom marker icon
const createCustomIcon = (emoji: string, color: string = 'blue') => {
  if (typeof window === 'undefined' || !leafletLib) return null
  return leafletLib.divIcon({
    html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
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
  onProviderSelect 
}: { 
  userLocation: [number, number]
  providers: Provider[]
  deliveryPersons: DeliveryPerson[]
  user: User | null
  onLoginClick: () => void
  onProviderSelect: (provider: Provider) => void
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
          icon={createCustomIcon('📍', '#3B82F6')}
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
              icon={createCustomIcon(emoji, color)}
            >
              <Popup>
                <div className="p-2 min-w-56">
                  <p className="font-bold text-lg">{provider.storeName}</p>
                  <p className="text-sm text-gray-500">{provider.category}</p>
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
              icon={createCustomIcon(vehicleIcons[dp.vehicleType], '#10B981')}
            >
              <Popup>
                <div className="p-2 min-w-52">
                  {user ? (
                    <>
                      <p className="font-bold text-lg">{dp.user?.name || 'Entregador'}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <span>⭐ {dp.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{dp.totalDeliveries} entregas</span>
                      </div>
                      <Badge className={dp.isAvailable ? 'bg-green-500 mt-2' : 'bg-gray-500 mt-2'}>
                        {dp.isAvailable ? 'Disponível' : 'Ocupado'}
                      </Badge>
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
function DeliveryPersonTracker({ user }: { user: User }) {
  const { location } = useLocation()
  const [isAvailable, setIsAvailable] = useState(user.deliveryPerson?.isAvailable ?? false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (location && user.deliveryPerson?.id) {
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
      }).then(() => setLastUpdate(new Date()))
    }
  }, [location, user.id, user.deliveryPerson?.id, isAvailable])

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

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🏍️ Painel do Entregador
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status</p>
            <p className="text-sm text-gray-500">
              {isAvailable ? '🟢 Disponível para entregas' : '🔴 Indisponível'}
            </p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={toggleAvailability}
          />
        </div>
        
        {location && (
          <div className="text-sm text-gray-500">
            <p>📍 Localização atual:</p>
            <p className="font-mono text-xs">
              {location[0].toFixed(6)}, {location[1].toFixed(6)}
            </p>
          </div>
        )}
        
        {lastUpdate && (
          <p className="text-xs text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-MZ')}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-500">
              {user.deliveryPerson?.totalDeliveries || 0}
            </p>
            <p className="text-xs text-gray-500">Entregas</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-500">
              ⭐ {user.deliveryPerson?.rating.toFixed(1) || '5.0'}
            </p>
            <p className="text-xs text-gray-500">Avaliação</p>
          </div>
        </div>
      </CardContent>
    </Card>
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
    storeName: '', storeDescription: '', category: '', storeAddress: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  
  const [providers, setProviders] = useState<Provider[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [availableDeliveryPersons, setAvailableDeliveryPersons] = useState<DeliveryPerson[]>([])
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'landing' | 'cart' | 'checkout' | 'orders'>('landing')
  const [mainTab, setMainTab] = useState<'services' | 'delivery'>('services')
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

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
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(loadPublicData, 30000)
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
      const body: Record<string, unknown> = {
        name: registerForm.name, email: registerForm.email, password: registerForm.password,
        phone: registerForm.phone, userType: registerForm.userType,
      }
      if (registerForm.userType === 'CLIENT') body.address = registerForm.address
      else if (registerForm.userType === 'DELIVERY_PERSON') {
        body.vehicleType = registerForm.vehicleType
        body.plateNumber = registerForm.plateNumber
      } else if (registerForm.userType === 'PROVIDER') {
        body.storeName = registerForm.storeName
        body.storeDescription = registerForm.storeDescription
        body.category = registerForm.category
        body.storeAddress = registerForm.storeAddress
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
    try {
      const res = await fetch('/api/delivery-persons')
      const data = await res.json()
      setAvailableDeliveryPersons(data.deliveryPersons || [])
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

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.client.id,
          providerId,
          items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
          deliveryAddress,
          deliveryFee: getDeliveryFee(),
        }),
      })
      const data = await res.json()
      
      if (data.order) {
        if (selectedDeliveryPerson?.id) {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.order.id, deliveryPersonId: selectedDeliveryPerson.id }),
          })
        }
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
                <span className="text-sm hidden md:block">{user.name}</span>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Matrícula</Label>
                    <Input value={registerForm.plateNumber} onChange={e => setRegisterForm({ ...registerForm, plateNumber: e.target.value })} />
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
                    <Label>Endereço</Label>
                    <Input value={registerForm.storeAddress} onChange={e => setRegisterForm({ ...registerForm, storeAddress: e.target.value })} />
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
        {/* DELIVERY PERSON DASHBOARD */}
        {user?.userType === 'DELIVERY_PERSON' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <DeliveryPersonTracker user={user} />
            </div>
            <div className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">📊 Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-500">{user.deliveryPerson?.totalDeliveries || 0}</p>
                    <p className="text-xs text-gray-500">Entregas</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-500">⭐ {user.deliveryPerson?.rating.toFixed(1) || '5.0'}</p>
                    <p className="text-xs text-gray-500">Avaliação</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CLIENT / LANDING VIEW */}
        {user?.userType !== 'DELIVERY_PERSON' && (
          <>
            {/* Main Tabs */}
            <div className="flex gap-2 mb-4">
              <Button 
                className={`flex-1 py-2 text-base font-medium ${mainTab === 'services' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMainTab('services')}
              >
                🏪 Serviços
              </Button>
              <Button 
                className={`flex-1 py-2 text-base font-medium ${mainTab === 'delivery' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMainTab('delivery')}
              >
                🏍️ Entregadores Perto
              </Button>
            </div>

            {/* Search */}
            <Input 
              className="bg-white shadow-md mb-4"
              placeholder="🔍 Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {/* Categories */}
            <div className="bg-white rounded-lg shadow p-2 mb-4 overflow-x-auto">
              <div className="flex gap-1">
                {categories.map(cat => (
                  <Button 
                    key={cat.id}
                    size="sm"
                    variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                    className={`rounded-full ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Map */}
            {mapLoaded && userLocation && (
              <div className="mb-4">
                <RealMap 
                  userLocation={userLocation}
                  providers={getFilteredProviders()}
                  deliveryPersons={deliveryPersons}
                  user={user}
                  onLoginClick={() => setShowAuthModal(true)}
                  onProviderSelect={(p) => {
                    setSelectedProvider(p)
                    setSearchQuery(p.storeName)
                  }}
                />
              </div>
            )}

            {/* Nearby Delivery Persons List */}
            {mainTab === 'delivery' && (
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🏍️ Entregadores Próximos
                  <Badge className="bg-green-500">{getSortedDeliveryPersons().length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getSortedDeliveryPersons().slice(0, 6).map((dp) => {
                    const timeMinutes = calculateTime(dp.distance, dp.vehicleType)
                    return (
                      <Card key={dp.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-2xl">
                            {vehicleIcons[dp.vehicleType]}
                          </div>
                          <div className="flex-1">
                            {user ? (
                              <p className="font-medium">{dp.user?.name || 'Entregador'}</p>
                            ) : (
                              <p className="font-medium text-gray-400">🔒 Entregador</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>📍 {dp.distance.toFixed(1)} km</span>
                              <span>⏱️ {Math.round(timeMinutes)} min</span>
                              <span>⭐ {dp.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <Badge className={dp.isAvailable ? 'bg-green-500' : 'bg-gray-400'}>
                            {dp.isAvailable ? 'Disponível' : 'Ocupado'}
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Services/Products */}
            {mainTab === 'services' && (
              <>
                {/* Providers */}
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🏪 Fornecedores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {getFilteredProviders().map(provider => {
                    const distance = userLocation && provider.latitude && provider.longitude
                      ? calculateDistance(userLocation[0], userLocation[1], provider.latitude, provider.longitude)
                      : null
                    const deliveryFee = distance ? calculateDeliveryFee(distance) : null
                    
                    return (
                      <Card 
                        key={provider.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedProvider?.id === provider.id ? 'ring-2 ring-orange-500' : ''}`}
                        onClick={() => setSelectedProvider(selectedProvider?.id === provider.id ? null : provider)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg flex items-center justify-center text-2xl">
                              {provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : '🛒'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{provider.storeName}</p>
                                <Badge className={provider.isOpen ? 'bg-green-500' : 'bg-red-500'} variant="secondary">
                                  {provider.isOpen ? 'Aberto' : 'Fechado'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{provider.category} • {provider.products.length} produtos</p>
                              {distance && (
                                <p className="text-xs text-orange-600 font-medium">
                                  📍 {distance.toFixed(1)} km • 🚚 {deliveryFee} MT
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Products */}
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🍽️ Produtos
                  {selectedProvider && (
                    <Button size="sm" variant="ghost" onClick={() => setSelectedProvider(null)}>
                      ✕ Limpar filtro
                    </Button>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {getFilteredProducts().map(product => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl shrink-0">
                            {product.name.toLowerCase().includes('pizza') ? '🍕' : 
                             product.name.toLowerCase().includes('coca') ? '🥤' : 
                             product.name.toLowerCase().includes('hamb') ? '🍔' : '🍽️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">{product.provider?.storeName}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge className="bg-green-500">{product.price.toLocaleString('pt-MZ')} MT</Badge>
                              <Button size="sm" onClick={() => addToCart(product)}>
                                +
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* CART VIEW */}
        {view === 'cart' && user && (
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

        {/* CHECKOUT VIEW */}
        {view === 'checkout' && user && (
          <div className="max-w-lg mx-auto space-y-4">
            <h2 className="text-xl font-bold">📍 Finalizar</h2>
            <Card>
              <CardHeader><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">🏍️ Entregador</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {availableDeliveryPersons.slice(0, 3).map((dp, i) => (
                  <div 
                    key={dp.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer ${selectedDeliveryPerson?.id === dp.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedDeliveryPerson(dp)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{vehicleIcons[dp.vehicleType]}</span>
                      <div>
                        <p className="font-medium text-sm">{dp.user?.name || `Entregador ${i+1}`}</p>
                        <p className="text-xs text-gray-500">⭐ {dp.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{(getCartTotal() + getDeliveryFee()).toLocaleString('pt-MZ')} MT</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setView('cart')}>Voltar</Button>
                  <Button className="flex-1 bg-orange-500" onClick={createOrder} disabled={loading || !deliveryAddress}>
                    {loading ? '...' : 'Confirmar ✓'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ORDERS VIEW */}
        {view === 'orders' && user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">📦 Pedidos</h2>
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
                    <div className="space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span>{(item.price * item.quantity).toLocaleString('pt-MZ')} MT</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{(order.totalAmount + order.deliveryFee).toLocaleString('pt-MZ')} MT</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
