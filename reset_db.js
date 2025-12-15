const mongoose = require('mongoose');

// Connect to your database
mongoose.connect('mongodb://localhost:27017/cultural_events')
  .then(async () => {
    console.log('Connected to MongoDB...');
    
    // Drop the entire database
    await mongoose.connection.dropDatabase();
    
    console.log('✅ Database dropped successfully!');
    console.log('You can now restart your server to re-import data with the new schema.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });