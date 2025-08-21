export type UserRole = 'user' | 'co-admin' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  office: string | null; // This will be an office ID
  status: UserStatus;
  onboardingComplete: boolean;
}

export interface Office {
  id: string;
  name: string;
}

export type DocumentStatus = 'draft' | 'in_transit' | 'signed' | 'completed' | 'rejected';

export interface DocumentLog {
  timestamp: Date; // Keep as Date for client-side display formatting
  status: DocumentStatus;
  officeId: string;
  officeName: string;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: any; // Can be Date or ServerTimestamp
  currentStatus: DocumentStatus;
  currentOfficeId: string;
  history: DocumentLog[];
}
