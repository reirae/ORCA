const { ConversationRepository } = require('../repositories/ConversationRepository');

/**
 * Backward-compatible facade over ConversationRepository (repositories/).
 *
 * The data-access logic now lives in the ConversationRepository class; this
 * module keeps the original function exports so existing importers
 * (sockets/chat.js, routes/files.js, routes/annotations.js) don't have to
 * change. New code can import the class directly.
 */
const repo = new ConversationRepository();

const getConversationForParticipant = (conversationId, userId) =>
  repo.getForParticipant(conversationId, userId);

const isParticipant = (conversationId, userId) =>
  repo.isParticipant(conversationId, userId);

const getConversationHistory = (conversationId, limit) =>
  repo.getHistory(conversationId, limit);

const getConversationPage = (conversationId, before, limit) =>
  repo.getPage(conversationId, before, limit);

module.exports = {
  getConversationForParticipant,
  isParticipant,
  getConversationHistory,
  getConversationPage,
  ConversationRepository,
};
