// tests/selenium/pages/LoginPage.js
const { By, until } = require('selenium-webdriver');

class LoginPage {
    constructor(driver) {
        this.driver = driver;

        // Element selectors
        this.usernameInput = 'input[placeholder="Username"]';
        this.passwordInput = 'input[placeholder="Password"]';
        this.loginButton = '.login-button';
        this.backButton = '.back-button';
        this.errorMessage = 'p[style*="color: red"]';
        this.logo = '.login-logo';
    }

    async navigateTo(baseUrl) {
        await this.driver.get(`${baseUrl}/login`);
        await this.driver.wait(until.elementLocated(By.css(this.logo)), 10000);
    }

    async login(username, password) {
        const usernameElement = await this.driver.findElement(By.css(this.usernameInput));
        const passwordElement = await this.driver.findElement(By.css(this.passwordInput));

        await usernameElement.clear();
        await usernameElement.sendKeys(username);

        await passwordElement.clear();
        await passwordElement.sendKeys(password);

        await this.driver.findElement(By.css(this.loginButton)).click();
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

    async isErrorDisplayed() {
        try {
            const errorElement = await this.driver.findElement(By.css(this.errorMessage));
            return await errorElement.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }
}

module.exports = LoginPage;