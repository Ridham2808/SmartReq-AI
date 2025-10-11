const { spawn } = require('child_process');
const path = require('path');
const config = require('../config/env');
const { logger } = require('../middleware/errorHandler');

/**
 * Process text using Python NLP script to extract requirements and generate artifacts
 * @param {string} text - Input text to process
 * @returns {Promise<Object>} - Generated artifacts (stories and flows)
 */
const processTextWithNLP = (text) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve(config.PYTHON_SCRIPT_PATH);
    const pythonProcess = spawn('python3', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    // Send text to Python script
    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();

    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python NLP script failed:', errorOutput);
        return reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (parseError) {
        logger.error('Failed to parse Python script output:', parseError);
        reject(new Error('Failed to parse NLP processing results'));
      }
    });

    pythonProcess.on('error', (error) => {
      logger.error('Failed to start Python process:', error);
      reject(new Error('Failed to start NLP processing'));
    });

    // Set timeout for Python script execution
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('NLP processing timeout'));
    }, 30000); // 30 seconds timeout
  });
};

/**
 * Extract user stories from processed text
 * @param {string} text - Input text
 * @returns {Promise<Array>} - Array of user stories
 */
const extractUserStories = async (text) => {
  try {
    const result = await processTextWithNLP(text);
    return result.stories || [];
  } catch (error) {
    logger.warn('NLP unavailable or failed while extracting user stories. Returning empty list.', {
      message: error?.message
    });
    return [];
  }
};

/**
 * Generate process flows from processed text
 * @param {string} text - Input text
 * @returns {Promise<Array>} - Array of process flows
 */
const generateProcessFlows = async (text) => {
  try {
    const result = await processTextWithNLP(text);
    return result.flows || [];
  } catch (error) {
    logger.warn('NLP unavailable or failed while generating process flows. Returning empty list.', {
      message: error?.message
    });
    return [];
  }
};

/**
 * Process all inputs for a project and generate artifacts
 * @param {Array} inputs - Array of input objects
 * @returns {Promise<Object>} - Generated artifacts
 */
const processProjectInputs = async (inputs) => {
  try {
    // Combine all text content
    const combinedText = inputs
      .filter(input => input.content)
      .map(input => input.content)
      .join('\n\n');

    if (!combinedText.trim()) {
      logger.warn('No text content found in inputs for NLP processing. Returning empty artifacts.');
      return { stories: [], flows: [] };
    }

    const result = await processTextWithNLP(combinedText);
    
    return {
      stories: result.stories || [],
      flows: result.flows || []
    };
  } catch (error) {
    logger.warn('NLP unavailable or failed while processing project inputs. Returning basic artifacts.', {
      message: error?.message
    });
    
    // Return basic artifacts when NLP fails
    const basicStories = [
      'As a user, I want to access the system so that I can perform my tasks.',
      'As a user, I want to input my data so that I can process it effectively.',
      'As a user, I want to view results so that I can understand the output.',
      'As a user, I want to save my work so that I can access it later.',
      'As a user, I want to export data so that I can share it with others.'
    ];
    
    const basicFlow = {
      nodes: [
        { id: 'start', type: 'custom', position: { x: 100, y: 100 }, data: { label: 'Start', type: 'start' } },
        { id: 'input', type: 'custom', position: { x: 300, y: 100 }, data: { label: 'Input Data', type: 'process' } },
        { id: 'process', type: 'custom', position: { x: 500, y: 100 }, data: { label: 'Process', type: 'process' } },
        { id: 'output', type: 'custom', position: { x: 300, y: 250 }, data: { label: 'View Results', type: 'process' } },
        { id: 'save', type: 'custom', position: { x: 500, y: 250 }, data: { label: 'Save/Export', type: 'process' } },
        { id: 'end', type: 'custom', position: { x: 700, y: 175 }, data: { label: 'End', type: 'end' } }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'input', type: 'smoothstep' },
        { id: 'e2', source: 'input', target: 'process', type: 'smoothstep' },
        { id: 'e3', source: 'process', target: 'output', type: 'smoothstep' },
        { id: 'e4', source: 'output', target: 'save', type: 'smoothstep' },
        { id: 'e5', source: 'save', target: 'end', type: 'smoothstep' }
      ]
    };
    
    return { stories: basicStories, flows: [basicFlow] };
  }
};

module.exports = {
  processTextWithNLP,
  extractUserStories,
  generateProcessFlows,
  processProjectInputs
};