import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function VerifyOTP() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert("Email information is missing. Please start again.");
            navigate("/forgot-password");
            return;
        }

        // Clean OTP BEFORE sending it to backend
        const cleanOtp = otp.trim();

        if (cleanOtp.length !== 6) {
            alert("Please enter the 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/auth/verify-otp/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email,
                        otp: cleanOtp,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "OTP verification failed."
                );
            }

            alert("OTP verified successfully.");

            navigate("/reset-password", {
                state: {
                    email: email,
                    otp: cleanOtp,
                },
            });

        } catch (error) {
            console.error("VERIFY OTP ERROR:", error);

            alert(
                error.message ||
                "OTP verification failed."
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
                                    e.target.value.replace(/\D/g, "")
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

        </div>
    );
}

export default VerifyOTP;