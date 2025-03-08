import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoomList.css';

const RoomList = ({ searchTerm = '' }) => {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch("https://colkidclub-hutech.id.vn/api/rooms", {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                const roomsData = await response.json();
                // Xử lý để lấy video ID từ các định dạng URL khác nhau của YouTube
                const processedRooms = roomsData.map(room => {
                    let videoId = null;
                    // Sửa thành current_video_url (chữ thường)
                    if (room.current_video_url) {
                        // Xử lý các định dạng URL khác nhau
                        if (room.current_video_url.includes('youtu.be/')) {
                            videoId = room.current_video_url.split('youtu.be/')[1]?.split('?')[0];
                        } else if (room.current_video_url.includes('youtube.com/watch')) {
                            videoId = room.current_video_url.split('v=')[1]?.split('&')[0];
                        }
                        if (videoId) {
                            return {
                                ...room,
                                videoThumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                                videoId: videoId
                            };
                        }
                    }
                    return room;
                });
                setRooms(processedRooms);
            } catch (error) {
                console.error("Error fetching rooms:", error);
                setError("Có lỗi xảy ra khi tải danh sách phòng.");
            }
        };
        fetchRooms();
        const interval = setInterval(fetchRooms, 5000);
        return () => clearInterval(interval);
    }, []);

    // Hàm xử lý điều hướng với video
    const handleRoomJoin = (room) => {
        // Sửa thành current_video_url (chữ thường)
        if (room.current_video_url) {
            // Nếu có video, chuyển hướng với thông tin video
            navigate(`/room/${room.id}?videoId=${room.videoId}&autoplay=true`);
        } else {
            // Nếu không có video, chuyển hướng bình thường
            navigate(`/room/${room.id}`);
        }
    };

    // Lọc phòng theo từ khóa tìm kiếm
    const filteredRooms = searchTerm
        ? rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (room.current_video_title && room.current_video_title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : rooms;

    if (error) return <div className="glass-error-message">{error}</div>;

    // Kiểm tra nếu không có phòng nào sau khi lọc

    return (
        <div className="glass-room-container">
           
            <div className="glass-room-list">
                {filteredRooms.map(room => (
                    <div
                        key={room.id}
                        className="glass-room-card"
                        onClick={() => handleRoomJoin(room)}
                    >
                        <div className="glass-room-content">
                            <div className="glass-room-thumbnail">
                                <img
                                    src={room.videoThumbnail || room.thumbnail}
                                    alt={room.current_video_title || room.name}
                                    className="glass-thumbnail-img"
                                />
                                <div className="glass-play-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5V19L19 12L8 5Z" fill="white" />
                                    </svg>
                                </div>
                            </div>
                            <div className="glass-room-details">
                                <h3 className="glass-video-title">
                                    {room.current_video_title || 'Chưa có video đang phát'}
                                </h3>
                                <div className="glass-room-name">
                                    {room.name}
                                </div>
                                <div className="glass-room-status">
                                    {room.current_video_url ? 'Playing' : 'Empty Room'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomList;