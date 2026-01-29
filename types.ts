export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  PUBLIC = 'PUBLIC'
}

export interface Office {
  id: string;
  name: string;
  username?: string; // Owner username for login
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