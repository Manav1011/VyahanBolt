export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  PUBLIC = 'PUBLIC'
}

export interface Office {
  id: string;
  name: string;
  username?: string; // Owner username for login
  currentOperationalDate?: string;
  lastDayEndAt?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  officeId?: string; // Only for OFFICE_ADMIN
}

export enum ParcelStatus {
  BOOKED = 'BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED'
}

export enum PaymentMode {
  SENDER_PAYS = 'SENDER_PAYS',
  RECEIVER_PAYS = 'RECEIVER_PAYS'
}

export interface TrackingEvent {
  status: ParcelStatus;
  timestamp: number;
  location: string; // Office Name or "Transit"
  note?: string;
}

export interface Parcel {
  slug: string; // Using slug as id from backend
  trackingId: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  sourceOfficeId: string;
  destinationOfficeId: string;
  sourceOfficeTitle?: string;
  destinationOfficeTitle?: string;
  description: string;
  paymentMode: PaymentMode;
  price: number;
  currentStatus: ParcelStatus;
  bus?: Bus; // Associated bus
  history: TrackingEvent[];
  createdAt: string; // ISO string from backend
  day?: string; // ISO date string (YYYY-MM-DD) from backend
}

export interface NotificationLog {
  id: string;
  timestamp: number;
  recipient: string; // "Sender" or "Receiver"
  phone: string;
  message: string;
}

export interface Bus {
  slug: string;
  busNumber: string;
  preferredDays: number[]; // 1=Monday, 7=Sunday
  description?: string;
}

// Analytics Types
export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  status?: string[];
  branchSlug?: string;
  sourceBranchSlug?: string;
  destinationBranchSlug?: string;
  busSlug?: string;
  paymentMode?: PaymentMode;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PaymentModeCount {
  payment_mode: string;
  count: number;
}

export interface BranchCount {
  branch: {
    slug: string;
    title: string;
  };
  count: number;
  total_revenue: string;
}

export interface AnalyticsSummary {
  total_shipments: number;
  total_revenue: string;
  average_price: string;
  by_status: StatusCount[];
  by_payment_mode: PaymentModeCount[];
  by_branch?: BranchCount[];
}

export interface AnalyticsData {
  slug: string;
  tracking_id: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description: string;
  source_branch: {
    slug: string;
    title: string;
  };
  destination_branch: {
    slug: string;
    title: string;
  };
  bus: {
    slug: string;
    bus_number: string;
    preferred_days: number[];
  } | null;
  price: string;
  payment_mode: string;
  current_status: string;
  created_at: string;
  day: string;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  data: AnalyticsData[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}