/**
 * SessionContext.jsx — Global state management for the knowledge model
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { getSession, saveSession } from '../services/knowledgeModel';

const SessionContext = createContext(null);

const initialState = {
  session: null,
  currentScreen: 'upload', // upload | extracting | diagnostic | gap-analysis | roadmap | teaching | quiz | dashboard
  loading: false,
  error: null,
  notification: null,
};

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload, error: null };
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Load existing session on mount
  useEffect(() => {
    const existing = getSession();
    if (existing) {
      dispatch({ type: 'SET_SESSION', payload: existing });
      // Determine which screen to show based on session status
      const screenMap = {
        'diagnostic_pending': 'diagnostic',
        'diagnostic_done': 'gap-analysis',
        'roadmap_pending': 'roadmap',
        'learning': 'teaching',
        'consolidation': 'quiz',
        'complete': 'dashboard',
      };
      dispatch({ type: 'SET_SCREEN', payload: screenMap[existing.status] || 'upload' });
    }
  }, []);

  // Listen for session updates from knowledgeModel
  useEffect(() => {
    const handler = (e) => {
      dispatch({ type: 'SET_SESSION', payload: e.detail });
    };
    window.addEventListener('session-updated', handler);
    return () => window.removeEventListener('session-updated', handler);
  }, []);

  const navigate = useCallback((screen) => {
    dispatch({ type: 'SET_SCREEN', payload: screen });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const notify = useCallback((message, type = 'info') => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <SessionContext.Provider value={{ ...state, dispatch, navigate, setLoading, setError, notify, reset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}

export default SessionContext;
