/** 
I declare that the lab work here submitted is original
except for source material explicitly acknowledged, and that the same or closely related material has not been
previously submitted for another course.
I also acknowledge that I am aware of University policy and
regulations on honesty in academic work, and of the disciplinary
guidelines and procedures applicable to breaches of such
policy and regulations, as contained in the website. University Guideline on Academic Honesty:
https://www.cuhk.edu.hk/policy/academichonesty/

Group 12 
Group member: 
POON Shing Tsan				1155193858 
WONG San Ki Sunny			1155193541 
KUMARBEK UULU Chyngyz		1155190408 
LAM Ka Shing				1155194077 
YAM Tin Lam Lucas			1155234981 
Class/Section : CSCI2720
Date : 18-12-2025 
**/

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Cultural Events App Installation...');
console.log('==============================================');

// Check required files
const requiredFiles = [
  'package.json',
  'server.js',
  'public/index.html',
  'public/css/style.css',
  'public/js/app.js',
  'README.md',
  'PROJECT_REPORT.md',
  'README_SIMPLIFIED.md'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'express',
    'mongoose',
    'bcryptjs',
    'express-session',
    'cors',
    'xml2js',
    'axios'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesExist = false;
}

// Check node_modules
console.log('\n📚 Checking node_modules...');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules directory exists');
  
  // Check if main dependencies are installed
  const mainModules = ['express', 'mongoose', 'bcryptjs'];
  mainModules.forEach(module => {
    const modulePath = path.join('node_modules', module);
    if (fs.existsSync(modulePath)) {
      console.log(`✅ ${module} installed`);
    } else {
      console.log(`❌ ${module} not installed`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ node_modules directory not found - run npm install');
  allFilesExist = false;
}

// Check environment file
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  .env file not found - using default configuration');
}

// Check XML data files
console.log('\n📊 Checking XML data files...');
const xmlFiles = [
  'venues.xml',
  'events.xml',
  'eventDates.xml',
  'venues.xml',
  'holiday.xml'
];

xmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} not found - data import may not work`);
  }
});

// Summary
console.log('\n📋 Installation Summary:');
console.log('========================');

if (allFilesExist) {
  console.log('✅ All required files and dependencies are present!');
  console.log('\n🚀 You can now start the application with:');
  console.log('   npm start');
  console.log('   or');
  console.log('   ./start.sh');
  console.log('\n🌐 The application will be available at: http://localhost:3000');
  console.log('\n👤 Demo Accounts:');
  console.log('   User: user / user123');
  console.log('   Admin: admin / admin123');
} else {
  console.log('❌ Some files or dependencies are missing!');
  console.log('\n🔧 To fix the installation:');
  console.log('   1. Run: npm install');
  console.log('   2. Ensure all XML data files are in the project root');
  console.log('   3. Make sure MongoDB is running');
  console.log('   4. Run: node init-db.js to initialize the database');
}

console.log('\n📚 For detailed instructions, see README.md');