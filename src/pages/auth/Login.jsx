import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";


const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    async function handleSubmit(e) {

        e.preventDefault();

        setError("");


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!email.trim() || !password) {

            setError(
                "Please enter your email and password."
            );

            return;
        }


        try {

            setLoading(true);


            // =====================================================
            // JOB SEEKER LOGIN
            // =====================================================

            const response = await fetch(
                `${API_BASE}/auth/login/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password: password,
                    }),
                }
            );


            // =====================================================
            // READ RESPONSE
            // =====================================================

            const data = await response.json();

            console.log(
                "LOGIN RESPONSE:",
                data
            );


            // =====================================================
            // LOGIN ERROR
            // =====================================================

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Invalid email or password."
                );
            }


            // =====================================================
            // GET ACCESS TOKEN
            // =====================================================

            const accessToken =
                data.access;


            const refreshToken =
                data.refresh;


            console.log(
                "ACCESS TOKEN:",
                accessToken
            );

            console.log(
                "REFRESH TOKEN:",
                refreshToken
            );


            // =====================================================
            // TOKEN CHECK
            // =====================================================

            if (!accessToken) {

                throw new Error(
                    "Login successful, but access token was not received."
                );
            }


            // =====================================================
            // USER
            // =====================================================

            const user = data.user;
            localStorage.setItem(
                "jc_token",
                data.access
            );

            localStorage.setItem(
                "refresh_token",
                data.refresh
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            if (!user) {

                throw new Error(
                    "Login successful, but user information was not received."
                );
            }


            console.log(
                "LOGIN USER:",
                user
            );


            // =====================================================
            // SAVE JWT
            // =====================================================

            localStorage.setItem(
                "jc_token",
                accessToken
            );


            if (refreshToken) {

                localStorage.setItem(
                    "refresh_token",
                    refreshToken
                );

            }


            // =====================================================
            // SAVE USER
            // =====================================================

            localStorage.setItem(
                "jc_user",
                JSON.stringify(user)
            );


            // =====================================================
            // VERIFY STORAGE
            // =====================================================

            console.log(
                "SAVED jc_token:",
                localStorage.getItem("jc_token")
            );


            console.log(
                "SAVED refresh_token:",
                localStorage.getItem("refresh_token")
            );


            // =====================================================
            // ROLE
            // =====================================================

            const role =
                user.role ||
                user.user_type ||
                user.account_type;


            console.log(
                "USER ROLE:",
                role
            );


            // =====================================================
            // JOB SEEKER
            // =====================================================

            if (
                role === "jobseeker" ||
                role === "job_seeker"
            ) {

                navigate(
                    "/jobseeker/dashboard"
                );

                return;
            }


            // =====================================================
            // EMPLOYER
            // =====================================================

            if (
                role === "employer"
            ) {

                navigate(
                    "/employer/dashboard"
                );

                return;
            }


            // =====================================================
            // ADMIN
            // =====================================================

            if (
                role === "admin"
            ) {

                navigate(
                    "/admin/dashboard"
                );

                return;
            }


            // =====================================================
            // UNKNOWN ROLE
            // =====================================================

            setError(
                "Your account role could not be identified."
            );


        } catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );


            // Remove tokens only when login itself failed.
            localStorage.removeItem(
                "jc_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "jc_user"
            );


            setError(
                err.message ||
                "Unable to login. Please try again."
            );

        } finally {

            setLoading(false);
        }
    }


    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    🔐
                </div>


                <h1 className="login-h1">
                    Welcome back
                </h1>


                <p className="login-subtitle">
                    Log in to continue where you left off.
                </p>


                {error && (

                    <div className="login-error">
                        {error}
                    </div>

                )}


                <form onSubmit={handleSubmit}>

                    {/* EMAIL */}

                    <div className="form-group">

                        <label htmlFor="email">
                            EMAIL
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="email"
                            required
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="password">
                            PASSWORD
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            autoComplete="current-password"
                            required
                        />

                    </div>


                    {/* LOGIN */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Log in"
                        }

                    </button>

                </form>


                {/* FORGOT PASSWORD */}

                <div className="forgot-password">

                    <Link to="/forgot-password">
                        Forgot password?
                    </Link>

                </div>


                {/* SIGNUP */}

                <div className="signup-text">

                    <div className="sign-new">
                        New to Job Connect?
                    </div>


                    <div className="signup-links">

                        <Link
                            className="jobseeker-link"
                            to="/jobseeker/signup"
                        >
                            Job seeker sign up
                        </Link>

                        <span>·</span>

                        <Link
                            className="employer-link"
                            to="/employer/signup"
                        >
                            Employer sign up
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;