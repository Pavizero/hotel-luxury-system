"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Calendar, MapPin, Users, CreditCard, FileText, Star, Phone, Download } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Reservation {
  id: string
  room_type_name: string
  check_in_date: string
  check_out_date: string
  num_guests: number
  status: "confirmed" | "pending" | "completed" | "cancelled" | "no-show"
  final_price: number
  total_paid: number
  outstanding_balance: number
}

interface LoyaltyPoints {
  current: number
  tier: string
  nextTier: string
  pointsToNext: number
}

const loyaltyBenefits = [
  { tier: "Bronze", benefits: ["5% discount on rooms", "Late checkout until 1 PM", "Welcome drink"] },
  {
    tier: "Silver",
    benefits: [
      "10% discount on rooms",
      "Late checkout until 2 PM",
      "Room upgrade (subject to availability)",
      "Spa discount 15%",
    ],
  },
  {
    tier: "Gold",
    benefits: [
      "15% discount on rooms",
      "Late checkout until 3 PM",
      "Guaranteed room upgrade",
      "Spa discount 25%",
      "Airport transfer",
    ],
  },
  {
    tier: "Platinum",
    benefits: [
      "20% discount on rooms",
      "Late checkout until 4 PM",
      "Suite upgrade",
      "Spa discount 35%",
      "Personal concierge",
      "Exclusive dining",
    ],
  },
]

export default function CustomerDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(null)
  const [isBenefitsOpen, setIsBenefitsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading } = useAuth()

  // Only show dashboard if user is authenticated and is a customer
  useEffect(() => {
    if (!loading && (!user || user.role !== "customer")) {
      router.replace("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      
      try {
        // Fetch reservations using the new API
        const reservationsResponse = await fetch('/api/reservations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setReservations(reservationsData.reservations || []);
        }
        
        // For now, use mock loyalty data until we implement the loyalty service
        setLoyaltyPoints({
          current: 150,
          tier: "Bronze",
          nextTier: "Silver",
          pointsToNext: 350
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load your reservations.",
          variant: "destructive",
        });
      }
    }
    if (user?.id) fetchData()
  }, [user?.id, toast])

  const handleModifyReservation = (reservationId: string) => {
    router.push(`/reservation?modify=true&id=${reservationId}`)
  }

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast({
          title: "Cancellation Request Submitted",
          description: "Your cancellation request has been submitted. We'll process it within 24 hours.",
        })
        // Refresh reservations
        const reservationsResponse = await fetch('/api/reservations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setReservations(reservationsData.reservations || []);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: "Failed to cancel reservation: " + (errorData.error || "Unknown error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Cancellation failed due to a network error.",
        variant: "destructive",
      })
    }
  }

  const handleViewInvoice = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    if (reservation) {
      const invoiceContent = `
HOTEL LUXURY - INVOICE
=====================
Invoice #: INV-${reservation.id}
Date: ${new Date().toLocaleDateString()}

RESERVATION DETAILS:
Room Type: ${reservation.room_type_name}
Check-in: ${formatDate(reservation.check_in_date)}
Check-out: ${formatDate(reservation.check_out_date)}
Guests: ${reservation.num_guests}
Status: ${reservation.status}

FINANCIAL SUMMARY:
Total Amount: ${formatCurrency(reservation.final_price)}
Paid Amount: ${formatCurrency(reservation.total_paid)}
Outstanding: ${formatCurrency(reservation.outstanding_balance)}

Thank you for choosing Hotel Luxury!
      `

      const blob = new Blob([invoiceContent], { type: "text/plain" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${reservation.id}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Invoice Downloaded",
        description: "Your invoice has been downloaded successfully.",
      })
    }
  }

  const handleNewReservation = () => {
    router.push("/reservation")
  }

  const handlePaymentHistory = () => {
    toast({
      title: "Payment History",
      description: "Redirecting to payment history page... (Simulated)",
    })
  }

  const handleHotelServices = () => {
    toast({
      title: "Hotel Services",
      description: "Our concierge will contact you shortly to assist with hotel services. (Simulated)",
    })
  }

  const handleDownloadReports = () => {
    const reportContent = `
HOTEL LUXURY - GUEST REPORT
===========================
Generated: ${new Date().toLocaleString()}

GUEST SUMMARY:
Total Reservations: ${reservations.length}
Total Spent: ${formatCurrency(reservations.reduce((sum, r) => sum + r.final_price, 0))}
Loyalty Points: ${loyaltyPoints?.current || 0}
Current Tier: ${loyaltyPoints?.tier || "None"}

RESERVATION HISTORY:
${reservations
  .map(
    (r) => `
- ${r.id}: ${r.room_type_name}
  Check-in: ${formatDate(r.check_in_date)}
  Check-out: ${formatDate(r.check_out_date)}
  Status: ${r.status}
  Amount: ${formatCurrency(r.final_price)}
`
  )
  .join("")}
      `

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `guest-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Report Downloaded",
      description: "Your guest report has been downloaded successfully.",
    })
  }

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Our support team will contact you shortly. (Simulated)",
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
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "customer") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your reservations and view your loyalty status</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reservations.filter((r) => r.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyPoints?.current || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-LK', { 
                      style: 'currency', 
                      currency: 'LKR' 
                    }).format(
                      reservations.reduce((sum, r) => sum + (r.final_price || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 text-yellow-600 mr-2" />
              Loyalty Status
            </CardTitle>
            <CardDescription>
              Current tier: {loyaltyPoints?.tier || "None"} • Next tier: {loyaltyPoints?.nextTier || "Bronze"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to {loyaltyPoints?.nextTier || "Bronze"}</span>
                  <span>{loyaltyPoints?.current || 0} / {loyaltyPoints?.pointsToNext || 500} points</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((loyaltyPoints?.current || 0) / (loyaltyPoints?.pointsToNext || 500)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsBenefitsOpen(true)}
                className="w-full"
              >
                View Benefits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reservations */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Reservations</h2>
            <Button onClick={handleNewReservation}>New Reservation</Button>
          </div>

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                <p className="text-gray-600 mb-4">Start by making your first reservation</p>
                <Button onClick={handleNewReservation}>Book Now</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{reservation.room_type_name}</h3>
                        <p className="text-gray-600">
                          {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(reservation.status)}>
                          {reservation.status}
                        </Badge>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {formatCurrency(reservation.final_price)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {reservation.num_guests} guests
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <Badge className={getPaymentStatusColor(reservation.outstanding_balance > 0 ? "pending" : "paid")}>
                          {reservation.outstanding_balance > 0 ? "pending" : "paid"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModifyReservation(reservation.id)}
                        disabled={reservation.status === "cancelled"}
                      >
                        Modify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(reservation.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={reservation.status === "cancelled"}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={handleNewReservation} className="h-20">
              <Calendar className="h-6 w-6 mr-2" />
              New Reservation
            </Button>
            <Button variant="outline" onClick={handlePaymentHistory} className="h-20">
              <CreditCard className="h-6 w-6 mr-2" />
              Payment History
            </Button>
            <Button variant="outline" onClick={handleHotelServices} className="h-20">
              <MapPin className="h-6 w-6 mr-2" />
              Hotel Services
            </Button>
            <Button variant="outline" onClick={handleDownloadReports} className="h-20">
              <Download className="h-6 w-6 mr-2" />
              Download Reports
            </Button>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                  <p className="text-gray-600">Contact our support team for assistance</p>
                </div>
                <Button onClick={handleContactSupport}>
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loyalty Benefits Dialog */}
      <Dialog open={isBenefitsOpen} onOpenChange={setIsBenefitsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loyalty Program Benefits</DialogTitle>
            <DialogDescription>
              Explore the benefits available at each loyalty tier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {loyaltyBenefits.map((tier) => (
              <div key={tier.tier} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tier.tier} Tier</h3>
                <ul className="space-y-1">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}