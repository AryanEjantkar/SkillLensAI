/**
 * Standalone Integration Test for Google's Gemma 4 (gemma-4-26b-a4b-it)
 *
 * Runs an isolated test using the official Google Gen AI SDK to verify:
 * 1. GEMINI_API_KEY environment variable is present and valid.
 * 2. Model 'gemma-4-26b-a4b-it' is available to the API key.
 * 3. Generation succeeds with a simple text prompt.
 *
 * Usage:
 *   node test-gemma.js
 *   npm run test:gemma
 */

import dotenv from 'dotenv';
import { GEMMA_MODEL_ID, verifyModelAvailability, generateGemmaResponse } from './services/gemmaService.js';

dotenv.config();

console.log('='.repeat(60));
console.log('  GEMMA 4 INTEGRATION TEST');
console.log(`  Target Model: ${GEMMA_MODEL_ID}`);
console.log('='.repeat(60));

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Environment variable check
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('\n❌ [FAIL] Missing GEMINI_API_KEY!');
    console.error('Please configure your API key in the .env file:');
    console.error('  GEMINI_API_KEY=AIzaSy...');
    console.error('Or export it in your shell:');
    console.error('  $env:GEMINI_API_KEY="AIzaSy..." (PowerShell)');
    process.exit(1);
  }

  const maskedKey = apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`\n🔑 [CHECK 1] GEMINI_API_KEY detected: ${maskedKey}`);

  // 2. Model availability verification
  console.log(`\n🔍 [CHECK 2] Verifying model availability for "${GEMMA_MODEL_ID}"...`);
  try {
    const availability = await verifyModelAvailability();
    if (availability.available) {
      console.log(`✅ [PASS] Model "${GEMMA_MODEL_ID}" is available and accessible.`);
    } else {
      console.warn(`⚠️ [WARNING] Model status check: ${availability.error}`);
      console.log('Proceeding to prompt generation test directly...');
    }
  } catch (err) {
    console.warn(`⚠️ [WARNING] Availability lookup notice: ${err.message}`);
  }

  // 3. Prompt execution test
  const testPrompt = 'Briefly state three fundamental laws of robotics in 3 bullet points.';
  console.log(`\n🚀 [CHECK 3] Sending test prompt to "${GEMMA_MODEL_ID}"...`);
  console.log(`Prompt: "${testPrompt}"`);

  const startTime = Date.now();
  try {
    const result = await generateGemmaResponse({ prompt: testPrompt });
    const elapsedMs = Date.now() - startTime;

    console.log('\n' + '-'.repeat(60));
    console.log(`✅ [SUCCESS] Gemma 4 Response (${elapsedMs}ms):`);
    console.log('-'.repeat(60));
    console.log(result.text.trim());
    console.log('-'.repeat(60));
    console.log(`Model ID Confirmed: ${result.model}`);
    if (result.usageMetadata) {
      console.log(`Usage: promptTokens=${result.usageMetadata.promptTokenCount}, candidatesTokens=${result.usageMetadata.candidatesTokenCount}`);
    }
    console.log('\n🎉 Gemma 4 integration test completed successfully!');
  } catch (err) {
    console.error('\n❌ [FAIL] Error calling Gemma 4:');
    console.error(`Message: ${err.message}`);
    if (err.originalError) {
      console.error(`Details: ${err.originalError}`);
    }
    process.exit(1);
  }
}

runTest();
