// api.js — all API calls with JWT auth, timeout, and structured error handling

const API_BASE   = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';
const TIMEOUT_MS = 15_000;

const getToken = () => localStorage.getItem('clinicalai_token');

// ── Core fetch wrapper ────────────────────────────────────────────────────────

const apiCall = async (method, endpoint, body = null) => {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token   = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body:   body ? JSON.stringify(body) : null,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.status === 401) {
      // Token expired — clear and reload to login
      localStorage.removeItem('clinicalai_token');
      localStorage.removeItem('clinicalai_user');
      window.location.reload();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        detail = err.detail || detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    return await response.json();

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const getAuthPatients = () => apiCall('GET', '/auth/patients');
export const getAuthStaff    = () => apiCall('GET', '/auth/staff');

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analyzePatient = (data)  => apiCall('POST', '/analyze', data);
export const ingestVitals = (data)    => apiCall('POST', '/ingest/vitals', data);
export const ingestVitalsBatch = (readings) =>
  apiCall('POST', '/ingest/vitals/batch', { readings });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats   = ()         => apiCall('GET', '/dashboard/stats');
export const getActiveAlerts     = ()         => apiCall('GET', '/dashboard/alerts');
export const getHighRiskPatients = ()         => apiCall('GET', '/dashboard/high-risk');
export const getPatientHistory   = (pid)      => apiCall('GET', `/patient/${pid}/history`);

// ── ML ────────────────────────────────────────────────────────────────────────
export const predictRisk = (vitals) => apiCall('POST', '/predict', vitals);
export const getModelInfo = ()      => apiCall('GET', '/model-info');

// ── RAG / Chat ────────────────────────────────────────────────────────────────
export const sendChatMessage = (payload) => apiCall('POST', '/rag/chat', payload);
export const clearChatHistory = (userId) =>
  apiCall('POST', `/rag/chat/clear?user_id=${encodeURIComponent(userId)}`);
export const askClinicalQuestion = (question, patientContext = null) =>
  apiCall('POST', '/rag/ask', { question, patient_context: patientContext });
export const searchGuidelines = (q) =>
  apiCall('GET',  `/rag/search?q=${encodeURIComponent(q)}`);
export const listGuidelines = () => apiCall('GET', '/rag/guidelines');
