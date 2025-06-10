"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Pill, Package, TrendingUp, Clock, MapPin, Truck, Bell, AlertTriangle } from "lucide-react"

interface Medicine {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  prescription: boolean
  minStock: number
  expiryDate: string
  pharmacyId: string
}

interface Order {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  items: Array<{
    medicineId: string
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: "pending" | "preparing" | "out-for-delivery" | "delivered" | "cancelled"
  orderTime: any
  address: string
  distance?: string
}

export function PharmacyDashboard() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(true)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Set up real-time medicines listener
    const medicinesQuery = query(collection(db, "medicines"), where("pharmacyId", "==", user.uid))

    const unsubscribeMedicines = onSnapshot(medicinesQuery, (snapshot) => {
      const medicinesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Medicine[]
      setMedicines(medicinesList)
      setIsLoading(false)
    })

    // Set up real-time orders listener
    const ordersQuery = query(collection(db, "orders"), where("pharmacyId", "==", user.uid))

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]

      // Sort orders by creation time (newest first)
      ordersList.sort((a, b) => {
        const timeA = a.orderTime?.seconds || 0
        const timeB = b.orderTime?.seconds || 0
        return timeB - timeA
      })

      setOrders(ordersList)

      // Count new orders (pending status)
      const newOrders = ordersList.filter((order) => order.status === "pending")
      setNewOrdersCount(newOrders.length)
    })

    return () => {
      unsubscribeMedicines()
      unsubscribeOrders()
    }
  }, [user])

  const handleStoreStatusChange = async (open: boolean) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "users", user.uid), {
        storeOpen: open,
      })
      setIsOpen(open)
      toast({
        title: "Success",
        description: `Store is now ${open ? "open" : "closed"}`,
      })
    } catch (error) {
      console.error("Error updating store status:", error)
      toast({
        title: "Error",
        description: "Failed to update store status",
        variant: "destructive",
      })
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "preparing",
      })
      toast({
        title: "Success",
        description: "Order accepted and moved to preparing",
      })
    } catch (error) {
      console.error("Error accepting order:", error)
      toast({
        title: "Error",
        description: "Failed to accept order",
        variant: "destructive",
      })
    }
  }

  const handleDeclineOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "cancelled",
      })
      toast({
        title: "Success",
        description: "Order declined",
      })
    } catch (error) {
      console.error("Error declining order:", error)
      toast({
        title: "Error",
        description: "Failed to decline order",
        variant: "destructive",
      })
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      })
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  // Filter orders by status
  const newOrders = orders.filter((order) => order.status === "pending")
  const inProgressOrders = orders.filter((order) => order.status === "preparing" || order.status === "out-for-delivery")
  const lowStockMedicines = medicines.filter((medicine) => medicine.stock <= medicine.minStock)

  // Calculate today's sales
  const today = new Date().toDateString()
  const todaysSales = orders
    .filter((order) => order.status === "delivered" && order.orderTime?.toDate?.()?.toDateString() === today)
    .reduce((sum, order) => sum + (order.total || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>

        <div className="flex items-center space-x-2">
          <Switch id="store-status" checked={isOpen} onCheckedChange={handleStoreStatusChange} />
          <Label htmlFor="store-status" className="font-medium">
            {isOpen ? "Store Open" : "Store Closed"}
          </Label>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              New Orders
              {newOrdersCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <Bell className="h-3 w-3 mr-1" />
                  {newOrdersCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{newOrders.length}</p>
            <CardDescription>Waiting for acceptance</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgressOrders.length}</p>
            <CardDescription>Being prepared or delivered</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${todaysSales.toFixed(2)}</p>
            <CardDescription>Total sales for today</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* New Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">New Orders</h2>

        {newOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {newOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{order.patientName}</CardTitle>
                    <span className="text-sm text-gray-500">
                      {order.orderTime?.toDate?.()?.toLocaleString() || "Just now"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 mb-3">
                    <p className="font-medium">Items:</p>
                    <ul className="space-y-1">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>
                            x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium mt-2">Total: ${(order.total || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{order.distance || "Distance not calculated"}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <strong>Address:</strong> {order.address}
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong>Phone:</strong> {order.patientPhone}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleDeclineOrder(order.id)}>
                    Decline
                  </Button>
                  <Button className="flex-1" onClick={() => handleAcceptOrder(order.id)}>
                    Accept
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No New Orders</h3>
              <p className="text-gray-500">New orders will appear here when patients place them.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* In Progress Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">In Progress Orders</h2>

        {inProgressOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{order.patientName}</CardTitle>
                    <Badge variant={order.status === "preparing" ? "outline" : "secondary"}>
                      {order.status === "preparing" ? "Preparing" : "Out for Delivery"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {order.orderTime?.toDate?.()?.toLocaleString()} • {order.items?.length || 0} items • $
                    {(order.total || 0).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {order.status === "preparing"
                        ? "Prepare order and mark as ready"
                        : "Waiting for delivery confirmation"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleUpdateOrderStatus(order.id, order.status === "preparing" ? "out-for-delivery" : "delivered")
                    }
                  >
                    {order.status === "preparing" ? "Mark as Ready" : "Confirm Delivery"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders in Progress</h3>
              <p className="text-gray-500">Orders being prepared or delivered will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Alerts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Inventory Alerts</h2>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Low Stock Items</CardTitle>
            <CardDescription>Items that need to be restocked soon</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockMedicines.length > 0 ? (
              <div className="space-y-3">
                {lowStockMedicines.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Current: {item.stock} / Min: {item.minStock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Button size="sm" variant="outline">
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">All Stock Levels Good</h3>
                <p className="text-gray-500">No medicines are currently low in stock.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/pharmacy/inventory">Manage Inventory</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
