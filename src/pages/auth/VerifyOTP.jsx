import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function VerifyOTP() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    // =====================================================
    // SUBMIT OTP
    // =====================================================

    async function handleSubmit(e) {
        e.preventDefault();

        if (otp.length !== 6) {
            setModalType("error");
            setModalTitle("Invalid OTP");
            setModalMessage("Please enter the 6-digit OTP.");
            setShowModal(true);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE}/auth/verify-otp/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        otp: otp,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setModalType("success");
                setModalTitle("OTP Verified");
                setModalMessage(
                    data.message ||
                    "Your OTP has been verified successfully."
                );
                setShowModal(true);
            } else {
                setModalType("error");
                setModalTitle("Verification Failed");
                setModalMessage(
                    data.message ||
                    data.detail ||
                    "The OTP is invalid or expired."
                );
                setShowModal(true);
            }
        } catch (error) {
            console.error("OTP verification error:", error);

            setModalType("error");
            setModalTitle("Something went wrong");
            setModalMessage(
                "Unable to verify the OTP. Please try again."
            );
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    function closeModal() {
        setShowModal(false);
    }

    // =====================================================
    // MODAL OK
    // =====================================================

    function handleModalOK() {
        setShowModal(false);

        if (modalType === "success") {
            navigate("/reset-password", {
                state: {
                    email: email,
                    otp: otp,
                },
            });
        }
    }

    // =====================================================
    // RETURN
    // =====================================================

    return (
        <div className="jc-verify">

            <style>{`

                /* =====================================================
                   DESIGN SYSTEM
                ===================================================== */

                .jc-verify {
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

                    min-height: 100vh;
                    width: 100%;

                    background: var(--cream);

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    padding: 40px 20px;

                    color: var(--ink);

                    font-family:
                        "Inter",
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;

                    box-sizing: border-box;
                }

                .jc-verify *,
                .jc-verify *::before,
                .jc-verify *::after {
                    box-sizing: border-box;
                }


                /* =====================================================
                   WRAPPER
                ===================================================== */

                .verify-wrap {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }


                /* =====================================================
                   MAIN CARD
                ===================================================== */

                .verify-card {
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

                .verify-spine {
                    position: absolute;

                    left: 50%;
                    top: 0;
                    bottom: 0;

                    width: 34px;

                    transform: translateX(-50%);

                    background: linear-gradient(
                        90deg,
                        rgba(0, 0, 0, 0) 0%,
                        rgba(0, 0, 0, 0.10) 30%,
                        rgba(0, 0, 0, 0.16) 50%,
                        rgba(0, 0, 0, 0.10) 70%,
                        rgba(0, 0, 0, 0) 100%
                    );

                    pointer-events: none;

                    z-index: 5;
                }


                /* =====================================================
                   PANELS
                ===================================================== */

                .verify-panel {
                    position: relative;

                    padding: 42px 38px;

                    display: flex;
                    flex-direction: column;

                    flex: 1 1 50%;

                    min-width: 0;
                }


                /* =====================================================
                   LEFT PANEL
                ===================================================== */

                .verify-left {
                    background: var(--navy);
                    color: #ffffff;
                }


                /* =====================================================
                   BRAND
                ===================================================== */

                .verify-brand {
                    display: flex;
                    align-items: center;

                    gap: 10px;

                    margin-bottom: 52px;
                }

                .verify-brand-name {
                    font-size: 16px;
                    font-weight: 700;

                    letter-spacing: -0.2px;

                    color: #ffffff;
                }


                /* =====================================================
                   LEFT CONTENT
                ===================================================== */

                .verify-headline {
                    font-size: 27px;
                    line-height: 1.25;

                    font-weight: 700;

                    letter-spacing: -0.4px;

                    margin: 0 0 12px;
                }

                .verify-lead {
                    max-width: 330px;

                    color: #B7C7B9;

                    font-size: 13px;
                    line-height: 1.65;

                    margin: 0 0 32px;
                }


                /* =====================================================
                   FEATURES
                ===================================================== */

                .verify-features {
                    display: flex;
                    flex-direction: column;

                    gap: 20px;
                }

                .verify-feature {
                    display: flex;

                    gap: 12px;

                    align-items: flex-start;
                }

                .verify-feature-icon {
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

                .verify-feature-title {
                    font-size: 13px;

                    font-weight: 600;

                    color: #ffffff;

                    margin-bottom: 3px;
                }

                .verify-feature-text {
                    font-size: 11.5px;

                    line-height: 1.5;

                    color: #9DB09F;
                }


                /* =====================================================
                   RIGHT PANEL
                ===================================================== */

                .verify-right {
                    background: #ffffff;

                    justify-content: center;
                }

                .verify-form-container {
                    width: 100%;

                    max-width: 350px;

                    margin: auto;
                }


                /* =====================================================
                   ICON
                ===================================================== */

                .verify-icon {
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

                .verify-title {
                    font-size: 23px;

                    font-weight: 700;

                    color: var(--ink);

                    letter-spacing: -0.3px;

                    margin: 0 0 6px;
                }

                .verify-subtitle {
                    color: var(--muted);

                    font-size: 12.5px;

                    line-height: 1.6;

                    margin: 0 0 24px;
                }


                /* =====================================================
                   EMAIL
                ===================================================== */

                .verify-email-box {
                    background: #F5F8F2;

                    border: 1px solid var(--line);

                    border-radius: 9px;

                    padding: 10px 13px;

                    margin-bottom: 18px;

                    color: var(--green);

                    font-size: 12px;

                    font-weight: 600;

                    word-break: break-word;
                }


                /* =====================================================
                   FORM
                ===================================================== */

                .verify-form-group {
                    margin-bottom: 18px;
                }

                .verify-form-group label {
                    display: block;

                    font-size: 11px;

                    font-weight: 700;

                    letter-spacing: 0.03em;

                    text-transform: uppercase;

                    color: var(--muted);

                    margin-bottom: 7px;
                }


                /* =====================================================
                   OTP INPUT
                ===================================================== */

                .verify-form-group input {
                    width: 100%;

                    padding: 13px 14px;

                    border: 1px solid var(--line);

                    border-radius: 9px;

                    font-size: 18px;

                    font-weight: 700;

                    letter-spacing: 6px;

                    text-align: center;

                    font-family: inherit;

                    background: #FBFCFA;

                    color: var(--ink);

                    outline: none;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .verify-form-group input::placeholder {
                    color: #A1ADA5;

                    letter-spacing: 1px;

                    font-size: 13px;

                    font-weight: 400;
                }

                .verify-form-group input:focus {
                    border-color: var(--navy3);

                    box-shadow:
                        0 0 0 3px
                        rgba(47, 82, 51, 0.08);
                }


                /* =====================================================
                   VERIFY BUTTON
                ===================================================== */

                .verify-button {
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

                .verify-button:hover:not(:disabled) {
                    background: var(--navy);

                    transform: translateY(-1px);
                }

                .verify-button:disabled {
                    opacity: 0.65;

                    cursor: not-allowed;
                }


                /* =====================================================
                   POPUP
                ===================================================== */

                .verify-modal-overlay {
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

                .verify-modal {
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
                        verifyModalIn 0.2s ease-out;
                }


                @keyframes verifyModalIn {
                    from {
                        opacity: 0;

                        transform:
                            translateY(10px)
                            scale(0.98);
                    }

                    to {
                        opacity: 1;

                        transform:
                            translateY(0)
                            scale(1);
                    }
                }


                /* =====================================================
                   MODAL ICON
                ===================================================== */

                .verify-success-icon,
                .verify-error-icon {
                    width: 58px;
                    height: 58px;

                    margin: 0 auto 18px;

                    border-radius: 50%;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    font-size: 25px;

                    font-weight: 700;
                }

                .verify-success-icon {
                    background: #E7F2E0;

                    color: var(--green);
                }

                .verify-error-icon {
                    background: var(--red-bg);

                    color: var(--red);
                }


                /* =====================================================
                   MODAL TEXT
                ===================================================== */

                .verify-modal h2 {
                    margin: 0 0 10px;

                    font-size: 20px;

                    color: var(--ink);

                    letter-spacing: -0.2px;
                }

                .verify-modal p {
                    margin: 0;

                    color: var(--muted);

                    font-size: 13px;

                    line-height: 1.6;
                }

                .verify-modal-email {
                    margin-top: 9px !important;

                    color: var(--green) !important;

                    font-weight: 600;

                    word-break: break-word;
                }


                /* =====================================================
                   MODAL BUTTON
                ===================================================== */

                .verify-modal-button,
                .verify-modal-error-button {
                    width: 100%;

                    border: none;

                    color: #ffffff;

                    padding: 12px;

                    border-radius: 9px;

                    font-size: 14px;

                    font-weight: 700;

                    font-family: inherit;

                    cursor: pointer;

                    margin-top: 24px;
                }

                .verify-modal-button {
                    background: var(--navy3);
                }

                .verify-modal-button:hover {
                    background: var(--navy);
                }

                .verify-modal-error-button {
                    background: var(--red);
                }

                .verify-modal-error-button:hover {
                    background: #8F3523;
                }


                /* =====================================================
                   RESPONSIVE
                ===================================================== */

                @media (max-width: 760px) {
                    .jc-verify {
                        padding: 20px 14px;
                    }

                    .verify-card {
                        flex-direction: column;

                        min-height: auto;
                    }

                    .verify-spine {
                        display: none;
                    }

                    .verify-left {
                        order: 2;
                    }

                    .verify-right {
                        order: 1;
                    }

                    .verify-panel {
                        padding: 32px 26px;
                    }

                    .verify-brand {
                        margin-bottom: 28px;
                    }

                    .verify-headline {
                        font-size: 23px;
                    }

                    .verify-form-container {
                        max-width: 100%;
                    }
                }

            `}</style>


            {/* =====================================================
                MAIN CARD
            ===================================================== */}

            <div className="verify-wrap">

                <div className="verify-card">

                    <div className="verify-spine"></div>


                    {/* LEFT PANEL */}

                    <div className="verify-panel verify-left">

                        <div className="verify-brand">

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

                            <div className="verify-brand-name">
                                Job Connect
                            </div>

                        </div>


                        <h2 className="verify-headline">
                            Verify your identity securely.
                        </h2>

                        <p className="verify-lead">
                            We've sent a one-time password to your
                            registered email address. Enter the OTP
                            to continue recovering your account.
                        </p>


                        <div className="verify-features">

                            <div className="verify-feature">

                                <div className="verify-feature-icon">
                                    ✓
                                </div>

                                <div>
                                    <div className="verify-feature-title">
                                        Secure verification
                                    </div>

                                    <div className="verify-feature-text">
                                        Your identity is verified before
                                        allowing password changes.
                                    </div>
                                </div>

                            </div>


                            <div className="verify-feature">

                                <div className="verify-feature-icon">
                                    ✦
                                </div>

                                <div>
                                    <div className="verify-feature-title">
                                        Six-digit OTP
                                    </div>

                                    <div className="verify-feature-text">
                                        Enter the secure six-digit code
                                        sent to your registered email.
                                    </div>
                                </div>

                            </div>


                            <div className="verify-feature">

                                <div className="verify-feature-icon">
                                    🛡
                                </div>

                                <div>
                                    <div className="verify-feature-title">
                                        Protected account
                                    </div>

                                    <div className="verify-feature-text">
                                        Your account remains protected
                                        throughout the recovery process.
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* RIGHT PANEL */}

                    <div className="verify-panel verify-right">

                        <div className="verify-form-container">

                            <div className="verify-icon">
                                🔐
                            </div>

                            <h1 className="verify-title">
                                Verify OTP
                            </h1>

                            <p className="verify-subtitle">
                                Enter the 6-digit OTP sent to your
                                registered email address.
                            </p>


                            {email && (
                                <div className="verify-email-box">
                                    {email}
                                </div>
                            )}


                            <form onSubmit={handleSubmit}>

                                <div className="verify-form-group">

                                    <label htmlFor="otp">
                                        ENTER OTP
                                    </label>

                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                )
                                            )
                                        }
                                        required
                                    />

                                </div>


                                <button
                                    type="submit"
                                    className="verify-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "Verify OTP →"}
                                </button>

                            </form>

                        </div>

                    </div>

                </div>

            </div>


            {/* =====================================================
                POPUP MODAL
            ===================================================== */}

            {showModal && (
                <div
                    className="verify-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="verify-modal">

                        <div
                            className={
                                modalType === "success"
                                    ? "verify-success-icon"
                                    : "verify-error-icon"
                            }
                        >
                            {modalType === "success"
                                ? "✓"
                                : "!"}
                        </div>

                        <h2>
                            {modalTitle}
                        </h2>

                        <p>
                            {modalMessage}
                        </p>

                        {modalType === "success" && (
                            <p className="verify-modal-email">
                                {email}
                            </p>
                        )}

                        <button
                            type="button"
                            className={
                                modalType === "success"
                                    ? "verify-modal-button"
                                    : "verify-modal-error-button"
                            }
                            onClick={handleModalOK}
                        >
                            OK
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}

export default VerifyOTP;