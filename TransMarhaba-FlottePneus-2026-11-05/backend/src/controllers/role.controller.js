const roleRepository = require('../repositories/role.repository');

class RoleController {
  async getAll(req, res, next) {
    try {
      const roles = await roleRepository.findAll();
      return res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();
