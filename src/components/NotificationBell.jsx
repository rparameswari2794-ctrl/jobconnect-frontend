import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

// =========================================================
// NOTIFICATION API
// =========================================================
//
// Shared notification endpoint.
//
// Django:
// /api/auth/jobseeker/notifications/
//
// IMPORTANT:
// The backend NotificationListView uses:
//
//     recipient=request.user
//
// Therefore the same endpoint can return:
// - Admin notifications for admin users
// - Jobseeker notifications for jobseekers
// - Employer notifications for employers
//
// =========================================================

const NOTIFICATION_BASE =
  `${API_BASE}/auth/jobseeker/notifications`;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const mountedRef = useRef(true);

  // =========================================================
  // AUTH
  // =========================================================

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("jc_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token")
    );
  }, []);

  const authHeaders = useCallback(() => {
    const token = getToken();

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [getToken]);

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = useCallback(async () => {
    const token = getToken();

    if (!token) {
      console.warn(
        "NotificationBell: JWT access token not found."
      );
      return;
    }

    try {
      if (mountedRef.current) {
        setLoading(true);
      }

      const response = await fetch(
        `${NOTIFICATION_BASE}/`,
        {
          method: "GET",
          headers: authHeaders(),
          cache: "no-store",
        }
      );

      // -----------------------------------------------------
      // UNAUTHORIZED
      // -----------------------------------------------------

      if (response.status === 401) {
        console.warn(
          "NotificationBell: authentication failed."
        );

        if (mountedRef.current) {
          setNotifications([]);
        }

        return;
      }

      // -----------------------------------------------------
      // OTHER ERRORS
      // -----------------------------------------------------

      if (!response.ok) {
        let errorMessage = "";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.detail ||
            errorData?.message ||
            "";
        } catch {
          // Response was not JSON
        }

        console.error(
          "Notification request failed:",
          response.status,
          errorMessage
        );

        return;
      }

      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      const data = await response.json();

      /*
       * Backend currently returns something like:
       *
       * {
       *     "notifications": [...],
       *     "unread_count": 1
       * }
       *
       * But this component also supports:
       *
       * [
       *     {...}
       * ]
       *
       * {
       *     "results": [...]
       * }
       */

      let notificationList = [];

      if (Array.isArray(data)) {
        notificationList = data;
      } else if (
        Array.isArray(data?.notifications)
      ) {
        notificationList = data.notifications;
      } else if (
        Array.isArray(data?.results)
      ) {
        notificationList = data.results;
      }

      // -----------------------------------------------------
      // SORT NEWEST FIRST
      // -----------------------------------------------------

      notificationList = [...notificationList].sort(
        (a, b) => {
          const dateA = new Date(
            a?.created_at || 0
          ).getTime();

          const dateB = new Date(
            b?.created_at || 0
          ).getTime();

          return dateB - dateA;
        }
      );

      if (mountedRef.current) {
        setNotifications(notificationList);
      }
    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [authHeaders, getToken]);

  // =========================================================
  // INITIAL LOAD + POLLING
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    loadNotifications();

    // Refresh every 15 seconds.
    //
    // This means when a new jobseeker submits a profile,
    // the admin notification should appear automatically
    // within approximately 15 seconds.
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // =========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

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

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================

  const markAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const token = getToken();

    if (!token) {
      console.warn(
        "Cannot mark notification as read: token missing."
      );
      return;
    }

    try {
      const response = await fetch(
        `${NOTIFICATION_BASE}/${notificationId}/read/`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        console.warn(
          "Cannot mark notification as read: unauthorized."
        );
        return;
      }

      if (!response.ok) {
        let errorMessage = "";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.detail ||
            errorData?.message ||
            "";
        } catch {
          // Ignore non-JSON response
        }

        console.error(
          "Failed to mark notification as read:",
          response.status,
          errorMessage
        );

        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    const token = getToken();

    if (!token) {
      console.warn(
        "Cannot mark all notifications as read: token missing."
      );
      return;
    }

    try {
      const response = await fetch(
        `${NOTIFICATION_BASE}/read-all/`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        console.warn(
          "Cannot mark all notifications as read: unauthorized."
        );
        return;
      }

      if (!response.ok) {
        let errorMessage = "";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.detail ||
            errorData?.message ||
            "";
        } catch {
          // Ignore non-JSON response
        }

        console.error(
          "Failed to mark all notifications as read:",
          response.status,
          errorMessage
        );

        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = async (
    notificationId
  ) => {
    if (!notificationId) {
      return;
    }

    const token = getToken();

    if (!token) {
      console.warn(
        "Cannot delete notification: token missing."
      );
      return;
    }

    try {
      const response = await fetch(
        `${NOTIFICATION_BASE}/${notificationId}/`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        console.warn(
          "Cannot delete notification: unauthorized."
        );
        return;
      }

      if (!response.ok) {
        let errorMessage = "";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.detail ||
            errorData?.message ||
            "";
        } catch {
          // Ignore non-JSON response
        }

        console.error(
          "Failed to delete notification:",
          response.status,
          errorMessage
        );

        return;
      }

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) =>
      !notification.is_read
  ).length;

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (type) => {
    switch (String(type || "").toUpperCase()) {
      case "JOB":
        return "💼";

      case "PROFILE":
        return "👤";

      case "APPLICATION":
        return "📄";

      case "MESSAGE":
        return "💬";

      case "APPROVAL":
        return "✅";

      case "REJECTION":
        return "❌";

      case "ADMIN":
        return "🔔";

      default:
        return "🔔";
    }
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

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
  };

  // =========================================================
  // BELL CLICK
  // =========================================================

  const handleBellClick = () => {
    setOpen((previous) => !previous);

    // Refresh immediately when opening.
    if (!open) {
      loadNotifications();
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="notification-wrapper"
      ref={dropdownRef}
    >
      {/* ===================================================
          BELL BUTTON
      =================================================== */}

      <button
        type="button"
        className={`notification-bell-button ${
          open
            ? "notification-bell-active"
            : ""
        }`}
        onClick={handleBellClick}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        title={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
      >
        <span className="notification-bell-icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      {open && (
        <div className="notification-dropdown">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="notification-header">
            <div>
              <h3>Notifications</h3>

              <span>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="notification-list">

            {/* LOADING */}

            {loading &&
            notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  ⏳
                </div>

                <p>
                  Loading notifications...
                </p>
              </div>

            ) : notifications.length === 0 ? (

              /* EMPTY */

              <div className="notification-empty">
                <div className="notification-empty-icon">
                  🔔
                </div>

                <p>
                  No notifications yet
                </p>

                <small>
                  New updates will appear here.
                </small>
              </div>

            ) : (

              /* NOTIFICATIONS */

              notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      !notification.is_read
                        ? "notification-unread"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        !notification.is_read
                      ) {
                        markAsRead(
                          notification.id
                        );
                      }
                    }}
                  >
                    {/* =================================================
                        ICON
                    ================================================= */}

                    <div className="notification-item-icon">
                      {getNotificationIcon(
                        notification.notification_type
                      )}
                    </div>

                    {/* =================================================
                        CONTENT
                    ================================================= */}

                    <div className="notification-item-content">

                      <div className="notification-item-top">
                        <strong>
                          {notification.title ||
                            "Notification"}
                        </strong>

                        {!notification.is_read && (
                          <span className="unread-dot" />
                        )}
                      </div>

                      <p>
                        {notification.message ||
                          ""}
                      </p>

                      <small>
                        {formatDate(
                          notification.created_at
                        )}
                      </small>

                    </div>

                    {/* =================================================
                        DELETE BUTTON
                    ================================================= */}

                    <button
                      type="button"
                      className="notification-delete-button"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={(event) => {
                        event.stopPropagation();

                        deleteNotification(
                          notification.id
                        );
                      }}
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

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        /* ===================================================
           WRAPPER
        =================================================== */

        .notification-wrapper {
          position: relative;
          z-index: 1000;
        }


        /* ===================================================
           BELL BUTTON
        =================================================== */

        .notification-bell-button {
          position: relative;

          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid #e5e7eb;
          border-radius: 12px;

          background: #ffffff;

          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }


        .notification-bell-button:hover {
          background: #f8fafc;

          border-color: #c7d2fe;

          transform: translateY(-1px);

          box-shadow:
            0 6px 18px
            rgba(15, 23, 42, 0.10);
        }


        .notification-bell-active {
          background: #eef2ff;

          border-color: #818cf8;
        }


        .notification-bell-icon {
          font-size: 21px;

          line-height: 1;
        }


        /* ===================================================
           BADGE
        =================================================== */

        .notification-badge {
          position: absolute;

          top: -6px;
          right: -6px;

          min-width: 21px;
          height: 21px;

          padding: 0 5px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 999px;

          background: #ef4444;

          border: 2px solid #ffffff;

          color: #ffffff;

          font-size: 9px;
          font-weight: 800;

          line-height: 1;
        }


        /* ===================================================
           DROPDOWN
        =================================================== */

        .notification-dropdown {
          position: absolute;

          top: calc(100% + 12px);
          right: 0;

          width: 390px;
          max-width: calc(100vw - 24px);

          background: #ffffff;

          border: 1px solid #e5e7eb;

          border-radius: 16px;

          overflow: hidden;

          box-shadow:
            0 18px 50px
            rgba(15, 23, 42, 0.16);
        }


        /* ===================================================
           HEADER
        =================================================== */

        .notification-header {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 12px;

          padding: 17px 18px;

          border-bottom:
            1px solid #eef0f4;
        }


        .notification-header h3 {
          margin: 0;

          color: #111827;

          font-size: 16px;
          font-weight: 800;
        }


        .notification-header span {
          display: block;

          margin-top: 3px;

          color: #94a3b8;

          font-size: 10px;
        }


        .mark-all-button {
          border: 0;

          background: transparent;

          color: #4f46e5;

          font-size: 10px;
          font-weight: 700;

          cursor: pointer;
        }


        .mark-all-button:hover {
          text-decoration: underline;
        }


        /* ===================================================
           LIST
        =================================================== */

        .notification-list {
          max-height: 470px;

          overflow-y: auto;
        }


        /* ===================================================
           ITEM
        =================================================== */

        .notification-item {
          position: relative;

          display: flex;

          align-items: flex-start;

          gap: 11px;

          padding: 15px 14px;

          border-bottom:
            1px solid #f1f5f9;

          cursor: pointer;

          transition:
            background 0.2s ease;
        }


        .notification-item:hover {
          background: #f8fafc;
        }


        .notification-item:last-child {
          border-bottom: 0;
        }


        .notification-unread {
          background: #f5f7ff;
        }


        /* ===================================================
           ICON
        =================================================== */

        .notification-item-icon {
          width: 38px;
          height: 38px;

          min-width: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: #eef2ff;

          font-size: 17px;
        }


        /* ===================================================
           CONTENT
        =================================================== */

        .notification-item-content {
          min-width: 0;

          flex: 1;
        }


        .notification-item-top {
          display: flex;

          align-items: center;

          gap: 7px;
        }


        .notification-item-top strong {
          color: #1e293b;

          font-size: 12px;

          font-weight: 800;

          line-height: 1.35;

          word-break: break-word;
        }


        .unread-dot {
          width: 7px;
          height: 7px;

          min-width: 7px;

          border-radius: 50%;

          background: #4f46e5;
        }


        .notification-item-content p {
          margin: 5px 0 5px;

          color: #64748b;

          font-size: 11px;

          line-height: 1.45;

          word-break: break-word;
        }


        .notification-item-content small {
          display: block;

          color: #94a3b8;

          font-size: 9px;
        }


        /* ===================================================
           DELETE BUTTON
        =================================================== */

        .notification-delete-button {
          width: 25px;
          height: 25px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border: 0;

          border-radius: 7px;

          background: transparent;

          color: #94a3b8;

          font-size: 17px;

          cursor: pointer;
        }


        .notification-delete-button:hover {
          background: #fee2e2;

          color: #dc2626;
        }


        /* ===================================================
           EMPTY STATE
        =================================================== */

        .notification-empty {
          min-height: 190px;

          display: flex;

          align-items: center;
          justify-content: center;

          flex-direction: column;

          padding: 30px;

          text-align: center;
        }


        .notification-empty-icon {
          margin-bottom: 10px;

          font-size: 34px;
        }


        .notification-empty p {
          margin: 0;

          color: #475569;

          font-size: 13px;
          font-weight: 700;
        }


        .notification-empty small {
          margin-top: 5px;

          color: #94a3b8;

          font-size: 10px;
        }


        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 500px) {

          .notification-dropdown {
            position: fixed;

            top: 72px;
            right: 12px;
            left: 12px;

            width: auto;
            max-width: none;
          }

        }

      `}</style>
    </div>
  );
};

export default NotificationBell;

