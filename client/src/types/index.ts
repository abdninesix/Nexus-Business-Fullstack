export type UserRole = 'entrepreneur' | 'investor';

export interface EntrepreneurProfile {
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
}

export interface InvestorProfile {
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  createdAt: string;
  entrepreneurProfile?: EntrepreneurProfile;
  investorProfile?: InvestorProfile;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

// export interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string, role: UserRole) => Promise<void>;
//   register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
//   logout: () => void;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
//   updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
//   isAuthenticated: boolean;
//   isLoading: boolean;
// }

export interface AuthSuccessData {
  token: string;
  user: User; // Backend should return the full user object
}

export interface AuthResponse {
  token: string;
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  // The full user object with profiles is also returned,
  // so we can use the User type directly after login.
}


// --- Auth Context type ---
export interface AuthContextType {
  user: User | null;
  token: string | null;
  // This function now just sets state, it doesn't make an API call
  login: (data: AuthSuccessData) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  // This is for the initial load check, not for mutations
  isInitializing: boolean;
}

export interface ProfileState {
  name: string;
  email: string;
  bio: string;
  // Common fields end
  // Entrepreneur fields
  startupName?: string;
  industry?: string;
  location?: string;
  fundingNeeded?: string;
  // Investor fields
  investmentInterests?: string; // Stored as a comma-separated string for the input
  minimumInvestment?: string;
  maximumInvestment?: string;
}