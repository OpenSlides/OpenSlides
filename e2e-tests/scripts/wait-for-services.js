#!/usr/bin/env node

const waitOn = require('wait-on');

const opts = {
  resources: [
    'tcp:localhost:8000',  // Proxy (main entry)
    'tcp:localhost:9001',  // Client
    'tcp:localhost:9002',  // Backend
    'tcp:localhost:9004',  // Auth
    'tcp:localhost:9012',  // Autoupdate
    'tcp:localhost:5432',  // PostgreSQL
    'tcp:localhost:6379',  // Redis
  ],
  delay: 1000,
  interval: 1000,
  timeout: 300000, // 5 minutes
  tcpTimeout: 5000,
  log: true,
  verbose: true
};

console.log('Waiting for OpenSlides services to be ready...');

waitOn(opts)
  .then(() => {
    console.log('All services are ready!');
    // Additional health checks
    const https = require('https');
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    https.get('https://localhost:8000/health', { agent }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('OpenSlides proxy is responding to HTTPS requests');
        process.exit(0);
      } else {
        console.error(`Unexpected status code: ${res.statusCode}`);
        process.exit(1);
      }
    }).on('error', (err) => {
      console.error('Error checking HTTPS endpoint:', err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Error waiting for services:', err);
    process.exit(1);
  });