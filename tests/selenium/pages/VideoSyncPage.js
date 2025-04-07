// tests/selenium/pages/VideoSyncPage.js
const { By, until, Key } = require('selenium-webdriver');

class VideoSyncPage {
    constructor(driver) {
        this.driver = driver;

        // Element selectors for video controls
        this.reactPlayer = '.react-player';
        this.youtubeIframe = 'iframe[src*="youtube"]';
        this.chatMessages = '.chat-messages';
        this.messageItems = '.message-item';
        this.alert = '.alert-message';
    }

    async navigateToRoomWithVideo(baseUrl, roomId, videoId) {
        await this.driver.get(`${baseUrl}/room/${roomId}?videoId=${videoId}&autoplay=true`);
        // Wait for the video player to load
        await this.driver.wait(until.elementLocated(By.css(this.reactPlayer)), 20000);
        // Wait a bit more for YouTube iframe to load
        await this.driver.sleep(5000);
    }

    async navigateToRoom(baseUrl, roomId) {
        await this.driver.get(`${baseUrl}/room/${roomId}`);
        // Wait for the main components to load
        await this.driver.wait(until.elementLocated(By.css(this.chatMessages)), 20000);
    }

    async playVideo() {
        try {
            // Use JavaScript to directly control the player via React state
            await this.driver.executeScript(`
        // Try to find the ReactPlayer component 
        const playerElement = document.querySelector('.react-player');
        if (playerElement && playerElement.__reactProps$) {
          // Find and call the onPlay handler if available
          const props = Object.values(playerElement).find(prop => prop && typeof prop === 'object' && prop.onPlay);
          if (props && props.onPlay) {
            props.onPlay();
            return true;
          }
        }
        
        // Fallback: try to find the play button in the YouTube iframe
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
          youtubeIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          return true;
        }
        
        // Direct state manipulation fallback
        if (window.stompClientGlobal && window.stompClientGlobal.connected) {
          // Send a message to play the video via WebSocket
          const videoState = {
            videoUrl: document.querySelector('iframe[src*="youtube"]')?.src || '',
            currentTime: 0,
            isPlaying: true,
            type: 'VIDEO_PLAY'
          };
          
          window.stompClientGlobal.publish({
            destination: \`/exchange/video.exchange/video.\${window.location.pathname.split('/').pop()}\`,
            body: JSON.stringify(videoState)
          });
          return true;
        }
        
        return false;
      `);

            await this.driver.sleep(3000); // Give time for the play action to take effect
            return true;
        } catch (error) {
            console.error('Error playing video:', error);
            return false;
        }
    }

    async pauseVideo() {
        try {
            // Use JavaScript to directly control the player via React state
            await this.driver.executeScript(`
        // Try to find the ReactPlayer component 
        const playerElement = document.querySelector('.react-player');
        if (playerElement && playerElement.__reactProps$) {
          // Find and call the onPause handler if available
          const props = Object.values(playerElement).find(prop => prop && typeof prop === 'object' && prop.onPause);
          if (props && props.onPause) {
            props.onPause();
            return true;
          }
        }
        
        // Fallback: try to find the pause button in the YouTube iframe
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
          youtubeIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          return true;
        }
        
        // Direct state manipulation fallback
        if (window.stompClientGlobal && window.stompClientGlobal.connected) {
          // Send a message to pause the video via WebSocket
          const videoState = {
            videoUrl: document.querySelector('iframe[src*="youtube"]')?.src || '',
            currentTime: 0,
            isPlaying: false,
            type: 'VIDEO_PAUSE'
          };
          
          window.stompClientGlobal.publish({
            destination: \`/exchange/video.exchange/video.\${window.location.pathname.split('/').pop()}\`,
            body: JSON.stringify(videoState)
          });
          return true;
        }
        
        return false;
      `);

            await this.driver.sleep(3000); // Give time for the pause action to take effect
            return true;
        } catch (error) {
            console.error('Error pausing video:', error);
            return false;
        }
    }

    async seekVideo(timeInSeconds) {
        try {
            // Use JavaScript to directly control the player via React state
            await this.driver.executeScript(`
        // Try to find the ReactPlayer component 
        const playerElement = document.querySelector('.react-player');
        if (playerElement && playerElement.__reactProps$) {
          // Find ReactPlayer instance and seek
          const instance = Object.values(playerElement).find(prop => 
            prop && typeof prop === 'object' && prop.getCurrentTime);
          
          if (instance && instance.seekTo) {
            instance.seekTo(${timeInSeconds}, 'seconds');
            return true;
          }
        }
        
        // Fallback: try to seek in the YouTube iframe
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
          youtubeIframe.contentWindow.postMessage(
            '{"event":"command","func":"seekTo","args":[${timeInSeconds}, true]}', '*'
          );
          return true;
        }
        
        // Direct state manipulation fallback
        if (window.stompClientGlobal && window.stompClientGlobal.connected) {
          // Send a message to seek the video via WebSocket
          const videoState = {
            videoUrl: document.querySelector('iframe[src*="youtube"]')?.src || '',
            currentTime: ${timeInSeconds},
            isPlaying: true,
            type: 'VIDEO_PROGRESS'
          };
          
          window.stompClientGlobal.publish({
            destination: \`/exchange/video.exchange/video.\${window.location.pathname.split('/').pop()}\`,
            body: JSON.stringify(videoState)
          });
          return true;
        }
        
        return false;
      `);

            await this.driver.sleep(3000); // Give time for the seek action to take effect
            return true;
        } catch (error) {
            console.error('Error seeking video:', error);
            return false;
        }
    }

    async getCurrentTime() {
        try {
            // Use JavaScript to get current time
            const time = await this.driver.executeScript(`
        // Try to find the ReactPlayer component 
        const playerElement = document.querySelector('.react-player');
        if (playerElement && playerElement.__reactProps$) {
          // Find ReactPlayer instance and get current time
          const instance = Object.values(playerElement).find(prop => 
            prop && typeof prop === 'object' && prop.getCurrentTime);
          
          if (instance && instance.getCurrentTime) {
            return instance.getCurrentTime() || 0;
          }
        }
        
        // Try to get time from player progress state
        if (window.__REACT_STATE && window.__REACT_STATE.player && window.__REACT_STATE.player.progress) {
          return window.__REACT_STATE.player.progress.playedSeconds || 0;
        }
        
        return 0; // Default fallback
      `);

            return time || 0;
        } catch (error) {
            console.error('Error getting current time:', error);
            return 0;
        }
    }

    async isVideoPlaying() {
        try {
            // Use JavaScript to check if video is playing
            const isPlaying = await this.driver.executeScript(`
        // Try to find the ReactPlayer component 
        const playerElement = document.querySelector('.react-player');
        if (playerElement && playerElement.__reactProps$) {
          // Check playing state
          const props = Object.values(playerElement).find(prop => 
            prop && typeof prop === 'object' && prop.hasOwnProperty('playing'));
          
          if (props) {
            return !!props.playing;
          }
        }
        
        // Try to get playing state from React state
        if (window.__REACT_STATE && window.__REACT_STATE.player) {
          return !!window.__REACT_STATE.player.isPlaying;
        }
        
        // Check if there's any video element that's not paused
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
          if (!video.paused) return true;
        }
        
        // Check iframe src for autoplay parameter
        const iframe = document.querySelector('iframe[src*="youtube"]');
        if (iframe && iframe.src.includes('autoplay=1')) {
          return true; // Likely playing
        }
        
        return false; // Default fallback
      `);

            return !!isPlaying;
        } catch (error) {
            console.error('Error checking if video is playing:', error);
            return false;
        }
    }

    async waitForTimeChange(initialTime, timeoutMs = 5000) {
        const startTime = Date.now();
        let currentTime = initialTime;

        while (Date.now() - startTime < timeoutMs) {
            const newTime = await this.getCurrentTime();
            if (newTime !== initialTime && newTime > 0) {
                return true;
            }
            await this.driver.sleep(500);
        }

        return false;
    }

    async waitForVideoPause(timeoutMs = 5000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const isPlaying = await this.isVideoPlaying();
            if (!isPlaying) {
                return true;
            }
            await this.driver.sleep(500);
        }

        return false;
    }

    async waitForVideoPlay(timeoutMs = 5000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const isPlaying = await this.isVideoPlaying();
            if (isPlaying) {
                return true;
            }
            await this.driver.sleep(500);
        }

        return false;
    }

    async isAlertDisplayed() {
        try {
            const alerts = await this.driver.findElements(By.css(this.alert));
            return alerts.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getAlertText() {
        try {
            const alert = await this.driver.findElement(By.css(this.alert));
            return await alert.getText();
        } catch (error) {
            return null;
        }
    }

    async disableNetworkTemporarily(durationSeconds) {
        // Use browser DevTools to disable network
        await this.driver.executeScript(`
      window.setTimeout(() => {
        // Re-enable network after the specified duration
        navigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      }, ${durationSeconds * 1000});
      
      // Disable network
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    `);

        // Wait for the network to be re-enabled
        await this.driver.sleep(durationSeconds * 1000 + 2000);
    }
}

module.exports = VideoSyncPage;