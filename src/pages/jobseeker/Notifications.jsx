import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api";

/* =========================================================
   ICON
========================================================= */

function Icon({ name, size = 20 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    switch (name) {
        case "bell":
            return (
                <svg {...common}>
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>
            );

        case "check":
            return (
                <svg {...common}>
                    <path d="m5 12 4 4L19 6" />
                </svg>
            );

        case "x":
            return (
                <svg {...common}>
                    <path d="m6 6 12 12" />
                    <path d="m18 6-12 12" />
                </svg>
            );

        case "info":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5" />
                    <path d="M12 8h.01" />
                </svg>
            );

        case "arrow-left":
            return (
                <svg {...common}>
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                </svg>
            );

        case "refresh":
            return (
                <svg {...common}>
                    <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
                    <path d="M4 5v4h4" />
                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
                    <path d="M20 19v-4h-4" />
                </svg>
            );

        default:
            return null;
    }
}

/* =========================================================
   NOTIFICATIONS PAGE
========================================================= */

function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =======================================================
       FETCH DYNAMIC NOTIFICATIONS
    ======================================================= */

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("jc_token") ||
                localStorage.getItem("access_token");

            if (!token) {
                setError(
                    "Your session has expired. Please login again."
                );

                setLoading(false);
                return;
            }

            /*
             * IMPORTANT:
             *
             * This page expects Django to provide:
             *
             * GET /api/notifications/
             *
             * Example:
             *
             * http://localhost:8000/api/notifications/
             *
             * OR
             *
             * https://eswari0207.pythonanywhere.com/api/notifications/
             */

            const response = await fetch(
                `${API_BASE}/notifications/`,
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
                "Notifications API:",
                response.status,
                data
            );

            /* =================================================
               UNAUTHORIZED
            ================================================= */

            if (response.status === 401) {
                localStorage.removeItem("jc_token");
                localStorage.removeItem("access_token");

                throw new Error(
                    "Your session has expired. Please login again."
                );
            }

            /* =================================================
               API ERROR
            ================================================= */

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                        data?.message ||
                        "Unable to load notifications."
                );
            }

            /* =================================================
               HANDLE DIFFERENT RESPONSE FORMATS
            ================================================= */

            let notificationList = [];

            if (Array.isArray(data)) {
                notificationList = data;
            } else if (Array.isArray(data?.results)) {
                notificationList = data.results;
            } else if (
                Array.isArray(data?.notifications)
            ) {
                notificationList = data.notifications;
            }

            setNotifications(notificationList);
        } catch (err) {
            console.error(
                "FETCH NOTIFICATIONS ERROR:",
                err
            );

            setNotifications([]);

            setError(
                err.message ||
                    "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =======================================================
       FORMAT DATE
    ======================================================= */

    function formatDate(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /* =======================================================
       NOTIFICATION TITLE
    ======================================================= */

    function getTitle(notification) {
        return (
            notification?.title ||
            notification?.notification_title ||
            notification?.subject ||
            "Notification"
        );
    }

    /* =======================================================
       NOTIFICATION MESSAGE
    ======================================================= */

    function getMessage(notification) {
        return (
            notification?.message ||
            notification?.description ||
            notification?.content ||
            notification?.text ||
            ""
        );
    }

    /* =======================================================
       NOTIFICATION DATE
    ======================================================= */

    function getDate(notification) {
        return (
            notification?.created_at ||
            notification?.created ||
            notification?.timestamp ||
            notification?.date ||
            notification?.updated_at
        );
    }

    /* =======================================================
       READ STATUS
    ======================================================= */

    function isRead(notification) {
        return (
            notification?.is_read === true ||
            notification?.read === true ||
            notification?.status === "read"
        );
    }

    /* =======================================================
       NOTIFICATION TYPE
    ======================================================= */

    function getType(notification) {
        return String(
            notification?.type ||
                notification?.notification_type ||
                notification?.category ||
                ""
        ).toLowerCase();
    }

    /* =======================================================
       ICON
    ======================================================= */

    function getNotificationIcon(notification) {
        const type = getType(notification);

        if (
            type.includes("reject") ||
            type.includes("failed")
        ) {
            return "x";
        }

        if (
            type.includes("success") ||
            type.includes("shortlist") ||
            type.includes("hired") ||
            type.includes("approved")
        ) {
            return "check";
        }

        if (type.includes("info")) {
            return "info";
        }

        return "bell";
    }

    /* =======================================================
       RENDER
    ======================================================= */

    return (
        <div className="notifications-page">

            <style>{`

                .notifications-page {
                    --navy: #08111f;
                    --blue: #3978ff;
                    --blue-soft: #eef4ff;

                    --green: #20a464;
                    --green-soft: #eaf9f3;

                    --red: #e95353;
                    --red-soft: #fff0f0;

                    --text: #101828;
                    --text-soft: #667085;
                    --muted: #98a2b3;

                    --line: #e7ebf0;
                    --background: #f5f7fa;

                    min-height: 100vh;
                    padding: 28px;

                    background: var(--background);

                    font-family:
                        "DM Sans",
                        Arial,
                        sans-serif;

                    color: var(--text);
                }

                .notifications-container {
                    max-width: 1050px;
                    margin: 0 auto;
                }

                .notifications-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 15px;

                    margin-bottom: 20px;
                }

                .notifications-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .notifications-back {
                    width: 40px;
                    height: 40px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border: 1px solid var(--line);
                    border-radius: 10px;

                    background: white;
                    color: var(--text-soft);

                    cursor: pointer;
                }

                .notifications-back:hover {
                    color: var(--blue);
                    border-color: #ccd9f7;
                }

                .notifications-title h1 {
                    margin: 0;

                    color: var(--navy);

                    font-size: 1.45rem;
                    font-weight: 800;

                    letter-spacing: -.035em;
                }

                .notifications-title p {
                    margin: 4px 0 0;

                    color: var(--text-soft);

                    font-size: .7rem;
                }

                .notifications-refresh {
                    width: 40px;
                    height: 40px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border: 1px solid var(--line);
                    border-radius: 10px;

                    background: white;
                    color: var(--text-soft);

                    cursor: pointer;
                }

                .notifications-refresh:hover {
                    color: var(--blue);
                }

                .notifications-card {
                    overflow: hidden;

                    border: 1px solid var(--line);
                    border-radius: 15px;

                    background: white;

                    box-shadow:
                        0 5px 20px
                        rgba(16,24,40,.035);
                }

                .notification-item {
                    display: flex;
                    align-items: flex-start;

                    gap: 13px;

                    padding: 17px;

                    border-bottom: 1px solid #f0f3f7;

                    transition: background .2s ease;
                }

                .notification-item:last-child {
                    border-bottom: none;
                }

                .notification-item:hover {
                    background: #fafcff;
                }

                .notification-item.unread {
                    background: #f8fbff;
                }

                .notification-icon {
                    width: 40px;
                    height: 40px;

                    flex-shrink: 0;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 11px;

                    background: var(--blue-soft);
                    color: var(--blue);
                }

                .notification-item.unread
                .notification-icon {
                    box-shadow:
                        0 0 0 3px
                        rgba(57,120,255,.08);
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title-row {
                    display: flex;
                    align-items: center;

                    gap: 8px;
                }

                .notification-title {
                    margin: 0;

                    color: var(--navy);

                    font-size: .75rem;
                    font-weight: 800;
                }

                .notification-unread-dot {
                    width: 7px;
                    height: 7px;

                    flex-shrink: 0;

                    border-radius: 50%;

                    background: var(--blue);
                }

                .notification-message {
                    margin: 5px 0 0;

                    color: var(--text-soft);

                    font-size: .65rem;

                    line-height: 1.55;
                }

                .notification-date {
                    margin-top: 6px;

                    color: var(--muted);

                    font-size: .55rem;
                }

                .notifications-loading {
                    min-height: 300px;

                    display: flex;
                    flex-direction: column;

                    align-items: center;
                    justify-content: center;

                    color: var(--text-soft);

                    font-size: .65rem;
                }

                .notifications-spinner {
                    width: 30px;
                    height: 30px;

                    margin-bottom: 10px;

                    border: 3px solid #e8efff;
                    border-top-color: var(--blue);

                    border-radius: 50%;

                    animation:
                        notificationSpin
                        .75s linear infinite;
                }

                @keyframes notificationSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .notifications-error {
                    padding: 35px 20px;

                    text-align: center;

                    color: var(--red);

                    font-size: .65rem;
                }

                .notifications-empty {
                    min-height: 300px;

                    display: flex;
                    flex-direction: column;

                    align-items: center;
                    justify-content: center;

                    padding: 30px;

                    text-align: center;
                }

                .notifications-empty-icon {
                    width: 55px;
                    height: 55px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    margin-bottom: 12px;

                    border-radius: 15px;

                    background: var(--blue-soft);
                    color: var(--blue);
                }

                .notifications-empty h3 {
                    margin: 0 0 5px;

                    color: var(--navy);

                    font-size: .8rem;
                    font-weight: 800;
                }

                .notifications-empty p {
                    margin: 0;

                    color: var(--muted);

                    font-size: .6rem;
                }

                @media (max-width: 600px) {

                    .notifications-page {
                        padding: 15px;
                    }

                    .notifications-title h1 {
                        font-size: 1.2rem;
                    }

                    .notifications-item {
                        padding: 13px;
                    }

                    .notification-icon {
                        width: 36px;
                        height: 36px;
                    }
                }

            `}</style>

            <div className="notifications-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="notifications-header">

                    <div className="notifications-header-left">

                        <button
                            type="button"
                            className="notifications-back"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/dashboard"
                                )
                            }
                            aria-label="Back"
                        >
                            <Icon
                                name="arrow-left"
                                size={18}
                            />
                        </button>

                        <div className="notifications-title">

                            <h1>
                                Notifications
                            </h1>

                            <p>
                                Updates about your job applications
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="notifications-refresh"
                        onClick={fetchNotifications}
                        aria-label="Refresh notifications"
                    >
                        <Icon
                            name="refresh"
                            size={17}
                        />
                    </button>

                </header>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="notifications-card">

                    {/* LOADING */}

                    {loading && (
                        <div className="notifications-loading">

                            <div className="notifications-spinner" />

                            Loading notifications...

                        </div>
                    )}

                    {/* ERROR */}

                    {!loading && error && (
                        <div className="notifications-error">

                            <Icon
                                name="info"
                                size={25}
                            />

                            <p>
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={fetchNotifications}
                            >
                                Try again
                            </button>

                        </div>
                    )}

                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        notifications.length === 0 && (
                            <div className="notifications-empty">

                                <div className="notifications-empty-icon">

                                    <Icon
                                        name="bell"
                                        size={23}
                                    />

                                </div>

                                <h3>
                                    No notifications
                                </h3>

                                <p>
                                    You don't have any notifications yet.
                                </p>

                            </div>
                        )}

                    {/* DYNAMIC NOTIFICATIONS */}

                    {!loading &&
                        !error &&
                        notifications.length > 0 &&
                        notifications.map(
                            (notification, index) => {

                                const read =
                                    isRead(
                                        notification
                                    );

                                return (
                                    <article
                                        key={
                                            notification?.id ||
                                            notification?.notification_id ||
                                            index
                                        }
                                        className={`notification-item ${
                                            !read
                                                ? "unread"
                                                : ""
                                        }`}
                                    >

                                        <div className="notification-icon">

                                            <Icon
                                                name={getNotificationIcon(
                                                    notification
                                                )}
                                                size={18}
                                            />

                                        </div>

                                        <div className="notification-content">

                                            <div className="notification-title-row">

                                                <h3 className="notification-title">
                                                    {getTitle(
                                                        notification
                                                    )}
                                                </h3>

                                                {!read && (
                                                    <span className="notification-unread-dot" />
                                                )}

                                            </div>

                                            {getMessage(
                                                notification
                                            ) && (
                                                <p className="notification-message">
                                                    {getMessage(
                                                        notification
                                                    )}
                                                </p>
                                            )}

                                            {getDate(
                                                notification
                                            ) && (
                                                <div className="notification-date">
                                                    {formatDate(
                                                        getDate(
                                                            notification
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        </div>

                                    </article>
                                );
                            }
                        )}

                </div>

            </div>

        </div>
    );
}

export default Notifications;

