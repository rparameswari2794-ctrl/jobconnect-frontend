import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [showSuccessModal, setShowSuccessModal] =
        useState(false);

    const [accountType, setAccountType] =
        useState("");

    const navigate = useNavigate();


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        const cleanEmail =
            email.trim().toLowerCase();


        if (!cleanEmail) {

            alert(
                "Please enter your email address."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await fetch(
                    `${API_BASE}/auth/forgot-password/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
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
                response.headers.get(
                    "content-type"
                );


            let data = {};


            if (
                contentType &&
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();


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


            alert(
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


        navigate(
            "/verify-otp",
            {
                state: {
                    email:
                        email.trim().toLowerCase(),
                    role:
                        accountType === "Employer"
                            ? "employer"
                            : "jobseeker",
                },
            }
        );
    }


    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    🔑
                </div>


                <h1>
                    Forgot password?
                </h1>


                <p className="login-subtitle">

                    Enter your registered email address.
                    We'll send you an OTP to verify your account.

                </p>


                <form
                    onSubmit={handleSubmit}
                >

                    {/* =================================================
                        EMAIL
                    ================================================= */}

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>


                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* =================================================
                        SEND OTP
                    ================================================= */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Sending OTP..."
                            : "Send OTP"
                        }

                    </button>

                </form>

            </div>


            {/* =====================================================
                SUCCESS MODAL
            ===================================================== */}

            {showSuccessModal && (

                <div
                    className="otp-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setShowSuccessModal(false);
                        }

                    }}
                >

                    <div className="otp-success-modal">


                        {/* =================================================
                            ICON
                        ================================================= */}

                        <div className="otp-success-icon">
                            ✓
                        </div>


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <h2>
                            OTP Sent Successfully
                        </h2>


                        {/* =================================================
                            MESSAGE
                        ================================================= */}

                        <p>

                            An OTP has been sent to your
                            registered {accountType} email address.

                        </p>


                        <p className="otp-modal-email">

                            {email.trim().toLowerCase()}

                        </p>


                        <p className="otp-modal-note">

                            Please check your inbox and enter
                            the 6-digit OTP to continue.

                        </p>


                        {/* =================================================
                            BUTTON
                        ================================================= */}

                        <button
                            type="button"
                            className="otp-modal-button"
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

export default ForgotPassword;