const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const recipeService = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  signup: async ({ firstName, lastName, email, password }) => {
    const res = await fetch(`${API_BASE_URL}/Signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  },

  googleLogin: async (accessToken) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    return data;
  },

  async getRecipeRecommendation(data) {
    const response = await fetch(`${API_BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to get recommendation');
    return result.recipe;
  },

  async saveRecipe(recipeData, token) {
    const response = await fetch(`${API_BASE_URL}/api/recipes/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(recipeData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save recipe');
    return data;
  },

  getSavedRecipes: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/recipes/saved`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch recipes');
    return data;
  },

  deleteRecipe: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete recipe');
    return data;
  }
};