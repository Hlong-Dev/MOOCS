// Header.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBars, faCog, faSearch, faCheck, faUserFriends, faGlobe, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import '../Header.css';
import { getUserFromToken } from '../utils/jwtUtils';

const Header = ({ usersInRoom, onSearchClick, onQueueClick, showCountdown, countdown, onRoomListClick, onSettingClick }) => {
    // ... => {
    const { roomId } = useParams(); // Lấy roomId từ URL
    const [showPopup, setShowPopup] = useState(false);
    const [showUserList, setShowUserList] = useState(false); // Trạng thái để hiển thị danh sách người dùng
    const navigate = useNavigate();
    const [ownerUsername, setOwnerUsername] = useState('');
    const currentUser = getUserFromToken();

    // Fetch thông tin phòng để biết ai là chủ phòng
    useEffect(() => {
        const fetchRoomInfo = async () => {
            try {
                const response = await fetch(`https://colkidclub-hutech.id.vn/api/rooms/${roomId}`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const roomData = await response.json();
                    setOwnerUsername(roomData.owner_username);
                }
            } catch (error) {
                console.error("Error fetching room info:", error);
            }
        };

        fetchRoomInfo();
    }, [roomId]);

    const handleLeaveClick = () => {
        setShowPopup(true); // Hiển thị popup khi bấm nút X
    };

    const handleLeaveConfirm = async () => {
        setShowPopup(false);

        // Kiểm tra xem người dùng hiện tại có phải là chủ phòng không
        const isOwner = currentUser.username === ownerUsername;

        try {
            // Nếu là chủ phòng, gửi thông báo OWNER_LEFT trước khi rời phòng
            if (isOwner) {
                try {
                    // Lấy stompClient từ biến toàn cục
                    const stompClient = window.stompClientGlobal;

                    if (stompClient && stompClient.connected) {
                        console.log('Sending OWNER_LEFT message before leaving room');

                        const ownerLeftMessage = {
                            type: 'OWNER_LEFT',
                            sender: currentUser.username,
                            roomId: roomId
                        };

                        stompClient.publish({
                            destination: `/exchange/chat.exchange/room.${roomId}`,
                            body: JSON.stringify(ownerLeftMessage)
                        });

                        // Đợi một chút để tin nhắn được gửi đi
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                        console.error('StompClient not connected or not available');
                    }
                } catch (wsError) {
                    console.error('Error sending WebSocket message:', wsError);
                    // Tiếp tục xử lý ngay cả khi có lỗi WebSocket
                }
            }

            // Gửi request xóa phòng/rời phòng đến server
            console.log("Sending DELETE request to server...");
            const response = await fetch(`https://colkidclub-hutech.id.vn/api/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: currentUser.username
                })
            });

            if (response.ok) {
                console.log("Room deleted/left successfully");
            } else {
                console.warn("Error response from server:", await response.text());
            }

            // Luôn chuyển về trang chủ, kể cả có lỗi
            navigate('/home');
        } catch (error) {
            console.error('Error leaving room:', error);
            // Vẫn chuyển về trang chủ ngay cả khi có lỗi
            navigate('/home');
        }
    };

    const handleStay = () => {
        setShowPopup(false); // Ẩn popup khi chọn "Stay"
    };

    const toggleUserList = () => {
        setShowUserList(!showUserList); // Toggle hiển thị danh sách người dùng
    };

    // JSX không thay đổi...
    return (
        <div className="headerr">
            <div className="top-bar">
                <div className="item" onClick={handleLeaveClick}>
                    <FontAwesomeIcon icon={faTimes} className="icon" />
                </div>
                <div className="item" onClick={onRoomListClick}>
                    <FontAwesomeIcon icon={faBars} className="icon" />
                </div>
                <div className="item" onClick={onSettingClick}>
                    <FontAwesomeIcon icon={faCog} className="icon" />
                </div>
                <div className="item" onClick={onSearchClick}>
                    <FontAwesomeIcon icon={faSearch} className="icon" />
                </div>

                {/* Placeholder để giữ khoảng trống */}
                <div className="item placeholder"></div>

                {/* Logo/Countdown được position absolute */}
                <div className="item logo">
                    {showCountdown ? (
                        <div className="countdown-container">
                            <svg viewBox="0 0 40 40">
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="none"
                                    stroke="#666"
                                    strokeWidth="2"
                                />
                                <text
                                    x="20"
                                    y="20"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill="#fff"
                                    fontSize="20"
                                    fontWeight="bold"
                                >
                                    {countdown}
                                </text>
                            </svg>
                        </div>
                    ) : (
                        <img src="https://i.imgur.com/Mwphh0y.png" alt="Cinemate" />
                    )}
                </div>

                <div className="item" onClick={onQueueClick}>
                    <FontAwesomeIcon icon={faCheck} className="icon" />
                </div>
                <div className="item">
                    <FontAwesomeIcon icon={faUserFriends} className="icon" />
                </div>
                <div className="item">
                    <FontAwesomeIcon icon={faGlobe} className="icon" />
                </div>
                <div className="item" onClick={toggleUserList}>
                    <FontAwesomeIcon icon={faUsers} className="icon" />
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Leave the CINEMATE?</p>
                        <div className="popup-buttons">
                            <button className="popup-button" onClick={handleStay}>Stay</button>
                            <button className="popup-button" onClick={handleLeaveConfirm}>Leave</button>
                        </div>
                    </div>
                </div>
            )}

            {showUserList && (
                <div className="user-list">
                    <div className="user-list-header">
                        <p>Users in Room</p>
                    </div>
                    <ul>
                        {usersInRoom.map((user, index) => (
                            <li key={index}>
                                <img src="https://i.imgur.com/Tr9qnkI.jpeg" alt="Avatar" className="user-avatar" />
                                <span>{user}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Header;