import { apiRequest } from './apiClient.js'

export const listPublicQuestionGroups = () => apiRequest('/questions/public', { auth: false })

export const listMyQuestionLists = () => apiRequest('/questions/lists')

export const createMyQuestionList = (input) => apiRequest('/questions/lists', {
  method: 'POST',
  body: input,
})

export const updateMyQuestionList = (listId, input) => apiRequest(`/questions/lists/${listId}`, {
  method: 'PATCH',
  body: input,
})

export const deleteMyQuestionList = (listId) => apiRequest(`/questions/lists/${listId}`, {
  method: 'DELETE',
})

export const createMyQuestion = (listId, content) => apiRequest(`/questions/lists/${listId}/items`, {
  method: 'POST',
  body: { content },
})

export const updateMyQuestion = (listId, questionId, content) => apiRequest(`/questions/lists/${listId}/items/${questionId}`, {
  method: 'PATCH',
  body: { content },
})

export const deleteMyQuestion = (listId, questionId) => apiRequest(`/questions/lists/${listId}/items/${questionId}`, {
  method: 'DELETE',
})
