// Small pure helpers shared by the chat components

export const otherOf = (conversation) => (conversation && conversation.participants && conversation.participants[0]) || null;
export const displayName = (person) => (person ? person.fullName || person.username || '' : '');

// One-line preview for the conversation list
export function previewOf(conversation, t, myId) {
  const m = conversation && conversation.lastMessage;
  if (!m) return t('noMessagesYet');
  if (m.deleted) return t('messageDeleted');
  const body = m.text || (m.attachment ? t('photo') : '');
  return String(m.sender) === String(myId) ? `${t('you')}: ${body}` : body;
}

// Has the other person read this (my) message?
export const isSeen = (message, otherId) => Boolean(otherId) && (message.readBy || []).map(String).includes(String(otherId));
