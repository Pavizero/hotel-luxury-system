"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Users, CreditCard, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function ReservationPage() {
  const [roomTypes, setRoomTypes] = useState<Array<{
    id: string;
    type_name: string;
    description: string | null;
    base_price: number;
    capacity: number;
    amenities: string | null;
    is_residential: boolean;
    weekly_rate: number | null;
    monthly_rate: number | null;
  }>>([])
  const searchParams = useSearchParams()
  const isModifying = searchParams.get("modify") === "true"
  const reservationId = searchParams.get("id")
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
    roomType: "",
    specialRequests: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skipPayment, setSkipPayment] = useState(false)
  const { toast } = useToast()
  const { user, loading } = useAuth()

  // Always call hooks before any return!
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch room types on component mount
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch('/api/room-types');
        if (response.ok) {
          const data = await response.json();
          setRoomTypes(data.roomTypes || []);
        }
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    console.log("Reservation modification debug:", { isModifying, reservationId, roomTypesLength: roomTypes.length })
    if (isModifying && reservationId && roomTypes.length > 0) {
      const fetchReservation = async () => {
        console.log("Fetching reservation with ID:", reservationId)
        try {
          const response = await fetch(`/api/reservations/${reservationId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log("Response status:", response.status)
          
          if (response.ok) {
            const existingReservation = await response.json();
            console.log("Fetched reservation:", existingReservation)
            console.log("Available room types:", roomTypes.map(r => ({ id: r.id, name: r.type_name })))
            
            if (existingReservation) {
              // For modification, we'll use the user's current data and only update reservation-specific fields
              const updatedFormData = {
                ...formData,
                firstName: user?.name?.split(" ")[0] || "",
                lastName: user?.name?.split(" ").slice(1).join(" ") || "",
                email: user?.email || "",
                phone: "", // Phone not stored in current schema
                checkIn: existingReservation.check_in_date ? new Date(existingReservation.check_in_date).toISOString().split('T')[0] : "",
                checkOut: existingReservation.check_out_date ? new Date(existingReservation.check_out_date).toISOString().split('T')[0] : "",
                guests: existingReservation.num_guests?.toString() || "1",
                roomType: (() => {
                  // Try to find by room type name first
                  let foundRoom = roomTypes.find((r) => r.type_name === existingReservation.room_type_name);
                  
                  // If not found by name, try by ID
                  if (!foundRoom && existingReservation.room_type_id) {
                    foundRoom = roomTypes.find((r) => r.id === existingReservation.room_type_id);
                  }
                  
                  console.log("Room type matching:", { 
                    existingType: existingReservation.room_type_name,
                    existingTypeId: existingReservation.room_type_id,
                    availableTypes: roomTypes.map(r => ({ id: r.id, name: r.type_name })),
                    foundRoom: foundRoom?.id 
                  });
                  
                  if (!foundRoom) {
                    console.warn("Room type not found, using first available room type");
                    return roomTypes.length > 0 ? roomTypes[0].id : "";
                  }
                  
                  return foundRoom.id;
                })(),
                specialRequests: existingReservation.special_requests || "",
                cardNumber: existingReservation.has_credit_card && existingReservation.credit_card_last4 ? `****${existingReservation.credit_card_last4}` : "",
                expiryDate: "",
                cvv: "",
                cardName: "",
              }
              console.log("Setting form data:", updatedFormData)
              setFormData(updatedFormData)
              // Set skip payment based on whether reservation has credit card
              setSkipPayment(!existingReservation.has_credit_card)
            } else {
              toast({
                title: "Error",
                description: "Reservation not found.",
                variant: "destructive",
              })
            }
          } else {
            const errorData = await response.json();
            console.error("Failed to fetch reservation:", errorData);
            toast({
              title: "Error",
              description: "Failed to fetch reservation.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error fetching reservation:", error);
          toast({
            title: "Error",
            description: "Failed to fetch reservation.",
            variant: "destructive",
          })
        }
      }
      fetchReservation()
    }
  }, [isModifying, reservationId, roomTypes, user, toast])

  const selectedRoom = roomTypes.find((room) => room.id === formData.roomType)
  const nights =
    formData.checkIn && formData.checkOut
      ? Math.ceil(
          (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0
  const totalAmount = selectedRoom ? selectedRoom.base_price * nights : 0

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const hasPaymentDetails =
    (formData.cardNumber && !formData.cardNumber.startsWith('****') && formData.expiryDate && formData.cvv && formData.cardName) ||
    (formData.cardNumber && formData.cardNumber.startsWith('****') && !skipPayment)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to make a reservation.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const paymentStatus = hasPaymentDetails && !skipPayment ? "paid" : "pending"

    const selectedRoomObj = roomTypes.find((r) => r.id === formData.roomType)
    if (!selectedRoomObj) {
      toast({
        title: "Error",
        description: "Please select a valid room type.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const reservationData = isModifying ? {
      check_out_date: formData.checkOut,
      num_guests: parseInt(formData.guests),
      special_requests: formData.specialRequests || undefined,
      has_credit_card: Boolean(hasPaymentDetails && !skipPayment),
      credit_card_last4: hasPaymentDetails ? (formData.cardNumber.startsWith('****') ? formData.cardNumber.slice(-4) : formData.cardNumber.slice(-4)) : undefined,
    } : {
      room_type_id: selectedRoomObj.id,
      check_in_date: formData.checkIn,
      check_out_date: formData.checkOut,
      num_guests: parseInt(formData.guests),
      special_requests: formData.specialRequests || undefined,
      has_credit_card: Boolean(hasPaymentDetails && !skipPayment),
      credit_card_last4: hasPaymentDetails ? formData.cardNumber.slice(-4) : undefined,
    }

    console.log("Submitting reservation data:", {
      isModifying,
      reservationData,
      hasPaymentDetails,
      skipPayment,
      cardNumber: formData.cardNumber,
      cardNumberStartsWithStar: formData.cardNumber?.startsWith('****')
    })

    try {
      if (isModifying && reservationId) {
        const response = await fetch(`/api/reservations/${reservationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reservationData),
        });
        
        if (response.ok) {
          toast({
            title: "Reservation Updated!",
            description: "Your reservation has been updated.",
          })
          router.push("/dashboard/customer")
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to update reservation.",
            variant: "destructive",
          })
        }
      } else {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reservationData),
        });
        
        if (response.ok) {
          toast({
            title: paymentStatus === "paid" ? "Reservation Confirmed!" : "Reservation Pending!",
            description:
              paymentStatus === "paid"
                ? "Thank you for your booking. Confirmation details have been sent to your email."
                : "Your reservation is pending. Please add payment details to confirm your booking.",
          })
          router.push("/dashboard/customer")
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to create reservation.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Error",
        description: "Failed to process reservation.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading reservation form...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isModifying ? "Modify Reservation" : "Book Your Stay"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isModifying
              ? "Update your reservation details"
              : "Experience luxury and comfort at Hotel Luxury"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reservation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Details</CardTitle>
                <CardDescription>
                  {isModifying ? "Update your reservation information" : "Fill in your booking details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="checkIn">Check-in Date</Label>
                        <Input
                          id="checkIn"
                          type="date"
                          value={formData.checkIn}
                          onChange={(e) => handleInputChange("checkIn", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkOut">Check-out Date</Label>
                        <Input
                          id="checkOut"
                          type="date"
                          value={formData.checkOut}
                          onChange={(e) => handleInputChange("checkOut", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <Select value={formData.guests} onValueChange={(value) => handleInputChange("guests", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select guests" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} Guest{num > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="roomType">Room Type</Label>
                        <Select value={formData.roomType} onValueChange={(value) => handleInputChange("roomType", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.type_name} - {formatCurrency(room.base_price)}/night
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        value={formData.specialRequests}
                        onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                        placeholder="Any special requests or preferences..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                    
                    {/* Show existing payment info for modifications */}
                    {isModifying && formData.cardNumber && formData.cardNumber.startsWith('****') && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Existing Payment Method</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          This reservation already has a credit card on file: {formData.cardNumber}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          You can update the payment method below or keep the existing one.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipPayment"
                        checked={skipPayment}
                        onCheckedChange={(checked) => setSkipPayment(checked as boolean)}
                      />
                      <Label htmlFor="skipPayment">
                        {isModifying ? "Remove payment method (pay later)" : "Skip payment for now (pay later)"}
                      </Label>
                    </div>
                    {!skipPayment && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            value={formData.cardName}
                            onChange={(e) => handleInputChange("cardName", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={formData.cardNumber}
                            onChange={(e) => {
                              // Format card number with spaces every 4 digits
                              let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                              if (value.length > 16) value = value.slice(0, 16);
                              const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                              handleInputChange("cardNumber", formatted);
                            }}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              value={formData.expiryDate}
                              onChange={(e) => {
                                // Format expiry date as MM/YY
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length > 4) value = value.slice(0, 4);
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2);
                                }
                                handleInputChange("expiryDate", value);
                              }}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={formData.cvv}
                              onChange={(e) => {
                                // Only allow 3-4 digits for CVV
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length > 4) value = value.slice(0, 4);
                                handleInputChange("cvv", value);
                              }}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Processing..." : isModifying ? "Update Reservation" : "Book Now"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Room Details */}
            {selectedRoom && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedRoom.type_name} Room</CardTitle>
                  <CardDescription>{selectedRoom.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities?.split(',').map((feature: string) => (
                          <Badge key={feature.trim()} variant="secondary">
                            {feature.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      Up to {selectedRoom.capacity} guests
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Room Rate</span>
                    <span>{selectedRoom ? formatCurrency(selectedRoom.base_price) : "Select room"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Notice */}
            {!skipPayment && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Information</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Your payment will be processed securely. You can also choose to pay later at the hotel.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}