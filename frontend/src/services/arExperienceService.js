import { apiRequest } from './apiClient.js'

export async function fetchArExperiences({ signal } = {}) {
  const response = await apiRequest('/ar/experiences', {
    auth: false,
    signal,
  })

  return Array.isArray(response?.data?.experiences) ? response.data.experiences : []
}
