// src/services/reportingService.js
// Stub implementation for reporting service
// TODO: Implement full reporting service when backend endpoints are available

const reportingService = {
  getReportingStats: async () => ({
    totalReports: 0,
    scheduledReports: 0,
    generatedToday: 0
  }),

  getTemplates: async () => [],

  getScheduledReports: async () => [],

  getReportHistory: async ({ page = 0, pageSize = 25 }) => ({
    rows: [],
    count: 0,
    pageSize
  })
};

export default reportingService;
