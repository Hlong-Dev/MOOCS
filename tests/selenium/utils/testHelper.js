// tests/selenium/utils/testHelper.js
const fs = require('fs');
const path = require('path');

class TestHelper {
    /**
     * Take a screenshot and save it to the screenshots directory
     * @param {WebDriver} driver - Selenium WebDriver instance
     * @param {string} testName - Name of the test case
     */
    static async takeScreenshot(driver, testName) {
        try {
            // Create screenshots directory if it doesn't exist
            const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            // Take screenshot
            const screenshot = await driver.takeScreenshot();
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const fileName = `${testName}_${timestamp}.png`;
            const filePath = path.join(screenshotsDir, fileName);
            // Save screenshot
            fs.writeFileSync(filePath, screenshot, 'base64');
            console.log(`Screenshot saved: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            return null;
        }
    }

    /**
     * Add screenshot capability to Mocha's afterEach hook
     * @param {Function} mochaHook - Mocha's afterEach function
     * @param {WebDriver} driver - Selenium WebDriver instance
     */
    static setupScreenshotOnFailure(mochaHook, driver) {
        mochaHook(function () {
            const test = this.currentTest;
            if (test.state === 'failed') {
                return TestHelper.takeScreenshot(driver, test.title);
            }
        });
    }

    /**
     * Hide webpack-dev-server-client-overlay if present
     * @param {WebDriver} driver - Selenium WebDriver instance
     */
    static async hideWebpackOverlay(driver) {
        try {
            await driver.executeScript(`
                const overlay = document.getElementById('webpack-dev-server-client-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            `);
        } catch (e) {
            // Ignore errors - overlay might not exist
        }
    }

    /**
     * Create test asset directory and sample image if they don't exist
     */
    static createTestAssets() {
        const assetsDir = path.join(__dirname, '..', '..', 'test-assets');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const imagePath = path.join(assetsDir, 'test-image.jpg');
        if (!fs.existsSync(imagePath)) {
            // Create a simple 1x1 pixel JPEG
            const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
            const buffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(imagePath, buffer);
            console.log(`Created test image at ${imagePath}`);
        }

        return assetsDir;
    }
}

// Create test assets when the module is loaded
TestHelper.createTestAssets();

module.exports = TestHelper;