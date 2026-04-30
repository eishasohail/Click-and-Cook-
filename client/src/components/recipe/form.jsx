import React, { Component } from 'react';
import { connect } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import axios from 'axios';
import "./form.css";
import Button from "../button/Button";
import Chat from "../chat/Chat";
import LogoComponent from "../shared/Logo";
import { recipeService } from "../../services/recipeService";

class RecipeRecommendation extends Component {
  constructor(props) {
    super(props);
    this.sliderRef = React.createRef();
  }

  state = {
    ingredients: [],
    maxCalories: 500,
    servings: 1,
    notes: '',
    errors: {},
    currentIngredient: '',
    messages: [],
    isLoading: false,
    lastResponse: null,
    showChat: false,
    conversationHistory: [],
    reviewText: '',
    isSubmittingReview: false,
    reviewSuccess: false
  };

  componentDidMount() {
    const slider = this.sliderRef.current;
    if (slider) {
      slider.addEventListener('input', () => {
        const value = slider.value;
        const max = slider.max;
        const progress = (value / max) * 100;
        slider.style.setProperty('--slider-progress', `${progress}%`);
      });
    }
  }

  componentWillUnmount() {
    const slider = this.sliderRef.current;
    if (slider) {
      slider.removeEventListener('input', this.handleSliderInput);
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleIngredientChange = (e) => {
    this.setState({ currentIngredient: e.target.value });
  };

  addIngredient = () => {
    const { currentIngredient, ingredients } = this.state;
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      this.setState({
        ingredients: [...ingredients, currentIngredient.trim()],
        currentIngredient: '',
      });
    }
  };

  removeIngredient = (ingredient) => {
    this.setState({
      ingredients: this.state.ingredients.filter(item => item !== ingredient),
    });
  };

  handleServingsChange = (type) => {
    this.setState((prevState) => ({
      servings: type === 'increment' ? prevState.servings + 1 : Math.max(1, prevState.servings - 1),
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const errors = this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    this.setState({ isLoading: true, showChat: true, conversationHistory: [] });

    try {
      const { ingredients, maxCalories, servings, notes } = this.state;

      const requestMessage = `I want a recipe using these ingredients: ${ingredients.join(', ')}. ` +
        `It should be under ${maxCalories} calories and serve ${servings} people. ` +
        (notes ? `Additional notes: ${notes}` : '');

      const response = await recipeService.getRecipeRecommendation({
        ingredients,
        calories: parseInt(maxCalories),
        servings: parseInt(servings),
        notes,
        conversationHistory: []
      });

      const recipeText = typeof response === 'string' ? response : response.recipe;

      const initialHistory = [
        { role: 'user', parts: [{ text: requestMessage }] },
        { role: 'model', parts: [{ text: recipeText }] }
      ];

      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          { type: 'user', content: requestMessage },
          { type: 'system', content: recipeText }
        ],
        conversationHistory: initialHistory,
        lastResponse: recipeText,
        isLoading: false
      }));
    } catch (error) {
      console.error('Form submission error:', error);
      this.setState({
        errors: { submit: error.message },
        isLoading: false,
        messages: [
          ...this.state.messages,
          { type: 'system', content: `Error: ${error.message}. Please try again.` }
        ]
      });
    }
  };

  handleChatMessage = async (message) => {
    this.setState(prevState => ({
      messages: [...prevState.messages, { type: 'user', content: message }],
      isLoading: true
    }));

    try {
      const { ingredients, maxCalories, servings, notes, conversationHistory } = this.state;

      const response = await recipeService.getRecipeRecommendation({
        ingredients,
        calories: parseInt(maxCalories),
        servings: parseInt(servings),
        notes,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: message }] }
        ]
      });

      const recipeText = typeof response === 'string' ? response : response.recipe;

      const newHistory = [
        ...conversationHistory,
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: recipeText }] }
      ];

      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          { type: 'system', content: recipeText }
        ],
        conversationHistory: newHistory,
        lastResponse: recipeText,
        isLoading: false
      }));
    } catch (error) {
      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          { type: 'system', content: 'Sorry, there was an error processing your request.' }
        ],
        isLoading: false
      }));
    }
  };

  handleReviewSubmit = async (e) => {
    e.preventDefault();
    const { reviewText } = this.state;
    const { token } = this.props;

    if (!reviewText.trim()) return;

    this.setState({ isSubmittingReview: true });
    
    // Make sure we resolve the API base URL locally via Vite or fallback
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        text: reviewText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.setState({ 
        reviewText: '', 
        isSubmittingReview: false,
        reviewSuccess: true 
      });

      // Hide success message after 3 seconds
      setTimeout(() => {
        this.setState({ reviewSuccess: false });
      }, 3000);

    } catch (error) {
      console.error('Failed to submit review:', error);
      this.setState({ isSubmittingReview: false });
      alert('Failed to submit review. Please try again.');
    }
  };

  validateForm = () => {
    const errors = {};
    if (this.state.ingredients.length === 0) {
      errors.ingredients = "At least one ingredient is required.";
    }
    if (!this.state.maxCalories) {
      errors.maxCalories = "Maximum calories are required.";
    } else if (isNaN(this.state.maxCalories)) {
      errors.maxCalories = "Maximum calories must be a number.";
    }
    return errors;
  };

  render() {
    const { ingredients, maxCalories, servings, notes, errors, currentIngredient, messages, isLoading, showChat, reviewText, isSubmittingReview, reviewSuccess } = this.state;
    const { user, logout } = this.props;

    return (
      <section className="recipe-recommendation">
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 60px 0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LogoComponent />
          <button 
            onClick={() => { logout(); window.location.href = '/'; }}
            style={{ 
              backgroundColor: 'transparent', border: '2px solid #75070C', color: '#75070C', 
              padding: '12px 24px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer',
              fontSize: '14px', transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#75070C'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#75070C'; }}
          >
            Logout
          </button>
        </div>
        <div className="recipe-content">
          <h2 className="recipe-title">
            Welcome, {user?.firstName || 'Chef'}!
          </h2>
          <p className="recipe-description">
            Tell us what ingredients you have, and we'll suggest delicious recipes tailored to your preferences.
          </p>

          <div className="recipe-form">
            <div className="form-group">
              <label className="form-label">Ingredients</label>
              <div className="ingredients-input">
                <input
                  type="text"
                  name="currentIngredient"
                  value={currentIngredient}
                  onChange={this.handleIngredientChange}
                  onKeyPress={(e) => e.key === 'Enter' && this.addIngredient()}
                  placeholder="Enter an ingredient (e.g., chicken, tomatoes)"
                  className="ingredient-field"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={this.addIngredient}
                >
                  Add
                </Button>
              </div>
              <div className="ingredients-tags">
                {ingredients.map((ingredient, index) => (
                  <span key={index} className="ingredient-tag">
                    {ingredient}
                    <button type="button" onClick={() => this.removeIngredient(ingredient)}>×</button>
                  </span>
                ))}
              </div>
              {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Calories</label>
              <div className="calories-slider-container">
                <input
                  ref={this.sliderRef}
                  type="range"
                  name="maxCalories"
                  min="100"
                  max="2000"
                  value={maxCalories}
                  onChange={this.handleChange}
                  className="calories-slider"
                />
                <span className="calories-value">{maxCalories} kcal</span>
              </div>
              {errors.maxCalories && <span className="error-message">{errors.maxCalories}</span>}
            </div>

            <div className="form-group flex items-center space-x-4">
              <label className="form-label">Number of Servings</label>
              <div className="servings-controls flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={() => this.handleServingsChange('decrement')}
                  className="bg-gray-300 text-lg text-center w-8 h-8 rounded-full"
                >
                  -
                </Button>
                <span className="text-lg font-semibold">{servings}</span>
                <Button
                  type="button"
                  onClick={() => this.handleServingsChange('increment')}
                  className="bg-gray-300 text-lg text-center w-8 h-8 rounded-full"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                name="notes"
                value={notes}
                onChange={this.handleChange}
                placeholder="Add any notes or preferences (e.g., vegetarian, gluten-free)"
                className="notes-field"
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                onClick={this.handleSubmit}
              >
                Get Recipes
              </Button>
            </div>
          </div>
        </div>

        {showChat && (
          <div className="recipe-content chat-wrapper">
            <h3 className="recipe-title">Your Recipe & Follow-up Questions</h3>
            <p className="recipe-description">
              Ask questions about the recipe or request modifications
            </p>
            <Chat
              messages={messages}
              onSendMessage={this.handleChatMessage}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* --- LEAVE A REVIEW SECTION --- */}
        <div className="recipe-content" style={{ marginTop: '40px', padding: '40px', backgroundColor: 'white', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#2A241E', marginBottom: '15px' }}>Loved your meal?</h3>
          <p style={{ color: '#4A3F35', marginBottom: '25px', opacity: 0.8 }}>Leave a review about your experience! Your review will be featured on our landing page.</p>
          
          <form onSubmit={this.handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <textarea
              value={reviewText}
              onChange={(e) => this.setState({ reviewText: e.target.value })}
              placeholder="This recipe completely changed the way I cook..."
              style={{
                width: '100%', padding: '20px', borderRadius: '20px', border: '1px solid rgba(42,36,30,0.1)',
                backgroundColor: 'rgba(240, 230, 218, 0.2)', fontFamily: 'inherit', fontSize: '15px', minHeight: '120px',
                resize: 'none', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {reviewSuccess ? (
                <span style={{ color: '#4F6815', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✓ Review submitted successfully!
                </span>
              ) : <span></span>}
              
              <button 
                type="submit" 
                disabled={isSubmittingReview || !reviewText.trim()}
                style={{ 
                  backgroundColor: '#75070C', color: 'white', padding: '14px 30px', borderRadius: '15px', 
                  fontWeight: '900', border: 'none', cursor: isSubmittingReview || !reviewText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReview || !reviewText.trim() ? 0.6 : 1, transition: 'all 0.3s ease'
                }}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>

      </section>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  token: state.auth.token
});

export default connect(mapStateToProps, { logout })(RecipeRecommendation);