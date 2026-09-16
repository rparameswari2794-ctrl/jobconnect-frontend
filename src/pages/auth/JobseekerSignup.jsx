import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function JobseekerSignup() {
    const navigate = useNavigate();

    // =========================================================
    // NORMAL SIGNUP STATE
    // =========================================================

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    // =========================================================
    // GOOGLE SIGNUP STATE
    // =========================================================

    const [googleToken, setGoogleToken] = useState("");

    const [showGooglePassword, setShowGooglePassword] =
        useState(false);

    const [googlePassword, setGooglePassword] =
        useState("");

    const [googlePasswordConfirmation, setGooglePasswordConfirmation] =
        useState("");

    const [showGooglePasswordValue, setShowGooglePasswordValue] =
        useState(false);

    // =========================================================
    // COMMON STATE
    // =========================================================

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const canvasRef = useRef(null);
    const googleButtonRef = useRef(null);

    // =========================================================
    // GOOGLE IDENTITY SERVICES
    // =========================================================

    useEffect(() => {
        const clientId =
            import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.error(
                "VITE_GOOGLE_CLIENT_ID is not configured."
            );

            return;
        }

        function initializeGoogle() {
            if (
                !window.google ||
                !window.google.accounts ||
                !window.google.accounts.id ||
                !googleButtonRef.current
            ) {
                return;
            }

            googleButtonRef.current.innerHTML = "";

            window.google.accounts.id.initialize({
                client_id: clientId,

                callback: handleGoogleCredential,

                auto_select: false,

                cancel_on_tap_outside: true,

                use_fedcm_for_prompt: false,
            });

            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                {
                    theme: "outline",

                    size: "large",

                    width: 380,

                    text: "continue_with",

                    shape: "rectangular",

                    logo_alignment: "left",
                }
            );
        }

        // Google script already loaded
        if (
            window.google &&
            window.google.accounts &&
            window.google.accounts.id
        ) {
            initializeGoogle();

            return;
        }

        // Check if another component already added it
        const existingScript =
            document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]'
            );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                initializeGoogle
            );

            return () => {
                existingScript.removeEventListener(
                    "load",
                    initializeGoogle
                );
            };
        }

        // Load Google Identity Services
        const script =
            document.createElement("script");

        script.src =
            "https://accounts.google.com/gsi/client";

        script.async = true;

        script.defer = true;

        script.onload = initializeGoogle;

        document.head.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, []);

    // =========================================================
    // NORMAL SIGNUP
    // =========================================================

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        // =====================================================
        // FULL NAME VALIDATION
        // =====================================================

        if (!name.trim()) {
            setError(
                "Please enter your full name."
            );

            return;
        }

        // =====================================================
        // EMAIL VALIDATION
        // =====================================================

        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook)\.com$/i;

        if (
            !emailPattern.test(
                email.trim()
            )
        ) {
            setError(
                "Please use a valid Gmail, Yahoo, or Outlook email address."
            );

            return;
        }

        // =====================================================
        // PASSWORD VALIDATION
        // =====================================================

        const passwordPattern =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (
            !passwordPattern.test(
                password
            )
        ) {
            setError(
                "Password must be at least 8 characters and contain one capital letter, one number, and one special character."
            );

            return;
        }

        // =====================================================
        // API REQUEST
        // =====================================================

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${API_BASE}/auth/jobseeker/signup/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                full_name:
                                    name.trim(),

                                email:
                                    email
                                        .trim()
                                        .toLowerCase(),

                                password:
                                    password,

                                role:
                                    "jobseeker",
                            }),
                    }
                );

            // =================================================
            // READ RESPONSE AS TEXT FIRST
            // =================================================

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

            // =================================================
            // PARSE JSON
            // =================================================

            let data = null;

            try {
                data =
                    JSON.parse(
                        responseText
                    );
            } catch (jsonError) {
                console.error(
                    "Backend returned non-JSON response:",
                    responseText
                );

                if (
                    response.status ===
                    404
                ) {
                    throw new Error(
                        "Signup API not found. Please check the Django signup URL."
                    );
                }

                if (
                    response.status >=
                    500
                ) {
                    throw new Error(
                        "Server error while creating account. Please check the Django terminal."
                    );
                }

                throw new Error(
                    `Signup API returned an invalid response. HTTP ${response.status}.`
                );
            }

            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {
                let firstError = "";

                if (
                    typeof data ===
                        "object" &&
                    data !== null
                ) {
                    firstError =
                        Object.values(
                            data
                        )
                            .flat()
                            .find(
                                (
                                    message
                                ) =>
                                    typeof message ===
                                    "string"
                            ) || "";
                }

                throw new Error(
                    firstError ||
                    data?.detail ||
                    data?.message ||
                    "Unable to create account."
                );
            }

            // =================================================
            // SUCCESS
            // =================================================

            setSuccess(
                "Account created successfully! Waiting for admin approval."
            );

            // =================================================
            // CLEAR FORM
            // =================================================

            setName("");
            setEmail("");
            setPassword("");

            // =================================================
            // GO TO LOGIN
            // =================================================

            setTimeout(() => {
                navigate(
                    "/login"
                );
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

    // =========================================================
    // GOOGLE CREDENTIAL CALLBACK
    // =========================================================

    async function handleGoogleCredential(
        response
    ) {
        if (
            !response ||
            !response.credential
        ) {
            setError(
                "Google sign-in failed. Please try again."
            );

            return;
        }

        setError("");
        setSuccess("");

        setLoading(true);

        const token =
            response.credential;

        try {
            // =================================================
            // FIRST GOOGLE REQUEST
            // =================================================

            const apiResponse =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                google_token:
                                    token,

                                role:
                                    "jobseeker",
                            }),
                    }
                );

            const responseText =
                await apiResponse.text();

            console.log(
                "GOOGLE SIGNUP STATUS:",
                apiResponse.status
            );

            console.log(
                "GOOGLE SIGNUP RESPONSE:",
                responseText
            );

            let data = null;

            try {
                data =
                    JSON.parse(
                        responseText
                    );
            } catch (jsonError) {
                console.error(
                    "Google signup returned non-JSON:",
                    responseText
                );

                throw new Error(
                    "Google signup returned an invalid server response."
                );
            }

            // =================================================
            // NEW GOOGLE USER
            // =================================================

            if (
                apiResponse.status ===
                    409 &&
                data?.new_google_user
            ) {
                setGoogleToken(
                    token
                );

                setGooglePassword(
                    ""
                );

                setGooglePasswordConfirmation(
                    ""
                );

                setShowGooglePassword(
                    true
                );

                setLoading(false);

                return;
            }

            // =================================================
            // GOOGLE API ERROR
            // =================================================

            if (!apiResponse.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    "Google signup failed."
                );
            }

            // =================================================
            // EXISTING USER / SUCCESS
            // =================================================

            handleGoogleLoginSuccess(
                data
            );

        } catch (err) {
            console.error(
                "Google signup error:",
                err
            );

            setError(
                err.message ||
                "Unable to continue with Google."
            );

            setLoading(false);
        }
    }

    // =========================================================
    // GOOGLE LOGIN SUCCESS
    // =========================================================

    function handleGoogleLoginSuccess(
        data
    ) {
        const accessToken =
            data?.access;

        const refreshToken =
            data?.refresh;

        const user =
            data?.user;

        // =====================================================
        // ACCESS TOKEN
        // =====================================================

        if (!accessToken) {
            throw new Error(
                "Google authentication succeeded, but access token was not received."
            );
        }

        // =====================================================
        // USER
        // =====================================================

        if (!user) {
            throw new Error(
                "Google authentication succeeded, but user information was not received."
            );
        }

        console.log(
            "GOOGLE LOGIN USER:",
            user
        );

        // =====================================================
        // SAVE JWT
        // Same keys used by your normal Login page
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

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        // =====================================================
        // ROLE
        // =====================================================

        const role =
            user.role ||
            user.user_type ||
            user.account_type;

        console.log(
            "GOOGLE USER ROLE:",
            role
        );

        // =====================================================
        // JOBSEEKER
        // =====================================================

        if (
            role ===
                "jobseeker" ||
            role ===
                "job_seeker"
        ) {
            setSuccess(
                "Google account connected successfully!"
            );

            setLoading(false);

            setTimeout(() => {
                navigate(
                    "/jobseeker/dashboard"
                );
            }, 800);

            return;
        }

        // =====================================================
        // EMPLOYER
        // =====================================================

        if (
            role ===
            "employer"
        ) {
            setSuccess(
                "Google account connected successfully!"
            );

            setLoading(false);

            setTimeout(() => {
                navigate(
                    "/employer/dashboard"
                );
            }, 800);

            return;
        }

        // =====================================================
        // ADMIN
        // =====================================================

        if (
            role ===
            "admin"
        ) {
            setSuccess(
                "Google account connected successfully!"
            );

            setLoading(false);

            setTimeout(() => {
                navigate(
                    "/admin/dashboard"
                );
            }, 800);

            return;
        }

        // =====================================================
        // UNKNOWN ROLE
        // =====================================================

        throw new Error(
            "Your account role could not be identified."
        );
    }

    // =========================================================
    // GOOGLE PASSWORD SETUP
    // =========================================================

    async function handleGooglePasswordSubmit(
        e
    ) {
        e.preventDefault();

        setError("");
        setSuccess("");

        // =====================================================
        // PASSWORD VALIDATION
        // =====================================================

        const passwordPattern =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (
            !passwordPattern.test(
                googlePassword
            )
        ) {
            setError(
                "Password must be at least 8 characters and contain one capital letter, one number, and one special character."
            );

            return;
        }

        // =====================================================
        // PASSWORD MATCH
        // =====================================================

        if (
            googlePassword !==
            googlePasswordConfirmation
        ) {
            setError(
                "Passwords do not match."
            );

            return;
        }

        // =====================================================
        // GOOGLE TOKEN CHECK
        // =====================================================

        if (!googleToken) {
            setError(
                "Google verification has expired. Please try again."
            );

            setShowGooglePassword(
                false
            );

            return;
        }

        try {
            setLoading(true);

            // =================================================
            // SECOND GOOGLE REQUEST
            // =================================================

            const response =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                google_token:
                                    googleToken,

                                password:
                                    googlePassword,

                                password_confirmation:
                                    googlePasswordConfirmation,

                                role:
                                    "jobseeker",
                            }),
                    }
                );

            const responseText =
                await response.text();

            console.log(
                "GOOGLE PASSWORD STATUS:",
                response.status
            );

            console.log(
                "GOOGLE PASSWORD RESPONSE:",
                responseText
            );

            let data = null;

            try {
                data =
                    JSON.parse(
                        responseText
                    );
            } catch (jsonError) {
                console.error(
                    "Google password setup returned non-JSON:",
                    responseText
                );

                throw new Error(
                    "Server returned an invalid response."
                );
            }

            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {
                let firstError = "";

                if (
                    typeof data ===
                        "object" &&
                    data !== null
                ) {
                    firstError =
                        Object.values(
                            data
                        )
                            .flat()
                            .find(
                                (
                                    message
                                ) =>
                                    typeof message ===
                                    "string"
                            ) || "";
                }

                throw new Error(
                    firstError ||
                    data?.detail ||
                    data?.message ||
                    "Unable to complete Google signup."
                );
            }

            // =================================================
            // SUCCESS
            // =================================================

            handleGoogleLoginSuccess(
                data
            );

            // =================================================
            // CLEAR GOOGLE STATE
            // =================================================

            setGoogleToken("");

            setGooglePassword("");

            setGooglePasswordConfirmation(
                ""
            );

            setShowGooglePassword(
                false
            );

        } catch (err) {
            console.error(
                "Google password setup error:",
                err
            );

            setError(
                err.message ||
                "Unable to complete Google signup."
            );

            setLoading(false);
        }
    }

    // =========================================================
    // CANCEL GOOGLE SIGNUP
    // =========================================================

    function cancelGoogleSignup() {
        setShowGooglePassword(
            false
        );

        setGoogleToken("");

        setGooglePassword("");

        setGooglePasswordConfirmation(
            ""
        );

        setShowGooglePasswordValue(
            false
        );

        setError("");

        setSuccess("");
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="bridge-signup">

            <style>{`

                /* =================================================
                   ROOT
                ================================================= */

                .bridge-signup {
                    --paper: #fff8f2;
                    --ink: #1a1410;
                    --ink-soft: #6b6259;
                    --coral: #ff5b3d;
                    --coral-deep: #e23f22;
                    --teal: #0b8f7a;
                    --gold: #ffc94d;
                    --panel: #ffffff;
                    --line: #ebe0d4;
                    --error: #d64545;
                    --success: #0b8f7a;

                    min-height: 100vh;
                    width: 100%;

                    margin: 0;

                    background:
                        var(--paper);

                    color:
                        var(--ink);

                    font-family:
                        "Inter",
                        sans-serif;

                    display:
                        flex;

                    align-items:
                        stretch;

                    box-sizing:
                        border-box;
                }

                .bridge-signup *,
                .bridge-signup
                *::before,
                .bridge-signup
                *::after {
                    box-sizing:
                        border-box;
                }


                /* =================================================
                   LEFT PANEL
                ================================================= */

                .bridge-signup-brand-panel {
                    position:
                        relative;

                    flex:
                        1 1 46%;

                    min-height:
                        100vh;

                    background:
                        radial-gradient(
                            circle at 20% 20%,
                            rgba(
                                255,
                                201,
                                77,
                                0.14
                            ),
                            transparent 28%
                        ),

                        radial-gradient(
                            circle at 80% 70%,
                            rgba(
                                11,
                                143,
                                122,
                                0.18
                            ),
                            transparent 30%
                        ),

                        linear-gradient(
                            160deg,
                            #17110d 0%,
                            #241b14 50%,
                            #17110d 100%
                        );

                    overflow:
                        hidden;

                    display:
                        flex;

                    flex-direction:
                        column;

                    justify-content:
                        space-between;

                    padding:
                        3.2rem;
                }


                .bridge-signup-brand-panel::before {
                    content:
                        "";

                    position:
                        absolute;

                    width:
                        420px;

                    height:
                        420px;

                    left:
                        -180px;

                    top:
                        18%;

                    border-radius:
                        50%;

                    background:
                        rgba(
                            255,
                            91,
                            61,
                            0.12
                        );

                    filter:
                        blur(50px);

                    pointer-events:
                        none;

                    z-index:
                        1;
                }


                .bridge-signup-brand-panel::after {
                    content:
                        "";

                    position:
                        absolute;

                    width:
                        350px;

                    height:
                        350px;

                    right:
                        -150px;

                    bottom:
                        -100px;

                    border-radius:
                        50%;

                    background:
                        rgba(
                            11,
                            143,
                            122,
                            0.15
                        );

                    filter:
                        blur(55px);

                    pointer-events:
                        none;

                    z-index:
                        1;
                }


                /* =================================================
                   CANVAS
                ================================================= */

                .bridge-signup-net {
                    position:
                        absolute;

                    inset:
                        0;

                    width:
                        100%;

                    height:
                        100%;

                    z-index:
                        2;

                    opacity:
                        0.95;
                }


                /* =================================================
                   BRAND
                ================================================= */

                .bridge-signup-brand {
                    position:
                        relative;

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        0.7rem;

                    z-index:
                        5;
                }


                .bridge-signup-brand svg {
                    width:
                        38px;

                    height:
                        38px;

                    filter:
                        drop-shadow(
                            0 0 10px
                            rgba(
                                255,
                                201,
                                77,
                                0.25
                            )
                        );
                }


                .bridge-signup-brand-name {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight:
                        800;

                    font-size:
                        1.3rem;

                    letter-spacing:
                        0.01em;

                    color:
                        #fff8f2;
                }


                /* =================================================
                   LEFT CONTENT
                ================================================= */

                .bridge-signup-brand-copy {
                    position:
                        relative;

                    z-index:
                        5;

                    max-width:
                        30rem;

                    margin-top:
                        auto;

                    margin-bottom:
                        auto;
                }


                .bridge-signup-eyebrow {
                    display:
                        inline-flex;

                    align-items:
                        center;

                    gap:
                        0.5rem;

                    font-family:
                        "JetBrains Mono",
                        monospace;

                    font-size:
                        0.72rem;

                    letter-spacing:
                        0.13em;

                    text-transform:
                        uppercase;

                    color:
                        var(--gold);

                    margin:
                        0 0 1rem 0;
                }


                .bridge-signup-eyebrow::before {
                    content:
                        "";

                    width:
                        22px;

                    height:
                        2px;

                    border-radius:
                        10px;

                    background:
                        var(--coral);
                }


                .bridge-signup-brand-copy h1 {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight:
                        800;

                    font-size:
                        clamp(
                            2.4rem,
                            4vw,
                            3.8rem
                        );

                    line-height:
                        1.04;

                    letter-spacing:
                        -0.035em;

                    margin:
                        0 0 1.25rem 0;

                    color:
                        #fff8f2;

                    text-shadow:
                        0 4px 30px
                        rgba(
                            0,
                            0,
                            0,
                            0.25
                        );
                }


                .bridge-signup-brand-copy h1 span {
                    color:
                        var(--coral);
                }


                .bridge-signup-brand-copy p {
                    font-size:
                        1rem;

                    line-height:
                        1.7;

                    color:
                        #d5c9bd;

                    margin:
                        0;

                    max-width:
                        28rem;
                }


                /* =================================================
                   HIGHLIGHTS
                ================================================= */

                .bridge-signup-highlights {
                    position:
                        relative;

                    z-index:
                        5;

                    display:
                        flex;

                    gap:
                        0.75rem;

                    margin-top:
                        2rem;

                    flex-wrap:
                        wrap;
                }


                .bridge-signup-highlight {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        0.5rem;

                    padding:
                        0.6rem 0.8rem;

                    border:
                        1px solid
                        rgba(
                            255,
                            248,
                            242,
                            0.12
                        );

                    border-radius:
                        10px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.045
                        );

                    backdrop-filter:
                        blur(8px);

                    color:
                        #ded4ca;

                    font-size:
                        0.75rem;
                }


                .bridge-signup-highlight-dot {
                    width:
                        7px;

                    height:
                        7px;

                    border-radius:
                        50%;

                    background:
                        var(--teal);

                    box-shadow:
                        0 0 10px
                        rgba(
                            11,
                            143,
                            122,
                            0.7
                        );
                }


                /* =================================================
                   STAT
                ================================================= */

                .bridge-signup-stat {
                    position:
                        relative;

                    z-index:
                        5;

                    display:
                        flex;

                    align-items:
                        baseline;

                    gap:
                        0.55rem;

                    font-family:
                        "JetBrains Mono",
                        monospace;
                }


                .bridge-signup-stat-number {
                    font-size:
                        1.7rem;

                    font-weight:
                        600;

                    color:
                        var(--coral);

                    text-shadow:
                        0 0 18px
                        rgba(
                            255,
                            91,
                            61,
                            0.35
                        );
                }


                .bridge-signup-stat-label {
                    font-size:
                        0.74rem;

                    color:
                        #c9bfb2;
                }


                /* =================================================
                   RIGHT PANEL
                ================================================= */

                .bridge-signup-form-panel {
                    flex:
                        1 1 54%;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        2.5rem 2rem;

                    background:
                        var(--paper);

                    overflow-y:
                        auto;
                }


                .bridge-signup-form-wrap {
                    width:
                        100%;

                    max-width:
                        390px;
                }


                /* =================================================
                   TOGGLE
                ================================================= */

                .bridge-signup-toggle {
                    position:
                        relative;

                    width:
                        100%;

                    height:
                        52px;

                    margin-bottom:
                        2.3rem;

                    display:
                        flex;
                }


                .bridge-signup-track {
                    position:
                        relative;

                    width:
                        100%;

                    height:
                        100%;

                    border:
                        1.5px solid
                        var(--ink);

                    border-radius:
                        10px;

                    background:
                        var(--panel);

                    display:
                        flex;

                    padding:
                        4px;

                    overflow:
                        hidden;
                }


                .bridge-signup-fill {
                    position:
                        absolute;

                    top:
                        4px;

                    left:
                        calc(50% + 0px);

                    width:
                        calc(50% - 4px);

                    height:
                        calc(100% - 8px);

                    border-radius:
                        7px;

                    background:
                        linear-gradient(
                            135deg,
                            var(--coral),
                            var(--coral-deep)
                        );

                    z-index:
                        1;
                }


                .bridge-signup-toggle button {
                    position:
                        relative;

                    z-index:
                        2;

                    flex:
                        1;

                    background:
                        none;

                    border:
                        none;

                    font-family:
                        "Inter",
                        sans-serif;

                    font-weight:
                        600;

                    font-size:
                        0.85rem;

                    color:
                        var(--ink-soft);

                    cursor:
                        pointer;
                }


                .bridge-signup-toggle button.active {
                    color:
                        #ffffff;
                }


                /* =================================================
                   TITLE
                ================================================= */

                .bridge-signup-form-title {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight:
                        800;

                    font-size:
                        1.8rem;

                    margin:
                        0 0 0.4rem 0;

                    color:
                        var(--ink);
                }


                .bridge-signup-form-sub {
                    font-size:
                        0.88rem;

                    color:
                        var(--ink-soft);

                    margin:
                        0 0 1.8rem 0;

                    line-height:
                        1.5;
                }


                /* =================================================
                   ERROR
                ================================================= */

                .bridge-signup-error {
                    background:
                        #fdecea;

                    border:
                        1px solid
                        #f1c6bc;

                    color:
                        var(--error);

                    border-radius:
                        8px;

                    padding:
                        0.7rem 0.85rem;

                    font-size:
                        0.78rem;

                    line-height:
                        1.4;

                    margin-bottom:
                        1rem;
                }


                /* =================================================
                   SUCCESS
                ================================================= */

                .bridge-signup-success {
                    background:
                        #e8f6f1;

                    border:
                        1px solid
                        #b8dfd4;

                    color:
                        var(--success);

                    border-radius:
                        8px;

                    padding:
                        0.7rem 0.85rem;

                    font-size:
                        0.78rem;

                    line-height:
                        1.4;

                    margin-bottom:
                        1rem;
                }


                /* =================================================
                   FIELD
                ================================================= */

                .bridge-signup-field {
                    margin-bottom:
                        1.1rem;
                }


                .bridge-signup-field label {
                    display:
                        block;

                    font-size:
                        0.76rem;

                    font-weight:
                        600;

                    color:
                        var(--ink);

                    margin-bottom:
                        0.4rem;
                }


                .bridge-signup-field input {
                    width:
                        100%;

                    background:
                        #ffffff;

                    border:
                        1.5px solid
                        var(--line);

                    border-radius:
                        8px;

                    padding:
                        0.75rem 0.85rem;

                    color:
                        var(--ink);

                    font-family:
                        "Inter",
                        sans-serif;

                    font-size:
                        0.9rem;

                    outline:
                        none;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }


                .bridge-signup-field input::placeholder {
                    color:
                        #b3a99c;
                }


                .bridge-signup-field input:focus {
                    border-color:
                        var(--coral);

                    box-shadow:
                        0 0 0 3px
                        rgba(
                            255,
                            91,
                            61,
                            0.15
                        );
                }


                .bridge-signup-field input:disabled {
                    opacity:
                        0.7;

                    cursor:
                        not-allowed;
                }


                .bridge-signup-help {
                    display:
                        block;

                    margin-top:
                        0.45rem;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.7rem;

                    line-height:
                        1.45;
                }


                /* =================================================
                   PASSWORD
                ================================================= */

                .bridge-signup-password {
                    position:
                        relative;
                }


                .bridge-signup-password input {
                    padding-right:
                        45px;
                }


                .bridge-signup-eye {
                    position:
                        absolute;

                    right:
                        6px;

                    top:
                        50%;

                    transform:
                        translateY(-50%);

                    border:
                        none;

                    background:
                        none;

                    cursor:
                        pointer;

                    font-size:
                        15px;

                    padding:
                        6px;
                }


                /* =================================================
                   CREATE ACCOUNT BUTTON
                ================================================= */

                .bridge-signup-submit {
                    width:
                        100%;

                    padding:
                        0.85rem;

                    border-radius:
                        8px;

                    border:
                        none;

                    background:
                        var(--coral);

                    color:
                        #ffffff;

                    font-family:
                        "Inter",
                        sans-serif;

                    font-weight:
                        700;

                    font-size:
                        0.92rem;

                    cursor:
                        pointer;

                    margin-top:
                        0.2rem;

                    transition:
                        transform 0.15s ease,
                        box-shadow 0.15s ease,
                        background 0.15s ease;
                }


                .bridge-signup-submit:hover:not(:disabled) {
                    background:
                        var(--coral-deep);

                    box-shadow:
                        0 7px 22px -6px
                        rgba(
                            255,
                            91,
                            61,
                            0.5
                        );

                    transform:
                        translateY(-1px);
                }


                .bridge-signup-submit:disabled {
                    opacity:
                        0.7;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   GOOGLE SIGNUP
                ================================================= */

                .bridge-signup-google-divider {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        0.75rem;

                    margin:
                        1.25rem 0;

                    color:
                        #9b9187;

                    font-size:
                        0.72rem;
                }


                .bridge-signup-google-divider-line {
                    flex:
                        1;

                    height:
                        1px;

                    background:
                        var(--line);
                }


                .bridge-signup-google-button {
                    width:
                        100%;

                    min-height:
                        44px;

                    display:
                        flex;

                    justify-content:
                        center;

                    align-items:
                        center;
                }


                /* =================================================
                   GOOGLE PASSWORD CARD
                ================================================= */

                .bridge-signup-google-password-card {
                    margin-top:
                        1.25rem;

                    padding:
                        1rem;

                    border:
                        1px solid
                        var(--line);

                    border-radius:
                        10px;

                    background:
                        #ffffff;

                    box-shadow:
                        0 8px 25px
                        rgba(
                            26,
                            20,
                            16,
                            0.04
                        );
                }


                .bridge-signup-google-password-title {
                    margin:
                        0 0 0.45rem;

                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-size:
                        1.1rem;

                    font-weight:
                        800;
                }


                .bridge-signup-google-password-description {
                    margin:
                        0 0 1rem;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.78rem;

                    line-height:
                        1.5;
                }


                .bridge-signup-google-cancel {
                    width:
                        100%;

                    margin-top:
                        0.7rem;

                    padding:
                        0.65rem;

                    border:
                        1px solid
                        var(--line);

                    border-radius:
                        8px;

                    background:
                        var(--paper);

                    color:
                        var(--ink-soft);

                    cursor:
                        pointer;

                    font-size:
                        0.8rem;

                    font-weight:
                        600;
                }


                .bridge-signup-google-cancel:hover:not(:disabled) {
                    border-color:
                        var(--coral);

                    color:
                        var(--coral);
                }


                .bridge-signup-google-cancel:disabled {
                    opacity:
                        0.6;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   LOGIN / EMPLOYER LINKS
                ================================================= */

                .bridge-signup-link {
                    text-align:
                        center;

                    margin-top:
                        1rem;

                    font-size:
                        0.82rem;

                    color:
                        var(--ink-soft);
                }


                .bridge-signup-link a {
                    color:
                        var(--teal);

                    text-decoration:
                        none;

                    font-weight:
                        600;
                }


                .bridge-signup-link a:hover {
                    color:
                        var(--coral);
                }


                /* =================================================
                   PRIVACY
                ================================================= */

                .bridge-signup-privacy {
                    text-align:
                        center;

                    margin-top:
                        1.25rem;

                    font-size:
                        0.72rem;

                    line-height:
                        1.5;

                    color:
                        var(--ink-soft);
                }


                .bridge-signup-privacy a {
                    color:
                        var(--teal);

                    text-decoration:
                        none;

                    font-weight:
                        600;
                }


                .bridge-signup-privacy a:hover {
                    color:
                        var(--coral);
                }


                /* =================================================
                   RESPONSIVE
                ================================================= */

                @media (max-width: 860px) {

                    .bridge-signup {
                        flex-direction:
                            column;
                    }


                    .bridge-signup-brand-panel {
                        min-height:
                            360px;

                        padding:
                            2rem;
                    }


                    .bridge-signup-brand-copy {
                        margin-top:
                            3rem;

                        margin-bottom:
                            2rem;
                    }


                    .bridge-signup-brand-copy h1 {
                        font-size:
                            2.3rem;
                    }


                    .bridge-signup-form-panel {
                        padding:
                            2.5rem 1.5rem 4rem;
                    }
                }


                @media (max-width: 520px) {

                    .bridge-signup-brand-panel {
                        min-height:
                            320px;
                    }


                    .bridge-signup-brand-copy h1 {
                        font-size:
                            1.9rem;
                    }


                    .bridge-signup-brand-copy p {
                        font-size:
                            0.88rem;
                    }


                    .bridge-signup-highlights {
                        display:
                            none;
                    }


                    .bridge-signup-form-panel {
                        padding:
                            2rem 1.2rem 3rem;
                    }


                    .bridge-signup-form-title {
                        font-size:
                            1.55rem;
                    }
                }


                @media (prefers-reduced-motion: reduce) {

                    .bridge-signup * {
                        animation-duration:
                            0.01ms !important;

                        animation-iteration-count:
                            1 !important;

                        transition-duration:
                            0.01ms !important;
                    }
                }

            `}</style>


            {/* =====================================================
                LEFT BRAND PANEL
            ===================================================== */}

            <div className="bridge-signup-brand-panel">

                <canvas
                    ref={canvasRef}
                    id="bridgeSignupNet"
                    className="bridge-signup-net"
                />


                {/* BRAND */}

                <div className="bridge-signup-brand">

                    <svg
                        viewBox="0 0 40 40"
                        fill="none"
                        aria-hidden="true"
                    >

                        <circle
                            cx="8"
                            cy="28"
                            r="4"
                            fill="#0B8F7A"
                        />

                        <circle
                            cx="32"
                            cy="28"
                            r="4"
                            fill="#FF5B3D"
                        />

                        <path
                            d="M4 30 C 4 12, 36 12, 36 30"
                            stroke="#FFC94D"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />

                    </svg>

                    <span className="bridge-signup-brand-name">
                        Job Connect
                    </span>

                </div>


                {/* LEFT CONTENT */}

                <div className="bridge-signup-brand-copy">

                    <p className="bridge-signup-eyebrow">
                        Job Connect Platform
                    </p>


                    <h1>
                        Build your profile.
                        <span>
                            {" "}Find your opportunity.
                        </span>
                    </h1>


                    <p>
                        Create your Job Connect account,
                        build your professional profile,
                        discover meaningful careers,
                        and connect with verified employers.
                    </p>


                    <div className="bridge-signup-highlights">

                        <div className="bridge-signup-highlight">
                            <span className="bridge-signup-highlight-dot" />
                            Verified opportunities
                        </div>


                        <div className="bridge-signup-highlight">
                            <span className="bridge-signup-highlight-dot" />
                            Trusted employers
                        </div>


                        <div className="bridge-signup-highlight">
                            <span className="bridge-signup-highlight-dot" />
                            Career growth
                        </div>

                    </div>

                </div>


                {/* STAT */}

                <div className="bridge-signup-stat">

                    <span className="bridge-signup-stat-number">
                        3,482
                    </span>

                    <span className="bridge-signup-stat-label">
                        connections made this week
                    </span>

                </div>

            </div>


            {/* =====================================================
                RIGHT SIGNUP PANEL
            ===================================================== */}

            <div className="bridge-signup-form-panel">

                <div className="bridge-signup-form-wrap">


                    {/* =================================================
                        LOGIN / CREATE ACCOUNT TOGGLE
                    ================================================= */}

                    <div className="bridge-signup-toggle">

                        <div className="bridge-signup-track">

                            <div className="bridge-signup-fill" />


                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/login"
                                    )
                                }
                            >
                                Login
                            </button>


                            <button
                                type="button"
                                className="active"
                            >
                                Create account
                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <h2 className="bridge-signup-form-title">
                        Create your account
                    </h2>


                    <p className="bridge-signup-form-sub">
                        Start your journey with Job Connect.
                    </p>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <div className="bridge-signup-error">
                            {error}
                        </div>
                    )}


                    {/* =================================================
                        SUCCESS
                    ================================================= */}

                    {success && (
                        <div className="bridge-signup-success">
                            {success}
                        </div>
                    )}


                    {/* =================================================
                        NORMAL SIGNUP FORM
                    ================================================= */}

                    {!showGooglePassword && (
                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            {/* FULL NAME */}

                            <div className="bridge-signup-field">

                                <label htmlFor="signup-name">
                                    Full name
                                </label>

                                <input
                                    id="signup-name"
                                    type="text"
                                    placeholder="e.g. Ananya Rao"
                                    value={
                                        name
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    autoComplete="name"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="bridge-signup-field">

                                <label htmlFor="signup-email">
                                    Email
                                </label>

                                <input
                                    id="signup-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={
                                        email
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    autoComplete="email"
                                    required
                                />

                                <small className="bridge-signup-help">
                                    Only Gmail, Yahoo, and Outlook
                                    .com email addresses are accepted.
                                </small>

                            </div>


                            {/* PASSWORD */}

                            <div className="bridge-signup-field">

                                <label htmlFor="signup-password">
                                    Password
                                </label>

                                <div className="bridge-signup-password">

                                    <input
                                        id="signup-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="••••••••"
                                        value={
                                            password
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        minLength={
                                            8
                                        }
                                        disabled={
                                            loading
                                        }
                                        autoComplete="new-password"
                                        required
                                    />


                                    <button
                                        type="button"
                                        className="bridge-signup-eye"
                                        onClick={() =>
                                            setShowPassword(
                                                (
                                                    prev
                                                ) =>
                                                    !prev
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


                                <small className="bridge-signup-help">
                                    Minimum 8 characters, including
                                    one capital letter, one number,
                                    and one special character.
                                </small>

                            </div>


                            {/* CREATE ACCOUNT */}

                            <button
                                type="submit"
                                className="bridge-signup-submit"
                                disabled={
                                    loading
                                }
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create Account"}
                            </button>

                        </form>
                    )}


                    {/* =================================================
                        GOOGLE SIGNUP
                    ================================================= */}

                    {!showGooglePassword && (
                        <>
                            <div className="bridge-signup-google-divider">

                                <span className="bridge-signup-google-divider-line" />

                                <span>
                                    OR
                                </span>

                                <span className="bridge-signup-google-divider-line" />

                            </div>


                            <div
                                ref={
                                    googleButtonRef
                                }
                                className="bridge-signup-google-button"
                            />

                        </>
                    )}


                    {/* =================================================
                        GOOGLE PASSWORD SETUP
                    ================================================= */}

                    {showGooglePassword && (

                        <div className="bridge-signup-google-password-card">

                            <h3 className="bridge-signup-google-password-title">
                                Create your Job Connect password
                            </h3>


                            <p className="bridge-signup-google-password-description">
                                Your Google account is verified.
                                Create a password so you can also
                                sign in to Job Connect with your
                                email and password.
                            </p>


                            <form
                                onSubmit={
                                    handleGooglePasswordSubmit
                                }
                            >

                                {/* PASSWORD */}

                                <div className="bridge-signup-field">

                                    <label htmlFor="google-password">
                                        Password
                                    </label>

                                    <div className="bridge-signup-password">

                                        <input
                                            id="google-password"
                                            type={
                                                showGooglePasswordValue
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="••••••••"
                                            value={
                                                googlePassword
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setGooglePassword(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                            autoComplete="new-password"
                                            minLength={
                                                8
                                            }
                                            required
                                        />


                                        <button
                                            type="button"
                                            className="bridge-signup-eye"
                                            onClick={() =>
                                                setShowGooglePasswordValue(
                                                    (
                                                        prev
                                                    ) =>
                                                        !prev
                                                )
                                            }
                                            aria-label={
                                                showGooglePasswordValue
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showGooglePasswordValue
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>


                                    <small className="bridge-signup-help">
                                        Minimum 8 characters, including
                                        one capital letter, one number,
                                        and one special character.
                                    </small>

                                </div>


                                {/* CONFIRM PASSWORD */}

                                <div className="bridge-signup-field">

                                    <label htmlFor="google-password-confirmation">
                                        Confirm password
                                    </label>

                                    <input
                                        id="google-password-confirmation"
                                        type="password"
                                        placeholder="••••••••"
                                        value={
                                            googlePasswordConfirmation
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setGooglePasswordConfirmation(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                        autoComplete="new-password"
                                        minLength={
                                            8
                                        }
                                        required
                                    />

                                </div>


                                {/* COMPLETE */}

                                <button
                                    type="submit"
                                    className="bridge-signup-submit"
                                    disabled={
                                        loading
                                    }
                                >
                                    {loading
                                        ? "Creating account..."
                                        : "Complete Google Signup"}
                                </button>

                            </form>


                            {/* CANCEL */}

                            <button
                                type="button"
                                className="bridge-signup-google-cancel"
                                onClick={
                                    cancelGoogleSignup
                                }
                                disabled={
                                    loading
                                }
                            >
                                Cancel
                            </button>

                        </div>
                    )}


                    {/* =================================================
                        LOGIN
                    ================================================= */}

                    <div className="bridge-signup-link">

                        Already have an account?{" "}

                        <Link to="/login">
                            Log in
                        </Link>

                    </div>


                    {/* =================================================
                        EMPLOYER
                    ================================================= */}

                    <div className="bridge-signup-link">

                        Hiring, not job hunting?{" "}

                        <Link to="/employer/signup">
                            Sign up as an employer
                        </Link>

                    </div>


                    {/* =================================================
                        PRIVACY
                    ================================================= */}

                    <div className="bridge-signup-privacy">

                        By continuing, you agree to our{" "}

                        <Link to="/privacy-policy">
                            Privacy Policy
                        </Link>

                        {" "}and applicable terms.

                    </div>

                </div>

            </div>


            {/* =====================================================
                NETWORK ANIMATION
            ===================================================== */}

            <SignupNetworkAnimation />

        </div>
    );
}


/* =============================================================
   NETWORK ANIMATION
============================================================= */

function SignupNetworkAnimation() {

    useEffect(() => {

        const canvas =
            document.getElementById(
                "bridgeSignupNet"
            );

        if (!canvas) {
            return;
        }

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            return;
        }

        let W = 0;
        let H = 0;

        let nodes = [];
        let pulses = [];

        let animationFrame;

        const NODE_COUNT = 28;


        function resize() {

            const panel =
                canvas.parentElement
                    .getBoundingClientRect();

            W =
                canvas.width =
                    panel.width;

            H =
                canvas.height =
                    panel.height;
        }


        function initNodes() {

            nodes = [];

            for (
                let i = 0;
                i < NODE_COUNT;
                i++
            ) {

                nodes.push({

                    x:
                        Math.random() *
                        W,

                    y:
                        Math.random() *
                        H,

                    r:
                        Math.random() *
                            1.8 +
                        1.3,

                    vx:
                        (
                            Math.random() -
                            0.5
                        ) *
                        0.18,

                    vy:
                        (
                            Math.random() -
                            0.5
                        ) *
                        0.18,
                });
            }

            pulses = [];
        }


        function maybeSpawnPulse() {

            if (
                Math.random() <
                    0.025 &&
                nodes.length > 1
            ) {

                const a =
                    nodes[
                        Math.floor(
                            Math.random() *
                                nodes.length
                        )
                    ];

                const b =
                    nodes[
                        Math.floor(
                            Math.random() *
                                nodes.length
                        )
                    ];


                const dx =
                    a.x - b.x;

                const dy =
                    a.y - b.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    distance < 180 &&
                    a !== b
                ) {

                    pulses.push({

                        a,
                        b,

                        t: 0,

                        color:
                            Math.random() <
                            0.5
                                ? "255,91,61"
                                : "11,143,122",
                    });
                }
            }
        }


        function draw() {

            ctx.clearRect(
                0,
                0,
                W,
                H
            );


            // =================================================
            // MOVE NODES
            // =================================================

            nodes.forEach((n) => {

                n.x += n.vx;

                n.y += n.vy;


                if (
                    n.x < 0 ||
                    n.x > W
                ) {
                    n.vx *= -1;
                }


                if (
                    n.y < 0 ||
                    n.y > H
                ) {
                    n.vy *= -1;
                }
            });


            // =================================================
            // CONNECTIONS
            // =================================================

            for (
                let i = 0;
                i < nodes.length;
                i++
            ) {

                for (
                    let j = i + 1;
                    j < nodes.length;
                    j++
                ) {

                    const dx =
                        nodes[i].x -
                        nodes[j].x;

                    const dy =
                        nodes[i].y -
                        nodes[j].y;

                    const dist =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );


                    if (
                        dist < 150
                    ) {

                        const opacity =
                            0.11 -
                            (
                                dist /
                                150
                            ) *
                            0.07;


                        ctx.beginPath();


                        ctx.moveTo(
                            nodes[i].x,
                            nodes[i].y
                        );


                        ctx.lineTo(
                            nodes[j].x,
                            nodes[j].y
                        );


                        ctx.strokeStyle =
                            `rgba(
                                255,
                                248,
                                242,
                                ${opacity}
                            )`;


                        ctx.lineWidth =
                            1;

                        ctx.stroke();
                    }
                }
            }


            // =================================================
            // NODES
            // =================================================

            nodes.forEach((n) => {

                ctx.beginPath();


                ctx.arc(
                    n.x,
                    n.y,
                    n.r,
                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    "rgba(255,248,242,0.7)";


                ctx.shadowColor =
                    "rgba(255,201,77,0.45)";


                ctx.shadowBlur =
                    7;

                ctx.fill();

                ctx.shadowBlur =
                    0;
            });


            // =================================================
            // PULSES
            // =================================================

            maybeSpawnPulse();


            pulses.forEach((p) => {
                p.t += 0.018;
            });


            pulses =
                pulses.filter(
                    (p) =>
                        p.t <= 1
                );


            pulses.forEach((p) => {

                const x =
                    p.a.x +
                    (
                        p.b.x -
                        p.a.x
                    ) *
                        p.t;


                const y =
                    p.a.y +
                    (
                        p.b.y -
                        p.a.y
                    ) *
                        p.t;


                ctx.beginPath();


                ctx.arc(
                    x,
                    y,
                    3,
                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    `rgba(
                        ${p.color},
                        0.95
                    )`;


                ctx.shadowColor =
                    `rgba(
                        ${p.color},
                        0.9
                    )`;


                ctx.shadowBlur =
                    12;

                ctx.fill();

                ctx.shadowBlur =
                    0;
            });


            animationFrame =
                requestAnimationFrame(
                    draw
                );
        }


        resize();

        initNodes();


        const handleResize =
            () => {

                resize();

                initNodes();
            };


        window.addEventListener(
            "resize",
            handleResize
        );


        animationFrame =
            requestAnimationFrame(
                draw
            );


        return () => {

            cancelAnimationFrame(
                animationFrame
            );

            window.removeEventListener(
                "resize",
                handleResize
            );
        };

    }, []);


    return null;
}


export default JobseekerSignup;