// Simple test to check if the build works
import { parser } from './dist/es/index.js';

console.log('Parser loaded successfully');
console.log('Parser:', typeof parser);

// Try a simple parse
try {
  const tree = parser.parse('# Hello');
  console.log('Parse successful');
  console.log('Tree:', tree.toString());
} catch (error) {
  console.error('Parse failed:', error);
}