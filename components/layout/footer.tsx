import Link from "next/link"
import { HotelIcon } from "lucide-react" // Assuming HotelIcon is now imported from lucide-react or defined elsewhere

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-6 md:px-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
            <HotelIcon className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-bold text-white">Hotel Luxury</span>
          </Link>
          <p className="text-sm">
            Experience unparalleled luxury and comfort at Hotel Luxury. Your perfect getaway awaits.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Quick Links</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/" className="hover:text-amber-600" prefetch={false}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-amber-600" prefetch={false}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/reservation" className="hover:text-amber-600" prefetch={false}>
                Reservations
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-amber-600" prefetch={false}>
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Contact Us</h3>
          <p className="text-sm">
            123 Ocean Drive, Galle, Sri Lanka
            <br />
            Phone: +94 11 234 5678
            <br />
            Email: info@hotelluxury.com
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Follow Us</h3>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-amber-600" prefetch={false}>
              Facebook
            </Link>
            <Link href="#" className="hover:text-amber-600" prefetch={false}>
              Instagram
            </Link>
            <Link href="#" className="hover:text-amber-600" prefetch={false}>
              Twitter
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Hotel Luxury. All rights reserved.
      </div>
    </footer>
  )
}
