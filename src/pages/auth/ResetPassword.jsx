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
    const [loading, setLoading] = useState(false);

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check email
        if (!email) {
            alert("Email information is missing. Please start again.");
            navigate("/forgot-password");
            return;
        }

        // Check OTP
        if (!otp) {
            alert("OTP information is missing. Please verify the OTP again.");
            navigate("/forgot-password");
            return;
        }

        // Check OTP length
        if (otp.length !== 6) {
            alert("Invalid OTP. Please verify the OTP again.");
            navigate("/forgot-password");
            return;
        }

        // Check passwords
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // Check password length
        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters.");
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

            console.log(
                "RESET PASSWORD STATUS:",
                response.status
            );

            console.log(
                "RESET PASSWORD RESPONSE:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    data.error ||
                    "Unable to reset password."
                );
            }

            alert(
                "Password reset successfully. Please login."
            );

            navigate("/login");

        } catch (error) {
            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            alert(
                error.message ||
                "Unable to reset password."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    🔑
                </div>

                <h1>
                    Reset password
                </h1>

                <p className="login-subtitle">
                    Enter your new password.
                </p>

                <form onSubmit={handleSubmit}>

                    {/* =================================================
                        NEW PASSWORD
                    ================================================= */}

                    <div className="form-group">

                        <label htmlFor="newPassword">
                            New Password
                        </label>

                        <div className="password-input-wrapper">

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
                                className="password-eye-button"
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


                    {/* =================================================
                        CONFIRM PASSWORD
                    ================================================= */}

                    <div className="form-group">

                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <div className="password-input-wrapper">

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
                                className="password-eye-button"
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


                    {/* =================================================
                        RESET BUTTON
                    ================================================= */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Resetting..."
                            : "Reset Password"
                        }
                    </button>

                </form>

            </div>

        </div>
    );
}

export default ResetPassword;