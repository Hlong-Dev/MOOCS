// tests/selenium/config.js
module.exports = {
    baseUrl: 'http://localhost:3000',

    // Test data
    testUsers: {
        valid: {
            username: 'user@cinemate.com',
            password: 'Password123'
        },
        invalid: {
            username: 'nonexistent@cinemate.com',
            password: 'WrongPassword123'
        }
    },

    // Test timeouts
    timeouts: {
        implicit: 10000,
        pageLoad: 30000,
        script: 30000
    },

    // Browser configurations
    browser: {
        name: 'chrome',
        options: {
            args: [
                // Uncomment the following line to run tests in headless mode
                // '--headless',
                '--window-size=1920,1080',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ]
        }
    }
};