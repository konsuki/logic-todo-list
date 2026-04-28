// We use a Vite proxy to avoid CORS issues.
// See vite.config.js for the configuration that maps /api to http://localhost:8000
const API_BASE_URL = '/api';

export const sendChatMessage = async (message, timeout = 120000) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        wait_for_response: true,
        timeout,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.error || data.message || 'Unknown API error');
    }

    return data.response;
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
