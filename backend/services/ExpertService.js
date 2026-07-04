const { UserRepository } = require('../repositories/UserRepository');

/**
 * ExpertService — business logic for the expert directory (FR-06).
 *
 * Thin today (the directory is a straight read), but this is the layer that
 * owns directory rules — visibility, ordering, future filtering — so the
 * controller stays HTTP-only and the repository stays SQL-only.
 *
 * The UserRepository is injected (defaulting to a real one) so the service can
 * be unit-tested against a fake repository with no database.
 */
class ExpertService {
  constructor(userRepository = new UserRepository()) {
    this.users = userRepository;
  }

  listApprovedExperts() {
    return this.users.findApprovedExperts();
  }
}

module.exports = { ExpertService };
