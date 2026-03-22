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
  salary?: number;
  salaryType?: string;
  role: string;
  avatar?: File;
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
  avatar?: File | null; // null means remove avatar, undefined means keep existing
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
  avatarUrl?: string;
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
  avatarUrl?: string;
}

export interface EmployeePaginatedData {
  items?: EmployeeListItemDto[];
  employees?: EmployeeListItemDto[];
  data?: EmployeeListItemDto[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface EmployeeListResponseDto {
  success?: boolean;
  data?: EmployeePaginatedData;
  employees?: EmployeeListItemDto[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  itemsPerPage?: number;
}

class EmployeeService {
  async getEmployees(
    filter?: EmployeeFilterParams,
  ): Promise<EmployeeListResponseDto> {
    const response = await axiosInstance.get("/employees", {
      params: {
        // Keep both legacy and new param names to match API
        page: filter?.page || 1,
        pageNumber: filter?.page || 1,
        itemsPerPage: filter?.itemsPerPage || 12,
        pageSize: filter?.itemsPerPage || 12,
        ...(filter?.position !== undefined && { position: filter.position }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter?.hireDateFrom !== undefined && { hireDateFrom: filter.hireDateFrom }),
        ...(filter?.hireDateTo !== undefined && { hireDateTo: filter.hireDateTo }),
      },
    });
    return response.data;
  }

  async getEmployeeById(id: string): Promise<EmployeeResponseDto> {
    const response = await axiosInstance.get(`/employees/${id}`);
    const body = response.data as
      | EmployeeResponseDto
      | { data?: EmployeeResponseDto };
    return body && typeof body === "object" && "data" in body && body.data
      ? body.data
      : (body as EmployeeResponseDto);
  }

  async createEmployee(
    employee: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const formData = new FormData();
    formData.append("Email", employee.email);
    formData.append("FullName", employee.fullName);
    if (employee.phoneNumber)
      formData.append("PhoneNumber", employee.phoneNumber);
    if (employee.address) formData.append("Address", employee.address);
    formData.append("Position", employee.position);
    formData.append("HireDate", employee.hireDate);
    formData.append("Role", employee.role);
    if (employee.avatar) formData.append("Avatar", employee.avatar);

    const response = await axiosInstance.post("/employees", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async updateEmployee(
    id: string,
    employee: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const formData = new FormData();
    if (employee.fullName) formData.append("FullName", employee.fullName);
    if (employee.phoneNumber)
      formData.append("PhoneNumber", employee.phoneNumber);
    if (employee.code) formData.append("Code", employee.code);
    if (employee.address) formData.append("Address", employee.address);
    if (employee.position) formData.append("Position", employee.position);
    if (employee.hireDate) formData.append("HireDate", employee.hireDate);
    if (employee.terminationDate)
      formData.append("TerminationDate", employee.terminationDate);
    if (employee.salary !== undefined)
      formData.append("Salary", employee.salary.toString());
    if (employee.salaryType)
      formData.append("SalaryType", employee.salaryType);
    if (employee.isActive !== undefined)
      formData.append("IsActive", employee.isActive.toString());

    if (employee.avatar !== undefined) {
      if (employee.avatar === null) {
        formData.append("Avatar", "");
      } else {
        formData.append("Avatar", employee.avatar);
      }
    }

    const response = await axiosInstance.put(`/employees/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await axiosInstance.delete(`/employees/${id}`);
  }

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

export const employeeService = new EmployeeService();
export default employeeService;
