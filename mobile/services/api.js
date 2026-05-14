import axios from 'axios';

// Change this to match your backend URL
const API_BASE_URL = 'http://localhost:3000/api'; // Updated to match backend default port

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests if available
api.interceptors.request.use(
  async (config) => {
    // TODO: Retrieve and add JWT token if using authentication
    // const token = await AsyncStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const movieService = {
  // Get all movies
  getMovies: async () => {
    try {
      const response = await api.get('/movies');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single movie
  getMovie: async (id) => {
    try {
      const response = await api.get(`/movies/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search movies
  searchMovies: async (query) => {
    try {
      const response = await api.get('/movies/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const adminService = {
  // Login
  login: async (username, password) => {
    try {
      const response = await api.post('/admin/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add movie
  addMovie: async (movieData) => {
    try {
      const response = await api.post('/movies', movieData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete movie
  deleteMovie: async (id) => {
    try {
      const response = await api.delete(`/movies/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
