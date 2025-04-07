// tests/selenium/pages/CreateRoomPage.js
const { By, until } = require('selenium-webdriver');

class CreateRoomPage {
    constructor(driver) {
        this.driver = driver;
        // Element selectors for home page
        this.searchInput = 'input[placeholder="search video, series, or film..."]';
        this.youtubeResultsContainer = '.youtube-results-row';
        this.videoCards = '.video-card';
        this.loadingBar = '.loading-bar-container';
        this.roomContainer = '.glass-room-container';
    }

    async navigateToHome(baseUrl) {
        await this.driver.get(`${baseUrl}/`);
        await this.driver.wait(until.elementLocated(By.css(this.searchInput)), 10000);
    }

    async searchForVideo(searchTerm) {
        const searchElement = await this.driver.findElement(By.css(this.searchInput));
        await searchElement.clear();
        await searchElement.sendKeys(searchTerm);

        // Wait for loading bar to appear
        try {
            await this.driver.wait(until.elementLocated(By.css(this.loadingBar)), 5000);
        } catch (e) {
            // Loading might be too fast, continue
        }

        // Wait for loading to complete (either loading bar disappears or results appear)
        try {
            await this.driver.wait(async () => {
                const loadingVisible = await this.isLoadingBarVisible();
                if (!loadingVisible) {
                    return await this.areSearchResultsVisible();
                }
                return false;
            }, 15000);
        } catch (e) {
            console.log("Timeout waiting for search results", e);
            throw new Error("Search results did not load in time");
        }
    }

    async isLoadingBarVisible() {
        try {
            const loadingBar = await this.driver.findElement(By.css(this.loadingBar));
            return await loadingBar.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async areSearchResultsVisible() {
        try {
            const results = await this.driver.findElement(By.css(this.youtubeResultsContainer));
            return await results.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async clickOnFirstVideo() {
        await this.driver.wait(until.elementLocated(By.css(this.videoCards)), 10000);
        const videos = await this.driver.findElements(By.css(this.videoCards));
        if (videos.length === 0) {
            throw new Error("No video results found");
        }

        // Click on the first video
        await videos[0].click();

        // Don't wait for specific URL - let the test handle that
        // Just wait for navigation to complete
        await this.driver.sleep(2000);
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    async isVideoPlayerVisible() {
        try {
            // Wait for the iframe to be present
            await this.driver.wait(until.elementLocated(By.css('iframe')), 10000);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = CreateRoomPage;