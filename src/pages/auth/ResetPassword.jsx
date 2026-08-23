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

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");


    // =====================================================
    // SHOW MODAL
    // =====================================================

    function openModal(
        type,
        title,
        message
    ) {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setShowModal(true);
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
            navigate("/login");
        }

    }


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        // =================================================
        // CHECK EMAIL
        // =================================================

        if (!email) {

            openModal(
                "error",
                "Email Information Missing",
                "Email information is missing. Please start again."
            );

            return;
        }


        // =================================================
        // CHECK OTP
        // =================================================

        if (!otp) {

            openModal(
                "error",
                "OTP Information Missing",
                "OTP information is missing. Please verify the OTP again."
            );

            return;
        }


        // =================================================
        // CHECK OTP LENGTH
        // =================================================

        if (otp.length !== 6) {

            openModal(
                "error",
                "Invalid OTP",
                "Invalid OTP. Please verify the OTP again."
            );

            return;
        }


        // =================================================
        // CHECK PASSWORD MATCH
        // =================================================

        if (newPassword !== confirmPassword) {

            openModal(
                "error",
                "Passwords Do Not Match",
                "The new password and confirm password must be the same."
            );

            return;
        }


        // =================================================
        // CHECK PASSWORD LENGTH
        // =================================================

        if (newPassword.length < 8) {

            openModal(
                "error",
                "Password Too Short",
                "Password must be at least 8 characters."
            );

            return;
        }


        try {

            setLoading(true);


            // =================================================
            // API
            // =================================================

            const response = await fetch(
                `${API_BASE}/auth/reset-password/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email: email,
                        otp: otp,
                        new_password: newPassword,
                        confirm_password:
                            confirmPassword,
                    }),
                }
            );


            const data =
                await response.json().catch(
                    () => ({})
                );


            console.log(
                "RESET PASSWORD STATUS:",
                response.status
            );


            console.log(
                "RESET PASSWORD RESPONSE:",
                data
            );


            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    data.error ||
                    "Unable to reset password."
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            setNewPassword("");
            setConfirmPassword("");


            openModal(
                "success",
                "Password Reset Successfully",
                "Your password has been reset successfully. Please login with your new password."
            );


        } catch (error) {

            console.error(
                "RESET PASSWORD ERROR:",
                error
            );


            openModal(
                "error",
                "Password Reset Failed",
                error.message ||
                "Unable to reset password. Please try again."
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


            {/* =====================================================
                POPUP MODAL
            ===================================================== */}

            {showModal && (

                <div
                    className="otp-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="otp-success-modal">


                        {/* =================================================
                            ICON
                        ================================================= */}

                        <div
                            className={
                                modalType === "success"
                                    ? "otp-success-icon"
                                    : "otp-error-icon"
                            }
                        >

                            {modalType === "success"
                                ? "✓"
                                : "!"}

                        </div>


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <h2>
                            {modalTitle}
                        </h2>


                        {/* =================================================
                            MESSAGE
                        ================================================= */}

                        <p>
                            {modalMessage}
                        </p>


                        {/* =================================================
                            BUTTON
                        ================================================= */}

                        <button
                            type="button"
                            className={
                                modalType === "success"
                                    ? "otp-modal-button"
                                    : "otp-modal-error-button"
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