// VideoPlayer.js
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import './VideoPlayer.css';

const VideoPlayer = ({
    url,
    isPlaying,
    isOwner,
    onPause,
    onPlay,
    onProgress,
    onEnded,
    onSeeking,
    onSeeked
}) => {
    const [volume, setVolume] = useState(0.5);
    const [played, setPlayed] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const playerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const progressBarRef = useRef(null);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseMove = () => {
        setShowControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    const handleProgress = (state) => {
        if (!seeking) {
            setPlayed(state.played);
            onProgress(state);
        }
    };

    const handleSeekMouseDown = () => {
        setSeeking(true);
        if (onSeeking) onSeeking();
    };

    const handleSeekChange = (e) => {
        setPlayed(parseFloat(e.target.value));
    };

    const handleSeekMouseUp = (e) => {
        setSeeking(false);
        if (onSeeked) onSeeked();
        playerRef.current.seekTo(parseFloat(e.target.value));
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(0.5);
            setIsMuted(false);
        } else {
            setVolume(0);
            setIsMuted(true);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";

        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        if (hh) {
            return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    const handleVideoClick = () => {
        if (isOwner) {
            isPlaying ? onPause() : onPlay();
        }
    };

    const toggleFullScreen = () => {
        const container = document.querySelector('.video-player-container');

        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    const currentTime = playerRef.current ? playerRef.current.getCurrentTime() || 0 : 0;
    const duration = playerRef.current ? playerRef.current.getDuration() || 0 : 0;

    // Calculate progress bar width
    const progressPercentage = played * 100;

    return (
        <div
            className="video-player-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Actual video player */}
            <div className="video-wrapper" onClick={handleVideoClick}>
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={isPlaying}
                    volume={volume}
                    muted={isMuted}
                    width="100%"
                    height="100%"
                    onProgress={handleProgress}
                    onPause={onPause}
                    onPlay={onPlay}
                    onEnded={onEnded}
                    style={{ pointerEvents: 'none' }}
                    config={{
                        youtube: {
                            playerVars: {
                                controls: 0,
                                disablekb: 1,
                                modestbranding: 1,
                                playsinline: 1,
                                rel: 0,
                                showinfo: 0,
                                iv_load_policy: 3,
                                fs: 0,
                            }
                        }
                    }}
                />
            </div>

            {/* Custom controls that look like YouTube */}
            <div className={`custom-controls ${showControls ? 'visible' : ''}`}>
                {/* Progress bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar" ref={progressBarRef}>
                        <div className="progress-bar-background"></div>
                        <div
                            className="progress-bar-filled"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                        <input
                            type="range"
                            min={0}
                            max={0.999999}
                            step="any"
                            value={played}
                            onMouseDown={handleSeekMouseDown}
                            onChange={handleSeekChange}
                            onMouseUp={handleSeekMouseUp}
                            className="progress-bar-input"
                        />
                    </div>
                </div>

                {/* Bottom controls */}
                <div className="controls-bottom">
                    {/* Left controls */}
                    <div className="controls-left">
                        <button className="control-button play-pause" onClick={isPlaying ? onPause : onPlay}>
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M8 5v14l11-7z" fill="currentColor" />
                                </svg>
                            )}
                        </button>

                        <button className="control-button volume" onClick={toggleMute}>
                            {isMuted ? (
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor" />
                                </svg>
                            ) : volume > 0.5 ? (
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor" />
                                </svg>
                            )}
                        </button>

                        <div className="volume-slider-container">
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step="any"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                        </div>

                        <div className="time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="controls-right">
                        <button className="control-button fullscreen" onClick={toggleFullScreen}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;