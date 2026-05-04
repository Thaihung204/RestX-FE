import axiosInstance from "./axiosInstance";

export interface FeedbackCustomer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface FeedbackImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
  isCover: boolean;
}

export interface FeedbackItem {
  id: string;
  orderId: string;
  customerId: string | null;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  isAnonymous: boolean;
  createdDate: string;
  customer: FeedbackCustomer | null;
  feedbackImages: FeedbackImage[];
}

export interface PaginatedFeedbacks {
  items: FeedbackItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  totalActive: number;
  totalInactive: number;
}

export interface GetFeedbacksParams {
  pageNumber?: number;
  pageSize?: number;
  rating?: number;
  isPublished?: boolean;
  search?: string;
}

export interface CreateFeedbackRequest {
  rating: number;
  comment: string | null;
  isAnonymous?: boolean;
}

const feedbackService = {
  getFeedbacks: async (params: GetFeedbacksParams = {}): Promise<PaginatedFeedbacks> => {
    const response = await axiosInstance.get<{ success: boolean; data: PaginatedFeedbacks }>(
      "/feedbacks",
      {
        params: {
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
          Rating: params.rating,
          IsPublished: params.isPublished,
          Search: params.search,
        },
      },
    );
    const payload = response.data as any;
    if (payload?.data) return payload.data;
    return payload as PaginatedFeedbacks;
  },

  createFeedback: async (orderId: string, data: CreateFeedbackRequest): Promise<void> => {
    const formData = new FormData();
    formData.append("rating", String(data.rating));
    if (data.comment) formData.append("comment", data.comment);
    if (data.isAnonymous !== undefined) formData.append("isAnonymous", String(data.isAnonymous));
    await axiosInstance.post(`/orders/${orderId}/feedbacks`, formData);
  },

  togglePublish: async (id: string, isPublished: boolean): Promise<void> => {
    await axiosInstance.patch(`/feedbacks/${id}`, { isPublished });
  },

  deleteFeedback: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/feedbacks/${id}`);
  },
};

export default feedbackService;
