/**
 * Prettier configuration for Tribe mobile application
 * This configuration ensures consistent code formatting across the React Native TypeScript codebase
 * 
 * @see https://prettier.io/docs/en/options.html for all available options
 */
module.exports = {
  // Line length that Prettier will wrap on
  printWidth: 100,
  
  // Number of spaces per indentation level
  tabWidth: 2,
  
  // Use spaces instead of tabs
  useTabs: false,
  
  // Add semicolons at the end of statements
  semi: true,
  
  // Use single quotes instead of double quotes
  singleQuote: true,
  
  // Only add quotes around object properties where required
  quoteProps: 'as-needed',
  
  // Use double quotes in JSX
  jsxSingleQuote: false,
  
  // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',
  
  // Print spaces between brackets in object literals
  bracketSpacing: true,
  
  // Put the closing bracket of JSX elements on a new line
  bracketSameLine: false,
  
  // Always include parentheses around a sole arrow function parameter
  arrowParens: 'always',
  
  // Use line feed (\n) as the line ending
  endOfLine: 'lf',
};