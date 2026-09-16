import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

/* =====================================================
   API CONFIGURATION
===================================================== */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

const JOBSEEKER_API = `${API_BASE}/auth/jobseeker`;

/* =====================================================
   TOKEN
===================================================== */

const getToken = () => {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token")
    );
};

/* =====================================================
   COMPONENT
===================================================== */

function JobSeekerDashboard() {
    const navigate = useNavigate();

    /* =====================================================
       STATE
    ===================================================== */

    const [dashboard, setDashboard] = useState({});
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [chatConversations, setChatConversations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [applicationsLoading, setApplicationsLoading] =
        useState(false);
    const [notificationsLoading, setNotificationsLoading] =
        useState(false);
    const [chatLoading, setChatLoading] = useState(false);

    const [notificationOpen, setNotificationOpen] =
        useState(false);

    const [error, setError] = useState("");

    const notificationRef = useRef(null);

    /* =====================================================
       API REQUEST HELPER
    ===================================================== */

    const apiRequest = async (url, options = {}) => {
        const token = getToken();

        const headers = {
            ...(options.headers || {}),
        };

        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem("jc_token");
            localStorage.removeItem("access");
            localStorage.removeItem("access_token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");

            navigate("/login");

            throw new Error("Session expired.");
        }

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.detail ||
                    data?.message ||
                    "Something went wrong while processing the request."
            );
        }

        return data;
    };

    /* =====================================================
       DASHBOARD
       
       IMPORTANT:
       There is NO /dashboard/ endpoint in the backend.
       Dashboard statistics are calculated from the
       applications data fetched below.
    ===================================================== */

    const fetchDashboard = async () => {
        setDashboard({});
    };

    /* =====================================================
       FETCH APPLICATIONS
    ===================================================== */

    const fetchApplications = async () => {
        try {
            setApplicationsLoading(true);

            const data = await apiRequest(
                `${JOBSEEKER_API}/applications/`
            );

            let result = [];

            if (Array.isArray(data)) {
                result = data;
            } else if (Array.isArray(data?.results)) {
                result = data.results;
            } else if (Array.isArray(data?.applications)) {
                result = data.applications;
            } else if (Array.isArray(data?.data)) {
                result = data.data;
            }

            setApplications(result);
        } catch (err) {
            console.error(
                "Applications fetch error:",
                err
            );

            setApplications([]);
        } finally {
            setApplicationsLoading(false);
        }
    };

    /* =====================================================
       FETCH NOTIFICATIONS
    ===================================================== */

    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);

            const data = await apiRequest(
                `${JOBSEEKER_API}/notifications/`
            );

            let result = [];

            if (Array.isArray(data)) {
                result = data;
            } else if (Array.isArray(data?.results)) {
                result = data.results;
            } else if (
                Array.isArray(data?.notifications)
            ) {
                result = data.notifications;
            } else if (Array.isArray(data?.data)) {
                result = data.data;
            }

            setNotifications(result);
        } catch (err) {
            console.error(
                "Notifications fetch error:",
                err
            );

            setNotifications([]);
        } finally {
            setNotificationsLoading(false);
        }
    };

    /* =====================================================
       FETCH CHAT CONVERSATIONS
    ===================================================== */

    const fetchChatConversations = async () => {
        try {
            setChatLoading(true);

            const data = await apiRequest(
                `${JOBSEEKER_API}/chat/conversations/`
            );

            let result = [];

            if (Array.isArray(data)) {
                result = data;
            } else if (Array.isArray(data?.results)) {
                result = data.results;
            } else if (
                Array.isArray(data?.conversations)
            ) {
                result = data.conversations;
            } else if (Array.isArray(data?.data)) {
                result = data.data;
            }

            setChatConversations(result);
        } catch (err) {
            console.error(
                "Chat conversations fetch error:",
                err
            );

            setChatConversations([]);
        } finally {
            setChatLoading(false);
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        const loadDashboard = async () => {
            setLoading(true);
            setError("");

            try {
                /*
                 * There is intentionally NO fetchDashboard()
                 * API request here because the backend does not
                 * provide /auth/jobseeker/dashboard/.
                 *
                 * All dashboard statistics are calculated from
                 * the applications already fetched here.
                 */
                await Promise.all([
                    fetchApplications(),
                    fetchNotifications(),
                    fetchChatConversations(),
                ]);
            } catch (err) {
                console.error(err);

                if (mounted) {
                    setError(
                        "Unable to load dashboard."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    /* =====================================================
       REFRESH NOTIFICATIONS
    ===================================================== */

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    /* =====================================================
       REFRESH CHAT
    ===================================================== */

    useEffect(() => {
        const interval = setInterval(() => {
            fetchChatConversations();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    /* =====================================================
       CLOSE NOTIFICATION DROPDOWN
    ===================================================== */

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target
                )
            ) {
                setNotificationOpen(false);
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

    /* =====================================================
       NOTIFICATION VALUES
    ===================================================== */

    const unreadNotifications = useMemo(() => {
        return notifications.filter(
            (notification) =>
                !notification.is_read
        );
    }, [notifications]);

    const unreadNotificationCount =
        unreadNotifications.length;

    /* =====================================================
       CHAT VALUES
    ===================================================== */

    const getChatUnreadCount = (conversation) => {
        return Number(
            conversation?.unread_count ||
                conversation?.unread_messages ||
                0
        );
    };

    const totalChatUnreadCount = useMemo(() => {
        return chatConversations.reduce(
            (total, conversation) =>
                total +
                getChatUnreadCount(conversation),
            0
        );
    }, [chatConversations]);

    /* =====================================================
       NOTIFICATION HELPERS
    ===================================================== */

    const markNotificationRead = async (
        notification
    ) => {
        if (
            !notification?.id ||
            notification.is_read
        ) {
            return;
        }

        try {
            await apiRequest(
                `${JOBSEEKER_API}/notifications/${notification.id}/read/`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        is_read: true,
                    }),
                }
            );

            setNotifications((previous) =>
                previous.map((item) =>
                    item.id === notification.id
                        ? {
                              ...item,
                              is_read: true,
                          }
                        : item
                )
            );
        } catch (err) {
            console.error(
                "Mark notification read error:",
                err
            );
        }
    };

    const markAllNotificationsRead = async () => {
        if (unreadNotifications.length === 0) {
            return;
        }

        try {
            await Promise.all(
                unreadNotifications.map(
                    (notification) =>
                        apiRequest(
                            `${JOBSEEKER_API}/notifications/${notification.id}/read/`,
                            {
                                method: "PATCH",
                                body: JSON.stringify({
                                    is_read: true,
                                }),
                            }
                        )
                )
            );

            setNotifications((previous) =>
                previous.map((item) => ({
                    ...item,
                    is_read: true,
                }))
            );
        } catch (err) {
            console.error(
                "Mark all notifications read error:",
                err
            );
        }
    };

    const deleteNotification = async (
        notificationId
    ) => {
        if (!notificationId) {
            return;
        }

        try {
            await apiRequest(
                `${JOBSEEKER_API}/notifications/${notificationId}/`,
                {
                    method: "DELETE",
                }
            );

            setNotifications((previous) =>
                previous.filter(
                    (item) =>
                        item.id !== notificationId
                )
            );
        } catch (err) {
            console.error(
                "Delete notification error:",
                err
            );
        }
    };

    const clearAllNotifications = async () => {
        if (notifications.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete all notifications?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await Promise.all(
                notifications.map(
                    async (notification) => {
                        if (!notification?.id) {
                            return;
                        }

                        try {
                            await apiRequest(
                                `${JOBSEEKER_API}/notifications/${notification.id}/`,
                                {
                                    method: "DELETE",
                                }
                            );
                        } catch (err) {
                            console.error(
                                "Unable to delete notification:",
                                err
                            );
                        }
                    }
                )
            );

            setNotifications([]);
            setNotificationOpen(false);
        } catch (err) {
            console.error(
                "Clear notifications error:",
                err
            );
        }
    };

    /* =====================================================
       APPLICATION HELPERS
    ===================================================== */

    const getApplicationStatus = (
        application
    ) => {
        return String(
            application?.status ||
                application?.application_status ||
                "APPLIED"
        )
            .trim()
            .toLowerCase();
    };

    const formatStatus = (status) => {
        if (!status) {
            return "Applied";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getJobTitle = (application) => {
        return (
            application?.job_title ||
            application?.job?.title ||
            application?.job?.job_title ||
            application?.job?.name ||
            application?.title ||
            "Job Application"
        );
    };

    const getCompanyName = (application) => {
        return (
            application?.company_name ||
            application?.job?.company_name ||
            application?.job?.company?.name ||
            application?.company?.name ||
            application?.company ||
            "Company"
        );
    };

    /* =====================================================
       DATE FORMAT
    ===================================================== */

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatNotificationDate = (
        dateValue
    ) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    /* =====================================================
       RECENT APPLICATIONS
    ===================================================== */

    const recentApplications = useMemo(() => {
        return [...applications]
            .sort((a, b) => {
                const dateA = new Date(
                    a?.applied_at ||
                        a?.created_at ||
                        a?.updated_at ||
                        0
                ).getTime();

                const dateB = new Date(
                    b?.applied_at ||
                        b?.created_at ||
                        b?.updated_at ||
                        0
                ).getTime();

                return dateB - dateA;
            })
            .slice(0, 5);
    }, [applications]);

    /* =====================================================
       STAT VALUES
    ===================================================== */

    const totalApplications =
        dashboard?.total_applications ??
        dashboard?.applications_count ??
        applications.length;

    const shortlistedApplications =
        dashboard?.shortlisted_applications ??
        dashboard?.shortlisted_count ??
        applications.filter((application) => {
            const status =
                getApplicationStatus(
                    application
                );

            return (
                status === "shortlisted" ||
                status === "shortlist"
            );
        }).length;

    const activeApplications =
        dashboard?.active_applications ??
        dashboard?.active_count ??
        applications.filter((application) => {
            const status =
                getApplicationStatus(
                    application
                );

            return (
                status === "pending" ||
                status === "applied" ||
                status === "under review" ||
                status === "under_review" ||
                status === "in review" ||
                status === "review"
            );
        }).length;

    const hiredApplications =
        dashboard?.hired_applications ??
        dashboard?.hired_count ??
        applications.filter(
            (application) =>
                getApplicationStatus(
                    application
                ) === "hired"
        ).length;

    /* =====================================================
       PERFORMANCE
    ===================================================== */

    const performanceValue =
        dashboard?.performance ??
        dashboard?.profile_score ??
        dashboard?.profile_completion ??
        0;

    const safePerformance = Math.min(
        100,
        Math.max(
            0,
            Number(performanceValue) || 0
        )
    );

    /* =====================================================
       CHAT HELPERS
    ===================================================== */

    const getConversationName = (
        conversation
    ) => {
        return (
            conversation?.employer_name ||
            conversation?.company_name ||
            conversation?.name ||
            conversation?.other_user_name ||
            "Employer"
        );
    };

    const getConversationMessage = (
        conversation
    ) => {
        return (
            conversation?.last_message ||
            conversation?.last_message_text ||
            conversation?.message ||
            "No messages yet."
        );
    };

    const getConversationDate = (
        conversation
    ) => {
        return (
            conversation?.last_message_at ||
            conversation?.updated_at ||
            conversation?.created_at
        );
    };

    /* =====================================================
       OPEN CHAT
    ===================================================== */

    const handleChatOpen = () => {
        setNotificationOpen(false);
        navigate("/jobseeker/messages");
    };

    const openChat = (conversation) => {
        setNotificationOpen(false);

        if (conversation?.id) {
            navigate(
                `/jobseeker/messages/${conversation.id}`
            );
            return;
        }

        navigate("/jobseeker/messages");
    };

    /* =====================================================
       HELP
    ===================================================== */

    const openHelp = () => {
        setNotificationOpen(false);
        navigate("/help-support");
    };

    /* =====================================================
       NOTIFICATION TOGGLE
    ===================================================== */

    const handleNotificationToggle = () => {
        setNotificationOpen(
            (current) => !current
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>{`
                    .dashboard-loading-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f7f7f7;
                        font-family:
                            Inter,
                            -apple-system,
                            BlinkMacSystemFont,
                            "Segoe UI",
                            sans-serif;
                    }

                    .dashboard-loading-box {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                    }

                    .loading-spinner {
                        width: 24px;
                        height: 24px;
                        border: 2px solid #e5e5e5;
                        border-top-color: #111;
                        border-radius: 50%;
                        animation: dashboard-spin 0.7s linear infinite;
                    }

                    @keyframes dashboard-spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    .dashboard-loading-box span {
                        color: #999;
                        font-size: 10px;
                    }
                `}</style>

                <div className="dashboard-loading-page">
                    <div className="dashboard-loading-box">
                        <div className="loading-spinner" />

                        <span>
                            Loading dashboard...
                        </span>
                    </div>
                </div>
            </>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <>
            <Sidebar />

            <div className="dashboard-page">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="dashboard-header">

                    <div>
                        <div className="eyebrow">
                            JOBSEEKER
                        </div>

                        <h1>
                            Dashboard
                        </h1>

                        <p className="header-subtitle">
                            Track your job applications and
                            discover new opportunities.
                        </p>
                    </div>

                    {/* =================================================
                        HEADER ACTIONS
                    ================================================= */}

                    <div className="header-actions">

                        {/* CHAT */}

                        <button
                            type="button"
                            className="chat-header-button"
                            onClick={handleChatOpen}
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

                            {totalChatUnreadCount > 0 && (
                                <span className="chat-header-badge">
                                    {totalChatUnreadCount > 99
                                        ? "99+"
                                        : totalChatUnreadCount}
                                </span>
                            )}
                        </button>

                        {/* NOTIFICATION */}

                        <div
                            className="notification-wrapper"
                            ref={notificationRef}
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
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                    <path d="M10 21h4" />
                                </svg>

                                {unreadNotificationCount >
                                    0 && (
                                    <span className="notification-badge">
                                        {unreadNotificationCount >
                                        99
                                            ? "99+"
                                            : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {notificationOpen && (
                                <div className="notification-dropdown">

                                    <div className="notification-header">

                                        <div>
                                            <strong>
                                                Notifications
                                            </strong>

                                            <span>
                                                {unreadNotificationCount >
                                                0
                                                    ? `${unreadNotificationCount} unread`
                                                    : "All caught up"}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="notification-close"
                                            onClick={() =>
                                                setNotificationOpen(
                                                    false
                                                )
                                            }
                                            aria-label="Close notifications"
                                        >
                                            ×
                                        </button>

                                    </div>

                                    <div className="notification-actions">

                                        {unreadNotificationCount >
                                            0 && (
                                            <button
                                                type="button"
                                                onClick={
                                                    markAllNotificationsRead
                                                }
                                            >
                                                Mark all as read
                                            </button>
                                        )}

                                        {notifications.length >
                                            0 && (
                                            <button
                                                type="button"
                                                onClick={
                                                    clearAllNotifications
                                                }
                                            >
                                                Clear all
                                            </button>
                                        )}

                                    </div>

                                    <div className="notification-list">

                                        {notificationsLoading ? (
                                            <div className="notification-empty">
                                                <div className="loading-spinner" />

                                                <p>
                                                    Loading
                                                    notifications...
                                                </p>
                                            </div>
                                        ) : notifications.length ===
                                          0 ? (
                                            <div className="notification-empty">

                                                <div className="empty-bell">
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
                                                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                                        <path d="M10 21h4" />
                                                    </svg>
                                                </div>

                                                <p>
                                                    No notifications
                                                </p>

                                                <span>
                                                    New updates will
                                                    appear here.
                                                </span>

                                            </div>
                                        ) : (
                                            notifications.map(
                                                (
                                                    notification
                                                ) => (
                                                    <div
                                                        key={
                                                            notification.id
                                                        }
                                                        className={`notification-item ${
                                                            !notification.is_read
                                                                ? "unread"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            markNotificationRead(
                                                                notification
                                                            )
                                                        }
                                                    >

                                                        <div className="notification-icon">
                                                            <svg
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.8"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                                                <path d="M10 21h4" />
                                                            </svg>
                                                        </div>

                                                        <div className="notification-content">

                                                            <div className="notification-title-row">
                                                                <strong>
                                                                    {
                                                                        notification.title
                                                                    }
                                                                </strong>

                                                                {!notification.is_read && (
                                                                    <span className="unread-dot" />
                                                                )}
                                                            </div>

                                                            <p>
                                                                {
                                                                    notification.message
                                                                }
                                                            </p>

                                                            <div className="notification-meta">

                                                                {notification.notification_type_display && (
                                                                    <span>
                                                                        {
                                                                            notification.notification_type_display
                                                                        }
                                                                    </span>
                                                                )}

                                                                {notification.created_at && (
                                                                    <span>
                                                                        {
                                                                            formatNotificationDate(
                                                                                notification.created_at
                                                                            )
                                                                        }
                                                                    </span>
                                                                )}

                                                            </div>

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
                                                            title="Delete notification"
                                                            aria-label="Delete notification"
                                                        >
                                                            ×
                                                        </button>

                                                    </div>
                                                )
                                            )
                                        )}

                                    </div>

                                </div>
                            )}
                        </div>

                        {/* HELP & SUPPORT */}

                        <button
                            type="button"
                            className="help-header-button"
                            onClick={openHelp}
                            aria-label="Help"
                            title="Help"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
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
                    ERROR
                ================================================= */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* =================================================
                    STATS
                ================================================= */}

                <section className="stats-grid">

                    {/* APPLICATIONS */}

                    <div className="stat-card">

                        <div className="stat-card-top">
                            <span>
                                Applications
                            </span>

                            <div className="stat-icon">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line
                                        x1="16"
                                        y1="13"
                                        x2="8"
                                        y2="13"
                                    />
                                    <line
                                        x1="16"
                                        y1="17"
                                        x2="8"
                                        y2="17"
                                    />
                                </svg>
                            </div>
                        </div>

                        <strong>
                            {applicationsLoading
                                ? "..."
                                : totalApplications}
                        </strong>

                        <small>
                            Total applications
                        </small>

                    </div>

                    {/* SHORTLISTED */}

                    <div className="stat-card">

                        <div className="stat-card-top">
                            <span>
                                Shortlisted
                            </span>

                            <div className="stat-icon">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                        </div>

                        <strong>
                            {applicationsLoading
                                ? "..."
                                : shortlistedApplications}
                        </strong>

                        <small>
                            Applications shortlisted
                        </small>

                    </div>

                    {/* ACTIVE */}

                    <div className="stat-card">

                        <div className="stat-card-top">
                            <span>
                                Active
                            </span>

                            <div className="stat-icon">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                    />

                                    <polyline points="12 7 12 12 15 14" />
                                </svg>
                            </div>
                        </div>

                        <strong>
                            {applicationsLoading
                                ? "..."
                                : activeApplications}
                        </strong>

                        <small>
                            Active applications
                        </small>

                    </div>

                    {/* HIRED */}

                    <div className="stat-card">

                        <div className="stat-card-top">
                            <span>
                                Hired
                            </span>

                            <div className="stat-icon">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                        </div>

                        <strong>
                            {applicationsLoading
                                ? "..."
                                : hiredApplications}
                        </strong>

                        <small>
                            Successful applications
                        </small>

                    </div>

                </section>

                {/* =================================================
                    MAIN GRID
                ================================================= */}

                <section className="dashboard-grid">

                    {/* =================================================
                        RECENT APPLICATIONS
                    ================================================= */}

                    <div className="dashboard-card applications-card">

                        <div className="card-header">

                            <div>
                                <h2>
                                    Recent Applications
                                </h2>

                                <p>
                                    Your latest job
                                    applications
                                </p>
                            </div>

                            <button
                                type="button"
                                className="view-all-button"
                                onClick={() =>
                                    navigate(
                                        "/jobseeker/applications"
                                    )
                                }
                            >
                                View all
                            </button>

                        </div>

                        {applicationsLoading ? (
                            <div className="card-empty">

                                <div className="loading-spinner" />

                                <p>
                                    Loading applications...
                                </p>

                            </div>
                        ) : recentApplications.length ===
                          0 ? (
                            <div className="card-empty">

                                <div className="empty-document">
                                    <svg
                                        width="30"
                                        height="30"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>

                                <p>
                                    No applications yet
                                </p>

                                <span>
                                    Start applying to jobs
                                    that match your skills.
                                </span>

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() =>
                                        navigate(
                                            "/jobseeker/jobs"
                                        )
                                    }
                                >
                                    Find Jobs
                                </button>

                            </div>
                        ) : (
                            <div className="application-list">

                                {recentApplications.map(
                                    (application) => (
                                        <div
                                            className="application-row"
                                            key={
                                                application.id
                                            }
                                        >

                                            <div className="application-main">

                                                <div className="company-avatar">
                                                    {getCompanyName(
                                                        application
                                                    )
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div>

                                                    <strong>
                                                        {getJobTitle(
                                                            application
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {getCompanyName(
                                                            application
                                                        )}
                                                    </span>

                                                    {(
                                                        application?.applied_at ||
                                                        application?.created_at
                                                    ) && (
                                                        <small>
                                                            {formatDate(
                                                                application?.applied_at ||
                                                                application?.created_at
                                                            )}
                                                        </small>
                                                    )}

                                                </div>

                                            </div>

                                            <div className="application-status">

                                                <span
                                                    className={`status-pill ${String(
                                                        getApplicationStatus(
                                                            application
                                                        )
                                                    )
                                                        .toLowerCase()
                                                        .replace(
                                                            /[\s_]+/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {formatStatus(
                                                        getApplicationStatus(
                                                            application
                                                        )
                                                    )}
                                                </span>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>

                    {/* =================================================
                        PERFORMANCE
                    ================================================= */}

                    <div className="dashboard-card performance-card">

                        <div className="card-header">

                            <div>
                                <h2>
                                    Performance
                                </h2>

                                <p>
                                    Application overview
                                </p>
                            </div>

                        </div>

                        <div className="performance-content">

                            <div
                                className="performance-circle"
                                style={{
                                    "--performance":
                                        `${safePerformance}%`,
                                }}
                            >
                                <div>
                                    <strong>
                                        {
                                            totalApplications
                                        }
                                    </strong>

                                    <span>
                                        Applications
                                    </span>
                                </div>
                            </div>

                            <div className="performance-stats">

                                <div>
                                    <span>
                                        Shortlisted
                                    </span>

                                    <strong>
                                        {
                                            shortlistedApplications
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Active
                                    </span>

                                    <strong>
                                        {
                                            activeApplications
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Hired
                                    </span>

                                    <strong>
                                        {
                                            hiredApplications
                                        }
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    QUICK ACCESS
                ================================================= */}

                <section className="quick-section">

                    <div className="section-heading">

                        <div>
                            <h2>
                                Quick Access
                            </h2>

                            <p>
                                Manage your job search
                            </p>
                        </div>

                    </div>

                    <div className="quick-grid">

                        {/* FIND JOBS */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/jobs"
                                )
                            }
                        >

                            <div className="quick-icon">
                                <svg
                                    width="21"
                                    height="21"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="7"
                                    />

                                    <line
                                        x1="20"
                                        y1="20"
                                        x2="16.65"
                                        y2="16.65"
                                    />
                                </svg>
                            </div>

                            <div>
                                <strong>
                                    Find Jobs
                                </strong>

                                <span>
                                    Browse available
                                    opportunities
                                </span>
                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </button>

                        {/* APPLICATIONS */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/applications"
                                )
                            }
                        >

                            <div className="quick-icon">
                                <svg
                                    width="21"
                                    height="21"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>

                            <div>
                                <strong>
                                    My Applications
                                </strong>

                                <span>
                                    Track your applications
                                </span>
                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </button>

                        {/* PROFILE */}

                        <button
                            type="button"
                            className="quick-card"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/profile"
                                )
                            }
                        >

                            <div className="quick-icon">
                                <svg
                                    width="21"
                                    height="21"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <circle
                                        cx="12"
                                        cy="8"
                                        r="4"
                                    />

                                    <path d="M4 21a8 8 0 0 1 16 0" />
                                </svg>
                            </div>

                            <div>
                                <strong>
                                    Update Profile
                                </strong>

                                <span>
                                    Keep your profile
                                    up to date
                                </span>
                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </button>

                    </div>

                </section>

            </div>

            {/* =====================================================
                STYLES
            ===================================================== */}

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .dashboard-page {
                    margin-left: 5px;
                    min-height: 100vh;
                    padding: 32px 38px 50px;
                    background: #f7f7f7;
                    color: #111;
                    font-family:
                        Inter,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .dashboard-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 25px;
                    margin-bottom: 30px;
                }

                .eyebrow {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1.6px;
                    color: #999;
                    margin-bottom: 7px;
                }

                .dashboard-header h1 {
                    margin: 0;
                    font-size: 30px;
                    line-height: 1.2;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }

                .header-subtitle {
                    margin: 8px 0 0;
                    color: #888;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .chat-header-button,
                .notification-button,
                .help-header-button {
                    position: relative;
                    width: 44px;
                    height: 44px;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    background: #fff;
                    color: #111;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .chat-header-button:hover,
                .notification-button:hover,
                .help-header-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.06);
                }

                .chat-header-button svg,
                .notification-button svg,
                .help-header-button svg {
                    width: 20px;
                    height: 20px;
                }

                .chat-header-badge,
                .notification-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    border-radius: 20px;
                    background: #111;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    font-weight: 700;
                    border: 2px solid #f7f7f7;
                }

                .notification-wrapper {
                    position: relative;
                }

                .notification-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 380px;
                    max-width: calc(100vw - 30px);
                    background: #fff;
                    border: 1px solid #e8e8e8;
                    border-radius: 16px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
                    z-index: 1000;
                    overflow: hidden;
                }

                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 17px 18px;
                    border-bottom: 1px solid #eee;
                }

                .notification-header > div {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .notification-header strong {
                    font-size: 14px;
                }

                .notification-header span {
                    color: #999;
                    font-size: 10px;
                }

                .notification-close {
                    border: none;
                    background: transparent;
                    color: #888;
                    font-size: 23px;
                    line-height: 1;
                    cursor: pointer;
                }

                .notification-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    padding: 10px 14px;
                    border-bottom: 1px solid #eee;
                }

                .notification-actions button {
                    border: none;
                    background: transparent;
                    color: #555;
                    font-size: 10px;
                    cursor: pointer;
                }

                .notification-actions button:hover {
                    color: #111;
                }

                .notification-list {
                    max-height: 430px;
                    overflow-y: auto;
                }

                .notification-item {
                    position: relative;
                    display: flex;
                    gap: 10px;
                    padding: 14px;
                    border-bottom: 1px solid #f1f1f1;
                    cursor: pointer;
                }

                .notification-item:hover {
                    background: #fafafa;
                }

                .notification-item.unread {
                    background: #fcfcfc;
                }

                .notification-icon {
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                    border-radius: 9px;
                    background: #f3f3f3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-content {
                    min-width: 0;
                    flex: 1;
                    padding-right: 18px;
                }

                .notification-title-row {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }

                .notification-title-row strong {
                    font-size: 11px;
                }

                .unread-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #111;
                }

                .notification-content p {
                    margin: 5px 0;
                    color: #666;
                    font-size: 10px;
                    line-height: 1.5;
                }

                .notification-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 7px;
                    color: #aaa;
                    font-size: 8px;
                }

                .delete-notification {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    border: none;
                    background: transparent;
                    color: #aaa;
                    font-size: 16px;
                    cursor: pointer;
                }

                .notification-empty {
                    min-height: 180px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #999;
                    text-align: center;
                }

                .notification-empty p {
                    margin: 0;
                    font-size: 11px;
                    color: #666;
                }

                .notification-empty span {
                    font-size: 9px;
                    color: #aaa;
                }

                .empty-bell,
                .empty-document {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 18px;
                }

                .stat-card {
                    background: #fff;
                    border: 1px solid #e9e9e9;
                    border-radius: 15px;
                    padding: 19px;
                }

                .stat-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }

                .stat-card-top > span {
                    color: #888;
                    font-size: 10px;
                    font-weight: 600;
                }

                .stat-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    background: #f4f4f4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-card > strong {
                    display: block;
                    margin-top: 18px;
                    font-size: 28px;
                    line-height: 1;
                }

                .stat-card > small {
                    display: block;
                    margin-top: 8px;
                    color: #aaa;
                    font-size: 9px;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns:
                        minmax(0, 1.4fr)
                        minmax(300px, 0.8fr);
                    gap: 18px;
                }

                .dashboard-card {
                    background: #fff;
                    border: 1px solid #e9e9e9;
                    border-radius: 15px;
                    overflow: hidden;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                }

                .card-header h2 {
                    margin: 0;
                    font-size: 15px;
                }

                .card-header p {
                    margin: 5px 0 0;
                    color: #999;
                    font-size: 9px;
                }

                .view-all-button {
                    border: none;
                    background: transparent;
                    color: #555;
                    font-size: 9px;
                    cursor: pointer;
                }

                .view-all-button:hover {
                    color: #111;
                }

                .application-list {
                    padding: 0 20px;
                }

                .application-row {
                    min-height: 76px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .application-row:last-child {
                    border-bottom: none;
                }

                .application-main {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    min-width: 0;
                }

                .company-avatar {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    border-radius: 10px;
                    background: #f1f1f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                }

                .application-main > div:last-child {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                }

                .application-main strong {
                    font-size: 11px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .application-main span {
                    color: #888;
                    font-size: 9px;
                }

                .application-main small {
                    color: #aaa;
                    font-size: 8px;
                }

                .application-status {
                    flex-shrink: 0;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 24px;
                    padding: 0 9px;
                    border-radius: 20px;
                    background: #f1f1f1;
                    color: #555;
                    font-size: 8px;
                    font-weight: 600;
                }

                .status-pill.hired {
                    background: #e9f7ed;
                    color: #23733a;
                }

                .status-pill.shortlisted {
                    background: #f1edff;
                    color: #6147a5;
                }

                .status-pill.rejected {
                    background: #fcecec;
                    color: #a94444;
                }

                .card-empty {
                    min-height: 280px;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    gap: 9px;
                }

                .card-empty p {
                    margin: 0;
                    color: #666;
                    font-size: 11px;
                }

                .card-empty span {
                    max-width: 250px;
                    color: #aaa;
                    font-size: 9px;
                    line-height: 1.5;
                }

                .primary-button {
                    margin-top: 8px;
                    border: none;
                    border-radius: 9px;
                    padding: 9px 15px;
                    background: #111;
                    color: #fff;
                    font-size: 9px;
                    cursor: pointer;
                }

                .performance-content {
                    min-height: 280px;
                    padding: 28px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 28px;
                }

                .performance-circle {
                    width: 145px;
                    height: 145px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                        conic-gradient(
                            #111 var(--performance, 0%),
                            #eeeeee var(--performance, 0%)
                        );
                    position: relative;
                }

                .performance-circle::before {
                    content: "";
                    position: absolute;
                    inset: 10px;
                    border-radius: 50%;
                    background: #fff;
                }

                .performance-circle > div {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .performance-circle strong {
                    font-size: 27px;
                }

                .performance-circle span {
                    color: #999;
                    font-size: 8px;
                    margin-top: 4px;
                }

                .performance-stats {
                    width: 100%;
                    display: grid;
                    grid-template-columns:
                        repeat(3, 1fr);
                    gap: 10px;
                }

                .performance-stats > div {
                    text-align: center;
                }

                .performance-stats span {
                    display: block;
                    color: #999;
                    font-size: 8px;
                }

                .performance-stats strong {
                    display: block;
                    margin-top: 5px;
                    font-size: 17px;
                }

                .quick-section {
                    margin-top: 28px;
                }

                .section-heading {
                    margin-bottom: 14px;
                }

                .section-heading h2 {
                    margin: 0;
                    font-size: 15px;
                }

                .section-heading p {
                    margin: 5px 0 0;
                    color: #999;
                    font-size: 9px;
                }

                .quick-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 12px;
                }

                .quick-card {
                    border: 1px solid #e9e9e9;
                    background: #fff;
                    border-radius: 14px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .quick-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
                }

                .quick-icon {
                    width: 38px;
                    height: 38px;
                    min-width: 38px;
                    border-radius: 10px;
                    background: #f3f3f3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .quick-card > div:nth-child(2) {
                    min-width: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .quick-card strong {
                    font-size: 10px;
                }

                .quick-card span {
                    color: #999;
                    font-size: 8px;
                    line-height: 1.4;
                }

                .quick-card .arrow {
                    color: #555;
                    font-size: 16px;
                }

                .dashboard-error {
                    margin-bottom: 18px;
                    padding: 12px 15px;
                    border-radius: 10px;
                    background: #fcecec;
                    color: #9b4444;
                    font-size: 10px;
                }

                @media (max-width: 1000px) {
                    .stats-grid {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }

                    .quick-grid {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 700px) {
                    .dashboard-page {
                        padding: 24px 18px 40px;
                    }

                    .dashboard-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .header-actions {
                        align-self: flex-end;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .quick-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 450px) {
                    .dashboard-header {
                        align-items: flex-start;
                    }

                    .header-subtitle {
                        max-width: 220px;
                    }

                    .header-actions {
                        gap: 5px;
                    }

                    .chat-header-button,
                    .notification-button,
                    .help-header-button {
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                    }

                    .chat-header-button svg,
                    .notification-button svg,
                    .help-header-button svg {
                        width: 18px;
                        height: 18px;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .performance-stats {
                        grid-template-columns: 1fr;
                    }

                    .notification-dropdown {
                        right: -65px;
                    }

                    .application-row {
                        align-items: flex-start;
                        flex-direction: column;
                        padding: 14px 0;
                    }

                    .application-status {
                        align-self: flex-start;
                    }
                }
            `}</style>
        </>
    );
}

export default JobSeekerDashboard;