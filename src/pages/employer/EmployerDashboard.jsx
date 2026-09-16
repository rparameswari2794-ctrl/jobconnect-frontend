import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

function EmployerDashboard() {
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // =========================================================
    // DASHBOARD STATE
    // =========================================================

    const [dashboard, setDashboard] = useState({
        employer_name: "",
        company_name: "",
        email: "",

        total_jobs: 0,
        active_jobs: 0,
        total_applications: 0,
        hired_candidates: 0,

        jobs: [],
        applications: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // NOTIFICATION STATE
    // =========================================================

    const [notifications, setNotifications] = useState([]);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] =
        useState(false);

    // =========================================================
    // POST JOB CHECK STATE
    // =========================================================

    const [postingCheckLoading, setPostingCheckLoading] =
        useState(false);

    // =========================================================
    // POPUP ALERT STATE
    // =========================================================

    const [popup, setPopup] = useState({
        show: false,
        title: "",
        message: "",
        type: "warning",
        action: null,
    });

    const showPopup = (
        title,
        message,
        type = "warning",
        action = null
    ) => {
        setPopup({
            show: true,
            title,
            message,
            type,
            action,
        });
    };

    const closePopup = () => {
        setPopup({
            show: false,
            title: "",
            message: "",
            type: "warning",
            action: null,
        });
    };

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () => {
        return (
            localStorage.getItem("jc_token") ||
            localStorage.getItem("access_token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("access") ||
            localStorage.getItem("token")
        );
    };

    // =========================================================
    // AUTH HEADERS
    // =========================================================

    const getHeaders = () => {
        const token = getToken();

        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        };
    };

    // =========================================================
    // CLEAR AUTH
    // =========================================================

    const clearAuth = () => {
        localStorage.removeItem("jc_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access");
        localStorage.removeItem("token");
    };

    // =========================================================
    // GET ARRAY
    // =========================================================

    const extractArray = (data, keys = []) => {
        if (Array.isArray(data)) {
            return data;
        }

        for (const key of keys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        return [];
    };

    // =========================================================
    // JOB ACTIVE STATUS
    // =========================================================

    const isJobActive = (job) => {
        if (!job) {
            return false;
        }

        if (job.is_active === true) {
            return true;
        }

        if (job.is_active === false) {
            return false;
        }

        if (job.active === true) {
            return true;
        }

        if (job.active === false) {
            return false;
        }

        const status = String(
            job.status ||
                job.job_status ||
                job.state ||
                ""
        )
            .trim()
            .toLowerCase();

        if (
            status === "closed" ||
            status === "inactive" ||
            status === "expired" ||
            status === "deactivated" ||
            status === "rejected" ||
            status === "draft"
        ) {
            return false;
        }

        return true;
    };

    // =========================================================
    // APPLICATION STATUS
    // =========================================================

    const getApplicationStatus = (application) => {
        return String(
            application?.status ||
                application?.application_status ||
                application?.state ||
                "Applied"
        )
            .trim()
            .toLowerCase();
    };

    // =========================================================
    // FETCH EMPLOYER PROFILE
    // Used before opening Post a Job.
    // =========================================================

    const fetchEmployerProfile = async () => {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        const response = await fetch(
            `${API_BASE}/auth/employer/profile/`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        console.log(
            "EMPLOYER PROFILE CHECK:",
            response.status,
            data
        );

        if (response.status === 401) {
            const errorObject = new Error(
                "Your login session has expired. Please login again."
            );

            errorObject.status = 401;

            throw errorObject;
        }

        if (!response.ok) {
            const backendMessage =
                data?.detail ||
                data?.message ||
                data?.error ||
                "";

            const errorObject = new Error(
                backendMessage ||
                    "Unable to verify your employer profile."
            );

            errorObject.status = response.status;

            throw errorObject;
        }

        return data;
    };

    // =========================================================
    // POST JOB
    // =========================================================

    const handlePostJob = async () => {
        if (postingCheckLoading) {
            return;
        }

        const token = getToken();

        if (!token) {
            clearAuth();

            showPopup(
                "Session Expired",
                "Your login session has expired. Please login again.",
                "error",
                () => {
                    closePopup();

                    navigate("/login", {
                        replace: true,
                    });
                }
            );

            return;
        }

        try {
            setPostingCheckLoading(true);

            const profile =
                await fetchEmployerProfile();

            const profileCompleted =
                profile?.profile_completed === true;

            const approvalStatus = String(
                profile?.approval_status || ""
            )
                .trim()
                .toLowerCase();

            if (!profileCompleted) {
                showPopup(
                    "Complete Your Profile",
                    "Please complete your employer profile before posting a job.",
                    "warning",
                    () => {
                        closePopup();
                        navigate("/employer/profile");
                    }
                );

                return;
            }

            if (approvalStatus === "pending") {
                showPopup(
                    "Waiting for Approval",
                    "Your employer profile is waiting for admin approval. You can post a job after your profile is approved.",
                    "warning"
                );

                return;
            }

            if (approvalStatus === "rejected") {
                showPopup(
                    "Profile Rejected",
                    "Your employer profile was rejected. Please update your profile and wait for admin approval before posting a job.",
                    "error",
                    () => {
                        closePopup();
                        navigate("/employer/profile");
                    }
                );

                return;
            }

            if (approvalStatus !== "approved") {
                showPopup(
                    "Approval Required",
                    "Your employer profile must be approved by admin before you can post a job.",
                    "warning"
                );

                return;
            }

            navigate("/employer/jobs/post");
        } catch (err) {
            console.error(
                "POST JOB PROFILE CHECK ERROR:",
                err
            );

            if (err?.status === 401) {
                clearAuth();

                showPopup(
                    "Session Expired",
                    "Your login session has expired. Please login again.",
                    "error",
                    () => {
                        closePopup();

                        navigate("/login", {
                            replace: true,
                        });
                    }
                );

                return;
            }

            showPopup(
                "Unable to Continue",
                err?.message ||
                    "Unable to verify your employer profile. Please try again.",
                "error"
            );
        } finally {
            setPostingCheckLoading(false);
        }
    };

    // =========================================================
    // FETCH DASHBOARD
    // =========================================================

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                navigate("/login", {
                    replace: true,
                });

                return;
            }

            const response = await fetch(
                `${API_BASE}/auth/employer/dashboard/`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            if (response.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            if (!response.ok) {
                let message =
                    `Dashboard request failed: ${response.status}`;

                try {
                    const errorData =
                        await response.json();

                    message =
                        errorData?.detail ||
                        errorData?.message ||
                        message;
                } catch {
                    // Keep default message
                }

                throw new Error(message);
            }

            const data = await response.json();

            console.log(
                "EMPLOYER DASHBOARD RESPONSE:",
                data
            );

            // =================================================
            // PROFILE
            // =================================================

            const profile =
                data.profile || {};

            const employerName =
                data.employer_name ||
                profile.contact_name ||
                profile.name ||
                profile.full_name ||
                "";

            const companyName =
                data.company_name ||
                profile.company_name ||
                profile.company ||
                "";

            const email =
                data.email ||
                profile.email ||
                "";

            // =================================================
            // JOBS
            // =================================================

            const jobs = extractArray(
                data,
                [
                    "jobs",
                    "recent_jobs",
                    "job_posts",
                    "job_list",
                ]
            );

            // =================================================
            // APPLICATIONS
            // =================================================

            const applications =
                extractArray(
                    data,
                    [
                        "applications",
                        "recent_applications",
                        "application_list",
                        "candidate_applications",
                    ]
                );

            // =================================================
            // STATS
            // =================================================

            const stats =
                data.stats || {};

            const totalJobs = Number(
                data.total_jobs ??
                    stats.total_jobs ??
                    jobs.length ??
                    0
            );

            const activeJobs = Number(
                data.active_jobs ??
                    stats.active_jobs ??
                    stats.live_jobs ??
                    jobs.filter(isJobActive).length ??
                    0
            );

            const totalApplications =
                Number(
                    data.total_applications ??
                        stats.total_applications ??
                        stats.total_applicants ??
                        applications.length ??
                        0
                );

            let hiredCandidates =
                Number(
                    data.hired_candidates ??
                        stats.hired_candidates ??
                        stats.hired_count ??
                        0
                );

            // =================================================
            // FALLBACK HIRED COUNT
            // =================================================

            if (
                hiredCandidates === 0 &&
                applications.length > 0
            ) {
                hiredCandidates =
                    applications.filter(
                        (application) => {
                            const status =
                                getApplicationStatus(
                                    application
                                );

                            return (
                                status === "hired" ||
                                status === "selected" ||
                                status === "accepted"
                            );
                        }
                    ).length;
            }

            // =================================================
            // UPDATE
            // =================================================

            setDashboard({
                employer_name:
                    employerName,

                company_name:
                    companyName,

                email,

                total_jobs:
                    totalJobs,

                active_jobs:
                    activeJobs,

                total_applications:
                    totalApplications,

                hired_candidates:
                    hiredCandidates,

                jobs,

                applications,
            });
        } catch (err) {
            console.error(
                "Employer dashboard error:",
                err
            );

            if (err?.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            setError(
                err?.message ||
                    "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FETCH NOTIFICATIONS
    // =========================================================

    const fetchNotifications = async () => {
        try {
            setNotificationLoading(true);

            const token = getToken();

            if (!token) {
                return;
            }

            const response = await fetch(
                `${API_BASE}/auth/employer/notifications/`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            if (response.status === 401) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "Failed to load notifications"
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                setNotifications(data);
            } else if (
                Array.isArray(
                    data?.notifications
                )
            ) {
                setNotifications(
                    data.notifications
                );
            } else if (
                Array.isArray(
                    data?.results
                )
            ) {
                setNotifications(
                    data.results
                );
            } else {
                setNotifications([]);
            }
        } catch (err) {
            console.error(
                "Notification error:",
                err
            );
        } finally {
            setNotificationLoading(
                false
            );
        }
    };

    // =========================================================
    // MARK ALL READ
    // =========================================================

    const markAllNotificationsRead =
        async () => {
            try {
                await fetch(
                    `${API_BASE}/auth/employer/notifications/read-all/`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                    }
                );

                setNotifications(
                    (previous) =>
                        previous.map(
                            (notification) => ({
                                ...notification,
                                is_read: true,
                                read: true,
                            })
                        )
                );
            } catch (err) {
                console.error(
                    "Mark all notifications error:",
                    err
                );
            }
        };

    // =========================================================
    // MARK SINGLE READ
    // =========================================================

    const markNotificationRead =
        async (notificationId) => {
            if (!notificationId) {
                return;
            }

            try {
                await fetch(
                    `${API_BASE}/auth/employer/notifications/${notificationId}/read/`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                    }
                );

                setNotifications(
                    (previous) =>
                        previous.map(
                            (notification) =>
                                String(
                                    notification.id
                                ) ===
                                    String(
                                        notificationId
                                    )
                                    ? {
                                          ...notification,
                                          is_read:
                                              true,
                                          read: true,
                                      }
                                    : notification
                        )
                );
            } catch (err) {
                console.error(
                    "Mark notification error:",
                    err
                );
            }
        };

    // =========================================================
    // DELETE NOTIFICATION
    // =========================================================

    const deleteNotification =
        async (notificationId) => {
            if (!notificationId) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_BASE}/auth/employer/notifications/${notificationId}/`,
                        {
                            method: "DELETE",
                            headers: getHeaders(),
                        }
                    );

                if (response.ok) {
                    setNotifications(
                        (previous) =>
                            previous.filter(
                                (notification) =>
                                    String(
                                        notification.id
                                    ) !==
                                    String(
                                        notificationId
                                    )
                            )
                    );
                }
            } catch (err) {
                console.error(
                    "Delete notification error:",
                    err
                );
            }
        };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchDashboard();
        fetchNotifications();

        const dashboardInterval =
            setInterval(() => {
                fetchDashboard();
            }, 30000);

        const notificationInterval =
            setInterval(() => {
                fetchNotifications();
            }, 30000);

        return () => {
            clearInterval(
                dashboardInterval
            );

            clearInterval(
                notificationInterval
            );
        };
    }, []);

    // =========================================================
    // CLOSE NOTIFICATION DROPDOWN
    // =========================================================

    useEffect(() => {
        const handleOutsideClick = (
            event
        ) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target
                )
            ) {
                setNotificationOpen(
                    false
                );
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    // =========================================================
    // MESSAGES
    // =========================================================

    const handleMessagesOpen = () => {
        setNotificationOpen(false);

        navigate(
            "/employer/messages"
        );
    };

    // =========================================================
    // HELP
    // =========================================================

    const handleHelpOpen = () => {
        setNotificationOpen(false);

        navigate("/help-support", {
            state: {
                role: "employer",
            },
        });
    };

    // =========================================================
    // NOTIFICATION TOGGLE
    // =========================================================

    const handleNotificationToggle =
        () => {
            setNotificationOpen(
                (previous) =>
                    !previous
            );
        };

    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationClick =
        async (notification) => {
            if (!notification) {
                return;
            }

            const isUnread =
                !notification.is_read &&
                !notification.read;

            if (
                isUnread &&
                notification.id
            ) {
                await markNotificationRead(
                    notification.id
                );
            }

            if (notification.link) {
                navigate(
                    notification.link
                );

                setNotificationOpen(
                    false
                );
            }
        };

    // =========================================================
    // NOTIFICATION HELPERS
    // =========================================================

    const getNotificationTitle = (
        notification
    ) => {
        return (
            notification?.title ||
            notification?.message ||
            notification?.text ||
            "Notification"
        );
    };

    const getNotificationMessage = (
        notification
    ) => {
        return (
            notification?.message ||
            notification?.description ||
            notification?.text ||
            ""
        );
    };

    const formatDate = (value) => {
        if (!value) {
            return "";
        }

        try {
            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "";
            }

            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }
            );
        } catch {
            return "";
        }
    };

    const unreadNotifications =
        notifications.filter(
            (notification) =>
                !notification.is_read &&
                !notification.read
        );

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>

                <p>
                    Loading dashboard...
                </p>

                <style>{`
                    .dashboard-loading {
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #f7f7f7;
                        color: #222;
                        font-family: Arial, sans-serif;
                    }

                    .loading-spinner {
                        width: 36px;
                        height: 36px;
                        border: 3px solid #e5e5e5;
                        border-top-color: #111;
                        border-radius: 50%;
                        animation: dashboardSpin 0.8s linear infinite;
                        margin-bottom: 15px;
                    }

                    .dashboard-loading p {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                    }

                    @keyframes dashboardSpin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="employer-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="dashboard-header">

                <div className="header-left">

                    <div className="brand-mark">
                        JC
                    </div>

                    <div className="brand-info">

                        <h1>
                            Employer Dashboard
                        </h1>

                        <p>
                            {dashboard.company_name ||
                                "Manage your recruitment"}
                        </p>

                    </div>

                </div>

                <div className="header-actions">

                    {/* =================================================
                        MESSAGES
                    ================================================= */}

                    <button
                        type="button"
                        className="chat-header-button"
                        onClick={
                            handleMessagesOpen
                        }
                        aria-label="Messages"
                        title="Messages"
                    >
                        <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />

                            <path d="M8 12h.01" />
                            <path d="M12 12h.01" />
                            <path d="M16 12h.01" />
                        </svg>
                    </button>

                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    <div
                        className="notification-wrapper"
                        ref={
                            notificationRef
                        }
                    >
                        <button
                            type="button"
                            className="notification-button"
                            onClick={
                                handleNotificationToggle
                            }
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <svg
                                width="21"
                                height="21"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>

                            {unreadNotifications.length >
                                0 && (
                                    <span className="notification-dot"></span>
                                )}
                        </button>

                        {notificationOpen && (
                            <div className="notification-dropdown">

                                <div className="notification-header">

                                    <div>
                                        <h3>
                                            Notifications
                                        </h3>

                                        <span>
                                            {
                                                notifications.length
                                            }{" "}
                                            notification
                                            {notifications.length !==
                                                1
                                                ? "s"
                                                : ""}
                                        </span>
                                    </div>

                                    {unreadNotifications.length >
                                        0 && (
                                            <button
                                                type="button"
                                                className="mark-all-button"
                                                onClick={
                                                    markAllNotificationsRead
                                                }
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                </div>

                                <div className="notification-list">

                                    {notificationLoading ? (
                                        <div className="notification-empty">
                                            Loading...
                                        </div>
                                    ) : notifications.length ===
                                      0 ? (
                                        <div className="notification-empty">

                                            <div className="empty-bell">
                                                <svg
                                                    width="30"
                                                    height="30"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                >
                                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </div>

                                            <strong>
                                                No notifications
                                            </strong>

                                            <span>
                                                You're all
                                                caught up.
                                            </span>
                                        </div>
                                    ) : (
                                        notifications.map(
                                            (
                                                notification,
                                                index
                                            ) => {
                                                const isUnread =
                                                    !notification.is_read &&
                                                    !notification.read;

                                                return (
                                                    <div
                                                        key={
                                                            notification.id ||
                                                            index
                                                        }
                                                        className={`notification-item ${
                                                            isUnread
                                                                ? "unread"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handleNotificationClick(
                                                                notification
                                                            )
                                                        }
                                                    >

                                                        <div className="notification-icon">
                                                            <svg
                                                                width="18"
                                                                height="18"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.8"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                            </svg>
                                                        </div>

                                                        <div className="notification-content">

                                                            <strong>
                                                                {getNotificationTitle(
                                                                    notification
                                                                )}
                                                            </strong>

                                                            <p>
                                                                {getNotificationMessage(
                                                                    notification
                                                                )}
                                                            </p>

                                                            {notification.created_at && (
                                                                <small>
                                                                    {formatDate(
                                                                        notification.created_at
                                                                    )}
                                                                </small>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="delete-notification"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                deleteNotification(
                                                                    notification.id
                                                                );
                                                            }}
                                                            title="Delete"
                                                        >
                                                            ×
                                                        </button>

                                                    </div>
                                                );
                                            }
                                        )
                                    )}

                                </div>

                                {notifications.length >
                                    0 && (
                                        <div className="notification-footer">

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotificationOpen(
                                                        false
                                                    );

                                                    navigate(
                                                        "/employer/notifications"
                                                    );
                                                }}
                                            >
                                                View all
                                                notifications
                                            </button>

                                        </div>
                                    )}

                            </div>
                        )}
                    </div>

                    {/* =================================================
                        HELP & SUPPORT
                    ================================================= */}

                    <button
                        type="button"
                        className="help-header-button"
                        onClick={
                            handleHelpOpen
                        }
                        aria-label="Help & Support"
                        title="Help & Support"
                    >
                        <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                            />

                            <path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-.9.9-1.9 1.3-1.9 2.9" />

                            <line
                                x1="12"
                                y1="17"
                                x2="12.01"
                                y2="17"
                            />
                        </svg>
                    </button>

                </div>

            </header>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="dashboard-content">

                {/* =================================================
                    WELCOME
                ================================================= */}

                <section className="welcome-section">

                    <div>
                        <p className="welcome-label">
                            Welcome back
                        </p>

                        <h2>
                            {dashboard.employer_name ||
                                dashboard.company_name ||
                                "Employer"}
                        </h2>

                        <p className="welcome-description">
                            Here's what's happening
                            with your recruitment
                            activities today.
                        </p>
                    </div>

                    {/* =================================================
                        MAIN POST JOB BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className="primary-button"
                        onClick={
                            handlePostJob
                        }
                        disabled={
                            postingCheckLoading
                        }
                    >
                        <span>+</span>

                        {postingCheckLoading
                            ? "Checking profile..."
                            : "Post a Job"}
                    </button>

                </section>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="error-message">

                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={
                                fetchDashboard
                            }
                        >
                            Retry
                        </button>

                    </div>
                )}

                {/* =================================================
                    STATS
                ================================================= */}

                <section className="stats-grid">

                    {/* TOTAL JOBS */}

                    <div className="stat-card">

                        <div className="stat-icon jobs-icon">
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                />

                                <path d="M8 4V2h8v2" />
                                <path d="M8 12h8" />
                                <path d="M8 16h5" />
                            </svg>
                        </div>

                        <div className="stat-content">

                            <span>
                                Total Jobs
                            </span>

                            <strong>
                                {
                                    dashboard.total_jobs
                                }
                            </strong>

                        </div>

                    </div>

                    {/* ACTIVE JOBS */}

                    <div className="stat-card">

                        <div className="stat-icon active-icon">
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                />

                                <path d="m8 12 2.5 2.5L16 9" />
                            </svg>
                        </div>

                        <div className="stat-content">

                            <span>
                                Active Jobs
                            </span>

                            <strong>
                                {
                                    dashboard.active_jobs
                                }
                            </strong>

                        </div>

                    </div>

                    {/* APPLICATIONS */}

                    <div className="stat-card">

                        <div className="stat-icon application-icon">
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                                <circle
                                    cx="9"
                                    cy="7"
                                    r="4"
                                />

                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>

                        <div className="stat-content">

                            <span>
                                Applications
                            </span>

                            <strong>
                                {
                                    dashboard.total_applications
                                }
                            </strong>

                        </div>

                    </div>

                    {/* HIRED */}

                    <div className="stat-card">

                        <div className="stat-icon hired-icon">
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />

                                <path d="M7 7h10" />
                                <path d="M9 13h6" />
                                <path d="M12 10v6" />
                            </svg>
                        </div>

                        <div className="stat-content">

                            <span>
                                Hired
                            </span>

                            <strong>
                                {
                                    dashboard.hired_candidates
                                }
                            </strong>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    CANDIDATE + JOB MANAGEMENT
                ================================================= */}

                <section className="dashboard-grid">

                    {/* =================================================
                        CANDIDATE OVERVIEW
                    ================================================= */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Candidate Overview
                                </h3>

                                <p>
                                    Recent candidate
                                    activity
                                </p>

                            </div>

                        </div>

                        <div className="candidate-list">

                            {dashboard.applications.length >
                                0 ? (
                                dashboard.applications
                                    .slice(0, 5)
                                    .map(
                                        (
                                            application,
                                            index
                                        ) => {
                                            const candidate =
                                                application.candidate ||
                                                application.applicant ||
                                                application.user ||
                                                {};

                                            const candidateName =
                                                application.candidate_name ||
                                                application.applicant_name ||
                                                application.name ||
                                                application.user_name ||
                                                candidate.full_name ||
                                                candidate.name ||
                                                candidate.username ||
                                                "Candidate";

                                            const job =
                                                application.job ||
                                                {};

                                            const jobTitle =
                                                application.job_title ||
                                                application.position ||
                                                job.title ||
                                                job.job_title ||
                                                "Job application";

                                            const status =
                                                application.status ||
                                                application.application_status ||
                                                "Applied";

                                            return (
                                                <div
                                                    className="candidate-item"
                                                    key={
                                                        application.id ||
                                                        index
                                                    }
                                                >

                                                    <div className="candidate-avatar">
                                                        {candidateName
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="candidate-info">

                                                        <strong>
                                                            {
                                                                candidateName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                jobTitle
                                                            }
                                                        </span>

                                                    </div>

                                                    <span
                                                        className={`status-badge ${String(
                                                            status
                                                        )
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                "-"
                                                            )}`}
                                                    >
                                                        {
                                                            status
                                                        }
                                                    </span>

                                                </div>
                                            );
                                        }
                                    )
                            ) : (
                                <div className="card-empty">

                                    <div className="empty-icon">

                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                                            <circle
                                                cx="9"
                                                cy="7"
                                                r="4"
                                            />

                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>

                                    </div>

                                    <strong>
                                        No applications yet
                                    </strong>

                                    <span>
                                        Applications will
                                        appear here when
                                        candidates apply
                                        to your jobs.
                                    </span>

                                </div>
                            )}

                        </div>

                    </div>

                    {/* =================================================
                        JOB MANAGEMENT
                    ================================================= */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Job Management
                                </h3>

                                <p>
                                    Manage your posted
                                    jobs
                                </p>

                            </div>

                            <button
                                type="button"
                                className="text-button"
                                onClick={() =>
                                    navigate(
                                        "/employer/jobs"
                                    )
                                }
                            >
                                View all
                            </button>

                        </div>

                        <div className="job-list">

                            {dashboard.jobs.length >
                                0 ? (
                                dashboard.jobs
                                    .slice(0, 5)
                                    .map(
                                        (
                                            job,
                                            index
                                        ) => {
                                            const active =
                                                isJobActive(
                                                    job
                                                );

                                            return (
                                                <div
                                                    className="job-item"
                                                    key={
                                                        job.id ||
                                                        index
                                                    }
                                                >

                                                    <div className="job-icon">

                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.7"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <rect
                                                                x="3"
                                                                y="4"
                                                                width="18"
                                                                height="16"
                                                                rx="2"
                                                            />

                                                            <path d="M8 4V2h8v2" />
                                                            <path d="M8 12h8" />
                                                            <path d="M8 16h5" />
                                                        </svg>

                                                    </div>

                                                    <div className="job-info">

                                                        <strong>
                                                            {job.title ||
                                                                job.job_title ||
                                                                "Untitled Job"}
                                                        </strong>

                                                        <span>
                                                            {job.location ||
                                                                job.city ||
                                                                "Location not specified"}
                                                        </span>

                                                    </div>

                                                    <div className="job-status">

                                                        <span
                                                            className={`job-status-dot ${
                                                                active
                                                                    ? "active"
                                                                    : "closed"
                                                            }`}
                                                        ></span>

                                                        {active
                                                            ? "Active"
                                                            : "Closed"}
                                                    </div>

                                                </div>
                                            );
                                        }
                                    )
                            ) : (
                                <div className="card-empty">

                                    <div className="empty-icon">

                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="3"
                                                y="4"
                                                width="18"
                                                height="16"
                                                rx="2"
                                            />

                                            <path d="M8 4V2h8v2" />
                                            <path d="M8 12h8" />
                                        </svg>

                                    </div>

                                    <strong>
                                        No jobs posted
                                    </strong>

                                    <span>
                                        Start by posting
                                        your first job.
                                    </span>

                                    <button
                                        type="button"
                                        className="small-primary-button"
                                        onClick={
                                            handlePostJob
                                        }
                                        disabled={
                                            postingCheckLoading
                                        }
                                    >
                                        {postingCheckLoading
                                            ? "Checking..."
                                            : "Post a Job"}
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>

                </section>

                {/* =================================================
                    QUICK ACCESS
                ================================================= */}

                <section className="quick-section">

                    <div className="section-title">

                        <h3>
                            Quick Access
                        </h3>

                        <p>
                            Frequently used employer
                            tools
                        </p>

                    </div>

                    <div className="quick-grid">

                        {/* =================================================
                            POST A JOB
                        ================================================= */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={
                                handlePostJob
                            }
                            disabled={
                                postingCheckLoading
                            }
                        >

                            <div className="quick-icon">

                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />

                                    <path d="M8 4V2h8v2" />
                                    <path d="M12 9v6" />
                                    <path d="M9 12h6" />
                                </svg>

                            </div>

                            <div>

                                <strong>
                                    Post a Job
                                </strong>

                                <span>
                                    {postingCheckLoading
                                        ? "Checking profile..."
                                        : "Create a new job posting"}
                                </span>

                            </div>

                            <span className="quick-arrow">
                                →
                            </span>

                        </button>

                        {/* =================================================
                            MANAGE JOBS
                        ================================================= */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={() =>
                                navigate(
                                    "/employer/jobs"
                                )
                            }
                        >

                            <div className="quick-icon">

                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />

                                    <path d="M8 4V2h8v2" />
                                    <path d="M8 12h8" />
                                    <path d="M8 16h5" />
                                </svg>

                            </div>

                            <div>

                                <strong>
                                    Manage Jobs
                                </strong>

                                <span>
                                    Manage your job
                                    postings
                                </span>

                            </div>

                            <span className="quick-arrow">
                                →
                            </span>

                        </button>

                        {/* =================================================
                            COMPANY PROFILE
                        ================================================= */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={() =>
                                navigate(
                                    "/employer/profile"
                                )
                            }
                        >

                            <div className="quick-icon">

                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                    />

                                    <path d="M8 7h8" />
                                    <path d="M8 11h8" />
                                    <path d="M8 15h5" />
                                </svg>

                            </div>

                            <div>

                                <strong>
                                    Company Profile
                                </strong>

                                <span>
                                    Update company
                                    information
                                </span>

                            </div>

                            <span className="quick-arrow">
                                →
                            </span>

                        </button>

                        {/* =================================================
                            MESSAGES
                        ================================================= */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={
                                handleMessagesOpen
                            }
                        >

                            <div className="quick-icon">

                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />

                                    <path d="M8 12h.01" />
                                    <path d="M12 12h.01" />
                                    <path d="M16 12h.01" />
                                </svg>

                            </div>

                            <div>

                                <strong>
                                    Messages
                                </strong>

                                <span>
                                    Chat with candidates
                                </span>

                            </div>

                            <span className="quick-arrow">
                                →
                            </span>

                        </button>

                    </div>

                </section>

            </main>

            {/* =========================================================
                POPUP MODAL ALERT
            ========================================================= */}

            {popup.show && (
                <div
                    className="employer-popup-overlay"
                    onClick={closePopup}
                >
                    <div
                        className="employer-popup"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employer-popup-title"
                    >
                        <button
                            type="button"
                            className="employer-popup-close"
                            onClick={closePopup}
                            aria-label="Close popup"
                        >
                            ×
                        </button>

                        <div
                            className={`employer-popup-icon ${
                                popup.type === "error"
                                    ? "popup-error"
                                    : "popup-warning"
                            }`}
                        >
                            {popup.type === "error"
                                ? "!"
                                : "⚠"}
                        </div>

                        <h2 id="employer-popup-title">
                            {popup.title}
                        </h2>

                        <p>
                            {popup.message}
                        </p>

                        <div className="employer-popup-actions">
                            {popup.action ? (
                                <>
                                    <button
                                        type="button"
                                        className="popup-secondary-button"
                                        onClick={closePopup}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="popup-primary-button"
                                        onClick={
                                            popup.action
                                        }
                                    >
                                        {popup.title ===
                                        "Complete Your Profile"
                                            ? "Complete Profile"
                                            : popup.title ===
                                                "Profile Rejected"
                                            ? "Update Profile"
                                            : "Login"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="popup-primary-button"
                                    onClick={closePopup}
                                >
                                    Okay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                PAGE STYLES
            ========================================================= */}

            <style>{`
                .employer-dashboard {
                    min-height: 100vh;
                    background: #f7f9fc;
                    color: #172033;
                    font-family: Arial, sans-serif;
                }

                .dashboard-header {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    min-height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 30px;
                    background: #ffffff;
                    border-bottom: 1px solid #e8edf4;
                    box-sizing: border-box;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .brand-mark {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 11px;
                    background: #2563eb;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                }

                .brand-info h1 {
                    margin: 0;
                    font-size: 18px;
                    line-height: 1.2;
                }

                .brand-info p {
                    margin: 4px 0 0;
                    color: #64748b;
                    font-size: 12px;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                }

                .chat-header-button,
                .notification-button,
                .help-header-button {
                    position: relative;
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #2563eb;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        transform 0.2s ease;
                }

                .chat-header-button:hover,
                .notification-button:hover,
                .help-header-button:hover {
                    background: #eff6ff;
                    border-color: #bfdbfe;
                    transform: translateY(-1px);
                }

                .chat-header-button svg,
                .notification-button svg,
                .help-header-button svg {
                    display: block;
                }

                .notification-wrapper {
                    position: relative;
                }

                .notification-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #ef4444;
                    border: 2px solid #ffffff;
                }

                .notification-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 390px;
                    max-width: calc(100vw - 30px);
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.15);
                    overflow: hidden;
                    z-index: 500;
                }

                .notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 16px;
                    border-bottom: 1px solid #edf1f5;
                }

                .notification-header h3 {
                    margin: 0;
                    font-size: 15px;
                }

                .notification-header span {
                    display: block;
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 12px;
                }

                .mark-all-button {
                    border: 0;
                    background: transparent;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .notification-list {
                    max-height: 430px;
                    overflow-y: auto;
                }

                .notification-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 14px 42px 14px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .notification-item:hover {
                    background: #f8fafc;
                }

                .notification-item.unread {
                    background: #eff6ff;
                }

                .notification-icon {
                    flex: 0 0 auto;
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: #dbeafe;
                    color: #2563eb;
                }

                .notification-content {
                    min-width: 0;
                    flex: 1;
                }

                .notification-content strong {
                    display: block;
                    color: #172033;
                    font-size: 13px;
                }

                .notification-content p {
                    margin: 5px 0 0;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.45;
                    word-break: break-word;
                }

                .notification-content small {
                    display: block;
                    margin-top: 6px;
                    color: #94a3b8;
                    font-size: 10px;
                }

                .delete-notification {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    border: 0;
                    background: transparent;
                    color: #94a3b8;
                    font-size: 20px;
                    line-height: 20px;
                    cursor: pointer;
                }

                .delete-notification:hover {
                    color: #ef4444;
                }

                .notification-empty {
                    min-height: 170px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    padding: 20px;
                    color: #64748b;
                    text-align: center;
                }

                .notification-empty strong {
                    color: #334155;
                    font-size: 13px;
                }

                .notification-empty span {
                    font-size: 12px;
                }

                .empty-bell {
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: #94a3b8;
                }

                .notification-footer {
                    padding: 11px;
                    border-top: 1px solid #edf1f5;
                    text-align: center;
                }

                .notification-footer button {
                    border: 0;
                    background: transparent;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .dashboard-content {
                    width: 100%;
                    max-width: 1440px;
                    margin: 0 auto;
                    padding: 30px;
                    box-sizing: border-box;
                }

                .welcome-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 26px;
                }

                .welcome-label {
                    margin: 0 0 5px;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                }

                .welcome-section h2 {
                    margin: 0;
                    color: #172033;
                    font-size: 29px;
                    line-height: 1.2;
                }

                .welcome-description {
                    margin: 8px 0 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .primary-button,
                .small-primary-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border: 0;
                    border-radius: 10px;
                    background: #2563eb;
                    color: #ffffff;
                    font-weight: 700;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        transform 0.2s ease;
                }

                .primary-button {
                    min-height: 44px;
                    padding: 0 18px;
                    white-space: nowrap;
                }

                .primary-button span {
                    font-size: 20px;
                    line-height: 1;
                }

                .small-primary-button {
                    min-height: 36px;
                    padding: 0 13px;
                    font-size: 12px;
                }

                .primary-button:hover:not(:disabled),
                .small-primary-button:hover:not(:disabled) {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .primary-button:disabled,
                .small-primary-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .error-message {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding: 13px 15px;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    background: #fef2f2;
                    color: #b91c1c;
                    font-size: 13px;
                }

                .error-message button {
                    border: 0;
                    background: transparent;
                    color: #b91c1c;
                    font-weight: 700;
                    cursor: pointer;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 22px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    min-height: 96px;
                    padding: 17px;
                    box-sizing: border-box;
                    background: #ffffff;
                    border: 1px solid #e8edf4;
                    border-radius: 13px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
                }

                .stat-icon {
                    width: 46px;
                    height: 46px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 11px;
                }

                .jobs-icon {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .active-icon {
                    background: #ecfdf5;
                    color: #059669;
                }

                .application-icon {
                    background: #f5f3ff;
                    color: #7c3aed;
                }

                .hired-icon {
                    background: #fffbeb;
                    color: #d97706;
                }

                .stat-content {
                    min-width: 0;
                }

                .stat-content span {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                }

                .stat-content strong {
                    display: block;
                    margin-top: 5px;
                    color: #172033;
                    font-size: 25px;
                    line-height: 1;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                    margin-bottom: 28px;
                }

                .dashboard-card {
                    min-width: 0;
                    background: #ffffff;
                    border: 1px solid #e8edf4;
                    border-radius: 14px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
                    overflow: hidden;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 18px 19px;
                    border-bottom: 1px solid #edf1f5;
                }

                .card-header h3 {
                    margin: 0;
                    color: #172033;
                    font-size: 15px;
                }

                .card-header p {
                    margin: 5px 0 0;
                    color: #64748b;
                    font-size: 11px;
                }

                .text-button {
                    border: 0;
                    background: transparent;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .candidate-list,
                .job-list {
                    min-height: 250px;
                }

                .candidate-item,
                .job-item {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 14px 18px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .candidate-item:last-child,
                .job-item:last-child {
                    border-bottom: 0;
                }

                .candidate-avatar {
                    width: 36px;
                    height: 36px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #dbeafe;
                    color: #1d4ed8;
                    font-size: 13px;
                    font-weight: 800;
                }

                .candidate-info,
                .job-info {
                    min-width: 0;
                    flex: 1;
                }

                .candidate-info strong,
                .job-info strong {
                    display: block;
                    overflow: hidden;
                    color: #172033;
                    font-size: 13px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .candidate-info span,
                .job-info span {
                    display: block;
                    margin-top: 4px;
                    overflow: hidden;
                    color: #64748b;
                    font-size: 11px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .status-badge {
                    flex: 0 0 auto;
                    padding: 5px 8px;
                    border-radius: 999px;
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: capitalize;
                }

                .status-badge.hired {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-badge.rejected {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .status-badge.shortlisted {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .status-badge.interview-scheduled {
                    background: #f3e8ff;
                    color: #7e22ce;
                }

                .job-icon {
                    width: 38px;
                    height: 38px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: #f1f5f9;
                    color: #475569;
                }

                .job-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex: 0 0 auto;
                    color: #64748b;
                    font-size: 11px;
                }

                .job-status-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                }

                .job-status-dot.active {
                    background: #22c55e;
                }

                .job-status-dot.closed {
                    background: #94a3b8;
                }

                .card-empty {
                    min-height: 250px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px;
                    box-sizing: border-box;
                    text-align: center;
                }

                .empty-icon {
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 11px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: #94a3b8;
                }

                .card-empty strong {
                    color: #334155;
                    font-size: 13px;
                }

                .card-empty > span {
                    max-width: 300px;
                    margin-top: 6px;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.5;
                }

                .card-empty .small-primary-button {
                    margin-top: 13px;
                }

                .quick-section {
                    margin-bottom: 30px;
                }

                .section-title {
                    margin-bottom: 14px;
                }

                .section-title h3 {
                    margin: 0;
                    color: #172033;
                    font-size: 17px;
                }

                .section-title p {
                    margin: 5px 0 0;
                    color: #64748b;
                    font-size: 12px;
                }

                .quick-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 14px;
                }

                .quick-card {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 1px solid #e8edf4;
                    border-radius: 13px;
                    background: #ffffff;
                    color: #172033;
                    text-align: left;
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
                    transition:
                        border-color 0.2s ease,
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .quick-card:hover:not(:disabled) {
                    border-color: #bfdbfe;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
                }

                .quick-card:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .quick-icon {
                    width: 42px;
                    height: 42px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #eff6ff;
                    color: #2563eb;
                }

                .quick-card strong {
                    display: block;
                    color: #172033;
                    font-size: 13px;
                }

                .quick-card div:nth-child(2) {
                    min-width: 0;
                    flex: 1;
                }

                .quick-card div:nth-child(2) span {
                    display: block;
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 10px;
                    line-height: 1.4;
                }

                .quick-arrow {
                    flex: 0 0 auto;
                    color: #94a3b8;
                    font-size: 18px;
                }

                .employer-popup-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.45);
                    box-sizing: border-box;
                }

                .employer-popup {
                    position: relative;
                    width: 100%;
                    max-width: 430px;
                    padding: 28px;
                    box-sizing: border-box;
                    border-radius: 16px;
                    background: #ffffff;
                    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.22);
                    text-align: center;
                }

                .employer-popup-close {
                    position: absolute;
                    top: 10px;
                    right: 12px;
                    width: 32px;
                    height: 32px;
                    border: 0;
                    background: transparent;
                    color: #94a3b8;
                    font-size: 24px;
                    cursor: pointer;
                }

                .employer-popup-icon {
                    width: 54px;
                    height: 54px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    border-radius: 50%;
                    font-size: 24px;
                    font-weight: 800;
                }

                .popup-warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .popup-error {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .employer-popup h2 {
                    margin: 0;
                    color: #172033;
                    font-size: 19px;
                }

                .employer-popup p {
                    margin: 10px 0 0;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .employer-popup-actions {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 22px;
                }

                .popup-primary-button,
                .popup-secondary-button {
                    min-height: 40px;
                    padding: 0 16px;
                    border-radius: 9px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .popup-primary-button {
                    border: 0;
                    background: #2563eb;
                    color: #ffffff;
                }

                .popup-secondary-button {
                    border: 1px solid #dbe2ea;
                    background: #ffffff;
                    color: #475569;
                }

                @media (max-width: 1050px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .quick-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 800px) {
                    .dashboard-header {
                        padding: 0 18px;
                    }

                    .dashboard-content {
                        padding: 22px 18px;
                    }

                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }

                    .welcome-section {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .primary-button {
                        width: 100%;
                    }
                }

                @media (max-width: 560px) {
                    .brand-info h1 {
                        font-size: 15px;
                    }

                    .brand-info p {
                        font-size: 10px;
                    }

                    .brand-mark {
                        width: 38px;
                        height: 38px;
                    }

                    .chat-header-button,
                    .notification-button,
                    .help-header-button {
                        width: 38px;
                        height: 38px;
                    }

                    .header-actions {
                        gap: 5px;
                    }

                    .notification-dropdown {
                        position: fixed;
                        top: 67px;
                        right: 12px;
                        left: 12px;
                        width: auto;
                        max-width: none;
                    }

                    .stats-grid,
                    .quick-grid {
                        grid-template-columns: 1fr;
                    }

                    .dashboard-content {
                        padding: 18px 13px;
                    }

                    .welcome-section h2 {
                        font-size: 24px;
                    }

                    .candidate-item,
                    .job-item {
                        padding-left: 13px;
                        padding-right: 13px;
                    }

                    .status-badge {
                        font-size: 9px;
                    }
                }
            `}</style>
        </div>
    );
}

export default EmployerDashboard;