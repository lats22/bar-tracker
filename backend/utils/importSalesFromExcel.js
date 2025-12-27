const XLSX = require('xlsx');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Import sales data from Excel file
 * Excel columns:
 *   A: Date
 *   B: Cash amount
 *   C: Transfer amount
 *   D: Lady name (Ice, Kiki, Peachy)
 *   E: Quantity of drinks
 */
async function importSalesFromExcel(filePath, options = {}) {
  const {
    userId = null,            // User ID who is importing
    skipLadyDrinks = false,   // Skip lady drinks import
    dryRun = false            // Test run without saving
  } = options;

  console.log(`\n📊 Starting Excel import from: ${filePath}`);
  console.log(`Options:`, { skipLadyDrinks, dryRun });

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read Excel file
  console.log('\n📖 Reading Excel file...');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  console.log(`✓ Found ${data.length} rows in sheet: ${sheetName}`);

  // Get all ladies from database for lookup
  const ladiesResult = await pool.query(
    'SELECT id, name FROM ladies WHERE is_active = true'
  );
  const ladiesMap = {};
  ladiesResult.rows.forEach(lady => {
    ladiesMap[lady.name.toLowerCase()] = lady.id;
  });
  console.log(`✓ Loaded ${ladiesResult.rows.length} ladies:`, Object.keys(ladiesMap).join(', '));

  // Get default user ID if not provided
  if (!userId) {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    options.userId = userResult.rows[0]?.id;
  }

  const client = await pool.connect();
  const results = {
    success: 0,
    errors: 0,
    skipped: 0,
    salesCreated: 0,
    ladyDrinksCreated: 0,
    details: []
  };

  try {
    if (!dryRun) {
      await client.query('BEGIN');
    }

    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        results.skipped++;
        continue;
      }

      try {
        const dateStr = row[0]?.toString().trim();
        const cashAmount = parseFloat(row[1]) || 0;
        const transferAmount = parseFloat(row[2]) || 0;
        const ladyNameFromExcel = row[3]?.toString().trim() || '';
        const drinkQuantity = parseInt(row[4]) || 0;

        // Parse date (handle various formats)
        let date = null;
        if (dateStr) {
          // Try parsing Excel serial date
          if (!isNaN(dateStr) && dateStr.length <= 5) {
            const excelDate = XLSX.SSF.parse_date_code(parseFloat(dateStr));
            date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
          } else {
            // Try parsing as regular date string
            date = new Date(dateStr);
          }

          // Validate date
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${dateStr}`);
          }

          // Format date as YYYY-MM-DD
          date = date.toISOString().split('T')[0];
        } else {
          throw new Error('Missing date');
        }

        // Look up lady ID from name
        let ladyId = null;
        let ladyName = null;
        if (ladyNameFromExcel) {
          ladyId = ladiesMap[ladyNameFromExcel.toLowerCase()];
          if (!ladyId && drinkQuantity > 0) {
            throw new Error(`Lady not found: "${ladyNameFromExcel}". Available: ${Object.keys(ladiesMap).join(', ')}`);
          }
          ladyName = ladyNameFromExcel;
        }

        const rowResults = {
          row: i + 1,
          date,
          cash: cashAmount,
          transfer: transferAmount,
          ladyName: ladyName,
          quantity: drinkQuantity,
          salesIds: [],
          ladyDrinkId: null,
          errors: []
        };

        // Create cash sale
        if (cashAmount > 0) {
          if (!dryRun) {
            const result = await client.query(
              `INSERT INTO sales (date, amount, payment_method, category, created_by)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [date, cashAmount, 'cash', 'drinks', options.userId]
            );
            rowResults.salesIds.push({ type: 'cash', id: result.rows[0].id });
            results.salesCreated++;
          } else {
            console.log(`  [DRY RUN] Would create cash sale: ${date} - ฿${cashAmount}`);
          }
        }

        // Create transfer sale
        if (transferAmount > 0) {
          if (!dryRun) {
            const result = await client.query(
              `INSERT INTO sales (date, amount, payment_method, category, created_by)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [date, transferAmount, 'transfer', 'drinks', options.userId]
            );
            rowResults.salesIds.push({ type: 'transfer', id: result.rows[0].id });
            results.salesCreated++;
          } else {
            console.log(`  [DRY RUN] Would create transfer sale: ${date} - ฿${transferAmount}`);
          }
        }

        // Create lady drinks quantity record
        if (drinkQuantity > 0 && ladyId && !skipLadyDrinks) {
          if (!dryRun) {
            const result = await client.query(
              `INSERT INTO lady_drinks (date, lady_id, drink_count, created_by)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (date, lady_id)
               DO UPDATE SET drink_count = lady_drinks.drink_count + $3
               RETURNING id`,
              [date, ladyId, drinkQuantity, options.userId]
            );
            rowResults.ladyDrinkId = result.rows[0].id;
            results.ladyDrinksCreated++;
          } else {
            console.log(`  [DRY RUN] Would create lady drinks: ${date} - ${drinkQuantity} drinks for ${ladyName}`);
          }
        } else if (drinkQuantity > 0 && !ladyId) {
          console.log(`  ⚠️  Row ${i + 1}: Skipping ${drinkQuantity} drinks - no lady name provided`);
        }

        results.success++;
        results.details.push(rowResults);

        // Log progress every 10 rows
        if (i % 10 === 0) {
          console.log(`  Processed ${i} rows...`);
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          error: error.message
        });
        console.error(`  ❌ Error in row ${i + 1}: ${error.message}`);
      }
    }

    if (!dryRun) {
      await client.query('COMMIT');
      console.log('\n✓ Transaction committed');
    } else {
      console.log('\n[DRY RUN] No changes made to database');
    }

  } catch (error) {
    if (!dryRun) {
      await client.query('ROLLBACK');
      console.log('\n❌ Transaction rolled back');
    }
    throw error;
  } finally {
    client.release();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total rows processed:    ${data.length - 1}`);
  console.log(`Successful imports:      ${results.success}`);
  console.log(`Errors:                  ${results.errors}`);
  console.log(`Skipped (empty rows):    ${results.skipped}`);
  console.log(`Sales records created:   ${results.salesCreated}`);
  console.log(`Lady drink records:      ${results.ladyDrinksCreated}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node importSalesFromExcel.js <excel-file> [options]

Excel Format:
  Column A: Date
  Column B: Cash amount
  Column C: Transfer amount
  Column D: Lady name (Ice, Kiki, or Peachy)
  Column E: Quantity of drinks

Options:
  --skip-lady-drinks  Skip importing lady drinks quantities
  --dry-run           Test run without saving to database

Example:
  node importSalesFromExcel.js sales_nov_dec.xlsx
  node importSalesFromExcel.js sales.xlsx --dry-run
  node importSalesFromExcel.js sales.xlsx --skip-lady-drinks
    `);
    process.exit(1);
  }

  const filePath = args[0];
  const options = {
    skipLadyDrinks: args.includes('--skip-lady-drinks'),
    dryRun: args.includes('--dry-run')
  };

  importSalesFromExcel(filePath, options)
    .then(results => {
      if (results.errors > 0) {
        console.log('\n⚠️  Import completed with errors. Check details above.');
        process.exit(1);
      } else {
        console.log('✅ Import completed successfully!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = importSalesFromExcel;
