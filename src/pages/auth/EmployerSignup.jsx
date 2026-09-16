import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";

function EmployerSignup() {
    const navigate = useNavigate();

    // =========================================================
    // NORMAL SIGNUP STATE
    // =========================================================

    const [contactName, setContactName] = useState("");
    const [companyName, setCompanyName] = useState("");
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

    const [
        googlePasswordConfirmation,
        setGooglePasswordConfirmation,
    ] = useState("");

    const [showGooglePasswordForm, setShowGooglePasswordForm] =
        useState(false);

    const [googleLoading, setGoogleLoading] =
        useState(false);

    const googleButtonRef = useRef(null);

    // =========================================================
    // GENERAL STATE
    // =========================================================

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================================
    // PASSWORD RULES
    // =========================================================

    const passwordRules = [
        {
            label: "8+ characters",
            valid: password.length >= 8,
        },
        {
            label: "Uppercase letter",
            valid: /[A-Z]/.test(password),
        },
        {
            label: "Lowercase letter",
            valid: /[a-z]/.test(password),
        },
        {
            label: "Number",
            valid: /[0-9]/.test(password),
        },
        {
            label: "Special character",
            valid: /[^A-Za-z0-9]/.test(password),
        },
    ];

    // =========================================================
    // GOOGLE PASSWORD RULES
    // =========================================================

    const googlePasswordRules = [
        {
            label: "8+ characters",
            valid: googlePassword.length >= 8,
        },
        {
            label: "Uppercase letter",
            valid: /[A-Z]/.test(googlePassword),
        },
        {
            label: "Lowercase letter",
            valid: /[a-z]/.test(googlePassword),
        },
        {
            label: "Number",
            valid: /[0-9]/.test(googlePassword),
        },
        {
            label: "Special character",
            valid: /[^A-Za-z0-9]/.test(googlePassword),
        },
    ];

    // =========================================================
    // EMAIL VALIDATION
    //
    // Allows:
    // Gmail
    // Yahoo
    // Outlook
    // Hotmail
    // Company emails
    // Custom domains
    // =========================================================

    function isValidEmail(value) {
        const normalizedEmail =
            String(value || "")
                .trim()
                .toLowerCase();

        // Basic email structure check.
        const emailRegex =
            /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return false;
        }

        const [localPart, domain] = normalizedEmail.split('@');

        if (!localPart || !domain) {
            return false;
        }

        // -----------------------------------------------------
        // Standard email providers must be spelled correctly.
        // This prevents values such as:
        // gmai.com, gmial.com, gmail.co, yahho.com, outlok.com
        // -----------------------------------------------------

        const acceptedProviderDomains = new Set([
            'gmail.com',
            'yahoo.com',
            'yahoo.in',
            'outlook.com',
            'outlook.in',
            'hotmail.com',
            'hotmail.in',
        ]);

        if (acceptedProviderDomains.has(domain)) {
            return true;
        }

        // -----------------------------------------------------
        // Common misspellings of the supported providers.
        // These should NOT be treated as company domains.
        // -----------------------------------------------------

        const blockedProviderTypos = new Set([
            'gmai.com',
            'gmali.com',
            'gmial.com',
            'gamil.com',
            'gmail.co',
            'gmail.cm',
            'gmail.con',
            'gmail.om',
            'gmail.co.in',
            'yaho.com',
            'yahho.com',
            'yahoo.co',
            'yahoo.cm',
            'yahoo.con',
            'outlok.com',
            'outllook.com',
            'outlook.co',
            'outlook.cm',
            'outlook.con',
            'hotmal.com',
            'hotmial.com',
            'hotmail.co',
            'hotmail.cm',
        ]);

        if (blockedProviderTypos.has(domain)) {
            return false;
        }

        // -----------------------------------------------------
        // Company / custom domain validation.
        //
        // Examples allowed:
        // hr@tcs.com
        // recruiter@infosys.com
        // jobs@mycompany.in
        // admin@company.co.uk
        //
        // The domain must have valid labels and a real-looking
        // top-level domain of at least 2 letters.
        // -----------------------------------------------------

        const domainParts = domain.split('.');

        if (domainParts.length < 2) {
            return false;
        }

        const topLevelDomain =
            domainParts[domainParts.length - 1];

        if (!/^[a-z]{2,63}$/.test(topLevelDomain)) {
            return false;
        }

        for (const part of domainParts) {
            if (
                !part ||
                part.length > 63 ||
                part.startsWith('-') ||
                part.endsWith('-') ||
                !/^[a-z0-9-]+$/.test(part)
            ) {
                return false;
            }
        }

        return true;
    }

    function getEmailValidationMessage(value) {
        const normalizedEmail =
            String(value || '')
                .trim()
                .toLowerCase();

        if (!normalizedEmail) {
            return 'Please enter your email address.';
        }

        const basicEmailRegex =
            /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

        if (!basicEmailRegex.test(normalizedEmail)) {
            return 'Please enter a valid email address.';
        }

        const [, domain = ''] = normalizedEmail.split('@');

        const blockedProviderTypos = new Set([
            'gmai.com',
            'gmali.com',
            'gmial.com',
            'gamil.com',
            'gmail.co',
            'gmail.cm',
            'gmail.con',
            'gmail.om',
            'gmail.co.in',
            'yaho.com',
            'yahho.com',
            'yahoo.co',
            'yahoo.cm',
            'yahoo.con',
            'outlok.com',
            'outllook.com',
            'outlook.co',
            'outlook.cm',
            'outlook.con',
            'hotmal.com',
            'hotmial.com',
            'hotmail.co',
            'hotmail.cm',
        ]);

        if (blockedProviderTypos.has(domain)) {
            return 'Please check your email domain. Use gmail.com, yahoo.com, outlook.com, or your correct company email domain.';
        }

        if (!isValidEmail(normalizedEmail)) {
            return 'Please enter a valid Gmail, Yahoo, Outlook, or company email address.';
        }

        return '';
    }

    // =========================================================
    // NORMAL FORM VALIDATION
    // =========================================================

    function validateForm() {
        const name =
            contactName.trim();

        const company =
            companyName.trim();

        const workEmail =
            email.trim().toLowerCase();

        // =====================================================
        // NAME
        // =====================================================

        if (!name) {
            return "Please enter your full name.";
        }

        if (name.length < 2) {
            return "Full name must contain at least 2 characters.";
        }

        // =====================================================
        // COMPANY
        // =====================================================

        if (!company) {
            return "Please enter your company name.";
        }

        if (company.length < 2) {
            return "Company name must contain at least 2 characters.";
        }

        // =====================================================
        // EMAIL
        //
        // Gmail/Yahoo/Outlook/company emails are all allowed.
        // =====================================================

        const emailValidationError =
            getEmailValidationMessage(workEmail);

        if (emailValidationError) {
            return emailValidationError;
        }

        // =====================================================
        // PASSWORD
        // =====================================================

        if (!password) {
            return "Please create a password.";
        }

        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Password must contain at least one special character.";
        }

        return "";
    }

    // =========================================================
    // NORMAL SIGNUP
    // =========================================================

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/auth/employer/signup/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body: JSON.stringify({
                        contact_name:
                            contactName.trim(),

                        company_name:
                            companyName.trim(),

                        email:
                            email.trim().toLowerCase(),

                        password,
                    }),
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            console.log(
                "EMPLOYER SIGNUP RESPONSE:",
                data
            );

            if (!response.ok) {
                const messages =
                    Object.values(data)
                        .flat(Infinity)
                        .filter(
                            (message) =>
                                typeof message ===
                                    "string" &&
                                message.trim()
                        );

                throw new Error(
                    messages[0] ||
                        data.detail ||
                        data.message ||
                        "Unable to create employer account."
                );
            }

            // =================================================
            // NORMAL SIGNUP DOES NOT LOGIN USER
            // =================================================

            setSuccess(
                "Employer account created successfully! Redirecting to login..."
            );

            setContactName("");
            setCompanyName("");
            setEmail("");
            setPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            console.error(
                "EMPLOYER SIGNUP ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to create employer account. Please try again."
            );

        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // GOOGLE ACCOUNT CREATED
    // =========================================================

    function handleGoogleAccountCreated(data) {
        console.log(
            "GOOGLE EMPLOYER ACCOUNT CREATED:",
            data
        );

        setSuccess(
            "Employer account created successfully! Redirecting to login..."
        );

        setGoogleToken("");
        setGooglePassword("");
        setGooglePasswordConfirmation("");
        setShowGooglePasswordForm(false);

        setTimeout(() => {
            navigate("/login");
        }, 1500);
    }

    // =========================================================
    // GOOGLE CREDENTIAL
    // =========================================================

    async function handleGoogleCredential(response) {
        if (!response?.credential) {
            setError(
                "Google authentication did not return a valid credential."
            );

            return;
        }

        setError("");
        setSuccess("");
        setGoogleLoading(true);

        try {
            const token =
                response.credential;

            setGoogleToken(token);

            console.log(
                "Google credential received."
            );

            const apiResponse =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body: JSON.stringify({
                            google_token:
                                token,

                            role:
                                "employer",
                        }),
                    }
                );

            let data = {};

            try {
                data =
                    await apiResponse.json();
            } catch {
                data = {};
            }

            console.log(
                "GOOGLE EMPLOYER RESPONSE:",
                apiResponse.status,
                data
            );

            // =================================================
            // EXISTING GOOGLE ACCOUNT
            // =================================================

            if (apiResponse.ok) {
                setSuccess(
                    "This Google account already exists. Redirecting to login..."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1500);

                return;
            }

            // =================================================
            // NEW GOOGLE ACCOUNT
            // =================================================

            if (
                apiResponse.status === 409 &&
                data?.new_google_user
            ) {
                setShowGooglePasswordForm(
                    true
                );

                setSuccess(
                    "Google account verified. Please create a Job Connect password to finish your employer account."
                );

                return;
            }

            // =================================================
            // OTHER ERROR
            // =================================================

            throw new Error(
                data?.detail ||
                    data?.message ||
                    "Unable to continue with Google."
            );

        } catch (err) {
            console.error(
                "GOOGLE EMPLOYER SIGNUP ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to continue with Google. Please try again."
            );

        } finally {
            setGoogleLoading(false);
        }
    }

    // =========================================================
    // INITIALIZE GOOGLE IDENTITY SERVICES
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        function initializeGoogle() {
            if (
                cancelled ||
                !window.google ||
                !window.google.accounts ||
                !window.google.accounts.id ||
                !googleButtonRef.current
            ) {
                return;
            }

            const clientId =
                import.meta.env
                    .VITE_GOOGLE_CLIENT_ID;

            if (!clientId) {
                console.error(
                    "VITE_GOOGLE_CLIENT_ID is missing."
                );

                setError(
                    "Google login is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file."
                );

                return;
            }

            googleButtonRef.current.innerHTML =
                "";

            window.google.accounts.id.initialize(
                {
                    client_id:
                        clientId,

                    callback:
                        handleGoogleCredential,

                    auto_select:
                        false,

                    cancel_on_tap_outside:
                        true,
                }
            );

            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                {
                    theme:
                        "outline",

                    size:
                        "large",

                    width:
                        390,

                    text:
                        "continue_with",

                    shape:
                        "rectangular",

                    logo_alignment:
                        "left",
                }
            );
        }

        // =====================================================
        // GOOGLE ALREADY LOADED
        // =====================================================

        if (
            window.google &&
            window.google.accounts
        ) {
            initializeGoogle();

            return () => {
                cancelled = true;
            };
        }

        // =====================================================
        // CHECK EXISTING SCRIPT
        // =====================================================

        const existingScript =
            document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]'
            );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                initializeGoogle
            );

            const timer =
                setTimeout(
                    initializeGoogle,
                    500
                );

            return () => {
                cancelled = true;

                existingScript.removeEventListener(
                    "load",
                    initializeGoogle
                );

                clearTimeout(timer);
            };
        }

        // =====================================================
        // LOAD GOOGLE SCRIPT
        // =====================================================

        const script =
            document.createElement(
                "script"
            );

        script.src =
            "https://accounts.google.com/gsi/client";

        script.async = true;
        script.defer = true;

        script.onload =
            initializeGoogle;

        script.onerror = () => {
            setError(
                "Unable to load Google Sign-In. Please try again."
            );
        };

        document.head.appendChild(
            script
        );

        return () => {
            cancelled = true;
        };
    }, [showGooglePasswordForm]);

    // =========================================================
    // GOOGLE PASSWORD SUBMIT
    // =========================================================

    async function handleGooglePasswordSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        // =====================================================
        // GOOGLE TOKEN
        // =====================================================

        if (!googleToken) {
            setError(
                "Google authentication has expired. Please continue with Google again."
            );

            setShowGooglePasswordForm(
                false
            );

            return;
        }

        // =====================================================
        // PASSWORD VALIDATION
        // =====================================================

        if (
            googlePassword.length < 8
        ) {
            setError(
                "Password must contain at least 8 characters."
            );

            return;
        }

        if (
            !/[A-Z]/.test(
                googlePassword
            )
        ) {
            setError(
                "Password must contain at least one uppercase letter."
            );

            return;
        }

        if (
            !/[a-z]/.test(
                googlePassword
            )
        ) {
            setError(
                "Password must contain at least one lowercase letter."
            );

            return;
        }

        if (
            !/[0-9]/.test(
                googlePassword
            )
        ) {
            setError(
                "Password must contain at least one number."
            );

            return;
        }

        if (
            !/[^A-Za-z0-9]/.test(
                googlePassword
            )
        ) {
            setError(
                "Password must contain at least one special character."
            );

            return;
        }

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
        // SEND TO BACKEND
        // =====================================================

        try {
            setGoogleLoading(true);

            const response =
                await fetch(
                    `${API_BASE}/auth/login/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body: JSON.stringify({
                            google_token:
                                googleToken,

                            password:
                                googlePassword,

                            password_confirmation:
                                googlePasswordConfirmation,

                            role:
                                "employer",
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
                "GOOGLE EMPLOYER PASSWORD RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                const messages =
                    Object.values(data)
                        .flat(Infinity)
                        .filter(
                            (message) =>
                                typeof message ===
                                    "string" &&
                                message.trim()
                        );

                throw new Error(
                    messages[0] ||
                        data?.detail ||
                        data?.message ||
                        "Unable to create your Google employer account."
                );
            }

            handleGoogleAccountCreated(
                data
            );

        } catch (err) {
            console.error(
                "GOOGLE EMPLOYER PASSWORD ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to complete Google signup."
            );

        } finally {
            setGoogleLoading(false);
        }
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="bridge-signup">

            <style>{`

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
                    --success: #087f5b;

                    min-height: 100vh;
                    width: 100%;
                    margin: 0;
                    background: var(--paper);
                    color: var(--ink);
                    font-family: "Inter", sans-serif;
                    display: flex;
                    align-items: stretch;
                    box-sizing: border-box;
                }

                .bridge-signup *,
                .bridge-signup *::before,
                .bridge-signup *::after {
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

                    background: rgba(
                        255,
                        91,
                        61,
                        0.12
                    );

                    filter: blur(50px);

                    pointer-events: none;
                    z-index: 1;
                }

                .bridge-brand-panel::after {
                    content: "";
                    position: absolute;

                    width: 350px;
                    height: 350px;

                    right: -150px;
                    bottom: -100px;

                    border-radius: 50%;

                    background: rgba(
                        11,
                        143,
                        122,
                        0.15
                    );

                    filter: blur(55px);

                    pointer-events: none;
                    z-index: 1;
                }

                .bridge-net {
                    position: absolute;
                    inset: 0;

                    width: 100%;
                    height: 100%;

                    z-index: 2;
                    opacity: 0.95;

                    pointer-events: none;
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

                .bridge-brand-name {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight: 800;
                    font-size: 1.3rem;
                    letter-spacing: 0.01em;

                    color: #fff8f2;
                }

                .bridge-brand-copy {
                    position: relative;

                    z-index: 5;

                    max-width: 30rem;

                    margin-top: 70px;
                    margin-bottom: auto;
                }

                .bridge-eyebrow {
                    display: inline-flex;
                    align-items: center;

                    gap: 0.5rem;

                    font-family:
                        "JetBrains Mono",
                        monospace;

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

                    background:
                        var(--coral);
                }

                .bridge-brand-copy h1 {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight: 800;

                    font-size:
                        clamp(
                            2.4rem,
                            4vw,
                            3.8rem
                        );

                    line-height: 1.04;
                    letter-spacing: -0.035em;

                    margin:
                        0 0 1.25rem 0;

                    color: #fff8f2;

                    text-shadow:
                        0 4px 30px
                        rgba(
                            0,
                            0,
                            0,
                            0.25
                        );
                }

                .bridge-brand-copy h1 span {
                    color:
                        var(--coral);
                }

                .bridge-brand-copy p {
                    font-size: 1rem;
                    line-height: 1.7;

                    color: #d5c9bd;

                    margin: 0;

                    max-width: 28rem;
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

                    border-radius: 10px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.045
                        );

                    backdrop-filter:
                        blur(8px);

                    color: #ded4ca;

                    font-size: 0.75rem;
                }

                .bridge-highlight-dot {
                    width: 7px;
                    height: 7px;

                    border-radius: 50%;

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

                .bridge-stat {
                    position: relative;

                    z-index: 5;

                    display: flex;

                    align-items:
                        baseline;

                    gap: 0.55rem;

                    font-family:
                        "JetBrains Mono",
                        monospace;
                }

                .bridge-stat-number {
                    font-size: 1.7rem;
                    font-weight: 600;

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

                .bridge-stat-label {
                    font-size: 0.74rem;

                    color:
                        #c9bfb2;
                }

                .bridge-form-panel {
                    flex: 1 1 54%;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    padding:
                        2.5rem 2rem;

                    background:
                        var(--paper);

                    overflow-y: auto;
                }

                .bridge-form-wrap {
                    width: 100%;
                    max-width: 390px;

                    padding: 1rem 0;
                }

                .bridge-toggle {
                    position: relative;

                    width: 100%;
                    height: 52px;

                    margin-bottom: 2.3rem;

                    display: flex;
                }

                .bridge-track {
                    position: relative;

                    width: 100%;
                    height: 100%;

                    border:
                        1.5px solid
                        var(--ink);

                    border-radius: 10px;

                    background:
                        var(--panel);

                    display: flex;

                    padding: 4px;

                    overflow: hidden;
                }

                .bridge-fill {
                    position: absolute;

                    top: 4px;
                    left: 50%;

                    width:
                        calc(50% - 4px);

                    height:
                        calc(100% - 8px);

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

                    font-family:
                        "Inter",
                        sans-serif;

                    font-weight: 600;
                    font-size: 0.85rem;

                    color:
                        var(--ink-soft);

                    cursor: pointer;
                }

                .bridge-toggle button.active {
                    color: #ffffff;
                }

                .bridge-form-title {
                    font-family:
                        "Bricolage Grotesque",
                        sans-serif;

                    font-weight: 800;

                    font-size: 1.8rem;

                    margin:
                        0 0 0.4rem 0;

                    color:
                        var(--ink);
                }

                .bridge-form-sub {
                    font-size: 0.88rem;

                    color:
                        var(--ink-soft);

                    margin:
                        0 0 1.8rem 0;

                    line-height: 1.5;
                }

                .bridge-error {
                    background:
                        #fdecea;

                    border:
                        1px solid
                        #f1c6bc;

                    color:
                        var(--error);

                    border-radius: 8px;

                    padding:
                        0.7rem 0.85rem;

                    font-size: 0.78rem;

                    line-height: 1.4;

                    margin-bottom: 1rem;
                }

                .bridge-success {
                    background:
                        #eaf8f2;

                    border:
                        1px solid
                        #b9e5d2;

                    color:
                        var(--success);

                    border-radius: 8px;

                    padding:
                        0.7rem 0.85rem;

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

                    color:
                        var(--ink);

                    margin-bottom: 0.4rem;
                }

                .bridge-field input {
                    width: 100%;

                    background:
                        #ffffff;

                    border:
                        1.5px solid
                        var(--line);

                    border-radius: 8px;

                    padding:
                        0.75rem 0.85rem;

                    color:
                        var(--ink);

                    font-family:
                        "Inter",
                        sans-serif;

                    font-size: 0.9rem;

                    outline: none;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .bridge-field input::placeholder {
                    color:
                        #b3a99c;
                }

                .bridge-field input:focus {
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

                .bridge-password-rules {
                    display: grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap: 5px 10px;

                    margin-top: 0.65rem;

                    padding: 0.7rem;

                    border:
                        1px solid
                        var(--line);

                    border-radius: 8px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.7
                        );
                }

                .bridge-password-rule {
                    display: flex;

                    align-items: center;

                    gap: 6px;

                    font-size: 0.68rem;

                    color:
                        #9b9187;
                }

                .bridge-password-rule.valid {
                    color:
                        var(--teal);
                }

                .bridge-password-rule-icon {
                    font-size: 0.7rem;

                    font-weight: 800;

                    width: 13px;
                }

                .bridge-submit {
                    width: 100%;

                    padding: 0.85rem;

                    border-radius: 8px;

                    border: none;

                    background:
                        var(--coral);

                    color: #ffffff;

                    font-family:
                        "Inter",
                        sans-serif;

                    font-weight: 700;

                    font-size: 0.92rem;

                    cursor: pointer;

                    transition:
                        transform 0.15s ease,
                        box-shadow 0.15s ease,
                        background 0.15s ease;

                    margin-top: 0.2rem;
                }

                .bridge-submit:hover:not(:disabled) {
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

                .bridge-submit:disabled {
                    opacity: 0.7;

                    cursor:
                        not-allowed;
                }

                .bridge-google-section {
                    margin-top: 1.15rem;
                }

                .bridge-divider {
                    display: flex;

                    align-items: center;

                    gap: 0.8rem;

                    margin:
                        1.2rem 0;
                }

                .bridge-divider::before,
                .bridge-divider::after {
                    content: "";

                    flex: 1;

                    height: 1px;

                    background:
                        var(--line);
                }

                .bridge-divider span {
                    font-size: 0.72rem;

                    color:
                        var(--ink-soft);

                    font-weight: 600;

                    text-transform:
                        uppercase;

                    letter-spacing: 0.06em;
                }

                .bridge-google-button {
                    width: 100%;

                    min-height: 44px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    overflow: hidden;
                }

                .bridge-google-button > div {
                    max-width: 100%;
                    width: 100%;
                }

                .bridge-google-note {
                    text-align: center;

                    margin-top: 0.65rem;

                    font-size: 0.68rem;

                    color:
                        var(--ink-soft);

                    line-height: 1.4;
                }

                .bridge-google-password-card {
                    padding: 1rem;

                    margin-top: 0.5rem;

                    border:
                        1px solid
                        var(--line);

                    border-radius: 10px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.7
                        );
                }

                .bridge-google-password-title {
                    font-size: 0.88rem;

                    font-weight: 800;

                    color:
                        var(--ink);

                    margin:
                        0 0 0.35rem;
                }

                .bridge-google-password-sub {
                    font-size: 0.72rem;

                    line-height: 1.45;

                    color:
                        var(--ink-soft);

                    margin:
                        0 0 1rem;
                }

                .bridge-google-password-card
                .bridge-field {
                    margin-bottom:
                        0.85rem;
                }

                .bridge-google-cancel {
                    width: 100%;

                    border: none;

                    background:
                        transparent;

                    color:
                        var(--ink-soft);

                    padding:
                        0.65rem;

                    font-size: 0.75rem;

                    font-weight: 600;

                    cursor: pointer;

                    margin-top: 0.25rem;
                }

                .bridge-google-cancel:hover {
                    color:
                        var(--coral);
                }

                .bridge-login-link {
                    text-align: center;

                    margin-top: 1.1rem;

                    font-size: 0.8rem;

                    color:
                        var(--ink-soft);
                }

                .bridge-login-link button {
                    border: none;

                    background: none;

                    padding: 0;

                    margin-left: 4px;

                    color:
                        var(--teal);

                    font-size: 0.8rem;

                    font-weight: 700;

                    cursor: pointer;
                }

                .bridge-login-link button:hover {
                    color:
                        var(--coral);
                }

                .bridge-privacy {
                    text-align: center;

                    margin-top: 1.25rem;

                    font-size: 0.72rem;

                    line-height: 1.5;

                    color:
                        var(--ink-soft);
                }

                .bridge-privacy button {
                    border: none;

                    background: none;

                    padding: 0;

                    color:
                        var(--teal);

                    font-weight: 600;

                    cursor: pointer;

                    font-family: inherit;

                    font-size: inherit;
                }

                .bridge-privacy button:hover {
                    color:
                        var(--coral);
                }

                @media (max-width: 860px) {

                    .bridge-signup {
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
                        padding:
                            2.5rem 1.5rem 4rem;
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
                        padding:
                            2rem 1.2rem 3rem;
                    }

                    .bridge-form-title {
                        font-size: 1.55rem;
                    }

                    .bridge-password-rules {
                        grid-template-columns:
                            1fr;
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

            <div className="bridge-brand-panel">

                <canvas
                    id="bridgeSignupNet"
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
                        Employer Platform
                    </p>

                    <h1>
                        Build your team
                        with the right

                        <span>
                            {" "}connections.
                        </span>
                    </h1>

                    <p>
                        Discover skilled professionals,
                        connect with qualified candidates,
                        and build a stronger workforce
                        through trusted opportunities.
                    </p>

                    <div className="bridge-highlights">

                        <div className="bridge-highlight">

                            <span
                                className="bridge-highlight-dot"
                            />

                            Find skilled talent

                        </div>

                        <div className="bridge-highlight">

                            <span
                                className="bridge-highlight-dot"
                            />

                            Verified jobseekers

                        </div>

                        <div className="bridge-highlight">

                            <span
                                className="bridge-highlight-dot"
                            />

                            Grow your team

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

            {/* =====================================================
                RIGHT SIGNUP PANEL
            ===================================================== */}

            <div className="bridge-form-panel">

                <div className="bridge-form-wrap">

                    <div className="bridge-toggle">

                        <div className="bridge-track">

                            <div className="bridge-fill" />

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/login")
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

                    <h2 className="bridge-form-title">
                        Create your employer account
                    </h2>

                    <p className="bridge-form-sub">
                        Connect with qualified candidates
                        and build your team.
                    </p>

                    {error && (
                        <div className="bridge-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bridge-success">
                            {success}
                        </div>
                    )}

                    {/* =================================================
                        GOOGLE PASSWORD FORM
                    ================================================= */}

                    {showGooglePasswordForm ? (

                        <div className="bridge-google-password-card">

                            <h3 className="bridge-google-password-title">
                                Finish your Google signup
                            </h3>

                            <p className="bridge-google-password-sub">
                                Your Google account is verified.
                                Create a password for your Job Connect
                                employer account.
                            </p>

                            <form
                                onSubmit={
                                    handleGooglePasswordSubmit
                                }
                            >

                                <div className="bridge-field">

                                    <label htmlFor="googlePassword">
                                        Job Connect password
                                    </label>

                                    <div className="bridge-password">

                                        <input
                                            id="googlePassword"
                                            type={
                                                showGooglePassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Create a strong password"
                                            value={
                                                googlePassword
                                            }
                                            onChange={(e) => {
                                                setGooglePassword(
                                                    e.target.value
                                                );

                                                setError("");
                                            }}
                                            autoComplete="new-password"
                                            disabled={
                                                googleLoading
                                            }
                                        />

                                        <button
                                            type="button"
                                            className="bridge-eye"
                                            onClick={() =>
                                                setShowGooglePassword(
                                                    (prev) =>
                                                        !prev
                                                )
                                            }
                                        >
                                            {showGooglePassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                    <div className="bridge-password-rules">

                                        {googlePasswordRules.map(
                                            (rule) => (
                                                <div
                                                    key={
                                                        rule.label
                                                    }
                                                    className={
                                                        `bridge-password-rule ${
                                                            rule.valid
                                                                ? "valid"
                                                                : ""
                                                        }`
                                                    }
                                                >

                                                    <span className="bridge-password-rule-icon">
                                                        {rule.valid
                                                            ? "✓"
                                                            : "○"}
                                                    </span>

                                                    {rule.label}

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>

                                <div className="bridge-field">

                                    <label htmlFor="googlePasswordConfirmation">
                                        Confirm password
                                    </label>

                                    <input
                                        id="googlePasswordConfirmation"
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={
                                            googlePasswordConfirmation
                                        }
                                        onChange={(e) => {
                                            setGooglePasswordConfirmation(
                                                e.target.value
                                            );

                                            setError("");
                                        }}
                                        autoComplete="new-password"
                                        disabled={
                                            googleLoading
                                        }
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="bridge-submit"
                                    disabled={
                                        googleLoading
                                    }
                                >

                                    {googleLoading
                                        ? "Creating account..."
                                        : "Create employer account"}

                                </button>

                                <button
                                    type="button"
                                    className="bridge-google-cancel"
                                    onClick={() => {

                                        setShowGooglePasswordForm(
                                            false
                                        );

                                        setGoogleToken(
                                            ""
                                        );

                                        setGooglePassword(
                                            ""
                                        );

                                        setGooglePasswordConfirmation(
                                            ""
                                        );

                                        setError("");
                                        setSuccess("");

                                    }}
                                    disabled={
                                        googleLoading
                                    }
                                >
                                    ← Use another signup method
                                </button>

                            </form>

                        </div>

                    ) : (

                        <>

                            {/* =================================================
                                NORMAL FORM
                            ================================================= */}

                            <form onSubmit={handleSubmit}>

                                <div className="bridge-field">

                                    <label htmlFor="contactName">
                                        Full name
                                    </label>

                                    <input
                                        id="contactName"
                                        type="text"
                                        placeholder="Your full name"
                                        value={
                                            contactName
                                        }
                                        onChange={(e) => {
                                            setContactName(
                                                e.target.value
                                            );

                                            setError("");
                                        }}
                                        autoComplete="name"
                                        disabled={
                                            loading ||
                                            googleLoading
                                        }
                                    />

                                </div>

                                <div className="bridge-field">

                                    <label htmlFor="companyName">
                                        Company name
                                    </label>

                                    <input
                                        id="companyName"
                                        type="text"
                                        placeholder="Your company name"
                                        value={
                                            companyName
                                        }
                                        onChange={(e) => {
                                            setCompanyName(
                                                e.target.value
                                            );

                                            setError("");
                                        }}
                                        autoComplete="organization"
                                        disabled={
                                            loading ||
                                            googleLoading
                                        }
                                    />

                                </div>

                                {/* =================================================
                                    EMAIL
                                ================================================= */}

                                <div className="bridge-field">

                                    <label htmlFor="email">
                                        Email address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={
                                            email
                                        }
                                        onChange={(e) => {

                                            setEmail(
                                                e.target.value
                                            );

                                            setError("");

                                        }}
                                        autoComplete="email"
                                        disabled={
                                            loading ||
                                            googleLoading
                                        }
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
                                            placeholder="Create a strong password"
                                            value={
                                                password
                                            }
                                            onChange={(e) => {
                                                setPassword(
                                                    e.target.value
                                                );

                                                setError("");
                                            }}
                                            autoComplete="new-password"
                                            disabled={
                                                loading ||
                                                googleLoading
                                            }
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
                                        >
                                            {showPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                    <div className="bridge-password-rules">

                                        {passwordRules.map(
                                            (rule) => (
                                                <div
                                                    key={
                                                        rule.label
                                                    }
                                                    className={
                                                        `bridge-password-rule ${
                                                            rule.valid
                                                                ? "valid"
                                                                : ""
                                                        }`
                                                    }
                                                >

                                                    <span className="bridge-password-rule-icon">
                                                        {rule.valid
                                                            ? "✓"
                                                            : "○"}
                                                    </span>

                                                    {rule.label}

                                                </div>
                                            )
                                        )}

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
                                        ? "Creating account..."
                                        : "Create employer account"}

                                </button>

                            </form>

                            {/* =================================================
                                GOOGLE
                            ================================================= */}

                            <div className="bridge-google-section">

                                <div className="bridge-divider">
                                    <span>
                                        or
                                    </span>
                                </div>

                                <div
                                    ref={
                                        googleButtonRef
                                    }
                                    className="bridge-google-button"
                                />

                                <div className="bridge-google-note">
                                    Sign up securely using your Google account
                                </div>

                            </div>

                        </>

                    )}

                    {/* =================================================
                        LOGIN
                    ================================================= */}

                    <div className="bridge-login-link">

                        Already have an account?

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Login
                        </button>

                    </div>

                    {/* =================================================
                        PRIVACY
                    ================================================= */}

                    <div className="bridge-privacy">

                        By continuing, you agree to our{" "}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/privacy-policy"
                                )
                            }
                        >
                            Privacy Policy
                        </button>

                        {" "}and applicable terms.

                    </div>

                </div>

            </div>

            <SignupNetworkAnimation />

        </div>
    );
}

// =============================================================
// EMPLOYER SIGNUP NETWORK ANIMATION
// =============================================================

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
                            Math.random() < 0.5
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

            // MOVE NODES

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

            // CONNECTIONS

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

            // NODES

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

                ctx.shadowBlur = 7;

                ctx.fill();

                ctx.shadowBlur = 0;

            });

            // PULSES

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

                ctx.shadowBlur = 12;

                ctx.fill();

                ctx.shadowBlur = 0;

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

export default EmployerSignup;

