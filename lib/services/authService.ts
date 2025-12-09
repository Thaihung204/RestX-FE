// Mock Auth Service - Chỉ dùng để demo UI
// Khi có backend thật, uncomment import và code call API bên dưới

// import axiosInstance from './axiosInstance';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'shop';
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message?: string;
  error?: string;
}

const authService = {
  // Mock Login - Chỉ để demo UI
  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Mock user data based on email
    let mockUser: User;
    
    if (credentials.email.includes('admin')) {
      mockUser = {
        id: 'admin-001',
        email: credentials.email,
        name: 'Admin User',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User',
      };
    } else if (credentials.email.includes('shop')) {
      mockUser = {
        id: 'shop-001',
        email: credentials.email,
        name: 'Shop Manager',
        role: 'shop',
        avatar: 'https://ui-avatars.com/api/?name=Shop+Manager',
      };
    } else {
      mockUser = {
        id: 'user-001',
        email: credentials.email,
        name: 'Regular User',
        role: 'user',
        avatar: 'https://ui-avatars.com/api/?name=Regular+User',
      };
    }

    // Mock tokens
    const mockTokens = {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };

    // Store in localStorage
    localStorage.setItem('accessToken', mockTokens.accessToken);
    localStorage.setItem('refreshToken', mockTokens.refreshToken);
    localStorage.setItem('userInfo', JSON.stringify(mockUser));

    return mockUser;

    /* 
    // Real API call code - Uncomment when backend is ready
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(user));
        return user;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
    */
  },

  // Logout user
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Mock - Get current user from server
  async getCurrentUserFromServer(): Promise<User | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return user from localStorage (mock)
    const user = this.getCurrentUser();
    return user;

    /*
    // Real API call code - Uncomment when backend is ready
    try {
      const response = await axiosInstance.get<AuthResponse>('/auth/me');
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('userInfo', JSON.stringify(user));
        return user;
      }
      throw new Error(response.data.message || 'Failed to get user info');
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        this.logout();
        return null;
      }
      throw error;
    }
    */
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },
};

export default authService;
