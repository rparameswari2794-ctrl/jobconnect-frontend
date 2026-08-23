import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function JobseekerSignup() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    async function handleSubmit(e) {

        e.preventDefault();

        setError("");
        setSuccess("");


        /* =====================================================
           FULL NAME VALIDATION
        ===================================================== */

        if (!name.trim()) {

            setError(
                "Please enter your full name."
            );

            return;
        }


        /* =====================================================
           EMAIL VALIDATION

           Only:
           gmail.com
           yahoo.com
           outlook.com
        ===================================================== */

        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook)\.com$/i;

        if (!emailPattern.test(email.trim())) {

            setError(
                "Please use a valid Gmail, Yahoo, or Outlook email address."
            );

            return;
        }


        /* =====================================================
           PASSWORD VALIDATION

           Requirements:
           - Minimum 8 characters
           - At least 1 capital letter
           - At least 1 number
           - At least 1 special character
        ===================================================== */

        const passwordPattern =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordPattern.test(password)) {

            setError(
                "Password must be at least 8 characters and contain one capital letter, one number, and one special character."
            );

            return;
        }


        /* =====================================================
           API REQUEST
        ===================================================== */

        try {

            setLoading(true);


            const response = await fetch(
                `${API_BASE}/auth/jobseeker/signup/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },

                    body: JSON.stringify({

                        full_name: name
                            .trim(),

                        email: email
                            .trim()
                            .toLowerCase(),

                        password: password,

                        role: "jobseeker",

                    }),
                }
            );


            /* =================================================
               READ RESPONSE AS TEXT FIRST

               This prevents:
               Unexpected token '<'
            ================================================= */

            const responseText =
                await response.text();


            console.log(
                "SIGNUP STATUS:",
                response.status
            );

            console.log(
                "SIGNUP RESPONSE:",
                responseText
            );


            /* =================================================
               CONVERT RESPONSE TO JSON
            ================================================= */

            let data = null;

            try {

                data =
                    JSON.parse(responseText);

            } catch (jsonError) {

                console.error(
                    "Backend returned non-JSON response:",
                    responseText
                );


                if (response.status === 404) {

                    throw new Error(
                        "Signup API not found. Please check the Django signup URL."
                    );

                }


                if (response.status >= 500) {

                    throw new Error(
                        "Server error while creating account. Please check the Django terminal."
                    );

                }


                throw new Error(
                    `Signup API returned an invalid response. HTTP ${response.status}.`
                );
            }


            /* =================================================
               HANDLE API ERROR
            ================================================= */

            if (!response.ok) {

                let firstError = "";


                if (
                    typeof data === "object" &&
                    data !== null
                ) {

                    firstError =
                        Object.values(data)
                            .flat()
                            .find(
                                (message) =>
                                    typeof message === "string"
                            ) || "";
                }


                throw new Error(
                    firstError ||
                    data?.detail ||
                    data?.message ||
                    "Unable to create account."
                );
            }


            /* =================================================
               SUCCESS
            ================================================= */

            setSuccess(
                "Account created successfully! Waiting for admin approval."
            );


            /* =================================================
               CLEAR FORM
            ================================================= */

            setName("");
            setEmail("");
            setPassword("");


            /* =================================================
               GO TO LOGIN
            ================================================= */

            setTimeout(() => {

                navigate("/login");

            }, 1500);


        } catch (err) {

            console.error(
                "Signup error:",
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

        <div className="signup-page">

            <div className="signup-card">


                {/* =================================================
                    ICON
                ================================================= */}

                <div className="signup-icon">
                    👤
                </div>


                {/* =================================================
                    HEADING
                ================================================= */}

                <h1 className="signup-h1">
                    Find verified roles
                </h1>


                <p className="signup-subtitle">
                    Every account on JobConnect is verified —
                    by a person, not a checkbox.
                </p>


                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {error && (

                    <div className="signup-error">
                        {error}
                    </div>

                )}


                {/* =================================================
                    SUCCESS MESSAGE
                ================================================= */}

                {success && (

                    <div className="signup-success">
                        {success}
                    </div>

                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form onSubmit={handleSubmit}>


                    {/* =================================================
                        FULL NAME
                    ================================================= */}

                    <div className="signup-form-group">

                        <label htmlFor="name">
                            FULL NAME
                        </label>


                        <input
                            id="name"
                            type="text"
                            placeholder="e.g. Ananya Rao"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            disabled={loading}
                            required
                        />

                    </div>


                    {/* =================================================
                        EMAIL
                    ================================================= */}

                    <div className="signup-form-group">

                        <label htmlFor="email">
                            PERSONAL EMAIL
                        </label>


                        <input
                            id="email"
                            type="email"
                            placeholder="you@gmail.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            disabled={loading}
                            required
                        />


                        <small>
                            Only Gmail, Yahoo, and Outlook
                            .com email addresses are accepted.
                        </small>

                    </div>


                    {/* =================================================
                        PASSWORD
                    ================================================= */}

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
                                    setPassword(e.target.value)
                                }
                                minLength={8}
                                disabled={loading}
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
                            Minimum 8 characters, including
                            one capital letter, one number,
                            and one special character.
                        </small>

                    </div>


                    {/* =================================================
                        CREATE ACCOUNT BUTTON
                    ================================================= */}

                    <button
                        type="submit"
                        className="signup-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating account..."
                            : "Create Account"}

                    </button>

                </form>


                {/* =================================================
                    LOGIN
                ================================================= */}

                <div className="already-account">

                    <span>
                        Already have an account?
                    </span>


                    <Link to="/login">
                        Log in
                    </Link>

                </div>


                {/* =================================================
                    EMPLOYER SIGNUP
                ================================================= */}

                <div className="employer-question">

                    <span>
                        Hiring, not job hunting?
                    </span>


                    <Link to="/employer/signup">
                        Sign up as an employer
                    </Link>

                </div>


            </div>

        </div>
    );
}

export default JobseekerSignup;