require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Searching for user: aniketh0701@gmail.com');
    const user = await User.findOne({ email: 'aniketh0701@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(0);
    }
    
    console.log('\n📋 User Details:');
    console.log('─'.repeat(50));
    console.log(`Name: ${user.fullName}`);
    console.log(`Email: ${user.email}`);
    console.log(`User Type: ${user.userType}`);
    console.log(`Email Verified: ${user.isEmailVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`Status: ${user.status}`);
    console.log(`Manufacturer Status: ${user.manufacturerStatus || 'N/A'}`);
    console.log(`Created: ${user.createdAt}`);
    console.log('─'.repeat(50));
    
    if (!user.isEmailVerified) {
      console.log('\n⚠️  User email is NOT verified!');
      console.log('Would you like to manually verify this user? (y/n)');
      
      // For now, just show info, don't auto-update
      console.log('\nTo manually verify, run:');
      console.log('node scripts/verify-user.js aniketh0701@gmail.com');
    } else {
      console.log('\n✅ User email is verified - login should work!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkUser();
