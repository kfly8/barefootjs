#!/usr/bin/env node
/**
 * Validation script for barefoot.config.json files
 * 
 * This script verifies that all configuration files are valid JSON
 * and follow the expected schema.
 */

const fs = require('fs');
const path = require('path');

// Configuration directory relative to this script
const EXAMPLES_DIR_PATH = '../examples';

// Configuration schemas
const STATIC_REQUIRED = ['mode', 'entry', 'template', 'title'];
const SERVER_REQUIRED = ['mode', 'components'];

function validateStaticConfig(config, filepath) {
  const errors = [];
  
  for (const field of STATIC_REQUIRED) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  if (config.mode !== 'static') {
    errors.push(`Expected mode to be 'static', got '${config.mode}'`);
  }
  
  if (typeof config.entry !== 'string') {
    errors.push(`Expected entry to be a string`);
  }
  
  if (typeof config.template !== 'string') {
    errors.push(`Expected template to be a string`);
  }
  
  if (typeof config.title !== 'string') {
    errors.push(`Expected title to be a string`);
  }
  
  return errors;
}

function validateServerConfig(config, filepath) {
  const errors = [];
  
  for (const field of SERVER_REQUIRED) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  if (config.mode !== 'server') {
    errors.push(`Expected mode to be 'server', got '${config.mode}'`);
  }
  
  if (!Array.isArray(config.components)) {
    errors.push(`Expected components to be an array`);
  } else if (config.components.length === 0) {
    errors.push(`Expected components array to be non-empty`);
  }
  
  return errors;
}

function validateConfig(filepath) {
  console.log(`\nValidating: ${filepath}`);
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const config = JSON.parse(content);
    
    console.log(`  ✓ Valid JSON`);
    
    let errors = [];
    
    if (!config.mode) {
      errors.push('Missing required field: mode');
    } else if (config.mode === 'static') {
      errors = validateStaticConfig(config, filepath);
    } else if (config.mode === 'server') {
      errors = validateServerConfig(config, filepath);
    } else {
      errors.push(`Unknown mode: ${config.mode}`);
    }
    
    if (errors.length > 0) {
      console.log(`  ✗ Schema validation failed:`);
      errors.forEach(err => console.log(`    - ${err}`));
      return false;
    }
    
    console.log(`  ✓ Schema validation passed`);
    console.log(`  Mode: ${config.mode}`);
    
    if (config.mode === 'static') {
      console.log(`  Entry: ${config.entry}`);
      console.log(`  Template: ${config.template}`);
      console.log(`  Title: ${config.title}`);
    } else {
      console.log(`  Components: ${config.components.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return false;
  }
}

// Find all barefoot.config.json files
const examplesDir = path.join(__dirname, EXAMPLES_DIR_PATH);
const examples = fs.readdirSync(examplesDir);

console.log('='.repeat(60));
console.log('BarefootJS Configuration Validation');
console.log('='.repeat(60));

let allValid = true;

for (const example of examples) {
  const configPath = path.join(examplesDir, example, 'barefoot.config.json');
  
  if (fs.existsSync(configPath)) {
    const valid = validateConfig(configPath);
    allValid = allValid && valid;
  }
}

console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('✓ All configurations are valid!');
  console.log('='.repeat(60));
  process.exit(0);
} else {
  console.log('✗ Some configurations are invalid');
  console.log('='.repeat(60));
  process.exit(1);
}
