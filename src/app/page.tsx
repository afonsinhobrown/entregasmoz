'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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
  client?: Client
  deliveryPerson?: DeliveryPerson
  provider?: Provider
}

interface Client {
  id: string
  address?: string
  latitude?: number
  longitude?: number
}

interface DeliveryPerson {
  id: string
  vehicleType: VehicleType
  plateNumber?: string
  isAvailable: boolean
  currentLatitude?: number
  currentLongitude?: number
  rating: number
  totalDeliveries: number
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
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  isAvailable: boolean
  provider?: { id: string; storeName: string }
  providerId: string
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: Product
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  deliveryFee: number
  pickupAddress?: string
  deliveryAddress?: string
  notes?: string
  createdAt: string
  client?: { user: { name: string; phone?: string }; address?: string }
  provider?: { id: string; storeName: string; address?: string; user: { name: string; phone?: string }; latitude?: number; longitude?: number }
  deliveryPerson?: { id: string; user: { name: string; phone?: string }; rating: number; vehicleType: VehicleType }
  items: OrderItem[]
  pickupDistance?: number
}

interface CartItem {
  product: Product
  quantity: number
}

// Status configuration
const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-500' },
  PREPARING: { label: 'Preparando', color: 'bg-orange-500' },
  READY: { label: 'Pronto', color: 'bg-green-500' },
  PICKED_UP: { label: 'Em Entrega', color: 'bg-purple-500' },
  DELIVERED: { label: 'Entregue', color: 'bg-gray-500' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500' },
}

// Categories with icons
const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'Restaurante', name: 'Restaurantes', icon: '🍴' },
  { id: 'Pizzaria', name: 'Pizzarias', icon: '🍕' },
  { id: 'Mercado', name: 'Mercados', icon: '🛒' },
  { id: 'Farmácia', name: 'Farmácias', icon: '💊' },
  { id: 'Bebidas', name: 'Bebidas', icon: '🍺' },
]

// Vehicle icons
const vehicleIcons: Record<VehicleType, string> = {
  MOTORCYCLE: '🏍️',
  BICYCLE: '🚲',
  CAR: '🚗',
  SCOOTER: '🛵',
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  
  // Registration form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'CLIENT' as UserType,
    address: '',
    vehicleType: 'MOTORCYCLE' as VehicleType,
    plateNumber: '',
    storeName: '',
    storeDescription: '',
    category: '',
    storeAddress: '',
  })
  
  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  
  // Data states
  const [providers, setProviders] = useState<(Provider & { user: { name: string }; products: Product[]; distance?: number })[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([])
  const [availableDeliveryPersons, setAvailableDeliveryPersons] = useState<DeliveryPerson[]>([])
  
  // UI states
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'feed' | 'cart' | 'checkout' | 'orders' | 'deliveries' | 'products' | 'store' | 'tracking'>('feed')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      const timer = setTimeout(() => setUser(parsedUser), 0)
      return () => clearTimeout(timer)
    }
  }, [])

  // Load data based on user type
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        if (user.userType === 'CLIENT') {
          try {
            const [providersRes, productsRes] = await Promise.all([
              fetch('/api/providers'),
              fetch('/api/products')
            ])
            const providersData = await providersRes.json()
            const productsData = await productsRes.json()
            setProviders(providersData.providers || [])
            setAllProducts(productsData.products || [])
          } catch (error) {
            console.error('Error loading feed:', error)
          }
          try {
            const res = await fetch(`/api/orders?clientId=${user.client?.id}`)
            const data = await res.json()
            setOrders(data.orders || [])
          } catch (error) {
            console.error('Error loading orders:', error)
          }
          setDeliveryAddress(user.client?.address || '')
        } else if (user.userType === 'DELIVERY_PERSON') {
          try {
            const res = await fetch(`/api/deliveries?deliveryPersonId=${user.deliveryPerson?.id}`)
            const data = await res.json()
            setAvailableDeliveries(data.availableDeliveries || [])
            setActiveDeliveries(data.activeDeliveries || [])
          } catch (error) {
            console.error('Error loading deliveries:', error)
          }
        } else if (user.userType === 'PROVIDER') {
          try {
            const [productsRes, ordersRes] = await Promise.all([
              fetch(`/api/products?providerId=${user.provider?.id}`),
              fetch(`/api/orders?providerId=${user.provider?.id}`)
            ])
            const productsData = await productsRes.json()
            const ordersData = await ordersRes.json()
            setAllProducts(productsData.products || [])
            setOrders(ordersData.orders || [])
          } catch (error) {
            console.error('Error loading provider data:', error)
          }
        }
      }
    }
    loadData()
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
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        userType: registerForm.userType,
      }

      if (registerForm.userType === 'CLIENT') {
        body.address = registerForm.address
      } else if (registerForm.userType === 'DELIVERY_PERSON') {
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
    setProviders([])
    setAllProducts([])
  }

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const getCartItemCount = () => cart.reduce((count, item) => count + item.quantity, 0)

  // Group cart by provider
  const getCartGroupedByProvider = () => {
    const groups: Record<string, { provider: string; items: CartItem[] }> = {}
    cart.forEach(item => {
      const providerId = item.product.provider?.id || 'unknown'
      const providerName = item.product.provider?.storeName || 'Fornecedor'
      if (!groups[providerId]) {
        groups[providerId] = { provider: providerName, items: [] }
      }
      groups[providerId].items.push(item)
    })
    return Object.values(groups)
  }

  // Load available delivery persons for checkout
  const loadAvailableDeliveryPersons = async () => {
    try {
      const res = await fetch('/api/delivery-persons')
      const data = await res.json()
      setAvailableDeliveryPersons(data.deliveryPersons || [])
    } catch (error) {
      console.error('Error loading delivery persons:', error)
      setAvailableDeliveryPersons([])
    }
  }

  // Load client orders
  const loadClientOrders = async () => {
    if (!user?.client?.id) return
    try {
      const res = await fetch(`/api/orders?clientId=${user.client.id}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  // Load provider data
  const loadProviderData = async () => {
    if (!user?.provider?.id) return
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`/api/products?providerId=${user.provider.id}`),
        fetch(`/api/orders?providerId=${user.provider.id}`)
      ])
      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()
      setAllProducts(productsData.products || [])
      setOrders(ordersData.orders || [])
    } catch (error) {
      console.error('Error loading provider data:', error)
    }
  }

  // Order functions
  const proceedToCheckout = async () => {
    if (cart.length === 0) return
    await loadAvailableDeliveryPersons()
    setView('checkout')
  }

  const createOrder = async () => {
    if (!user?.client?.id || cart.length === 0) return
    
    setLoading(true)
    try {
      // Get first provider from cart (simplified - one order at a time)
      const firstItem = cart[0]
      const providerId = firstItem.product.providerId
      
      if (!providerId) {
        alert('Erro: produto sem fornecedor')
        setLoading(false)
        return
      }

      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.client.id,
          providerId,
          items,
          deliveryAddress,
          deliveryFee: 100,
          notes: orderNotes,
        }),
      })
      const data = await res.json()
      
      if (data.order) {
        // Assign delivery person if selected
        if (selectedDeliveryPerson?.id) {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.order.id,
              deliveryPersonId: selectedDeliveryPerson.id,
            }),
          })
        }
        
        setCart([])
        setSelectedDeliveryPerson(null)
        setView('orders')
        loadClientOrders()
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

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setLoading(true)
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (user?.userType === 'PROVIDER') {
        loadProviderData()
      } else {
        loadClientOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
    setLoading(false)
  }

  const acceptDelivery = async (orderId: string) => {
    if (!user?.deliveryPerson?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          deliveryPersonId: user.deliveryPerson.id,
        }),
      })
      const data = await res.json()
      if (data.order) {
        loadDeliveries()
        alert('Entrega aceita!')
      } else {
        alert(data.error || 'Erro ao aceitar entrega')
      }
    } catch {
      alert('Erro ao aceitar entrega')
    }
    setLoading(false)
  }

  const updateDeliveryPersonStatus = async (isAvailable: boolean) => {
    if (!user?.deliveryPerson?.id) return
    try {
      await fetch('/api/deliveries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPersonId: user.deliveryPerson.id,
          isAvailable,
        }),
      })
      setUser(prev => prev ? {
        ...prev,
        deliveryPerson: prev.deliveryPerson ? { ...prev.deliveryPerson, isAvailable } : undefined
      } : null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const updateProviderStatus = async (isOpen: boolean) => {
    if (!user?.provider?.id) return
    try {
      await fetch('/api/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: user.provider.id, isOpen }),
      })
      setUser(prev => prev ? { ...prev, provider: prev.provider ? { ...prev.provider, isOpen } : undefined } : null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const addProduct = async (name: string, description: string, price: number) => {
    if (!user?.provider?.id) return
    setLoading(true)
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: user.provider.id, name, description, price }),
      })
      loadProviderData()
    } catch (error) {
      console.error('Error adding product:', error)
    }
    setLoading(false)
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await fetch(`/api/products?id=${productId}`, { method: 'DELETE' })
      loadProviderData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  // Filter products
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

  // Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🛵</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              EntregasMoz
            </CardTitle>
            <CardDescription className="text-base">Sistema de Entregas em Moçambique</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" onClick={login} disabled={loading}>
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
                  <Label>Nome</Label>
                  <Input placeholder="Seu nome" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="seu@email.com" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" placeholder="••••••" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="+258 84 123 4567" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>

                {registerForm.userType === 'CLIENT' && (
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input placeholder="Seu endereço" value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} />
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
                          <SelectItem value="SCOOTER">🛵 Scooter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Matrícula</Label>
                      <Input placeholder="MCT-1234" value={registerForm.plateNumber} onChange={e => setRegisterForm({ ...registerForm, plateNumber: e.target.value })} />
                    </div>
                  </>
                )}

                {registerForm.userType === 'PROVIDER' && (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da Loja</Label>
                      <Input placeholder="Nome do seu negócio" value={registerForm.storeName} onChange={e => setRegisterForm({ ...registerForm, storeName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={registerForm.category} onValueChange={(v) => setRegisterForm({ ...registerForm, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Restaurante">Restaurante</SelectItem>
                          <SelectItem value="Pizzaria">Pizzaria</SelectItem>
                          <SelectItem value="Mercado">Mercado</SelectItem>
                          <SelectItem value="Farmácia">Farmácia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea placeholder="Descreva seu negócio" value={registerForm.storeDescription} onChange={e => setRegisterForm({ ...registerForm, storeDescription: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço</Label>
                      <Input placeholder="Endereço do estabelecimento" value={registerForm.storeAddress} onChange={e => setRegisterForm({ ...registerForm, storeAddress: e.target.value })} />
                    </div>
                  </>
                )}

                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={register} disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar'}
                </Button>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />
            <p className="text-xs text-center text-gray-500">
              Contas de teste: ana@email.com, joao@email.com, sabor@email.com (senha: 123456)
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CLIENT DASHBOARD
  if (user.userType === 'CLIENT') {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛵</span>
                <span className="font-bold text-2xl">EntregasMoz</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-white hover:bg-white/20 relative" onClick={() => setView('cart')}>
                  🛒
                  {getCartItemCount() > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs">{getCartItemCount()}</Badge>
                  )}
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setView('orders')}>📦</Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm hidden md:block">{user.name}</span>
                  <Button variant="ghost" className="text-white hover:bg-white/20" onClick={logout}>👋</Button>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mt-3">
              <Input 
                className="bg-white/20 border-white/30 text-white placeholder-white/70"
                placeholder="🔍 Buscar produtos, restaurantes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="bg-white shadow-sm sticky top-[120px] z-40">
          <div className="max-w-6xl mx-auto px-4 py-2 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button 
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className={`rounded-full whitespace-nowrap ${selectedCategory === cat.id ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          
          {/* FEED VIEW */}
          {view === 'feed' && (
            <div className="space-y-6">
              {/* Featured Providers */}
              <section>
                <h2 className="text-xl font-bold mb-4">🏪 Restaurantes e Lojas</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {providers.filter(p => selectedCategory === 'all' || p.category === selectedCategory).map(provider => (
                    <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1" onClick={() => {
                      setSelectedCategory('all')
                      setSearchQuery(provider.storeName)
                    }}>
                      <div className="h-24 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center text-4xl rounded-t-lg">
                        {provider.category === 'Restaurante' ? '🍴' : provider.category === 'Pizzaria' ? '🍕' : provider.category === 'Mercado' ? '🛒' : '🏪'}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold truncate">{provider.storeName}</h3>
                        <p className="text-xs text-gray-500 truncate">{provider.storeDescription}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">{provider.category}</Badge>
                          <span className="text-xs text-green-600">{provider.isOpen ? 'Aberto' : 'Fechado'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Products Feed */}
              <section>
                <h2 className="text-xl font-bold mb-4">🍽️ Produtos Disponíveis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredProducts().map(product => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl">
                        {product.name.toLowerCase().includes('pizza') ? '🍕' : 
                         product.name.toLowerCase().includes('coca') || product.name.toLowerCase().includes('bebida') ? '🥤' :
                         product.name.toLowerCase().includes('fruta') ? '🍎' :
                         product.name.toLowerCase().includes('pão') || product.name.toLowerCase().includes('pao') ? '🍞' :
                         product.name.toLowerCase().includes('leite') ? '🥛' :
                         product.name.toLowerCase().includes('ovo') ? '🥚' :
                         product.name.toLowerCase().includes('camarão') || product.name.toLowerCase().includes('camarao') ? '🦐' :
                         '🍽️'}
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {product.price.toLocaleString('pt-MZ')} MT
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-500 mb-3">📍 {product.provider?.storeName}</p>
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={() => addToCart(product)}>
                          Adicionar ao Carrinho +
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {getFilteredProducts().length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      <span className="text-5xl mb-4 block">🔍</span>
                      Nenhum produto encontrado
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          )}

          {/* CART VIEW */}
          {view === 'cart' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">🛒 Meu Carrinho</h2>
                <Button variant="outline" onClick={() => setView('feed')}>← Continuar Comprando</Button>
              </div>
              
              {cart.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <span className="text-6xl mb-4 block">🛒</span>
                    <p className="text-xl text-gray-500">Seu carrinho está vazio</p>
                    <Button className="mt-4" onClick={() => setView('feed')}>Ver Produtos</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    {getCartGroupedByProvider().map(group => (
                      <Card key={group.provider}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">🏪 {group.provider}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {group.items.map(item => (
                            <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-sm text-gray-500">{item.product.price.toLocaleString('pt-MZ')} MT</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>-</Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>+</Button>
                              </div>
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeFromCart(item.product.id)}>🗑️</Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Card className="h-fit sticky top-44">
                    <CardHeader>
                      <CardTitle>Resumo do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{getCartTotal().toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Entrega</span>
                        <span>100 MT</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-600">{(getCartTotal() + 100).toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-lg py-6" onClick={proceedToCheckout}>
                        Finalizar Pedido →
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* CHECKOUT VIEW */}
          {view === 'checkout' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">📍 Finalizar Pedido</h2>
              
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Digite seu endereço completo..."
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="min-h-24"
                  />
                </CardContent>
              </Card>

              {/* Select Delivery Person */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏍️ Escolha o Entregador</CardTitle>
                  <CardDescription>Selecione um entregador disponível</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableDeliveryPersons.map((dp, index) => (
                    <div 
                      key={dp.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedDeliveryPerson?.id === dp.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setSelectedDeliveryPerson(dp)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{vehicleIcons[dp.vehicleType]}</span>
                          <div>
                            <p className="font-medium">Entregador {index + 1}</p>
                            <p className="text-sm text-gray-500">
                              ⭐ {dp.rating.toFixed(1)} • {dp.totalDeliveries} entregas
                            </p>
                          </div>
                        </div>
                        {selectedDeliveryPerson?.id === dp.id && (
                          <Badge className="bg-orange-500">Selecionado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📝 Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Alguma observação para o pedido?"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(getCartTotal() + 100).toLocaleString('pt-MZ')} MT
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setView('cart')}>← Voltar</Button>
                    <Button className="flex-1 bg-gradient-to-r from-orange-500 to-red-500" onClick={createOrder} disabled={loading || !deliveryAddress}>
                      {loading ? 'Processando...' : 'Confirmar Pedido ✓'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ORDERS VIEW */}
          {view === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">📦 Meus Pedidos</h2>
                <Button variant="outline" onClick={() => setView('feed')}>← Voltar</Button>
              </div>
              
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <span className="text-6xl mb-4 block">📦</span>
                    <p className="text-xl text-gray-500">Você ainda não fez nenhum pedido</p>
                    <Button className="mt-4" onClick={() => setView('feed')}>Ver Produtos</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`h-1 ${statusConfig[order.status].color}`} />
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Pedido #{order.id.slice(-6)}</CardTitle>
                            <CardDescription>{new Date(order.createdAt).toLocaleString('pt-MZ')}</CardDescription>
                          </div>
                          <Badge className={`${statusConfig[order.status].color} text-white`}>
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
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
                        {order.deliveryPerson && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                            <span className="text-2xl">{vehicleIcons[order.deliveryPerson.vehicleType]}</span>
                            <div>
                              <p className="font-medium">{order.deliveryPerson.user.name}</p>
                              <p className="text-sm text-gray-500">⭐ {order.deliveryPerson.rating.toFixed(1)}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    )
  }

  // DELIVERY PERSON DASHBOARD
  if (user.userType === 'DELIVERY_PERSON') {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-gradient-to-r from-green-500 to-emerald-600 text-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏍️</span>
              <span className="font-bold text-2xl">EntregasMoz</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20">⭐ {user.deliveryPerson?.rating.toFixed(1)}</Badge>
              <Badge variant="secondary" className="bg-white/20">📦 {user.deliveryPerson?.totalDeliveries} entregas</Badge>
              <Button variant="ghost" className="text-white" onClick={logout}>👋 Sair</Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Status Toggle */}
          <Card>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">Status de Disponibilidade</p>
                <p className="text-gray-500">{user.deliveryPerson?.isAvailable ? 'Você está online e disponível' : 'Você está offline'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={user.deliveryPerson?.isAvailable || false} onCheckedChange={updateDeliveryPersonStatus} />
                <Badge variant={user.deliveryPerson?.isAvailable ? 'default' : 'secondary'} className={user.deliveryPerson?.isAvailable ? 'bg-green-500' : ''}>
                  {user.deliveryPerson?.isAvailable ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Active Deliveries */}
          {activeDeliveries.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">📦 Suas Entregas Ativas</h2>
              {activeDeliveries.map(order => (
                <Card key={order.id} className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Pedido #{order.id.slice(-6)}</CardTitle>
                      <Badge className={`${statusConfig[order.status].color} text-white`}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg">
                        <p className="font-medium text-green-700">📍 Retirada</p>
                        <p className="font-bold">{order.provider?.storeName}</p>
                        <p className="text-sm text-gray-500">{order.provider?.address}</p>
                        <p className="text-sm">📞 {order.provider?.user.phone}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <p className="font-medium text-blue-700">🏠 Entrega</p>
                        <p className="font-bold">{order.client?.user.name}</p>
                        <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                        <p className="text-sm">📞 {order.client?.user.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {order.status === 'READY' && (
                        <Button className="flex-1 bg-green-500" onClick={() => updateOrderStatus(order.id, 'PICKED_UP')}>
                          ✓ Confirmei a Retirada
                        </Button>
                      )}
                      {order.status === 'PICKED_UP' && (
                        <Button className="flex-1 bg-green-600" onClick={() => updateOrderStatus(order.id, 'DELIVERED')}>
                          ✓ Entrega Confirmada
                        </Button>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Você ganha:</span>
                      <span className="text-xl font-bold text-green-600 ml-2">{order.deliveryFee.toLocaleString('pt-MZ')} MT</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Available Deliveries */}
          <section>
            <h2 className="text-xl font-bold mb-4">🛵 Entregas Disponíveis</h2>
            {availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <span className="text-5xl mb-4 block">📭</span>
                  Nenhuma entrega disponível no momento
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableDeliveries.map(order => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{order.provider?.storeName}</CardTitle>
                        {order.pickupDistance && <Badge variant="outline">{order.pickupDistance.toFixed(1)} km</Badge>}
                      </div>
                      <CardDescription>{order.provider?.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p><strong>Cliente:</strong> {order.client?.user.name}</p>
                        <p><strong>Entregar em:</strong> {order.deliveryAddress}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Você ganha:</span>
                        <span className="text-xl font-bold text-green-600">{order.deliveryFee.toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                        onClick={() => acceptDelivery(order.id)}
                        disabled={!user.deliveryPerson?.isAvailable}
                      >
                        Aceitar Entrega
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    )
  }

  // PROVIDER DASHBOARD
  if (user.userType === 'PROVIDER') {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏪</span>
              <span className="font-bold text-xl">{user.provider?.storeName}</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={user.provider?.isOpen ? 'default' : 'secondary'} className={user.provider?.isOpen ? 'bg-green-500' : ''}>
                {user.provider?.isOpen ? 'Aberto' : 'Fechado'}
              </Badge>
              <Button variant="ghost" className="text-white" onClick={logout}>👋 Sair</Button>
            </div>
          </div>
        </header>

        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 flex gap-2">
            <Button variant={view === 'orders' ? 'default' : 'ghost'} onClick={() => setView('orders')}>📦 Pedidos</Button>
            <Button variant={view === 'products' ? 'default' : 'ghost'} onClick={() => setView('products')}>🛍️ Produtos</Button>
            <Button variant={view === 'store' ? 'default' : 'ghost'} onClick={() => setView('store')}>⚙️ Loja</Button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-6">
          {view === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">📦 Pedidos Recebidos</h2>
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-gray-500">
                    <span className="text-6xl mb-4 block">📭</span>
                    <p className="text-xl">Nenhum pedido ainda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`h-1 ${statusConfig[order.status].color}`} />
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-lg">Pedido #{order.id.slice(-6)}</p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('pt-MZ')}</p>
                          </div>
                          <Badge className={`${statusConfig[order.status].color} text-white`}>
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">👤 Cliente</p>
                            <p>{order.client?.user.name}</p>
                            <p className="text-sm">📞 {order.client?.user.phone}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">📍 Entrega</p>
                            <p className="text-sm">{order.deliveryAddress}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>{(item.price * item.quantity).toLocaleString('pt-MZ')} MT</span>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {order.status === 'PENDING' && (
                              <>
                                <Button size="sm" className="bg-green-500" onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}>✓ Confirmar</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'CANCELLED')}>✗ Cancelar</Button>
                              </>
                            )}
                            {order.status === 'CONFIRMED' && (
                              <Button size="sm" className="bg-orange-500" onClick={() => updateOrderStatus(order.id, 'PREPARING')}>👨‍🍳 Preparando</Button>
                            )}
                            {order.status === 'PREPARING' && (
                              <Button size="sm" className="bg-green-600" onClick={() => updateOrderStatus(order.id, 'READY')}>✓ Pronto!</Button>
                            )}
                          </div>
                          <span className="font-bold text-green-600">{order.totalAmount.toLocaleString('pt-MZ')} MT</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">🛍️ Meus Produtos</h2>
                <AddProductDialog onAdd={addProduct} loading={loading} />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProducts.map(product => (
                  <Card key={product.id}>
                    <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant={product.isAvailable ? 'default' : 'secondary'} className={product.isAvailable ? 'bg-green-500' : ''}>
                          {product.isAvailable ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600 mb-3">{product.price.toLocaleString('pt-MZ')} MT</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => deleteProduct(product.id)}>🗑️</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {view === 'store' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">⚙️ Configurações da Loja</h2>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">Status da Loja</p>
                      <p className="text-gray-500">{user.provider?.isOpen ? 'Aceitando pedidos' : 'Loja fechada'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={user.provider?.isOpen || false} onCheckedChange={updateProviderStatus} />
                      <Badge variant={user.provider?.isOpen ? 'default' : 'secondary'} className={user.provider?.isOpen ? 'bg-green-500' : ''}>
                        {user.provider?.isOpen ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    )
  }

  return null
}

// Add Product Dialog
function AddProductDialog({ onAdd, loading }: { onAdd: (name: string, description: string, price: number) => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

  const handleSubmit = () => {
    if (!name || !price) return
    onAdd(name, description, parseFloat(price))
    setName('')
    setDescription('')
    setPrice('')
    setOpen(false)
  }

  return (
    <>
      <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setOpen(true)}>+ Adicionar Produto</Button>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
              <DialogDescription>Preencha as informações do produto</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pizza Margherita" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o produto" />
              </div>
              <div className="space-y-2">
                <Label>Preço (MT)</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-purple-600" onClick={handleSubmit} disabled={loading || !name || !price}>Adicionar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
