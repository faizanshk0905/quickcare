import api from './api';

export const aiService = {
  async chat(message, language = 'en', conversationId = null) {
    const res = await api.post('/ai/chat', { message, language, conversationId });
    return res.data;
  },
};
