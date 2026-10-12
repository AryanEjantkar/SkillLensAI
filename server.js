import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  GEMMA_MODEL_ID,
  GEMMA_MODEL_CAPABILITIES,
  verifyModelAvailability,
  generateGemmaResponse
} from './services/gemmaService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend serving
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for in-memory image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (GEMMA_MODEL_CAPABILITIES.supportedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type "${file.mimetype}". Supported types: ${GEMMA_MODEL_CAPABILITIES.supportedImageMimeTypes.join(', ')}`
        ),
        false
      );
    }
  }
});

// API Routes

/**
 * Health check & Model configuration
 */
app.get('/api/health', (req, res) => {
  const hasApiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'healthy',
    configuredModel: GEMMA_MODEL_ID,
    capabilities: GEMMA_MODEL_CAPABILITIES,
    apiKeyConfigured: hasApiKey
  });
});

/**
 * Verify model availability against current API key
 */
app.get('/api/model-info', async (req, res) => {
  try {
    const result = await verifyModelAvailability();
    res.json({
      success: true,
      ...result,
      capabilities: GEMMA_MODEL_CAPABILITIES
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      model: GEMMA_MODEL_ID,
      error: err.message,
      code: err.code || 'VERIFICATION_FAILED'
    });
  }
});

/**
 * Generate response using Gemma 4 (Text only or Text + Image)
 */
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    // 1. Extract prompt from body (supports JSON or multipart form-data)
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: A non-empty "prompt" is required.',
        code: 'MISSING_PROMPT'
      });
    }

    // 2. Process optional uploaded image
    let imagePayload = null;
    if (req.file) {
      imagePayload = {
        mimeType: req.file.mimetype,
        base64Data: req.file.buffer.toString('base64')
      };
    } else if (req.body?.imageBase64 && req.body?.imageMimeType) {
      // Support direct base64 in JSON payload
      imagePayload = {
        mimeType: req.body.imageMimeType,
        base64Data: req.body.imageBase64.replace(/^data:[^;]+;base64,/, '')
      };
    }

    // 3. Invoke Gemma 4 backend service
    const responseData = await generateGemmaResponse({
      prompt: prompt.trim(),
      image: imagePayload
    });

    res.json({
      success: true,
      model: GEMMA_MODEL_ID,
      response: responseData.text,
      usage: responseData.usageMetadata
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'An unexpected error occurred while calling Gemma 4.',
      code: err.code || 'GENERATION_ERROR'
    });
  }
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Image file is too large. Maximum size allowed is 10 MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
      code: 'UPLOAD_ERROR'
    });
  } else if (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Server error',
      code: err.code || 'SERVER_ERROR'
    });
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SkillAI Gemma 4 Server running on http://localhost:${PORT}`);
  console.log(`🧠 Explicit Model Target: ${GEMMA_MODEL_ID}`);
  console.log(`📷 Multimodal Image Inputs: Enabled (JPEG, PNG, WEBP, GIF)`);
  console.log(`======================================================\n`);
});
