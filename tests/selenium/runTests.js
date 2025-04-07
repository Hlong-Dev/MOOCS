// tests/selenium/runTests.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Generate a timestamp for the test run
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const reportDir = path.join(__dirname, '..', 'reports', timestamp);

// Create reports directory if it doesn't exist
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

// Define test suites
const testSuites = {
    'login': path.join(__dirname, 'login.test.js'),
    'register': path.join(__dirname, 'register.test.js'),
    'login-po': path.join(__dirname, 'login-po.test.js'),
    'create-room': path.join(__dirname, 'create-room.test.js')
};

// Function to run a test suite
function runTestSuite(suiteName, suitePath) {
    return new Promise((resolve, reject) => {
        console.log(`Running test suite: ${suiteName}`);

        // Define the output file for this test suite
        const outputFile = path.join(reportDir, `${suiteName}-results.txt`);

        // Execute the test command
        const command = `npx mocha "${suitePath}" --timeout 60000`;

        exec(command, (error, stdout, stderr) => {
            // Log output to console
            console.log(stdout);
            if (stderr) console.error(stderr);

            // Save output to file
            fs.writeFileSync(outputFile, `${stdout}\n${stderr}`, 'utf8');

            if (error) {
                console.error(`Test suite ${suiteName} failed with code: ${error.code}`);
                resolve({ suite: suiteName, success: false, error });
            } else {
                console.log(`Test suite ${suiteName} completed successfully`);
                resolve({ suite: suiteName, success: true });
            }
        });
    });
}

// Function to run all test suites
async function runAllTests() {
    console.log('Starting test execution');
    console.log(`Test reports will be saved to: ${reportDir}`);

    const results = [];

    for (const [suiteName, suitePath] of Object.entries(testSuites)) {
        const result = await runTestSuite(suiteName, suitePath);
        results.push(result);
    }

    // Generate summary report
    const summaryFile = path.join(reportDir, 'summary.txt');
    const summary = results.map(r =>
        `${r.suite}: ${r.success ? 'PASSED' : 'FAILED'}`
    ).join('\n');

    fs.writeFileSync(summaryFile, summary, 'utf8');

    console.log('\nTest Execution Summary:');
    console.log(summary);
    console.log(`\nDetailed reports saved to: ${reportDir}`);

    // Return non-zero exit code if any test failed
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
});