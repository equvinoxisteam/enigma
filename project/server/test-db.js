require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing Local MongoDB connection...');
console.log('Connection String:', process.env.MONGODB_URI);
console.log('Expected Database: mydb');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  console.log('Connected to:', mongoose.connection.db.databaseName);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('Error code:', err.code);
  process.exit(1);
});
