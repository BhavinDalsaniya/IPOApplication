const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('ipo-data.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    console.log('Sheet Name:', sheetName);
    console.log('Total Rows:', data.length);
    console.log('\nColumns:', Object.keys(data[0] || {}));
    console.log('\nFirst 5 rows:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));

    // Save as JSON for reference
    fs.writeFileSync('ipo-data.json', JSON.stringify(data, null, 2));
    console.log('\n✓ Data saved to ipo-data.json');
} catch (error) {
    console.error('Error:', error.message);
    console.log('Installing xlsx package...');
}
