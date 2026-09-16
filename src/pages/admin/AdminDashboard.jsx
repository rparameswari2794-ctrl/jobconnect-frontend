import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import NotificationBell from "../../components/NotificationBell";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";

function AdminDashboard() {
    const navigate = useNavigate();

    // ============================================================
    // DASHBOARD STATE
    // ============================================================

    const [dashboardData, setDashboardData] = useState({
        total_users: 0,
        total_jobseekers: 0,
        total_employers: 0,
        total_jobs: 0,
        disability_users: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ============================================================
    // NOTIFICATION MODAL
    // ============================================================

    const [showNotificationModal, setShowNotificationModal] =
        useState(false);

    // ============================================================
    // ADMIN NOTIFICATION STATE
    // ============================================================

    const [notificationForm, setNotificationForm] = useState({
        recipient_type: "JOBSEEKERS",
        title: "",
        message: "",
        user_ids: [],
    });

    const [notificationUsers, setNotificationUsers] = useState({
        jobseekers: [],
        employers: [],
    });

    const [loadingNotificationUsers, setLoadingNotificationUsers] =
        useState(false);

    const [sendingNotification, setSendingNotification] =
        useState(false);

    const [notificationSuccess, setNotificationSuccess] =
        useState("");

    const [notificationError, setNotificationError] =
        useState("");

    // ============================================================
    // AUTH
    // ============================================================

    const getToken = () => {
        const token =
            localStorage.getItem("jc_token") ||
            localStorage.getItem("access_token") ||
            localStorage.getItem("access") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token");

        console.log("ADMIN TOKEN FOUND:", !!token);

        return token;
    };

    const authHeaders = () => {
        const token = getToken();

        if (!token) {
            console.warn(
                "No authentication token found in localStorage."
            );

            return {
                Accept: "application/json",
            };
        }

        return {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    // ============================================================
    // LOAD DASHBOARD
    // ============================================================

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE}/admin/dashboard/`,
                {
                    method: "GET",
                    headers: authHeaders(),
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Authentication failed. Please log in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to access the admin dashboard."
                    );
                }

                throw new Error(
                    data.detail ||
                        data.message ||
                        "Failed to load dashboard."
                );
            }

            console.log(
                "ADMIN DASHBOARD RESPONSE:",
                data
            );

            setDashboardData({
                total_users: Number(
                    data.total_users ??
                        data.users_count ??
                        0
                ),

                total_jobseekers: Number(
                    data.total_jobseekers ??
                        data.jobseekers_count ??
                        0
                ),

                total_employers: Number(
                    data.total_employers ??
                        data.employers_count ??
                        0
                ),

                total_jobs: Number(
                    data.total_jobs ??
                        data.jobs_count ??
                        0
                ),

                disability_users: Number(
                    data.disability_users ??
                        data.disability_count ??
                        0
                ),
            });
        } catch (err) {
            console.error(
                "Dashboard error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // LOAD NOTIFICATION USERS
    // ============================================================

    const loadNotificationUsers = async () => {
        try {
            setLoadingNotificationUsers(true);
            setNotificationError("");

            const response = await fetch(
                `${API_BASE}/admin/notification-users/`,
                {
                    method: "GET",
                    headers: authHeaders(),
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Authentication failed. Please log in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to load notification users."
                    );
                }

                throw new Error(
                    data.detail ||
                        data.message ||
                        "Failed to load users."
                );
            }

            setNotificationUsers({
                jobseekers: Array.isArray(
                    data.jobseekers
                )
                    ? data.jobseekers
                    : [],

                employers: Array.isArray(
                    data.employers
                )
                    ? data.employers
                    : [],
            });
        } catch (err) {
            console.error(
                "Notification users error:",
                err
            );

            setNotificationError(
                err.message ||
                    "Unable to load notification users."
            );
        } finally {
            setLoadingNotificationUsers(false);
        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        loadDashboard();
        loadNotificationUsers();
    }, []);

    // ============================================================
    // CLOSE MODAL WITH ESC
    // ============================================================

    useEffect(() => {
        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
                showNotificationModal
            ) {
                setShowNotificationModal(false);
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [showNotificationModal]);

    // ============================================================
    // OPEN NOTIFICATION MODAL
    // ============================================================

    const openNotificationModal = () => {
        setNotificationSuccess("");
        setNotificationError("");
        setShowNotificationModal(true);
    };

    // ============================================================
    // CLOSE NOTIFICATION MODAL
    // ============================================================

    const closeNotificationModal = () => {
        if (sendingNotification) {
            return;
        }

        setShowNotificationModal(false);
        setNotificationSuccess("");
        setNotificationError("");
    };

    // ============================================================
    // OPEN HELP SUPPORT
    // ============================================================

    const openHelpSupport = () => {
        navigate("/help-support");
    };

    // ============================================================
    // NOTIFICATION FORM CHANGE
    // ============================================================

    const handleNotificationChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setNotificationForm(
            (previous) => ({
                ...previous,
                [name]: value,

                ...(name ===
                "recipient_type"
                    ? {
                          user_ids: [],
                      }
                    : {}),
            })
        );

        setNotificationSuccess("");
        setNotificationError("");
    };

    // ============================================================
    // TOGGLE SELECTED USER
    // ============================================================

    const toggleNotificationUser = (userId) => {
        setNotificationForm(
            (previous) => {
                const exists =
                    previous.user_ids.includes(
                        userId
                    );

                return {
                    ...previous,

                    user_ids: exists
                        ? previous.user_ids.filter(
                              (id) =>
                                  id !==
                                  userId
                          )
                        : [
                              ...previous.user_ids,
                              userId,
                          ],
                };
            }
        );

        setNotificationSuccess("");
        setNotificationError("");
    };

    // ============================================================
    // SELECT ALL USERS
    // ============================================================

    const selectAllNotificationUsers = () => {
        const allUsers = [
            ...notificationUsers.jobseekers,
            ...notificationUsers.employers,
        ];

        setNotificationForm(
            (previous) => ({
                ...previous,

                user_ids:
                    allUsers.map(
                        (user) =>
                            user.id
                    ),
            })
        );

        setNotificationSuccess("");
        setNotificationError("");
    };

    // ============================================================
    // CLEAR SELECTED USERS
    // ============================================================

    const clearSelectedNotificationUsers = () => {
        setNotificationForm(
            (previous) => ({
                ...previous,
                user_ids: [],
            })
        );

        setNotificationSuccess("");
        setNotificationError("");
    };

    // ============================================================
    // SEND ADMIN NOTIFICATION
    // ============================================================

    const sendAdminNotification = async (
        event
    ) => {
        event.preventDefault();

        setNotificationSuccess("");
        setNotificationError("");

        const recipientType =
            notificationForm.recipient_type;

        const title =
            notificationForm.title.trim();

        const message =
            notificationForm.message.trim();

        if (!title) {
            setNotificationError(
                "Please enter a notification title."
            );
            return;
        }

        if (!message) {
            setNotificationError(
                "Please enter a notification message."
            );
            return;
        }

        if (
            recipientType ===
                "SELECTED" &&
            notificationForm.user_ids
                .length === 0
        ) {
            setNotificationError(
                "Please select at least one user."
            );
            return;
        }

        try {
            setSendingNotification(true);

            const payload = {
                recipient_type:
                    recipientType,

                title,

                message,
            };

            if (
                recipientType ===
                "SELECTED"
            ) {
                payload.user_ids =
                    notificationForm.user_ids;
            }

            const response = await fetch(
                `${API_BASE}/admin/notifications/`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            const data =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );

            if (!response.ok) {
                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Authentication failed. Please log in again."
                    );
                }

                if (
                    response.status ===
                    403
                ) {
                    throw new Error(
                        "You do not have permission to send notifications."
                    );
                }

                throw new Error(
                    data.detail ||
                        data.message ||
                        "Failed to send notification."
                );
            }

            setNotificationSuccess(
                data.message ||
                    "Notification sent successfully."
            );

            setNotificationForm({
                recipient_type:
                    recipientType,

                title: "",

                message: "",

                user_ids: [],
            });

            setTimeout(() => {
                setShowNotificationModal(
                    false
                );

                setNotificationSuccess("");
            }, 1200);
        } catch (err) {
            console.error(
                "Send notification error:",
                err
            );

            setNotificationError(
                err.message ||
                    "Unable to send notification."
            );
        } finally {
            setSendingNotification(
                false
            );
        }
    };

    // ============================================================
    // DATA FOR CHARTS
    // ============================================================

    const userChartData = [
        {
            name: "Job Seekers",
            count:
                dashboardData.total_jobseekers,
        },

        {
            name: "Employers",
            count:
                dashboardData.total_employers,
        },
    ];

    // ============================================================
    // QUICK ACTIONS
    // ============================================================

    const quickActions = [
        {
            title: "Verification Queue",

            description:
                "Review pending jobseeker and employer profiles.",

            path: "/admin/verifications",

            icon: "✓",
        },

        {
            title: "Job Seekers",

            description:
                "View and manage registered job seekers.",

            path: "/admin/users",

            icon: "👤",
        },

        {
            title: "Employers",

            description:
                "View and manage employer accounts.",

            path: "/admin/users",

            icon: "🏢",
        },

        {
            title: "Reports",

            description:
                "View platform reports and analytics.",

            path: "/admin/reports",

            icon: "📊",
        },
    ];

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="admin-dashboard">

            {/* ====================================================
                HEADER
            ===================================================== */}

            <div className="admin-header">
                <div>
                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Monitor and manage your
                        recruitment platform.
                    </p>
                </div>

                <div className="admin-header-actions">

                    {/* NOTIFICATION */}
                    <NotificationBell />

                    {/* HELP */}
                    <button
                        type="button"
                        className="admin-help-button"
                        onClick={
                            openHelpSupport
                        }
                        aria-label="Help and Support"
                        title="Help and Support"
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

                            <path
                                d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-.9.9-1.9 1.3-1.9 2.9"
                            />

                            <line
                                x1="12"
                                y1="17"
                                x2="12.01"
                                y2="17"
                            />
                        </svg>
                    </button>

                    {/* REFRESH */}
                    <button
                        type="button"
                        className="refresh-button"
                        onClick={() => {
                            loadDashboard();
                            loadNotificationUsers();
                        }}
                        disabled={
                            loading ||
                            loadingNotificationUsers
                        }
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>
            </div>

            {/* ====================================================
                ERROR
            ===================================================== */}

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* ====================================================
                STAT CARDS
            ===================================================== */}

            <div className="stat-grid">

                <div className="stat-card">
                    <div className="stat-icon">
                        👥
                    </div>

                    <div>
                        <span className="stat-label">
                            Total Users
                        </span>

                        <strong className="stat-value">
                            {
                                dashboardData.total_users
                            }
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        👤
                    </div>

                    <div>
                        <span className="stat-label">
                            Job Seekers
                        </span>

                        <strong className="stat-value">
                            {
                                dashboardData.total_jobseekers
                            }
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        🏢
                    </div>

                    <div>
                        <span className="stat-label">
                            Employers
                        </span>

                        <strong className="stat-value">
                            {
                                dashboardData.total_employers
                            }
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        💼
                    </div>

                    <div>
                        <span className="stat-label">
                            Total Jobs
                        </span>

                        <strong className="stat-value">
                            {
                                dashboardData.total_jobs
                            }
                        </strong>
                    </div>
                </div>

                <div className="stat-card disability-stat-card">
                    <div className="stat-icon disability-icon">
                        ♿
                    </div>

                    <div>
                        <span className="stat-label">
                            Disability Users
                        </span>

                        <strong className="stat-value">
                            {
                                dashboardData.disability_users
                            }
                        </strong>

                        <small className="stat-description">
                            Registered job seekers
                        </small>
                    </div>
                </div>

            </div>

            {/* ====================================================
                PLATFORM OVERVIEW
            ===================================================== */}

            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>
                            Platform Overview
                        </h2>

                        <p>
                            Current users and
                            platform statistics.
                        </p>
                    </div>
                </div>

                <div className="chart-grid">

                    <div className="chart-card">

                        <div className="chart-header">
                            <h3>
                                User Distribution
                            </h3>

                            <span>
                                Registered accounts
                            </span>
                        </div>

                        <div className="chart-container">

                            <ResponsiveContainer
                                width="100%"
                                height={300}
                            >
                                <BarChart
                                    data={
                                        userChartData
                                    }
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="name"
                                    />

                                    <YAxis
                                        allowDecimals={
                                            false
                                        }
                                    />

                                    <Tooltip />

                                    <Legend />

                                    <Bar
                                        dataKey="count"
                                        name="Users"
                                        fill="#2563eb"
                                        radius={[
                                            6,
                                            6,
                                            0,
                                            0,
                                        ]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>

                        </div>

                    </div>

                    <div className="chart-card disability-overview-card">

                        <div className="chart-header">
                            <h3>
                                Accessibility Overview
                            </h3>

                            <span>
                                Disability registered users
                            </span>
                        </div>

                        <div className="disability-overview-content">

                            <div className="large-disability-icon">
                                ♿
                            </div>

                            <strong>
                                {
                                    dashboardData.disability_users
                                }
                            </strong>

                            <p>
                                Disability Users
                            </p>

                            <span>
                                Job seekers who have
                                registered with a
                                disability.
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* ====================================================
                QUICK ACTIONS
            ===================================================== */}

            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>
                            Quick Actions
                        </h2>

                        <p>
                            Quickly access common
                            admin operations.
                        </p>
                    </div>
                </div>

                <div className="quick-actions-grid">

                    {quickActions.map(
                        (action) => (
                            <button
                                key={
                                    action.title
                                }
                                type="button"
                                className="quick-action-card"
                                onClick={() =>
                                    navigate(
                                        action.path
                                    )
                                }
                            >
                                <div className="quick-action-icon">
                                    {
                                        action.icon
                                    }
                                </div>

                                <div>
                                    <h3>
                                        {
                                            action.title
                                        }
                                    </h3>

                                    <p>
                                        {
                                            action.description
                                        }
                                    </p>
                                </div>

                                <span className="quick-arrow">
                                    →
                                </span>
                            </button>
                        )
                    )}

                </div>

            </section>

            {/* ====================================================
                NOTIFICATION SEND BOX
            ===================================================== */}

            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>
                            Notifications
                        </h2>

                        <p>
                            Send announcements and
                            messages to your users.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="notification-open-box"
                    onClick={
                        openNotificationModal
                    }
                >

                    <div className="notification-open-icon">
                        🔔
                    </div>

                    <div className="notification-open-content">

                        <strong>
                            Send Notification
                        </strong>

                        <span>
                            Click here to send a
                            notification to job seekers,
                            employers, everyone, or
                            selected users.
                        </span>

                    </div>

                    <div className="notification-open-arrow">
                        →
                    </div>

                </button>

            </section>

            {/* ====================================================
                NOTIFICATION MODAL
            ===================================================== */}

            {showNotificationModal && (
                <div
                    className="notification-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeNotificationModal();
                        }
                    }}
                >

                    <div className="notification-modal">

                        <div className="notification-modal-header">

                            <div className="notification-modal-title">

                                <div className="notification-modal-icon">
                                    🔔
                                </div>

                                <div>
                                    <h2>
                                        Send Notification
                                    </h2>

                                    <p>
                                        Send a message to
                                        your users.
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                className="notification-modal-close"
                                onClick={
                                    closeNotificationModal
                                }
                                disabled={
                                    sendingNotification
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="notification-form"
                            onSubmit={
                                sendAdminNotification
                            }
                        >

                            <div className="form-group">

                                <label htmlFor="recipient_type">
                                    Send To
                                </label>

                                <select
                                    id="recipient_type"
                                    name="recipient_type"
                                    value={
                                        notificationForm.recipient_type
                                    }
                                    onChange={
                                        handleNotificationChange
                                    }
                                >

                                    <option value="JOBSEEKERS">
                                        All Job Seekers
                                    </option>

                                    <option value="EMPLOYERS">
                                        All Employers
                                    </option>

                                    <option value="EVERYONE">
                                        Everyone
                                    </option>

                                    <option value="SELECTED">
                                        Selected Users
                                    </option>

                                </select>

                            </div>

                            {notificationForm.recipient_type ===
                                "SELECTED" && (
                                <div className="selected-users-box">

                                    <div className="selected-users-header">

                                        <div>
                                            <h3>
                                                Select Users
                                            </h3>

                                            <span>
                                                {
                                                    notificationForm
                                                        .user_ids
                                                        .length
                                                }{" "}
                                                selected
                                            </span>
                                        </div>

                                        <div className="selection-actions">

                                            <button
                                                type="button"
                                                onClick={
                                                    selectAllNotificationUsers
                                                }
                                            >
                                                Select All
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    clearSelectedNotificationUsers
                                                }
                                            >
                                                Clear
                                            </button>

                                        </div>

                                    </div>

                                    {loadingNotificationUsers ? (
                                        <div className="users-loading">
                                            Loading users...
                                        </div>
                                    ) : (
                                        <div className="users-selection-list">

                                            <div className="user-group">

                                                <h4>
                                                    Job Seekers
                                                </h4>

                                                {notificationUsers
                                                    .jobseekers
                                                    .length ===
                                                0 ? (
                                                    <p className="empty-users">
                                                        No job seekers
                                                        found.
                                                    </p>
                                                ) : (
                                                    notificationUsers.jobseekers.map(
                                                        (
                                                            user
                                                        ) => (
                                                            <label
                                                                key={`jobseeker-${user.id}`}
                                                                className="user-checkbox"
                                                            >

                                                                <input
                                                                    type="checkbox"
                                                                    checked={notificationForm.user_ids.includes(
                                                                        user.id
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleNotificationUser(
                                                                            user.id
                                                                        )
                                                                    }
                                                                />

                                                                <span className="checkbox-custom">
                                                                    ✓
                                                                </span>

                                                                <span className="user-info">

                                                                    <strong>
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </small>

                                                                </span>

                                                            </label>
                                                        )
                                                    )
                                                )}

                                            </div>

                                            <div className="user-group">

                                                <h4>
                                                    Employers
                                                </h4>

                                                {notificationUsers
                                                    .employers
                                                    .length ===
                                                0 ? (
                                                    <p className="empty-users">
                                                        No employers
                                                        found.
                                                    </p>
                                                ) : (
                                                    notificationUsers.employers.map(
                                                        (
                                                            user
                                                        ) => (
                                                            <label
                                                                key={`employer-${user.id}`}
                                                                className="user-checkbox"
                                                            >

                                                                <input
                                                                    type="checkbox"
                                                                    checked={notificationForm.user_ids.includes(
                                                                        user.id
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleNotificationUser(
                                                                            user.id
                                                                        )
                                                                    }
                                                                />

                                                                <span className="checkbox-custom">
                                                                    ✓
                                                                </span>

                                                                <span className="user-info">

                                                                    <strong>
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </small>

                                                                </span>

                                                            </label>
                                                        )
                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}

                                </div>
                            )}

                            <div className="form-group">

                                <label htmlFor="notification-title">
                                    Notification Title
                                </label>

                                <input
                                    id="notification-title"
                                    type="text"
                                    name="title"
                                    value={
                                        notificationForm.title
                                    }
                                    onChange={
                                        handleNotificationChange
                                    }
                                    placeholder="Enter notification title"
                                    maxLength={255}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="notification-message">
                                    Message
                                </label>

                                <textarea
                                    id="notification-message"
                                    name="message"
                                    value={
                                        notificationForm.message
                                    }
                                    onChange={
                                        handleNotificationChange
                                    }
                                    placeholder="Write your notification message..."
                                    rows={5}
                                />

                            </div>

                            {notificationSuccess && (
                                <div className="notification-success">

                                    <span>
                                        ✓
                                    </span>

                                    <span>
                                        {
                                            notificationSuccess
                                        }
                                    </span>

                                </div>
                            )}

                            {notificationError && (
                                <div className="notification-error">

                                    <span>
                                        !
                                    </span>

                                    <span>
                                        {
                                            notificationError
                                        }
                                    </span>

                                </div>
                            )}

                            <div className="notification-form-footer">

                                <div className="notification-hint">
                                    🔔

                                    <span>
                                        Recipients will
                                        receive this message
                                        in their notification
                                        bell.
                                    </span>
                                </div>

                                <div className="notification-footer-actions">

                                    <button
                                        type="button"
                                        className="cancel-notification-button"
                                        onClick={
                                            closeNotificationModal
                                        }
                                        disabled={
                                            sendingNotification
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="send-notification-button"
                                        disabled={
                                            sendingNotification
                                        }
                                    >
                                        {sendingNotification
                                            ? "Sending..."
                                            : "Send Notification"}
                                    </button>

                                </div>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ====================================================
                CSS
            ===================================================== */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .admin-dashboard {
                    width: 100%;
                    min-height: 100vh;
                    padding: 28px;
                    background: #f8fafc;
                    color: #0f172a;
                }

                /* HEADER */

                .admin-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 28px;
                }

                .admin-header h1 {
                    margin: 0 0 6px;
                    font-size: 30px;
                    font-weight: 750;
                    letter-spacing: -0.5px;
                }

                .admin-header p {
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .admin-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                /* =================================================
                   HELP BUTTON
                   ================================================= */

                .admin-help-button {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #475569;
                    cursor: pointer;
                    transition:
                        background 0.2s,
                        color 0.2s,
                        border-color 0.2s,
                        transform 0.2s;
                }

                .admin-help-button svg {
                    width: 20px;
                    height: 20px;
                }

                .admin-help-button:hover {
                    background: #eff6ff;
                    border-color: #bfdbfe;
                    color: #2563eb;
                    transform: translateY(-1px);
                }

                .admin-help-button:active {
                    transform: translateY(0);
                }

                .refresh-button {
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #0f172a;
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .refresh-button:hover:not(:disabled) {
                    background: #f1f5f9;
                }

                .refresh-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* ERROR */

                .dashboard-error {
                    margin-bottom: 20px;
                    padding: 13px 16px;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    background: #fef2f2;
                    color: #b91c1c;
                    font-size: 14px;
                    font-weight: 600;
                }

                /* STATS */

                .stat-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(5, minmax(0, 1fr));
                    gap: 18px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    box-shadow:
                        0 3px 12px
                        rgba(15, 23, 42, 0.04);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: #eff6ff;
                    font-size: 22px;
                    flex-shrink: 0;
                }

                .disability-icon {
                    background: #ecfdf5;
                }

                .stat-label {
                    display: block;
                    margin-bottom: 4px;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 600;
                }

                .stat-value {
                    display: block;
                    color: #0f172a;
                    font-size: 26px;
                    line-height: 1;
                }

                .stat-description {
                    display: block;
                    margin-top: 5px;
                    color: #94a3b8;
                    font-size: 10px;
                }

                /* SECTION */

                .dashboard-section {
                    margin-bottom: 30px;
                }

                .section-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                }

                .section-heading h2 {
                    margin: 0 0 5px;
                    font-size: 20px;
                    font-weight: 750;
                }

                .section-heading p {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                }

                /* CHARTS */

                .chart-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 20px;
                }

                .chart-card {
                    min-width: 0;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow:
                        0 3px 12px
                        rgba(15, 23, 42, 0.04);
                }

                .chart-header {
                    margin-bottom: 5px;
                }

                .chart-header h3 {
                    margin: 0 0 4px;
                    font-size: 16px;
                }

                .chart-header span {
                    color: #94a3b8;
                    font-size: 12px;
                }

                .chart-container {
                    width: 100%;
                    height: 300px;
                    margin-top: 10px;
                }

                /* DISABILITY */

                .disability-overview-content {
                    height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .large-disability-icon {
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 12px;
                    border-radius: 20px;
                    background: #ecfdf5;
                    font-size: 34px;
                }

                .disability-overview-content strong {
                    font-size: 42px;
                    line-height: 1;
                    color: #0f172a;
                }

                .disability-overview-content p {
                    margin: 8px 0 4px;
                    font-size: 15px;
                    font-weight: 700;
                    color: #334155;
                }

                .disability-overview-content span {
                    max-width: 300px;
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1.5;
                }

                /* QUICK ACTIONS */

                .quick-actions-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 16px;
                }

                .quick-action-card {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 13px;
                    width: 100%;
                    min-height: 145px;
                    padding: 18px;
                    text-align: left;
                    border: 1px solid #e2e8f0;
                    border-radius: 15px;
                    background: #ffffff;
                    cursor: pointer;
                    transition:
                        transform 0.2s,
                        box-shadow 0.2s,
                        border-color 0.2s;
                }

                .quick-action-card:hover {
                    transform: translateY(-2px);
                    border-color: #bfdbfe;
                    box-shadow:
                        0 8px 20px
                        rgba(15, 23, 42, 0.07);
                }

                .quick-action-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border-radius: 10px;
                    background: #eff6ff;
                    font-size: 18px;
                }

                .quick-action-card h3 {
                    margin: 2px 0 7px;
                    font-size: 15px;
                }

                .quick-action-card p {
                    margin: 0;
                    padding-right: 15px;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .quick-arrow {
                    position: absolute;
                    right: 16px;
                    bottom: 15px;
                    color: #2563eb;
                    font-size: 18px;
                    font-weight: 700;
                }

                /* NOTIFICATION OPEN BOX */

                .notification-open-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    width: 100%;
                    min-height: 95px;
                    padding: 20px 22px;
                    border: 1px solid #dbeafe;
                    border-radius: 16px;
                    background: linear-gradient(
                        135deg,
                        #ffffff,
                        #f8fbff
                    );
                    text-align: left;
                    cursor: pointer;
                    box-shadow:
                        0 4px 14px
                        rgba(37, 99, 235, 0.05);
                    transition:
                        transform 0.2s,
                        border-color 0.2s,
                        box-shadow 0.2s;
                }

                .notification-open-box:hover {
                    transform: translateY(-2px);
                    border-color: #93c5fd;
                    box-shadow:
                        0 10px 25px
                        rgba(37, 99, 235, 0.10);
                }

                .notification-open-icon {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border-radius: 14px;
                    background: #eff6ff;
                    font-size: 25px;
                }

                .notification-open-content {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    min-width: 0;
                    flex: 1;
                }

                .notification-open-content strong {
                    color: #0f172a;
                    font-size: 15px;
                }

                .notification-open-content span {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .notification-open-arrow {
                    color: #2563eb;
                    font-size: 25px;
                    font-weight: 700;
                }

                /* MODAL */

                .notification-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(
                        15,
                        23,
                        42,
                        0.55
                    );
                    backdrop-filter: blur(4px);
                    animation:
                        modalOverlayIn
                        0.2s ease;
                }

                @keyframes modalOverlayIn {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                .notification-modal {
                    width: 100%;
                    max-width: 720px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background: #ffffff;
                    border-radius: 18px;
                    box-shadow:
                        0 25px 70px
                        rgba(15, 23, 42, 0.25);
                    animation:
                        modalSlideIn
                        0.22s ease;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform:
                            translateY(15px)
                            scale(0.98);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0)
                            scale(1);
                    }
                }

                /* MODAL HEADER */

                .notification-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 20px 22px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .notification-modal-title {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                }

                .notification-modal-icon {
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: #eff6ff;
                    font-size: 21px;
                }

                .notification-modal-title h2 {
                    margin: 0 0 3px;
                    color: #0f172a;
                    font-size: 19px;
                }

                .notification-modal-title p {
                    margin: 0;
                    color: #64748b;
                    font-size: 11px;
                }

                .notification-modal-close {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 9px;
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 25px;
                    line-height: 1;
                    cursor: pointer;
                }

                .notification-modal-close:hover {
                    background: #e2e8f0;
                }

                .notification-modal-close:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* FORM */

                .notification-form {
                    padding: 22px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    margin-bottom: 18px;
                }

                .form-group label {
                    color: #334155;
                    font-size: 13px;
                    font-weight: 700;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #0f172a;
                    font-family: inherit;
                    font-size: 14px;
                    outline: none;
                    transition:
                        border-color 0.2s,
                        box-shadow 0.2s;
                }

                .form-group input,
                .form-group select {
                    height: 44px;
                    padding: 0 13px;
                }

                .form-group textarea {
                    padding: 12px 13px;
                    resize: vertical;
                    min-height: 120px;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    border-color: #2563eb;
                    box-shadow:
                        0 0 0 3px
                        rgba(
                            37,
                            99,
                            235,
                            0.1
                        );
                }

                /* SELECTED USERS */

                .selected-users-box {
                    margin-bottom: 20px;
                    border: 1px solid #dbeafe;
                    border-radius: 13px;
                    overflow: hidden;
                    background: #f8fbff;
                }

                .selected-users-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 14px 16px;
                    border-bottom: 1px solid #dbeafe;
                    background: #eff6ff;
                }

                .selected-users-header h3 {
                    margin: 0 0 4px;
                    font-size: 14px;
                }

                .selected-users-header span {
                    color: #64748b;
                    font-size: 11px;
                }

                .selection-actions {
                    display: flex;
                    gap: 8px;
                }

                .selection-actions button {
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #2563eb;
                    padding: 7px 10px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .selection-actions button:hover {
                    background: #dbeafe;
                }

                .users-selection-list {
                    display: grid;
                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );
                    gap: 15px;
                    padding: 15px;
                }

                .user-group {
                    min-width: 0;
                }

                .user-group h4 {
                    margin: 0 0 9px;
                    font-size: 12px;
                    color: #334155;
                }

                .user-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 9px;
                    margin-bottom: 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 9px;
                    background: #ffffff;
                    cursor: pointer;
                }

                .user-checkbox:hover {
                    border-color: #bfdbfe;
                    background: #f8fbff;
                }

                .user-checkbox input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .checkbox-custom {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border: 1px solid #cbd5e1;
                    border-radius: 5px;
                    color: transparent;
                    font-size: 11px;
                    font-weight: 800;
                }

                .user-checkbox input:checked
                    + .checkbox-custom {
                    border-color: #2563eb;
                    background: #2563eb;
                    color: #ffffff;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .user-info strong {
                    overflow: hidden;
                    color: #334155;
                    font-size: 11px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .user-info small {
                    overflow: hidden;
                    margin-top: 2px;
                    color: #94a3b8;
                    font-size: 10px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .empty-users {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 11px;
                }

                .users-loading {
                    padding: 20px;
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                }

                /* ALERTS */

                .notification-success,
                .notification-error {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 11px 13px;
                    margin-bottom: 15px;
                    border-radius: 9px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .notification-success {
                    border: 1px solid #bbf7d0;
                    background: #f0fdf4;
                    color: #15803d;
                }

                .notification-error {
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    color: #b91c1c;
                }

                .notification-success span:first-child,
                .notification-error span:first-child {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .notification-success span:first-child {
                    background: #dcfce7;
                }

                .notification-error span:first-child {
                    background: #fee2e2;
                }

                /* FOOTER */

                .notification-form-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding-top: 4px;
                }

                .notification-hint {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .notification-footer-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .cancel-notification-button {
                    height: 44px;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #475569;
                    padding: 0 16px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .cancel-notification-button:hover {
                    background: #f8fafc;
                }

                .send-notification-button {
                    min-width: 165px;
                    height: 44px;
                    border: 0;
                    border-radius: 10px;
                    background: #2563eb;
                    color: #ffffff;
                    padding: 0 18px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition:
                        background 0.2s,
                        transform 0.2s;
                }

                .send-notification-button:hover:not(
                    :disabled
                ) {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .send-notification-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                /* TABLET */

                @media (max-width: 1200px) {

                    .stat-grid {
                        grid-template-columns:
                            repeat(
                                3,
                                minmax(0, 1fr)
                            );
                    }

                    .quick-actions-grid {
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0, 1fr)
                            );
                    }

                }

                /* MOBILE */

                @media (max-width: 768px) {

                    .admin-dashboard {
                        padding: 18px;
                    }

                    .admin-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .admin-header-actions {
                        width: 100%;
                        justify-content: flex-start;
                    }

                    .stat-grid,
                    .chart-grid,
                    .quick-actions-grid,
                    .users-selection-list {
                        grid-template-columns: 1fr;
                    }

                    .chart-card {
                        padding: 15px;
                    }

                    .notification-modal-overlay {
                        padding: 10px;
                    }

                    .notification-modal {
                        max-height: 94vh;
                        border-radius: 14px;
                    }

                    .notification-form {
                        padding: 16px;
                    }

                    .selected-users-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .selection-actions {
                        width: 100%;
                    }

                    .selection-actions button {
                        flex: 1;
                    }

                    .notification-form-footer {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .notification-footer-actions {
                        width: 100%;
                    }

                    .cancel-notification-button,
                    .send-notification-button {
                        flex: 1;
                    }

                    .notification-hint {
                        align-items: flex-start;
                    }

                }

                @media (max-width: 480px) {

                    .admin-dashboard {
                        padding: 13px;
                    }

                    .admin-header h1 {
                        font-size: 25px;
                    }

                    .stat-card {
                        padding: 16px;
                    }

                    .stat-value {
                        font-size: 23px;
                    }

                    .section-heading h2 {
                        font-size: 18px;
                    }

                    .admin-header-actions {
                        gap: 7px;
                    }

                    .admin-help-button {
                        width: 40px;
                        height: 40px;
                    }

                    .admin-help-button svg {
                        width: 19px;
                        height: 19px;
                    }

                    .refresh-button {
                        padding: 9px 12px;
                    }

                    .notification-open-box {
                        padding: 16px;
                    }

                    .notification-open-icon {
                        width: 45px;
                        height: 45px;
                    }

                    .notification-open-arrow {
                        font-size: 20px;
                    }

                    .notification-modal-header {
                        padding: 16px;
                    }

                    .notification-modal-title h2 {
                        font-size: 17px;
                    }

                    .notification-footer-actions {
                        flex-direction: column;
                    }

                    .cancel-notification-button,
                    .send-notification-button {
                        width: 100%;
                    }

                }

            `}</style>
        </div>
    );
}

export default AdminDashboard;