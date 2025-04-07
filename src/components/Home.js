// src/components/Home.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import LogoutButton from './LogoutButton';
import RoomList from '../RoomList';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Home.css';

const Home = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { user } = useContext(AuthContext);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Make sure we're not clicking the menu toggle button
                const menuButton = document.querySelector('.menu-icon');
                if (!menuButton.contains(event.target)) {
                    setIsSidebarOpen(false);
                }
            }
        };

        // Add event listener only when sidebar is open
        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    // Tự động ẩn thông báo lỗi sau một khoảng thời gian
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Hàm hiển thị thông báo lỗi
    const showErrorMessage = (message) => {
        setErrorMessage(message);
    };

    const createRoomWithVideo = async (videoId, videoTitle) => {
        try {
            const token = localStorage.getItem('token');

            // Kiểm tra xem token có tồn tại không
            if (!token) {
                // Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
                navigate('/login');
                return;
            }

            // Kiểm tra kết nối mạng
            if (!navigator.onLine) {
                showErrorMessage("Không thể tạo phòng. Vui lòng kiểm tra kết nối mạng và thử lại.");
                return;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const username = tokenPayload.sub;

            const response = await fetch("https://colkidclub-hutech.id.vn/api/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: username,
                    name: `Phòng của ${username}`,
                    thumbnail: "https://i.imgur.com/6SqA0B8.png",
                    current_video_url: `https://www.youtube.com/watch?v=${videoId}`,
                    current_video_title: videoTitle
                })
            });

            if (response.ok) {
                const newRoom = await response.json();
                navigate(`/room/${newRoom.id}?videoId=${videoId}&autoplay=true`);
            } else {
                console.error("Failed to create room");
                showErrorMessage("Không thể tạo phòng. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Error creating room:", error);
            if (!navigator.onLine || error.message.includes('network') || error.message.includes('fetch')) {
                // Hiển thị thông báo lỗi mạng
                showErrorMessage("Không thể tạo phòng. Vui lòng kiểm tra kết nối mạng và thử lại.");
            } else {
                // Hiển thị thông báo lỗi chung
                showErrorMessage("Đã xảy ra lỗi khi tạo phòng. Vui lòng thử lại sau.");
            }
        }
    };

    const createRoom = async () => {
        try {
            const token = localStorage.getItem('token');

            // Kiểm tra token
            if (!token) {
                navigate('/login');
                return;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const username = tokenPayload.sub;

            const response = await fetch("https://colkidclub-hutech.id.vn/api/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: username,
                    name: `Phòng của ${username}`,
                    thumbnail: "https://i.imgur.com/6SqA0B8.png",
                })
            });

            if (response.ok) {
                const newRoom = await response.json();
                navigate(`/room/${newRoom.id}`);
            } else {
                console.error("Failed to create room");
                showErrorMessage("Không thể tạo phòng. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Error creating room:", error);
            showErrorMessage("Đã xảy ra lỗi khi tạo phòng. Vui lòng thử lại sau.");
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const API_KEY = 'AIzaSyD9hNv29hep7MhOqBdpeh21HFBBfSxCTXY';

    // Thêm function search YouTube
    const searchYoutubeVideos = async (term) => {
        try {
            if (!term.trim()) {
                setYoutubeResults([]);
                setIsLoading(false);
                setImagesLoaded(0);
                return;
            }

            setIsLoading(true);
            setImagesLoaded(0);
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${term}&type=video&key=${API_KEY}&maxResults=20`
            );
            setYoutubeResults(response.data.items);
        } catch (error) {
            console.error('Error fetching YouTube results:', error);
            setIsLoading(false);
            setImagesLoaded(0);
            showErrorMessage("Không thể tải video. Vui lòng kiểm tra kết nối mạng và thử lại.");
        }
    };

    // Debounce search to reduce API calls
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                searchYoutubeVideos(searchTerm);
            } else {
                setYoutubeResults([]);
                setIsLoading(false);
                setImagesLoaded(0);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Track image loading
    useEffect(() => {
        if (youtubeResults.length > 0) {
            // Reset image load tracking
            setImagesLoaded(0);

            // Create image loaders for each thumbnail
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

            // Cleanup function to remove image loaders
            return () => {
                imageLoaders.forEach(img => {
                    img.onload = null;
                    img.onerror = null;
                });
            };
        }
    }, [youtubeResults]);

    // Automatically stop loading when all images are loaded
    useEffect(() => {
        if (youtubeResults.length > 0 && imagesLoaded === youtubeResults.length) {
            setIsLoading(false);
        }
    }, [imagesLoaded, youtubeResults]);

    return (
        <>
            <div className="animated-background">
                <div className="blur-circles">
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                    <div className="blur-circle"></div>
                </div>
                <div className="blur-overlay"></div>
            </div>

            {/* Hiển thị thông báo lỗi */}
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}

            <header className="header">
                <div className="top-bar">
                    <div className="menu-icon" onClick={toggleSidebar}>
                        <span>&#9776;</span>
                    </div>
                    <div className="logo">
                        <img src="https://i.imgur.com/Mwphh0y.png" alt="YouTube" />
                    </div>
                </div>

                <div className="divider"></div>

                <div className="search-bar">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="search video, series, or film..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* Loading bar */}
            {isLoading && (
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>
            )}

            {/* Hiển thị kết quả tìm kiếm video */}
            {youtubeResults.length > 0 && (
                <>
                    <div className="section-title">Video từ YouTube</div>
                    <div className="youtube-results-row">
                        {youtubeResults.map((video) => (
                            <div
                                key={video.id.videoId}
                                className="video-card"
                                onClick={() => createRoomWithVideo(video.id.videoId, video.snippet.title)}
                            >
                                <img
                                    src={video.snippet.thumbnails.medium.url}
                                    alt={video.snippet.title}
                                    className="video-thumbnail"
                                />
                                <div className="video-info">
                                    <h3>{video.snippet.title}</h3>
                                    <p>{video.snippet.channelTitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Hiển thị các dịch vụ khi không có tìm kiếm */}
            {!searchTerm && (
                <div className="services">
                    <div className="service-item">
                        <img src="https://i.imgur.com/Q1iIpAE.png" alt="YouTube" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/xn6Ehfv.png" alt="Twitch" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/Vf6tfih.png" alt="Netflix" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/yN245me.png" alt="Disney+" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/zgsS7Of.png" alt="Prime Video" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/axFodMO.png" alt="Playlist" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/gNSGsSN.png" alt="tubi" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/MEXsqoF.png" alt="gg" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/QMVPZjU.png" alt="gg drive" className="white-icon" />
                    </div>
                    <div className="service-item">
                        <img src="https://i.imgur.com/s2O07An.png" alt="Playlist" />
                    </div>
                </div>
            )}

            <div className="content">
                {!searchTerm && (
                    <div className="toggle-container">
                        <span className="toggle-label">Hide mature content</span>
                        <label className="toggle-switch">
                            <input type="checkbox" />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                )}

                {/* Luôn truyền searchTerm xuống RoomList */}
                <RoomList searchTerm={searchTerm} />
            </div>

            {isSidebarOpen && <div className="sidebar-overlay"></div>}
            <nav ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-content">
                    <div className="sidebar-section">
                        <Link to="/" className="sidebar-item active">
                            <i className="fas fa-globe"></i>
                            <span>CineMate</span>
                        </Link>
                        <Link to="/friends" className="sidebar-item">
                            <i className="fas fa-user-friends"></i>
                            <span>Friends</span>
                        </Link>
                        <Link to="/account" className="sidebar-item">
                            <i className="fas fa-user"></i>
                            <span>My Account</span>
                        </Link>
                        <Link to="/premium" className="sidebar-item">
                            <i className="fas fa-crown"></i>
                            <span>CineMate Premium</span>
                        </Link>
                        <Link to="/settings" className="sidebar-item">
                            <i className="fas fa-cog"></i>
                            <span>App Settings</span>
                        </Link>
                    </div>

                    <div className="sidebar-section">
                        {user ? (
                            <div className="sidebar-item" onClick={() => {
                                // Xử lý logout
                                localStorage.removeItem('token');
                                navigate('/login');
                                window.location.reload(); // Reload để cập nhật trạng thái
                            }}>
                                <i className="fas fa-sign-out-alt"></i>
                                <span>Log Out</span>
                            </div>
                        ) : (
                            <Link to="/login" className="sidebar-item">
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Login</span>
                            </Link>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <a href="https://rave.io" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fas fa-r"></i>
                            <span>CineMate.io</span>
                        </a>
                        <a href="https://instagram.com/getraveapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-instagram"></i>
                            <span>@getcinemateapp</span>
                        </a>
                        <a href="https://twitter.com/raveapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-twitter"></i>
                            <span>@cineapp</span>
                        </a>
                        <a href="https://facebook.com/Getrave" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-facebook-f"></i>
                            <span>@Getcinemate</span>
                        </a>
                        <a href="https://tiktok.com/@raveapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-tiktok"></i>
                            <span>@cineapp</span>
                        </a>
                        <Link to="/shop" className="sidebar-item">
                            <i className="fas fa-tshirt"></i>
                            <span>Shop</span>
                        </Link>
                    </div>

                    <div className="sidebar-footer">
                        <div className="version-info">
                            <span>Cinemate v.1.5.2.62 Open Beta</span>
                            <span>Copyright ©️ 2024–2025 Apple Inc. All rights reserved.</span>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Home;