'use client'

import { useState, useEffect } from 'react'
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
import L from 'leaflet'

// Dynamically import Map component (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

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
  client?: { id: string; address?: string }
  deliveryPerson?: { id: string; vehicleType: VehicleType; isAvailable: boolean; rating: number; totalDeliveries: number }
  provider?: { id: string; storeName: string; storeDescription?: string; category?: string; address?: string; isOpen: boolean }
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
const MAPUTO_CENTER: [number, number] = [-25.9692, 32.5732]

// Custom marker icons
const createCustomIcon = (emoji: string, color: string = 'blue') => {
  if (typeof window === 'undefined') return null
  return L.divIcon({
    html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Real Map Component
function RealMap({ providers, deliveryPersons, user, onLoginClick }: { 
  providers: Provider[], 
  deliveryPersons: DeliveryPerson[], 
  user: User | null,
  onLoginClick: () => void 
}) {
  const [mounted, setMounted] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    setMounted(true)
    // Try to get user's real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          // Default to Maputo if location not available
          setUserLocation(MAPUTO_CENTER)
        }
      )
    } else {
      setUserLocation(MAPUTO_CENTER)
    }
  }, [])

  if (!mounted || !userLocation) {
    return (
      <div className="h-96 bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">🗺️</div>
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-xl border-2 border-gray-200">
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
        
        {/* User Location Marker */}
        <Marker 
          position={userLocation}
          icon={createCustomIcon('📍', '#3B82F6')}
        >
          <Popup>
            <div className="text-center">
              <p className="font-bold">📍 Sua Localização</p>
            </div>
          </Popup>
        </Marker>

        {/* Provider Markers */}
        {providers.map((provider) => {
          const lat = provider.latitude || MAPUTO_CENTER[0] + (Math.random() - 0.5) * 0.02
          const lng = provider.longitude || MAPUTO_CENTER[1] + (Math.random() - 0.5) * 0.02
          const emoji = provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : '🛒'
          const color = provider.isOpen ? '#22C55E' : '#EF4444'
          
          return (
            <Marker 
              key={provider.id}
              position={[lat, lng]}
              icon={createCustomIcon(emoji, color)}
            >
              <Popup>
                <div className="p-1 min-w-48">
                  <p className="font-bold text-lg">{provider.storeName}</p>
                  <p className="text-sm text-gray-500">{provider.category}</p>
                  <p className="text-xs mt-1">{provider.address || 'Maputo'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={provider.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                      {provider.isOpen ? 'Aberto' : 'Fechado'}
                    </Badge>
                    <span className="text-xs">{provider.products.length} produtos</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Delivery Person Markers */}
        {deliveryPersons.map((dp) => {
          const lat = dp.currentLatitude || MAPUTO_CENTER[0] + (Math.random() - 0.5) * 0.03
          const lng = dp.currentLongitude || MAPUTO_CENTER[1] + (Math.random() - 0.5) * 0.03
          
          return (
            <Marker 
              key={dp.id}
              position={[lat, lng]}
              icon={createCustomIcon(vehicleIcons[dp.vehicleType], '#10B981')}
            >
              <Popup>
                <div className="p-1 min-w-48">
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
                    <>
                      <p className="font-bold text-gray-400">🔒 Entregador</p>
                      <p className="text-sm text-gray-500">Faça login para ver detalhes</p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-orange-500 text-white"
                        onClick={onLoginClick}
                      >
                        Entrar
                      </Button>
                    </>
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

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const timer = setTimeout(() => setMapLoaded(true), 100)
    return () => {
      clearTimeout(timer)
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
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
          deliveryFee: 100,
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

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🛵</span>
            </div>
            <div>
              <h1 className="font-bold text-2xl">EntregasMoz</h1>
              <p className="text-xs text-white/80">Entregas rápidas em Moçambique</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" className="text-white relative hover:bg-white/20" onClick={() => setView('cart')}>
                  🛒 Carrinho
                  {getCartItemCount() > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1.5">
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setView('orders')}>
                  📦 Pedidos
                </Button>
                <Separator orientation="vertical" className="h-8 bg-white/30" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={logout}>
                  Sair 👋
                </Button>
              </>
            ) : (
              <Button className="bg-white text-orange-600 hover:bg-orange-100 font-bold px-6 shadow-lg" onClick={() => setShowAuthModal(true)}>
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
            <DialogTitle className="text-center text-2xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {authTab === 'login' ? '🔐 Entrar na Conta' : '✨ Criar Nova Conta'}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" placeholder="••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={login} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              </div>

              {registerForm.userType === 'CLIENT' && (
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} />
                </div>
              )}

              {registerForm.userType === 'DELIVERY_PERSON' && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Veículo</Label>
                    <Select value={registerForm.vehicleType} onValueChange={(v) => setRegisterForm({ ...registerForm, vehicleType: v as VehicleType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOTORCYCLE">🏍️ Motocicleta</SelectItem>
                        <SelectItem value="BICYCLE">🚲 Bicicleta</SelectItem>
                        <SelectItem value="CAR">🚗 Carro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input value={registerForm.plateNumber} onChange={e => setRegisterForm({ ...registerForm, plateNumber: e.target.value })} />
                  </div>
                </>
              )}

              {registerForm.userType === 'PROVIDER' && (
                <>
                  <div className="space-y-2">
                    <Label>Nome da Loja</Label>
                    <Input value={registerForm.storeName} onChange={e => setRegisterForm({ ...registerForm, storeName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea value={registerForm.storeDescription} onChange={e => setRegisterForm({ ...registerForm, storeDescription: e.target.value })} />
                  </div>
                  <div className="space-y-2">
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
          <p className="text-xs text-center text-gray-500 border-t pt-3">
            Teste: ana@email.com, joao@email.com, sabor@email.com (senha: 123456)
          </p>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* LANDING VIEW */}
        {(view === 'landing' || !user) && (
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
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
                  🏍️ Entregadores Perto de Mim
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
                      <HoverCard key={provider.id} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                            <div className="flex">
                              <div className="w-32 h-32 bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 flex items-center justify-center text-5xl shrink-0">
                                {provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : '🛒'}
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
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4 shadow-xl border-0" side="right">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-2xl text-white">
                                {provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : '🛒'}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{provider.storeName}</h3>
                                <p className="text-sm text-gray-500">{provider.category}</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">{provider.storeDescription}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>📍</span>
                                <span>{provider.address || 'Maputo, Moçambique'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span>📦</span>
                                <span className="font-medium">{provider.products.length} produtos disponíveis</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span>🕐</span>
                                <span className={provider.isOpen ? 'text-green-600 font-medium' : 'text-red-500'}>
                                  {provider.isOpen ? 'Aberto agora' : 'Fechado'}
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-orange-500 to-red-500 shadow-md" 
                              onClick={() => setSearchQuery(provider.storeName)}
                            >
                              Ver Produtos →
                            </Button>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>

                  {/* Products Feed */}
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🍽️ Produtos em Destaque
                    <Badge variant="secondary" className="text-sm">{getFilteredProducts().length}</Badge>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFilteredProducts().map(product => (
                      <HoverCard key={product.id} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Card className="overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1">
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
                                      {product.price.toLocaleString('pt-MZ')} MT
                                    </Badge>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      🏪 {product.provider?.storeName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 p-4 shadow-xl" side="top">
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg">{product.name}</h3>
                            <p className="text-sm text-gray-600">{product.description}</p>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Preço:</span>
                                <span className="text-xl font-bold text-green-600">{product.price.toLocaleString('pt-MZ')} MT</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>🏪</span>
                                <span>{product.provider?.storeName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>📍</span>
                                <span>{product.provider?.address || 'Maputo'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>📂</span>
                                <span>{product.provider?.category}</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-orange-500 to-red-500" 
                              onClick={() => addToCart(product)}
                            >
                              {user ? '🛒 Adicionar ao Carrinho' : '🔐 Entrar para Pedir'}
                            </Button>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </>
              )}

              {/* DELIVERY PERSONS TAB - REAL MAP */}
              {mainTab === 'delivery' && (
                <>
                  {/* Real Map */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        🗺️ Mapa em Tempo Real
                        <Badge className="bg-green-500 animate-pulse">Ao Vivo</Badge>
                      </h2>
                    </div>
                    
                    {mapLoaded && (
                      <RealMap 
                        providers={providers}
                        deliveryPersons={deliveryPersons}
                        user={user}
                        onLoginClick={() => setShowAuthModal(true)}
                      />
                    )}
                    
                    <div className="mt-3 flex flex-wrap gap-4 justify-center text-sm bg-white p-3 rounded-lg shadow">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                        <span>🍴 Restaurantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                        <span>🍕 Pizzarias</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                        <span>🛒 Mercados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-emerald-500 rounded-full"></span>
                        <span>🏍️ Entregadores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                        <span className="font-medium">📍 Você</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Persons List */}
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🏍️ Entregadores Disponíveis
                    <Badge className="bg-green-500">{deliveryPersons.length}</Badge>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deliveryPersons.map((dp, index) => (
                      <Card key={dp.id} className="hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                              {vehicleIcons[dp.vehicleType]}
                            </div>
                            <div className="flex-1">
                              {user ? (
                                <>
                                  <p className="font-bold text-lg">{dp.user?.name || `Entregador ${index + 1}`}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      ⭐ {dp.rating.toFixed(1)}
                                    </span>
                                    <span>•</span>
                                    <span>{dp.totalDeliveries} entregas</span>
                                  </div>
                                  <Badge variant={dp.isAvailable ? 'default' : 'secondary'} className={`mt-1 text-xs ${dp.isAvailable ? 'bg-green-500' : ''}`}>
                                    {dp.isAvailable ? 'Disponível' : 'Ocupado'}
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-400 rounded-full blur-sm"></div>
                                    <p className="font-bold text-lg text-gray-400">Entregador {index + 1}</p>
                                    <span className="text-gray-400">🔒</span>
                                  </div>
                                  <p className="text-sm text-gray-400">Login necessário para ver detalhes</p>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="mt-2 text-orange-500 border-orange-500 hover:bg-orange-50"
                                    onClick={() => setShowAuthModal(true)}
                                  >
                                    🔐 Entrar para Ver
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar - Delivery Persons (for Services tab) */}
            {mainTab === 'services' && (
              <div className="w-80 shrink-0 hidden xl:block">
                <div className="sticky top-24 space-y-4">
                  {/* Delivery Persons Card */}
                  <Card className="shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        🏍️ Entregadores Próximos
                      </CardTitle>
                      <CardDescription className="text-green-100">
                        Disponíveis para entrega
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      {deliveryPersons.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">Nenhum disponível</p>
                      ) : (
                        <div className="space-y-3">
                          {deliveryPersons.slice(0, 4).map((dp, index) => (
                            <div key={dp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                                {vehicleIcons[dp.vehicleType]}
                              </div>
                              <div className="flex-1 min-w-0">
                                {user ? (
                                  <>
                                    <p className="font-medium truncate">{dp.user?.name || `Entregador ${index + 1}`}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      ⭐ {dp.rating.toFixed(1)} • {dp.totalDeliveries} entregas
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium text-gray-400 flex items-center gap-2">
                                      Entregador {index + 1} 🔒
                                    </p>
                                    <p className="text-xs text-orange-500">Login para ver detalhes</p>
                                  </>
                                )}
                              </div>
                              <div className={`w-3 h-3 rounded-full ${dp.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!user && (
                        <Button 
                          size="sm" 
                          className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 shadow-md" 
                          onClick={() => setShowAuthModal(true)}
                        >
                          🔐 Entrar para Ver Detalhes
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stats Card */}
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
                          <p className="text-3xl font-bold text-blue-500">{allProducts.length}</p>
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
                      <p className="text-sm text-white/80 mt-1 relative z-10">Cadastre-se agora e ganhe frete grátis no primeiro pedido.</p>
                      {!user && (
                        <Button 
                          size="sm" 
                          className="mt-3 bg-white text-orange-500 hover:bg-orange-100 relative z-10" 
                          onClick={() => setShowAuthModal(true)}
                        >
                          Criar Conta Grátis
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CART VIEW */}
        {view === 'cart' && user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🛒 Carrinho</h2>
              <Button variant="outline" onClick={() => setView('landing')}>← Continuar Comprando</Button>
            </div>
            {cart.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="py-16 text-center">
                  <span className="text-6xl mb-4 block">🛒</span>
                  <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
                  <Button className="mt-4 bg-gradient-to-r from-orange-500 to-red-500" onClick={() => setView('landing')}>Ver Produtos</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  {cart.map(item => (
                    <Card key={item.product.id} className="shadow-md">
                      <CardContent className="py-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">🍽️</div>
                        <div className="flex-1">
                          <p className="font-medium text-lg">{item.product.name}</p>
                          <p className="text-sm text-gray-500">{item.product.price.toLocaleString('pt-MZ')} MT cada</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>-</Button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>+</Button>
                        </div>
                        <p className="font-bold text-green-600 w-24 text-right">
                          {(item.product.price * item.quantity).toLocaleString('pt-MZ')} MT
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="h-fit sticky top-24 shadow-lg">
                  <CardHeader><CardTitle>📋 Resumo do Pedido</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{getCartTotal().toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Entrega</span>
                      <span>100 MT</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">{(getCartTotal() + 100).toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 shadow-md" onClick={proceedToCheckout}>
                      Finalizar Pedido →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT VIEW */}
        {view === 'checkout' && user && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold">📍 Finalizar Pedido</h2>
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="text-base">📍 Endereço de Entrega</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Digite seu endereço completo..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="min-h-24" />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="text-base">🏍️ Escolha o Entregador</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {availableDeliveryPersons.map((dp, index) => (
                  <div 
                    key={dp.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedDeliveryPerson?.id === dp.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-orange-300'}`}
                    onClick={() => setSelectedDeliveryPerson(dp)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{vehicleIcons[dp.vehicleType]}</span>
                        <div>
                          <p className="font-medium">{dp.user?.name || `Entregador ${index + 1}`}</p>
                          <p className="text-sm text-gray-500">⭐ {dp.rating.toFixed(1)} • {dp.totalDeliveries} entregas</p>
                        </div>
                      </div>
                      {selectedDeliveryPerson?.id === dp.id && (
                        <Badge className="bg-orange-500">✓ Selecionado</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="py-4 space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{(getCartTotal() + 100).toLocaleString('pt-MZ')} MT</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setView('cart')}>← Voltar</Button>
                  <Button className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 shadow-md" onClick={createOrder} disabled={loading || !deliveryAddress}>
                    {loading ? 'Processando...' : 'Confirmar Pedido ✓'}
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
              <h2 className="text-2xl font-bold">📦 Meus Pedidos</h2>
              <Button variant="outline" onClick={() => setView('landing')}>← Voltar</Button>
            </div>
            {orders.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="py-16 text-center">
                  <span className="text-6xl mb-4 block">📦</span>
                  <p className="text-gray-500 text-lg">Você ainda não tem pedidos</p>
                  <Button className="mt-4 bg-gradient-to-r from-orange-500 to-red-500" onClick={() => setView('landing')}>Fazer Primeiro Pedido</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Card key={order.id} className="overflow-hidden shadow-lg">
                    <div className={`h-2 ${statusConfig[order.status].color}`} />
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg">Pedido #{order.id.slice(-6)}</span>
                        <Badge className={`${statusConfig[order.status].color} text-white`}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span>{(item.price * item.quantity).toLocaleString('pt-MZ')} MT</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-green-600">{(order.totalAmount + order.deliveryFee).toLocaleString('pt-MZ')} MT</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">🛵</span>
            <span className="font-bold text-xl">EntregasMoz</span>
          </div>
          <p className="text-gray-400 text-sm">Entregas rápidas em toda Moçambique</p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
            <span>📞 +258 XX XXX XXXX</span>
            <span>📧 contato@entregasmoz.co.mz</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
