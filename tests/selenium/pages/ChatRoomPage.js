// tests/selenium/pages/ChatRoomPage.js
const { By, until, Key } = require('selenium-webdriver');
const path = require('path');

class ChatRoomPage {
    constructor(driver) {
        this.driver = driver;

        // Element selectors for chat room
        this.chatInputField = '.chat-input';
        this.chatMessagesContainer = '.chat-messages';
        this.chatMessageItems = '.message-item';
        this.sentMessages = '.message-item.sent';
        this.imageUploadInput = '#imageUpload';
        this.imagePreviewContainer = '.image-preview-container';
        this.removeImageButton = '.image-preview-container button';
        this.replyButtons = '.message-hover-reply';
        this.replyPreviewContainer = '.reply-preview-container';
        this.closeReplyButton = '.close-reply-btn';
        this.messageSender = '.message-sender';
        this.messageText = '.message-text';
        this.messageImage = '.message-image img';
        this.replyContent = '.reply-content';
    }

    async navigateToRoom(baseUrl, roomId) {
        await this.driver.get(`${baseUrl}/room/${roomId}`);
        // Wait for chat input to be available
        await this.driver.wait(until.elementLocated(By.css(this.chatInputField)), 20000);
    }

    async sendTextMessage(text) {
        const inputField = await this.driver.findElement(By.css(this.chatInputField));
        await inputField.clear();
        await inputField.sendKeys(text);
        await inputField.sendKeys(Key.ENTER);

        // Wait a moment for the message to be sent
        await this.driver.sleep(1000);

        // Verify the message appears in the chat
        await this.waitForMessageWithText(text);
    }

    async uploadImage(filePath) {
        // Find the file input element
        const fileInput = await this.driver.findElement(By.css(this.imageUploadInput));

        // Set the file path
        const absolutePath = path.resolve(filePath);
        await fileInput.sendKeys(absolutePath);

        // Wait for the image preview to appear
        await this.driver.wait(until.elementLocated(By.css(this.imagePreviewContainer)), 10000);
    }

    async sendImageMessage(filePath, text = '') {
        // Upload the image
        await this.uploadImage(filePath);

        // Enter optional text
        if (text) {
            const inputField = await this.driver.findElement(By.css(this.chatInputField));
            await inputField.clear();
            await inputField.sendKeys(text);
        }

        // Send the message
        const inputField = await this.driver.findElement(By.css(this.chatInputField));
        await inputField.sendKeys(Key.ENTER);

        // Wait a moment for the message to be sent
        await this.driver.sleep(1000);

        // If there was text, verify it appears
        if (text) {
            await this.waitForMessageWithText(text);
        }

        // Verify the image appears
        await this.driver.wait(until.elementLocated(By.css(this.messageImage)), 10000);
    }

    async replyToMessage(messageIndex, replyText) {
        // Get all message hover reply buttons
        const replyButtons = await this.driver.findElements(By.css(this.replyButtons));

        if (messageIndex >= replyButtons.length) {
            throw new Error(`Cannot reply to message at index ${messageIndex}. Only ${replyButtons.length} messages available.`);
        }

        // Click the reply button for the specified message
        const replyButton = replyButtons[messageIndex];
        await this.driver.executeScript("arguments[0].scrollIntoView(true);", replyButton);
        await replyButton.click();

        // Wait for the reply preview to appear
        await this.driver.wait(until.elementLocated(By.css(this.replyPreviewContainer)), 10000);

        // Enter the reply text
        const inputField = await this.driver.findElement(By.css(this.chatInputField));
        await inputField.clear();
        await inputField.sendKeys(replyText);

        // Send the reply
        await inputField.sendKeys(Key.ENTER);

        // Wait a moment for the reply to be sent
        await this.driver.sleep(1000);

        // Verify the reply appears
        await this.waitForMessageWithText(replyText);
    }

    async cancelReply() {
        const closeButton = await this.driver.findElement(By.css(this.closeReplyButton));
        await closeButton.click();

        // Verify the reply preview disappears
        await this.driver.wait(until.stalenessOf(await this.driver.findElement(By.css(this.replyPreviewContainer))), 5000);
    }

    async waitForMessageWithText(text) {
        // Wait for a message that contains the specified text
        await this.driver.wait(async () => {
            const messages = await this.driver.findElements(By.css(this.messageText));
            for (const message of messages) {
                const messageText = await message.getText();
                if (messageText.includes(text)) {
                    return true;
                }
            }
            return false;
        }, 10000, `Message with text "${text}" did not appear`);
    }

    async getAllMessages() {
        const messages = await this.driver.findElements(By.css(this.chatMessageItems));
        const messageData = [];

        for (const message of messages) {
            try {
                const sender = await message.findElements(By.css(this.messageSender));
                const text = await message.findElements(By.css(this.messageText));
                const image = await message.findElements(By.css(this.messageImage));
                const reply = await message.findElements(By.css(this.replyContent));

                messageData.push({
                    sender: sender.length > 0 ? await sender[0].getText() : null,
                    text: text.length > 0 ? await text[0].getText() : null,
                    hasImage: image.length > 0,
                    isReply: reply.length > 0,
                    replyContent: reply.length > 0 ? await reply[0].getText() : null
                });
            } catch (error) {
                console.error('Error getting message data:', error);
            }
        }

        return messageData;
    }

    async isInputFieldEmpty() {
        const inputField = await this.driver.findElement(By.css(this.chatInputField));
        const text = await inputField.getAttribute('value');
        return text === '';
    }
}

module.exports = ChatRoomPage;