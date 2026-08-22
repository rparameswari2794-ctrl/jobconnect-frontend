import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PROFILE_API = `${API_BASE}/auth/jobseeker/profile/`;


function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // =====================================================
    // PUBLIC PAGES
    // =====================================================

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

    // =====================================================
    // LOAD USER + PROFILE
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        async function loadNavbarData() {
            const token = localStorage.getItem("jc_token");
            const savedUser = localStorage.getItem("jc_user");

            // ---------------------------------------------
            // NO TOKEN
            // ---------------------------------------------

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

                // =================================================
                // 1. GET USER FROM LOCAL STORAGE
                // =================================================

                let userData = null;

                if (savedUser) {
                    try {
                        userData = JSON.parse(savedUser);
                    } catch (error) {
                        console.error(
                            "Invalid jc_user:",
                            error
                        );

                        localStorage.removeItem("jc_user");
                    }
                }

                // ---------------------------------------------
                // If no saved user, token alone is not enough
                // for Navbar role information.
                // ---------------------------------------------

                if (!userData) {
                    console.error(
                        "User information not found."
                    );

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

                console.log(
                    "NAVBAR USER DATA:",
                    userData
                );

                setUser(userData);

                // =================================================
                // 2. JOB SEEKER PROFILE
                // =================================================

                if (userData.role === "jobseeker") {

                    const profileResponse =
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

                    // ---------------------------------------------
                    // INVALID / EXPIRED TOKEN
                    // ---------------------------------------------

                    if (
                        profileResponse.status === 401
                    ) {
                        console.error(
                            "JWT token expired or invalid."
                        );

                        localStorage.removeItem(
                            "jc_token"
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

                    // ---------------------------------------------
                    // PROFILE SUCCESS
                    // ---------------------------------------------

                    if (profileResponse.ok) {

                        const profileData =
                            await profileResponse.json();

                        if (cancelled) {
                            return;
                        }

                        console.log(
                            "================================"
                        );

                        console.log(
                            "NAVBAR PROFILE DATA:",
                            profileData
                        );

                        console.log(
                            "PROFILE COMPLETED:",
                            profileData.profile_completed
                        );

                        console.log(
                            "APPROVAL STATUS:",
                            profileData.approval_status
                        );

                        console.log(
                            "================================"
                        );

                        setProfile(profileData);

                        // -----------------------------------------
                        // UPDATE USER
                        // -----------------------------------------

                        const updatedUser = {
                            ...userData,

                            profile_completed:
                                profileData.profile_completed,

                            approval_status:
                                profileData.approval_status,

                            rejection_reason:
                                profileData.rejection_reason || "",
                        };

                        setUser(updatedUser);

                        localStorage.setItem(
                            "jc_user",
                            JSON.stringify(updatedUser)
                        );

                    } else {

                        console.error(
                            "PROFILE API ERROR:",
                            profileResponse.status
                        );

                        if (!cancelled) {
                            setProfile(null);
                        }
                    }

                }

                // =================================================
                // 3. EMPLOYER PROFILE
                // =================================================

                else if (
                    userData.role === "employer"
                ) {

                    const employerProfileAPI =
                        `${API_BASE}/auth/employer/profile/`;

                    const employerResponse =
                        await fetch(
                            employerProfileAPI,
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

                    // ---------------------------------------------
                    // INVALID / EXPIRED TOKEN
                    // ---------------------------------------------

                    if (
                        employerResponse.status === 401
                    ) {

                        console.error(
                            "Employer JWT token expired or invalid."
                        );

                        localStorage.removeItem(
                            "jc_token"
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

                    // ---------------------------------------------
                    // PROFILE SUCCESS
                    // ---------------------------------------------

                    if (employerResponse.ok) {

                        const employerData =
                            await employerResponse.json();

                        if (cancelled) {
                            return;
                        }

                        console.log(
                            "EMPLOYER PROFILE DATA:",
                            employerData
                        );

                        setProfile(
                            employerData
                        );

                        const updatedEmployerUser = {
                            ...userData,

                            profile_completed:
                                employerData.profile_completed,

                            approval_status:
                                employerData.approval_status,

                            rejection_reason:
                                employerData.rejection_reason || "",
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
                            employerResponse.status
                        );

                        if (!cancelled) {
                            setProfile(null);
                        }
                    }

                }

                // =================================================
                // 4. ADMIN / OTHER ROLE
                // =================================================

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

    }, [location.pathname]);

    // =====================================================
    // CLOSE MENU WHEN ROUTE CHANGES
    // =====================================================

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // =====================================================
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // =====================================================

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target
                )
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

    // =====================================================
    // LOGOUT
    // =====================================================

    function handleLogout() {
        localStorage.removeItem("jc_token");
        localStorage.removeItem("jc_user");

        setUser(null);
        setProfile(null);
        setMenuOpen(false);

        navigate("/login");
    }

    // =====================================================
    // INITIALS
    // =====================================================

    function getInitials(name) {

        if (!name) {
            return "--";
        }

        const cleanName = String(name).trim();

        if (!cleanName) {
            return "--";
        }

        const words = cleanName.split(/\s+/);

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

    // =====================================================
    // JOB SEEKER PROFILE ROUTE
    // =====================================================

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

        console.log("================================");
        console.log("NAVBAR PROFILE ROUTE");
        console.log("profile_completed:", profile.profile_completed);
        console.log("completed:", completed);
        console.log("approval_status:", approvalStatus);
        console.log("================================");


        // =================================================
        // COMPLETED + APPROVED
        // =================================================

        if (
            completed &&
            approvalStatus === "approved"
        ) {
            return "/jobseeker/profile/completed";
        }


        // =================================================
        // COMPLETED + PENDING
        // =================================================

        if (
            completed &&
            approvalStatus === "pending"
        ) {
            return "/jobseeker/profile/review";
        }


        // =================================================
        // COMPLETED + REJECTED
        // =================================================

        if (
            completed &&
            approvalStatus === "rejected"
        ) {
            return "/jobseeker/profile";
        }


        // =================================================
        // NOT COMPLETED
        // =================================================

        return "/jobseeker/profile";
    }

    // =====================================================
    // USER MENU
    // =====================================================

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

        console.log("================================");
        console.log("AVATAR USER:", user);
        console.log("AVATAR PROFILE:", profile);
        console.log("AVATAR DISPLAY NAME:", displayName);
        console.log("AVATAR INITIALS:", getInitials(displayName));
        console.log("================================");

        return (
            <div
                className="js-user"
                ref={menuRef}
            >

                <button
                    type="button"
                    className="js-avatar"
                    onClick={() =>
                        setMenuOpen(
                            open => !open
                        )
                    }
                >
                    {getInitials(displayName)}
                </button>


                {menuOpen && (

                    <div className="js-user-dropdown">

                        <span className="js-user-name">
                            {displayName || "User"}
                        </span>


                        <button
                            type="button"
                            className="navbar-logout"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>

                )}

            </div>
        );
    }

    // =====================================================
    // LOGO
    // =====================================================

    function Logo({ to = "/" }) {
        return (
            <Link
                to={to}
                className="brand"
            >
                <span className="tick">
                    ✓
                </span>

                <span className="brand1">
                    Job
                </span>

                <span className="brand2">
                    Connect
                </span>
            </Link>
        );
    }

    // =====================================================
    // PUBLIC PAGE
    // =====================================================

    if (isPublicPage) {
        return (
            <nav className="navbar">
                <div className="navbar-container">
                    <Logo to="/" />
                </div>
            </nav>
        );
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <nav className="navbar">
                <div className="navbar-container">
                    <Logo to="/" />
                </div>
            </nav>
        );
    }

    // =====================================================
    // NO USER
    // =====================================================

    if (!user) {
        return (
            <nav className="navbar">
                <div className="navbar-container">
                    <Logo to="/" />
                </div>
            </nav>
        );
    }

    // =====================================================
    // ADMIN NAVBAR
    // =====================================================

    if (user.role === "admin") {
        return (
            <nav className="navbar admin-navbar">

                <div className="navbar-container">

                    <Logo
                        to="/admin/dashboard"
                    />

                    <div className="nav-links">

                        <Link
                            to="/admin/dashboard"
                            className="nav-link"
                        >
                            Dashboard
                        </Link>

                        <Link
                            to="/admin/verifications"
                            className="nav-link"
                        >
                            Verification queue
                        </Link>

                        <Link
                            to="/admin/reports"
                            className="nav-link"
                        >
                            Reports & flags
                        </Link>

                        <Link
                            to="/admin/users"
                            className="nav-link"
                        >
                            Users
                        </Link>

                    </div>

                    <UserMenu />

                </div>

            </nav>
        );
    }

    // =====================================================
    // JOB SEEKER NAVBAR
    // =====================================================

    if (user.role === "jobseeker") {

        const profileRoute =
            getJobseekerProfileRoute();

        return (
            <nav className="navbar">

                <div className="navbar-container">

                    <Logo
                        to="/jobseeker/dashboard"
                    />

                    <div className="nav-links">

                        <Link
                            to="/jobseeker/dashboard"
                            className="nav-link"
                        >
                            Overview
                        </Link>

                        <Link
                            to="/jobseeker/jobs"
                            className="nav-link"
                        >
                            Find jobs
                        </Link>

                        <Link
                            to="/jobseeker/applications"
                            className="nav-link"
                        >
                            My Applications
                        </Link>

                        <Link
                            to={profileRoute}
                            className="nav-link"
                        >
                            Profile & verification
                        </Link>

                    </div>

                    <UserMenu />

                </div>

            </nav>
        );
    }

    // =====================================================
    // EMPLOYER NAVBAR
    // =====================================================

    if (user.role === "employer") {

        return (
            <nav className="navbar">

                <div className="navbar-container">

                    {/* =========================================
                    LOGO
                ========================================= */}

                    <Logo
                        to="/employer/dashboard"
                    />


                    {/* =========================================
                    EMPLOYER NAVIGATION
                ========================================= */}

                    <div className="nav-links">

                        {/* Overview */}

                        <Link
                            to="/employer/dashboard"
                            className="nav-link"
                        >
                            Overview
                        </Link>


                        {/* My Jobs */}

                        <Link
                            to="/employer/jobs"
                            className="nav-link"
                        >
                            My Jobs
                        </Link>


                        {/* Post Job */}

                        <Link
                            to="/employer/jobs/post"
                            className="nav-link"
                        >
                            Post a Job
                        </Link>


                        {/* Company Profile */}

                        <Link
                            to="/employer/profile"
                            className="nav-link"
                        >
                            Company Profile
                        </Link>

                    </div>


                    {/* =========================================
                    USER MENU
                ========================================= */}

                    <UserMenu />

                </div>

            </nav>
        );
    }

    return null;
}

export default Navbar;