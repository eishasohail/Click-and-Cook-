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
app.use(cors());
app.use(express.json());

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Gemini AI Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: "You are a professional chef and nutritionist. Generate detailed recipes based on available ingredients, respecting calorie limits and serving sizes. Format responses in plain text only — no markdown, no asterisks, no hashtags, no special characters. Use clear headings like INGREDIENTS:, INSTRUCTIONS:, NUTRITIONAL INFO:, TIPS: in plain uppercase."
});

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

// Signup Route
app.post('/Signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
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
        'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email',
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

// Gemini AI Route
app.post('/api/ask', async (req, res) => {
  const { ingredients, calories, servings, notes, conversationHistory } = req.body;
  try {
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required.' });
    }
    const chat = model.startChat({
      history: conversationHistory || [],
      generationConfig: { maxOutputTokens: 3000 },
    });
    const ingredientsList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
    const userPrompt = `Generate a recipe using: ${ingredientsList}\nExpected Calories: ${calories || 'not specified'}\nServings: ${servings || 1}\nExtra Notes: ${notes || 'none'}`;
    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();
    res.json({ recipe: text });
  } catch (err) {
    console.error('Error with Gemini API:', err);
    res.status(500).json({ error: 'Failed to generate recipe.' });
  }
});

// Save Recipe Route (JWT Protected)
app.post('/api/recipes/save', authenticateToken, async (req, res) => {
  const { title, ingredients, instructions, calories, servings } = req.body;
  const userId = req.user.userId;
  try {
    await pool.query(
      'INSERT INTO saved_recipes (user_id, title, ingredients, instructions, calories, servings) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, title, ingredients, instructions, calories, servings]
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

// Serve React app
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
