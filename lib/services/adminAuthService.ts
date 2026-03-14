import adminAxiosInstance from './adminAxiosInstance';

export interface AdminLoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    admin: AdminUser;
  };
  error?: string;
}

// Cookie helpers for super admin
function setAdminAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  const maxAge = 8 * 60 * 60; // 8 hours
  document.cookie = `adminAccessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAdminAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'adminAccessToken=; path=/; max-age=0; SameSite=Lax';
}

const adminAuthService = {
  async login(credentials: AdminLoginCredentials): Promise<AdminUser> {
    try {
      const response = await adminAxiosInstance.post<AdminAuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const data = response.data;
      if (!data.success || !data.data?.accessToken) {
        throw new Error(data.message || 'Invalid login response');
      }

      const { accessToken, refreshToken, admin } = data.data;

      // Ensure roles check for SuperAdmin
      if (!admin.roles || admin.roles.length === 0) {
        throw new Error('User has no roles assigned.');
      }

      localStorage.setItem('adminAccessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
      localStorage.setItem('adminUserInfo', JSON.stringify(admin));

      setAdminAuthCookie(accessToken);

      return admin;
    } catch (error: any) {
      console.error('Admin Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new Error('Invalid email or password');
      }
      throw new Error('Failed to login. Please try again.');
    }
  },

  logout() {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUserInfo');
    clearAdminAuthCookie();
  },

  getCurrentAdmin(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const userInfo = localStorage.getItem('adminUserInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminAccessToken');
  }
};

export default adminAuthService;
