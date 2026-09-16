import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [accountType, setAccountType] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanEmail = email.trim().toLowerCase();

        setError("");

        if (!cleanEmail) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/auth/forgot-password/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: cleanEmail,
                    }),
                }
            );

            // =================================================
            // SAFELY READ RESPONSE
            // =================================================

            const contentType =
                response.headers.get("content-type");

            let data = {};

            if (
                contentType &&
                contentType.includes("application/json")
            ) {
                data = await response.json();
            } else {
                const text = await response.text();

                console.error(
                    "SERVER RETURNED NON-JSON:",
                    text
                );

                throw new Error(
                    "Server error. Please try again."
                );
            }

            // =================================================
            // ERROR
            // =================================================

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to send OTP."
                );
            }

            // =================================================
            // CHECK ROLE
            // =================================================

            if (
                data.role !== "jobseeker" &&
                data.role !== "employer"
            ) {
                throw new Error(
                    "Unable to identify your account type."
                );
            }

            // =================================================
            // ACCOUNT TYPE
            // =================================================

            const type =
                data.role === "employer"
                    ? "Employer"
                    : "Job Seeker";

            setAccountType(type);

            // =================================================
            // SHOW SUCCESS MODAL
            // =================================================

            setShowSuccessModal(true);

        } catch (error) {
            console.error(
                "SEND OTP ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to send OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // MODAL OK
    // =====================================================

    function handleModalOK() {
        setShowSuccessModal(false);

        navigate("/verify-otp", {
            state: {
                email: email.trim().toLowerCase(),

                role:
                    accountType === "Employer"
                        ? "employer"
                        : "jobseeker",
            },
        });
    }

    return (
        <div className="jc-forgot">

            <style>{`

                /* =====================================================
                   DESIGN SYSTEM
                ===================================================== */

                .jc-forgot {
                    --navy: #1F3326;
                    --navy3: #2F5233;
                    --cream: #F2F5EF;
                    --lime: #C7E36B;
                    --green: #2F6B45;
                    --ink: #16241C;
                    --muted: #66786C;
                    --line: #E4E9DF;

                    --red: #A8402A;
                    --red-bg: #FBE9E4;

                    --green-bg: #E7F2E0;

                    font-family: "Inter", sans-serif;

                    min-height: 100vh;

                    background: var(--cream);

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    padding: 40px 20px;

                    color: var(--ink);

                    box-sizing: border-box;
                }

                .jc-forgot *,
                .jc-forgot *::before,
                .jc-forgot *::after {
                    box-sizing: border-box;
                }


                /* =====================================================
                   MAIN WRAPPER
                ===================================================== */

                .forgot-wrap {
                    width: 100%;

                    display: flex;
                    justify-content: center;
                }


                /* =====================================================
                   MAIN CARD
                ===================================================== */

                .forgot-card {
                    position: relative;

                    width: 920px;
                    max-width: 100%;

                    min-height: 540px;

                    display: flex;

                    background: #ffffff;

                    border-radius: 18px;

                    overflow: hidden;

                    box-shadow:
                        0 30px 60px -20px
                        rgba(22, 36, 28, 0.28),
                        0 2px 8px
                        rgba(22, 36, 28, 0.10);
                }


                /* =====================================================
                   CENTER SPINE
                ===================================================== */

                .forgot-spine {
                    position: absolute;

                    left: 50%;
                    top: 0;
                    bottom: 0;

                    width: 34px;

                    transform: translateX(-50%);

                    background: linear-gradient(
                        90deg,
                        rgba(0,0,0,0) 0%,
                        rgba(0,0,0,0.10) 30%,
                        rgba(0,0,0,0.16) 50%,
                        rgba(0,0,0,0.10) 70%,
                        rgba(0,0,0,0) 100%
                    );

                    pointer-events: none;

                    z-index: 5;
                }


                /* =====================================================
                   LEFT PANEL
                ===================================================== */

                .forgot-panel {
                    position: relative;

                    padding: 42px 38px;

                    display: flex;
                    flex-direction: column;

                    flex: 1 1 50%;

                    min-width: 0;
                }


                .forgot-left {
                    background: var(--navy);

                    color: #ffffff;
                }


                /* =====================================================
                   BRAND
                ===================================================== */

                .forgot-brand {
                    display: flex;

                    align-items: center;

                    gap: 10px;

                    margin-bottom: 52px;
                }


                .forgot-brand-name {
                    font-size: 16px;

                    font-weight: 700;

                    letter-spacing: -0.2px;

                    color: #ffffff;
                }


                /* =====================================================
                   LEFT CONTENT
                ===================================================== */

                .forgot-headline {
                    font-size: 27px;

                    line-height: 1.25;

                    font-weight: 700;

                    letter-spacing: -0.4px;

                    margin: 0 0 12px;
                }


                .forgot-lead {
                    max-width: 330px;

                    color: #B7C7B9;

                    font-size: 13px;

                    line-height: 1.65;

                    margin: 0 0 32px;
                }


                /* =====================================================
                   FEATURES
                ===================================================== */

                .forgot-features {
                    display: flex;

                    flex-direction: column;

                    gap: 20px;
                }


                .forgot-feature {
                    display: flex;

                    gap: 12px;

                    align-items: flex-start;
                }


                .forgot-feature-icon {
                    width: 32px;
                    height: 32px;

                    flex-shrink: 0;

                    border-radius: 9px;

                    background:
                        rgba(199, 227, 107, 0.14);

                    color: var(--lime);

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    font-size: 14px;

                    font-weight: 700;
                }


                .forgot-feature-title {
                    font-size: 13px;

                    font-weight: 600;

                    color: #ffffff;

                    margin-bottom: 3px;
                }


                .forgot-feature-text {
                    font-size: 11.5px;

                    line-height: 1.5;

                    color: #9DB09F;
                }


                /* =====================================================
                   RIGHT PANEL
                ===================================================== */

                .forgot-right {
                    background: #ffffff;

                    justify-content: center;
                }


                .forgot-form-container {
                    width: 100%;

                    max-width: 350px;

                    margin: auto;
                }


                /* =====================================================
                   ICON
                ===================================================== */

                .forgot-icon {
                    width: 46px;
                    height: 46px;

                    border-radius: 13px;

                    background: #EEF5E5;

                    color: var(--green);

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    font-size: 21px;

                    margin-bottom: 18px;
                }


                /* =====================================================
                   TITLE
                ===================================================== */

                .forgot-title {
                    font-size: 23px;

                    font-weight: 700;

                    color: var(--ink);

                    letter-spacing: -0.3px;

                    margin: 0 0 6px;
                }


                .forgot-subtitle {
                    color: var(--muted);

                    font-size: 12.5px;

                    line-height: 1.6;

                    margin: 0 0 24px;
                }


                /* =====================================================
                   ERROR
                ===================================================== */

                .forgot-error {
                    background: var(--red-bg);

                    color: var(--red);

                    border: 1px solid #F0C3B6;

                    border-radius: 9px;

                    padding: 10px 13px;

                    font-size: 12px;

                    line-height: 1.5;

                    margin-bottom: 16px;
                }


                /* =====================================================
                   FORM
                ===================================================== */

                .forgot-form-group {
                    margin-bottom: 18px;
                }


                .forgot-form-group label {
                    display: block;

                    font-size: 11px;

                    font-weight: 700;

                    letter-spacing: 0.03em;

                    text-transform: uppercase;

                    color: var(--muted);

                    margin-bottom: 7px;
                }


                .forgot-form-group input {
                    width: 100%;

                    padding: 12px 14px;

                    border: 1px solid var(--line);

                    border-radius: 9px;

                    font-size: 13.5px;

                    font-family: inherit;

                    background: #FBFCFA;

                    color: var(--ink);

                    outline: none;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }


                .forgot-form-group input::placeholder {
                    color: #A1ADA5;
                }


                .forgot-form-group input:focus {
                    border-color: var(--navy3);

                    box-shadow:
                        0 0 0 3px
                        rgba(47, 82, 51, 0.08);
                }


                /* =====================================================
                   SEND OTP BUTTON
                ===================================================== */

                .forgot-button {
                    width: 100%;

                    border: none;

                    background: var(--navy3);

                    color: #ffffff;

                    padding: 13px;

                    border-radius: 9px;

                    font-size: 14px;

                    font-weight: 700;

                    font-family: inherit;

                    cursor: pointer;

                    margin-top: 4px;

                    transition:
                        background 0.2s ease,
                        transform 0.15s ease;
                }


                .forgot-button:hover:not(:disabled) {
                    background: var(--navy);

                    transform: translateY(-1px);
                }


                .forgot-button:disabled {
                    opacity: 0.65;

                    cursor: not-allowed;
                }


                /* =====================================================
                   LOGIN LINK
                ===================================================== */

                .forgot-login {
                    text-align: center;

                    font-size: 13px;

                    color: var(--muted);

                    margin-top: 20px;
                }


                .forgot-login a {
                    color: var(--green);

                    font-weight: 600;

                    text-decoration: none;

                    margin-left: 5px;
                }


                .forgot-login a:hover {
                    text-decoration: underline;
                }


                /* =====================================================
                   SUCCESS MODAL OVERLAY
                ===================================================== */

                .forgot-modal-overlay {
                    position: fixed;

                    inset: 0;

                    background:
                        rgba(22, 36, 28, 0.45);

                    backdrop-filter: blur(4px);

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 20px;

                    z-index: 9999;
                }


                /* =====================================================
                   SUCCESS MODAL
                ===================================================== */

                .forgot-success-modal {
                    width: 420px;

                    max-width: 100%;

                    background: #ffffff;

                    border-radius: 18px;

                    padding: 34px 32px 30px;

                    text-align: center;

                    box-shadow:
                        0 30px 70px
                        rgba(22, 36, 28, 0.25);

                    animation:
                        forgotModalIn 0.2s ease-out;
                }


                @keyframes forgotModalIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.98);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }


                /* =====================================================
                   SUCCESS ICON
                ===================================================== */

                .forgot-success-icon {
                    width: 58px;
                    height: 58px;

                    margin: 0 auto 18px;

                    border-radius: 50%;

                    background: #E7F2E0;

                    color: var(--green);

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    font-size: 25px;

                    font-weight: 700;
                }


                .forgot-success-modal h2 {
                    margin: 0 0 10px;

                    font-size: 20px;

                    color: var(--ink);

                    letter-spacing: -0.2px;
                }


                .forgot-success-modal p {
                    margin: 0;

                    color: var(--muted);

                    font-size: 13px;

                    line-height: 1.6;
                }


                .forgot-modal-email {
                    margin-top: 9px !important;

                    color: var(--green) !important;

                    font-weight: 600;

                    word-break: break-word;
                }


                .forgot-modal-note {
                    margin-top: 12px !important;

                    font-size: 12px !important;

                    color: #87958B !important;
                }


                /* =====================================================
                   MODAL BUTTON
                ===================================================== */

                .forgot-modal-button {
                    width: 100%;

                    border: none;

                    background: var(--navy3);

                    color: #ffffff;

                    padding: 12px;

                    border-radius: 9px;

                    font-size: 14px;

                    font-weight: 700;

                    font-family: inherit;

                    cursor: pointer;

                    margin-top: 24px;
                }


                .forgot-modal-button:hover {
                    background: var(--navy);
                }


                /* =====================================================
                   RESPONSIVE
                ===================================================== */

                @media (max-width: 760px) {

                    .jc-forgot {
                        padding: 20px 14px;
                    }


                    .forgot-card {
                        flex-direction: column;

                        min-height: auto;
                    }


                    .forgot-spine {
                        display: none;
                    }


                    .forgot-left {
                        order: 2;
                    }


                    .forgot-right {
                        order: 1;
                    }


                    .forgot-panel {
                        padding: 32px 26px;
                    }


                    .forgot-brand {
                        margin-bottom: 28px;
                    }


                    .forgot-headline {
                        font-size: 23px;
                    }


                    .forgot-form-container {
                        max-width: 100%;
                    }

                }

            `}</style>


            {/* =====================================================
                MAIN CARD
            ===================================================== */}

            <div className="forgot-wrap">

                <div className="forgot-card">

                    <div className="forgot-spine"></div>


                    {/* =================================================
                        LEFT PANEL
                    ================================================= */}

                    <div className="forgot-panel forgot-left">

                        <div className="forgot-brand">

                            <svg
                                width="26"
                                height="26"
                                viewBox="0 0 56 56"
                            >
                                <circle
                                    cx="20"
                                    cy="28"
                                    r="9"
                                    fill="#2F5233"
                                />

                                <circle
                                    cx="38"
                                    cy="28"
                                    r="9"
                                    fill="#C7E36B"
                                />

                                <rect
                                    x="20"
                                    y="26"
                                    width="18"
                                    height="4"
                                    fill="#2F5233"
                                />
                            </svg>

                            <div className="forgot-brand-name">
                                Job Connect
                            </div>

                        </div>


                        <h2 className="forgot-headline">
                            Secure access to your account.
                        </h2>


                        <p className="forgot-lead">
                            Don't worry — we'll help you get
                            back into your Job Connect account
                            quickly and securely.
                        </p>


                        <div className="forgot-features">

                            <div className="forgot-feature">

                                <div className="forgot-feature-icon">
                                    ✓
                                </div>

                                <div>
                                    <div className="forgot-feature-title">
                                        Secure account recovery
                                    </div>

                                    <div className="forgot-feature-text">
                                        Your account information remains
                                        protected throughout the recovery
                                        process.
                                    </div>
                                </div>

                            </div>


                            <div className="forgot-feature">

                                <div className="forgot-feature-icon">
                                    ✦
                                </div>

                                <div>
                                    <div className="forgot-feature-title">
                                        OTP verification
                                    </div>

                                    <div className="forgot-feature-text">
                                        Verify your identity using a
                                        secure six-digit OTP.
                                    </div>
                                </div>

                            </div>


                            <div className="forgot-feature">

                                <div className="forgot-feature-icon">
                                    🛡
                                </div>

                                <div>
                                    <div className="forgot-feature-title">
                                        Protected information
                                    </div>

                                    <div className="forgot-feature-text">
                                        Your personal information is
                                        kept safe and private.
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        RIGHT PANEL
                    ================================================= */}

                    <div className="forgot-panel forgot-right">

                        <div className="forgot-form-container">

                            <div className="forgot-icon">
                                🔐
                            </div>


                            <h1 className="forgot-title">
                                Forgot your password?
                            </h1>


                            <p className="forgot-subtitle">
                                Enter your registered email address.
                                We'll send you a one-time password
                                to verify your account.
                            </p>


                            {/* ERROR */}

                            {error && (
                                <div className="forgot-error">
                                    {error}
                                </div>
                            )}


                            <form onSubmit={handleSubmit}>

                                <div className="forgot-form-group">

                                    <label htmlFor="email">
                                        EMAIL ADDRESS
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(
                                                e.target.value
                                            );

                                            if (error) {
                                                setError("");
                                            }
                                        }}
                                        autoComplete="email"
                                        required
                                    />

                                </div>


                                <button
                                    type="submit"
                                    className="forgot-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Sending OTP..."
                                        : "Send OTP →"
                                    }
                                </button>

                            </form>


                            <div className="forgot-login">

                                Remember your password?

                                <Link to="/login">
                                    Log in
                                </Link>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =====================================================
                SUCCESS MODAL
            ===================================================== */}

            {showSuccessModal && (

                <div
                    className="forgot-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget
                        ) {
                            setShowSuccessModal(false);
                        }
                    }}
                >

                    <div className="forgot-success-modal">

                        <div className="forgot-success-icon">
                            ✓
                        </div>


                        <h2>
                            OTP Sent Successfully
                        </h2>


                        <p>
                            An OTP has been sent to your
                            registered {accountType} email address.
                        </p>


                        <p className="forgot-modal-email">
                            {email.trim().toLowerCase()}
                        </p>


                        <p className="forgot-modal-note">
                            Please check your inbox and enter
                            the 6-digit OTP to continue.
                        </p>


                        <button
                            type="button"
                            className="forgot-modal-button"
                            onClick={handleModalOK}
                        >
                            Continue
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ForgotPassword;