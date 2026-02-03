import axiosInstance from "./axiosInstance";

export interface EmployeeFilterParams {
  page?: number;
  itemsPerPage?: number;
  position?: string;
  isActive?: boolean;
  hireDateFrom?: string;
  hireDateTo?: string;
}

export interface CreateEmployeeDto {
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  position: string;
  hireDate: string;
  salary: number;
  salaryType: string;
  role: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  phoneNumber?: string;
  code?: string;
  address?: string;
  position?: string;
  hireDate?: string;
  terminationDate?: string;
  salary?: number;
  salaryType?: string;
  isActive?: boolean;
}

export interface EmployeeResponseDto {
  id: string;
  code: string;
  address?: string;
  position: string;
  hireDate: string;
  terminationDate?: string;
  salary: number;
  salaryType: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
}

export interface EmployeeListItemDto {
  id: string;
  code: string;
  fullName: string;
  email: string;
  position: string;
  isActive: boolean;
  hireDate: string;
  createdDate: string;
}

export interface EmployeeListResponseDto {
  success?: boolean;
  data?: {
    employees?: EmployeeListItemDto[];
    data?: EmployeeListItemDto[];
    items?: EmployeeListItemDto[];
    totalCount?: number;
    page?: number;
    itemsPerPage?: number;
  };
  employees?: EmployeeListItemDto[];
  totalCount?: number;
  page?: number;
  itemsPerPage?: number;
}

/**
 * Employee Service - Handles all employee/staff related API calls
 */
class EmployeeService {
  /**
   * Get all employees with pagination and filters
   */
  async getEmployees(
    filter?: EmployeeFilterParams,
  ): Promise<EmployeeListResponseDto> {
    const response = await axiosInstance.get("/employees", {
      params: {
        page: filter?.page || 1,
        itemsPerPage: filter?.itemsPerPage || 100,
        ...filter,
      },
    });
    return response.data;
  }

  /**
   * Get a single employee by ID
   */
  async getEmployeeById(id: string): Promise<EmployeeResponseDto> {
    const response = await axiosInstance.get(`/employees/${id}`);
    return response.data;
  }

  /**
   * Create a new employee
   */
  async createEmployee(
    employee: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const response = await axiosInstance.post("/employees", employee);
    return response.data;
  }

  /**
   * Update an existing employee
   */
  async updateEmployee(
    id: string,
    employee: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const response = await axiosInstance.put(`/employees/${id}`, employee);
    return response.data;
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id: string): Promise<void> {
    await axiosInstance.delete(`/employees/${id}`);
  }

  /**
   * Toggle employee active status
   */
  async toggleEmployeeStatus(
    id: string,
    isActive: boolean,
  ): Promise<EmployeeResponseDto> {
    const response = await axiosInstance.patch(`/employees/${id}/status`, {
      isActive,
    });
    return response.data;
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();
export default employeeService;
