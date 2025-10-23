"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, Phone, Mail, MapPin, Calendar, Users, CreditCard, FileText, Edit, Trash2, Building } from "lucide-react"

interface Booking {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  bookingDate: string
  checkIn: string
  checkOut: string
  rooms: number
  guests: number
  roomTypes: string
  totalAmount: number
  paidAmount: number
  status: string
  paymentStatus: string
}

async function safeJson(response: Response) {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}

export default function TravelDashboard() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkBookingOpen, setIsBulkBookingOpen] = useState(false)
  const [isModifyBookingOpen, setIsModifyBookingOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return
      try {
        // Fetch bookings using the new API
        const response = await fetch('/api/travel/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            setBookings(data.bookings || []);
          } catch (parseError) {
            console.error("Error parsing bookings response:", parseError);
            setBookings([]);
          }
        } else {
          throw new Error('Failed to fetch bookings');
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchBookings()
    }
  }, [user?.id, toast])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/travel/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "The booking has been cancelled successfully.",
        })
        // Refresh bookings
        const bookingsResponse = await fetch('/api/travel/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (bookingsResponse.ok) {
          try {
            const data = await bookingsResponse.json();
            setBookings(data.bookings || []);
          } catch (parseError) {
            console.error("Error parsing refresh bookings response:", parseError);
          }
        }
      } else {
        let errorMessage = "Failed to cancel booking.";
        try {
          const errorData = await safeJson(response);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancel booking error:", error)
      toast({
        title: "Error",
        description: "Failed to cancel booking.",
        variant: "destructive",
      })
    }
  }

  const handleModifyBooking = async (bookingId: string, updates: { [key: string]: string | number | Date }) => {
    try {
      const response = await fetch(`/api/travel/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        toast({
          title: "Booking Updated",
          description: "The booking has been updated successfully.",
        })
        // Refresh bookings
        const bookingsResponse = await fetch('/api/travel/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (bookingsResponse.ok) {
          try {
            const data = await bookingsResponse.json();
            setBookings(data.bookings || []);
          } catch (parseError) {
            console.error("Error parsing refresh bookings response:", parseError);
          }
        }
      } else {
        let errorMessage = "Failed to update booking.";
        try {
          const errorData = await safeJson(response);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update booking error:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      })
    }
  }

  const handlePayment = async (bookingId: string, amount: number, paymentMethod: string, reference: string) => {
    try {
      const response = await fetch('/api/travel/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethod,
          reference
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Payment Processed",
          description: `Payment of ${formatCurrency(amount)} has been processed successfully.`,
        })
        // Refresh bookings
        const bookingsResponse = await fetch('/api/travel/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (bookingsResponse.ok) {
          try {
            const data = await bookingsResponse.json();
            setBookings(data.bookings || []);
          } catch (parseError) {
            console.error("Error parsing refresh bookings response:", parseError);
          }
        }
      } else {
        let errorMessage = "Failed to process payment.";
        try {
          const errorData = await safeJson(response);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Error",
        description: "Failed to process payment.",
        variant: "destructive",
      })
    }
  }

  const handleBulkBooking = async (formData: FormData) => {
    try {
      const checkIn = formData.get("checkIn") as string
      const checkOut = formData.get("checkOut") as string
      const rooms = parseInt(formData.get("rooms") as string)
      const guests = parseInt(formData.get("guests") as string)
      const roomTypes = (formData.get("roomTypes") as string).split(",").map((t) => t.trim())
      const totalAmount = parseFloat(formData.get("totalAmount") as string)

      const bookingData = {
        checkIn,
        checkOut,
        rooms,
        guests,
        roomTypes,
        totalAmount,
      }

      const response = await fetch('/api/travel/bulk-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (response.ok) {
        toast({
          title: "Bulk Booking Created",
          description: `Bulk booking has been created. Total: ${formatCurrency(totalAmount)}.`,
        })
        // Refresh bookings
        const bookingsResponse = await fetch('/api/travel/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (bookingsResponse.ok) {
          try {
            const data = await bookingsResponse.json();
            setBookings(data.bookings || []);
          } catch (parseError) {
            console.error("Error parsing refresh bookings response:", parseError);
          }
        }
      } else {
        let errorMessage = "Failed to create bulk booking.";
        try {
          const errorData = await safeJson(response);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Bulk booking error:", error);
      toast({
        title: "Error",
        description: "Failed to create bulk booking",
        variant: "destructive",
      })
    }
  }

  const generateInvoice = (booking: Booking) => {
    const invoiceContent = `
HOTEL LUXURY - TRAVEL COMPANY INVOICE
=====================================
Invoice #: INV-${booking.id}
Date: ${new Date().toLocaleDateString()}

COMPANY DETAILS:
Company: ${booking.companyName}
Contact: ${booking.contactPerson}
Email: ${booking.email}
Phone: ${booking.phone}

BOOKING DETAILS:
Check-in: ${formatDate(booking.checkIn)}
Check-out: ${formatDate(booking.checkOut)}
Rooms: ${booking.rooms}
Guests: ${booking.guests}
Room Types: ${booking.roomTypes}

FINANCIAL SUMMARY:
Total Amount: ${formatCurrency(booking.totalAmount)}
Paid Amount: ${formatCurrency(booking.paidAmount)}
Outstanding: ${formatCurrency(booking.totalAmount - booking.paidAmount)}
Payment Status: ${booking.paymentStatus}

Thank you for choosing Hotel Luxury!
    `

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${booking.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Invoice Downloaded",
      description: "Invoice has been downloaded successfully.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading travel dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "travel") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-gray-900">Unauthorized</CardTitle>
            <CardDescription className="text-gray-600">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Travel Company Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage bulk bookings and travel arrangements</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Guests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.reduce((sum, booking) => sum + booking.guests, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bookings.reduce((sum, booking) => sum + booking.totalAmount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bookings.reduce((sum, booking) => sum + booking.paidAmount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Bookings</h2>
            <Button onClick={() => setIsBulkBookingOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              New Bulk Booking
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading bookings...</p>
              </CardContent>
            </Card>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">Start by creating your first bulk booking</p>
                <Button onClick={() => setIsBulkBookingOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Booking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.companyName}</h3>
                        <p className="text-gray-600">
                          Contact: {booking.contactPerson} • {booking.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {booking.guests} guests
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        {booking.rooms} rooms
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.roomTypes}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsModifyBookingOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInvoice(booking)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePayment(booking.id, booking.totalAmount - booking.paidAmount, "credit_card", `PAY-${Date.now()}`)}
                        disabled={booking.paymentStatus === "paid"}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Balance
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={booking.status === "cancelled"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Booking Dialog */}
      {isBulkBookingOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">New Bulk Booking</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleBulkBooking(new FormData(e.currentTarget))
              setIsBulkBookingOpen(false)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    name="checkIn"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    name="checkOut"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
                  <input
                    type="number"
                    name="rooms"
                    min="1"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    onChange={(e) => {
                      const rooms = parseInt(e.target.value);
                      const autoConfirm = rooms >= 2;
                      if (autoConfirm) {
                        toast({
                          title: "Auto-Confirmation",
                          description: "2+ rooms will be automatically confirmed!",
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">2+ rooms = auto-confirmation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Guests</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  name="roomTypes"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select room type</option>
                  <option value="Standard">Standard Room</option>
                  <option value="Deluxe">Deluxe Room</option>
                  <option value="Executive Suite">Executive Suite</option>
                  <option value="Residential">Residential</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (LKR)</label>
                <input
                  type="number"
                  name="totalAmount"
                  step="0.01"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Bulk Booking Benefits</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 2+ rooms: Automatic confirmation</li>
                  <li>• 1 room: Pending until payment</li>
                  <li>• Special rates for travel companies</li>
                  <li>• Flexible payment terms</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Create Bulk Booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkBookingOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Booking Dialog */}
      {isModifyBookingOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modify Booking</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updates = {
                checkIn: formData.get("checkIn") as string,
                checkOut: formData.get("checkOut") as string,
                rooms: parseInt(formData.get("rooms") as string),
                guests: parseInt(formData.get("guests") as string),
                totalAmount: parseFloat(formData.get("totalAmount") as string),
              }
              handleModifyBooking(selectedBooking.id, updates)
              setIsModifyBookingOpen(false)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    name="checkIn"
                    defaultValue={selectedBooking.checkIn}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    name="checkOut"
                    defaultValue={selectedBooking.checkOut}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                  <input
                    type="number"
                    name="rooms"
                    min="1"
                    defaultValue={selectedBooking.rooms}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    defaultValue={selectedBooking.guests}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="number"
                  name="totalAmount"
                  step="0.01"
                  defaultValue={selectedBooking.totalAmount}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update Booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModifyBookingOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}