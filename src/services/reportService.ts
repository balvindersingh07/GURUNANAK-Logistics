import apiRequest from './api';

export interface ReportSummaryResponse {
  summary: {
    totalDeliveries: number;
    delivered: number;
    cancelled: number;
    inProgress: number;
    pending: number;
    totalDrivers: number;
    availableDrivers: number;
    totalVehicles: number;
    availableVehicles: number;
    totalCustomers: number;
    totalRoutes: number;
    activeRoutes: number;
    deliveryRate: number;
  };
  deliveriesByStatus: Record<string, number>;
  recentDeliveries: unknown[];
}

export const reportService = {
  getSummary: () => apiRequest<ReportSummaryResponse>('/reports/summary'),
};
