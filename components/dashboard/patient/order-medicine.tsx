"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, ShoppingCart, MapPin, Clock, Plus, Minus, Trash2, Store, Loader2 } from "lucide-react"
import { getFirebaseFirestore } from "@/lib/firebase"
import { collection, query, where, doc, setDoc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define types for better type safety
interface Pharmacy {
  id: string
  name: string
  address: string
  distance: number
  rating: number
  deliveryTime: string
  photoUrl: string | null
  isOpen: boolean
}

interface Medicine {
  id: string
  name: string
  description: string
  price: number
  category: string
  requiresPrescription: boolean
  inStock: boolean
  image: string | null
  pharmacyId: string
  quantity: number
}

interface CartItem {
  medicine: Medicine
  quantity: number
}

export function OrderMedicineContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState("delivery")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, userData } = useAuth()

  // Fetch pharmacies from Firestore
  useEffect(() => {
    const fetchPharmacies = async () => {
      setLoading(true)
      setError(null)

      try {
        const db = getFirebaseFirestore()

        // Create a query to get all users with userType = "pharmacy"
        const pharmaciesRef = collection(db, "users")
        const pharmaciesQuery = query(pharmaciesRef, where("userType", "==", "pharmacy"))

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          pharmaciesQuery,
          (snapshot) => {
            const pharmaciesList: Pharmacy[] = []

            snapshot.forEach((doc) => {
              const pharmacyData = doc.data()

              // Only add pharmacies with at least a name
              if (pharmacyData.fullName || pharmacyData.pharmacyName) {
                pharmaciesList.push({
                  id: doc.id,
                  name: pharmacyData.pharmacyName || pharmacyData.fullName,
                  address: pharmacyData.address || "Address not provided",
                  distance: calculateDistance(pharmacyData.location),
                  rating: pharmacyData.rating || 4.0,
                  deliveryTime: pharmacyData.deliveryTime || "30-45 min",
                  photoUrl: pharmacyData.photoUrl || null,
                  isOpen: pharmacyData.isOpen !== false, // Default to open unless explicitly set false
                })
              }
            })

            setPharmacies(pharmaciesList)
            setLoading(false)
          },
          (err) => {
            console.error("Error fetching pharmacies:", err)
            setError("Failed to load pharmacies. Please try again.")
            setLoading(false)
          },
        )

        // Clean up listener on unmount
        return () => unsubscribe()
      } catch (err) {
        console.error("Error setting up pharmacies listener:", err)
        setError("Failed to load pharmacies. Please try again.")
        setLoading(false)
      }
    }

    fetchPharmacies()
  }, [])

  // Fetch medicines when a pharmacy is selected
  useEffect(() => {
    if (!selectedPharmacy) {
      setMedicines([])
      setCategories([])
      return
    }

    const fetchMedicines = async () => {
      setLoadingMedicines(true)

      try {
        const db = getFirebaseFirestore()

        console.log("Fetching medicines for pharmacy:", selectedPharmacy.id)

        // Try multiple possible collection names and structures
        const possibleCollections = ["medicines", "inventory", "pharmacyInventory"]
        const medicinesList: Medicine[] = []

        for (const collectionName of possibleCollections) {
          try {
            const inventoryRef = collection(db, collectionName)

            // Try different field names for pharmacy ID
            const possibleFields = ["pharmacyId", "userId", "ownerId"]

            for (const fieldName of possibleFields) {
              try {
                const inventoryQuery = query(inventoryRef, where(fieldName, "==", selectedPharmacy.id))
                const snapshot = await getDocs(inventoryQuery)

                console.log(`Checking ${collectionName} with ${fieldName}:`, snapshot.size, "documents")

                if (!snapshot.empty) {
                  snapshot.forEach((doc) => {
                    const medicineData = doc.data()
                    console.log("Medicine data:", medicineData)

                    // Only add medicines that have required fields
                    if (medicineData.name) {
                      // Check for different possible quantity field names
                      const stockQuantity =
                        medicineData.stock || medicineData.quantity || medicineData.amount || medicineData.count || 0

                      medicinesList.push({
                        id: doc.id,
                        name: medicineData.name,
                        description: medicineData.description || "No description available",
                        price: Number(medicineData.price) || 0,
                        category: medicineData.category || "General",
                        requiresPrescription: medicineData.prescription || medicineData.requiresPrescription || false,
                        inStock: Number(stockQuantity) > 0,
                        image: medicineData.image || null,
                        pharmacyId: selectedPharmacy.id,
                        quantity: Number(stockQuantity),
                      })
                    }
                  })

                  if (medicinesList.length > 0) {
                    console.log("Found medicines:", medicinesList.length)
                    break // Exit both loops if we found medicines
                  }
                }
              } catch (fieldError) {
                console.log(`Field ${fieldName} not found in ${collectionName}`)
              }
            }

            if (medicinesList.length > 0) {
              break // Exit collection loop if we found medicines
            }
          } catch (collectionError) {
            console.log(`Collection ${collectionName} not found or accessible`)
          }
        }

        // If no medicines found, let's also check if there are any documents in medicines collection at all
        if (medicinesList.length === 0) {
          try {
            const allMedicinesRef = collection(db, "medicines")
            const allMedicinesSnapshot = await getDocs(allMedicinesRef)
            console.log("Total medicines documents:", allMedicinesSnapshot.size)

            allMedicinesSnapshot.forEach((doc) => {
              console.log("Medicine document:", doc.id, doc.data())
            })
          } catch (err) {
            console.log("Could not fetch all medicines documents")
          }
        }

        setMedicines(medicinesList)

        // Extract unique categories from real data
        const uniqueCategories = Array.from(new Set(medicinesList.map((med) => med.category)))
        setCategories(uniqueCategories)

        console.log("Final medicines list:", medicinesList)
        console.log("Categories:", uniqueCategories)
      } catch (err) {
        console.error("Error fetching medicines:", err)
        toast({
          title: "Error",
          description: "Failed to load medicines. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingMedicines(false)
      }
    }

    fetchMedicines()
  }, [selectedPharmacy, toast])

  // Helper function to calculate distance (mock for now)
  const calculateDistance = (location: any) => {
    // In a real app, you would calculate distance based on user's location
    // For now, return a random distance between 0.5 and 5 km
    return Math.round((Math.random() * 4.5 + 0.5) * 10) / 10
  }

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      searchQuery === "" ||
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === "" || selectedCategory === "all" || medicine.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const addToCart = (medicine: Medicine) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.medicine.id === medicine.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        return [...prevCart, { medicine, quantity: 1 }]
      }
    })

    toast({
      title: "Added to cart",
      description: `${medicine.name} has been added to your cart.`,
    })
  }

  const updateCartItemQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) => (item.medicine.id === medicineId ? { ...item, quantity: newQuantity } : item)),
    )
  }

  const removeFromCart = (medicineId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.medicine.id !== medicineId))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.medicine.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to place an order",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      })
      return
    }

    if (!deliveryAddress && deliveryMethod === "delivery") {
      toast({
        title: "Missing information",
        description: "Please provide a delivery address",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const db = getFirebaseFirestore()

      // Create order in Firestore
      const orderId = `order_${Date.now()}`
      const orderData = {
        id: orderId,
        userId: user.uid,
        userName: userData?.fullName || user.displayName || user.email,
        userEmail: user.email,
        pharmacyId: selectedPharmacy?.id,
        pharmacyName: selectedPharmacy?.name,
        items: cart.map((item) => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          price: item.medicine.price,
          quantity: item.quantity,
          requiresPrescription: item.medicine.requiresPrescription,
        })),
        totalAmount: calculateTotal(),
        deliveryMethod,
        deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : "Pickup",
        paymentMethod,
        notes,
        status: "pending", // pending, processing, completed, cancelled
        createdAt: serverTimestamp(),
      }

      await setDoc(doc(db, "orders", orderId), orderData)

      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and is being processed.",
      })

      // Clear cart and reset form
      setCart([])
      setDeliveryAddress("")
      setNotes("")
      setIsCheckoutOpen(false)
    } catch (err) {
      console.error("Error placing order:", err)
      toast({
        title: "Order failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Medicine</h1>

      {/* Pharmacy Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Pharmacy</CardTitle>
          <CardDescription>Choose a pharmacy to order from</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading pharmacies...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : pharmacies.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No pharmacies found</h3>
              <p className="mt-1 text-sm text-gray-500">There are no registered pharmacies available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPharmacy?.id === pharmacy.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPharmacy(pharmacy)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={pharmacy.photoUrl || ""} alt={pharmacy.name} />
                      <AvatarFallback>{getInitials(pharmacy.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{pharmacy.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{pharmacy.distance} km</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{pharmacy.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        pharmacy.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {pharmacy.isOpen ? "Open" : "Closed"}
                    </span>
                    {selectedPharmacy?.id === pharmacy.id && (
                      <Badge variant="outline" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicine Search and Cart */}
      {selectedPharmacy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Search and List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Medicines</CardTitle>
                <CardDescription>Browse and select medicines from {selectedPharmacy.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search-medicine" className="sr-only">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="search-medicine"
                        placeholder="Search medicines..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-[180px]">
                    <Label htmlFor="category" className="sr-only">
                      Category
                    </Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Medicine List */}
                <div className="space-y-2">
                  {loadingMedicines ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-4 text-sm text-muted-foreground">Loading medicines...</p>
                    </div>
                  ) : filteredMedicines.length === 0 ? (
                    <div className="text-center py-8">
                      {medicines.length === 0 ? (
                        <>
                          <Store className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium">No medicines available</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            This pharmacy hasn't added any medicines to their inventory yet.
                          </p>
                          <p className="mt-2 text-xs text-gray-400">Debug: Pharmacy ID: {selectedPharmacy.id}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No medicines found matching your criteria</p>
                      )}
                    </div>
                  ) : (
                    filteredMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{medicine.name}</h3>
                          <p className="text-sm text-gray-500">{medicine.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium">${medicine.price.toFixed(2)}</span>
                            <span className={`text-xs ${medicine.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                              Stock: {medicine.quantity} {medicine.quantity === 1 ? "unit" : "units"}
                            </span>
                            {medicine.requiresPrescription && (
                              <Badge variant="outline" className="text-xs">
                                Prescription Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(medicine)}
                          disabled={!medicine.inStock || medicine.quantity === 0}
                          className="ml-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {medicine.quantity === 0 ? "Out of Stock" : "Add"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shopping Cart */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Your Cart</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription>
                  {cart.length === 0
                    ? "Your cart is empty"
                    : `${cart.length} item${cart.length > 1 ? "s" : ""} in your cart`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Add medicines to your cart</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.medicine.id} className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.medicine.name}</h4>
                          <p className="text-sm text-gray-500">${item.medicine.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartItemQuantity(item.medicine.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartItemQuantity(item.medicine.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeFromCart(item.medicine.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-4" />

                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={cart.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="delivery-method">Delivery Method</Label>
              <RadioGroup
                id="delivery-method"
                value={deliveryMethod}
                onValueChange={setDeliveryMethod}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Home Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup from Pharmacy</Label>
                </div>
              </RadioGroup>
            </div>

            {deliveryMethod === "delivery" && (
              <div className="space-y-2">
                <Label htmlFor="delivery-address">Delivery Address</Label>
                <Textarea
                  id="delivery-address"
                  placeholder="Enter your full address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <RadioGroup
                id="payment-method"
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash on Delivery/Pickup</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Credit/Debit Card</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for your order"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Items ({cart.reduce((total, item) => total + item.quantity, 0)}):</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{deliveryMethod === "delivery" ? "$2.99" : "Free"}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${(calculateTotal() + (deliveryMethod === "delivery" ? 2.99 : 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
