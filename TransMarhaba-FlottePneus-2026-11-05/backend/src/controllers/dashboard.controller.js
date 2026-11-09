const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const stats = await dashboardService.getDashboardData();
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
