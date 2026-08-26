import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function EmployerSignup() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [workEmail, setWorkEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    async function handleSubmit(e) {

        e.preventDefault();

        setError("");
        setSuccess("");


        if (password.length < 8) {

            setError(
                "Password must contain at least 8 characters."
            );

            return;
        }


        try {

            setLoading(true);


            const response = await fetch(
                `${API_BASE}/auth/employer/signup/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        contact_name: fullName,
                        company_name: companyName,
                        email: workEmail,
                        password: password,
                    }),
                }
            );


            const data = await response.json();


            if (!response.ok) {

                if (typeof data === "object") {

                    const firstError =
                        Object.values(data)
                            .flat()
                            .find(
                                (message) =>
                                    typeof message === "string"
                            );

                    throw new Error(
                        firstError ||
                        "Unable to create employer account."
                    );

                }

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to create employer account."
                );
            }


            setSuccess(
                "Employer account created successfully!"
            );


            setTimeout(() => {

                navigate("/login");

            }, 1200);


        } catch (err) {

            console.error(
                "Employer signup error:",
                err
            );


            setError(
                err.message ||
                "Something went wrong. Please try again."
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
                  width: 920px;
                  max-width: 100%;
                  display: flex;
                  background: #fff;
                  border-radius: 18px;
                  box-shadow: 0 30px 60px -20px rgba(22, 36, 28, 0.28),
                              0 2px 8px rgba(22, 36, 28, 0.10);
                  overflow: hidden;
                  min-height: 560px;
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
                  padding: 42px 38px;
                  display: flex;
                  flex-direction: column;
                  flex: 1 1 50%;
                  min-width: 0;
                }

                /* ---------- Left page: pitch ---------- */

                .jc-bpage-left {
                  background: var(--navy);
                  color: #fff;
                }

                .jc-brand {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin-bottom: 36px;
                }

                .jc-brand-name {
                  font-weight: 700;
                  font-size: 16px;
                  letter-spacing: -0.2px;
                  color: #fff;
                }

                .jc-headline {
                  font-size: 25px;
                  line-height: 1.24;
                  margin: 0 0 10px;
                  font-weight: 700;
                  letter-spacing: -0.3px;
                }

                .jc-lead {
                  color: #B7C7B9;
                  font-size: 13px;
                  line-height: 1.6;
                  margin: 0 0 28px;
                  max-width: 340px;
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
                }

                .signup-h1 {
                  font-size: 20px;
                  margin: 0 0 4px;
                  font-weight: 700;
                  color: var(--ink);
                }

                .signup-subtitle {
                  color: var(--muted);
                  font-size: 12.5px;
                  line-height: 1.5;
                  margin: 0 0 20px;
                }

                .signup-error {
                  background: var(--red-bg);
                  color: var(--red);
                  border: 1px solid #f0c3b6;
                  border-radius: 9px;
                  padding: 10px 13px;
                  font-size: 12.5px;
                  margin-bottom: 16px;
                }

                .signup-success {
                  background: var(--green-bg);
                  color: var(--green);
                  border: 1px solid #C3E0B4;
                  border-radius: 9px;
                  padding: 10px 13px;
                  font-size: 12.5px;
                  margin-bottom: 16px;
                }

                .signup-form-group {
                  margin-bottom: 14px;
                }

                .signup-form-group label {
                  display: block;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.03em;
                  text-transform: uppercase;
                  color: var(--muted);
                  margin-bottom: 6px;
                }

                .signup-form-group input {
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

                .signup-form-group input:focus {
                  border-color: var(--navy3);
                }

                .signup-form-group input:disabled {
                  opacity: 0.6;
                }

                .signup-form-group small {
                  display: block;
                  font-size: 11px;
                  color: var(--muted);
                  margin-top: 5px;
                  line-height: 1.4;
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

                .signup-button {
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

                .signup-button:disabled {
                  opacity: 0.7;
                  cursor: not-allowed;
                }

                .signup-button:not(:disabled):hover {
                  background: var(--navy);
                }

                .already-account,
                .employer-question {
                  text-align: center;
                  font-size: 13px;
                  color: var(--muted);
                  margin-top: 16px;
                }

                .already-account span,
                .employer-question span {
                  margin-right: 5px;
                }

                .already-account a,
                .employer-question a {
                  color: var(--green);
                  font-weight: 600;
                  text-decoration: none;
                }

                .already-account a:hover,
                .employer-question a:hover {
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
                  }
                }
            `}</style>

            <div className="jc-book-wrap">
                <div className="jc-book">
                    <div className="jc-spine"></div>


                    {/* =================================================
                        LEFT PAGE — PLATFORM PITCH (static, decorative)
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
                            Hire people you can actually trust.
                        </h2>

                        <p className="jc-lead">
                            Post to a pool of verified candidates, and get
                            verified yourself — it takes one extra step.
                        </p>

                        <div className="jc-feat-list">

                            <div className="jc-feat">
                                <div className="jc-feat-ic">✓</div>
                                <div>
                                    <div className="jc-feat-t">Verified candidates only</div>
                                    <div className="jc-feat-d">
                                        Every applicant's profile has been checked,
                                        not just self-reported.
                                    </div>
                                </div>
                            </div>

                            <div className="jc-feat">
                                <div className="jc-feat-ic">📌</div>
                                <div>
                                    <div className="jc-feat-t">Post in minutes</div>
                                    <div className="jc-feat-d">
                                        Simple job forms, no bloated posting workflow.
                                    </div>
                                </div>
                            </div>

                            <div className="jc-feat">
                                <div className="jc-feat-ic">🛡</div>
                                <div>
                                    <div className="jc-feat-t">Your data, protected</div>
                                    <div className="jc-feat-d">
                                        Company documents are reviewed for verification
                                        only, never shared without consent.
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>


                    {/* =================================================
                        RIGHT PAGE — SIGN UP FORM (unchanged functionality)
                    ================================================= */}

                    <div className="jc-bpage jc-bpage-right">

                        <h1 className="signup-h1">
                            Hire verified talent
                        </h1>

                        <p className="signup-subtitle">
                            You'll verify your company once,
                            right after sign-up.
                        </p>


                        {/* Error */}

                        {error && (

                            <div className="signup-error">
                                {error}
                            </div>

                        )}


                        {/* Success */}

                        {success && (

                            <div className="signup-success">
                                {success}
                            </div>

                        )}


                        <form onSubmit={handleSubmit}>


                            {/* Full Name */}

                            <div className="signup-form-group">

                                <label htmlFor="fullName">
                                    FULL NAME
                                </label>


                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="e.g. Rohan Mehta"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>


                            {/* Company Name */}

                            <div className="signup-form-group">

                                <label htmlFor="companyName">
                                    COMPANY NAME
                                </label>


                                <input
                                    id="companyName"
                                    type="text"
                                    placeholder="e.g. Solace Labs"
                                    value={companyName}
                                    onChange={(e) =>
                                        setCompanyName(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>


                            {/* Work Email */}

                            <div className="signup-form-group">

                                <label htmlFor="workEmail">
                                    WORK EMAIL
                                </label>


                                <input
                                    id="workEmail"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={workEmail}
                                    onChange={(e) =>
                                        setWorkEmail(
                                            e.target.value
                                        )
                                    }
                                    required
                                />


                                <small>
                                    Use your official company domain —
                                    it's checked during verification.
                                </small>

                            </div>


                            {/* Password */}

                            <div className="signup-form-group">

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
                                        minLength={8}
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


                                <small>
                                    Min. 8 characters, one number,
                                    one symbol.
                                </small>

                            </div>


                            {/* Create Account */}

                            <button
                                type="submit"
                                className="signup-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Creating account..."
                                    : "Create account"}

                            </button>

                        </form>


                        {/* Login */}

                        <div className="already-account">

                            <span>
                                Already have an account?
                            </span>


                            <Link to="/login">
                                Log in
                            </Link>

                        </div>


                        {/* Job Seeker */}

                        <div className="employer-question">

                            <span>
                                Looking for a job instead?
                            </span>


                            <Link to="/jobseeker/signup">
                                Sign up as a job seeker
                            </Link>

                        </div>

                    </div>

                </div>
            </div>

        </div>

    );
}

export default EmployerSignup;