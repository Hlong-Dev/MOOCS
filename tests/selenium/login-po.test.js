// tests/selenium/login-po.test.js
const { describe, it, before, after, beforeEach } = require('mocha');
const { expect } = require('chai');
const { Builder } = require('selenium-webdriver');
require('chromedriver');
const LoginPage = require('./pages/LoginPage');

describe('Login Page Tests (Page Object Pattern)', function () {
    this.timeout(30000);
    let driver;
    let loginPage;
    const baseUrl = 'http://localhost:3000';

    before(async function () {
        driver = await new Builder().forBrowser('chrome').build();
        loginPage = new LoginPage(driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    beforeEach(async function () {
        // Navigate to login page before each test
        await loginPage.navigateTo(baseUrl);
    });

    // TC_LOGIN_001: Successful login with valid credentials
    it('TC_LOGIN_001: Should login successfully with valid credentials', async function () {
        await loginPage.login('hlong', 'Password123!');

        // Wait for redirect to home page
        await driver.sleep(2000); // Allow time for redirect

        // Verify user is logged in
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.equal(baseUrl + '/');
    });

    // TC_LOGIN_002: Failed login with invalid email format
    it('TC_LOGIN_002: Should show error for invalid username format', async function () {
        await loginPage.login('usercinematecom', 'Password123');

        // Check for error message
        const errorDisplayed = await loginPage.isErrorDisplayed();
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_003: Failed login with unregistered email
    it('TC_LOGIN_003: Should show error for unregistered username', async function () {
        await loginPage.login('nonexistent@cinemate.com', 'Password123');

        // Check for error message
        const errorDisplayed = await loginPage.isErrorDisplayed();
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_004: Failed login with incorrect password
    it('TC_LOGIN_004: Should show error for incorrect password', async function () {
        await loginPage.login('hlong', 'WrongPassword123');

        // Check for error message
        const errorDisplayed = await loginPage.isErrorDisplayed();
        expect(errorDisplayed).to.be.true;
    });

    // TC_LOGIN_005: Failed login with empty username
    it('TC_LOGIN_005: Should validate empty username field', async function () {
        await loginPage.login('', 'Password123');

        // Since the input has "required" attribute, we can check if form submission was prevented
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });

    // TC_LOGIN_006: Failed login with empty password
    it('TC_LOGIN_006: Should validate empty password field', async function () {
        await loginPage.login('Password123!', '');

        // Since the input has "required" attribute, we can check if form submission was prevented
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });

    // Additional test for back button functionality
    it('Should navigate back to home page when clicking back button', async function () {
        await loginPage.clickBackButton();

        // Verify redirection
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.equal(baseUrl + '/');
    });
});