import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        e.preventDefault();

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            alert("Please enter your email address.");
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                "http://localhost:8000/api/auth/forgot-password/",
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

            // -------------------------------------------------
            // SAFELY READ RESPONSE
            // -------------------------------------------------

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
                    "Server error. Please check the Django terminal."
                );
            }

            // -------------------------------------------------
            // ERROR RESPONSE
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to send OTP."
                );
            }

            // -------------------------------------------------
            // CHECK ROLE
            // -------------------------------------------------

            if (
                data.role !== "jobseeker" &&
                data.role !== "employer"
            ) {

                throw new Error(
                    "Unable to identify your account type."
                );
            }

            // -------------------------------------------------
            // SUCCESS MESSAGE
            // -------------------------------------------------

            const accountType =
                data.role === "employer"
                    ? "Employer"
                    : "Job Seeker";

            alert(
                `OTP has been sent to your registered ${accountType} email.`
            );

            // -------------------------------------------------
            // GO TO VERIFY OTP
            // -------------------------------------------------

            navigate(
                "/verify-otp",
                {
                    state: {
                        email: cleanEmail,
                        role: data.role,
                    },
                }
            );

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

                <form onSubmit={handleSubmit}>

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
                                setEmail(e.target.value)
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
                            ? "Sending OTP..."
                            : "Send OTP"
                        }
                    </button>

                </form>

            </div>

        </div>
    );
}

export default ForgotPassword;