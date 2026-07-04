const { ExpertService } = require('../services/ExpertService');
const { system } = require('../utils/winstonLogger');

/**
 * ExpertController — HTTP layer for the expert directory. Thin: turn a request
 * into a service call and a response, mapping failures to a 500. Holds no
 * business logic and no SQL.
 *
 * The service is injected (defaulting to a real one) for testability. `list`
 * is bound in the constructor so it can be passed directly as an Express
 * handler without losing `this`.
 */
class ExpertController {
  constructor(expertService = new ExpertService()) {
    this.experts = expertService;
    this.list = this.list.bind(this);
  }

  async list(req, res) {
    try {
      const experts = await this.experts.listApprovedExperts();
      res.json({ experts });
    } catch (err) {
      system.error('Failed to list experts', { context: 'experts', error: err.message });
      res.status(500).json({ error: 'Could not load experts.' });
    }
  }
}

module.exports = { ExpertController };
