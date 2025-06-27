// Script to check if the text_blocks_redacted field exists in the document_texts table
const { Client } = require('pg');
require('dotenv').config();

// Get the database connection string from the .env file
const connectionString = process.env.DATABASE_URL;

async function checkDatabaseSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to the database');
    
    // Query the database to get the table schema for document_texts
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'document_texts'
      ORDER BY column_name;
    `);
    
    console.log('\nColumns in the document_texts table:');
    result.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type}`);
    });
    
    // Check if text_blocks_redacted exists
    const hasTextBlocksRedacted = result.rows.some(
      column => column.column_name === 'text_blocks_redacted'
    );
    
    console.log('\nDoes text_blocks_redacted exist in document_texts?', hasTextBlocksRedacted ? 'YES' : 'NO');
    
    // If it exists, let's check its data type
    if (hasTextBlocksRedacted) {
      const textBlocksColumn = result.rows.find(column => column.column_name === 'text_blocks_redacted');
      console.log(`\ntext_blocks_redacted data type: ${textBlocksColumn.data_type}`);
    }
    
  } catch (error) {
    console.error('Error querying database schema:', error);
  } finally {
    await client.end();
    console.log('Disconnected from the database');
  }
}

checkDatabaseSchema();