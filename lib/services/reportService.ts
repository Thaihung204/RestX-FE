import {
  DownloadableFile,
  getFileNameFromContentDisposition,
} from "@/lib/utils/fileDownload";

import axiosInstance from "./axiosInstance";

export type ReportType = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ExportReportRequest {
  reportType: ReportType;
  fromDate?: string;
  toDate?: string;
  topDishesCount?: number;
}

const reportService = {
  async exportReport(payload: ExportReportRequest): Promise<DownloadableFile> {
    const response = await axiosInstance.post<Blob>(
      "/reports/export",
      {
        ReportType: payload.reportType,
        FromDate: payload.fromDate,
        ToDate: payload.toDate,
        TopDishesCount: payload.topDishesCount ?? 10,
      },
      {
        responseType: "blob",
      },
    );

    const contentDisposition = response.headers?.["content-disposition"] as
      | string
      | undefined;

    return {
      blob: response.data,
      fileName: getFileNameFromContentDisposition(
        contentDisposition,
        `report_${payload.reportType}_${Date.now()}.pdf`,
      ),
    };
  },
};

export default reportService;
