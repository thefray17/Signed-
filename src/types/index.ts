
export type UserRole = 'user' | 'co-admin' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  office: string | null; // This will be an office ID
  officeName?: string; // Add office name for convenience
  status: UserStatus;
  onboardingComplete: boolean;
}

export interface Office {
  id: string;
  name: string;
}

export type DocumentStatus = 'draft' | 'in_transit' | 'pending_transit' | 'signed' | 'completed' | 'rejected';

export interface DocumentLog {
  timestamp: any; // Can be Date on client or ServerTimestamp on server
  status: DocumentStatus;
  officeId: string;
  officeName?: string;
  recipientRole?: string;
  notes?: string;
  signedBy?: {
    uid: string;
    name: string;
  }
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

export type NotificationType = 'document_signed' | 'document_received';

export interface Notification {
    id: string;
    type: NotificationType;
    document: {
        id: string;
        title: string;
    };
    actor?: {
        name: string;
    };
    timestamp: any;
    read: boolean;
}
