import axiosInstance from "./axiosInstance";

export type DashboardFilterType = "today" | "week" | "month" | "year";

export interface DashboardOverviewParams {
  filterType: DashboardFilterType;
  top?: number;
  sortBy?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DashboardPeriodParams {
  filterType: DashboardFilterType;
  fromDate?: string;
  toDate?: string;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  revenueTrend: RevenueTrend;
  orderTrend: OrderTrend;
  topDishes: TopDishes;
  tableStatus: TableStatus;
  customerStats: CustomerStats;
  recentFeedbacks?: RecentFeedbacks;
  promotionStats?: PromotionStats;
}

export interface DashboardSummary {
  fromDate: string;
  toDate: string;
  revenue: {
    total: number;
    changePercent: number;
  };
  orders: {
    total: number;
    open: number;
    completed: number;
    cancelled: number;
    liveProcessing: number;
  };
  reservations: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    liveServing: number;
  };
  newCustomers: {
    total: number;
    changePercent: number;
  };
}

export interface RevenueTrendPoint {
  label: string;
  date: string;
  value: number;
}

export interface RevenueTrend {
  filterType: string;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  revenueTrends: RevenueTrendPoint[];
}

export interface OrderTrendPoint {
  label: string;
  date: string;
  total: number;
}

export interface OrderTrend {
  filterType: string;
  fromDate: string;
  toDate: string;
  totalOrders: number;
  orderTrends: OrderTrendPoint[];
}

export interface TopDishes {
  fromDate: string;
  toDate: string;
  isFallback: boolean;
  dishes: {
    dishId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface TableStatus {
  total: number;
  available: number;
  occupied: number;
}

export interface CustomerStats {
  fromDate: string;
  toDate: string;
  newCustomers: number;
  returningCustomers: number;
  totalOrders: number;
  averageRevenuePerCustomer: number;
  changePercent: number;
  isTopCustomersFallback: boolean;
  topCustomers: {
    rank: number;
    customerId: string;
    customerName: string;
    loyaltyPoints: number;
    membershipLevel: string;
    totalSpent: number;
  }[];
}

export interface RecentFeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  customerName: string | null;
  avatarUrl: string | null;
  createdDate: string;
}

export interface RecentFeedbacks {
  items: RecentFeedbackItem[];
  averageRating: number;
  totalCount: number;
}

export interface PromotionStats {
  totalDiscountAmount: number;
  totalUsageCount: number;
  topPromotions: {
    promotionCode: string;
    promotionName: string;
    usageCount: number;
    totalDiscount: number;
  }[];
}

const dashboardService = {
  parsePayload<T>(payload: T | { data: T }): T {
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }

    return payload as T;
  },

  async getOverview(
    params: DashboardOverviewParams,
  ): Promise<DashboardOverview> {
    const response = await axiosInstance.get<
      DashboardOverview | { data: DashboardOverview }
    >("/dashboard/overview", {
      params: {
        FilterType: params.filterType,
        top: params.top ?? 5,
        sortBy: params.sortBy ?? "revenue",
        FromDate: params.fromDate,
        ToDate: params.toDate,
      },
    });

    return this.parsePayload(response.data);
  },

  async getSummary(params: DashboardPeriodParams): Promise<DashboardSummary> {
    const response = await axiosInstance.get<
      DashboardSummary | { data: DashboardSummary }
    >("/dashboard/summary", {
      params: {
        FilterType: params.filterType,
        FromDate: params.fromDate,
        ToDate: params.toDate,
      },
    });

    return this.parsePayload(response.data);
  },

  async getRevenueTrend(params: DashboardPeriodParams): Promise<RevenueTrend> {
    const response = await axiosInstance.get<
      RevenueTrend | { data: RevenueTrend }
    >("/dashboard/revenue-trend", {
      params: {
        FilterType: params.filterType,
        FromDate: params.fromDate,
        ToDate: params.toDate,
      },
    });

    return this.parsePayload(response.data);
  },

  async getOrderTrend(params: DashboardPeriodParams): Promise<OrderTrend> {
    const response = await axiosInstance.get<OrderTrend | { data: OrderTrend }>(
      "/dashboard/order-trend",
      {
        params: {
          FilterType: params.filterType,
          FromDate: params.fromDate,
          ToDate: params.toDate,
        },
      },
    );

    return this.parsePayload(response.data);
  },
};

export default dashboardService;
