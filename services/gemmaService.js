import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Explicit model identifier for Google's Gemma 4 instruction-tuned model.
 * Configurable via GEMMA_MODEL environment variable, defaults to gemma-4-26b-a4b-it.
 * Important: Explicitly configured as required; no silent model substitution.
 */
export const GEMMA_MODEL_ID = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';

/**
 * Model specifications and verified capabilities
 */
export const GEMMA_MODEL_CAPABILITIES = {
  modelId: GEMMA_MODEL_ID,
  family: 'Gemma 4',
  architecture: 'Mixture-of-Experts (MoE) - 25.2B total, 3.8B active params',
  supportsImages: true, // Gemma 4 is natively multimodal
  contextWindow: 256000,
  supportedImageMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
};

/**
 * Securely retrieves an initialized GoogleGenAI SDK client.
 * Validates that GEMINI_API_KEY is present and not a default placeholder.
 */
export function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    const error = new Error('GEMINI_API_KEY is not configured. Please supply a valid key in your .env file or environment variables.');
    error.statusCode = 401;
    error.code = 'API_KEY_MISSING';
    throw error;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Verifies if the gemma-4-26b-a4b-it model is accessible with the provided API key.
 * @returns {Promise<{available: boolean, modelId: string, details?: any, error?: string}>}
 */
export async function verifyModelAvailability() {
  const client = getGenAIClient();

  // Try direct model ID first
  try {
    const model = await client.models.get({ model: GEMMA_MODEL_ID });
    return {
      available: true,
      modelId: GEMMA_MODEL_ID,
      details: model
    };
  } catch (directErr) {
    // Try with 'models/' prefix format if required by endpoint
    try {
      const modelPrefixed = await client.models.get({ model: `models/${GEMMA_MODEL_ID}` });
      return {
        available: true,
        modelId: GEMMA_MODEL_ID,
        details: modelPrefixed
      };
    } catch (prefixErr) {
      // In case models.get is restricted or returns 404, check via models.list()
      try {
        const listResponse = await client.models.list();
        const found = listResponse.models?.find(
          (m) => m.name === GEMMA_MODEL_ID || m.name === `models/${GEMMA_MODEL_ID}`
        );

        if (found) {
          return {
            available: true,
            modelId: GEMMA_MODEL_ID,
            details: found
          };
        }
      } catch (listErr) {
        // Fall through to error reporting
      }

      return {
        available: false,
        modelId: GEMMA_MODEL_ID,
        error: prefixErr.message || directErr.message
      };
    }
  }
}

/**
 * Sends user prompt (and optional image) to Gemma 4 and returns the generated text response.
 *
 * @param {Object} params
 * @param {string} params.prompt - The text prompt from the user
 * @param {Object} [params.image] - Optional image object { mimeType, base64Data }
 * @returns {Promise<{model: string, text: string, usageMetadata?: any}>}
 */
export async function generateGemmaResponse({ prompt, image = null }) {
  // 1. Prompt input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    const error = new Error('Validation Error: A non-empty text prompt is required.');
    error.statusCode = 400;
    error.code = 'INVALID_PROMPT';
    throw error;
  }

  const cleanPrompt = prompt.trim();
  if (cleanPrompt.length > 32000) {
    const error = new Error('Validation Error: Prompt exceeds the maximum allowed length (32,000 characters).');
    error.statusCode = 400;
    error.code = 'PROMPT_TOO_LONG';
    throw error;
  }

  const client = getGenAIClient();
  const contents = [];

  // 2. Multimodal image input verification & validation
  if (image) {
    if (!GEMMA_MODEL_CAPABILITIES.supportsImages) {
      const error = new Error(`Model ${GEMMA_MODEL_ID} does not support image inputs.`);
      error.statusCode = 400;
      error.code = 'IMAGE_UNSUPPORTED';
      throw error;
    }

    if (!image.mimeType || !GEMMA_MODEL_CAPABILITIES.supportedImageMimeTypes.includes(image.mimeType)) {
      const error = new Error(
        `Validation Error: Unsupported image MIME type "${image.mimeType}". Allowed: ${GEMMA_MODEL_CAPABILITIES.supportedImageMimeTypes.join(', ')}`
      );
      error.statusCode = 400;
      error.code = 'INVALID_IMAGE_TYPE';
      throw error;
    }

    if (!image.base64Data || typeof image.base64Data !== 'string') {
      const error = new Error('Validation Error: Base64 image data is missing or invalid.');
      error.statusCode = 400;
      error.code = 'INVALID_IMAGE_DATA';
      throw error;
    }

    // Attach image inline part
    contents.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64Data
      }
    });
  }

  // Attach text prompt
  contents.push(cleanPrompt);

  try {
    // Explicitly call Gemma 4 model
    const response = await client.models.generateContent({
      model: GEMMA_MODEL_ID,
      contents: contents
    });

    return {
      model: GEMMA_MODEL_ID,
      text: response.text || '',
      usageMetadata: response.usageMetadata || null
    };
  } catch (apiError) {
    // Enhance API errors with actionable messages
    const enhancedError = new Error(formatApiErrorMessage(apiError));
    enhancedError.statusCode = apiError.status || 500;
    enhancedError.originalError = apiError.message;
    throw enhancedError;
  }
}

/**
 * Formats API errors into clear, developer- and user-friendly explanations.
 */
function formatApiErrorMessage(err) {
  const msg = err.message || '';
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'Invalid Gemini API key. Please check your GEMINI_API_KEY in the .env file.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'Rate limit or quota exceeded for the Gemini API. Please wait a moment and try again.';
  }
  if (msg.includes('NOT_FOUND') || msg.includes('not found') || msg.includes('404')) {
    return `Model "${GEMMA_MODEL_ID}" was not found or is not enabled for your API key/region.`;
  }
  if (msg.includes('PERMISSION_DENIED')) {
    return 'Permission denied. Ensure your API key has access to Gemma open models.';
  }
  return `Google GenAI API error: ${msg}`;
}
