// tests/selenium/testSetup.js
const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');

// Base test configuration
class TestSetup {
    constructor() {
        this.driver = null;
        this.baseUrl = 'http://localhost:3000';
    }

    async initialize() {
        this.driver = await new Builder().forBrowser('chrome').build();
        await this.driver.manage().setTimeouts({ implicit: 10000 });
        await this.driver.manage().window().maximize();
    }

    async goToPage(path) {
        await this.driver.get(`${this.baseUrl}${path}`);
    }

    async tearDown() {
        if (this.driver) {
            await this.driver.quit();
        }
    }

    // Helper methods for elements
    async findElement(selector) {
        return await this.driver.findElement(By.css(selector));
    }

    async findElementByXPath(xpath) {
        return await this.driver.findElement(By.xpath(xpath));
    }

    async waitForElement(selector, timeout = 10000) {
        return await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
    }

    async waitForElementByXPath(xpath, timeout = 10000) {
        return await this.driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
    }

    async typeText(selector, text) {
        const element = await this.findElement(selector);
        await element.clear();
        await element.sendKeys(text);
    }

    async clickElement(selector) {
        const element = await this.findElement(selector);
        await element.click();
    }

    async getElementText(selector) {
        const element = await this.findElement(selector);
        return await element.getText();
    }

    async isElementDisplayed(selector) {
        try {
            const element = await this.findElement(selector);
            return await element.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    async waitForUrl(urlPattern, timeout = 10000) {
        await this.driver.wait(async () => {
            const currentUrl = await this.driver.getCurrentUrl();
            return currentUrl.includes(urlPattern);
        }, timeout);
    }
}

module.exports = TestSetup;