
import React, { useState } from 'react';
import axios from 'axios';
import '../Login.css'; // Import file CSS để định dạng giao diện

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Đang gửi:', { username, password }); // Debug dữ liệu gửi đi

        try {
            const response = await axios.post('https://colkidclub-hutech.id.vn/api/auth/login',
                {
                    username,
                    password
                },
                {
                    headers: {
                        'Content-Type': 'application/json', // Đảm bảo content type giống Postman
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Phản hồi từ server:', response.data); // Xem phản hồi đầy đủ

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                window.location.href = '/';
            } else {
                console.error('Không có token trong phản hồi:', response.data);
                setError('Phản hồi không chứa token');
            }
        } catch (error) {
            console.error('Chi tiết lỗi:', error.response ? error.response.data : error);
            // Hiển thị lỗi cụ thể từ server nếu có
            setError(error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
        }
    };

    const handleBack = () => {
        window.location.href = 'http://localhost:3000/';
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src="https://i.imgur.com/Rp89NPj.png" alt="Logo" className="login-logo" /> {/* Thay logo-url bằng đường dẫn của logo */}
                <h2>Sign-In to watch with friends</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSubmit} className="login-form">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            className="login-input"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="login-input"
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <button onClick={handleBack} className="back-button">Back</button>
                <p className="help-text">
                    Having trouble? <a href="/register">Get help</a> or <a href="/register">Sign up</a>
                </p>

            </div>
        </div>
    );
};

export default Login;
