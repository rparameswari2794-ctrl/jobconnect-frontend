import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

            navigate(
                "/reset-password",
                {
                    state: {
                        email: email,
                        otp: otp.trim(),
                    },
                }
            );

        }


        if (modalType === "error" &&
            !email) {

            navigate(
                "/forgot-password"
            );

        }
    }


    // =====================================================
    // SUBMIT OTP
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        // =================================================
        // EMAIL CHECK
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
        // CLEAN OTP
        // =================================================

        const cleanOtp =
            otp.trim();


        // =================================================
        // OTP LENGTH
        // =================================================

        if (
            cleanOtp.length !== 6
        ) {

            openModal(
                "error",
                "Invalid OTP",
                "Please enter the 6-digit OTP."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await fetch(
                    `${API_BASE}/auth/verify-otp/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            email:
                                email,

                            otp:
                                cleanOtp,
                        }),
                    }
                );


            const data =
                await response.json();


            console.log(
                "VERIFY OTP STATUS:",
                response.status
            );


            console.log(
                "VERIFY OTP RESPONSE:",
                data
            );


            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "OTP verification failed."
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            openModal(
                "success",
                "OTP Verified Successfully",
                "Your OTP has been verified successfully. You can now create a new password."
            );


        } catch (error) {

            console.error(
                "VERIFY OTP ERROR:",
                error
            );


            openModal(
                "error",
                "OTP Verification Failed",
                error.message ||
                "OTP verification failed. Please try again."
            );


        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    🔐
                </div>


                <h1>
                    Verify OTP
                </h1>


                <p className="login-subtitle">
                    Enter the 6-digit OTP sent to your email.
                </p>


                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="otp">
                            OTP
                        </label>


                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter OTP"
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
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Verifying..."
                            : "Verify OTP"
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
                            EMAIL
                        ================================================= */}

                        {modalType === "success" && (

                            <p className="otp-modal-email">

                                {email}

                            </p>

                        )}


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

export default VerifyOTP;