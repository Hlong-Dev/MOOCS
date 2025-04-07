// tests/selenium/login.test.js
const { describe, it, before, after, beforeEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('./testSetup');

describe('Login Page Tests', function () {
    this.timeout(30000); // Set timeout for all tests
    let test;

    before(async function () {
        test = new TestSetup();
        await test.initialize();
    });

    after(async function () {
        await test.tearDown();
    });

    beforeEach(async function () {
        // Navigate to login page before each test
        await test.goToPage('/login');
    });

    // TC_LOGIN_001: Successful login with valid credentials
    it('TC_LOGIN_001: Should login successfully with valid credentials', async function () {
        await test.typeText('input[placeholder="Username"]', 'hlong');
        await test.typeText('input[placeholder="Password"]', 'Password123!');
        await test.clickElement('.login-button');

        // Wait for redirect to home page
        await test.waitForUrl('/', 10000);

        // Verify user is logged in (this depends on your UI, adjust as needed)
        const currentUrl = await test.driver.getCurrentUrl();
        expect(currentUrl).to.equal(test.baseUrl + '/');
    });

    // TC_LOGIN_002: Failed login with invalid email format
    it('TC_LOGIN_002: Should show error for invalid username format', async function () {
        await test.typeText('input[placeholder="Username"]', 'usercinematecom');
        await test.typeText('input[placeholder="Password"]', 'Password123');
        await test.clickElement('.login-button');

        // Check for error message
        const errorDisplayed = await test.isElementDisplayed('p[style*="color: red"]');
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_003: Failed login with unregistered email
    it('TC_LOGIN_003: Should show error for unregistered username', async function () {
        await test.typeText('input[placeholder="Username"]', 'nonexistent@cinemate.com');
        await test.typeText('input[placeholder="Password"]', 'Password123');
        await test.clickElement('.login-button');

        // Check for error message
        const errorDisplayed = await test.isElementDisplayed('p[style*="color: red"]');
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_004: Failed login with incorrect password
    it('TC_LOGIN_004: Should show error for incorrect password', async function () {
        await test.typeText('input[placeholder="Username"]', 'user@cinemate.com');
        await test.typeText('input[placeholder="Password"]', 'WrongPassword123');
        await test.clickElement('.login-button');

        // Check for error message
        const errorDisplayed = await test.isElementDisplayed('p[style*="color: red"]');
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_005: Failed login with empty username
    it('TC_LOGIN_005: Should validate empty username field', async function () {
        await test.typeText('input[placeholder="Password"]', 'Password123');
        await test.clickElement('.login-button');

        // Since the input has "required" attribute, we can check if form submission was prevented
        const currentUrl = await test.driver.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });

    // TC_LOGIN_006: Failed login with empty password
    it('TC_LOGIN_006: Should validate empty password field', async function () {
        await test.typeText('input[placeholder="Username"]', 'user@cinemate.com');
        await test.clickElement('.login-button');

        // Since the input has "required" attribute, we can check if form submission was prevented
        const currentUrl = await test.driver.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });

    // TC_LOGIN_007: Failed login with locked account would require specific setup
    // in your backend, so we'll skip it for now

    // Additional test for back button functionality
    it('Should navigate back to home page when clicking back button', async function () {
        await test.clickElement('.back-button');

        // Verify redirection
        const currentUrl = await test.driver.getCurrentUrl();
        expect(currentUrl).to.equal(test.baseUrl + '/');
    });
});