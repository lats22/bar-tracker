// Script to create admin user
// Run with: node utils/createAdmin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log('\n=== Create Admin User ===\n');

    const username = await question('Username: ');
    const email = await question('Email: ');
    const fullName = await question('Full Name: ');
    const password = await question('Password (min 6 chars): ');

    if (password.length < 6) {
      console.log('Error: Password must be at least 6 characters');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, username, email, full_name, role`,
      [username, email, hashedPassword, fullName]
    );

    console.log('\n✓ Admin user created successfully!');
    console.log('\nUser Details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Username: ${result.rows[0].username}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Full Name: ${result.rows[0].full_name}`);
    console.log(`  Role: ${result.rows[0].role}`);
    console.log('\nYou can now log in with these credentials.\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.code === '23505') {
      console.log('Error: Username or email already exists');
    }
    rl.close();
    process.exit(1);
  }
}

createAdminUser();
