// tests/selenium/pages/RegisterPage.js
const { By, until } = require('selenium-webdriver');

class RegisterPage {
    constructor(driver) {
        this.driver = driver;

        // Element selectors
        this.usernameInput = 'input[placeholder="Username"]';
        this.passwordInput = 'input[placeholder="Password"]';
        this.emailInput = 'input[placeholder="Email"]';
        this.phoneInput = 'input[placeholder="Phone"]';
        this.registerButton = '.login-button';
        this.backButton = '.back-button';
        this.errorMessage = 'p[style*="color: red"]';
        this.successMessage = 'p[style*="color: green"]';
        this.logo = '.login-logo';
    }

    async navigateTo(baseUrl) {
        await this.driver.get(`${baseUrl}/register`);
        await this.driver.wait(until.elementLocated(By.css(this.logo)), 10000);
    }

    async register(username, password, email, phone) {
        await this.driver.findElement(By.css(this.usernameInput)).sendKeys(username);
        await this.driver.findElement(By.css(this.passwordInput)).sendKeys(password);
        await this.driver.findElement(By.css(this.emailInput)).sendKeys(email);
        await this.driver.findElement(By.css(this.phoneInput)).sendKeys(phone);
        await this.driver.findElement(By.css(this.registerButton)).click();
    }

    async clickBackButton() {
        await this.driver.findElement(By.css(this.backButton)).click();
    }

    async getErrorMessage() {
        try {
            const errorElement = await this.driver.findElement(By.css(this.errorMessage));
            return await errorElement.getText();
        } catch (e) {
            return null;
        }
    }

    async getSuccessMessage() {
        try {
            const successElement = await this.driver.findElement(By.css(this.successMessage));
            return await successElement.getText();
        } catch (e) {
            return null;
        }
    }

    async isErrorDisplayed() {
        try {
            const errorElement = await this.driver.findElement(By.css(this.errorMessage));
            return await errorElement.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async isSuccessDisplayed() {
        try {
            const successElement = await this.driver.findElement(By.css(this.successMessage));
            return await successElement.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }
}

module.exports = RegisterPage;