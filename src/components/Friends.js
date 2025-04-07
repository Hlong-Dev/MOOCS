// src/components/Friends.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../Friends.css';

const Friends = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'recents', 'blocked'

    // Dữ liệu mẫu
    const [friendsData, setFriendsData] = useState({
        friends: Array(91).fill().map((_, i) => ({
            id: `friend-${i}`,
            username: `user${i}`,
            displayName: `Sample ${i}`,
            avatar: `https://i.pravatar.cc/150?img=${i % 70}`,
            online: Math.random() > 0.3,
            lastSeen: new Date(Date.now() - Math.random() * 10000000000)
        })),
        requests: Array(1).fill().map((_, i) => ({
            id: `request-${i}`,
            username: `newuser${i}`,
            displayName: `New user Sample ${i}`,
            avatar: `https://i.pravatar.cc/150?img=${(i + 70) % 70}`,
            requestDate: new Date(Date.now() - Math.random() * 1000000000)
        })),
        recents: Array(491).fill().map((_, i) => ({
            id: `recent-${i}`,
            username: `recentuser${i}`,
            displayName: `Recent User ${i}`,
            avatar: `https://i.pravatar.cc/150?img=${(i + 30) % 70}`,
            lastInteraction: new Date(Date.now() - Math.random() * 5000000000)
        })),
        blocked: Array(5).fill().map((_, i) => ({
            id: `blocked-${i}`,
            username: `blockeduser${i}`,
            displayName: `Blocked User ${i}`,
            avatar: `https://i.pravatar.cc/150?img=${(i + 50) % 70}`,
            blockedDate: new Date(Date.now() - Math.random() * 20000000000)
        }))
    });

    // Lọc dữ liệu theo tìm kiếm
    const filteredData = {
        friends: friendsData.friends.filter(friend =>
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        requests: friendsData.requests.filter(request =>
            request.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        recents: friendsData.recents.filter(recent =>
            recent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recent.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        blocked: friendsData.blocked.filter(blocked =>
            blocked.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blocked.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
    };

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Đảm bảo không click vào nút menu
                const menuButton = document.querySelector('.menu-icon');
                if (!menuButton || !menuButton.contains(event.target)) {
                    setIsSidebarOpen(false);
                }
            }
        };

        // Thêm event listener chỉ khi sidebar mở
        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Format thời gian
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    };

    // Xử lý chấp nhận lời mời kết bạn
    const handleAcceptRequest = (requestId) => {
        // Thêm vào danh sách bạn bè
        const request = friendsData.requests.find(r => r.id === requestId);
        setFriendsData(prev => ({
            ...prev,
            friends: [...prev.friends, { ...request, online: false, lastSeen: new Date() }],
            requests: prev.requests.filter(r => r.id !== requestId)
        }));
    };

    // Xử lý từ chối lời mời kết bạn
    const handleRejectRequest = (requestId) => {
        setFriendsData(prev => ({
            ...prev,
            requests: prev.requests.filter(r => r.id !== requestId)
        }));
    };

    // Xử lý chặn người dùng
    const handleBlockUser = (userId, source) => {
        const user = friendsData[source].find(u => u.id === userId);
        setFriendsData(prev => ({
            ...prev,
            [source]: prev[source].filter(u => u.id !== userId),
            blocked: [...prev.blocked, { ...user, blockedDate: new Date() }]
        }));
    };

    // Xử lý bỏ chặn
    const handleUnblockUser = (userId) => {
        setFriendsData(prev => ({
            ...prev,
            blocked: prev.blocked.filter(u => u.id !== userId)
        }));
    };

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

            {/* Header - Tương tự trang Home */}
            <header className="header">
                <div className="top-bar">
                    <div className="menu-icon" onClick={toggleSidebar}>
                        <span>&#9776;</span>
                    </div>
                    <div className="logo">
                        <img src="https://i.imgur.com/Mwphh0y.png" alt="CineMate" />
                    </div>
                </div>
                <div className="divider"></div>

                <div className="search-bar">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="Find friend..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* Nội dung trang bạn bè */}
            <div className="friends-content">
                <div className="friends-tabs">
                    <div
                        className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        <i className="fas fa-user-friends"></i>
                        <span>Friends ({friendsData.friends.length})</span>
                    </div>

                    <div
                        className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        <i className="fas fa-user-plus"></i>
                        <span>Request ({friendsData.requests.length})</span>
                    </div>

                    <div
                        className={`friends-tab ${activeTab === 'recents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recents')}
                    >
                        <i className="fas fa-history"></i>
                        <span>Recent ({friendsData.recents.length})</span>
                    </div>

                    <div
                        className={`friends-tab ${activeTab === 'blocked' ? 'active' : ''}`}
                        onClick={() => setActiveTab('blocked')}
                    >
                        <i className="fas fa-ban"></i>
                        <span>Blocked</span>
                    </div>
                </div>

                <div className="friends-list-container">
                    {activeTab === 'friends' && (
                        <div className="friends-list">
                            {filteredData.friends.length > 0 ? (
                                filteredData.friends.map(friend => (
                                    <div key={friend.id} className="friend-item">
                                        <div className="friend-avatar">
                                            <img src={friend.avatar} alt={friend.displayName} />
                                            <span className={`status-indicator ${friend.online ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <div className="friend-info">
                                            <div className="friend-name">{friend.displayName}</div>
                                            <div className="friend-username">@{friend.username}</div>
                                            {!friend.online && (
                                                <div className="last-seen">
                                                    Online {formatTimeAgo(friend.lastSeen)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="friend-actions">
                                            <button className="action-buttonN message-btn">
                                                <i className="fas fa-comment-alt"></i>
                                            </button>
                                            <button className="action-buttonN more-btn">
                                                <i className="fas fa-ellipsis-v"></i>
                                                <div className="action-dropdown">
                                                    <div className="dropdown-item" onClick={() => { }}>
                                                        <i className="fas fa-film"></i> Watch Movie
                                                    </div>
                                                    <div className="dropdown-item" onClick={() => { }}>
                                                        <i className="fas fa-user-minus"></i> Unfriend
                                                    </div>
                                                    <div className="dropdown-item" onClick={() => handleBlockUser(friend.id, 'friends')}>
                                                        <i className="fas fa-ban"></i> Block
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-users-slash"></i>
                                        <p>No friends found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="friends-list">
                            {filteredData.requests.length > 0 ? (
                                filteredData.requests.map(request => (
                                    <div key={request.id} className="friend-item request-item">
                                        <div className="friend-avatar">
                                            <img src={request.avatar} alt={request.displayName} />
                                        </div>
                                        <div className="friend-info">
                                            <div className="friend-name">{request.displayName}</div>
                                            <div className="friend-username">@{request.username}</div>
                                            <div className="request-time">
                                                Invitation sent {formatTimeAgo(request.requestDate)}
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="action-buttonN accept-btn"
                                                onClick={() => handleAcceptRequest(request.id)}
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                            <button
                                                className="action-buttonN reject-btn"
                                                onClick={() => handleRejectRequest(request.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-user-plus"></i>
                                        <p>No friend requests</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'recents' && (
                        <div className="friends-list">
                            {filteredData.recents.length > 0 ? (
                                filteredData.recents.map(recent => (
                                    <div key={recent.id} className="friend-item">
                                        <div className="friend-avatar">
                                            <img src={recent.avatar} alt={recent.displayName} />
                                        </div>
                                        <div className="friend-info">
                                            <div className="friend-name">{recent.displayName}</div>
                                            <div className="friend-username">@{recent.username}</div>
                                            <div className="last-interaction">
                                                Interact {formatTimeAgo(recent.lastInteraction)}
                                            </div>
                                        </div>
                                        <div className="friend-actions">
                                            <button className="action-buttonN add-friend-btn">
                                                <i className="fas fa-user-plus"></i>
                                            </button>
                                            <button className="action-buttonN more-btn">
                                                <i className="fas fa-ellipsis-v"></i>
                                                <div className="action-dropdown">
                                                    <div className="dropdown-item" onClick={() => { }}>
                                                        <i className="fas fa-user-plus"></i> Add friend
                                                    </div>
                                                    <div className="dropdown-item" onClick={() => handleBlockUser(recent.id, 'recents')}>
                                                        <i className="fas fa-ban"></i> Block
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-history"></i>
                                    <p>Không có tương tác gần đây</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'blocked' && (
                        <div className="friends-list">
                            {filteredData.blocked.length > 0 ? (
                                filteredData.blocked.map(blocked => (
                                    <div key={blocked.id} className="friend-item blocked-item">
                                        <div className="friend-avatar blocked">
                                            <img src={blocked.avatar} alt={blocked.displayName} />
                                            <div className="blocked-overlay">
                                                <i className="fas fa-ban"></i>
                                            </div>
                                        </div>
                                        <div className="friend-info">
                                            <div className="friend-name">{blocked.displayName}</div>
                                            <div className="friend-username">@{blocked.username}</div>
                                            <div className="blocked-time">
                                                Blocked {formatTimeAgo(blocked.blockedDate)}
                                            </div>
                                        </div>
                                        <div className="friend-actions">
                                            <button
                                                className="action-buttonN unblock-btn"
                                                onClick={() => handleUnblockUser(blocked.id)}
                                            >
                                                <i className="fas fa-unlock"></i> UnBlock
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-ban"></i>
                                    <p>No user blocked</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar - Giống trang Home */}
            {isSidebarOpen && <div className="sidebar-overlay"></div>}
            <nav ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-content">
                    <div className="sidebar-section">
                        <Link to="/" className="sidebar-item">
                            <i className="fas fa-globe"></i>
                            <span>CineMate</span>
                        </Link>
                        <Link to="/friends" className="sidebar-item active">
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

export default Friends;