// src/components/Settings.js
import React, { useState, useRef, useContext, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    // State để theo dõi panel nào đang mở
    const [expandedPanel, setExpandedPanel] = useState(null); // 'privacy', 'playback', 'voice' hoặc null
    const [activeTab, setActiveTab] = useState('rave'); // 'rave', 'preferences', 'audio'

    // Cài đặt mặc định cho các tab
    const [settings, setSettings] = useState({
        // Cài đặt Rave
        privacy: {
            mode: 'public', // 'public', 'nearby', 'friends', 'private'
            isPublic: true,
        },
        playback: {
            mode: 'vote', // 'leader', 'autoplay', 'play', 'vote'
            enableVoting: true,
        },
        voice: {
            mode: 'on', // 'off', 'on'
            micsDefaultOn: true,
        },

        // Cài đặt Preferences
        language: 'English',
        background: 'Background - Light',
        notifications: {
            invites: true,
            missedChat: true,
            clipboard: true,
        },
        hideLocation: false,
        restrictInvites: false,
        hideMatureContent: false,
        doNotShare: false,
        updateChannel: 'stable',
        preciseSync: true,
        pinnedRaves: true,
        ravifyWebview: true,
        windowSettings: {
            openOnStartup: false,
            startMinimized: false,
        },

        // Cài đặt Audio
        speaker: 'default',
        incomingVoiceVolume: 90,
        mediaVolume: 30,
        microphone: 'default',
        noiseGate: 50,
        noiseSupression: true,
    });

    // Xử lý thay đổi cài đặt
    const handleToggle = (category, setting, value = null) => {
        setSettings(prev => {
            const newSettings = { ...prev };

            if (value !== null) {
                // Nếu value được cung cấp, sử dụng nó
                if (typeof newSettings[category] === 'object' && newSettings[category] !== null) {
                    newSettings[category][setting] = value;
                } else {
                    newSettings[category] = value;
                }
            } else {
                // Nếu không, chỉ toggle giá trị boolean
                if (typeof newSettings[category] === 'object' && newSettings[category] !== null) {
                    newSettings[category][setting] = !newSettings[category][setting];
                } else {
                    newSettings[category] = !newSettings[category];
                }
            }

            return newSettings;
        });
    };

    // Hàm toggle panel
    const togglePanel = (panel) => {
        if (expandedPanel === panel) {
            setExpandedPanel(null);
        } else {
            setExpandedPanel(panel);
        }
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

    // Xử lý thay đổi tùy chọn trong PRIVACY, PLAYBACK, VOICE
    const handleOptionChange = (category, mode) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            newSettings[category].mode = mode;

            // Cập nhật các trạng thái liên quan
            if (category === 'privacy') {
                newSettings[category].isPublic = mode === 'public';
            } else if (category === 'playback') {
                newSettings[category].enableVoting = mode === 'vote';
            } else if (category === 'voice') {
                newSettings[category].micsDefaultOn = mode === 'on';
            }

            return newSettings;
        });
    };

    // Xử lý thay đổi slider
    const handleSliderChange = (category, setting, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            if (typeof newSettings[category] === 'object' && newSettings[category] !== null) {
                newSettings[category][setting] = value;
            } else {
                newSettings[setting] = value;
            }
            return newSettings;
        });
    };

    return (
        <>
            

            {/* Nội dung trang cài đặt */}
            <div className="settings-contentt">
                <div className="settings-tabs">
                    <div
                        className={`settings-tab ${activeTab === 'rave' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rave')}
                    >
                        <i className="fas fa-film"></i>
                        <span>CineMate</span>
                    </div>

                    <div
                        className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        <i className="fas fa-sliders-h"></i>
                        <span>Preferences</span>
                    </div>

                    <div
                        className={`settings-tab ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        <i className="fas fa-microphone"></i>
                        <span>Audio</span>
                    </div>
                </div>

                <div className="settings-panel">
                    {/* Tab Rave */}
                    {activeTab === 'rave' && (
                        <div className="settings-section rave-section">
                            <div className="setting-card">
                                <div className="setting-card-content" onClick={() => togglePanel('privacy')}>
                                    <div className="setting-header">
                                        <h2>PRIVACY</h2>
                                        <p>
                                            {settings.privacy.mode === 'public' ? 'Anyone can join the rave' :
                                                settings.privacy.mode === 'nearby' ? 'Only people nearby can join' :
                                                    settings.privacy.mode === 'friends' ? 'Only friends can join' :
                                                        'Invite only - private room'}
                                        </p>
                                    </div>
                                    <div className="setting-control">
                                        <div className={`status-badge ${settings.privacy.mode}`}>
                                            {settings.privacy.mode.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className={`setting-options ${expandedPanel === 'privacy' ? 'expanded' : 'collapsed'}`}>
                                    <div className="option-row">
                                        <div
                                            className={`option-item ${settings.privacy.mode === 'public' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('privacy', 'public')}
                                        >
                                            <i className="fas fa-globe"></i>
                                            <span>PUBLIC</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.privacy.mode === 'nearby' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('privacy', 'nearby')}
                                        >
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>NEARBY</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.privacy.mode === 'friends' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('privacy', 'friends')}
                                        >
                                            <i className="fas fa-user-friends"></i>
                                            <span>FRIENDS</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.privacy.mode === 'private' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('privacy', 'private')}
                                        >
                                            <i className="fas fa-lock"></i>
                                            <span>PRIVATE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="setting-card">
                                <div className="setting-card-content" onClick={() => togglePanel('playback')}>
                                    <div className="setting-header">
                                        <h2>PLAYBACK</h2>
                                        <p>
                                            {settings.playback.mode === 'leader' ? 'Only room leader controls playback' :
                                                settings.playback.mode === 'autoplay' ? 'Videos play automatically' :
                                                    settings.playback.mode === 'play' ? 'Simple play/pause controls' :
                                                        'Voting occurs during the video'}
                                        </p>
                                    </div>
                                    <div className="setting-control">
                                        <div className={`status-badge ${settings.playback.mode}`}>
                                            {settings.playback.mode === 'leader' ? "LEADER'S CHOICE" :
                                                settings.playback.mode === 'autoplay' ? "AUTOPLAY" :
                                                    settings.playback.mode === 'play' ? "JUST PLAY" : "LET'S VOTE"}
                                        </div>
                                    </div>
                                </div>
                                <div className={`setting-options ${expandedPanel === 'playback' ? 'expanded' : 'collapsed'}`}>
                                    <div className="option-row">
                                        <div
                                            className={`option-item ${settings.playback.mode === 'leader' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('playback', 'leader')}
                                        >
                                            <i className="fas fa-crown"></i>
                                            <span>LEADER'S CHOICE</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.playback.mode === 'autoplay' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('playback', 'autoplay')}
                                        >
                                            <i className="fas fa-forward"></i>
                                            <span>AUTOPLAY</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.playback.mode === 'play' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('playback', 'play')}
                                        >
                                            <i className="fas fa-play"></i>
                                            <span>JUST PLAY</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.playback.mode === 'vote' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('playback', 'vote')}
                                        >
                                            <i className="fas fa-check-circle"></i>
                                            <span>LET'S VOTE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="setting-card">
                                <div className="setting-card-content" onClick={() => togglePanel('voice')}>
                                    <div className="setting-header">
                                        <h2>VOICE</h2>
                                        <p>
                                            {settings.voice.mode === 'on' ? 'Mics default to on' :
                                                'Mics default to off'}
                                        </p>
                                    </div>
                                    <div className="setting-control">
                                        <div className={`status-badge ${settings.voice.mode}`}>
                                            {settings.voice.mode.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className={`setting-options ${expandedPanel === 'voice' ? 'expanded' : 'collapsed'}`}>
                                    <div className="option-row">
                                        <div
                                            className={`option-item ${settings.voice.mode === 'off' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('voice', 'off')}
                                        >
                                            <i className="fas fa-microphone-slash"></i>
                                            <span>OFF</span>
                                        </div>
                                        <div
                                            className={`option-item ${settings.voice.mode === 'on' ? 'active' : ''}`}
                                            onClick={() => handleOptionChange('voice', 'on')}
                                        >
                                            <i className="fas fa-microphone"></i>
                                            <span>ON</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rave-settings-list">
                                <div className="setting-group">
                                    <div className="setting-label">
                                        <i className="fas fa-language"></i>
                                        <span>Auto-Translate Chat</span>
                                    </div>
                                    <div className="setting-control">
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.autoTranslateChat}
                                                onChange={() => handleToggle('autoTranslateChat')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <div className="setting-label">
                                        <i className="fas fa-sign-out-alt"></i>
                                        <span>Hide join/left messages</span>
                                    </div>
                                    <div className="setting-control">
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.hideJoinLeftMessages}
                                                onChange={() => handleToggle('hideJoinLeftMessages')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <div className="setting-label">
                                        <i className="fas fa-users"></i>
                                        <span>Participants panel on the left</span>
                                    </div>
                                    <div className="setting-control">
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.participantsPanelLeft}
                                                onChange={() => handleToggle('participantsPanelLeft')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Preferences */}
                    {activeTab === 'preferences' && (
                        <div className="settings-section preferences-section">
                            <div className="preferences-row">
                                {/* Cột bên trái */}
                                <div className="preferences-column">
                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-language"></i>
                                            <span>Language</span>
                                        </div>
                                        <div className="setting-control select-control">
                                            <select
                                                value={settings.language}
                                                onChange={(e) => handleToggle('language', null, e.target.value)}
                                            >
                                                <option value="English">English</option>
                                                <option value="Tiếng Việt">Tiếng Việt</option>
                                                <option value="Español">Español</option>
                                                <option value="Français">Français</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-image"></i>
                                            <span>Background</span>
                                        </div>
                                        <div className="setting-control select-control">
                                            <select
                                                value={settings.background}
                                                onChange={(e) => handleToggle('background', null, e.target.value)}
                                            >
                                                <option value="Background - Light">Background - Light</option>
                                                <option value="Background - Dark">Background - Dark</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-bell"></i>
                                            <span>Notifications</span>
                                        </div>
                                    </div>

                                    <div className="setting-subgroup">
                                        <div className="setting-label sub-label">
                                            <span>• Invites</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.invites}
                                                    onChange={() => handleToggle('notifications', 'invites')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-subgroup">
                                        <div className="setting-label sub-label">
                                            <span>• Missed chat</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.missedChat}
                                                    onChange={() => handleToggle('notifications', 'missedChat')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-subgroup">
                                        <div className="setting-label sub-label">
                                            <span>• Clipboard</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.clipboard}
                                                    onChange={() => handleToggle('notifications', 'clipboard')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-window-maximize"></i>
                                            <span>Window settings</span>
                                        </div>
                                    </div>

                                    <div className="setting-subgroup">
                                        <div className="setting-label sub-label">
                                            <span>• Open on startup</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.windowSettings.openOnStartup}
                                                    onChange={() => handleToggle('windowSettings', 'openOnStartup')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-subgroup">
                                        <div className="setting-label sub-label">
                                            <span>• Start minimized</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.windowSettings.startMinimized}
                                                    onChange={() => handleToggle('windowSettings', 'startMinimized')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Cột bên phải */}
                                <div className="preferences-column">
                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>Hide Location</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.hideLocation}
                                                    onChange={() => handleToggle('hideLocation')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-lock"></i>
                                            <span>Restrict invites</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.restrictInvites}
                                                    onChange={() => handleToggle('restrictInvites')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-eye-slash"></i>
                                            <span>Hide mature content</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.hideMatureContent}
                                                    onChange={() => handleToggle('hideMatureContent')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-database"></i>
                                            <span>Do not share my data with third parties</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.doNotShare}
                                                    onChange={() => handleToggle('doNotShare')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-code-branch"></i>
                                            <span>Update Channel</span>
                                        </div>
                                        <div className="setting-control select-control">
                                            <select
                                                value={settings.updateChannel}
                                                onChange={(e) => handleToggle('updateChannel', null, e.target.value)}
                                            >
                                                <option value="stable">stable</option>
                                                <option value="beta">beta</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-sync"></i>
                                            <span>Precise sync</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.preciseSync}
                                                    onChange={() => handleToggle('preciseSync')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-thumbtack"></i>
                                            <span>Pinned raves</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.pinnedRaves}
                                                    onChange={() => handleToggle('pinnedRaves')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <div className="setting-label">
                                            <i className="fas fa-graduation-cap"></i>
                                            <span>Ravify webview</span>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.ravifyWebview}
                                                    onChange={() => handleToggle('ravifyWebview')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Audio */}
                    {activeTab === 'audio' && (
                        <div className="settings-section">
                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-volume-up"></i>
                                    <span>Speaker</span>
                                </div>
                                <div className="setting-control select-control">
                                    <select
                                        value={settings.speaker}
                                        onChange={(e) => handleToggle('speaker', null, e.target.value)}
                                    >
                                        <option value="default">default</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-users"></i>
                                    <span>Incoming Voice Volume</span>
                                </div>
                                <div className="setting-control slider-control">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.incomingVoiceVolume}
                                        onChange={(e) => handleSliderChange('incomingVoiceVolume', null, parseInt(e.target.value))}
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-film"></i>
                                    <span>Media Volume</span>
                                </div>
                                <div className="setting-control slider-control">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.mediaVolume}
                                        onChange={(e) => handleSliderChange('mediaVolume', null, parseInt(e.target.value))}
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-microphone"></i>
                                    <span>Microphone</span>
                                </div>
                                <div className="setting-control select-control">
                                    <select
                                        value={settings.microphone}
                                        onChange={(e) => handleToggle('microphone', null, e.target.value)}
                                    >
                                        <option value="default">default</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-filter"></i>
                                    <span>Noise gate</span>
                                </div>
                                <div className="setting-control slider-control">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.noiseGate}
                                        onChange={(e) => handleSliderChange('noiseGate', null, parseInt(e.target.value))}
                                        className="slider noise-gate-slider"
                                    />
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-label">
                                    <i className="fas fa-volume-mute"></i>
                                    <span>Noise Suppression</span>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.noiseSupression}
                                            onChange={() => handleToggle('noiseSupression')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="setting-group audio-test">
                                <button className="test-button">Test</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar - Giống trang Home */}
            {isSidebarOpen && <div className="sidebar-overlay"></div>}
          
        </>
    );
};

export default Settings;