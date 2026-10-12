/**
 * SkillLens AI — Centralized Backend API Client
 *
 * Handles all HTTP communication with the FastAPI backend.
 * Reads base URL from import.meta.env.VITE_API_BASE_URL or defaults to empty (proxied) / localhost:8000.
 */

import { demoStudySet } from '../data/demoContent';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Normalizes error messages from API or network failures.
 */
function normalizeErrorMessage(errorData, status) {
  if (errorData?.error?.message) {
    return errorData.error.message;
  }
  if (errorData?.detail) {
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map((d) => d.msg || d.message).join(', ');
    }
  }
  if (status === 404) return 'The requested API endpoint was not found on the backend.';
  if (status === 422) return errorData?.error?.message || 'Invalid input parameters submitted.';
  if (status === 502) return 'The AI service encountered an upstream issue. Please try again.';
  if (status === 504) return 'The AI request timed out. Please try with shorter notes.';
  return `Server error (${status || 'Network Error'}). Please check that the backend is running.`;
}

/**
 * Checks backend health status.
 * @returns {Promise<{status: string, app: string, model_configured: string}>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(normalizeErrorMessage(err, response.status));
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the SkillLens backend. Please ensure Uvicorn is running on port 8000.');
    }
    throw err;
  }
}

/**
 * Analyzes text notes and/or educational image to generate complete study material.
 * @param {Object} params
 * @param {string} [params.text] - Notes or question text
 * @param {File} [params.image] - Uploaded image file
 * @returns {Promise<Object>}
 */
export async function analyzeContent({ text, image }) {
  if (!text?.trim() && !image) {
    throw new Error('Please provide notes, text, or an image to analyze.');
  }

  const formData = new FormData();
  if (text?.trim()) {
    formData.append('text', text.trim());
  }
  if (image) {
    formData.append('image', image);
  }

  try {
    // Note: Do NOT set Content-Type header manually so browser includes multipart boundary
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(normalizeErrorMessage(data, response.status));
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Failed to reach backend server. Please verify backend is running on http://localhost:8000.');
    }
    throw err;
  }
}

/**
 * Generates flashcards collection from text.
 * @param {string} text
 * @returns {Promise<{flashcards: Array}>}
 */
export async function generateFlashcards(text) {
  if (!text?.trim()) {
    throw new Error('Source text is required to generate flashcards.');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/generate/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(normalizeErrorMessage(data, response.status));
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Failed to connect to backend server.');
    }
    throw err;
  }
}

/**
 * Generates quiz questions from text.
 * @param {string} text
 * @returns {Promise<{quiz: Array}>}
 */
export async function generateQuiz(text) {
  if (!text?.trim()) {
    throw new Error('Source text is required to generate a quiz.');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/generate/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(normalizeErrorMessage(data, response.status));
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Failed to connect to backend server.');
    }
    throw err;
  }
}

/**
 * Helper to retrieve mock demo content when developing offline.
 */
export function getDemoStudyContent() {
  return demoStudySet;
}
