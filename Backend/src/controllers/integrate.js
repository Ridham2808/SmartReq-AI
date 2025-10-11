const JiraApi = require('jira-client');
const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Encrypt sensitive data
 */
const encrypt = (text, secretKey) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedText, secretKey) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = textParts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Sync artifacts to Jira
 * POST /api/projects/:projectId/integrate/jira
 */
export const syncToJira = asyncHandler(async (req, res) => {
  if (!config.JIRA_ENABLED) {
    return res.status(400).json({
      success: false,
      message: 'Jira integration is disabled'
    });
  }
  const { projectId } = req.params;
  const { jiraUrl, apiKey, projectKey } = req.body;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Get all artifacts for the project
  const artifacts = await prisma.artifact.findMany({
    where: { projectId: parseInt(projectId) },
    select: {
      id: true,
      type: true,
      content: true
    }
  });

  if (artifacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No artifacts found to sync'
    });
  }

  try {
    // Initialize Jira client
    const jira = new JiraApi({
      protocol: 'https',
      host: jiraUrl.replace(/^https?:\/\//, ''),
      username: 'your-email@example.com', // This should be configurable
      password: apiKey,
      apiVersion: '3',
      strictSSL: true
    });

    let syncedCount = 0;
    const errors = [];

    // Process each artifact
    for (const artifact of artifacts) {
      try {
        if (artifact.type === 'story') {
          // Create Jira issue for user story
          const issueData = {
            fields: {
              project: { key: projectKey },
              summary: `User Story: ${artifact.content}`,
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: artifact.content
                      }
                    ]
                  }
                ]
              },
              issuetype: { name: 'Story' },
              labels: ['smartreq-ai', 'generated']
            }
          };

          await jira.addNewIssue(issueData);
          syncedCount++;
        } else if (artifact.type === 'flow') {
          // Create Jira issue for process flow
          const flowContent = typeof artifact.content === 'string' 
            ? artifact.content 
            : JSON.stringify(artifact.content, null, 2);

          const issueData = {
            fields: {
              project: { key: projectKey },
              summary: `Process Flow: ${project.name}`,
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: `Process flow for project: ${project.name}\n\n${flowContent}`
                      }
                    ]
                  }
                ]
              },
              issuetype: { name: 'Task' },
              labels: ['smartreq-ai', 'process-flow', 'generated']
            }
          };

          await jira.addNewIssue(issueData);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing artifact ${artifact.id}:`, error);
        errors.push({
          artifactId: artifact.id,
          error: error.message
        });
      }
    }

    // Store integration credentials (encrypted)
    const encryptedApiKey = encrypt(apiKey, process.env.JIRA_ENCRYPTION_KEY || 'default-key');
    
    // You might want to store this in a separate integration settings table
    // For now, we'll just log the success

    res.json({
      success: true,
      message: 'Artifacts synced to Jira successfully',
      data: {
        syncedCount,
        totalArtifacts: artifacts.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Jira integration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync with Jira',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Integration failed'
    });
  }
});

/**
 * Test Jira connection
 * POST /api/projects/:projectId/integrate/jira/test
 */
export const testJiraConnection = asyncHandler(async (req, res) => {
  if (!config.JIRA_ENABLED) {
    return res.status(400).json({
      success: false,
      message: 'Jira integration is disabled'
    });
  }
  const { jiraUrl, apiKey, projectKey } = req.body;

  try {
    // Initialize Jira client
    const jira = new JiraApi({
      protocol: 'https',
      host: jiraUrl.replace(/^https?:\/\//, ''),
      username: 'your-email@example.com', // This should be configurable
      password: apiKey,
      apiVersion: '3',
      strictSSL: true
    });

    // Test connection by getting project info
    const project = await jira.getProject(projectKey);

    res.json({
      success: true,
      message: 'Jira connection successful',
      data: {
        projectName: project.name,
        projectKey: project.key,
        projectType: project.projectTypeKey
      }
    });

  } catch (error) {
    console.error('Jira connection test error:', error);
    return res.status(400).json({
      success: false,
      message: 'Failed to connect to Jira',
      error: error.message
    });
  }
});

/**
 * Get integration status
 * GET /api/projects/:projectId/integrate/status
 */
export const getIntegrationStatus = asyncHandler(async (req, res) => {
  if (!config.JIRA_ENABLED) {
    return res.json({
      success: true,
      data: {
        jiraEnabled: false,
        message: 'Jira integration is disabled'
      }
    });
  }
  const { projectId } = req.params;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Get artifact counts
  const [totalArtifacts, storiesCount, flowsCount] = await Promise.all([
    prisma.artifact.count({
      where: { projectId: parseInt(projectId) }
    }),
    prisma.artifact.count({
      where: { 
        projectId: parseInt(projectId),
        type: 'story'
      }
    }),
    prisma.artifact.count({
      where: { 
        projectId: parseInt(projectId),
        type: 'flow'
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      projectId: parseInt(projectId),
      integrationStatus: {
        totalArtifacts,
        storiesCount,
        flowsCount,
        readyForSync: totalArtifacts > 0
      }
    }
  });
});

module.exports = {
  syncToJira,
  testJiraConnection,
  getIntegrationStatus
};