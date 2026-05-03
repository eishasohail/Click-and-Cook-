require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://click-and-cook-123.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false 
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Increased to 15s for cold starts
  keepAlive: true
});

// Handle pool errors to prevent server crash
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Helper to get Gemini Model with fallback capability
const getGeminiModel = (apiKey, mode = 'json') => {
  const genAI = new GoogleGenerativeAI(apiKey);

  if (mode === 'json') {
    return genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 8192
      },
      systemInstruction: `You are a culinary AI. Generate recipes in valid JSON format only.
      
      Categorization rules:
      - Smoothies, shakes, milkshakes, juices, teas, coffees, lemonades, beverages, drinks → Drinks
      - Eggs, pancakes, oatmeal, toast, morning meals → Breakfast
      - Soups, salads, sandwiches, wraps, light meals → Lunch
      - Rice, pasta, curries, grills, biryani, heavy meals → Dinner
      - Cakes, cookies, ice cream, puddings, sweet desserts → Desserts
      - Low calorie, protein bowls, diet meals → Healthy
      - Chips, dips, finger foods, small bites → Snacks
      - Plant-based, no meat or dairy → Vegan
      - Anything that doesn't fit above → Other

      Schema:
      {
        "recipeName": "string",
        "category": "One of: Breakfast, Lunch, Dinner, Desserts, Drinks, Healthy, Snacks, Vegan, Other",
        "prepTime": number (minutes),
        "cookTime": number (minutes),
        "calories": number,
        "servings": number,
        "cuisine": "string",
        "difficulty": "Easy|Medium|Hard",
        "dietaryTags": ["string"],
        "ingredients": [{"item": "string", "amount": "string", "unit": "string"}],
        "instructions": [{"instruction": "string", "duration": "string"}],
        "nutritionalInfo": {"protein": "string", "carbs": "string", "fat": "string"},
        "imageSearchQuery": "string (3-4 words for Unsplash search)"
      }`
    });
  }

  if (mode === 'followup') {
    return genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a professional chef. Answer follow-up questions about the provided recipe context.
      - Be concise (max 3-4 lines).
      - If the user asks for a recipe variation, provide it clearly.
      - If the user asks for a new recipe, you can provide one, but keep it in plain text.
      - DO NOT force any "RECIPE NAME" or "CATEGORY" headers unless it's a completely new recipe.
      - Be helpful, direct, and encouraging.`
    });
  }

  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a professional chef and nutritionist. 

ALWAYS start your response with EXACTLY these two lines with no extra text:
RECIPE NAME: [creative descriptive recipe name]
CATEGORY: [exactly one word from this list only: Breakfast, Lunch, Dinner, Desserts, Drinks, Healthy, Snacks, Vegan, Other]

Then write the recipe in plain text with NO markdown, NO asterisks, NO hashtags, NO special characters.
Use these section headers in UPPERCASE followed by colon:
INGREDIENTS:
INSTRUCTIONS:
NUTRITIONAL INFO:
TIPS:`
  });
};

// Generic generation function with key fallback
async function generateContentWithFallback(prompt, mode = 'json') {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_API_KEY_BACKUP_2,
    process.env.GEMINI_API_KEY_BACKUP_3,
    process.env.GEMINI_API_KEY_BACKUP_4
  ].filter(Boolean);
  let lastErr = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const model = getGeminiModel(keys[i], mode);
      const result = await model.generateContent(prompt);
      return await result.response;
    } catch (err) {
      lastErr = err;
      const errMsg = err.message?.toLowerCase() || "";
      const isQuotaError = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted');

      if (isQuotaError && i < keys.length - 1) {
        console.warn(`⚠️ Primary Gemini API Key exhausted/limit hit. Retrying with backup key...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

const fetchUnsplashImage = async (query) => {
  const keys = [
    process.env.UNSPLASH_ACCESS_KEY,
    process.env.UNSPLASH_ACCESS_KEY_2,
    process.env.UNSPLASH_ACCESS_KEY_3,
  ].filter(Boolean);

  if (keys.length === 0) {
    console.warn('No Unsplash keys configured');
    return null;
  }

  for (let i = 0; i < keys.length; i++) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${keys[i]}`;
      
      const res = await fetch(url);
      
      if (res.status === 429) {
        console.warn(`Unsplash key ${i + 1} rate limited, trying next...`);
        continue;
      }

      if (!res.ok) {
        console.warn(`Unsplash key ${i + 1} failed with status ${res.status}`);
        continue;
      }

      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`Unsplash image fetched with key ${i + 1}`);
        return data.results[0].urls.regular;
      }
      
      return null;
    } catch (err) {
      console.error(`Unsplash key ${i + 1} error:`, err.message);
      continue;
    }
  }

  console.warn('All Unsplash keys exhausted or failed');
  return null;
};

// Signup Route
app.post('/Signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, generations_count) VALUES ($1, $2, $3, $4, 0) RETURNING id',
      [firstName, lastName, email, hashedPassword]
    );

    const token = jwt.sign(
      { userId: result.rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User signed up successfully!',
      token,
      user: { firstName, email }
    });
  } catch (err) {
    console.error('Error during signup:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'An error occurred while signing up.' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { firstName: user.first_name, email: user.email }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'An error occurred while logging in.' });
  }
});

// Google Auth Route
app.post('/api/auth/google', async (req, res) => {
  const { idToken, accessToken } = req.body;
  try {
    let email, given_name, family_name;

    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      given_name = payload.given_name;
      family_name = payload.family_name;
    } else if (accessToken) {
      // Verify via tokeninfo endpoint
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      const userInfo = await response.json();
      if (userInfo.error) throw new Error(userInfo.error_description);
      email = userInfo.email;
      given_name = userInfo.given_name;
      family_name = userInfo.family_name;
    } else {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      const dummyHash = 'OAUTH_USER_NO_PASSWORD';
      const insertResult = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, generations_count) VALUES ($1, $2, $3, $4, 0) RETURNING id, email',
        [given_name || 'User', family_name || '', email, dummyHash]
      );
      user = insertResult.rows[0];
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Google Login successful!',
      token,
      user: { firstName: user.first_name, email: user.email }
    });
  } catch (err) {
    console.error('Error during Google Auth:', err);
    res.status(500).json({ error: 'Google Authentication failed.' });
  }
});


// Gemini AI Route (Original Generic)
app.post('/api/ask', async (req, res) => {
  const { ingredients, calories, servings, notes } = req.body;
  try {
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required.' });
    }

    // Optional: Increment generation count if user is logged in
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await pool.query('UPDATE users SET generations_count = COALESCE(generations_count, 0) + 1 WHERE id = $1', [decoded.userId]);
      } catch (e) { /* ignore invalid tokens for this optional feature */ }
    }

    const ingredientsList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
    const userPrompt = `Generate a recipe using: ${ingredientsList}\nExpected Calories: ${calories || 'not specified'}\nServings: ${servings || 1}\nExtra Notes: ${notes || 'none'}`;
    const response = await generateContentWithFallback(userPrompt, 'text');
    const text = response.text();
    res.json({ recipe: text });
  } catch (err) {
    console.error('Error with Gemini API:', err);
    res.status(500).json({ error: 'Failed to generate recipe.' });
  }
});

// Structured Recipe Generation Route
app.post('/api/recipes/generate', authenticateToken, async (req, res) => {
  const { ingredients, calories, servings, preferences } = req.body;
  try {
    const ingredientsList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
    const prompt = `Generate a high-quality recipe.
    Ingredients: ${ingredientsList}
    Target Calories: ${calories}
    Servings: ${servings}
    Preferences/Notes: ${preferences}
    
    Ensure the JSON is valid and includes a descriptive image keyword for Unsplash.`;

    console.log('Generating recipe with prompt:', prompt);
    const response = await generateContentWithFallback(prompt, 'json');
    let text = response.text();

    console.log('Gemini raw response:', text);

    // Robust JSON parsing (strip markdown wrappers)
    if (text.includes('```')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let recipeData;
    try {
      recipeData = JSON.parse(text);
    } catch (parseError) {
      try {
        const fixedText = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .trim();
        recipeData = JSON.parse(fixedText);
      } catch (secondError) {
        console.error('JSON Parse Error:', parseError);
        return res.status(500).json({
          error: 'Recipe generation failed. Please try again.'
        });
      }
    }

    if (recipeData && !recipeData.category) {
      const tags = (recipeData.dietaryTags || []).map(t => t.toLowerCase());
      const name = (recipeData.recipeName || '').toLowerCase();

      if (tags.includes('breakfast') || tags.includes('brunch') ||
        name.includes('egg') || name.includes('toast') ||
        name.includes('pancake') || name.includes('oatmeal') ||
        name.includes('waffle') || name.includes('muffin') ||
        name.includes('bagel') || name.includes('omelette') ||
        name.includes('omelet') || name.includes('frittata') ||
        name.includes('french toast') || name.includes('porridge') ||
        name.includes('cereal') || name.includes('crepe') ||
        name.includes('breakfast')) {
        recipeData.category = 'Breakfast';

      } else if (name.includes('smoothie') || name.includes('shake') ||
        name.includes('milkshake') || name.includes('juice') ||
        name.includes('lemonade') || name.includes('coffee') ||
        name.includes('tea') || name.includes('drink') ||
        name.includes('lassi') || name.includes('chai') ||
        name.includes('matcha') || name.includes('frappe') ||
        name.includes('mocktail') || name.includes('cocktail') ||
        name.includes('punch') || name.includes('float') ||
        name.includes('latte') || name.includes('espresso') ||
        name.includes('hot chocolate') || name.includes('cider') ||
        tags.some(t => t.includes('drink') || t.includes('beverage'))) {
        recipeData.category = 'Drinks';

      } else if (name.includes('cake') || name.includes('cookie') ||
        name.includes('dessert') || name.includes('pudding') ||
        name.includes('brownie') || name.includes('ice cream') ||
        name.includes('pie') || name.includes('tart') ||
        name.includes('mousse') || name.includes('cheesecake') ||
        name.includes('fudge') || name.includes('donut') ||
        name.includes('cupcake') || name.includes('halwa') ||
        name.includes('kheer') || name.includes('gulab jamun') ||
        name.includes('barfi') || name.includes('ladoo') ||
        name.includes('sweet') || name.includes('candy') ||
        name.includes('truffle') || name.includes('parfait') ||
        name.includes('sorbet') || name.includes('gelato') ||
        tags.includes('dessert')) {
        recipeData.category = 'Desserts';

      } else if (name.includes('salad') || name.includes('soup') ||
        name.includes('sandwich') || name.includes('wrap') ||
        name.includes('quesadilla') || name.includes('taco') ||
        name.includes('burger') || name.includes('sub') ||
        name.includes('pita') || name.includes('roll') ||
        name.includes('panini') || name.includes('club') ||
        tags.includes('lunch')) {
        recipeData.category = 'Lunch';

      } else if (name.includes('chip') || name.includes('dip') ||
        name.includes('popcorn') || name.includes('nacho') ||
        name.includes('bruschetta') || name.includes('spring roll') ||
        name.includes('samosa') || name.includes('finger') ||
        name.includes('nugget') || name.includes('bite') ||
        name.includes('cracker') || name.includes('pretzel') ||
        name.includes('trail mix') || name.includes('granola bar') ||
        tags.includes('snack') || tags.includes('appetizer')) {
        recipeData.category = 'Snacks';

      } else if (tags.includes('healthy') || tags.includes('low-calorie') ||
        tags.includes('low calorie') || tags.includes('diet') ||
        tags.includes('high protein') || tags.includes('keto') ||
        tags.includes('vegan') || tags.includes('vegetarian') ||
        name.includes('quinoa') || name.includes('avocado toast') ||
        name.includes('protein') || name.includes('detox') ||
        name.includes('bowl') || name.includes('grain bowl') ||
        (recipeData.calories && recipeData.calories < 300)) {
        recipeData.category = 'Healthy';

      } else {
        recipeData.category = 'Dinner';
      }

      console.log('Category extracted:', recipeData.category);
    }

    // Fetch real image from Unsplash
    const unsplashQuery = recipeData.imageSearchQuery 
      || (recipeData.recipeName + ' food dish');
    recipeData.image = await fetchUnsplashImage(
      unsplashQuery
    ) || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800";

    // Increment generation count for user
    await pool.query('UPDATE users SET generations_count = COALESCE(generations_count, 0) + 1 WHERE id = $1', [req.user.userId]);

    res.json(recipeData);
  } catch (err) {
    console.error('Gemini Generation Error:', err);
    const isQuota = err.message?.includes('429') || 
      err.message?.includes('quota') ||
      err.message?.includes('exhausted');
    res.status(500).json({ 
      error: isQuota 
        ? 'Our AI chef needs a short break! Please wait a minute and try again.'
        : 'Recipe generation failed. Please try again.'
    });
  }
});



// Follow-up Question Route
app.post('/api/recipes/follow-up', authenticateToken, async (req, res) => {
  const { recipeId, question, recipeContext } = req.body;
  try {
    const response = await generateContentWithFallback(`Recipe Context: ${JSON.stringify(recipeContext)}\n\nQuestion: ${question}`, 'followup');
    res.json({ answer: response.text() });
  } catch (err) {
    console.error('Follow-up Error:', err);
    res.status(500).json({ error: 'Failed to answer follow-up question.' });
  }
});

// Save Recipe Route (JWT Protected) - Updated to handle structured data
app.post('/api/recipes/save', authenticateToken, async (req, res) => {
  const {
    title, recipeName,
    ingredients,
    instructions,
    calories,
    servings,
    image, image_url,
    prepTime, cookTime,
    difficulty,
    nutritionalInfo
  } = req.body;
  let finalImage = image || image_url || null;
  if (!finalImage) {
    finalImage = await fetchUnsplashImage(
      finalTitle + ' food dish'
    ) || null;
  }

  console.log('=== SAVE DEBUG ===');
  console.log('category received:', req.body.category);
  console.log('image received:', req.body.image);
  console.log('recipeName:', req.body.recipeName);
  console.log('==================');

  const userId = req.user.userId;
  const finalTitle = title || recipeName || "Untitled Recipe";

  // Format ingredients and instructions if they are objects
  const formatList = (list, header) => {
    if (!list) return "";
    let result = "";
    if (typeof list === 'string') {
      result = list;
    } else if (Array.isArray(list)) {
      result = list.map(item => {
        if (typeof item === 'string') return item;
        if (item.item) return `${item.amount || ''} ${item.unit || ''} ${item.item}`.trim();
        if (item.instruction) return item.instruction;
        return JSON.stringify(item);
      }).join('\n');
    } else {
      result = JSON.stringify(list);
    }

    // Add header if not already present in the first line
    if (header && !result.trim().startsWith(header)) {
      return `${header}\n${result}`;
    }
    return result;
  };

  const allowedCategories = [
    'Breakfast', 'Lunch', 'Dinner',
    'Desserts', 'Drinks', 'Healthy', 'Snacks'
  ];

  let finalCategory = 'Dinner';
  let rawCategory = req.body.category || '';

  if (typeof rawCategory === 'string' && rawCategory.trim()) {
    const trimmed = rawCategory.trim().toLowerCase();

    // Exact match first
    const exactMatch = allowedCategories.find(
      c => c.toLowerCase() === trimmed
    );

    if (exactMatch) {
      finalCategory = exactMatch;
    } else {
      // Keyword matching
      if (trimmed.includes('breakfast') ||
        trimmed.includes('morning') ||
        trimmed.includes('egg') ||
        trimmed.includes('toast') ||
        trimmed.includes('pancake')) {
        finalCategory = 'Breakfast';
      } else if (trimmed.includes('drink') ||
        trimmed.includes('smoothie') ||
        trimmed.includes('shake') ||
        trimmed.includes('juice') ||
        trimmed.includes('coffee') ||
        trimmed.includes('tea') ||
        trimmed.includes('beverage') ||
        trimmed.includes('cocktail') ||
        trimmed.includes('lemonade')) {
        finalCategory = 'Drinks';
      } else if (trimmed.includes('lunch') ||
        trimmed.includes('salad') ||
        trimmed.includes('sandwich') ||
        trimmed.includes('soup') ||
        trimmed.includes('wrap')) {
        finalCategory = 'Lunch';
      } else if (trimmed.includes('dinner') ||
        trimmed.includes('pasta') ||
        trimmed.includes('rice') ||
        trimmed.includes('curry') ||
        trimmed.includes('grill') ||
        trimmed.includes('biryani')) {
        finalCategory = 'Dinner';
      } else if (trimmed.includes('dessert') ||
        trimmed.includes('cake') ||
        trimmed.includes('cookie') ||
        trimmed.includes('sweet') ||
        trimmed.includes('chocolate') ||
        trimmed.includes('ice cream')) {
        finalCategory = 'Desserts';
      } else if (trimmed.includes('snack') ||
        trimmed.includes('chip') ||
        trimmed.includes('dip') ||
        trimmed.includes('finger')) {
        finalCategory = 'Snacks';
      } else if (trimmed.includes('vegan') ||
        trimmed.includes('plant')) {
        finalCategory = 'Vegan';
      } else if (trimmed.includes('healthy') ||
        trimmed.includes('diet') ||
        trimmed.includes('low cal') ||
        trimmed.includes('protein')) {
        finalCategory = 'Healthy';
      }
    }
  }

  console.log('FINAL CATEGORY:', finalCategory);

  try {
    await pool.query(
      'INSERT INTO saved_recipes (user_id, title, ingredients, instructions, calories, servings, image_url, category, prep_time, cook_time, difficulty, nutritional_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [
        userId,
        finalTitle,
        formatList(ingredients, 'INGREDIENTS:'),
        formatList(instructions, 'INSTRUCTIONS:'),
        calories,
        servings,
        finalImage,
        finalCategory,
        prepTime || null,
        cookTime || null,
        difficulty || null,
        nutritionalInfo ? JSON.stringify(nutritionalInfo) : null
      ]
    );
    res.status(201).json({ message: 'Recipe saved successfully!' });
  } catch (err) {
    console.error('Error saving recipe:', err);
    res.status(500).json({ error: 'Failed to save recipe.' });
  }
});


// Get Saved Recipes Route (JWT Protected)
app.get('/api/recipes/saved', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT * FROM saved_recipes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching saved recipes:', err);
    res.status(500).json({ error: 'Failed to fetch saved recipes.' });
  }
});

// Delete Saved Recipe Route (JWT Protected)
app.delete('/api/recipes/:id', authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        `DELETE FROM saved_recipes 
         WHERE id = $1 AND user_id = $2 
         RETURNING id`,
        [id, userId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Recipe not found.'
        });
      }
      res.status(200).json({
        message: 'Recipe deleted successfully!'
      });
    } catch (err) {
      console.error('Error deleting recipe:', err);
      res.status(500).json({
        error: 'Failed to delete recipe.'
      });
    }
  }
);

// Get Reviews from DB
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 3');
    if (result.rows.length === 0) {
      // Fallback to defaults if DB is empty
      return res.json([
        { name: 'Ifra', accent_color: '#75070C', text: "The AI recommendations are so accurate, it knows my taste better than I do!" },
        { name: 'Menahil', accent_color: '#4F6815', text: "Cooking has never been this easy and fun. Highly recommended!" },
        { name: 'Maryam', accent_color: '#75070C', text: "The 15-minute recipes are a lifesaver for busy weeknights." }
      ]);
    }
    // Map database field names to frontend expected names (if different)
    const formattedReviews = result.rows.map(r => ({
      name: r.name,
      text: r.text,
      acc: r.accent_color,
      rating: r.rating
    }));
    res.json(formattedReviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Post a new review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { text, accent_color, rating } = req.body;
  const userId = req.user.userId;
  try {
    // Get user's name from users table
    const userResult = await pool.query('SELECT first_name FROM users WHERE id = $1', [userId]);
    const name = userResult.rows[0]?.first_name || 'Anonymous';

    await pool.query(
      'INSERT INTO reviews (user_id, name, text, accent_color, rating) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, text, accent_color || '#75070C', rating !== undefined ? rating : 5]
    );
    res.status(201).json({ message: 'Review added successfully!' });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Fetching stats for userId:', userId);

    const userRes = await pool.query('SELECT created_at, generations_count FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { created_at, generations_count } = userRes.rows[0];
    const savedRes = await pool.query('SELECT COUNT(*) as count FROM saved_recipes WHERE user_id = $1', [userId]);

    const stats = {
      saved: parseInt(savedRes.rows[0].count) || 0,
      generated: generations_count || 0,
      createdAt: created_at
    };

    console.log('Returning stats:', stats);
    res.json(stats);
  } catch (err) {
    console.error('Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats.' });
  }
});

// Simple in-memory cache for recommendations (UserId -> { picks, profile, timestamp })
const picksCache = new Map();

app.get('/api/recipes/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isRefresh = req.query.refresh === 'true';

    // 1. Check Cache (30 min TTL) unless it's a manual refresh
    const cached = picksCache.get(userId);
    const now = Date.now();
    if (!isRefresh && cached && (now - cached.timestamp < 1800000)) {
      console.log('Serving recommendations from cache...');
      return res.json({ picks: cached.picks, profile: cached.profile });
    }

    // 2. Fetch data from DB
    const savedRes = await pool.query(
      'SELECT title, category, ingredients FROM saved_recipes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const saved = savedRes.rows;

    if (saved.length === 0) {
      return res.json({ picks: [], profile: null });
    }

    // 1. Calculate frequencies
    const catCounts = {};
    saved.forEach(r => {
      if(r.category) {
         catCounts[r.category] = (catCounts[r.category] || 0) + 1;
      }
    });

    // 2. Find the max frequency
    let maxCount = 0;
    for (const cat in catCounts) {
      if (catCounts[cat] > maxCount) maxCount = catCounts[cat];
    }

    // 3. Find all categories that tied for the max frequency
    const topCats = Object.keys(catCounts).filter(cat => catCounts[cat] === maxCount);

    // 4. Tie-breaker: Which of the tied categories was saved most recently?
    let favCategory = 'Dinner';
    if (topCats.length > 0) {
      // `saved` is ordered by created_at DESC, so find() gets the most recent
      const recentMatch = saved.find(r => topCats.includes(r.category));
      favCategory = recentMatch ? recentMatch.category : topCats[0];
    }

    const avgCalories = 750;
    const allIngredients = saved.flatMap(r => (r.ingredients || '').split(',').map(i => i.trim()));
    const topIngredient = allIngredients.length > 0 
      ? allIngredients.sort((a,b) => allIngredients.filter(v=>v===a).length - allIngredients.filter(v=>v===b).length).pop()
      : 'Fresh food';

    const recentTitles = saved.slice(0,5).map(r => r.title).join(', ');

    const prompt = `You are a recipe recommendation AI. 
    User profile: Fav Category: ${favCategory}, Top Ingredient: ${topIngredient}, Recent: ${recentTitles}.
    Generate exactly 3 unique recipe suggestions that match this user's taste.
    
    Return ONLY a valid JSON array with this structure:
    [
      {
        "name": "Recipe Name",
        "category": "${favCategory}",
        "reason": "Why this matches their profile",
        "keyIngredients": ["item1", "item2"],
        "estimatedCalories": 600,
        "prepTime": 30
      }
    ]`;

    const response = await generateContentWithFallback(prompt, 'json');
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let picksData = [];
    try {
      picksData = JSON.parse(text);
      if (!Array.isArray(picksData)) picksData = picksData.picks || [];
    } catch (e) { 
      console.error('Parse error:', e); 
      // Fallback if AI fails to return valid JSON
      picksData = [];
    }

    // 3. Fetch Unsplash with multi-key resilient fallback
    const picksWithImages = await Promise.all(
      picksData.slice(0, 3).map(async (pick) => {
        // Use the specific recipe name for the search to ensure unique images
        const searchQuery = (pick.name || 'gourmet food') + ' ' + (pick.category || 'dish');
        pick.imageUrl = await fetchUnsplashImage(searchQuery) || null;
        return pick;
      })
    );

    const result = { 
      picks: picksWithImages, 
      profile: { favCategory, avgCalories, topIngredient, totalSaved: saved.length } 
    };

    // 4. Save to Cache
    picksCache.set(userId, { ...result, timestamp: now });

    res.json(result);

  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// Serve React app
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
