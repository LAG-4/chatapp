const { execSync } = require('child_process');
const fs = require('fs');

// Function to check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('Firebase CLI is not installed. Please install it using:');
    console.error('npm install -g firebase-tools');
    return false;
  }
}

// Function to deploy Firestore rules
function deployFirestoreRules() {
  console.log('Deploying Firestore security rules...');
  try {
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    console.log('Firestore rules deployed successfully!');
  } catch (error) {
    console.error('Error deploying Firestore rules:', error.message);
    process.exit(1);
  }
}

// Function to deploy Firestore indexes
function deployFirestoreIndexes() {
  console.log('Deploying Firestore indexes...');
  try {
    execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
    console.log('Firestore indexes deployed successfully!');
  } catch (error) {
    console.error('Error deploying Firestore indexes:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    process.exit(1);
  }

  // Check if firestore.rules file exists
  if (!fs.existsSync('./firestore.rules')) {
    console.error('firestore.rules file not found!');
    process.exit(1);
  }

  // Check if firestore.indexes.json file exists
  if (!fs.existsSync('./firestore.indexes.json')) {
    console.error('firestore.indexes.json file not found!');
    process.exit(1);
  }

  // Deploy Firestore rules and indexes
  deployFirestoreRules();
  deployFirestoreIndexes();

  console.log('All deployments completed successfully!');
}

// Run the main function
main(); 