import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

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
            // LOGIN
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

        <div className="jc-signup">

            {/* =================================================
                STYLES — embedded directly so no separate .css
                file is needed anywhere in the project.
            ================================================= */}

            <style>{`
                .jc-signup {
                  --navy: #1F3326;
                  --navy3: #2F5233;
                  --cream: #F2F5EF;
                  --lime: #C7E36B;
                  --green: #2F6B45;
                  --ink: #16241C;
                  --muted: #66786C;
                  --line: #E4E9DF;
                  --red: #a8402a;
                  --red-bg: #fbe9e4;
                  --green-bg: #E7F2E0;

                  font-family: 'Inter', sans-serif;
                  color: var(--ink);
                  background: var(--cream);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 40px 20px;
                  box-sizing: border-box;
                }

                .jc-signup * {
                  box-sizing: border-box;
                }

                /* ---------- Book shell ---------- */

                .jc-book-wrap {
                  display: flex;
                  justify-content: center;
                  width: 100%;
                }

                .jc-book {
                  position: relative;
                  width: 860px;
                  max-width: 100%;
                  display: flex;
                  background: #fff;
                  border-radius: 18px;
                  box-shadow: 0 30px 60px -20px rgba(22, 36, 28, 0.28),
                              0 2px 8px rgba(22, 36, 28, 0.10);
                  overflow: hidden;
                  min-height: 500px;
                }

                .jc-spine {
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

                .jc-bpage {
                  position: relative;
                  padding: 44px 40px;
                  display: flex;
                  flex-direction: column;
                  flex: 1 1 50%;
                  min-width: 0;
                }

                /* ---------- Left page: pitch ---------- */

                .jc-bpage-left {
                  background: var(--navy);
                  color: #fff;
                  justify-content: center;
                }

                .jc-brand {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin-bottom: 30px;
                  position: absolute;
                  top: 44px;
                  left: 40px;
                }

                .jc-brand-name {
                  font-weight: 700;
                  font-size: 16px;
                  letter-spacing: -0.2px;
                  color: #fff;
                }

                .jc-headline {
                  font-size: 26px;
                  line-height: 1.24;
                  margin: 0 0 12px;
                  font-weight: 700;
                  letter-spacing: -0.3px;
                }

                .jc-lead {
                  color: #B7C7B9;
                  font-size: 13.5px;
                  line-height: 1.6;
                  margin: 0 0 30px;
                  max-width: 320px;
                }

                .jc-feat-list {
                  display: flex;
                  flex-direction: column;
                  gap: 19px;
                }

                .jc-feat {
                  display: flex;
                  gap: 12px;
                  align-items: flex-start;
                }

                .jc-feat-ic {
                  width: 32px;
                  height: 32px;
                  border-radius: 9px;
                  flex-shrink: 0;
                  background: rgba(199, 227, 107, 0.14);
                  color: var(--lime);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                  font-weight: 700;
                }

                .jc-feat-t {
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 2px;
                  color: #fff;
                }

                .jc-feat-d {
                  font-size: 11.5px;
                  color: #9DB09F;
                  line-height: 1.5;
                }

                /* ---------- Right page: form ---------- */

                .jc-bpage-right {
                  background: #fff;
                  justify-content: center;
                }

                .login-h1 {
                  font-size: 22px;
                  margin: 0 0 4px;
                  font-weight: 700;
                  color: var(--ink);
                }

                .login-subtitle {
                  color: var(--muted);
                  font-size: 13px;
                  line-height: 1.5;
                  margin: 0 0 22px;
                }

                .login-error {
                  background: var(--red-bg);
                  color: var(--red);
                  border: 1px solid #f0c3b6;
                  border-radius: 9px;
                  padding: 10px 13px;
                  font-size: 12.5px;
                  margin-bottom: 16px;
                }

                .form-group {
                  margin-bottom: 16px;
                }

                .form-group label {
                  display: block;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.03em;
                  text-transform: uppercase;
                  color: var(--muted);
                  margin-bottom: 6px;
                }

                .form-group input {
                  width: 100%;
                  padding: 11px 13px;
                  border: 1px solid var(--line);
                  border-radius: 9px;
                  font-size: 13.5px;
                  font-family: inherit;
                  background: #fbfcfa;
                  outline: none;
                  color: var(--ink);
                }

                .form-group input:focus {
                  border-color: var(--navy3);
                }

                .password-input-wrapper {
                  position: relative;
                }

                .password-input-wrapper input {
                  padding-right: 42px;
                }

                .password-eye-button {
                  position: absolute;
                  right: 6px;
                  top: 50%;
                  transform: translateY(-50%);
                  border: none;
                  background: none;
                  cursor: pointer;
                  font-size: 15px;
                  padding: 6px;
                  line-height: 1;
                }

                .login-button {
                  width: 100%;
                  border: none;
                  background: var(--navy3);
                  color: #fff;
                  padding: 13px;
                  border-radius: 9px;
                  font-size: 14px;
                  font-weight: 700;
                  font-family: 'Inter', sans-serif;
                  cursor: pointer;
                  margin-top: 4px;
                }

                .login-button:disabled {
                  opacity: 0.7;
                  cursor: not-allowed;
                }

                .login-button:not(:disabled):hover {
                  background: var(--navy);
                }

                .forgot-password {
                  text-align: center;
                  margin-top: 14px;
                }

                .forgot-password a {
                  font-size: 12.5px;
                  color: var(--green);
                  font-weight: 600;
                  text-decoration: none;
                }

                .forgot-password a:hover {
                  text-decoration: underline;
                }

                .signup-text {
                  text-align: center;
                  margin-top: 26px;
                  padding-top: 20px;
                  border-top: 1px solid var(--line);
                }

                .sign-new {
                  font-size: 12.5px;
                  color: var(--muted);
                  margin-bottom: 8px;
                }

                .signup-links {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  font-size: 12.5px;
                }

                .signup-links span {
                  color: var(--muted);
                }

                .signup-links a {
                  font-weight: 600;
                  text-decoration: none;
                }

                .jobseeker-link {
                  color: var(--navy3);
                }

                .employer-link {
                  color: var(--green);
                }

                .signup-links a:hover {
                  text-decoration: underline;
                }

                /* ---------- Responsive: stack pages on narrow screens ---------- */

                @media (max-width: 760px) {
                  .jc-book {
                    flex-direction: column;
                  }
                  .jc-spine {
                    display: none;
                  }
                  .jc-bpage-left {
                    order: 2;
                    padding-top: 90px;
                  }
                }
            `}</style>

            <div className="jc-book-wrap">
                <div className="jc-book">
                    <div className="jc-spine"></div>


                    {/* =================================================
                        LEFT PAGE — WELCOME PITCH (static, decorative)
                    ================================================= */}

                    <div className="jc-bpage jc-bpage-left">

                        <div className="jc-brand">
                            <svg width="26" height="26" viewBox="0 0 56 56">
                                <circle cx="20" cy="28" r="9" fill="#2F5233" />
                                <circle cx="38" cy="28" r="9" fill="#C7E36B" />
                                <rect x="20" y="26" width="18" height="4" fill="#2F5233" />
                            </svg>
                            <div className="jc-brand-name">Job Connect</div>
                        </div>

                        <h2 className="jc-headline">
                            Good to see you again.
                        </h2>

                        <p className="jc-lead">
                            Log back in to your verified account and pick up
                            right where you left off.
                        </p>

                        <div className="jc-feat-list">

                            <div className="jc-feat">
                                <div className="jc-feat-ic">✓</div>
                                <div>
                                    <div className="jc-feat-t">Your account, verified</div>
                                    <div className="jc-feat-d">
                                        Checked by a person, not just a form.
                                    </div>
                                </div>
                            </div>

                            <div className="jc-feat">
                                <div className="jc-feat-ic">⚡</div>
                                <div>
                                    <div className="jc-feat-t">Right back to work</div>
                                    <div className="jc-feat-d">
                                        Applications, listings, and messages — all
                                        where you left them.
                                    </div>
                                </div>
                            </div>

                            <div className="jc-feat">
                                <div className="jc-feat-ic">🛡</div>
                                <div>
                                    <div className="jc-feat-t">Your data, protected</div>
                                    <div className="jc-feat-d">
                                        Never shared without consent.
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>


                    {/* =================================================
                        RIGHT PAGE — LOGIN FORM (unchanged functionality)
                    ================================================= */}

                    <div className="jc-bpage jc-bpage-right">

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


                            {/* =================================================
                                EMAIL
                            ================================================= */}

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
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            {/* =================================================
                                PASSWORD
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="password">
                                    PASSWORD
                                </label>


                                <div className="password-input-wrapper">

                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="current-password"
                                        required
                                    />


                                    <button
                                        type="button"
                                        className="password-eye-button"
                                        onClick={() =>
                                            setShowPassword(
                                                (prev) => !prev
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >

                                        {showPassword
                                            ? "🙈"
                                            : "👁️"}

                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                LOGIN
                            ================================================= */}

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


                        {/* =================================================
                            FORGOT PASSWORD
                        ================================================= */}

                        <div className="forgot-password">

                            <Link to="/forgot-password">
                                Forgot password?
                            </Link>

                        </div>


                        {/* =================================================
                            SIGNUP
                        ================================================= */}

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
            </div>

        </div>
    );
}

export default Login;