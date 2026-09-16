import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";

const NAVIGATION = {
    jobseeker: [
        {
            to: "/jobseeker/dashboard",
            label: "Dashboard",
            icon: "grid",
            end: true,
        },
        {
            to: "/jobseeker/jobs",
            label: "Find Jobs",
            icon: "briefcase",
            end: true,
        },
        {
            to: "/jobseeker/applications",
            label: "My Applications",
            icon: "file",
            end: false,
        },
        {
            to: "/jobseeker/profile",
            label: "My Profile",
            icon: "user",
            end: true,
            profileNav: true,
        },
    ],

    employer: [
        {
            to: "/employer/dashboard",
            label: "Dashboard",
            icon: "grid",
            end: true,
        },
        {
            to: "/employer/jobs",
            label: "My Jobs",
            icon: "briefcase",
            end: true,
        },
        {
            to: "/employer/jobs/post",
            label: "Post a Job",
            icon: "plus",
            end: true,
        },
        {
            to: "/employer/profile",
            label: "Company Profile",
            icon: "building",
            end: false,
        },
    ],

    admin: [
        {
            to: "/admin/dashboard",
            label: "Dashboard",
            icon: "grid",
            end: true,
        },
        {
            to: "/admin/verifications",
            label: "Verification Queue",
            icon: "shield",
            end: true,
        },
        {
            to: "/admin/users",
            label: "Users",
            icon: "users",
            end: true,
        },
        {
            to: "/admin/reports",
            label: "Reports & Flags",
            icon: "chart",
            end: true,
        },
    ],
};

const ROLE_LABELS = {
    jobseeker: "Job Seeker",
    employer: "Employer",
    admin: "Administrator",
};

/* =========================================================
   ICON
========================================================= */

function Icon({ name, size = 19 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const paths = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),

        briefcase: (
            <>
                <rect
                    x="3"
                    y="7"
                    width="18"
                    height="13"
                    rx="2"
                />
                <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
                <path d="M3 11h18" />
            </>
        ),

        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8M8 17h5" />
            </>
        ),

        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),

        plus: (
            <>
                <path d="M12 5v14M5 12h14" />
            </>
        ),

        building: (
            <>
                <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                <path d="M16 9h3a1 1 0 0 1 1 1v11" />
                <path d="M8 7h2M8 11h2M8 15h2" />
                <path d="M13 7h.01M13 11h.01M13 15h.01" />
                <path d="M2 21h20" />
            </>
        ),

        shield: (
            <>
                <path d="M12 3l8 3v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6z" />
                <path d="m8.5 12 2.3 2.3 4.8-5" />
            </>
        ),

        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),

        chart: (
            <>
                <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            </>
        ),

        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 3v18" />
            </>
        ),

        close: (
            <>
                <path d="m6 6 12 12M18 6 6 18" />
            </>
        ),
    };

    return (
        <svg {...common}>
            {paths[name] || paths.grid}
        </svg>
    );
}

/* =========================================================
   READ USER
========================================================= */

function readUser() {
    try {
        const raw =
            localStorage.getItem("jc_user") ||
            localStorage.getItem("user");

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/* =========================================================
   GET USER NAME
========================================================= */

function getName(user, role) {
    if (!user) {
        return ROLE_LABELS[role] || "User";
    }

    return (
        user.name ||
        user.full_name ||
        user.username ||
        user.first_name ||
        user.contact_name ||
        user.company_name ||
        user.email ||
        ROLE_LABELS[role] ||
        "User"
    );
}

/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(name) {
    const value = String(name || "U").trim();

    if (!value) {
        return "U";
    }

    const parts = value.split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* =========================================================
   GET PROFILE STATUS

   EXACT CONDITIONS:

   1. profile_completed = false
      approval_status = pending
      -> incomplete
      -> /jobseeker/profile

   2. profile_completed = true
      approval_status = pending
      -> pending
      -> /jobseeker/profile/review

   3. profile_completed = true
      approval_status = approved
      -> approved
      -> /jobseeker/profile/completed

   4. profile_completed = true
      approval_status = rejected
      -> rejected
      -> /jobseeker/profile
========================================================= */

function getProfileStatus(user) {
    /*
     * Convert the value safely to boolean.
     *
     * Backend should normally send true/false.
     */
    const profileCompleted =
        user?.profile_completed === true ||
        user?.profileCompleted === true;

    /*
     * Read approval status.
     */
    const approvalStatus = String(
        user?.approval_status ??
            user?.approvalStatus ??
            ""
    )
        .trim()
        .toLowerCase();

    /* =====================================================
       CASE 1
       Profile NOT completed + Pending

       -> /jobseeker/profile
    ===================================================== */

    if (
        profileCompleted === false &&
        approvalStatus === "pending"
    ) {
        return "incomplete";
    }

    /* =====================================================
       CASE 2
       Profile completed + Pending

       -> /jobseeker/profile/review
    ===================================================== */

    if (
        profileCompleted === true &&
        approvalStatus === "pending"
    ) {
        return "pending";
    }

    /* =====================================================
       CASE 3
       Profile completed + Approved

       -> /jobseeker/profile/completed
    ===================================================== */

    if (
        profileCompleted === true &&
        approvalStatus === "approved"
    ) {
        return "approved";
    }

    /* =====================================================
       CASE 4
       Profile completed + Rejected

       -> /jobseeker/profile
    ===================================================== */

    if (
        profileCompleted === true &&
        approvalStatus === "rejected"
    ) {
        return "rejected";
    }

    /*
     * Safe fallback.
     *
     * If the values are missing or unexpected,
     * send the user to the editable profile page.
     */
    return "incomplete";
}

/* =========================================================
   GET JOBSEEKER PROFILE DESTINATION
========================================================= */

function getProfileDestination(user) {
    const status = getProfileStatus(user);

    switch (status) {
        case "pending":
            return "/jobseeker/profile/review";

        case "approved":
            return "/jobseeker/profile/completed";

        case "rejected":
            return "/jobseeker/profile";

        case "incomplete":
        default:
            return "/jobseeker/profile";
    }
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
    role = "jobseeker",
    mobileOpen = false,
    onClose = () => {},
}) {
    const navigate = useNavigate();
    const location = useLocation();

    /* =====================================================
       USER STATE
    ===================================================== */

    const [user, setUser] = useState(() => readUser());

    /* =====================================================
       REFRESH USER

       Re-read localStorage whenever route changes.
    ===================================================== */

    useEffect(() => {
        const currentUser = readUser();

        setUser(currentUser);
    }, [location.pathname]);

    /* =====================================================
       STORAGE EVENT

       Handles changes made by another browser tab/window.
    ===================================================== */

    useEffect(() => {
        function handleStorageChange(event) {
            if (
                event.key === "jc_user" ||
                event.key === "user" ||
                event.key === null
            ) {
                setUser(readUser());
            }
        }

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, []);

    /* =====================================================
       USER NAME
    ===================================================== */

    const userName = useMemo(
        () => getName(user, role),
        [user, role]
    );

    /* =====================================================
       NAVIGATION ITEMS
    ===================================================== */

    const items =
        NAVIGATION[role] ||
        NAVIGATION.jobseeker;

    /* =====================================================
       PROFILE DESTINATION

       Jobseeker:

       false + pending  -> /jobseeker/profile
       true  + pending  -> /jobseeker/profile/review
       true  + approved -> /jobseeker/profile/completed
       true  + rejected -> /jobseeker/profile
    ===================================================== */

    const profileDestination =
        role === "jobseeker"
            ? getProfileDestination(user)
            : "/jobseeker/profile";

    /* =====================================================
       LOGOUT
    ===================================================== */

    function handleLogout() {
        localStorage.removeItem("jc_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");

        localStorage.removeItem("jc_user");
        localStorage.removeItem("user");

        /*
         * Legacy flag cleanup.
         */
        localStorage.removeItem("profile_submitted");

        setUser(null);

        navigate("/login", {
            replace: true,
        });

        onClose();
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {mobileOpen && (
                <button
                    type="button"
                    className="jc-sidebar-overlay"
                    onClick={onClose}
                    aria-label="Close navigation"
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`jc-sidebar ${
                    mobileOpen ? "is-open" : ""
                }`}
            >
                {/* =================================================
                    BRAND
                ================================================= */}

                <div className="jc-sidebar-brand">
                    <div className="jc-brand-logo">
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
                    </div>

                    <div>
                        <div className="jc-brand-name">
                            Job <span>Connect</span>
                        </div>

                        <div className="jc-brand-caption">
                            CAREER PLATFORM
                        </div>
                    </div>

                    <button
                        type="button"
                        className="jc-sidebar-close"
                        onClick={onClose}
                        aria-label="Close navigation"
                    >
                        <Icon
                            name="close"
                            size={18}
                        />
                    </button>
                </div>

                {/* =================================================
                    PROFILE
                ================================================= */}

                <div className="jc-profile-mini">
                    <div className="jc-avatar">
                        {getInitials(userName)}
                    </div>

                    <div className="jc-profile-copy">
                        <strong>
                            {userName}
                        </strong>

                        <span>
                            {ROLE_LABELS[role] ||
                                "User"}
                        </span>
                    </div>
                </div>

                {/* =================================================
                    NAVIGATION LABEL
                ================================================= */}

                <div className="jc-nav-label">
                    Workspace
                </div>

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav
                    className="jc-sidebar-nav"
                    aria-label={`${ROLE_LABELS[role]} navigation`}
                >
                    {items.map((item) => {
                        /*
                         * Only Jobseeker My Profile
                         * uses profile-status routing.
                         */

                        const isProfileNav =
                            role === "jobseeker" &&
                            item.profileNav === true;

                        /*
                         * Determine destination.
                         */

                        const destination =
                            isProfileNav
                                ? profileDestination
                                : item.to;

                        /*
                         * My Profile uses exact matching.
                         */

                        const navEnd =
                            isProfileNav
                                ? true
                                : item.end;

                        return (
                            <NavLink
                                key={item.to}
                                to={destination}
                                end={navEnd}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `jc-nav-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >
                                <span className="jc-nav-icon">
                                    <Icon
                                        name={item.icon}
                                    />
                                </span>

                                <span>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="jc-sidebar-footer">
                    <div className="jc-sidebar-help">
                        <span className="jc-help-dot" />

                        <div>
                            <strong>
                                Stay job-ready
                            </strong>

                            <small>
                                Keep your profile updated.
                            </small>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="jc-logout"
                        onClick={handleLogout}
                    >
                        <Icon
                            name="logout"
                            size={18}
                        />

                        <span>
                            Sign out
                        </span>
                    </button>
                </div>
            </aside>

            {/* =====================================================
                SIDEBAR STYLES
            ===================================================== */}

            <style>{`
                .jc-sidebar {
                    width: 238px;
                    min-width: 238px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    padding: 18px 14px;
                    background: #17110d;
                    color: #fff8f2;
                    border-right: 1px solid rgba(255,255,255,0.08);
                    box-sizing: border-box;
                    overflow-y: auto;
                    font-family: "Inter", sans-serif;
                }

                .jc-sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    min-height: 46px;
                    padding: 2px 4px 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }

                .jc-brand-logo {
                    width: 38px;
                    height: 38px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(
                        0 0 10px rgba(255,201,77,0.25)
                    );
                }

                .jc-brand-logo svg {
                    width: 38px;
                    height: 38px;
                    display: block;
                }

                .jc-brand-name {
                    font-family:
                        "Bricolage Grotesque",
                        "Inter",
                        sans-serif;
                    font-size: 1.15rem;
                    line-height: 1.1;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #fff8f2;
                    white-space: nowrap;
                }

                .jc-brand-name span {
                    color: #ff5b3d;
                }

                .jc-brand-caption {
                    margin-top: 3px;
                    font-size: 0.55rem;
                    font-weight: 600;
                    letter-spacing: 0.12em;
                    color: #9f9185;
                }

                .jc-sidebar-close {
                    display: none;
                    margin-left: auto;
                    width: 32px;
                    height: 32px;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.06);
                    color: #fff8f2;
                    cursor: pointer;
                }

                .jc-profile-mini {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 15px 7px 13px;
                }

                .jc-avatar {
                    width: 36px;
                    height: 36px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: linear-gradient(
                        135deg,
                        #ff5b3d,
                        #e23f22
                    );
                    color: #ffffff;
                    font-size: 0.75rem;
                    font-weight: 800;
                    box-shadow:
                        0 5px 15px rgba(255,91,61,0.18);
                }

                .jc-profile-copy {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .jc-profile-copy strong {
                    color: #fff8f2;
                    font-size: 0.78rem;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 145px;
                }

                .jc-profile-copy span {
                    color: #9f9185;
                    font-size: 0.66rem;
                }

                .jc-nav-label {
                    padding: 8px 9px 7px;
                    color: #81736a;
                    font-size: 0.59rem;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .jc-sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .jc-nav-link {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-height: 40px;
                    padding: 8px 10px;
                    border-radius: 9px;
                    color: #b9aaa0;
                    text-decoration: none;
                    font-size: 0.78rem;
                    font-weight: 600;
                    transition:
                        background 0.18s ease,
                        color 0.18s ease,
                        transform 0.18s ease;
                }

                .jc-nav-link:hover {
                    background: rgba(255,255,255,0.055);
                    color: #fff8f2;
                }

                .jc-nav-link.active {
                    background: rgba(255,91,61,0.13);
                    color: #ffffff;
                }

                .jc-nav-link.active::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 9px;
                    bottom: 9px;
                    width: 3px;
                    border-radius: 0 4px 4px 0;
                    background: #ff5b3d;
                }

                .jc-nav-icon {
                    width: 25px;
                    height: 25px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 7px;
                    color: #8e8178;
                }

                .jc-nav-link.active .jc-nav-icon {
                    color: #ff5b3d;
                    background: rgba(255,91,61,0.08);
                }

                .jc-sidebar-footer {
                    margin-top: auto;
                    padding-top: 14px;
                }

                .jc-sidebar-help {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 10px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 9px;
                    background: rgba(255,255,255,0.035);
                }

                .jc-help-dot {
                    width: 7px;
                    height: 7px;
                    margin-top: 4px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: #0b8f7a;
                    box-shadow:
                        0 0 8px rgba(11,143,122,0.7);
                }

                .jc-sidebar-help div {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .jc-sidebar-help strong {
                    color: #ddd1c6;
                    font-size: 0.68rem;
                    font-weight: 700;
                }

                .jc-sidebar-help small {
                    color: #80736a;
                    font-size: 0.58rem;
                    line-height: 1.35;
                }

                .jc-logout {
                    width: 100%;
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: #9e9188;
                    font-family: inherit;
                    font-size: 0.76rem;
                    font-weight: 600;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        background 0.18s ease,
                        color 0.18s ease;
                }

                .jc-logout:hover {
                    background: rgba(255,91,61,0.08);
                    color: #ff8069;
                }

                .jc-sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999;
                    border: none;
                    background: rgba(0,0,0,0.55);
                    backdrop-filter: blur(2px);
                }

                .jc-sidebar::-webkit-scrollbar {
                    width: 4px;
                }

                .jc-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .jc-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.12);
                    border-radius: 10px;
                }

                @media (max-width: 900px) {
                    .jc-sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.25s ease;
                        box-shadow:
                            15px 0 40px rgba(0,0,0,0.25);
                    }

                    .jc-sidebar.is-open {
                        transform: translateX(0);
                    }

                    .jc-sidebar-close {
                        display: flex;
                    }
                }

                @media (max-width: 520px) {
                    .jc-sidebar {
                        width: 250px;
                        min-width: 250px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .jc-sidebar,
                    .jc-nav-link,
                    .jc-logout {
                        transition: none;
                    }
                }
            `}</style>
        </>
    );
}

export default Sidebar;
