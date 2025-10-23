"use client"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Users, Heart, Globe } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <Image src="/images/sri-lanka-hotel-about.jpg" alt="About Our Hotel" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">About Our Hotel</h1>
          <p className="text-xl opacity-90">Discover our story and commitment to excellence</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Nestled along the pristine coastline of Sri Lanka, our luxury resort has been a beacon of hospitality
                for over two decades. What began as a vision to create an unparalleled guest experience has evolved into
                one of the island&apos;s most celebrated destinations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-bold mb-4">Heritage & Tradition</h3>
                <p className="text-gray-600 mb-4">
                  Our hotel seamlessly blends traditional Sri Lankan architecture with modern luxury amenities. Every
                  corner tells a story of the rich cultural heritage that makes this island nation so special.
                </p>
                <p className="text-gray-600">
                  From the intricately carved wooden details to the lush tropical gardens, we&apos;ve created a space that
                  honors the past while embracing the future of hospitality.
                </p>
              </div>
              <div className="relative h-80">
                <Image
                  src="/images/sri-lanka-hotel-about.jpg"
                  alt="Hotel Heritage"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We strive for perfection in every detail, from service to amenities, ensuring an exceptional
                  experience.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We&apos;re committed to supporting local communities and preserving the natural beauty of Sri Lanka.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle>Hospitality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Genuine warmth and care are at the heart of everything we do, making every guest feel at home.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Globe className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle>Sustainability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We&apos;re dedicated to environmental responsibility and sustainable tourism practices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Recognition & Awards</h2>
            <p className="text-xl text-gray-600">Honored for our commitment to excellence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Badge className="bg-amber-600 text-white mb-4 mx-auto w-fit">2023</Badge>
                <CardTitle>Best Luxury Resort</CardTitle>
                <CardDescription>Sri Lanka Tourism Awards</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Recognized for outstanding service and facilities in the luxury hospitality sector.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Badge className="bg-amber-600 text-white mb-4 mx-auto w-fit">2022</Badge>
                <CardTitle>Sustainable Tourism</CardTitle>
                <CardDescription>Green Hotel Association</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Awarded for our commitment to environmental conservation and sustainable practices.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Badge className="bg-amber-600 text-white mb-4 mx-auto w-fit">2021</Badge>
                <CardTitle>Excellence in Service</CardTitle>
                <CardDescription>International Hotel Awards</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Honored for exceptional guest service and hospitality standards.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind your perfect stay</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">RJ</span>
                </div>
                <CardTitle>Rajesh Jayawardena</CardTitle>
                <CardDescription>General Manager</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  With over 20 years in hospitality, Rajesh ensures every guest receives world-class service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">SP</span>
                </div>
                <CardTitle>Samantha Perera</CardTitle>
                <CardDescription>Head of Guest Relations</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Samantha leads our guest relations team with warmth and dedication to guest satisfaction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">KS</span>
                </div>
                <CardTitle>Kumara Silva</CardTitle>
                <CardDescription>Executive Chef</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Chef Kumara creates culinary masterpieces that showcase the best of Sri Lankan cuisine.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
