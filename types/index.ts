// Comprehensive TypeScript types for Hotel Management System

// Base types
export type UUID = string;
export type Email = string;
export type Phone = string;
export type Currency = number; // Always in cents for precision

// Enums for consistent status tracking
export enum UserRole {
  CUSTOMER = 'customer',
  CLERK = 'clerk',
  MANAGER = 'manager',
  TRAVEL = 'travel'
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show'
}

export enum CheckinStatus {
  NOT_CHECKED_IN = 'not_checked_in',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out'
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  RESERVED = 'reserved'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  TRAVEL_COMPANY = 'travel_company'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum ServiceType {
  RESTAURANT = 'restaurant',
  ROOM_SERVICE = 'room_service',
  LAUNDRY = 'laundry',
  TELEPHONE = 'telephone',
  CLUB_ACCESS = 'club_access',
  KEY_ISSUING = 'key_issuing',
  OTHER = 'other'
}

export enum BillingType {
  NO_SHOW = 'no_show',
  LATE_CANCELLATION = 'late_cancellation',
  DAMAGE = 'damage',
  OTHER = 'other'
}

export enum BillingStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed'
}

export enum ResidentialDuration {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Database entity types
export interface LoyaltyProgram {
  id: UUID;
  tier_name: string;
  min_points: number;
  discount_percentage: number;
  benefits: string;
  created_at: Date;
}

export interface TravelCompany {
  id: UUID;
  company_name: string;
  contact_person: string | null;
  email: Email;
  phone: Phone | null;
  address: string | null;
  discount_rate: number;
  credit_limit: number;
  current_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: UUID;
  name: string;
  email: Email;
  password_hash: string;
  role: UserRole;
  phone: Phone | null;
  address: string | null;
  loyalty_points: number;
  loyalty_program_id: UUID | null;
  employee_id: string | null;
  travel_company_id: UUID | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoomType {
  id: UUID;
  type_name: string;
  description: string | null;
  base_price: number;
  capacity: number;
  amenities: string | null;
  is_residential: boolean;
  weekly_rate: number | null;
  monthly_rate: number | null;
  created_at: Date;
}

export interface Room {
  id: UUID;
  room_number: string;
  room_type_id: UUID;
  status: RoomStatus;
  floor: number | null;
  is_residential: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Reservation {
  id: UUID;
  user_id: UUID;
  room_type_id: UUID;
  check_in_date: Date;
  check_out_date: Date;
  num_guests: number;
  status: ReservationStatus;
  checkin_status: CheckinStatus;
  total_price: number;
  discount_amount: number;
  final_price: number;
  special_requests: string | null;
  has_credit_card: boolean;
  credit_card_last4: string | null;
  is_walk_in: boolean;
  is_travel_company: boolean;
  travel_company_id: UUID | null;
  is_residential: boolean;
  residential_duration: ResidentialDuration | null;
  created_at: Date;
  updated_at: Date;
}

export interface RoomAssignment {
  id: UUID;
  reservation_id: UUID;
  room_id: UUID;
  assigned_at: Date;
  assigned_by: UUID;
}

export interface Payment {
  id: UUID;
  reservation_id: UUID;
  amount: number;
  payment_date: Date;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  processed_by: UUID | null;
  notes: string | null;
}

export interface ServiceCharge {
  id: UUID;
  reservation_id: UUID;
  service_type: ServiceType;
  description: string;
  amount: number;
  charged_at: Date;
  charged_by: UUID;
  is_paid: boolean;
}

export interface BillingRecord {
  id: UUID;
  reservation_id: UUID;
  billing_type: BillingType;
  amount: number;
  description: string | null;
  billed_at: Date;
  billed_by: UUID | null;
  status: BillingStatus;
}

export interface DailyReport {
  id: UUID;
  report_date: Date;
  total_occupancy: number;
  total_rooms: number;
  occupancy_rate: number;
  total_revenue: number;
  total_reservations: number;
  total_check_ins: number;
  total_check_outs: number;
  total_cancellations: number;
  total_no_shows: number;
  generated_at: Date;
  generated_by: UUID | null;
}

// Extended types with joined data
export interface UserWithLoyalty extends User {
  loyalty_tier_name?: string;
}

export interface ReservationWithDetails extends Reservation {
  user_name: string;
  user_email: Email;
  room_type_name: string;
  room_number?: string;
  total_paid: number;
  outstanding_balance: number;
  service_charges_total: number;
}

export interface RoomWithType extends Room {
  room_type_name: string;
  room_type_description: string | null;
  base_price: number;
  capacity: number;
  amenities: string | null;
}

// API Request/Response types
export interface CreateReservationRequest {
  room_type_id: UUID;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  special_requests?: string;
  has_credit_card: boolean;
  credit_card_last4?: string;
  is_residential?: boolean;
  residential_duration?: ResidentialDuration;
  is_walk_in?: boolean;
}

export interface UpdateReservationRequest {
  check_out_date?: string;
  num_guests?: number;
  special_requests?: string;
  status?: ReservationStatus;
  checkin_status?: CheckinStatus;
  has_credit_card?: boolean;
  credit_card_last4?: string;
}

export interface CreatePaymentRequest {
  reservation_id: UUID;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}

export interface AddServiceChargeRequest {
  reservation_id: UUID;
  service_type: ServiceType;
  description: string;
  amount: number;
}

export interface CheckInRequest {
  reservation_id: UUID;
  room_id: UUID;
  assigned_by: UUID;
}

export interface CheckOutRequest {
  reservation_id: UUID;
  payment_method: PaymentMethod;
  amount: number;
  service_charges?: AddServiceChargeRequest[];
}

export interface CreateUserRequest {
  name: string;
  email: Email;
  password: string;
  role: UserRole;
  phone?: Phone;
  address?: string;
  employee_id?: string;
  travel_company_id?: UUID;
}

export interface LoginRequest {
  email: Email;
  password: string;
}

export interface LoginResponse {
  user: UserWithLoyalty;
  token: string;
}

// Dashboard data types
export interface DashboardStats {
  total_reservations: number;
  pending_reservations: number;
  current_guests: number;
  total_revenue: number;
  occupancy_rate: number;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  date_from?: string;
  date_to?: string;
  user_id?: UUID;
  room_type_id?: UUID;
}

// Report types
export interface OccupancyReport {
  date: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  revenue: number;
}

export interface FinancialReport {
  period: string;
  total_revenue: number;
  total_payments: number;
  outstanding_balance: number;
  service_charges: number;
  no_show_fees: number;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
}

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form types
export interface ReservationFormData {
  room_type_id: UUID;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  special_requests?: string;
  has_credit_card: boolean;
  credit_card_last4?: string;
}

export interface PaymentFormData {
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}

export interface ServiceChargeFormData {
  service_type: ServiceType;
  description: string;
  amount: number;
}

// Notification types
export interface Notification {
  id: UUID;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

// Cron job types
export interface CronJobResult {
  success: boolean;
  message: string;
  processed_count: number;
  errors?: string[];
}

export interface AutoCancelResult extends CronJobResult {
  cancelled_reservations: UUID[];
}

export interface NoShowBillingResult extends CronJobResult {
  billed_reservations: UUID[];
  total_billed: number;
}

export interface DailyReportResult extends CronJobResult {
  report_id: UUID;
  report_date: string;
  occupancy_rate: number;
  total_revenue: number;
} 