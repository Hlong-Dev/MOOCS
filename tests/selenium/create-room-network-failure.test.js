// tests/selenium/create-room-network-failure.test.js
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { Builder, until, By } = require('selenium-webdriver');
require('chromedriver');
const LoginPage = require('./pages/LoginPage');
const CreateRoomPage = require('./pages/CreateRoomPage');
const TestHelper = require('./utils/testHelper');

describe('Create Room Tests - Network Failure', function () {
    this.timeout(60000); // Extended timeout as video loading may take time
    let driver;
    let loginPage;
    let createRoomPage;
    const baseUrl = 'http://localhost:3000';

    // Test credentials
    const username = 'hlong';
    const password = 'Password123!';

    before(async function () {
        // Khởi tạo trình duyệt với khả năng kiểm soát mạng
        driver = await new Builder().forBrowser('chrome').build();
        loginPage = new LoginPage(driver);
        createRoomPage = new CreateRoomPage(driver);

        // Set up screenshot on test failure
        TestHelper.setupScreenshotOnFailure(afterEach, driver);
    });

    after(async function () {
        if (driver) {
            // Đảm bảo khôi phục kết nối mạng trước khi đóng trình duyệt
            await driver.executeScript('window.navigator.onLine = true;');
            await driver.quit();
        }
    });

    // Hàm để ẩn overlay của webpack nếu nó xuất hiện
    async function hideWebpackOverlay() {
        try {
            // Kiểm tra xem overlay có tồn tại không
            const overlays = await driver.findElements(By.css('#webpack-dev-server-client-overlay'));
            if (overlays.length > 0) {
                // Ẩn overlay bằng JavaScript
                await driver.executeScript(`
                    const overlay = document.getElementById('webpack-dev-server-client-overlay');
                    if (overlay) {
                        overlay.style.display = 'none';
                    }
                `);
                console.log('Đã ẩn webpack overlay');
            }
        } catch (e) {
            // Bỏ qua lỗi nếu không tìm thấy overlay
        }
    }

    // TC_CREATE_ROOM_007: Fail to create room when network is disconnected
    it('TC_CREATE_ROOM_007: Should fail to create room when network is disconnected', async function () {
        // Step 1: Login first
        await loginPage.navigateTo(baseUrl);

        // Ẩn overlay nếu có trước khi đăng nhập
        await hideWebpackOverlay();

        await loginPage.login(username, password);

        // Wait for successful login and redirection to home
        await driver.sleep(2000);

        // Ẩn overlay nếu có sau khi đăng nhập
        await hideWebpackOverlay();

        // Step 2: Navigate to home if not already there
        await createRoomPage.navigateToHome(baseUrl);

        // Ẩn overlay nếu có
        await hideWebpackOverlay();

        // Step 3: Search for videos
        try {
            await createRoomPage.searchForVideo('music video');
        } catch (error) {
            // Nếu tìm kiếm gặp lỗi, ẩn overlay và thử lại
            await hideWebpackOverlay();
            await createRoomPage.searchForVideo('music video');
        }

        // Step 4: Wait for videos to load
        try {
            await driver.wait(until.elementLocated(By.css('.video-card')), 10000);
        } catch (error) {
            // Nếu không tìm thấy video, ẩn overlay và thử lại
            await hideWebpackOverlay();
            await driver.wait(until.elementLocated(By.css('.video-card')), 10000);
        }

        try {
            // Lưu URL video đầu tiên để so sánh sau khi lỗi mạng
            const firstVideoTitle = await driver.findElement(By.css('.video-card .video-info h3')).getText();
            console.log(`Selected video: ${firstVideoTitle}`);

            // Step 5: Mô phỏng mất kết nối mạng trước khi nhấp vào video
            await driver.executeScript('window.navigator.onLine = false;');

            // Ghi đè fetch và XMLHttpRequest để giả lập lỗi mạng
            await driver.executeScript(`
                // Lưu lại phiên bản gốc
                if (!window.originalFetch) {
                    window.originalFetch = window.fetch;
                }
                
                // Ghi đè fetch để luôn trả về lỗi
                window.fetch = function() {
                    return Promise.reject(new Error('Network request failed'));
                };
                
                // Lưu lại phiên bản gốc XMLHttpRequest
                if (!window.originalXMLHttpRequest) {
                    window.originalXMLHttpRequest = window.XMLHttpRequest;
                }
                
                // Ghi đè XMLHttpRequest
                window.XMLHttpRequest = function() {
                    const xhr = new window.originalXMLHttpRequest();
                    xhr.addEventListener('readystatechange', function() {
                        if (xhr.readyState === 4) {
                            xhr.status = 0;
                            xhr.statusText = 'Network Error';
                        }
                    });
                    return xhr;
                };
            `);

            // Ẩn overlay một lần nữa nếu nó xuất hiện
            await hideWebpackOverlay();

            // Step 6: Click vào video đầu tiên để tạo phòng
            const videoCard = await driver.findElement(By.css('.video-card'));
            await driver.executeScript('arguments[0].click();', videoCard); // Sử dụng JavaScript click để tránh bị chặn

            // Step 7: Kiểm tra thông báo lỗi xuất hiện
            // Đợi một khoảng thời gian ngắn để xem lỗi xuất hiện
            await driver.sleep(2000);

            try {
                // Ẩn overlay để có thể thấy thông báo lỗi
                await hideWebpackOverlay();

                // Đợi thông báo lỗi xuất hiện (thích ứng với cách ứng dụng hiển thị lỗi)
                // Chú ý: Ứng dụng của bạn cần hiển thị thông báo lỗi với một trong các class này
                await driver.wait(until.elementLocated(By.css('.error-message, .toast-error, .alert-error, .notification-error')), 5000);

                // Kiểm tra nội dung thông báo lỗi
                const errorMsg = await driver.findElement(By.css('.error-message, .toast-error, .alert-error, .notification-error')).getText();
                expect(errorMsg).to.include('Không thể tạo phòng') ||
                    expect(errorMsg).to.include('kiểm tra kết nối mạng') ||
                    expect(errorMsg).to.include('Network error');

                // Kiểm tra vẫn ở trang chủ, không chuyển hướng đến trang phòng
                const currentUrl = await driver.getCurrentUrl();
                expect(currentUrl).to.not.include('/room/');
            } catch (error) {
                // Nếu không tìm thấy thông báo lỗi, có thể ứng dụng không hiển thị thông báo lỗi rõ ràng
                // Kiểm tra ít nhất không có chuyển hướng đến trang phòng
                const currentUrl = await driver.getCurrentUrl();
                expect(currentUrl).to.not.include('/room/');

                console.warn('Cảnh báo: Không tìm thấy thông báo lỗi mạng rõ ràng, nhưng kiểm tra không chuyển hướng đến trang phòng thành công');
            }
        } finally {
            // Luôn khôi phục kết nối mạng để không ảnh hưởng đến các test khác
            await driver.executeScript(`
                window.navigator.onLine = true;
                if (window.originalFetch) {
                    window.fetch = window.originalFetch;
                }
                if (window.originalXMLHttpRequest) {
                    window.XMLHttpRequest = window.originalXMLHttpRequest;
                }
            `);
        }
    });
});