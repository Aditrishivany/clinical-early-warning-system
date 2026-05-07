// File: src/dashboard/src/services/api.js
// Purpose: All API calls to our FastAPI backend

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ─────────────────────────────────────────
// HELPER: Make API calls
// ─────────────────────────────────────────
const apiCall = async (method, endpoint, body = null) => {
  try {
    const options = {
      method:  method,
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      mode: 'cors',
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// ─────────────────────────────────────────
// ANALYSIS
// ─────────────────────────────────────────
export const analyzePatient = async (patientData) => {
  return await apiCall('POST', '/analyze', patientData);
};

// ─────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────
export const getDashboardStats = async () => {
  return await apiCall('GET', '/dashboard/stats');
};

export const getActiveAlerts = async () => {
  return await apiCall('GET', '/dashboard/alerts');
};

export const getHighRiskPatients = async () => {
  return await apiCall('GET', '/dashboard/high-risk');
};

export const getPatientHistory = async (patientId) => {
  return await apiCall('GET', `/patient/${patientId}/history`);
};

// ─────────────────────────────────────────
// RAG
// ─────────────────────────────────────────
export const askClinicalQuestion = async (question, patientContext = null) => {
  return await apiCall('POST', '/rag/ask', {
    question:        question,
    patient_context: patientContext,
  });
};

export const searchGuidelines = async (query) => {
  return await apiCall('GET', `/rag/search?q=${query}`);
};