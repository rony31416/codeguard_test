import axios from 'axios';
import { CodeAnalysisRequest, AnalysisResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

// Configure axios defaults
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

export const analyzeCode = async (request: CodeAnalysisRequest): Promise<AnalysisResponse> => {
  try {
    console.log('Sending request:', request);
    const response = await axios.post<AnalysisResponse>(
      `${API_BASE_URL}/api/analyze`, 
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('Received response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const submitFeedback = async (analysisId: number, feedback: string, comment?: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/feedback`, {
      analysis_id: analysisId,
      feedback,
      comment
    });
    return response.data;
  } catch (error: any) {
    console.error('Feedback Error:', error.response?.data || error.message);
    throw error;
  }
};

export const getHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/history`);
    return response.data;
  } catch (error: any) {
    console.error('History Error:', error.response?.data || error.message);
    throw error;
  }
};
