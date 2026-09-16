import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PROFILE_API = `${API_BASE}/auth/jobseeker/profile/`;
const EMPLOYER_PROFILE_API = `${API_BASE}/auth/employer/profile/`;

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    /* =====================================================
       PUBLIC PAGES
    ===================================================== */

    const publicPages = [
        "/",
        "/login",
        "/jobseeker/signup",
        "/employer/signup",
        "/forgot-password",
        "/verify-otp",
        "/reset-password",
        "/logout",
    ];

    const isPublicPage =
        publicPages.includes(location.pathname);

    /* =====================================================
       LOAD USER + PROFILE
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        async function loadNavbarData() {
            const token =
                localStorage.getItem("jc_token");

            const savedUser =
                localStorage.getItem("jc_user");

            if (!token) {
                if (!cancelled) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }

                return;
            }

            try {
                setLoading(true);

                let userData = null;

                if (savedUser) {
                    try {
                        userData =
                            JSON.parse(savedUser);
                    } catch (error) {
                        console.error(
                            "Invalid jc_user:",
                            error
                        );

                        localStorage.removeItem(
                            "jc_user"
                        );
                    }
                }

                if (!userData) {
                    if (!cancelled) {
                        setUser(null);
                        setProfile(null);
                        setLoading(false);
                    }

                    return;
                }

                if (cancelled) {
                    return;
                }

                setUser(userData);

                /* =========================================
                   JOB SEEKER PROFILE
                ========================================= */

                if (
                    userData.role === "jobseeker" ||
                    userData.role === "job_seeker"
                ) {
                    const response =
                        await fetch(
                            PROFILE_API,
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    if (response.status === 401) {
                        localStorage.removeItem(
                            "jc_token"
                        );

                        localStorage.removeItem(
                            "refresh_token"
                        );

                        localStorage.removeItem(
                            "jc_user"
                        );

                        if (!cancelled) {
                            setUser(null);
                            setProfile(null);
                        }

                        navigate("/login");

                        return;
                    }

                    if (response.ok) {
                        const profileData =
                            await response.json();

                        if (cancelled) {
                            return;
                        }

                        setProfile(profileData);

                        const updatedUser = {
                            ...userData,

                            profile_completed:
                                profileData.profile_completed,

                            approval_status:
                                profileData.approval_status,

                            rejection_reason:
                                profileData.rejection_reason ||
                                "",
                        };

                        setUser(updatedUser);

                        localStorage.setItem(
                            "jc_user",
                            JSON.stringify(
                                updatedUser
                            )
                        );
                    } else {
                        console.error(
                            "PROFILE API ERROR:",
                            response.status
                        );

                        if (!cancelled) {
                            setProfile(null);
                        }
                    }
                }

                /* =========================================
                   EMPLOYER PROFILE
                ========================================= */

                else if (
                    userData.role === "employer"
                ) {
                    const response =
                        await fetch(
                            EMPLOYER_PROFILE_API,
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    if (response.status === 401) {
                        localStorage.removeItem(
                            "jc_token"
                        );

                        localStorage.removeItem(
                            "refresh_token"
                        );

                        localStorage.removeItem(
                            "jc_user"
                        );

                        if (!cancelled) {
                            setUser(null);
                            setProfile(null);
                        }

                        navigate("/login");

                        return;
                    }

                    if (response.ok) {
                        const employerData =
                            await response.json();

                        if (cancelled) {
                            return;
                        }

                        setProfile(employerData);

                        const updatedEmployerUser = {
                            ...userData,

                            profile_completed:
                                employerData.profile_completed,

                            approval_status:
                                employerData.approval_status,

                            rejection_reason:
                                employerData.rejection_reason ||
                                "",
                        };

                        setUser(
                            updatedEmployerUser
                        );

                        localStorage.setItem(
                            "jc_user",
                            JSON.stringify(
                                updatedEmployerUser
                            )
                        );
                    } else {
                        console.error(
                            "EMPLOYER PROFILE API ERROR:",
                            response.status
                        );

                        if (!cancelled) {
                            setProfile(null);
                        }
                    }
                }

                /* =========================================
                   ADMIN / OTHER ROLE
                ========================================= */

                else {
                    if (!cancelled) {
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.error(
                    "Navbar loading error:",
                    error
                );

                if (!cancelled) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadNavbarData();

        return () => {
            cancelled = true;
        };
    }, [location.pathname, navigate]);

    /* =====================================================
       CLOSE USER MENU WHEN ROUTE CHANGES
    ===================================================== */

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    /* =====================================================
       CLOSE USER DROPDOWN WHEN CLICKING OUTSIDE
    ===================================================== */

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setMenuOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    /* =====================================================
       LOGOUT
    ===================================================== */

    function handleLogout() {
        localStorage.removeItem(
            "jc_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        localStorage.removeItem(
            "jc_user"
        );

        localStorage.removeItem(
            "user"
        );

        setUser(null);
        setProfile(null);
        setMenuOpen(false);

        navigate("/login");
    }

    /* =====================================================
       GET INITIALS
    ===================================================== */

    function getInitials(name) {
        if (!name) {
            return "--";
        }

        const cleanName =
            String(name).trim();

        if (!cleanName) {
            return "--";
        }

        const words =
            cleanName.split(/\s+/);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    /* =====================================================
       JOB SEEKER PROFILE ROUTE
    ===================================================== */

    function getJobseekerProfileRoute() {
        if (!profile) {
            return "/jobseeker/profile";
        }

        const completed =
            profile.profile_completed === true ||
            profile.profile_completed === "true" ||
            profile.profile_completed === 1 ||
            profile.profile_completed === "1";

        const approvalStatus =
            profile.approval_status;

        if (
            completed &&
            approvalStatus === "approved"
        ) {
            return "/jobseeker/profile/completed";
        }

        if (
            completed &&
            approvalStatus === "pending"
        ) {
            return "/jobseeker/profile/review";
        }

        if (
            completed &&
            approvalStatus === "rejected"
        ) {
            return "/jobseeker/profile";
        }

        return "/jobseeker/profile";
    }

    /* =====================================================
       LOGO
    ===================================================== */

    function Logo({ to = "/" }) {
        return (
            <Link
                to={to}
                className="jc-brand"
            >
                <svg
                    className="jc-brand-logo"
                    width="30"
                    height="30"
                    viewBox="0 0 56 56"
                    aria-hidden="true"
                >
                    <circle
                        cx="20"
                        cy="28"
                        r="9"
                        fill="#2F5233"
                    />

                    <circle
                        cx="38"
                        cy="28"
                        r="9"
                        fill="#C7E36B"
                    />

                    <rect
                        x="20"
                        y="26"
                        width="18"
                        height="4"
                        rx="2"
                        fill="#2F5233"
                    />
                </svg>

                <span className="jc-brand-text">
                    <span className="jc-brand-job">
                        Job
                    </span>

                    <span className="jc-brand-connect">
                        Connect
                    </span>
                </span>
            </Link>
        );
    }

    /* =====================================================
       USER MENU
    ===================================================== */

    function UserMenu() {
        const displayName =
            user?.name ||
            user?.full_name ||
            user?.fullName ||
            user?.username ||
            profile?.full_name ||
            profile?.name ||
            user?.email ||
            "";

        return (
            <div
                className="jc-user"
                ref={menuRef}
            >
                <button
                    type="button"
                    className="jc-avatar"
                    onClick={() =>
                        setMenuOpen(
                            (open) => !open
                        )
                    }
                    aria-label="Open user menu"
                >
                    {getInitials(displayName)}
                </button>

                {menuOpen && (
                    <div className="jc-user-dropdown">

                        <div className="jc-user-header">

                            <div className="jc-dropdown-avatar">
                                {getInitials(
                                    displayName
                                )}
                            </div>

                            <div className="jc-user-info">

                                <span className="jc-user-name">
                                    {displayName ||
                                        "User"}
                                </span>

                                <span className="jc-user-role">
                                    {user?.role ===
                                    "jobseeker"
                                        ? "Job Seeker"
                                        : user?.role ===
                                          "employer"
                                        ? "Employer"
                                        : "Administrator"}
                                </span>

                            </div>

                        </div>

                        <div className="jc-dropdown-divider" />

                        <button
                            type="button"
                            className="jc-logout"
                            onClick={
                                handleLogout
                            }
                        >
                            <span className="jc-logout-icon">
                                ↪
                            </span>

                            Logout
                        </button>

                    </div>
                )}
            </div>
        );
    }

    /* =====================================================
       PUBLIC NAVBAR
    ===================================================== */

    if (isPublicPage) {
        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo to="/" />

                        <div className="jc-public-actions">

                            <Link
                                to="/login"
                                className="jc-login-link"
                            >
                                Log in
                            </Link>

                            <div className="jc-signup-wrapper">

                                <Link
                                    to="/jobseeker/signup"
                                    className="jc-signup-button"
                                >
                                    Sign up
                                </Link>

                                <div className="jc-signup-dropdown">

                                    <Link
                                        to="/jobseeker/signup"
                                        className="jc-signup-option"
                                    >
                                        <span className="jc-option-icon">
                                            👤
                                        </span>

                                        <span>
                                            Job Seeker
                                        </span>
                                    </Link>

                                    <Link
                                        to="/employer/signup"
                                        className="jc-signup-option"
                                    >
                                        <span className="jc-option-icon">
                                            🏢
                                        </span>

                                        <span>
                                            Employer
                                        </span>
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </nav>
            </>
        );
    }

    /* =====================================================
       LOADING NAVBAR
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo to="/" />

                        <div className="jc-loading-bar" />

                    </div>

                </nav>
            </>
        );
    }

    /* =====================================================
       NO USER
    ===================================================== */

    if (!user) {
        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo to="/" />

                        <div className="jc-public-actions">

                            <Link
                                to="/login"
                                className="jc-login-link"
                            >
                                Log in
                            </Link>

                            <div className="jc-signup-wrapper">

                                <Link
                                    to="/jobseeker/signup"
                                    className="jc-signup-button"
                                >
                                    Sign up
                                </Link>

                                <div className="jc-signup-dropdown">

                                    <Link
                                        to="/jobseeker/signup"
                                        className="jc-signup-option"
                                    >
                                        <span className="jc-option-icon">
                                            👤
                                        </span>

                                        Job Seeker
                                    </Link>

                                    <Link
                                        to="/employer/signup"
                                        className="jc-signup-option"
                                    >
                                        <span className="jc-option-icon">
                                            🏢
                                        </span>

                                        Employer
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </nav>
            </>
        );
    }

    /* =====================================================
       ADMIN NAVBAR
    ===================================================== */

    if (user.role === "admin") {
        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo to="/admin/dashboard" />

                        <div className="jc-navbar-right">

                            <div className="jc-nav-links">

                                <Link
                                    to="/admin/dashboard"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/admin/dashboard"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Dashboard
                                </Link>

                                <Link
                                    to="/admin/verifications"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/admin/verifications"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Verification queue
                                </Link>

                                <Link
                                    to="/admin/reports"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/admin/reports"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Reports & flags
                                </Link>

                                <Link
                                    to="/admin/users"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/admin/users"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Users
                                </Link>

                            </div>

                            <UserMenu />

                        </div>

                    </div>

                </nav>
            </>
        );
    }

    /* =====================================================
       JOB SEEKER NAVBAR
    ===================================================== */

    if (
        user.role === "jobseeker" ||
        user.role === "job_seeker"
    ) {
        const profileRoute =
            getJobseekerProfileRoute();

        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo
                            to="/jobseeker/dashboard"
                        />

                        <div className="jc-navbar-right">

                            <div className="jc-nav-links">

                                <Link
                                    to="/jobseeker/dashboard"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/jobseeker/dashboard"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Overview
                                </Link>

                                <Link
                                    to="/jobseeker/jobs"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/jobseeker/jobs"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Find jobs
                                </Link>

                                <Link
                                    to="/jobseeker/applications"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/jobseeker/applications"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    My Applications
                                </Link>

                                <Link
                                    to={profileRoute}
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        profileRoute
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Profile & verification
                                </Link>

                            </div>

                            <UserMenu />

                        </div>

                    </div>

                </nav>
            </>
        );
    }

    /* =====================================================
       EMPLOYER NAVBAR
    ===================================================== */

    if (user.role === "employer") {
        return (
            <>
                <style>{navbarCSS}</style>

                <nav className="jc-navbar">

                    <div className="jc-navbar-container">

                        <Logo
                            to="/employer/dashboard"
                        />

                        <div className="jc-navbar-right">

                            <div className="jc-nav-links">

                                <Link
                                    to="/employer/dashboard"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/employer/dashboard"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Overview
                                </Link>

                                <Link
                                    to="/employer/jobs"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/employer/jobs"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    My Jobs
                                </Link>

                                <Link
                                    to="/employer/jobs/post"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/employer/jobs/post"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Post a Job
                                </Link>

                                <Link
                                    to="/employer/profile"
                                    className={`jc-nav-link ${
                                        location.pathname ===
                                        "/employer/profile"
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    Company Profile
                                </Link>

                            </div>

                            <UserMenu />

                        </div>

                    </div>

                </nav>
            </>
        );
    }

    return null;
}


/* =========================================================
   NAVBAR CSS
========================================================= */

const navbarCSS = `

/* =====================================================
   ROOT NAVBAR
===================================================== */

.jc-navbar {
    --jc-dark: #19352a;
    --jc-green: #2f5d43;
    --jc-green-light: #4f8062;
    --jc-lime: #c7e36b;

    --jc-soft: #f4f7f2;
    --jc-text: #17251d;
    --jc-muted: #718078;
    --jc-border: #e5ebe4;

    width: 100%;
    height: 62px;
    min-height: 62px;

    margin: 0;
    padding: 0;

    background: rgba(255, 255, 255, 0.98);

    border-bottom: 1px solid var(--jc-border);

    position: relative;
    z-index: 1000;

    font-family:
        "Inter",
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    box-shadow:
        0 1px 0
        rgba(25, 53, 42, 0.02);

    overflow: visible;
}


/* =====================================================
   BOX SIZING
===================================================== */

.jc-navbar *,
.jc-navbar *::before,
.jc-navbar *::after {
    box-sizing: border-box;
}


/* =====================================================
   NAVBAR CONTAINER
===================================================== */

.jc-navbar-container {
    width: 100%;
    height: 62px;
    min-height: 62px;

    margin: 0;
    padding: 0 28px;

    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;

    align-items: center !important;
    justify-content: space-between;

    gap: 12px;

    overflow: visible;
}


/* =====================================================
   LOGO
===================================================== */

.jc-brand {
    width: auto;
    height: 62px;

    display: flex !important;
    flex-direction: row !important;

    align-items: center !important;
    justify-content: flex-start !important;

    gap: 7px;

    text-decoration: none;

    flex: 0 0 auto !important;
    flex-shrink: 0 !important;

    white-space: nowrap;

    line-height: 1;

    margin: 0;
    padding: 0;
}


.jc-brand-logo {
    width: 30px;
    height: 30px;

    display: block;

    flex: 0 0 30px;
    flex-shrink: 0;
}


.jc-brand-text {
    display: inline-flex;

    align-items: center;

    white-space: nowrap;

    font-size: 18px;
    line-height: 1;

    letter-spacing: -0.5px;
}


.jc-brand-job {
    color: var(--jc-dark);

    font-weight: 800;
}


.jc-brand-connect {
    color: var(--jc-green-light);

    font-weight: 500;

    margin-left: 3px;
}


.jc-brand:hover {
    text-decoration: none;
}


.jc-brand:hover .jc-brand-job {
    color: var(--jc-green);
}


.jc-brand:hover .jc-brand-connect {
    color: var(--jc-green);
}


/* =====================================================
   RIGHT SIDE
===================================================== */

.jc-navbar-right {
    width: auto;
    height: 62px;

    display: flex !important;

    flex-direction: row !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 6px;

    margin-left: auto;

    min-width: 0;

    flex: 1 1 auto;

    overflow: visible;
}


/* =====================================================
   NAVIGATION LINKS
===================================================== */

.jc-nav-links {
    width: auto;
    height: 62px;

    display: flex !important;

    flex-direction: row !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 2px;

    flex: 1 1 auto;

    min-width: 0;

    overflow: visible;

    white-space: nowrap;
}


.jc-nav-link {
    position: relative;

    height: 34px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    color: var(--jc-muted);

    text-decoration: none;

    font-size: 12px;

    font-weight: 600;

    padding: 0 8px;

    border-radius: 8px;

    white-space: nowrap;

    flex: 0 1 auto;

    min-width: 0;

    overflow: visible;

    text-overflow: ellipsis;

    transition:
        color 0.2s ease,
        background 0.2s ease,
        transform 0.2s ease,
        font-weight 0.2s ease;
}


/* =====================================================
   HOVER
===================================================== */

.jc-nav-link:hover {
    color: var(--jc-green);

    background: var(--jc-soft);

    font-weight: 800;

    transform: translateY(-1px);
}


/* =====================================================
   ACTIVE
===================================================== */

.jc-nav-link.active {
    color: var(--jc-green);

    background: #eaf3e5;

    font-weight: 800 !important;

    transform: translateY(-1px);

    box-shadow:
        0 2px 8px
        rgba(47, 93, 67, 0.08);
}


/* =====================================================
   ACTIVE UNDERLINE
===================================================== */

.jc-nav-link.active::after {
    content: "";

    position: absolute;

    left: 8px;
    right: 8px;

    bottom: 1px;

    height: 3px;

    background: var(--jc-lime);

    border-radius: 10px;
}


/* =====================================================
   ACTIVE + HOVER
===================================================== */

.jc-nav-link.active:hover {
    color: var(--jc-green);

    background: #e6f0e1;

    font-weight: 800 !important;

    transform: translateY(-1px);
}


/* =====================================================
   PUBLIC ACTIONS
===================================================== */

.jc-public-actions {
    height: 62px;

    display: flex;

    flex-direction: row;

    align-items: center;

    justify-content: flex-end;

    gap: 7px;

    flex: 0 0 auto;

    margin-left: auto;

    white-space: nowrap;
}


/* =====================================================
   LOGIN
===================================================== */

.jc-login-link {
    height: 34px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 0 12px;

    color: var(--jc-dark);

    text-decoration: none;

    font-size: 12px;

    font-weight: 650;

    border-radius: 8px;

    white-space: nowrap;

    transition:
        background 0.2s ease,
        color 0.2s ease;
}


.jc-login-link:hover {
    background: var(--jc-soft);

    color: var(--jc-green);
}


/* =====================================================
   SIGN UP
===================================================== */

.jc-signup-wrapper {
    position: relative;

    display: flex;

    align-items: center;
    justify-content: center;

    flex: 0 0 auto;
}


.jc-signup-button {
    height: 34px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 0 16px;

    color: #ffffff;

    background:
        linear-gradient(
            135deg,
            #315f45,
            #264c37
        );

    border-radius: 8px;

    text-decoration: none;

    font-size: 12px;

    font-weight: 700;

    white-space: nowrap;

    box-shadow:
        0 4px 10px
        rgba(47, 93, 67, 0.14);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
}


.jc-signup-button:hover {
    background:
        linear-gradient(
            135deg,
            #264c37,
            #19352a
        );

    transform: translateY(-1px);

    box-shadow:
        0 6px 14px
        rgba(47, 93, 67, 0.20);
}


/* =====================================================
   SIGNUP DROPDOWN
===================================================== */

.jc-signup-dropdown {
    position: absolute;

    top: calc(100% + 8px);
    right: 0;

    width: 205px;

    padding: 6px;

    background: #ffffff;

    border: 1px solid var(--jc-border);

    border-radius: 11px;

    box-shadow:
        0 15px 35px
        rgba(23, 37, 29, 0.14);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;

    transform: translateY(-6px);

    transition:
        opacity 0.18s ease,
        visibility 0.18s ease,
        transform 0.18s ease;

    z-index: 3000;
}


.jc-signup-wrapper:hover .jc-signup-dropdown {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;

    transform: translateY(0);
}


/* =====================================================
   DROPDOWN ARROW
===================================================== */

.jc-signup-dropdown::before {
    content: "";

    position: absolute;

    top: -6px;
    right: 25px;

    width: 10px;
    height: 10px;

    background: #ffffff;

    border-left: 1px solid var(--jc-border);
    border-top: 1px solid var(--jc-border);

    transform: rotate(45deg);
}


/* =====================================================
   SIGNUP OPTIONS
===================================================== */

.jc-signup-option {
    width: 100%;

    display: flex;

    align-items: center;

    gap: 9px;

    padding: 9px 10px;

    color: var(--jc-text);

    text-decoration: none;

    font-size: 12px;

    font-weight: 600;

    border-radius: 8px;

    transition:
        background 0.18s ease,
        color 0.18s ease,
        transform 0.18s ease;
}


.jc-signup-option:hover {
    background: var(--jc-soft);

    color: var(--jc-green);

    transform: translateX(2px);
}


.jc-option-icon {
    width: 27px;
    height: 27px;

    display: flex;

    align-items: center;
    justify-content: center;

    background: #eef4eb;

    border-radius: 7px;

    font-size: 13px;
}


/* =====================================================
   USER
===================================================== */

.jc-user {
    position: relative;

    flex: 0 0 auto;

    flex-shrink: 0;

    margin-left: 2px;
}


/* =====================================================
   AVATAR
===================================================== */

.jc-avatar {
    width: 34px;
    height: 34px;

    min-width: 34px;
    min-height: 34px;

    border: 1.5px solid #e5eee4;

    border-radius: 50%;

    background:
        linear-gradient(
            135deg,
            #315f45,
            #244c36
        );

    color: #ffffff;

    font-size: 10px;

    font-weight: 750;

    cursor: pointer;

    display: flex;

    align-items: center;
    justify-content: center;

    padding: 0;

    box-shadow:
        0 3px 8px
        rgba(47, 93, 67, 0.14);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}


.jc-avatar:hover {
    transform: translateY(-1px);

    box-shadow:
        0 5px 12px
        rgba(47, 93, 67, 0.20);
}


/* =====================================================
   USER DROPDOWN
===================================================== */

.jc-user-dropdown {
    position: absolute;

    top: calc(100% + 9px);
    right: 0;

    width: 225px;

    padding: 11px;

    background: #ffffff;

    border: 1px solid var(--jc-border);

    border-radius: 12px;

    box-shadow:
        0 18px 40px
        rgba(23, 37, 29, 0.16);

    z-index: 10000;

    animation:
        jcDropdownIn
        0.18s ease;
}


@keyframes jcDropdownIn {

    from {
        opacity: 0;

        transform:
            translateY(-5px)
            scale(0.98);
    }

    to {
        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }
}


/* =====================================================
   USER HEADER
===================================================== */

.jc-user-header {
    display: flex;

    align-items: center;

    gap: 10px;

    padding: 3px 3px 10px;
}


.jc-dropdown-avatar {
    width: 34px;
    height: 34px;

    flex-shrink: 0;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #eef4eb;

    color: var(--jc-green);

    font-size: 10px;

    font-weight: 800;
}


.jc-user-info {
    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 2px;
}


.jc-user-name {
    color: var(--jc-text);

    font-size: 12px;

    font-weight: 700;

    line-height: 1.3;

    word-break: break-word;
}


.jc-user-role {
    color: var(--jc-muted);

    font-size: 10px;

    font-weight: 500;
}


/* =====================================================
   DIVIDER
===================================================== */

.jc-dropdown-divider {
    width: 100%;

    height: 1px;

    background: var(--jc-border);

    margin-bottom: 6px;
}


/* =====================================================
   LOGOUT
===================================================== */

.jc-logout {
    width: 100%;

    display: flex;

    align-items: center;

    gap: 8px;

    border: none;

    background: transparent;

    text-align: left;

    padding: 8px;

    border-radius: 7px;

    color: #a8402a;

    font-size: 11.5px;

    font-weight: 650;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}


.jc-logout:hover {
    background: #fbe9e4;

    transform: translateX(2px);
}


.jc-logout-icon {
    width: 23px;
    height: 23px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 6px;

    background: #fbe9e4;

    font-size: 12px;
}


/* =====================================================
   LOADING
===================================================== */

.jc-loading-bar {
    width: 70px;
    height: 4px;

    border-radius: 10px;

    background:
        linear-gradient(
            90deg,
            #e8eee6,
            #c7e36b,
            #e8eee6
        );

    background-size: 200% 100%;

    animation:
        jcLoading
        1.2s infinite;
}


@keyframes jcLoading {

    from {
        background-position: 200% 0;
    }

    to {
        background-position: -200% 0;
    }
}


/* =====================================================
   TABLET
===================================================== */

@media (max-width: 1000px) {

    .jc-navbar {
        height: 56px;
        min-height: 56px;
    }

    .jc-navbar-container {
        width: 100%;
        height: 56px;
        min-height: 56px;

        margin: 0;
        padding: 0 28px;

        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;

        align-items: center !important;
        justify-content: space-between;

        gap: 12px;

        overflow: visible;
    }

    .jc-brand {
        height: 56px;
    }

    .jc-navbar-right {
        height: 56px;
    }

    .jc-nav-links {
        height: 56px;
    }
}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 700px) {

    .jc-navbar {
        width: 100%;

        height: 56px;
        min-height: 56px;

        overflow: visible;
    }

    .jc-navbar-container {
        width: 100%;

        height: 56px;
        min-height: 56px;

        padding: 0 10px;

        display: flex !important;

        flex-direction: row !important;

        flex-wrap: nowrap !important;

        align-items: center !important;

        justify-content: space-between;

        gap: 5px;

        overflow: hidden;
    }

    .jc-brand {
        height: 56px;

        flex: 0 0 auto !important;
        flex-shrink: 0 !important;

        gap: 5px;
    }

    .jc-brand-logo {
        width: 24px;
        height: 24px;

        flex: 0 0 24px;
    }

    .jc-brand-text {
        font-size: 14px;
    }

    .jc-navbar-right {
        width: auto;
        height: 56px;

        display: flex !important;

        flex-direction: row !important;

        align-items: center !important;

        justify-content: flex-end !important;

        gap: 6px;

        margin-left: auto;

        min-width: 0;

        flex: 1 1 auto;

        overflow: visible;
    }

    .jc-nav-links {
        width: auto;
        height: 56px;

        display: flex !important;

        flex-direction: row !important;

        align-items: center !important;

        justify-content: flex-end !important;

        gap: 2px;

        flex: 1 1 auto;

        min-width: 0;

        overflow: visible;

        white-space: nowrap;
    }

    .jc-nav-link {
        height: 30px;

        padding: 0 4px;

        font-size: 9px;

        flex: 0 1 auto;

        min-width: 0;

        overflow: hidden;

        text-overflow: ellipsis;
    }

    .jc-nav-link.active::after {
        left: 4px;
        right: 4px;
        height: 2px;
    }

    .jc-user {
        position: relative;

        flex: 0 0 auto;

        flex-shrink: 0;

        margin-left: 2px;

        z-index: 10001;
    }

    .jc-user-dropdown {
        position: absolute;

        top: calc(100% + 9px);

        right: 0;

        width: 225px;

        padding: 11px;

        background: #ffffff;

        border: 1px solid var(--jc-border);

        border-radius: 12px;

        box-shadow:
            0 18px 40px
            rgba(23, 37, 29, 0.16);

        z-index: 10000;

        animation:
            jcDropdownIn
            0.18s ease;
    }

    .jc-avatar {
        width: 28px;
        height: 28px;

        min-width: 28px;
        min-height: 28px;

        font-size: 9px;
    }

    /* Public navbar */

    .jc-public-actions {
        height: 56px;

        flex: 0 0 auto;

        gap: 3px;

        margin-left: auto;
    }

    .jc-login-link {
        height: 30px;

        padding: 0 7px;

        font-size: 10px;
    }

    .jc-signup-button {
        height: 30px;

        padding: 0 9px;

        font-size: 10px;
    }
}


/* =====================================================
   SMALL MOBILE
===================================================== */

@media (max-width: 480px) {

    .jc-navbar {
        height: 52px;
        min-height: 52px;
    }

    .jc-navbar-container {
        height: 52px;
        min-height: 52px;

        padding: 0 7px;

        gap: 3px;
    }

    .jc-brand {
        height: 52px;

        gap: 4px;
    }

    .jc-brand-logo {
        width: 22px;
        height: 22px;

        flex-basis: 22px;
    }

    .jc-brand-text {
        font-size: 13px;
    }

    .jc-navbar-right {
        height: 52px;
    }

    .jc-nav-links {
        height: 52px;
    }

    .jc-nav-link {
        height: 28px;

        padding: 0 3px;

        font-size: 8px;
    }

    .jc-nav-link.active::after {
        left: 3px;
        right: 3px;
        height: 2px;
    }

    .jc-avatar {
        width: 26px;
        height: 26px;

        min-width: 26px;
        min-height: 26px;

        font-size: 8px;
    }

    .jc-public-actions {
        height: 52px;

        gap: 2px;
    }

    .jc-login-link {
        height: 28px;

        padding: 0 5px;

        font-size: 9px;
    }

    .jc-signup-button {
        height: 28px;

        padding: 0 7px;

        font-size: 9px;
    }

    .jc-user-dropdown {
        width: 205px;
    }
}


/* =====================================================
   VERY SMALL DEVICES
===================================================== */

@media (max-width: 380px) {

    .jc-navbar-container {
        padding: 0 5px;

        gap: 2px;
    }

    .jc-brand {
        gap: 3px;
    }

    .jc-brand-logo {
        width: 20px;
        height: 20px;

        flex-basis: 20px;
    }

    .jc-brand-text {
        font-size: 12px;
    }

    .jc-nav-link {
        padding: 0 2px;

        font-size: 7.5px;
    }

    .jc-nav-link.active::after {
        left: 2px;
        right: 2px;
        height: 2px;
    }

    .jc-avatar {
        width: 24px;
        height: 24px;

        min-width: 24px;
        min-height: 24px;
    }
}

`;

export default Navbar;