// ChatRoom.js
import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs'; // Không cần SockJS
import { useNavigate, useParams } from 'react-router-dom';
import './ChatRoom.css';
import { getUserFromToken } from './utils/jwtUtils';
import Compressor from 'compressorjs';
import Header from './components/Header';
import ReactPlayer from 'react-player';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios'; // Thêm axios để gọi API
import VideoQueue from './components/VideoQueue';
import VideoEndScreen from './components/VideoEndScreen';
import VideoBackgroundEffect from './VideoBackgroundEffect';
import RoomList from './RoomList';
import VoiceChat from './components/VoiceChat';
import Settings from './Settings';
window.stompClientGlobal = null;

const ChatRoom = () => {
    // Lấy roomId từ URL
    const { roomId } = useParams();
    //
    const [isPlaying, setIsPlaying] = useState(true); // Trạng thái phát/tạm dừng video
    const [videoList, setVideoList] = useState([]); // Danh sách video
    const [currentVideoUrl, setCurrentVideoUrl] = useState(''); // URL video hiện tại
    const [showVideoList, setShowVideoList] = useState(true); // Hiển thị danh sách video

    const [searchTerm, setSearchTerm] = useState(''); // Từ khóa tìm kiếm
    const [youtubeResults, setYoutubeResults] = useState([]); // Kết quả tìm kiếm YouTube
    // Các trạng thái quản lý chat
    const [messages, setMessages] = useState([]); // Danh sách tin nhắn
    const [messageContent, setMessageContent] = useState(''); // Nội dung tin nhắn
    const [selectedImage, setSelectedImage] = useState(null); // Ảnh được chọn để gửi
    const [connected, setConnected] = useState(false); // Trạng thái kết nối WebSocket
    const [usersInRoom, setUsersInRoom] = useState([]); // Danh sách người dùng trong phòng
    const [ownerUsername, setOwnerUsername] = useState(''); // Username của chủ phòng

    // Thông tin người dùng hiện tại
    const currentUser = getUserFromToken() || { username: 'Unknown', avtUrl: 'https://i.imgur.com/WxNkK7J.png' };
    const isOwner = currentUser.username === ownerUsername;
    // Refs

    const chatMessagesRef = useRef(null); // Ref để cuộn xuống cuối chat
    const inputRef = useRef(null); // Ref cho input chat
    const navigate = useNavigate(); // Hook điều hướng
    const playerRef = useRef(null); // Ref cho ReactPlayer
    const stompClientRef = useRef(null); // Ref cho stompClient
    const ownerUsernameRef = useRef(''); // Ref cho ownerUsername
    const API_KEY = 'AIzaSyBL1HyURHH5Sdb9iNK-8jlPNTooqwy-fns';
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [videoQueue, setVideoQueue] = useState([]);
    const [selectedReplyMessage, setSelectedReplyMessage] = useState(null);
    const [showEndScreen, setShowEndScreen] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showRoomList, setShowRoomList] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // Tạo refs để theo dõi tin nhắn đã gửi (tránh duplicate)
    const sentMessagesRef = useRef(new Set());
    const handleSettingsClick = () => {
        setShowSettings(!showSettings);

        // Close other modals/panels when opening settings
        if (!showSettings) {
            setShowVideoList(false);
            setShowQueueModal(false);
            setShowRoomList(false);
        }
    };
    const handleRoomListClick = () => {
        const newShowRoomList = !showRoomList;
        setShowRoomList(newShowRoomList);

        // Đóng các modal khác khi mở danh sách phòng
        if (newShowRoomList) {
            setShowVideoList(false);
            setShowSettings(false);
            setShowQueueModal(false);
        }
    };
    const handleQueueClick = () => {
        const newShowQueueModal = !showQueueModal;
        setShowQueueModal(newShowQueueModal);

        // If we're opening the queue modal, close the video list
        if (newShowQueueModal) {
            setShowVideoList(false);
            setShowSettings(false);
            setShowRoomList(false);
        }
    };

    // Hàm xử lý tin nhắn video
    const handleVideoMessage = (receivedMessage) => {
        console.log('Handling video message:', receivedMessage);

        switch (receivedMessage.type) {
            case 'VIDEO_UPDATE':
                handleVideoUpdate(receivedMessage);
                break;
            case 'VIDEO_PLAY':
                handleVideoPlay(receivedMessage);
                break;
            case 'VIDEO_PAUSE':
                handleVideoPause(receivedMessage);
                break;
            case 'VIDEO_PROGRESS':
                handleVideoProgress(receivedMessage);
                break;
            default:
                console.log('Unknown video message type:', receivedMessage.type);
        }
    };
    const sendRoomLinkMessage = () => {
        console.log("Attempting to send room link. Connected:", stompClientRef.current?.connected);
        console.log("Current user:", currentUser.username, "Owner:", ownerUsernameRef.current);

        if (stompClientRef.current && stompClientRef.current.connected &&
            currentUser.username === ownerUsernameRef.current) {
            const roomLink = `https://cinemate.website/room/${roomId}`;

            const linkMessage = {
                sender: 'System',
                content: `Link: ${roomLink}`,
                type: 'CHAT',
                avtUrl: 'https://i.imgur.com/axHfgSw.png',
                isRoomLink: true
            };

            console.log("Sending room link message:", linkMessage);
            stompClientRef.current.publish({
                destination: `/exchange/chat.exchange/room.${roomId}`,
                body: JSON.stringify(linkMessage)
            });
        } else {
            console.log("Cannot send room link - conditions not met");
        }
    };
    const handleCopyRoomLink = () => {
        const roomLink = `https://cinemate.website/room/${roomId}`;

        // Copy to clipboard
        navigator.clipboard.writeText(roomLink)
            .then(() => {
                // Show the confirmation modal
                setShowCopyModal(true);

                // Hide it after 2 seconds
                setTimeout(() => {
                    setShowCopyModal(false);
                }, 2000);
            })
            .catch((err) => {
                console.error('Failed to copy link: ', err);
                // Handle error if needed
            });
    };
    // Hàm xử lý tin nhắn chat
    const handleChatMessage = (receivedMessage) => {
        console.log('Handling chat message:', receivedMessage);

        switch (receivedMessage.type) {
            case 'JOIN':
                setUsersInRoom(prevUsers => [...prevUsers, receivedMessage.sender]);
                setMessages(prevMessages => [...prevMessages, receivedMessage]);

                // Nếu là chủ phòng, gửi ngay trạng thái hiện tại đến người mới tham gia
                if (currentUser.username === ownerUsernameRef.current) {
                    console.log('Owner sending current state to new user');

                    // Lấy queue hiện tại từ localStorage để đảm bảo dữ liệu mới nhất
                    const currentQueueStr = localStorage.getItem(`videoQueue_${roomId}`);
                    const currentQueue = currentQueueStr ? JSON.parse(currentQueueStr) : [];

                    setTimeout(() => {
                        // Gửi queue hiện tại
                        if (currentQueue.length > 0) {
                            broadcastQueueUpdate(currentQueue);
                        }

                        // Gửi trạng thái video nếu có
                        if (playerRef.current && currentVideoUrl) {
                            sendVideoState();
                        }
                    }, 1000);
                }
                break;

            case 'LEAVE':
                setUsersInRoom(prevUsers => prevUsers.filter(user => user !== receivedMessage.sender));
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
                break;

            case 'QUEUE_UPDATE':
                console.log('Received QUEUE_UPDATE:', receivedMessage);
                if (receivedMessage.roomId === roomId) {
                    // Chỉ cập nhật queue nếu có dữ liệu hợp lệ
                    if (receivedMessage.queue && Array.isArray(receivedMessage.queue) && receivedMessage.queue.length > 0) {
                        console.log('Updating queue with:', receivedMessage.queue);
                        setVideoQueue(receivedMessage.queue);
                        localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(receivedMessage.queue));
                    }
                }
                break;
            case 'OWNER_LEFT':
                console.log('Owner left the room, redirecting to home page');
                if (currentUser.username !== ownerUsernameRef.current) {
                    // Hiện thông báo
                    alert("Chủ phòng đã thoát. Bạn sẽ được chuyển về trang chủ.");

                    // Tạm dừng mọi activity và clear localStorage data
                    setIsPlaying(false);
                    localStorage.removeItem(`videoQueue_${roomId}`);

                    // Đảm bảo ngắt kết nối WebSocket trước khi chuyển trang
                    if (stompClientRef.current && stompClientRef.current.connected) {
                        try {
                            const leaveMessage = {
                                sender: currentUser.username,
                                avtUrl: currentUser.avtUrl,
                                type: 'LEAVE'
                            };

                            stompClientRef.current.publish({
                                destination: `/exchange/chat.exchange/room.${roomId}`,
                                body: JSON.stringify(leaveMessage),
                            });

                            stompClientRef.current.deactivate();
                        } catch (error) {
                            console.error('Error disconnecting WebSocket:', error);
                        }
                    }

                    // Đặt một timeout để người dùng có thể thấy thông báo trước khi chuyển trang
                    setTimeout(() => {
                        window.stompClientGlobal = null; // Clear biến toàn cục
                        navigate('/home');
                    }, 1500);
                }
                break;

            case 'CHAT':
            default:
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
                break;
        }
    };

    useEffect(() => {
        // Load queue từ localStorage khi khởi tạo
        const savedQueue = localStorage.getItem(`videoQueue_${roomId}`);
        if (savedQueue) {
            try {
                const parsedQueue = JSON.parse(savedQueue);
                setVideoQueue(parsedQueue);
            } catch (error) {
                console.error('Error parsing saved queue:', error);
            }
        }
    }, [roomId]);

    const fetchTrendingMusicVideos = async () => {
        try {
            // Danh sách các từ khóa âm nhạc phổ biến
            const musicKeywords = [
                'us uk',
                'nhạc pop usuk',
                'nhạc indie việt',
            ];

            // Chọn ngẫu nhiên một từ khóa
            const randomKeyword = musicKeywords[Math.floor(Math.random() * musicKeywords.length)];

            // Fetch video sử dụng search endpoint với từ khóa ngẫu nhiên
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: 'snippet',
                    q: randomKeyword,
                    type: 'video',
                    videoCategoryId: '10', // Music category
                    maxResults: 10,
                    regionCode: 'VN',
                    videoDuration: 'medium', // Chỉ lấy video có độ dài trung bình
                    order: 'viewCount', // Sắp xếp theo lượt xem
                    key: API_KEY
                }
            }
            );

            // Fetch thêm chi tiết video để lấy duration
            const videoIds = response.data.items.map(item => item.id.videoId).join(',');
            const videoDetailsResponse = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    part: 'contentDetails,statistics',
                    id: videoIds,
                    key: API_KEY
                }
            }
            );

            // Kết hợp thông tin từ cả hai API calls
            const trendingVideos = response.data.items.map(video => {
                const videoDetails = videoDetailsResponse.data.items.find(
                    detail => detail.id === video.id.videoId
                );

                return {
                    id: video.id.videoId,
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.medium.url,
                    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                    duration: videoDetails ? videoDetails.contentDetails.duration : 'Unknown',
                    viewCount: videoDetails ? parseInt(videoDetails.statistics.viewCount) : 0,
                    votes: 0,
                    voters: [],
                    isTrending: true,
                    publishedAt: video.snippet.publishedAt
                };
            });

            // Sắp xếp theo lượt xem
            return trendingVideos.sort((a, b) => b.viewCount - a.viewCount);

        } catch (error) {
            console.error('Error fetching music videos:', error);
            return [];
        }
    };

    useEffect(() => {
        const initializeQueue = async () => {
            // First try to load from localStorage
            const savedQueue = localStorage.getItem(`videoQueue_${roomId}`);
            if (savedQueue) {
                try {
                    const parsedQueue = JSON.parse(savedQueue);
                    if (parsedQueue && Array.isArray(parsedQueue) && parsedQueue.length > 0) {
                        console.log('Loading saved queue from localStorage:', parsedQueue.length, 'items');
                        setVideoQueue(parsedQueue);
                        return; // Exit if we have saved queue
                    }
                } catch (error) {
                    console.error('Error parsing saved queue:', error);
                }
            }

            // If no saved queue or empty queue, fetch trending videos (ONLY for owner)
            if (isOwner) {
                console.log('Owner initializing trending queue');
                const trendingVideos = await fetchTrendingMusicVideos();
                if (trendingVideos.length > 0) {
                    setVideoQueue(trendingVideos);
                    localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(trendingVideos));

                    // Only broadcast after WebSocket is connected
                    if (stompClientRef.current && stompClientRef.current.connected) {
                        console.log('Broadcasting initial trending queue');
                        broadcastQueueUpdate(trendingVideos);
                    } else {
                        console.log('WebSocket not connected yet, will broadcast queue later');
                        // Setup a listener to broadcast queue when connection is established
                        const checkAndBroadcast = setInterval(() => {
                            if (stompClientRef.current && stompClientRef.current.connected) {
                                console.log('WebSocket now connected, broadcasting initial queue');
                                broadcastQueueUpdate(trendingVideos);
                                clearInterval(checkAndBroadcast);
                            }
                        }, 1000);

                        // Clear interval after 10 seconds no matter what
                        setTimeout(() => clearInterval(checkAndBroadcast), 10000);
                    }
                }
            } else {
                console.log('Non-owner: waiting for queue from owner');
            }
        };

        initializeQueue();
    }, [roomId, isOwner]);

    const fetchYouTubeChannelAvatar = async (videoId) => {
        try {
            // First get video details to get channel ID
            const videoResponse = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos`,
                {
                    params: {
                        part: 'snippet',
                        id: videoId,
                        key: API_KEY
                    }
                }
            );

            const channelId = videoResponse.data.items[0].snippet.channelId;

            // Then get channel details to get avatar
            const channelResponse = await axios.get(
                `https://www.googleapis.com/youtube/v3/channels`,
                {
                    params: {
                        part: 'snippet',
                        id: channelId,
                        key: API_KEY
                    }
                }
            );

            return channelResponse.data.items[0].snippet.thumbnails.default.url;
        } catch (error) {
            console.error('Error fetching channel avatar:', error);
            return 'https://i.imgur.com/WxNkK7J.png'; // Default avatar if fetch fails
        }
    };

    const addToQueue = async (video, isYouTube = false) => {
        const currentUser = getUserFromToken();

        // Fetch channel avatar for YouTube videos
        let channelAvatar = 'https://i.imgur.com/WxNkK7J.png';
        if (isYouTube) {
            try {
                channelAvatar = await fetchYouTubeChannelAvatar(video.id.videoId);
            } catch (error) {
                console.error('Error fetching channel avatar:', error);
            }
        }

        // Prepare the new queue item
        const newQueueItem = {
            id: isYouTube ? video.id.videoId : video.title,
            title: isYouTube ? video.snippet.title : video.title,
            thumbnail: isYouTube ? video.snippet.thumbnails.medium.url : `https://colkidclub-hutech.id.vn${video.thumbnail}`,
            url: isYouTube ? `https://www.youtube.com/watch?v=${video.id.videoId}`
                : `https://colkidclub-hutech.id.vn/api/video/play/${encodeURIComponent(video.title)}`,
            duration: video.duration,
            allowUserQueue: true,
            votes: 1,
            channelAvatar: channelAvatar,
            voters: [{
                username: currentUser.username,
                avtUrl: currentUser.avtUrl
            }]
        };

        // Nếu không có video đang phát, phát video ngay lập tức
        if (!currentVideoUrl && isOwner) {
            setCurrentVideoUrl(newQueueItem.url);
            setShowVideoList(false);
            setIsPlaying(true);

            // Broadcast video state
            if (stompClientRef.current && stompClientRef.current.connected) {
                const videoState = {
                    videoUrl: newQueueItem.url,
                    currentTime: 0,
                    isPlaying: true,
                    type: 'VIDEO_UPDATE'
                };

                // Sử dụng exchange và routing key phù hợp cho video
                stompClientRef.current.publish({
                    destination: `/exchange/video.exchange/video.${roomId}`,
                    body: JSON.stringify(videoState)
                });

                // Send chat notification with channel avatar
                const notificationMessage = {
                    sender: 'Now playimg',
                    content: `${newQueueItem.title}`,
                    type: 'CHAT',
                    avtUrl: newQueueItem.channelAvatar // Use channel avatar
                };

                // Sử dụng exchange và routing key phù hợp cho chat
                stompClientRef.current.publish({
                    destination: `/exchange/chat.exchange/room.${roomId}`,
                    body: JSON.stringify(notificationMessage)
                });
            }
            return;
        }

        // Tạo một bản sao của queue để thao tác
        let updatedQueue = [...videoQueue];

        // Tìm và xóa vote của user ở các video khác
        updatedQueue = updatedQueue.map(queueItem => {
            // Nếu video này có vote của user
            if (queueItem.voters && queueItem.voters.some(voter => voter.username === currentUser.username)) {
                // Giảm vote và loại bỏ user khỏi danh sách voters
                return {
                    ...queueItem,
                    votes: Math.max((queueItem.votes || 1) - 1, 0),
                    voters: queueItem.voters.filter(voter => voter.username !== currentUser.username)
                };
            }
            return queueItem;
        });

        // Kiểm tra xem video mới đã tồn tại trong queue chưa
        const existingVideoIndex = updatedQueue.findIndex(
            queueItem => queueItem.id === newQueueItem.id
        );

        if (existingVideoIndex !== -1) {
            // Nếu video đã tồn tại, cập nhật vote
            const existingVideo = updatedQueue[existingVideoIndex];
            existingVideo.votes += 1;
            existingVideo.voters.push({
                username: currentUser.username,
                avtUrl: currentUser.avtUrl
            });
        } else {
            // Nếu video chưa tồn tại, thêm mới vào queue
            updatedQueue.push(newQueueItem);
        }

        // Sắp xếp lại queue theo số vote
        updatedQueue.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        // Cập nhật state và localStorage
        setVideoQueue(updatedQueue);
        localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(updatedQueue));

        // Gửi thông báo
        setSuccessMessage(`Add "${newQueueItem.title}" to queue`);
        setShowSuccessModal(true);
        setTimeout(() => {
            setShowSuccessModal(false);
        }, 2000);

        // Broadcast queue update
        broadcastQueueUpdate(updatedQueue);
    };

    const updateRoomVideoInfo = async (videoUrl, videoTitle) => {
        if (!isOwner) return;

        try {
            const response = await fetch(`https://colkidclub-hutech.id.vn/api/rooms/${roomId}/update-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    currentVideoUrl: videoUrl,
                    currentVideoTitle: videoTitle
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            console.log('Video info updated successfully:', { videoUrl, videoTitle });
        } catch (error) {
            console.error('Error updating room video info:', error);
        }
    };

    // Cập nhật hàm handleVoteVideo
    const handleVoteVideo = (index) => {
        const currentUser = getUserFromToken();
        const updatedQueue = [...videoQueue];
        const targetVideo = updatedQueue[index];

        // Đảm bảo rằng voters được khởi tạo cho tất cả video trong queue
        updatedQueue.forEach(video => {
            if (!video.voters) {
                video.voters = [];
            }
        });

        // Kiểm tra xem user đã vote cho video khác chưa
        const userPreviousVote = updatedQueue.findIndex(video =>
            video.voters && video.voters.some(voter => voter.username === currentUser.username)
        );

        // Nếu user đã vote cho video khác, hủy vote cũ
        if (userPreviousVote !== -1 && userPreviousVote !== index) {
            updatedQueue[userPreviousVote].votes = (updatedQueue[userPreviousVote].votes || 1) - 1;
            updatedQueue[userPreviousVote].voters = updatedQueue[userPreviousVote].voters.filter(
                voter => voter.username !== currentUser.username
            );
        }

        // Đảm bảo rằng video hiện tại có mảng voters
        if (!targetVideo.voters) {
            targetVideo.voters = [];
        }

        // Kiểm tra xem user đã vote cho video này chưa
        const hasVoted = targetVideo.voters.some(voter => voter.username === currentUser.username);

        if (!hasVoted) {
            // Thêm vote mới
            targetVideo.votes = (targetVideo.votes || 0) + 1;
            targetVideo.voters.push({
                username: currentUser.username,
                avtUrl: currentUser.avtUrl
            });
        }

        // Sắp xếp lại queue theo số vote
        updatedQueue.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        setVideoQueue(updatedQueue);
        localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(updatedQueue));
        broadcastQueueUpdate(updatedQueue);
    };

    // Hàm gửi cập nhật queue qua WebSocket
    const broadcastQueueUpdate = (updatedQueue) => {
        if (stompClientRef.current && stompClientRef.current.connected && updatedQueue && updatedQueue.length > 0) {
            const queueUpdate = {
                type: 'QUEUE_UPDATE',
                queue: updatedQueue,
                roomId: roomId
            };

            // Sử dụng exchange và routing key phù hợp cho queue updates
            stompClientRef.current.publish({
                destination: `/exchange/chat.exchange/room.${roomId}`,
                body: JSON.stringify(queueUpdate)
            });

            console.log('Broadcasting queue update:', updatedQueue.length, 'items');
        } else {
            console.warn('Cannot broadcast queue update: WebSocket not connected or queue is empty');
        }
    };

    // Sửa lại hàm removeFromQueue
    const removeFromQueue = (index) => {
        if (!isOwner) {
            alert("Only the room owner can remove videos from the queue.");
            return;
        }

        const updatedQueue = videoQueue.filter((_, i) => i !== index);
        setVideoQueue(updatedQueue);

        // Lưu vào localStorage
        localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(updatedQueue));

        // Broadcast queue update
        broadcastQueueUpdate(updatedQueue);
    };

    // Hàm gửi trạng thái video hiện tại
    const sendVideoState = () => {
        if (isOwner && playerRef.current && currentVideoUrl) {
            const videoState = {
                videoUrl: currentVideoUrl,
                currentTime: playerRef.current.getCurrentTime(),
                isPlaying: isPlaying,
                type: 'VIDEO_UPDATE'
            };

            // Tạo một ID duy nhất cho tin nhắn để tránh duplicate
            const messageId = `video_update_${Date.now()}`;

            // Chỉ gửi nếu chưa gửi tin nhắn này
            if (!sentMessagesRef.current.has(messageId)) {
                sentMessagesRef.current.add(messageId);

                // Sau 5 giây, xóa ID tin nhắn để có thể gửi lại
                setTimeout(() => {
                    sentMessagesRef.current.delete(messageId);
                }, 5000);

                // Sử dụng exchange và routing key phù hợp cho video updates
                stompClientRef.current.publish({
                    destination: `/exchange/video.exchange/video.${roomId}`,
                    body: JSON.stringify(videoState)
                });

                console.log('Sent video state:', videoState);
            }
        }
    };

    const handleVideoEnd = async () => {
        setShowEndScreen(true);
        setShowCountdown(true);
        setCountdown(10);

        let countdownTimer = null;
        let timeoutId = null;

        const playMostVotedVideo = async () => {
            const currentQueueStr = localStorage.getItem(`videoQueue_${roomId}`);
            const currentQueue = currentQueueStr ? JSON.parse(currentQueueStr) : [];
            const sortedQueue = [...currentQueue].sort((a, b) => {
                const votesA = a.votes || 0;
                const votesB = b.votes || 0;
                if (votesB !== votesA) {
                    return votesB - votesA;
                }
                return currentQueue.indexOf(b) - currentQueue.indexOf(a);
            });

            if (sortedQueue.length > 0) {
                const mostVotedVideo = sortedQueue.find(video => (video.votes || 0) > 0);

                if (mostVotedVideo) {
                    // Get channel avatar if it's a YouTube video
                    let channelAvatar = 'https://i.imgur.com/WxNkK7J.png';
                    if (mostVotedVideo.url.includes('youtube.com')) {
                        const videoId = mostVotedVideo.url.split('v=')[1];
                        try {
                            channelAvatar = await fetchYouTubeChannelAvatar(videoId);
                        } catch (error) {
                            console.error('Error fetching channel avatar:', error);
                        }
                    }

                    const updatedQueue = sortedQueue.filter(v => v.id !== mostVotedVideo.id);
                    setVideoQueue(updatedQueue);
                    localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(updatedQueue));
                    setCurrentVideoUrl(mostVotedVideo.url);
                    setIsPlaying(true);

                    await updateRoomVideoInfo(mostVotedVideo.url, mostVotedVideo.title);

                    if (stompClientRef.current?.connected) {
                        // Gửi cập nhật hàng đợi tới tất cả người dùng
                        broadcastQueueUpdate(updatedQueue);

                        // Gửi cập nhật video tới tất cả người dùng
                        const videoState = {
                            type: 'VIDEO_UPDATE',
                            videoUrl: mostVotedVideo.url,
                            currentTime: 0,
                            isPlaying: true
                        };

                        stompClientRef.current.publish({
                            destination: `/exchange/video.exchange/video.${roomId}`,
                            body: JSON.stringify(videoState)
                        });

                        // Chỉ gửi thông báo "Now playing" một lần duy nhất
                        // và chỉ gửi nếu người dùng hiện tại là chủ phòng
                        if (isOwner) {
                            const notificationMessage = {
                                sender: 'Now playing',
                                content: `${mostVotedVideo.title}`,
                                type: 'CHAT',
                                avtUrl: channelAvatar
                            };

                            stompClientRef.current.publish({
                                destination: `/exchange/chat.exchange/room.${roomId}`,
                                body: JSON.stringify(notificationMessage)
                            });
                        }
                    }
                } else {
                    await loadTrendingVideos();
                }
            } else {
                await loadTrendingVideos();
            }
            setShowRoomList(false);
            setShowEndScreen(false);
            setShowVideoList(false);
            setShowCountdown(false);
        };

        // Phần còn lại của hàm giữ nguyên
        const loadTrendingVideos = async () => {
            const trendingVideos = await fetchTrendingMusicVideos();
            if (trendingVideos.length > 0) {
                setVideoQueue(trendingVideos);
                localStorage.setItem(`videoQueue_${roomId}`, JSON.stringify(trendingVideos));

                // Broadcast cập nhật queue mới
                broadcastQueueUpdate(trendingVideos);
            }
        };

        // Bắt đầu đếm ngược
        countdownTimer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownTimer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Set timeout để phát video sau khi đếm ngược kết thúc
        timeoutId = setTimeout(() => {
            clearInterval(countdownTimer);
            playMostVotedVideo();
        }, 10000);

        // Cleanup function
        return () => {
            if (countdownTimer) clearInterval(countdownTimer);
            if (timeoutId) clearTimeout(timeoutId);
        };
    };

    // Các trạng thái quản lý video
    const [isWebSocketReady, setIsWebSocketReady] = useState(false);
    // Refs cho currentVideoUrl và isPlaying
    const currentVideoUrlRef = useRef(currentVideoUrl);
    const isPlayingRef = useRef(isPlaying);
    const [isLoading, setIsLoading] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const [syncInterval, setSyncInterval] = useState(null);

    const [searchParams] = useSearchParams();
    const urlVideoId = searchParams.get('videoId');
    const autoplay = searchParams.get('autoplay') === 'true';
    const [seeking, setSeeking] = useState(false);
    const [progress, setProgress] = useState(null);

    // Hàm search Video
    const searchYoutubeVideos = async () => {
        try {
            if (!searchTerm.trim()) {
                setYoutubeResults([]);
                setIsLoading(false);
                setImagesLoaded(0);
                return;
            }

            setIsLoading(true);
            setImagesLoaded(0);
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchTerm}&type=video&key=${API_KEY}&maxResults=10`
            );
            setYoutubeResults(response.data.items);
        } catch (error) {
            console.error('Error fetching YouTube results:', error);
            setIsLoading(false);
            setImagesLoaded(0);
        }
    };

    // Hàm phát video YouTube
    const playYoutubeVideo = async (videoId, videoTitle) => {
        if (!isOwner) {
            alert("Chỉ chủ phòng mới có thể chọn video.");
            return;
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const channelAvatar = await fetchYouTubeChannelAvatar(videoId);

        if (!currentVideoUrl) {
            setCurrentVideoUrl(videoUrl);
            setShowVideoList(false);
            setShowRoomList(false);
            setIsPlaying(true);
            setYoutubeResults([]);

            // Cập nhật thông tin video
            updateRoomVideoInfo(videoUrl, videoTitle);
        } else {
            const youtubeVideo = youtubeResults.find(v => v.id.videoId === videoId);
            if (youtubeVideo) {
                addToQueue(youtubeVideo, true);
            }
            return;
        }

        // Broadcast video state
        if (stompClientRef.current && stompClientRef.current.connected) {
            const videoState = {
                videoUrl: videoUrl,
                currentTime: 0,
                isPlaying: true,
                type: 'VIDEO_UPDATE'
            };

            stompClientRef.current.publish({
                destination: `/exchange/video.exchange/video.${roomId}`,
                body: JSON.stringify(videoState)
            });

            const notificationMessage = {
                sender: 'Now playing',
                content: `${videoTitle}`,
                type: 'CHAT',
                avtUrl: channelAvatar // Use channel avatar for notification
            };

            stompClientRef.current.publish({
                destination: `/exchange/chat.exchange/room.${roomId}`,
                body: JSON.stringify(notificationMessage)
            });
        }
    };

    // Tách logic xử lý video params ra một useEffect riêng
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                searchYoutubeVideos();
            } else {
                setYoutubeResults([]);
                setIsLoading(false);
                setImagesLoaded(0);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Ảuto play video from Params
    

    // Thêm useEffect để theo dõi việc load ảnh
    useEffect(() => {
        if (youtubeResults.length > 0) {
            setImagesLoaded(0);

            const imageLoaders = youtubeResults.map((video) => {
                const img = new Image();
                img.src = video.snippet.thumbnails.medium.url;
                img.onload = () => {
                    setImagesLoaded((prev) => prev + 1);
                };
                img.onerror = () => {
                    setImagesLoaded((prev) => prev + 1);
                };
                return img;
            });

            return () => {
                imageLoaders.forEach(img => {
                    img.onload = null;
                    img.onerror = null;
                });
            };
        }
    }, [youtubeResults]);

    // Thêm gửi trạng thái video state
    useEffect(() => {
        // Hàm gửi trạng thái video
        if (isOwner && currentVideoUrl && !showVideoList) {
            // Clear interval cũ nếu có
            if (syncInterval) {
                clearInterval(syncInterval);
            }

            // Tạo interval mới để gửi trạng thái mỗi 5 giây
            const interval = setInterval(sendVideoState, 5000);
            setSyncInterval(interval);
        } else if (syncInterval) {
            // Nếu không thỏa mãn điều kiện và có interval, clear nó
            clearInterval(syncInterval);
            setSyncInterval(null);
        }

        // Cleanup function
        return () => {
            if (syncInterval) {
                clearInterval(syncInterval);
            }
        };
    }, [isOwner, currentVideoUrl, isPlaying, roomId, showVideoList]);

    // Cập nhật refs khi state thay đổi
    useEffect(() => {
        currentVideoUrlRef.current = currentVideoUrl;
    }, [currentVideoUrl]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Fetch Room Info
    

    // Fetch Video List
    useEffect(() => {
        const fetchVideoList = async () => {
            try {
                const response = await fetch('https://colkidclub-hutech.id.vn/api/video/list'); // Fetch video list
                const videos = await response.json();
                setVideoList(videos); // Store video list in state
            } catch (error) {
                console.error("Error fetching video list:", error);
            }
        };

        fetchVideoList();
    }, []);

    // Initialize WebSocket
    useEffect(() => {
        // Tạo hàm khởi tạo đồng bộ
        const initialize = async () => {
            try {
                // 1. Lấy thông tin phòng trước
                const response = await fetch(`https://colkidclub-hutech.id.vn/api/rooms/${roomId}`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const roomData = await response.json();
                setOwnerUsername(roomData.owner_username);
                ownerUsernameRef.current = roomData.owner_username;

                // Kiểm tra ngay lập tức nếu người dùng hiện tại là chủ phòng
                const isCurrentUserOwner = currentUser.username === roomData.owner_username;

                // 2. Sau khi có thông tin phòng, khởi tạo WebSocket
                if (!stompClientRef.current) {
                    const client = new Client({
                        brokerURL: 'wss://rabbitmq.colkidclub-hutech.id.vn/ws',
                        reconnectDelay: 5000,
                        heartbeatIncoming: 10000,
                        heartbeatOutgoing: 10000,
                        onConnect: () => {
                            console.log('WebSocket connected');
                            setConnected(true);
                            setIsWebSocketReady(true);
                            window.stompClientGlobal = client;

                            // Subscribe để nhận tin nhắn video
                            client.subscribe(`/exchange/video.exchange/video.${roomId}`, (message) => {
                                try {
                                    const receivedMessage = JSON.parse(message.body);
                                    console.log('Received video message:', receivedMessage);
                                    handleVideoMessage(receivedMessage);
                                } catch (error) {
                                    console.error('Error parsing video message:', error);
                                }
                            });

                            // Subscribe để nhận tin nhắn chat
                            client.subscribe(`/exchange/chat.exchange/room.${roomId}`, (message) => {
                                try {
                                    const receivedMessage = JSON.parse(message.body);
                                    console.log('Received chat message:', receivedMessage);
                                    handleChatMessage(receivedMessage);
                                } catch (error) {
                                    console.error('Error parsing chat message:', error);
                                }
                            });

                            // Gửi thông báo tham gia
                            const joinMessage = {
                                sender: currentUser.username,
                                avtUrl: currentUser.avtUrl,
                                type: 'JOIN'
                            };

                            client.publish({
                                destination: `/exchange/chat.exchange/room.${roomId}`,
                                body: JSON.stringify(joinMessage),
                            });
                            if (currentUser.username === roomData.owner_username) {
                                setTimeout(() => {
                                    sendRoomLinkMessage();
                                }, 1000); // Pequeño retraso para asegurar que el mensaje de unión se muestre primero
                            }
                            // Xử lý phát video nếu có thông tin từ URL và là chủ phòng
                            if (isCurrentUserOwner && urlVideoId) {
                                // Phát video từ URL ngay lập tức nếu là chủ phòng
                                initializeVideoFromUrlForOwner(client);
                            }
                        },
                        // Các phần xử lý lỗi giữ nguyên
                        onStompError: (frame) => {
                            console.error('Broker reported error: ' + frame.headers['message']);
                            setConnected(false);
                        },
                        onWebSocketClose: () => {
                            console.error('WebSocket connection closed, attempting to reconnect...');
                            setConnected(false);
                        },
                        onWebSocketError: (error) => {
                            console.error('WebSocket error occurred: ', error);
                            setConnected(false);
                        },
                    });

                    stompClientRef.current = client;
                    client.activate();
                }

                // Đánh dấu đã khởi tạo xong
                setIsInitialized(true);

            } catch (error) {
                console.error("Error during initialization:", error);
            }
        };

        initialize();

        // Cleanup khi component unmounts
        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                const leaveMessage = {
                    sender: currentUser.username,
                    avtUrl: currentUser.avtUrl,
                    type: 'LEAVE'
                };

                stompClientRef.current.publish({
                    destination: `/exchange/chat.exchange/room.${roomId}`,
                    body: JSON.stringify(leaveMessage),
                });

                stompClientRef.current.deactivate();
                window.stompClientGlobal = null;
                console.log('WebSocket disconnected');
            }
        };
    }, [roomId, currentUser.username, currentUser.avtUrl, navigate, urlVideoId]);

    // Thêm hàm mới để xử lý phát video cho chủ phòng từ URL
    const initializeVideoFromUrlForOwner = async (client) => {
        if (urlVideoId) {
            try {
                // Fetch video details from YouTube API
                const videoDetailsResponse = await axios.get(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${urlVideoId}&key=${API_KEY}`
                );

                const videoTitle = videoDetailsResponse.data.items[0]?.snippet.title || 'Unknown Video';
                const videoUrl = `https://www.youtube.com/watch?v=${urlVideoId}`;

                // Fetch channel avatar
                let channelAvatar = 'https://i.imgur.com/WxNkK7J.png';
                try {
                    channelAvatar = await fetchYouTubeChannelAvatar(urlVideoId);
                } catch (avatarError) {
                    console.error('Error fetching channel avatar:', avatarError);
                }

                // Set video state
                setCurrentVideoUrl(videoUrl);
                setShowVideoList(false);
                setShowRoomList(false);
                setIsPlaying(autoplay);

                // Gửi thông báo ngay lập tức
                const videoState = {
                    videoUrl: videoUrl,
                    currentTime: 0,
                    isPlaying: autoplay,
                    type: 'VIDEO_UPDATE'
                };

                client.publish({
                    destination: `/exchange/video.exchange/video.${roomId}`,
                    body: JSON.stringify(videoState)
                });

                // Gửi thông báo chat "Now playing" ngay lập tức
                const notificationMessage = {
                    sender: 'Now playing',
                    content: `${videoTitle}`,
                    type: 'CHAT',
                    avtUrl: channelAvatar
                };

                client.publish({
                    destination: `/exchange/chat.exchange/room.${roomId}`,
                    body: JSON.stringify(notificationMessage)
                });

                // Cập nhật thông tin video cho room
                updateRoomVideoInfo(videoUrl, videoTitle);

            } catch (error) {
                console.error('Error fetching video details:', error);

                // Vẫn phát video ngay cả khi không thể lấy được tiêu đề
                const videoUrl = `https://www.youtube.com/watch?v=${urlVideoId}`;
                setCurrentVideoUrl(videoUrl);
                setShowVideoList(false);
                setIsPlaying(autoplay);

                // Gửi thông báo với tiêu đề mặc định
                const videoState = {
                    videoUrl: videoUrl,
                    currentTime: 0,
                    isPlaying: autoplay,
                    type: 'VIDEO_UPDATE'
                };

                client.publish({
                    destination: `/exchange/video.exchange/video.${roomId}`,
                    body: JSON.stringify(videoState)
                });
            }
        }
    };
    // Cuộn xuống cuối chat khi có tin nhắn mới
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Hàm xử lý VIDEO_UPDATE
    const handleVideoUpdate = (message) => {
        console.log('Handling VIDEO_UPDATE:', message);

        if (message.videoUrl) {
            // Nếu không phải chủ phòng thì cập nhật video URL
            if (!isOwner) {
                setCurrentVideoUrl(message.videoUrl);
            }

            // Đóng danh sách video cho TẤT CẢ người dùng khi nhận được video
            setShowVideoList(false);

            if (message.isPlaying !== undefined) {
                setIsPlaying(message.isPlaying);
            }

            if (message.currentTime !== undefined && playerRef.current) {
                const currentPlayerTime = playerRef.current.getCurrentTime();
                // Chỉ tua video nếu chênh lệch thời gian > 2 giây
                if (Math.abs(currentPlayerTime - message.currentTime) > 2) {
                    playerRef.current.seekTo(message.currentTime, 'seconds');
                }
            }
        }
    };
    // Thêm useEffect này vào code của bạn
    useEffect(() => {
        // Khi có video URL, tự động ẩn danh sách video
        if (currentVideoUrl) {
            setShowVideoList(false);
        }
    }, [currentVideoUrl]);
    const processImage = async (file) => {
        return new Promise((resolve) => {
            new Compressor(file, {
                quality: 0.3, // Giảm chất lượng xuống 30%
                maxWidth: 500,
                maxHeight: 500,
                mimeType: 'image/jpeg', // Chuyển đổi sang JPEG
                convertTypes: ['image/png', 'image/webp'], // Chuyển đổi PNG và WebP sang JPEG
                success(result) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result
                            .replace('data:', '')
                            .replace(/^.+,/, '');
                        resolve(base64String);
                    };
                    reader.readAsDataURL(result);
                },
                error(err) {
                    console.error('Image compression failed:', err);
                    resolve(null);
                },
            });
        });
    };

    // Hàm xử lý VIDEO_PLAY
    const handleVideoPlay = (message) => {
        console.log('Handling VIDEO_PLAY:', message);
        if (message.videoUrl) {
            setCurrentVideoUrl(message.videoUrl);
            setIsPlaying(true);
            setShowVideoList(false);
            if (message.currentTime !== undefined && playerRef.current) {
                setTimeout(() => {
                    playerRef.current.seekTo(message.currentTime, 'seconds');
                }, 100);
            }
        }
    };

    // Hàm xử lý VIDEO_PAUSE
    const handleVideoPause = (message) => {
        console.log('Handling VIDEO_PAUSE:', message);
        if (message.videoUrl) {
            setCurrentVideoUrl(message.videoUrl);
            setIsPlaying(false);
            setShowVideoList(false);
            if (message.currentTime !== undefined && playerRef.current) {
                setTimeout(() => {
                    playerRef.current.seekTo(message.currentTime, 'seconds');
                }, 100);
            }
        }
    };

    // Hàm xử lý VIDEO_PROGRESS (tua video)
    const handleVideoProgress = (message) => {
        console.log('Handling VIDEO_PROGRESS:', message);
        if (message.videoUrl) {
            setCurrentVideoUrl(message.videoUrl);
            setShowVideoList(false);
            if (message.currentTime !== undefined && playerRef.current) {
                setTimeout(() => {
                    playerRef.current.seekTo(message.currentTime, 'seconds');
                }, 100);
            }
        }
    };

    const handleReplyMessage = (message) => {
        setSelectedReplyMessage(message);
        inputRef.current.focus();
    };

    // Hàm gửi tin nhắn
    const sendMessage = async () => {
        if (stompClientRef.current && stompClientRef.current.connected && (messageContent.trim() || selectedImage)) {
            let imageData = null;

            // Xử lý ảnh nếu có
            if (selectedImage) {
                imageData = await processImage(selectedImage);
            }

            const chatMessage = {
                id: Date.now(),
                sender: currentUser.username,
                avtUrl: currentUser.avtUrl,
                content: messageContent.trim(),
                image: imageData, // Thêm dữ liệu ảnh đã xử lý
                type: "CHAT",
                replyTo: selectedReplyMessage ? {
                    id: selectedReplyMessage.id,
                    sender: selectedReplyMessage.sender,
                    content: selectedReplyMessage.content
                } : null
            };

            console.log("Sending Message:", chatMessage);

            stompClientRef.current.publish({
                destination: `/exchange/chat.exchange/room.${roomId}`,
                body: JSON.stringify(chatMessage)
            });

            // Reset các state
            setMessageContent('');
            setSelectedImage(null);
            setSelectedReplyMessage(null);
        } else {
            console.error("WebSocket not connected or message is empty.");
        }
    };

    // Hàm xử lý upload ảnh
    const handleImageUpload = (e) => {
        if (e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            inputRef.current.focus();
        }
    };

    // Hàm chọn video để phát
    const playVideo = (video) => {
        if (!isOwner) {
            alert("Chỉ chủ phòng mới có thể chọn video.");
            return;
        }

        const videoUrl = `https://colkidclub-hutech.id.vn/api/video/play/${encodeURIComponent(video.title)}`;
        const videoTitleWithoutExtension = video.title.replace('.mp4', '');

        // If no video is currently playing, play immediately
        if (!currentVideoUrl) {
            setCurrentVideoUrl(videoUrl);
            setShowVideoList(false);
            setIsPlaying(true);
        } else {
            // Add to queue (this will handle duplicate logic)
            addToQueue(video);
            return;
        }

        // Broadcast video state if owner
        if (isOwner) {
            const videoState = {
                videoUrl: videoUrl,
                currentTime: 0,
                isPlaying: true,
                type: 'VIDEO_UPDATE'
            };

            stompClientRef.current.publish({
                destination: `/exchange/video.exchange/video.${roomId}`,
                body: JSON.stringify(videoState)
            });

            // Send chat notification
            const notificationMessage = {
                sender: 'Now playing',
                content: `${videoTitleWithoutExtension}`,
                type: 'CHAT'
            };

            stompClientRef.current.publish({
                destination: `/exchange/chat.exchange/room.${roomId}`,
                body: JSON.stringify(notificationMessage)
            });
        }
    };

    // Hàm tạm dừng video
    const handlePause = () => {
        if (isOwner && isPlaying) { // Chỉ nếu đang phát và là chủ phòng
            console.log('Pausing video');
            setIsPlaying(false);
            const videoState = {
                videoUrl: currentVideoUrl,
                currentTime: playerRef.current.getCurrentTime(),
                type: 'VIDEO_PAUSE'
            };

            stompClientRef.current.publish({
                destination: `/exchange/video.exchange/video.${roomId}`,
                body: JSON.stringify(videoState)
            });
        }
    };

    // Hàm phát video
    const handlePlay = () => {
        if (isOwner && !isPlaying) { // Chỉ nếu đang tạm dừng và là chủ phòng
            console.log('Playing video');
            setIsPlaying(true);
            const videoState = {
                videoUrl: currentVideoUrl,
                currentTime: playerRef.current.getCurrentTime(),
                isPlaying: true,
                type: 'VIDEO_PLAY'
            };

            stompClientRef.current.publish({
                destination: `/exchange/video.exchange/video.${roomId}`,
                body: JSON.stringify(videoState)
            });
        }
    };

    // Hàm gửi tiến trình video khi tua
    const handleProgress = (state) => {
        setProgress(state);
        // Không cần gửi tiến trình liên tục, chỉ gửi khi tua
    };

    const handleSeeking = () => {
        setSeeking(true);
    };

    const handleSeeked = () => {
        setSeeking(false);

        // Chỉ gửi khi người dùng là chủ phòng
        if (isOwner && playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            const videoState = {
                videoUrl: currentVideoUrl,
                currentTime: currentTime,
                type: 'VIDEO_PROGRESS'
            };

            console.log('Sending VIDEO_PROGRESS after seeking:', videoState);

            stompClientRef.current.publish({
                destination: `/exchange/video.exchange/video.${roomId}`,
                body: JSON.stringify(videoState)
            });
        }
    };

    // Hàm show list video
    const handleShowVideoList = () => {
        const newShowVideoList = !showVideoList;
        setShowVideoList(newShowVideoList);

        // If we're opening the video list, close the queue modal
        if (newShowVideoList) {
            setShowQueueModal(false);
            setShowRoomList(false);
            setShowSettings(false);
        }
    };

    // Phần JSX giữ nguyên như code cũ
    return (
        <div className="container">
            {currentVideoUrl && (
                <VideoBackgroundEffect
                    currentVideoUrl={currentVideoUrl}
                    isPlaying={isPlaying}
                    seeking={seeking}
                    progress={progress}
                />
            )}
            <Header
                usersInRoom={usersInRoom}
                onSearchClick={handleShowVideoList}
                onQueueClick={handleQueueClick}
                showCountdown={showCountdown}
                countdown={countdown}
                onRoomListClick={handleRoomListClick}
                onSettingClick={handleSettingsClick}
            />

            <div className="main-content">
                {/* Video Section */}
             

                <div className={`video-section 
    ${showVideoList ? 'with-list' : ''} 
    ${showRoomList ? 'minimized-room-list' : ''}
    ${showSettings ? 'with-settings' : ''}`}>
                    {showEndScreen ? (
                        <VideoEndScreen
                            videoQueue={videoQueue}
                            onVideoSelect={(selectedVideo) => {
                                if (stompClientRef.current && stompClientRef.current.connected) {
                                    const voteMessage = {
                                        type: 'VIDEO_VOTE',
                                        video: selectedVideo,
                                        voter: currentUser.username
                                    };

                                    stompClientRef.current.publish({
                                        destination: `/exchange/chat.exchange/room.${roomId}`,
                                        body: JSON.stringify(voteMessage)
                                    });
                                }
                            }}
                            onVote={handleVoteVideo}
                            containerHeight={playerRef.current?.wrapper?.clientHeight}
                        />
                    ) : (
                        <>
                            {/* Thanh tìm kiếm */}
                            {(showVideoList) && (
                                <>
                                    <div className="search-bar">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="search video, series, or film..."
                                        />
                                    </div>

                                    {isLoading && (
                                        <div className="loading-bar-containerr">
                                            <div className="loading-bar"></div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Video Player */}
                            {currentVideoUrl && (
                                <ReactPlayer
                                    ref={playerRef}
                                    url={currentVideoUrl}
                                    onProgress={handleProgress}
                                    onSeeking={handleSeeking}
                                    onSeeked={handleSeeked}
                                        className={`react-player ${isOwner ? 'owner' : ''} 
    ${showRoomList ? 'minimized-player' : ''} 
    ${showSettings ? 'minimized-player' : ''}`}
                                    playing={isPlaying}
                                    width="100%"
                                    height="100%"
                                    onPause={handlePause}
                                    onPlay={handlePlay}
                                    onProgress={handleProgress}
                                    onEnded={handleVideoEnd}
                                    config={{
                                        file: {
                                            attributes: {
                                                crossOrigin: 'anonymous'
                                            }
                                        },
                                        youtube: {
                                            playerVars: {
                                                controls: 1,
                                                modestbranding: 1,
                                                playsinline: 1,
                                                rel: 0,
                                                showinfo: 0,
                                                iv_load_policy: 3,
                                                fs: 1,
                                            }
                                        }
                                    }}
                                    style={{
                                        pointerEvents: isOwner ? 'auto' : 'none',
                                        objectFit: 'cover'
                                    }}
                                />
                            )}

                                {/* Danh sách video */}
                                {showRoomList && (
                                    <div className="room-list-overlay">
                                        <RoomList />
                                    </div>
                                )}
                                {showSettings && (
                                    <div className="settings-overlay">
                                        <Settings onClose={() => setShowSettings(false)} />
                                    </div>
                                )}
                            {showVideoList && (
                                    <div className="glass-room-list">
                                        {/* YouTube Results */}
                                        {youtubeResults.length > 0 && youtubeResults.map((video) => (
                                            <div
                                                key={video.id.videoId}
                                                className="glass-room-card"
                                                onClick={() => addToQueue(video, true)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="glass-room-content">
                                                    <div className="glass-room-thumbnail">
                                                        <img
                                                            src={video.snippet.thumbnails.medium.url}
                                                            alt={video.snippet.title}
                                                            className="glass-thumbnail-img"
                                                        />
                                                        <div className="glass-thumbnail-overlay">
                                                            <h3 className="glass-video-title-overlay">
                                                                {video.snippet.title}
                                                            </h3>
                                                        </div>
                                                        <div className="glass-play-icon">
                                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M8 5V19L19 12L8 5Z" fill="white" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="glass-room-details">
                                                        <div className="glass-room-name">
                                                            {video.snippet.channelTitle || 'YouTube Video'}
                                                        </div>
                                                        <div className="glass-room-status">
                                                            Add to Queue
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Local Video List */}
                                        {videoList && videoList.length > 0 && videoList.map((video, index) => (
                                            <div
                                                className={`glass-room-card ${!isOwner ? 'disabled-card' : ''}`}
                                                key={index}
                                                onClick={() => playVideo(video)}
                                                style={{ cursor: isOwner ? 'pointer' : 'not-allowed', opacity: isOwner ? 1 : 0.6 }}
                                                title={isOwner ? 'Click to play video' : 'Bạn không có quyền chọn video'}
                                            >
                                                <div className="glass-room-content">
                                                    <div className="glass-room-thumbnail">
                                                        <img
                                                            src={`https://colkidclub-hutech.id.vn/api/video/thumbnail/${encodeURIComponent(video.title.replace('.mp4', '.jpg'))}`}
                                                            alt={`Thumbnail of ${video.title}`}
                                                            crossOrigin="anonymous"
                                                            className="glass-thumbnail-img"
                                                            onError={(e) => {
                                                                e.target.src = 'https://via.placeholder.com/150';
                                                            }}
                                                        />
                                                        <div className="glass-thumbnail-overlay">
                                                            <h3 className="glass-video-title-overlay">
                                                                {video.title}
                                                            </h3>
                                                        </div>
                                                        <div className="glass-play-icon">
                                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M8 5V19L19 12L8 5Z" fill="white" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="glass-room-details">
                                                        <div className="glass-room-name">
                                                            Server Video
                                                        </div>
                                                        <div className="glass-room-status">
                                                            {video.duration || 'Duration unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show message when no videos available */}
                                        {(!videoList || videoList.length === 0) && youtubeResults.length === 0 && (
                                            <div className="no-videos-message">
                                                <p>No videos available. Try searching for YouTube videos.</p>
                                            </div>
                                        )}
                                    </div>
                            )}
                        </>
                    )}
                </div>
                {showSuccessModal && (
                    <div className="success-modal">
                        <p>{successMessage}</p>
                    </div>
                )}
                <VideoQueue
                    isOpen={showQueueModal}
                    onClose={() => setShowQueueModal(false)}
                    videoQueue={videoQueue}
                    onRemoveFromQueue={removeFromQueue}
                    onVote={handleVoteVideo}
                    isOwner={isOwner}
                    currentUser={currentUser}
                />
                <div className="chat-section">
                    <div className="chat-messages" id="chatMessages" ref={chatMessagesRef}>
                        <ul>
                            {messages.map((message, index) => {
                                const isSender = message.sender === currentUser.username;
                                const isSameSenderAsPrevious = index > 0 && message.sender === messages[index - 1]?.sender;
                                const avtUrl = message.avtUrl || 'https://i.imgur.com/WxNkK7J.png';

                                // Kiểm tra xem có phải tin nhắn "Now playing" không
                                const isNowPlayingMessage = message.sender === 'Now playing';

                                // Điều kiện để hiển thị avatar
                                const shouldShowAvatar = !isSender &&
                                    (!isSameSenderAsPrevious || isNowPlayingMessage);

                                // Xử lý tin nhắn hệ thống (JOIN/LEAVE)
                                if (message.type === 'JOIN' || message.type === 'LEAVE') {
                                    return (
                                        <li key={index} className="message-item system-notification">
                                            <div className="system-message-container">
                                                <div className="message-avatar">
                                                    <img src={avtUrl} alt="Avatar" />
                                                </div>
                                                <div className="message-content">
                                                    <em>{message.sender} {message.type === 'JOIN' ? 'has joined' : 'has left'}</em>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                }
                                if (message.isRoomLink) {
                                    return (
                                        <li key={index} className="message-item system-notification">
                                            <div className="system-message-container">
                                                <div className="message-avatar">
                                                    <img src={avtUrl} alt="Avatar" />
                                                </div>
                                                <div className="message-content room-link-message">
                                                    <div className="room-link-text">{message.content}</div>
                                                    <button className="copy-link-button" onClick={handleCopyRoomLink} title="Copy room link">
                                                        <svg className="copy-icon" viewBox="0 0 24 24" width="16" height="16">
                                                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={index} className={`message-item ${isSender ? "sent" : "received"}`}>
                                        {/* Hiển thị Avatar */}
                                        {shouldShowAvatar && (
                                            <div className="message-avatar">
                                                <img src={avtUrl} alt="Avatar" />
                                            </div>
                                        )}

                                        {/* Nếu tin nhắn này là reply, hiển thị tin nhắn được reply bên dưới avatar */}
                                        {message.replyTo && message.replyTo.content && (
                                            <div className={`reply-container ${isSender ? "sent-reply" : "received-reply"}`}>
                                                {isSender ? (
                                                    <div className="reply-header right-align">You replied to {message.replyTo.sender}</div>
                                                ) : (
                                                    <div className="reply-header left-align">{message.sender} replied to you</div>
                                                )}
                                                <div className="reply-message">{message.replyTo.content}</div>
                                            </div>
                                        )}

                                        {/* Hiển thị tên người gửi CHỈ KHI không phải tin nhắn reply */}
                                        {!isSender &&
                                            (!isSameSenderAsPrevious || isNowPlayingMessage) &&
                                            !message.replyTo && (
                                                <strong className="message-sender">{message.sender}</strong>
                                            )}

                                        {/* Nội dung tin nhắn chính */}
                                        <div className={`message-container ${isSender ? "sent-container" : "received-container"}`}>
                                            <div className="message-content">
                                                {message.content && <div className="message-text">{message.content}</div>}
                                                {message.image && (
                                                    <div className="message-image">
                                                        <img
                                                            src={`data:image/png;base64,${message.image}`}
                                                            alt="Sent"
                                                            style={{ maxWidth: '200px', marginTop: '10px' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Nút reply */}
                                        <div
                                            className="message-hover-reply"
                                            onClick={() => {
                                                setSelectedReplyMessage(message);
                                                inputRef.current.focus();
                                            }}
                                        >
                                            <img src="https://i.imgur.com/pI0lxt8.png" alt="Reply" />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Preview reply */}
                    {selectedReplyMessage && (
                        <div className="reply-preview-container">
                            <div className="reply-preview">
                                <div className="reply-header">
                                    <span>Replying to {selectedReplyMessage.sender}</span>
                                    <button
                                        onClick={() => setSelectedReplyMessage(null)}
                                        className="close-reply-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                                <p className="reply-content">
                                    {selectedReplyMessage.content}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Preview ảnh khi chọn */}
                    {selectedImage && (
                        <div className="image-preview-container">
                            <img
                                src={URL.createObjectURL(selectedImage)}
                                alt="Preview"
                                style={{ maxWidth: '200px', marginBottom: '10px' }}
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                style={{ marginLeft: '10px' }}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    <div className="voice-chat-overlay">
                        <VoiceChat
                            roomId={roomId}
                            stompClient={stompClientRef.current}
                            currentUser={currentUser}
                        />
                    </div>
                    {/* Input chat */}
                    <div className="chat-input-container">
                       
                        <input
                            className="chat-input"
                            type="text"
                            value={messageContent}
                            ref={inputRef}
                            onChange={(e) => setMessageContent(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Chat"
                        />

                        {/* Các nút chức năng khác */}
                        <div className="chat-actionns">
                            {/* Nút tag người dùng (@) */}
                            <button className="actionn-button">
                                <svg className="actionn-icon" viewBox="0 0 24 24">
                                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,8.39C13.57,9.4 15.42,10 17.42,10C18.2,10 18.95,9.91 19.67,9.74C19.88,10.45 20,11.21 20,12C20,16.41 16.41,20 12,20C9,20 6.39,18.34 5,15.89L6.61,14V16A1,1 0 0,0 7.61,17A1,1 0 0,0 8.61,16V13A1,1 0 0,0 7.61,12H6.61L5,10.39C5.68,8.93 6.5,7.5 8.07,6.54C8.57,7.38 10.12,8.39 12,8.39M12,6.5C11.5,6.5 11,6.27 10.61,5.88C10.5,5.75 10.5,5.75 10.5,5.75L12.97,5.75C12.97,5.75 12.97,5.75 12.85,5.88C12.5,6.27 12,6.5 12,6.5Z" />
                                </svg>
                            </button>

                            {/* Nút emoji */}
                            <button className="actionn-button">
                                <svg className="actionn-icon" viewBox="0 0 24 24">
                                    <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M7,9.5C7,8.67 7.67,8 8.5,8C9.33,8 10,8.67 10,9.5C10,10.33 9.33,11 8.5,11C7.67,11 7,10.33 7,9.5M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23M15.5,11C14.67,11 14,10.33 14,9.5C14,8.67 14.67,8 15.5,8C16.33,8 17,8.67 17,9.5C17,10.33 16.33,11 15.5,11Z" />
                                </svg>
                            </button>

                            {/* Nút GIF */}
                            <button className="actionn-button">
                                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>GIF</span>
                            </button>

                            {/* Nút upload ảnh */}
                            <label htmlFor="imageUpload" className="actionn-button">
                                <svg className="actionn-icon" viewBox="0 0 24 24">
                                    <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
                                </svg>
                            </label>

                            {/* Nút share */}
                            <button
                                className="actionn-button"
                                onClick={handleCopyRoomLink}
                            >
                                <svg className="actionn-icon" viewBox="0 0 24 24">
                                    <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z" />
                                </svg>
                            </button>
                        </div>

                        {/* Input ẩn cho upload ảnh */}
                        <input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Thông báo kết nối */}
                   
                    {showCopyModal && (
                        <div className="success-modal">
                            <p>Shareable Link Copied to Clipboard</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ChatRoom;