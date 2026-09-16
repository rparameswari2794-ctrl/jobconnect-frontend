import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID;


/*
=============================================================
GLOBAL GOOGLE STATE
=============================================================
*/

if (!window.__JOBCONNECT_GOOGLE__) {
    window.__JOBCONNECT_GOOGLE__ = {
        initialized: false,
        clientId: null,
        callback: null,
        scriptPromise: null,
    };
}


/*
=============================================================
LOAD GOOGLE IDENTITY SERVICES
=============================================================
*/

function loadGoogleScript() {
    const googleState = window.__JOBCONNECT_GOOGLE__;

    if (window.google?.accounts?.id) {
        return Promise.resolve();
    }

    if (googleState.scriptPromise) {
        return googleState.scriptPromise;
    }

    googleState.scriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existingScript) {
            if (window.google?.accounts?.id) {
                resolve();
                return;
            }

            existingScript.addEventListener(
                "load",
                () => resolve(),
                { once: true }
            );

            existingScript.addEventListener(
                "error",
                () =>
                    reject(
                        new Error(
                            "Unable to load Google Identity Services."
                        )
                    ),
                { once: true }
            );

            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://accounts.google.com/gsi/client";

        script.async = true;
        script.defer = true;

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(
                new Error(
                    "Unable to load Google Identity Services."
                )
            );
        };

        document.head.appendChild(script);
    });

    return googleState.scriptPromise;
}


/*
=============================================================
INITIALIZE GOOGLE
=============================================================
*/

function initializeGoogle() {
    const googleState =
        window.__JOBCONNECT_GOOGLE__;

    if (!window.google?.accounts?.id) {
        throw new Error(
            "Google Identity Services is not available."
        );
    }

    if (!GOOGLE_CLIENT_ID) {
        throw new Error(
            "VITE_GOOGLE_CLIENT_ID is not configured."
        );
    }

    if (
        googleState.initialized &&
        googleState.clientId === GOOGLE_CLIENT_ID
    ) {
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: (response) => {
            const callback =
                window.__JOBCONNECT_GOOGLE__?.callback;

            if (
                typeof callback === "function"
            ) {
                callback(response);
            }
        },

        auto_select: false,

        cancel_on_tap_outside: true,

        use_fedcm_for_prompt: false,
    });

    googleState.initialized = true;

    googleState.clientId =
        GOOGLE_CLIENT_ID;

    console.log(
        "Google Identity Services initialized successfully."
    );
}


/*
=============================================================
AUTH STORAGE

JobConnect primary token:

localStorage.jc_token
=============================================================
*/

function clearAuthStorage() {
    const keys = [
        "jc_token",
        "access",
        "access_token",
        "accessToken",
        "token",
        "jwt",
        "authToken",

        "refresh_token",
        "refresh",

        "jc_user",
        "user",

        "auth",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


function saveAuthStorage(
    accessToken,
    refreshToken,
    user
) {
    if (!accessToken) {
        throw new Error(
            "Login successful, but access token was not received."
        );
    }

    if (!user) {
        throw new Error(
            "Login successful, but user information was not received."
        );
    }

    /*
    Clear previous account.
    */

    clearAuthStorage();


    /*
    Primary JobConnect access token.
    */

    localStorage.setItem(
        "jc_token",
        accessToken
    );


    /*
    Refresh token.
    */

    if (refreshToken) {
        localStorage.setItem(
            "refresh_token",
            refreshToken
        );
    }


    /*
    User information.
    */

    localStorage.setItem(
        "jc_user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );


    console.log(
        "AUTH TOKEN SAVED:",
        !!localStorage.getItem("jc_token")
    );

    console.log(
        "AUTH USER SAVED:",
        !!localStorage.getItem("jc_user")
    );
}


/*
=============================================================
LOGIN COMPONENT
=============================================================
*/

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [googleLoading, setGoogleLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
    =========================================================
    GOOGLE CREDENTIAL CALLBACK
    =========================================================
    */

    async function handleGoogleCredential(response) {
        console.log(
            "GOOGLE CREDENTIAL RECEIVED"
        );

        if (!response?.credential) {
            setError(
                "Google login failed. Please try again."
            );

            return;
        }

        try {
            setGoogleLoading(true);
            setError("");

            console.log(
                "GOOGLE CURRENT ORIGIN:",
                window.location.origin
            );

            console.log(
                "GOOGLE CLIENT ID:",
                GOOGLE_CLIENT_ID
            );

            console.log(
                "GOOGLE API BASE:",
                API_BASE
            );


            const backendResponse =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            google_token:
                                response.credential,
                        }),
                    }
                );


            let data = {};

            try {
                data =
                    await backendResponse.json();
            } catch {
                data = {};
            }


            console.log(
                "GOOGLE LOGIN RESPONSE:",
                data
            );


            if (!backendResponse.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Google login failed."
                );
            }


            const accessToken =
                data.access;

            const refreshToken =
                data.refresh;

            const user =
                data.user;


            if (!accessToken) {
                throw new Error(
                    "Google login succeeded, but access token was not received."
                );
            }

            if (!user) {
                throw new Error(
                    "Google login succeeded, but user information was not received."
                );
            }


            console.log(
                "GOOGLE USER:",
                user
            );


            /*
            =================================================
            SAVE AUTHENTICATION

            This now uses exactly the same helper as
            normal login.
            =================================================
            */

            saveAuthStorage(
                accessToken,
                refreshToken,
                user
            );


            /*
            =================================================
            ROLE
            =================================================
            */

            const role =
                String(
                    user.role ||
                    user.user_type ||
                    user.account_type ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "GOOGLE USER ROLE:",
                role
            );


            /*
            JOB SEEKER
            */

            if (
                role === "jobseeker" ||
                role === "job_seeker"
            ) {
                navigate(
                    "/jobseeker/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            /*
            EMPLOYER
            */

            if (
                role === "employer"
            ) {
                navigate(
                    "/employer/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            /*
            ADMIN
            */

            if (
                role === "admin"
            ) {
                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            setError(
                "Google login succeeded, but your account role could not be identified."
            );

        } catch (err) {
            console.error(
                "GOOGLE LOGIN ERROR:",
                err
            );


            /*
            Only clear auth after a login operation
            fails.

            This is NOT used by HelpSupport.
            */

            clearAuthStorage();


            setError(
                err?.message ||
                "Unable to login with Google. Please try again."
            );

        } finally {
            setGoogleLoading(false);
        }
    }


    /*
    =========================================================
    GOOGLE SETUP
    =========================================================
    */

    useEffect(() => {
        let cancelled = false;

        const googleState =
            window.__JOBCONNECT_GOOGLE__;


        googleState.callback =
            handleGoogleCredential;


        async function setupGoogle() {
            try {
                console.log(
                    "GOOGLE CURRENT ORIGIN:",
                    window.location.origin
                );

                console.log(
                    "GOOGLE CLIENT ID:",
                    GOOGLE_CLIENT_ID
                );

                console.log(
                    "GOOGLE API BASE:",
                    API_BASE
                );


                await loadGoogleScript();


                if (cancelled) {
                    return;
                }


                initializeGoogle();


                const googleButton =
                    document.getElementById(
                        "google-login-button"
                    );


                if (!googleButton) {
                    console.warn(
                        "Google button container not found."
                    );

                    return;
                }


                googleButton.innerHTML = "";


                window.google.accounts.id.renderButton(
                    googleButton,
                    {
                        theme: "outline",

                        size: "large",

                        width: 380,

                        text: "continue_with",

                        shape: "rectangular",

                        logo_alignment: "left",
                    }
                );


                console.log(
                    "Google button rendered successfully."
                );

            } catch (err) {
                console.error(
                    "Google initialization/rendering error:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Google login could not be initialized."
                    );
                }
            }
        }


        setupGoogle();


        return () => {
            cancelled = true;

            if (
                googleState.callback ===
                handleGoogleCredential
            ) {
                googleState.callback = null;
            }
        };

    }, []);


    /*
    =========================================================
    NORMAL LOGIN
    =========================================================
    */

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");


        if (
            !email.trim() ||
            !password
        ) {
            setError(
                "Please enter your email and password."
            );

            return;
        }


        try {
            setLoading(true);


            const response =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            email:
                                email
                                    .trim()
                                    .toLowerCase(),

                            password:
                                password,
                        }),
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }


            console.log(
                "LOGIN RESPONSE:",
                data
            );


            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Invalid email or password."
                );
            }


            const accessToken =
                data.access;

            const refreshToken =
                data.refresh;

            const user =
                data.user;


            if (!accessToken) {
                throw new Error(
                    "Login successful, but access token was not received."
                );
            }

            if (!user) {
                throw new Error(
                    "Login successful, but user information was not received."
                );
            }


            console.log(
                "LOGIN USER:",
                user
            );


            /*
            =================================================
            SAVE AUTHENTICATION
            =================================================
            */

            saveAuthStorage(
                accessToken,
                refreshToken,
                user
            );


            /*
            =================================================
            ROLE
            =================================================
            */

            const role =
                String(
                    user.role ||
                    user.user_type ||
                    user.account_type ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "USER ROLE:",
                role
            );


            /*
            JOB SEEKER
            */

            if (
                role === "jobseeker" ||
                role === "job_seeker"
            ) {
                navigate(
                    "/jobseeker/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            /*
            EMPLOYER
            */

            if (
                role === "employer"
            ) {
                navigate(
                    "/employer/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            /*
            ADMIN
            */

            if (
                role === "admin"
            ) {
                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            setError(
                "Your account role could not be identified."
            );

        } catch (err) {
            console.error(
                "LOGIN ERROR:",
                err
            );


            /*
            This is a LOGIN failure, so clearing invalid
            authentication data is correct here.

            HelpSupport does NOT use this function.
            */

            clearAuthStorage();


            setError(
                err?.message ||
                "Unable to login. Please try again."
            );

        } finally {
            setLoading(false);
        }
    }


    /*
    =========================================================
    RENDER
    =========================================================
    */

    return (
        <div className="bridge-login">

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .bridge-login {
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

                    min-height: 100vh;
                    width: 100%;
                    margin: 0;

                    background:
                        var(--paper);

                    color:
                        var(--ink);

                    font-family:
                        "Inter",
                        Arial,
                        sans-serif;

                    display:
                        flex;

                    align-items:
                        stretch;
                }

                .bridge-login *,
                .bridge-login *::before,
                .bridge-login *::after {
                    box-sizing: border-box;
                }

                .bridge-brand-panel {
                    position: relative;

                    flex: 1 1 46%;

                    min-height: 100vh;

                    background:
                        radial-gradient(
                            circle at 20% 20%,
                            rgba(255, 201, 77, 0.14),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 80% 70%,
                            rgba(11, 143, 122, 0.18),
                            transparent 30%
                        ),
                        linear-gradient(
                            160deg,
                            #17110d 0%,
                            #241b14 50%,
                            #17110d 100%
                        );

                    overflow: hidden;

                    display: flex;

                    flex-direction: column;

                    justify-content: space-between;

                    padding: 3.2rem;
                }

                .bridge-brand-panel::before {
                    content: "";

                    position: absolute;

                    width: 420px;
                    height: 420px;

                    left: -180px;
                    top: 18%;

                    border-radius: 50%;

                    background:
                        rgba(255, 91, 61, 0.12);

                    filter: blur(50px);

                    pointer-events: none;
                }

                .bridge-brand-panel::after {
                    content: "";

                    position: absolute;

                    width: 350px;
                    height: 350px;

                    right: -150px;
                    bottom: -100px;

                    border-radius: 50%;

                    background:
                        rgba(11, 143, 122, 0.15);

                    filter: blur(55px);

                    pointer-events: none;
                }

                .bridge-net {
                    position: absolute;

                    inset: 0;

                    width: 100%;
                    height: 100%;

                    z-index: 2;

                    opacity: 0.95;
                }

                .bridge-brand {
                    position: relative;

                    display: flex;

                    align-items: center;

                    gap: 0.7rem;

                    z-index: 5;
                }

                .bridge-brand svg {
                    width: 38px;
                    height: 38px;
                }

                .bridge-brand-name {
                    font-weight: 800;
                    font-size: 1.3rem;
                    color: #fff8f2;
                }

                .bridge-brand-copy {
                    position: relative;

                    z-index: 5;

                    max-width: 30rem;

                    margin-top: auto;
                    margin-bottom: auto;
                }

                .bridge-eyebrow {
                    display: inline-flex;

                    align-items: center;

                    gap: 0.5rem;

                    font-size: 0.72rem;

                    letter-spacing: 0.13em;

                    text-transform: uppercase;

                    color: var(--gold);

                    margin: 0 0 1rem 0;
                }

                .bridge-eyebrow::before {
                    content: "";

                    width: 22px;
                    height: 2px;

                    border-radius: 10px;

                    background: var(--coral);
                }

                .bridge-brand-copy h1 {
                    font-weight: 800;

                    font-size:
                        clamp(2.4rem, 4vw, 3.8rem);

                    line-height: 1.04;

                    letter-spacing: -0.035em;

                    margin: 0 0 1.25rem 0;

                    color: #fff8f2;
                }

                .bridge-brand-copy h1 span {
                    color: var(--coral);
                }

                .bridge-brand-copy p {
                    font-size: 1rem;

                    line-height: 1.7;

                    color: #d5c9bd;

                    margin: 0;
                }

                .bridge-highlights {
                    position: relative;

                    z-index: 5;

                    display: flex;

                    gap: 0.75rem;

                    margin-top: 2rem;

                    flex-wrap: wrap;
                }

                .bridge-highlight {
                    display: flex;

                    align-items: center;

                    gap: 0.5rem;

                    padding: 0.6rem 0.8rem;

                    border:
                        1px solid
                        rgba(255, 248, 242, 0.12);

                    border-radius: 10px;

                    background:
                        rgba(255, 255, 255, 0.045);

                    color: #ded4ca;

                    font-size: 0.75rem;
                }

                .bridge-highlight-dot {
                    width: 7px;
                    height: 7px;

                    border-radius: 50%;

                    background: var(--teal);
                }

                .bridge-stat {
                    position: relative;

                    z-index: 5;

                    display: flex;

                    align-items: baseline;

                    gap: 0.55rem;
                }

                .bridge-stat-number {
                    font-size: 1.7rem;

                    font-weight: 600;

                    color: var(--coral);
                }

                .bridge-stat-label {
                    font-size: 0.74rem;

                    color: #c9bfb2;
                }

                .bridge-form-panel {
                    flex: 1 1 54%;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 2.5rem 2rem;

                    background: var(--paper);
                }

                .bridge-form-wrap {
                    width: 100%;

                    max-width: 390px;
                }

                .bridge-toggle {
                    width: 100%;

                    height: 52px;

                    margin-bottom: 2.3rem;
                }

                .bridge-track {
                    position: relative;

                    width: 100%;
                    height: 100%;

                    border:
                        1.5px solid
                        var(--ink);

                    border-radius: 10px;

                    background: #ffffff;

                    display: flex;

                    padding: 4px;

                    overflow: hidden;
                }

                .bridge-fill {
                    position: absolute;

                    top: 4px;
                    left: 4px;

                    width: calc(50% - 4px);

                    height: calc(100% - 8px);

                    border-radius: 7px;

                    background:
                        linear-gradient(
                            135deg,
                            var(--coral),
                            var(--coral-deep)
                        );

                    z-index: 1;
                }

                .bridge-toggle button {
                    position: relative;

                    z-index: 2;

                    flex: 1;

                    background: none;

                    border: none;

                    font-weight: 600;

                    font-size: 0.85rem;

                    color: var(--ink-soft);

                    cursor: pointer;
                }

                .bridge-toggle button.active {
                    color: #ffffff;
                }

                .bridge-form-title {
                    font-weight: 800;

                    font-size: 1.8rem;

                    margin: 0 0 0.4rem 0;

                    color: var(--ink);
                }

                .bridge-form-sub {
                    font-size: 0.88rem;

                    color: var(--ink-soft);

                    margin: 0 0 1.8rem 0;

                    line-height: 1.5;
                }

                .bridge-error {
                    background: #fdecea;

                    border:
                        1px solid
                        #f1c6bc;

                    color: var(--error);

                    border-radius: 8px;

                    padding: 0.7rem 0.85rem;

                    font-size: 0.78rem;

                    line-height: 1.4;

                    margin-bottom: 1rem;
                }

                .bridge-field {
                    margin-bottom: 1.1rem;
                }

                .bridge-field label {
                    display: block;

                    font-size: 0.76rem;

                    font-weight: 600;

                    color: var(--ink);

                    margin-bottom: 0.4rem;
                }

                .bridge-field input {
                    width: 100%;

                    background: #ffffff;

                    border:
                        1.5px solid
                        var(--line);

                    border-radius: 8px;

                    padding: 0.75rem 0.85rem;

                    color: var(--ink);

                    font-size: 0.9rem;

                    outline: none;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .bridge-field input::placeholder {
                    color: #b3a99c;
                }

                .bridge-field input:focus {
                    border-color: var(--coral);

                    box-shadow:
                        0 0 0 3px
                        rgba(255, 91, 61, 0.15);
                }

                .bridge-password {
                    position: relative;
                }

                .bridge-password input {
                    padding-right: 45px;
                }

                .bridge-eye {
                    position: absolute;

                    right: 6px;

                    top: 50%;

                    transform:
                        translateY(-50%);

                    border: none;

                    background: none;

                    cursor: pointer;

                    font-size: 15px;

                    padding: 6px;
                }

                .bridge-submit {
                    width: 100%;

                    padding: 0.85rem;

                    border-radius: 8px;

                    border: none;

                    background: var(--coral);

                    color: #ffffff;

                    font-weight: 700;

                    font-size: 0.92rem;

                    cursor: pointer;

                    transition:
                        transform 0.15s ease,
                        box-shadow 0.15s ease,
                        background 0.15s ease;
                }

                .bridge-submit:hover:not(:disabled) {
                    background: var(--coral-deep);

                    box-shadow:
                        0 7px 22px -6px
                        rgba(255, 91, 61, 0.5);

                    transform: translateY(-1px);
                }

                .bridge-submit:disabled {
                    opacity: 0.7;

                    cursor: not-allowed;
                }

                .bridge-forgot {
                    text-align: right;

                    margin-top: 1rem;
                }

                .bridge-forgot a {
                    color: var(--teal);

                    text-decoration: none;

                    font-size: 0.82rem;

                    font-weight: 600;
                }

                .bridge-divider {
                    display: flex;

                    align-items: center;

                    gap: 0.8rem;

                    margin: 1.6rem 0 1.1rem;

                    color: var(--ink-soft);

                    font-size: 0.74rem;
                }

                .bridge-divider::before,
                .bridge-divider::after {
                    content: "";

                    flex: 1;

                    height: 1px;

                    background: var(--line);
                }

                .bridge-google-wrapper {
                    width: 100%;

                    display: flex;

                    justify-content: center;

                    min-height: 44px;
                }

                #google-login-button {
                    width: 100%;

                    display: flex;

                    justify-content: center;
                }

                .bridge-google-loading {
                    font-size: 0.8rem;

                    color: var(--ink-soft);

                    text-align: center;

                    margin-top: 0.4rem;
                }

                .bridge-privacy {
                    text-align: center;

                    margin-top: 1.25rem;

                    font-size: 0.72rem;

                    line-height: 1.5;

                    color: var(--ink-soft);
                }

                .bridge-privacy a {
                    color: var(--teal);

                    text-decoration: none;

                    font-weight: 600;
                }

                @media (max-width: 860px) {
                    .bridge-login {
                        flex-direction: column;
                    }

                    .bridge-brand-panel {
                        min-height: 360px;

                        padding: 2rem;
                    }

                    .bridge-brand-copy {
                        margin-top: 3rem;

                        margin-bottom: 2rem;
                    }

                    .bridge-brand-copy h1 {
                        font-size: 2.3rem;
                    }

                    .bridge-form-panel {
                        padding: 2.5rem 1.5rem 4rem;
                    }
                }

                @media (max-width: 520px) {
                    .bridge-brand-panel {
                        min-height: 320px;
                    }

                    .bridge-brand-copy h1 {
                        font-size: 1.9rem;
                    }

                    .bridge-brand-copy p {
                        font-size: 0.88rem;
                    }

                    .bridge-highlights {
                        display: none;
                    }

                    .bridge-form-panel {
                        padding: 2rem 1.2rem 3rem;
                    }

                    .bridge-form-title {
                        font-size: 1.55rem;
                    }
                }

            `}</style>


            {/* LEFT BRAND PANEL */}

            <div className="bridge-brand-panel">

                <canvas
                    id="bridgeNet"
                    className="bridge-net"
                />


                <div className="bridge-brand">

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

                    <span className="bridge-brand-name">
                        Job Connect
                    </span>

                </div>


                <div className="bridge-brand-copy">

                    <p className="bridge-eyebrow">
                        Job Connect Platform
                    </p>

                    <h1>
                        Your next opportunity
                        starts with one
                        <span>
                            {" "}connection.
                        </span>
                    </h1>

                    <p>
                        Connect with the right
                        opportunities, discover
                        meaningful careers, and move
                        confidently toward your next
                        professional journey.
                    </p>


                    <div className="bridge-highlights">

                        <div className="bridge-highlight">
                            <span className="bridge-highlight-dot" />
                            Smart opportunities
                        </div>

                        <div className="bridge-highlight">
                            <span className="bridge-highlight-dot" />
                            Trusted connections
                        </div>

                        <div className="bridge-highlight">
                            <span className="bridge-highlight-dot" />
                            Career growth
                        </div>

                    </div>

                </div>


                <div className="bridge-stat">

                    <span className="bridge-stat-number">
                        3,482
                    </span>

                    <span className="bridge-stat-label">
                        connections made this week
                    </span>

                </div>

            </div>


            {/* RIGHT LOGIN PANEL */}

            <div className="bridge-form-panel">

                <div className="bridge-form-wrap">


                    {/* LOGIN / CREATE ACCOUNT */}

                    <div className="bridge-toggle">

                        <div className="bridge-track">

                            <div className="bridge-fill" />

                            <button
                                type="button"
                                className="active"
                            >
                                Login
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/jobseeker/signup"
                                    )
                                }
                            >
                                Create account
                            </button>

                        </div>

                    </div>


                    <h2 className="bridge-form-title">
                        Welcome back
                    </h2>


                    <p className="bridge-form-sub">
                        Login to continue where you
                        left off.
                    </p>


                    {error && (
                        <div className="bridge-error">
                            {error}
                        </div>
                    )}


                    <form
                        onSubmit={handleSubmit}
                    >

                        <div className="bridge-field">

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
                                autoComplete="email"
                                required
                            />

                        </div>


                        <div className="bridge-field">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="bridge-password">

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
                                    className="bridge-eye"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) =>
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

                        </div>


                        <button
                            type="submit"
                            className="bridge-submit"
                            disabled={
                                loading ||
                                googleLoading
                            }
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </button>

                    </form>


                    <div className="bridge-forgot">

                        <Link to="/forgot-password">
                            Forgot password?
                        </Link>

                    </div>


                    <div className="bridge-divider">
                        or continue with
                    </div>


                    <div className="bridge-google-wrapper">

                        <div
                            id="google-login-button"
                        />

                    </div>


                    {googleLoading && (
                        <div className="bridge-google-loading">
                            Connecting with Google...
                        </div>
                    )}


                    <div className="bridge-privacy">

                        By continuing, you agree to our{" "}

                        <Link to="/privacy-policy">
                            Privacy Policy
                        </Link>

                        {" "}and applicable terms.

                    </div>

                </div>

            </div>


            <NetworkAnimation />

        </div>
    );
}


/*
=============================================================
NETWORK ANIMATION
=============================================================
*/

function NetworkAnimation() {

    useEffect(() => {

        const canvas =
            document.getElementById(
                "bridgeNet"
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


                if (a === b) {
                    return;
                }


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
                    distance < 180
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


            nodes.forEach(
                (n) => {

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
                }
            );


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

                        ctx.lineWidth = 1;

                        ctx.stroke();
                    }
                }
            }


            nodes.forEach(
                (n) => {

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

                    ctx.shadowBlur = 7;

                    ctx.fill();

                    ctx.shadowBlur = 0;
                }
            );


            maybeSpawnPulse();


            pulses.forEach(
                (p) => {
                    p.t += 0.018;
                }
            );


            pulses =
                pulses.filter(
                    (p) =>
                        p.t <= 1
                );


            pulses.forEach(
                (p) => {

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

                    ctx.shadowBlur = 12;

                    ctx.fill();

                    ctx.shadowBlur = 0;
                }
            );


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


export default Login;

