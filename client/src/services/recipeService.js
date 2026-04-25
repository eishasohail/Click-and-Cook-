const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const recipeService = {
    async signup(userData) {
        const response = await fetch(`${API_BASE_URL}/Signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');
        return data;
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        return data; // Should contain token
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

    async getSavedRecipes(token) {
        const response = await fetch(`${API_BASE_URL}/api/recipes/saved`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch recipes');
        return data;
    }
};