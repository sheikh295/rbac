/**
 * @fileoverview NestJS integration entry point for @mamoorali295/rbac
 */

// Check if NestJS dependencies are available
try {
  require('@nestjs/common');
  require('@nestjs/core');
  // If dependencies are available, export the NestJS integration
  module.exports = require('./dist/nestjs');
} catch (error) {
  throw new Error(
    'NestJS dependencies not found. Please install @nestjs/common and @nestjs/core to use NestJS integration:\n\n' +
    'npm install @nestjs/common @nestjs/core\n\n' +
    'Or if using yarn:\n' +
    'yarn add @nestjs/common @nestjs/core'
  );
}