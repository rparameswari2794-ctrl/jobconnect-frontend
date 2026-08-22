import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function EmployerSignup() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [workEmail, setWorkEmail] = useState("");
    const [password, setPassword] = useState("");

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

        <div className="signup-page">

            <div className="signup-card">


                {/* Icon */}

                <div className="signup-icon">
                    💼
                </div>


                {/* Heading */}

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


                        <input
                            id="password"
                            type="password"
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

    );
}

export default EmployerSignup;