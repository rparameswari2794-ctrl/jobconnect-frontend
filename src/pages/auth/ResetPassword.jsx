import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const otp = location.state?.otp || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    // =====================================================
    // MODAL
    // =====================================================

    function showMessage(type, title, message) {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
    }

    function handleModalOK() {
        setShowModal(false);

        if (modalType === "success") {
            navigate("/login");
        }
    }

    // =====================================================
    // RESET PASSWORD
    // =====================================================

    async function handleSubmit(e) {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            showMessage(
                "error",
                "Required Fields",
                "Please enter and confirm your new password."
            );
            return;
        }

        if (newPassword.length < 8) {
            showMessage(
                "error",
                "Invalid Password",
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(
                "error",
                "Passwords Do Not Match",
                "Please make sure both passwords are the same."
            );
            return;
        }

        if (!email || !otp) {
            showMessage(
                "error",
                "Invalid Recovery Session",
                "Your password reset session is invalid or expired. Please start the recovery process again."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/auth/reset-password/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email,
                        otp: otp,
                        new_password: newPassword,
                        confirm_password: confirmPassword,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                showMessage(
                    "success",
                    "Password Reset Successful",
                    data.message ||
                        "Your password has been reset successfully."
                );
            } else {
                showMessage(
                    "error",
                    "Reset Failed",
                    data.message ||
                        data.detail ||
                        "Unable to reset your password. Please try again."
                );
            }
        } catch (error) {
            console.error("Reset password error:", error);

            showMessage(
                "error",
                "Connection Error",
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // RETURN
    // =====================================================

    return (
        <div className="jc-reset">

            <style>{`

                .jc-reset {
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

                    font-family:
                        "Inter",
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;

                    min-height: 100vh;

                    background: var(--cream);

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    padding: 40px 20px;

                    color: var(--ink);

                    box-sizing: border-box;
                }

                .jc-reset *,
                .jc-reset *::before,
                .jc-reset *::after {
                    box-sizing: border-box;
                }

                .reset-wrap {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .reset-card {
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

                .reset-spine {
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

                .reset-panel {
                    position: relative;

                    padding: 42px 38px;

                    display: flex;
                    flex-direction: column;

                    flex: 1 1 50%;
                    min-width: 0;
                }

                .reset-left {
                    background: var(--navy);
                    color: #ffffff;
                }

                .reset-brand {
                    display: flex;
                    align-items: center;

                    gap: 10px;
                    margin-bottom: 52px;
                }

                .reset-brand-name {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: -0.2px;
                    color: #ffffff;
                }

                .reset-headline {
                    font-size: 27px;
                    line-height: 1.25;
                    font-weight: 700;
                    letter-spacing: -0.4px;

                    margin: 0 0 12px;
                }

                .reset-lead {
                    max-width: 330px;

                    color: #B7C7B9;

                    font-size: 13px;
                    line-height: 1.65;

                    margin: 0 0 32px;
                }

                .reset-features {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .reset-feature {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }

                .reset-feature-icon {
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

                .reset-feature-title {
                    font-size: 13px;
                    font-weight: 600;

                    color: #ffffff;

                    margin-bottom: 3px;
                }

                .reset-feature-text {
                    font-size: 11.5px;
                    line-height: 1.5;

                    color: #9DB09F;
                }

                .reset-right {
                    background: #ffffff;
                    justify-content: center;
                }

                .reset-form-container {
                    width: 100%;
                    max-width: 350px;
                    margin: auto;
                }

                .reset-icon {
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

                .reset-title {
                    font-size: 23px;
                    font-weight: 700;

                    color: var(--ink);

                    letter-spacing: -0.3px;

                    margin: 0 0 6px;
                }

                .reset-subtitle {
                    color: var(--muted);

                    font-size: 12.5px;
                    line-height: 1.6;

                    margin: 0 0 24px;
                }

                .reset-form-group {
                    margin-bottom: 18px;
                }

                .reset-form-group label {
                    display: block;

                    font-size: 11px;
                    font-weight: 700;

                    letter-spacing: 0.03em;
                    text-transform: uppercase;

                    color: var(--muted);

                    margin-bottom: 7px;
                }

                .reset-password-wrapper {
                    position: relative;
                    width: 100%;
                }

                .reset-password-wrapper input {
                    width: 100%;

                    padding: 12px 44px 12px 14px;

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

                .reset-password-wrapper input::placeholder {
                    color: #A1ADA5;
                }

                .reset-password-wrapper input:focus {
                    border-color: var(--navy3);

                    box-shadow:
                        0 0 0 3px
                        rgba(47, 82, 51, 0.08);
                }

                .reset-eye-button {
                    position: absolute;

                    right: 8px;
                    top: 50%;

                    transform: translateY(-50%);

                    width: 32px;
                    height: 32px;

                    border: none;
                    background: transparent;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    cursor: pointer;

                    font-size: 16px;
                    border-radius: 7px;
                }

                .reset-eye-button:hover {
                    background: #EEF5E5;
                }

                .reset-button {
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

                .reset-button:hover:not(:disabled) {
                    background: var(--navy);
                    transform: translateY(-1px);
                }

                .reset-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .reset-modal-overlay {
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

                .reset-modal {
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
                        resetModalIn 0.2s ease-out;
                }

                @keyframes resetModalIn {
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

                .reset-success-icon,
                .reset-error-icon {
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

                .reset-success-icon {
                    background: #E7F2E0;
                    color: var(--green);
                }

                .reset-error-icon {
                    background: var(--red-bg);
                    color: var(--red);
                }

                .reset-modal h2 {
                    margin: 0 0 10px;

                    font-size: 20px;
                    color: var(--ink);

                    letter-spacing: -0.2px;
                }

                .reset-modal p {
                    margin: 0;

                    color: var(--muted);

                    font-size: 13px;
                    line-height: 1.6;
                }

                .reset-modal-button,
                .reset-modal-error-button {
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

                .reset-modal-button {
                    background: var(--navy3);
                }

                .reset-modal-button:hover {
                    background: var(--navy);
                }

                .reset-modal-error-button {
                    background: var(--red);
                }

                .reset-modal-error-button:hover {
                    background: #8F3523;
                }

                @media (max-width: 760px) {
                    .jc-reset {
                        padding: 20px 14px;
                    }

                    .reset-card {
                        flex-direction: column;
                        min-height: auto;
                    }

                    .reset-spine {
                        display: none;
                    }

                    .reset-left {
                        order: 2;
                    }

                    .reset-right {
                        order: 1;
                    }

                    .reset-panel {
                        padding: 32px 26px;
                    }

                    .reset-brand {
                        margin-bottom: 28px;
                    }

                    .reset-headline {
                        font-size: 23px;
                    }

                    .reset-form-container {
                        max-width: 100%;
                    }
                }

                @media (max-width: 430px) {
                    .jc-reset {
                        padding: 14px 10px;
                    }

                    .reset-panel {
                        padding: 26px 20px;
                    }

                    .reset-card {
                        border-radius: 14px;
                    }

                    .reset-title {
                        font-size: 21px;
                    }

                    .reset-headline {
                        font-size: 21px;
                    }

                    .reset-modal {
                        padding: 28px 22px 24px;
                    }
                }

            `}</style>

            {/* =====================================================
                MAIN CARD
            ===================================================== */}

            <div className="reset-wrap">

                <div className="reset-card">

                    <div className="reset-spine"></div>

                    {/* LEFT PANEL */}

                    <div className="reset-panel reset-left">

                        <div className="reset-brand">

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

                            <div className="reset-brand-name">
                                Job Connect
                            </div>

                        </div>

                        <h2 className="reset-headline">
                            Create a new secure password.
                        </h2>

                        <p className="reset-lead">
                            You're almost there. Set a new password
                            for your Job Connect account and continue
                            securely.
                        </p>

                        <div className="reset-features">

                            <div className="reset-feature">

                                <div className="reset-feature-icon">
                                    ✓
                                </div>

                                <div>
                                    <div className="reset-feature-title">
                                        Strong password
                                    </div>

                                    <div className="reset-feature-text">
                                        Use at least 8 characters to
                                        keep your account protected.
                                    </div>
                                </div>

                            </div>

                            <div className="reset-feature">

                                <div className="reset-feature-icon">
                                    ✦
                                </div>

                                <div>
                                    <div className="reset-feature-title">
                                        Secure recovery
                                    </div>

                                    <div className="reset-feature-text">
                                        Your password is updated only
                                        after successful OTP verification.
                                    </div>
                                </div>

                            </div>

                            <div className="reset-feature">

                                <div className="reset-feature-icon">
                                    🛡
                                </div>

                                <div>
                                    <div className="reset-feature-title">
                                        Account protection
                                    </div>

                                    <div className="reset-feature-text">
                                        Keep your new password private
                                        and never share it with anyone.
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* RIGHT PANEL */}

                    <div className="reset-panel reset-right">

                        <div className="reset-form-container">

                            <div className="reset-icon">
                                🔑
                            </div>

                            <h1 className="reset-title">
                                Reset your password
                            </h1>

                            <p className="reset-subtitle">
                                Enter a new password below.
                                Make sure both passwords match
                                before continuing.
                            </p>

                            <form onSubmit={handleSubmit}>

                                {/* NEW PASSWORD */}

                                <div className="reset-form-group">

                                    <label htmlFor="newPassword">
                                        NEW PASSWORD
                                    </label>

                                    <div className="reset-password-wrapper">

                                        <input
                                            id="newPassword"
                                            type={
                                                showNewPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="reset-eye-button"
                                            onClick={() =>
                                                setShowNewPassword(
                                                    (prev) => !prev
                                                )
                                            }
                                            aria-label={
                                                showNewPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showNewPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                </div>

                                {/* CONFIRM PASSWORD */}

                                <div className="reset-form-group">

                                    <label htmlFor="confirmPassword">
                                        CONFIRM PASSWORD
                                    </label>

                                    <div className="reset-password-wrapper">

                                        <input
                                            id="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="reset-eye-button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (prev) => !prev
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showConfirmPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    className="reset-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Resetting..."
                                        : "Reset Password →"}
                                </button>

                            </form>

                        </div>

                    </div>

                </div>

            </div>

            {/* POPUP MODAL */}

            {showModal && (
                <div
                    className="reset-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="reset-modal">

                        <div
                            className={
                                modalType === "success"
                                    ? "reset-success-icon"
                                    : "reset-error-icon"
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

                        <button
                            type="button"
                            className={
                                modalType === "success"
                                    ? "reset-modal-button"
                                    : "reset-modal-error-button"
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

export default ResetPassword;