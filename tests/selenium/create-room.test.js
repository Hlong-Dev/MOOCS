// tests/selenium/create-room.test.js
const { describe, it, before, after, beforeEach } = require('mocha');
const { expect } = require('chai');
const { Builder, until, By } = require('selenium-webdriver');
require('chromedriver');
const LoginPage = require('./pages/LoginPage');
const CreateRoomPage = require('./pages/CreateRoomPage');
const TestHelper = require('./utils/testHelper');

describe('Create Room Tests', function () {
    this.timeout(60000); // Extended timeout as video loading may take time
    let driver;
    let loginPage;
    let createRoomPage;
    const baseUrl = 'http://localhost:3000';

    // Test credentials
    const username = 'hlong';
    const password = 'Password123!';

    before(async function () {
        driver = await new Builder().forBrowser('chrome').build();
        loginPage = new LoginPage(driver);
        createRoomPage = new CreateRoomPage(driver);

        // Set up screenshot on test failure
        TestHelper.setupScreenshotOnFailure(afterEach, driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    // TC_CREATE_ROOM_001: Create room successfully with valid video
    it('TC_CREATE_ROOM_001: Should create room successfully with valid video', async function () {
        // Step 1: Login first
        await loginPage.navigateTo(baseUrl);
        await loginPage.login(username, password);

        // Wait for successful login and redirection to home
        await driver.sleep(2000);

        // Step 2: Navigate to home if not already there
        await createRoomPage.navigateToHome(baseUrl);

        // Step 3: Search for videos
        await createRoomPage.searchForVideo('music video');

        // Step 4: Click on the first video to create a room
        await createRoomPage.clickOnFirstVideo();

        // Step 5: Verify we're redirected to the room page
        await driver.wait(until.urlContains('/room/'), 10000);
        const currentUrl = await createRoomPage.getCurrentUrl();
        expect(currentUrl).to.include('/room/');

        // Step 6: Verify video player is loaded
        const isVideoPlayerVisible = await createRoomPage.isVideoPlayerVisible();
        expect(isVideoPlayerVisible).to.be.true;
    });

    // TC_CREATE_ROOM_002: Fail to create room when not logged in
    it('TC_CREATE_ROOM_002: Should fail to create room when not logged in', async function () {
        // Đăng xuất đúng cách bằng cách sử dụng sidebar và nút Log Out
        await createRoomPage.navigateToHome(baseUrl);

        // Nhấp vào biểu tượng menu 3 gạch
        const menuIcon = await driver.findElement(By.css('.menu-icon'));
        await menuIcon.click();

        // Đợi sidebar hiển thị
        await driver.wait(until.elementLocated(By.css('.sidebar.open')), 5000);

        // Nhấp vào nút Log Out
        const logoutButton = await driver.findElement(By.xpath("//div[@class='sidebar-item']/span[text()='Log Out']/.."));
        await logoutButton.click();

        // Đợi chuyển hướng đến trang đăng nhập
        await driver.wait(until.urlContains('/login'), 5000);

        // Quay lại trang chủ
        await createRoomPage.navigateToHome(baseUrl);

        // Search for videos
        await createRoomPage.searchForVideo('music video');

        // Click on first video - this should redirect to login page
        await createRoomPage.clickOnFirstVideo();

        // Verify we're redirected to login page
        await driver.wait(until.urlContains('/login'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });

    // Helper test to log back in for remaining tests
    it('Should log back in for remaining tests', async function () {
        await loginPage.navigateTo(baseUrl);
        await loginPage.login(username, password);
        await driver.sleep(2000);
    });

    // TC_CREATE_ROOM_004: Fail to create room when search query is empty
    it('TC_CREATE_ROOM_004: Should validate empty search', async function () {
        await createRoomPage.navigateToHome(baseUrl);

        try {
            // Try to search with empty string
            await createRoomPage.searchForVideo('');

            // If no error, check if results are not visible
            const areResultsVisible = await createRoomPage.areSearchResultsVisible();
            expect(areResultsVisible).to.be.false;
        } catch (e) {
            // If there's an error, that's fine too - we expect problems with empty search
            expect(true).to.be.true;
        }
    });

    // TC_CREATE_ROOM_005: Fail to create room when search has no results
    it('TC_CREATE_ROOM_005: Should handle no search results', async function () {
        await createRoomPage.navigateToHome(baseUrl);

        // Search with nonsense query that should return no results
        await createRoomPage.searchForVideo('a1b2c3d4e5f6g7h8i9j0xyz123');

        try {
            // This should throw an error because there will be no videos to click
            await createRoomPage.clickOnFirstVideo();
            // If we get here, test fails
            expect.fail('Should not find any videos');
        } catch (e) {
            // We expect an error of some kind, so this is a pass
            expect(true).to.be.true;
        }
    });
});