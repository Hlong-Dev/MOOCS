// VoiceChat.js
import React, { useState, useEffect, useRef } from 'react';
import '../VoiceChat.css';

const VoiceChat = ({ roomId, stompClient, currentUser }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [volume, setVolume] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Initialize audio context when component mounts
    useEffect(() => {
        // Cleanup function to stop everything when component unmounts
        return () => {
            stopRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Create audio context and analyzer
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();

            // Configure analyzer for better volume detection
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.7;

            // Connect microphone to analyzer
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            // Start monitoring volume
            setIsRecording(true);
            monitorVolume();

            // Here you would start sending audio data via WebSocket
            // Implement this when you're ready for the WebSocket functionality

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access denied or not available");
        }
    };

    const stopRecording = () => {
        // Stop the animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop the media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsRecording(false);
        setVolume(0);
    };

    const monitorVolume = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Tính toán volume nhạy cảm hơn
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Áp dụng hàm phi tuyến để volume phản ứng mạnh hơn với âm thanh nhỏ
        // Cường độ 2.5 thay vì 0.8 để phản ứng mạnh mẽ hơn
        const normalizedVolume = Math.min(100, Math.pow(avg / 255, 0.5) * 100 * 2.5);

        setVolume(normalizedVolume);

        // Tiếp tục giám sát
        animationFrameRef.current = requestAnimationFrame(monitorVolume);
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    return (
        <div className="voice-chat-container">
            <button
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                style={{
                    // Giảm mẫu số để phản ứng mạnh hơn (50 thay vì 150)
                    transform: isRecording ? `scale(${1 + volume / 270})` : 'scale(1)',
                }}
            >
                <div className="mic-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
                    </svg>
                </div>
            </button>
        </div>
    );
};

export default VoiceChat;