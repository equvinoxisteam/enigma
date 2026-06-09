import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(undefined);

const initialState = {
  items: [],
  subtotal: 0,
  itemCount: 0,
  loading: false,
  error: null,
  lastSync: null
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        subtotal: action.payload.subtotal || 0,
        itemCount: action.payload.itemCount || 0,
        lastSync: action.payload.updatedAt,
        loading: false,
        error: null
      };
    
    case 'CLEAR_CART':
      return { ...initialState };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5005/api';


  // Helper function to get auth token
  const getAuthToken = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.token;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        return null;
      }
    }
    return user?.token || null;
  };

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  // Fetch cart from server
  const fetchCart = async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await apiCall('/cart');
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      
      // If unauthorized, clear cart
      if (error.message.includes('authentication') || error.message.includes('token')) {
        dispatch({ type: 'CLEAR_CART' });
        localStorage.removeItem('user');
      }
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    if (!product || (!product._id && !product.id)) {
      throw new Error('Invalid product data');
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product._id || product.id,
          quantity
        })
      });
      
      // Refresh cart after adding
      await fetchCart();
      
      return {
        success: true,
        message: response.message,
        item: response.item
      };
    } catch (error) {
      console.error('Failed to add to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return;

    if (quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await apiCall(`/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      });
      
      // Refresh cart after updating
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await apiCall(`/cart/${productId}`, {
        method: 'DELETE'
      });
      
      // Refresh cart after removing
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await apiCall('/cart', {
        method: 'DELETE'
      });
      
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Sync local cart with server (useful for guest cart -> user cart)
  const syncCart = async (localCartItems = []) => {
    if (!isAuthenticated || localCartItems.length === 0) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await apiCall('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({
          items: localCartItems.map(item => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity
          }))
        })
      });
      
      // Refresh cart after syncing
      await fetchCart();
    } catch (error) {
      console.error('Failed to sync cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated]);

  // Helper function to check if item is in cart
  const isInCart = (productId) => {
    return cart.items.some(item => 
      (item.product._id || item.product.id) === productId
    );
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = cart.items.find(item => 
      (item.product._id || item.product.id) === productId
    );
    return item ? item.quantity : 0;
  };

  // Calculate totals for checkout
  const getCartSummary = () => {
    const subtotal = cart.subtotal;
    const shipping = subtotal > 999 ? 0 : 50;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount: cart.itemCount
    };
  };

  // Clear error manually
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    // State
    cart,
    loading: cart.loading,
    error: cart.error,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    fetchCart,
    clearError,
    
    // Helpers
    isInCart,
    getItemQuantity,
    getCartSummary
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};