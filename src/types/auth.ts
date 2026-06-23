export interface AuthUser {
  userId: string;
  accountId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  isProMember: boolean;
  avatarUrl: string;
  proExpiredAt: string | null;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phoneNumber: string;
  role: 'Reader';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}
