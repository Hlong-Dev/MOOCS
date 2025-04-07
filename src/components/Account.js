// src/components/Account.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../Account.css';

const Account = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState({
        username: 'hlong',
        displayName: 'Hoàng Long',
        email: 'user@example.com',
        avatar: 'https://i.imgur.com/6SqA0B8.png',
    });

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Giải mã token để lấy thông tin người dùng
        try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));

            // Giả sử API lấy thông tin người dùng đầy đủ
            // Trong ứng dụng thực tế, bạn sẽ gọi API để lấy thông tin chi tiết
            setUserProfile({
                username: tokenPayload.sub || 'hlong',
                displayName: tokenPayload.name || 'Hoàng Long',
                email: tokenPayload.email || 'user@example.com',
                avatar: user?.avatar || 'https://i.imgur.com/6SqA0B8.png',
            });
        } catch (error) {
            console.error("Lỗi khi đọc token:", error);
        }
    }, [navigate, user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Make sure we're not clicking the menu toggle button
                const menuButton = document.querySelector('.menu-icon');
                if (!menuButton || !menuButton.contains(event.target)) {
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDeleteAccount = () => {
        // Hiển thị xác nhận trước khi xóa
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
            // API xóa tài khoản sẽ được gọi ở đây
            alert('Tài khoản đã được xóa');
            localStorage.removeItem('token');
            navigate('/login');
        }
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

            {/* Header - Giống trang Home */}
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
            </header>

            {/* Nội dung trang tài khoản */}
            <div className="content account-content">
                <div className="account-card">
                    <div className="account-header">
                        <div className="avatar-container">
                            <img
                                src={userProfile.avatar}
                                alt="Ảnh đại diện người dùng"
                                className="user-avatar"
                            />
                        </div>

                        <div className="user-info">
                            <h2 className="display-name">{userProfile.displayName}</h2>
                            <p className="username">@{userProfile.username}</p>
                        </div>
                    </div>

                    <div className="account-actions">
                        <button onClick={() => navigate('/edit-profile')} className="action-button edit-button">
                            <i className="fas fa-edit"></i> Edit Profile
                        </button>

                        <button onClick={handleLogout} className="action-button logout-button">
                            <i className="fas fa-sign-out-alt"></i> LogOut
                        </button>

                        <button onClick={handleDeleteAccount} className="action-button delete-button">
                            Delete Account
                        </button>
                    </div>

                    <div className="account-details">
                        <div className="detail-section">
                            <h3>Personal Information</h3>
                            <div className="detail-item">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{userProfile.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Join Date:</span>
                                <span className="detail-value">10/03/2025</span>
                            </div>
                        </div>
                    </div>
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
                        <Link to="/friends" className="sidebar-item">
                            <i className="fas fa-user-friends"></i>
                            <span>Friends</span>
                        </Link>
                        <Link to="/account" className="sidebar-item active">
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

export default Account;