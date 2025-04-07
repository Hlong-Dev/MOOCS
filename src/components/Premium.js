// src/components/Premium.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../Premium.css';

const Premium = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState("free");
    const [paymentMethod, setPaymentMethod] = useState("visa");
    const [showSuccess, setShowSuccess] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expDate, setExpDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get user information from token
    const [userProfile, setUserProfile] = useState({
        username: 'hlong',
        displayName: 'Hoang Long',
        email: 'user@example.com',
        plan: 'free', // Default is free
    });

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Decode token to get user information
        try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));

            setUserProfile({
                username: tokenPayload.sub || 'hlong',
                displayName: tokenPayload.name || 'Hoang Long',
                email: tokenPayload.email || 'user@example.com',
                plan: tokenPayload.plan || 'free',
            });
        } catch (error) {
            console.error("Error reading token:", error);
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

    const selectPlan = (plan) => {
        setSelectedPlan(plan);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate card data
        if (cardNumber.length < 16 || cardName.length < 3 || expDate.length < 5 || cvv.length < 3) {
            alert("Please enter complete card information");
            return;
        }

        setIsSubmitting(true);

        // Simulate payment process
        setTimeout(() => {
            setIsSubmitting(false);

            // Update user plan (simulation)
            const updatedUserProfile = { ...userProfile, plan: selectedPlan };
            setUserProfile(updatedUserProfile);

            // Show success message
            setShowSuccess(true);

            // Automatically close notification after 3 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        }, 2000);
    };

    const formatCardNumber = (value) => {
        const val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = val.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const handleCardNumberChange = (e) => {
        const formattedValue = formatCardNumber(e.target.value);
        setCardNumber(formattedValue);
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

            {/* Header - Same as Home page */}
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

            {/* Success notification */}
            {showSuccess && (
                <div className="success-popup">
                    <div className="success-content">
                        <div className="success-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2>Payment Successful!</h2>
                        <p>You have upgraded to the {selectedPlan === 'standard' ? 'Standard' : 'Premium'} plan</p>
                        <p>Thank you for using CineMate!</p>
                    </div>
                </div>
            )}

            {/* Premium page content */}
            <div className="content premium-content">
                <div className="premium-container">
                    <div className="premium-header">
                        <h1>Upgrade Your CineMate Experience</h1>
                        <p>Choose the best plan and enjoy exclusive features</p>
                    </div>

                    <div className="plans-container">
                        {/* Free Plan */}
                        <div
                            className={`plan-card ${selectedPlan === 'free' ? 'selected' : ''} ${userProfile.plan === 'free' ? 'current-plan' : ''}`}
                            onClick={() => selectPlan('free')}
                        >
                            <div className="plan-header">
                                <h2>Free</h2>
                                <div className="plan-price">
                                    <span className="price">$0</span>
                                    <span className="period">/month</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <ul>
                                    <li><i className="fas fa-check"></i> Watch with ads</li>
                                    <li><i className="fas fa-check"></i> SD quality</li>
                                    <li><i className="fas fa-check"></i> 1 device at a time</li>
                                    <li><i className="fas fa-times"></i> No exclusive content</li>
                                    <li><i className="fas fa-times"></i> No offline downloads</li>
                                </ul>
                            </div>
                            {userProfile.plan === 'free' && (
                                <div className="current-plan-badge">
                                    Current Plan
                                </div>
                            )}
                        </div>

                        {/* Standard Plan */}
                        <div
                            className={`plan-card ${selectedPlan === 'standard' ? 'selected' : ''} ${userProfile.plan === 'standard' ? 'current-plan' : ''}`}
                            onClick={() => selectPlan('standard')}
                        >
                            <div className="plan-header">
                                <h2>Standard</h2>
                                <div className="plan-price">
                                    <span className="price">$4.99</span>
                                    <span className="period">/month</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <ul>
                                    <li><i className="fas fa-check"></i> Ad-free experience</li>
                                    <li><i className="fas fa-check"></i> HD quality</li>
                                    <li><i className="fas fa-check"></i> 2 devices at a time</li>
                                    <li><i className="fas fa-check"></i> Some exclusive content</li>
                                    <li><i className="fas fa-check"></i> Offline downloads</li>
                                </ul>
                            </div>
                            {userProfile.plan === 'standard' && (
                                <div className="current-plan-badge">
                                    Current Plan
                                </div>
                            )}
                        </div>

                        {/* Premium Plan */}
                        <div
                            className={`plan-card ${selectedPlan === 'premium' ? 'selected' : ''} ${userProfile.plan === 'premium' ? 'current-plan' : ''}`}
                            onClick={() => selectPlan('premium')}
                        >
                            <div className="plan-ribbon">Best Value</div>
                            <div className="plan-header">
                                <h2>Premium</h2>
                                <div className="plan-price">
                                    <span className="price">$8.99</span>
                                    <span className="period">/month</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <ul>
                                    <li><i className="fas fa-check"></i> Ad-free experience</li>
                                    <li><i className="fas fa-check"></i> 4K + HDR quality</li>
                                    <li><i className="fas fa-check"></i> 4 devices at a time</li>
                                    <li><i className="fas fa-check"></i> All exclusive content</li>
                                    <li><i className="fas fa-check"></i> Unlimited offline downloads</li>
                                    <li><i className="fas fa-check"></i> Priority 24/7 support</li>
                                </ul>
                            </div>
                            {userProfile.plan === 'premium' && (
                                <div className="current-plan-badge">
                                    Current Plan
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedPlan !== 'free' && selectedPlan !== userProfile.plan && (
                        <div className="payment-section">
                            <h2>Payment Information</h2>

                            <div className="payment-methods">
                                <div className="method-header">
                                    <h3>Choose Payment Method</h3>
                                </div>
                                <div className="method-options">
                                    <div
                                        className={`method-card ${paymentMethod === 'visa' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('visa')}
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" />
                                    </div>
                                    <div
                                        className={`method-card ${paymentMethod === 'mastercard' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('mastercard')}
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" />
                                    </div>
                                    <div
                                        className={`method-card ${paymentMethod === 'momo' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('momo')}
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" />
                                    </div>
                                    <div
                                        className={`method-card ${paymentMethod === 'vnpay' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('vnpay')}
                                    >
                                        <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png" alt="VNPAY" />
                                    </div>
                                </div>
                            </div>

                            <form className="payment-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Card Number</label>
                                    <div className="card-input">
                                        <i className={`fab fa-${paymentMethod === 'mastercard' ? 'cc-mastercard' : 'cc-visa'}`}></i>
                                        <input
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            maxLength="19"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Name on Card</label>
                                    <input
                                        type="text"
                                        placeholder="JOHN DOE"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Expiration Date</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expDate}
                                            onChange={(e) => setExpDate(e.target.value)}
                                            maxLength="5"
                                            required
                                        />
                                    </div>

                                    <div className="form-group half">
                                        <label>CVV</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                            maxLength="3"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="payment-summary">
                                    <div className="summary-item">
                                        <span>Plan:</span>
                                        <span>{selectedPlan === 'standard' ? 'Standard' : 'Premium'}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Billing Cycle:</span>
                                        <span>Monthly</span>
                                    </div>
                                    <div className="summary-item total">
                                        <span>Total Payment:</span>
                                        <span>{selectedPlan === 'standard' ? '$4.99' : '$8.99'}</span>
                                    </div>
                                </div>

                                <button className="payment-button" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="spinner"><i className="fas fa-circle-notch fa-spin"></i></span>
                                    ) : (
                                        <span>Pay Now</span>
                                    )}
                                </button>

                                <div className="payment-note">
                                    <p>
                                        <i className="fas fa-lock"></i> Your payment information is secure
                                    </p>
                                    <p className="terms-text">
                                        By clicking "Pay Now", you agree to CineMate's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                                    </p>
                                </div>
                            </form>
                        </div>
                    )}

                    {(selectedPlan === userProfile.plan && selectedPlan !== 'free') && (
                        <div className="current-plan-info">
                            <div className="info-icon">
                                <i className="fas fa-info-circle"></i>
                            </div>
                            <h2>You are currently using the {selectedPlan === 'standard' ? 'Standard' : 'Premium'} plan</h2>
                            <p>Your plan will automatically renew on April 15, 2025</p>
                            <button className="cancel-button">
                                Cancel Subscription
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar - Same as Home page */}
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
                        <Link to="/account" className="sidebar-item">
                            <i className="fas fa-user"></i>
                            <span>My Account</span>
                        </Link>
                        <Link to="/premium" className="sidebar-item active">
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
                                // Handle logout
                                localStorage.removeItem('token');
                                navigate('/login');
                                window.location.reload(); // Reload to update state
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
                        <a href="https://cinemate.io" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fas fa-r"></i>
                            <span>CineMate.io</span>
                        </a>
                        <a href="https://instagram.com/getcinemateapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-instagram"></i>
                            <span>@getcinemateapp</span>
                        </a>
                        <a href="https://twitter.com/cineapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-twitter"></i>
                            <span>@cineapp</span>
                        </a>
                        <a href="https://facebook.com/Getcinemate" target="_blank" rel="noopener noreferrer" className="sidebar-item">
                            <i className="fab fa-facebook-f"></i>
                            <span>@Getcinemate</span>
                        </a>
                        <a href="https://tiktok.com/@cineapp" target="_blank" rel="noopener noreferrer" className="sidebar-item">
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

export default Premium;