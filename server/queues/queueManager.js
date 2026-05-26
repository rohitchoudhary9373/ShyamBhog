const { Queue, QueueScheduler } = require('bullmq');
const ioredis = require('ioredis');
const logger = require('../utils/logger');
const { redisClient } = require('../utils/cache');

const queues = {};
let useInProcessFallback = false;

// Custom in-memory queue fallback runner
const inProcessQueue = async (queueName, jobName, data) => {
  logger.info(`[IN-PROCESS QUEUE] Running job '${jobName}' on queue '${queueName}' with data:`, data);
  
  // Asynchronously execute worker logic in next tick to prevent blocking
  setImmediate(async () => {
    try {
      const processJobDirectly = require('./workers').processJobDirectly;
      await processJobDirectly(queueName, jobName, data);
    } catch (err) {
      logger.error(`[IN-PROCESS QUEUE ERROR] Job ${jobName} on ${queueName} failed: ${err.stack || err.message}`);
    }
  });
};

const initQueues = () => {
  const queueNames = ['invoice', 'whatsapp', 'email', 'refunds', 'booking'];
  
  // Check if we should fallback
  if (!redisClient || redisClient.status !== 'ready') {
    logger.warn('Redis is not ready. Enabling in-process background job fallback.');
    useInProcessFallback = true;
    return;
  }

  const connection = redisClient;

  try {
    for (const name of queueNames) {
      // In BullMQ v3/v4/v5, Queue takes the name and options object
      queues[name] = new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
      logger.info(`BullMQ Queue '${name}' initialized successfully`);
    }
  } catch (err) {
    logger.error(`Failed to initialize BullMQ: ${err.message}. Falling back to in-process execution.`);
    useInProcessFallback = true;
  }
};

// Initialize queues
initQueues();

/**
 * Add a job to a background queue.
 * @param {string} queueName - Name of the queue ('invoice' | 'whatsapp' | 'email' | 'refunds' | 'booking')
 * @param {string} jobName - Name of the job task
 * @param {object} data - Job payload data
 */
const addJob = async (queueName, jobName, data = {}) => {
  if (useInProcessFallback || !queues[queueName]) {
    await inProcessQueue(queueName, jobName, data);
    return;
  }

  try {
    await queues[queueName].add(jobName, data);
    logger.info(`Job '${jobName}' successfully added to Redis BullMQ Queue '${queueName}'`);
  } catch (err) {
    logger.error(`Failed to add job to queue '${queueName}': ${err.message}. Executing in-process fallback.`);
    await inProcessQueue(queueName, jobName, data);
  }
};

module.exports = {
  addJob,
};
