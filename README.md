# Hotel Luxury Management System

A comprehensive, full-stack hotel management system built with Next.js, TypeScript, and MySQL. This system provides complete hotel operations management including reservations, check-ins/check-outs, billing, reporting, and automated tasks.

## 🏨 Features

### Customer Features
- **Reservation Management**: Make, update, and cancel reservations
- **Credit Card Support**: Secure payment processing with or without credit card information
- **Loyalty Program**: Earn points and receive discounts based on tier
- **Residential Suites**: Book weekly or monthly extended stays
- **Real-time Status**: Track reservation status updates

### Clerk Features
- **Check-in/Check-out**: Process guest arrivals and departures
- **Room Assignment**: Assign specific rooms to guests
- **Walk-in Reservations**: Create reservations for walk-in guests
- **Service Charges**: Add restaurant, room service, laundry, and other charges
- **Payment Processing**: Handle cash, credit card, and travel company payments
- **Room Management**: Mark rooms as cleaned and available

### Manager Features
- **Occupancy Reports**: View past, current, and forecasted occupancy
- **Financial Reports**: Revenue summaries and financial analytics
- **Daily Reports**: Automated daily occupancy and revenue reports
- **No-show Billing**: Automatic billing for no-show guests
- **System Monitoring**: Monitor all hotel operations

### Travel Company Features
- **Bulk Reservations**: Reserve 3+ rooms with discounted rates
- **Company Billing**: Direct billing to travel companies
- **Credit Management**: Manage company credit limits and balances

### Automated Features
- **Auto-cancellation**: Unpaid reservations cancelled at 7 PM daily
- **No-show Billing**: Automatic billing for no-show guests at 7 PM
- **Daily Reports**: Automated daily occupancy and revenue reports
- **Status Tracking**: Real-time reservation status updates across all dashboards

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: MySQL (XAMPP)
- **Authentication**: JWT with bcrypt
- **UI Components**: Radix UI, Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context

## 📋 Prerequisites

- Node.js 18+ 
- XAMPP (for MySQL)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hotel-luxury-system
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Database Setup

#### Start XAMPP
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Open phpMyAdmin at `http://localhost/phpmyadmin`

#### Create Database
1. Create a new database named `hotel_luxury`
2. Import the SQL files in order:
   - `db/001_create_tables.sql` - Creates all tables
   - `db/002_seed_data.sql` - Seeds initial data

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL=mysql://root:@localhost:3306/hotel_luxury

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Cron Job Secret (for automated tasks)
CRON_SECRET_TOKEN=your-cron-secret-token-here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 5. Run the Development Server
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 User Accounts

The system comes with pre-configured test accounts:

### Customer Accounts
- **Email**: `customer@hotel.com` | **Password**: `password`
- **Email**: `alice@hotel.com` | **Password**: `password` (Silver tier)
- **Email**: `bob@hotel.com` | **Password**: `password` (Gold tier)

### Staff Accounts
- **Email**: `clerk@hotel.com` | **Password**: `password`
- **Email**: `manager@hotel.com` | **Password**: `password`

### Travel Company Accounts
- **Email**: `sarah@luxurytours.com` | **Password**: `password`
- **Email**: `mike@globaltravel.com` | **Password**: `password`

## 📊 Database Schema

### Core Tables
- **users**: User accounts with roles (customer, clerk, manager, travel)
- **reservations**: Reservation details with status tracking
- **rooms**: Physical rooms with status and type
- **room_types**: Room categories with pricing
- **payments**: Payment records and history
- **service_charges**: Additional services and charges
- **billing_records**: No-show and other billing records
- **daily_reports**: Automated daily reports

### Supporting Tables
- **loyalty_programs**: Customer loyalty tiers
- **travel_companies**: Travel company information
- **room_assignments**: Room-to-reservation assignments

## 🔄 Reservation Workflow

1. **Pending**: All new reservations start as pending
2. **Confirmed**: Payment received or credit card provided
3. **Checked-in**: Guest checked in with room assignment
4. **Checked-out**: Guest checked out with final payment
5. **Cancelled**: Reservation cancelled (auto or manual)
6. **No-show**: Guest didn't arrive, billed automatically

## 🤖 Automated Tasks

### Daily Cron Jobs (7 PM)
- **Auto-cancel unpaid reservations**: Cancels reservations without credit cards
- **No-show billing**: Bills guests who didn't check in
- **Daily report generation**: Creates occupancy and revenue reports

### Setup Cron Job
Add this to your system's crontab:
```bash
0 19 * * * curl -X POST http://localhost:3000/api/cron/daily-tasks \
  -H "Authorization: Bearer your-cron-secret-token-here"
```

## 📱 API Endpoints

### Reservations
- `GET /api/reservations` - Get reservations (filtered by role)
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations?id={id}` - Update reservation
- `DELETE /api/reservations?id={id}` - Cancel reservation

### Clerk Operations
- `POST /api/clerk/check-in` - Check in guest
- `POST /api/clerk/check-out` - Check out guest
- `GET /api/clerk/rooms` - Get available rooms
- `POST /api/clerk/service-charges` - Add service charges

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/history?id={reservationId}` - Get payment history
- `POST /api/payments/refund` - Process refund

### Reports
- `GET /api/reports/occupancy` - Get occupancy reports
- `GET /api/reports/financial` - Get financial reports
- `GET /api/reports/daily` - Get daily reports

## 🎨 UI Components

The system uses a comprehensive set of UI components:
- **Forms**: Reservation forms, payment forms, check-in forms
- **Tables**: Reservation lists, guest lists, payment history
- **Cards**: Dashboard cards, room cards, reservation cards
- **Modals**: Check-in modal, payment modal, service charge modal
- **Charts**: Occupancy charts, revenue charts, trend charts

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different dashboards for different user types
- **Input Validation**: Comprehensive form validation with Zod
- **SQL Injection Protection**: Parameterized queries throughout
- **Password Hashing**: bcrypt for secure password storage

## 🧪 Testing

### Manual Testing
1. **Customer Flow**: Create reservation → Make payment → Check status
2. **Clerk Flow**: Check in guest → Add charges → Check out guest
3. **Manager Flow**: View reports → Monitor occupancy → Review finances
4. **Travel Flow**: Create bulk reservation → Company billing

### Automated Testing
```bash
# Run tests
npm test

# Run specific test suites
npm run test:reservations
npm run test:payments
npm run test:reports
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
DATABASE_URL=mysql://user:password@host:3306/hotel_luxury
JWT_SECRET=production-jwt-secret
CRON_SECRET_TOKEN=production-cron-token
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=production-nextauth-secret
```

## 📝 Development Guidelines

### Code Structure
- **Services**: Business logic in `/lib/services/`
- **Types**: TypeScript types in `/types/`
- **API Routes**: RESTful endpoints in `/app/api/`
- **Components**: Reusable UI components in `/components/`
- **Pages**: Next.js pages in `/app/`

### Coding Standards
- **TypeScript**: Strict typing throughout
- **Error Handling**: Comprehensive error handling
- **Validation**: Input validation with Zod
- **Documentation**: JSDoc comments for all functions
- **Testing**: Unit tests for all services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs/`
- Review the testing guide in `TESTING_GUIDE.md`

---

**Built with ❤️ for modern hotel management**
