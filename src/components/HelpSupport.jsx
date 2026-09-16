import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

/*
 * USER:
 *   /api/admin/help/
 *
 * ADMIN:
 *   /api/admin/admin/help/
 */

const USER_HELP_API = `${API_BASE}/admin/help`;
const ADMIN_HELP_API = `${API_BASE}/admin/admin/help`;

/* =========================================================
   TOKEN HELPERS
========================================================= */

function normalizeToken(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "object") {
        value =
            value.access ||
            value.access_token ||
            value.token ||
            value.jc_token ||
            "";
    }

    if (typeof value !== "string") {
        return "";
    }

    value = value.trim();

    if (
        (value.startsWith("{") && value.endsWith("}")) ||
        (value.startsWith('"') && value.endsWith('"'))
    ) {
        try {
            const parsed = JSON.parse(value);

            if (typeof parsed === "string") {
                value = parsed.trim();
            } else if (parsed && typeof parsed === "object") {
                value =
                    parsed.access ||
                    parsed.access_token ||
                    parsed.token ||
                    parsed.jc_token ||
                    "";
            }
        } catch {
            // Keep original value.
        }
    }

    if (typeof value !== "string") {
        return "";
    }

    value = value.trim();

    if (/^Bearer\s+/i.test(value)) {
        value = value.replace(/^Bearer\s+/i, "").trim();
    }

    return value;
}

function getToken() {
    const possibleKeys = [
        "jc_token",
        "access",
        "access_token",
        "accessToken",
        "token",
        "jwt",
        "authToken",
    ];

    for (const storage of [localStorage, sessionStorage]) {
        for (const key of possibleKeys) {
            const rawValue = storage.getItem(key);
            const token = normalizeToken(rawValue);

            if (token) {
                return token;
            }
        }
    }

    for (const storage of [localStorage, sessionStorage]) {
        const rawAuth = storage.getItem("auth");

        if (!rawAuth) {
            continue;
        }

        try {
            const auth = JSON.parse(rawAuth);

            const token = normalizeToken(
                auth?.access ||
                    auth?.access_token ||
                    auth?.token ||
                    auth?.jc_token
            );

            if (token) {
                return token;
            }
        } catch {
            const token = normalizeToken(rawAuth);

            if (token) {
                return token;
            }
        }
    }

    return "";
}

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
}

/* =========================================================
   STORED USER
========================================================= */

function getStoredUser() {
    const possibleKeys = ["jc_user", "user"];

    for (const storage of [localStorage, sessionStorage]) {
        for (const key of possibleKeys) {
            const value = storage.getItem(key);

            if (!value) {
                continue;
            }

            try {
                const parsed = JSON.parse(value);

                if (parsed && typeof parsed === "object") {
                    return parsed;
                }
            } catch {
                // Ignore invalid JSON.
            }
        }
    }

    return null;
}

function getUserRole(user) {
    if (!user) {
        return "";
    }

    if (
        user.is_staff === true ||
        user.is_superuser === true ||
        String(user.role || "").toLowerCase() === "admin"
    ) {
        return "admin";
    }

    return String(user.role || "").toLowerCase();
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

function normalizeStatus(value) {
    return String(value || "OPEN").trim().toUpperCase();
}

function extractRequestList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.help_requests)) {
        return data.help_requests;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    if (Array.isArray(data?.requests)) {
        return data.requests;
    }

    return [];
}

function extractRequest(data) {
    return (
        data?.help_request ||
        data?.request ||
        data
    );
}

/* =========================================================
   COMPONENT
========================================================= */

function HelpSupport() {
    const navigate = useNavigate();

    const storedUser = useMemo(
        () => getStoredUser(),
        []
    );

    const userRole = useMemo(
        () => getUserRole(storedUser),
        [storedUser]
    );

    const isAdmin = userRole === "admin";

    /* =====================================================
       STATE
    ===================================================== */

    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
     * BOTH ADMIN AND USERS HAVE:
     *
     * Active
     * History
     */
    const [activeTab, setActiveTab] =
        useState("active");

    const [showNewRequest, setShowNewRequest] =
        useState(false);

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [replyMessage, setReplyMessage] =
        useState("");

    const [creatingRequest, setCreatingRequest] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    /* =====================================================
       CONFIRMATION MODAL
    ===================================================== */

    const [confirmModal, setConfirmModal] =
        useState({
            open: false,
            title: "",
            message: "",
            confirmText: "Confirm",
            cancelText: "Cancel",
            danger: false,
            action: null,
        });

    const closeConfirmModal = useCallback(() => {
        setConfirmModal({
            open: false,
            title: "",
            message: "",
            confirmText: "Confirm",
            cancelText: "Cancel",
            danger: false,
            action: null,
        });
    }, []);

    const showConfirmModal = useCallback(
        ({
            title,
            message,
            confirmText = "Confirm",
            cancelText = "Cancel",
            danger = false,
            action,
        }) => {
            setConfirmModal({
                open: true,
                title,
                message,
                confirmText,
                cancelText,
                danger,
                action,
            });
        },
        []
    );

    const handleConfirmAction = async () => {
        const action = confirmModal.action;

        closeConfirmModal();

        if (typeof action === "function") {
            await action();
        }
    };

    /* =====================================================
       UNAUTHORIZED
    ===================================================== */

    const handleUnauthorized = useCallback(() => {
        console.warn(
            "Help & Support API returned 401."
        );

        setLoading(false);
        setLoadingDetails(false);
        setActionLoading(false);
        setCreatingRequest(false);

        setError(
            "Help & Support could not authenticate this request. Your login session has not been removed. Please refresh the page."
        );
    }, []);

    /* =====================================================
       RESPONSE ERROR
    ===================================================== */

    const handleResponseError = useCallback(
        async (response, fallbackMessage) => {
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            let detail = "";

            try {
                const data = await response.json();

                if (typeof data === "string") {
                    detail = data;
                } else if (data?.detail) {
                    detail = data.detail;
                } else if (data?.message) {
                    detail = data.message;
                } else if (data?.error) {
                    detail = data.error;
                } else if (data?.errors) {
                    detail =
                        JSON.stringify(data.errors);
                }
            } catch {
                // Non-JSON response.
            }

            setError(
                detail || fallbackMessage
            );
        },
        [handleUnauthorized]
    );

    /* =====================================================
       FETCH REQUESTS
    ===================================================== */

    const fetchRequests = useCallback(
        async (silent = false) => {
            const token = getToken();

            if (!token) {
                setLoading(false);

                setError(
                    "No login token was found for Help & Support. Please refresh the page."
                );

                return;
            }

            if (!silent) {
                setLoading(true);
                setError("");
            }

            try {
                /*
                 * IMPORTANT:
                 *
                 * ADMIN:
                 *   Active  -> OPEN
                 *   History -> RESOLVED
                 *
                 * USER:
                 *   Active  -> OPEN
                 *   History -> RESOLVED
                 */

                const status =
                    activeTab === "history"
                        ? "RESOLVED"
                        : "OPEN";

                const endpoint = isAdmin
                    ? `${ADMIN_HELP_API}/?status=${status}`
                    : `${USER_HELP_API}/?status=${status}`;

                console.log(
                    "Help & Support GET:",
                    endpoint
                );

                const response = await fetch(
                    endpoint,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    await handleResponseError(
                        response,
                        "Unable to load Help & Support requests."
                    );

                    return;
                }

                const data =
                    await response.json();

                console.log(
                    "Help & Support response:",
                    data
                );

                const list =
                    extractRequestList(data);

                setRequests(list);

                /*
                 * If selected request is no longer
                 * in current tab, remove selection.
                 */

                setSelectedRequest(
                    (previous) => {
                        if (!previous) {
                            return previous;
                        }

                        const stillExists =
                            list.some(
                                (item) =>
                                    Number(item.id) ===
                                    Number(
                                        previous.id
                                    )
                            );

                        return stillExists
                            ? previous
                            : null;
                    }
                );
            } catch (err) {
                console.error(
                    "Help requests fetch error:",
                    err
                );

                if (!silent) {
                    setError(
                        "Unable to connect to Help & Support. Please check that the backend is running."
                    );
                }
            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
        },
        [
            activeTab,
            isAdmin,
            handleResponseError,
        ]
    );

    /* =====================================================
       FETCH SINGLE REQUEST
    ===================================================== */

    const fetchRequestDetails = useCallback(
        async (requestId, silent = false) => {
            const token = getToken();

            if (!token) {
                setLoadingDetails(false);

                if (!silent) {
                    setError(
                        "No login token was found. Please refresh the page."
                    );
                }

                return;
            }

            if (!silent) {
                setLoadingDetails(true);
                setError("");
            }

            try {
                /*
                 * Always fetch the actual detail endpoint
                 * for both admin and users.
                 *
                 * This guarantees that the latest
                 * admin reply appears.
                 */

                const endpoint = isAdmin
                    ? `${ADMIN_HELP_API}/${requestId}/`
                    : `${USER_HELP_API}/${requestId}/`;

                console.log(
                    "Help & Support DETAIL GET:",
                    endpoint
                );

                const response = await fetch(
                    endpoint,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    await handleResponseError(
                        response,
                        "Unable to load this Help & Support conversation."
                    );

                    return;
                }

                const data =
                    await response.json();

                const request =
                    extractRequest(data);

                if (request?.id) {
                    setSelectedRequest(request);
                }
            } catch (err) {
                console.error(
                    "Help request detail error:",
                    err
                );

                if (!silent) {
                    setError(
                        "Unable to load the selected Help & Support conversation."
                    );
                }
            } finally {
                if (!silent) {
                    setLoadingDetails(false);
                }
            }
        },
        [
            isAdmin,
            handleResponseError,
        ]
    );

    /* =====================================================
       SELECT REQUEST
    ===================================================== */

    const openRequest = async (request) => {
        if (!request?.id) {
            return;
        }

        setError("");
        setSuccess("");

        /*
         * Show immediately.
         */

        setSelectedRequest(request);

        /*
         * Mark read.
         */

        if (request.is_read === false) {
            await markRequestRead(
                request.id,
                true
            );
        }

        /*
         * Then fetch complete conversation.
         */

        await fetchRequestDetails(
            request.id
        );
    };

    /* =====================================================
       MARK REQUEST READ
    ===================================================== */

    const markRequestRead = useCallback(
        async (
            requestId,
            silent = false
        ) => {
            const token = getToken();

            if (!token) {
                if (!silent) {
                    setError(
                        "No login token was found."
                    );
                }

                return;
            }

            try {
                const endpoint = isAdmin
                    ? `${ADMIN_HELP_API}/${requestId}/read/`
                    : `${USER_HELP_API}/${requestId}/read/`;

                const response = await fetch(
                    endpoint,
                    {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    await handleResponseError(
                        response,
                        "Unable to mark this request as read."
                    );

                    return;
                }

                setRequests(
                    (previous) =>
                        previous.map(
                            (item) =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    requestId
                                )
                                    ? {
                                          ...item,
                                          is_read: true,
                                      }
                                    : item
                        )
                );

                setSelectedRequest(
                    (previous) =>
                        previous &&
                        Number(
                            previous.id
                        ) ===
                            Number(
                                requestId
                            )
                            ? {
                                  ...previous,
                                  is_read: true,
                              }
                            : previous
                );
            } catch (err) {
                console.error(
                    "Mark read error:",
                    err
                );

                if (!silent) {
                    setError(
                        "Unable to mark the request as read."
                    );
                }
            }
        },
        [
            isAdmin,
            handleResponseError,
        ]
    );

    /* =====================================================
       CREATE REQUEST
    ===================================================== */

    const createRequest = async (
        event
    ) => {
        event.preventDefault();

        const cleanSubject =
            subject.trim();

        const cleanMessage =
            message.trim();

        if (!cleanSubject) {
            setError(
                "Please enter a subject."
            );
            return;
        }

        if (!cleanMessage) {
            setError(
                "Please describe your problem."
            );
            return;
        }

        const token = getToken();

        if (!token) {
            setError(
                "No login token was found."
            );
            return;
        }

        setCreatingRequest(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${USER_HELP_API}/`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        subject:
                            cleanSubject,
                        message:
                            cleanMessage,
                    }),
                }
            );

            if (!response.ok) {
                await handleResponseError(
                    response,
                    "Unable to submit your Help & Support request."
                );

                return;
            }

            const data =
                await response.json();

            console.log(
                "Created Help Request:",
                data
            );

            const createdRequest =
                extractRequest(data);

            const createdId =
                createdRequest?.id;

            setSubject("");
            setMessage("");
            setShowNewRequest(false);

            setSuccess(
                "Your Help & Support request has been submitted successfully."
            );

            /*
             * Make sure we are on Active tab.
             */

            if (activeTab !== "active") {
                setActiveTab("active");
            }

            /*
             * Reload active requests.
             */

            if (createdId) {
                /*
                 * Show newly created request
                 * immediately if response contains it.
                 */

                if (createdRequest?.id) {
                    setSelectedRequest(
                        createdRequest
                    );
                }

                /*
                 * Fetch fresh conversation.
                 */

                await fetchRequestDetails(
                    createdId
                );
            }

            await fetchRequests();
        } catch (err) {
            console.error(
                "Create help request error:",
                err
            );

            setError(
                "Unable to submit the Help & Support request."
            );
        } finally {
            setCreatingRequest(false);
        }
    };

    /* =====================================================
       ADMIN REPLY
    ===================================================== */

    const sendReply = async () => {
        if (!selectedRequest?.id) {
            return;
        }

        const cleanReply =
            replyMessage.trim();

        if (!cleanReply) {
            setError(
                "Please enter a reply."
            );

            return;
        }

        const token = getToken();

        if (!token) {
            setError(
                "No login token was found."
            );

            return;
        }

        setActionLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${ADMIN_HELP_API}/${selectedRequest.id}/reply/`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        message:
                            cleanReply,
                    }),
                }
            );

            if (!response.ok) {
                await handleResponseError(
                    response,
                    "Unable to send the reply."
                );

                return;
            }

            const data =
                await response.json();

            console.log(
                "Admin reply response:",
                data
            );

            setReplyMessage("");

            setSuccess(
                "Reply sent successfully."
            );

            /*
             * Get latest conversation.
             */

            const returnedRequest =
                extractRequest(data);

            if (returnedRequest?.id) {
                setSelectedRequest(
                    returnedRequest
                );
            }

            await fetchRequestDetails(
                selectedRequest.id
            );

            await fetchRequests(true);
        } catch (err) {
            console.error(
                "Reply error:",
                err
            );

            setError(
                "Unable to send the reply."
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =====================================================
       ADMIN RESOLVE
    ===================================================== */

    const performResolveRequest =
        async (requestId) => {
            if (!requestId) {
                return;
            }

            const token = getToken();

            if (!token) {
                setError(
                    "No login token was found."
                );

                return;
            }

            setActionLoading(true);
            setError("");
            setSuccess("");

            try {
                const response = await fetch(
                    `${ADMIN_HELP_API}/${requestId}/resolve/`,
                    {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    await handleResponseError(
                        response,
                        "Unable to resolve this request."
                    );

                    return;
                }

                const data =
                    await response.json();

                console.log(
                    "Resolve response:",
                    data
                );

                setSuccess(
                    "The Help & Support request has been resolved."
                );

                /*
                 * Remove from Active list.
                 */

                setRequests(
                    (previous) =>
                        previous.filter(
                            (item) =>
                                Number(
                                    item.id
                                ) !==
                                Number(
                                    requestId
                                )
                        )
                );

                setSelectedRequest(null);

                /*
                 * Refresh active list.
                 */

                await fetchRequests(true);
            } catch (err) {
                console.error(
                    "Resolve request error:",
                    err
                );

                setError(
                    "Unable to resolve this request."
                );
            } finally {
                setActionLoading(false);
            }
        };

    const resolveRequest = () => {
        if (!selectedRequest?.id) {
            return;
        }

        const requestId =
            selectedRequest.id;

        showConfirmModal({
            title:
                "Resolve Support Request",
            message:
                "Are you sure you want to mark this Help & Support request as resolved?",
            confirmText:
                "Yes, Resolve",
            cancelText:
                "Cancel",
            danger: false,
            action: () =>
                performResolveRequest(
                    requestId
                ),
        });
    };

    /* =====================================================
       ADMIN DELETE
    ===================================================== */

    const performDeleteRequest =
        async (requestId) => {
            if (!requestId) {
                return;
            }

            const token = getToken();

            if (!token) {
                setError(
                    "No login token was found."
                );

                return;
            }

            setActionLoading(true);
            setError("");
            setSuccess("");

            try {
                const response = await fetch(
                    `${ADMIN_HELP_API}/${requestId}/delete/`,
                    {
                        method: "DELETE",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    await handleResponseError(
                        response,
                        "Unable to delete this request."
                    );

                    return;
                }

                setRequests(
                    (previous) =>
                        previous.filter(
                            (item) =>
                                Number(
                                    item.id
                                ) !==
                                Number(
                                    requestId
                                )
                        )
                );

                setSelectedRequest(null);

                setSuccess(
                    "Help & Support request deleted successfully."
                );
            } catch (err) {
                console.error(
                    "Delete request error:",
                    err
                );

                setError(
                    "Unable to delete this request."
                );
            } finally {
                setActionLoading(false);
            }
        };

    const deleteRequest = () => {
        if (!selectedRequest?.id) {
            return;
        }

        const requestId =
            selectedRequest.id;

        showConfirmModal({
            title:
                "Delete Support Request",
            message:
                "Delete this Help & Support request permanently? This action cannot be undone.",
            confirmText:
                "Yes, Delete",
            cancelText:
                "Cancel",
            danger: true,
            action: () =>
                performDeleteRequest(
                    requestId
                ),
        });
    };

    /* =====================================================
       LOAD REQUESTS
    ===================================================== */

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    /* =====================================================
       AUTO REFRESH
    *
    * This allows users to see admin replies without
    * manually refreshing the browser.
    ===================================================== */

    useEffect(() => {
        const interval =
            setInterval(() => {
                fetchRequests(true);

                if (selectedRequest?.id) {
                    fetchRequestDetails(
                        selectedRequest.id,
                        true
                    );
                }
            }, 10000);

        return () =>
            clearInterval(interval);
    }, [
        fetchRequests,
        fetchRequestDetails,
        selectedRequest?.id,
    ]);

    /* =====================================================
       FILTERED REQUESTS
    ===================================================== */

    const filteredRequests =
        useMemo(() => {
            const targetStatus =
                activeTab === "history"
                    ? "RESOLVED"
                    : "OPEN";

            return requests.filter(
                (request) =>
                    normalizeStatus(
                        request.status
                    ) === targetStatus
            );
        }, [
            requests,
            activeTab,
        ]);

    /* =====================================================
       UNREAD COUNT
    ===================================================== */

    const unreadCount =
        useMemo(() => {
            if (activeTab !== "active") {
                return 0;
            }

            return requests.filter(
                (request) =>
                    request.is_read ===
                        false &&
                    normalizeStatus(
                        request.status
                    ) !== "RESOLVED"
            ).length;
        }, [
            requests,
            activeTab,
        ]);

    /* =====================================================
       SELECTED MESSAGES
    ===================================================== */

    const selectedMessages =
        Array.isArray(
            selectedRequest?.messages
        )
            ? selectedRequest.messages
            : [];

    /* =====================================================
       BACK
    ===================================================== */

    const handleBack = () => {
        if (isAdmin) {
            navigate(
                "/admin/dashboard"
            );
        } else if (
            userRole === "employer"
        ) {
            navigate(
                "/employer/dashboard"
            );
        } else {
            navigate(
                "/jobseeker/dashboard"
            );
        }
    };

    /* =====================================================
       STYLES
    ===================================================== */

    const styles = {
        page: {
            minHeight: "100vh",
            background:
                "linear-gradient(135deg, #f7f9fc 0%, #eef4ff 100%)",
            padding: "30px",
            boxSizing: "border-box",
            fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#172033",
        },

        container: {
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
        },

        topBar: {
            display: "flex",
            justifyContent:
                "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
        },

        titleArea: {
            display: "flex",
            alignItems: "center",
            gap: "14px",
        },

        backButton: {
            border: "none",
            background: "#ffffff",
            color: "#334155",
            padding:
                "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow:
                "0 2px 10px rgba(15, 23, 42, 0.08)",
        },

        title: {
            margin: 0,
            fontSize: "30px",
            fontWeight: 800,
        },

        subtitle: {
            margin:
                "5px 0 0",
            color: "#64748b",
            fontSize: "14px",
        },

        newButton: {
            border: "none",
            background:
                "linear-gradient(135deg, #0f766e, #14b8a6)",
            color: "#ffffff",
            padding:
                "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 800,
            boxShadow:
                "0 5px 18px rgba(15, 118, 110, 0.25)",
        },

        alertError: {
            background: "#fff1f2",
            color: "#be123c",
            border:
                "1px solid #fecdd3",
            padding:
                "13px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontWeight: 600,
        },

        alertSuccess: {
            background: "#ecfdf5",
            color: "#047857",
            border:
                "1px solid #a7f3d0",
            padding:
                "13px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontWeight: 600,
        },

        tabs: {
            display: "flex",
            gap: "8px",
            marginBottom: "18px",
            borderBottom:
                "1px solid #e2e8f0",
        },

        tab: {
            border: "none",
            background:
                "transparent",
            padding:
                "12px 18px",
            cursor: "pointer",
            fontWeight: 700,
            color: "#64748b",
            borderBottom:
                "3px solid transparent",
        },

        activeTab: {
            color: "#0f766e",
            borderBottomColor:
                "#0f766e",
        },

        layout: {
            display: "grid",
            gridTemplateColumns:
                "380px minmax(0, 1fr)",
            gap: "20px",
            minHeight: "650px",
        },

        listPanel: {
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow:
                "0 8px 30px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection:
                "column",
        },

        listHeader: {
            padding:
                "18px 20px",
            borderBottom:
                "1px solid #e2e8f0",
            fontWeight: 800,
            display: "flex",
            justifyContent:
                "space-between",
            alignItems: "center",
        },

        unreadBadge: {
            background: "#ef4444",
            color: "#ffffff",
            borderRadius: "999px",
            minWidth: "24px",
            height: "24px",
            padding: "0 7px",
            display:
                "inline-flex",
            alignItems: "center",
            justifyContent:
                "center",
            fontSize: "12px",
            fontWeight: 800,
        },

        list: {
            overflowY: "auto",
            flex: 1,
        },

        requestItem: {
            padding:
                "17px 18px",
            borderBottom:
                "1px solid #edf2f7",
            cursor: "pointer",
        },

        selectedRequestItem: {
            background: "#f0fdfa",
            borderLeft:
                "4px solid #0f766e",
        },

        unreadRequestItem: {
            background: "#f8fafc",
        },

        requestSubject: {
            fontWeight: 800,
            marginBottom: "6px",
            color: "#1e293b",
        },

        requestPreview: {
            color: "#64748b",
            fontSize: "13px",
            lineHeight: 1.5,
        },

        requestMeta: {
            marginTop: "9px",
            display: "flex",
            justifyContent:
                "space-between",
            alignItems: "center",
            gap: "8px",
            color: "#94a3b8",
            fontSize: "11px",
            flexWrap: "wrap",
        },

        roleBadge: {
            display:
                "inline-flex",
            padding:
                "3px 7px",
            borderRadius: "999px",
            background: "#e0f2fe",
            color: "#0369a1",
            fontWeight: 800,
            fontSize: "10px",
            textTransform:
                "uppercase",
        },

        statusBadge: {
            display:
                "inline-flex",
            padding:
                "3px 8px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 800,
            textTransform:
                "uppercase",
        },

        detailPanel: {
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow:
                "0 8px 30px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection:
                "column",
            minWidth: 0,
        },

        detailHeader: {
            padding:
                "20px 22px",
            borderBottom:
                "1px solid #e2e8f0",
        },

        detailSubject: {
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
        },

        detailInfo: {
            marginTop: "9px",
            color: "#64748b",
            fontSize: "13px",
        },

        messages: {
            flex: 1,
            overflowY: "auto",
            padding: "22px",
            background: "#f8fafc",
        },

        messageBubble: {
            maxWidth: "78%",
            marginBottom:
                "14px",
            padding:
                "13px 15px",
            borderRadius: "14px",
            lineHeight: 1.55,
            whiteSpace:
                "pre-wrap",
            wordBreak:
                "break-word",
        },

        userMessage: {
            marginRight: "auto",
            background: "#ffffff",
            border:
                "1px solid #e2e8f0",
        },

        adminMessage: {
            marginLeft: "auto",
            background: "#ecfdf5",
            border:
                "1px solid #a7f3d0",
        },

        messageSender: {
            fontSize: "11px",
            fontWeight: 800,
            color: "#64748b",
            marginBottom: "5px",
        },

        messageTime: {
            fontSize: "10px",
            color: "#94a3b8",
            marginTop: "7px",
        },

        replyArea: {
            borderTop:
                "1px solid #e2e8f0",
            padding: "16px",
            background: "#ffffff",
        },

        textarea: {
            width: "100%",
            minHeight: "95px",
            resize: "vertical",
            border:
                "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "12px",
            boxSizing:
                "border-box",
            outline: "none",
            fontFamily:
                "inherit",
            fontSize: "14px",
        },

        actionRow: {
            display: "flex",
            justifyContent:
                "flex-end",
            gap: "9px",
            marginTop: "10px",
            flexWrap: "wrap",
        },

        actionButton: {
            border: "none",
            borderRadius: "9px",
            padding:
                "9px 14px",
            cursor: "pointer",
            fontWeight: 700,
        },

        empty: {
            padding:
                "50px 20px",
            textAlign: "center",
            color: "#94a3b8",
        },

        modalOverlay: {
            position: "fixed",
            inset: 0,
            background:
                "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent:
                "center",
            padding: "20px",
            zIndex: 99999,
        },

        modal: {
            width: "100%",
            maxWidth: "560px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow:
                "0 20px 60px rgba(15, 23, 42, 0.25)",
        },

        confirmModal: {
            width: "100%",
            maxWidth: "480px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "25px",
            boxShadow:
                "0 20px 60px rgba(15, 23, 42, 0.30)",
        },

        label: {
            display: "block",
            fontWeight: 700,
            marginBottom: "7px",
            color: "#334155",
        },

        input: {
            width: "100%",
            boxSizing:
                "border-box",
            border:
                "1px solid #cbd5e1",
            borderRadius: "9px",
            padding:
                "11px 12px",
            fontSize: "14px",
            marginBottom: "16px",
            outline: "none",
        },
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <div style={styles.topBar}>
                    <div style={styles.titleArea}>

                        <button
                            type="button"
                            style={
                                styles.backButton
                            }
                            onClick={
                                handleBack
                            }
                        >
                            ← Back
                        </button>

                        <div>
                            <h1
                                style={
                                    styles.title
                                }
                            >
                                Help & Support
                            </h1>

                            <p
                                style={
                                    styles.subtitle
                                }
                            >
                                {isAdmin
                                    ? "Manage JobConnect user support requests"
                                    : "Get help from the JobConnect support team"}
                            </p>
                        </div>
                    </div>

                    {!isAdmin && (
                        <button
                            type="button"
                            style={
                                styles.newButton
                            }
                            onClick={() => {
                                setError("");
                                setSuccess("");
                                setShowNewRequest(
                                    true
                                );
                            }}
                        >
                            + New Request
                        </button>
                    )}
                </div>

                {/* =================================================
                    ALERTS
                ================================================= */}

                {error && (
                    <div
                        style={
                            styles.alertError
                        }
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        style={
                            styles.alertSuccess
                        }
                    >
                        {success}
                    </div>
                )}

                {/* =================================================
                    ACTIVE / HISTORY TABS
                    BOTH ADMIN AND USERS
                ================================================= */}

                <div
                    style={
                        styles.tabs
                    }
                >
                    <button
                        type="button"
                        style={{
                            ...styles.tab,
                            ...(activeTab ===
                            "active"
                                ? styles.activeTab
                                : {}),
                        }}
                        onClick={() => {
                            setActiveTab(
                                "active"
                            );
                            setSelectedRequest(
                                null
                            );
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Active
                    </button>

                    <button
                        type="button"
                        style={{
                            ...styles.tab,
                            ...(activeTab ===
                            "history"
                                ? styles.activeTab
                                : {}),
                        }}
                        onClick={() => {
                            setActiveTab(
                                "history"
                            );
                            setSelectedRequest(
                                null
                            );
                            setError("");
                            setSuccess("");
                        }}
                    >
                        History
                    </button>
                </div>

                {/* =================================================
                    MAIN LAYOUT
                ================================================= */}

                <div
                    className="help-layout"
                    style={
                        styles.layout
                    }
                >

                    {/* =================================================
                        REQUEST LIST
                    ================================================= */}

                    <div
                        style={
                            styles.listPanel
                        }
                    >

                        <div
                            style={
                                styles.listHeader
                            }
                        >
                            <span>
                                {isAdmin
                                    ? activeTab ===
                                      "history"
                                        ? "Resolved History"
                                        : "Support Inbox"
                                    : activeTab ===
                                      "history"
                                    ? "My Resolved History"
                                    : "My Requests"}
                            </span>

                            {activeTab ===
                                "active" &&
                                unreadCount >
                                    0 && (
                                    <span
                                        style={
                                            styles.unreadBadge
                                        }
                                    >
                                        {
                                            unreadCount
                                        }
                                    </span>
                                )}
                        </div>

                        <div
                            style={
                                styles.list
                            }
                        >

                            {loading ? (
                                <div
                                    style={
                                        styles.empty
                                    }
                                >
                                    Loading requests...
                                </div>
                            ) : filteredRequests.length ===
                              0 ? (
                                <div
                                    style={
                                        styles.empty
                                    }
                                >
                                    <div
                                        style={{
                                            fontSize:
                                                "42px",
                                            marginBottom:
                                                "12px",
                                        }}
                                    >
                                        💬
                                    </div>

                                    {activeTab ===
                                    "history"
                                        ? isAdmin
                                            ? "No resolved support requests."
                                            : "You have no resolved Help & Support requests yet."
                                        : isAdmin
                                        ? "No active support requests."
                                        : "You have no active Help & Support requests."}
                                </div>
                            ) : (
                                filteredRequests.map(
                                    (
                                        request
                                    ) => {
                                        const selected =
                                            Number(
                                                selectedRequest?.id
                                            ) ===
                                            Number(
                                                request.id
                                            );

                                        const status =
                                            normalizeStatus(
                                                request.status
                                            );

                                        const role =
                                            String(
                                                request.user_role ||
                                                    request.sender_role ||
                                                    ""
                                            ).toLowerCase();

                                        const previewMessage =
                                            Array.isArray(
                                                request.messages
                                            ) &&
                                            request.messages
                                                .length >
                                                0
                                                ? request
                                                      .messages[
                                                      request
                                                          .messages
                                                          .length -
                                                          1
                                                  ]
                                                      ?.message
                                                : request.message ||
                                                  "";

                                        return (
                                            <div
                                                key={
                                                    request.id
                                                }
                                                style={{
                                                    ...styles.requestItem,
                                                    ...(selected
                                                        ? styles.selectedRequestItem
                                                        : {}),
                                                    ...(request.is_read ===
                                                    false
                                                        ? styles.unreadRequestItem
                                                        : {}),
                                                }}
                                                onClick={() =>
                                                    openRequest(
                                                        request
                                                    )
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.requestSubject
                                                    }
                                                >
                                                    {request.subject ||
                                                        "Support Request"}
                                                </div>

                                                <div
                                                    style={
                                                        styles.requestPreview
                                                    }
                                                >
                                                    {previewMessage
                                                        ? String(
                                                              previewMessage
                                                          ).slice(
                                                              0,
                                                              120
                                                          )
                                                        : "Open the request to view the conversation."}
                                                </div>

                                                <div
                                                    style={
                                                        styles.requestMeta
                                                    }
                                                >

                                                    {isAdmin && (
                                                        <>
                                                            <span>
                                                                {request.user_name ||
                                                                    "User"}
                                                            </span>

                                                            {role && (
                                                                <span
                                                                    style={
                                                                        styles.roleBadge
                                                                    }
                                                                >
                                                                    {
                                                                        role
                                                                    }
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {!isAdmin && (
                                                        <span>
                                                            {request.user_name ||
                                                                "You"}
                                                        </span>
                                                    )}

                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            background:
                                                                status ===
                                                                "RESOLVED"
                                                                    ? "#dcfce7"
                                                                    : "#fef3c7",
                                                            color:
                                                                status ===
                                                                "RESOLVED"
                                                                    ? "#166534"
                                                                    : "#92400e",
                                                        }}
                                                    >
                                                        {
                                                            status
                                                        }
                                                    </span>

                                                    <span>
                                                        {formatDate(
                                                            request.created_at
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                )
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        DETAIL PANEL
                    ================================================= */}

                    <div
                        style={
                            styles.detailPanel
                        }
                    >

                        {!selectedRequest ? (
                            <div
                                style={
                                    styles.empty
                                }
                            >
                                <div
                                    style={{
                                        fontSize:
                                            "42px",
                                        marginBottom:
                                            "12px",
                                    }}
                                >
                                    💬
                                </div>

                                <strong>
                                    Select a support request
                                </strong>

                                <div
                                    style={{
                                        marginTop:
                                            "7px",
                                    }}
                                >
                                    Choose a request from
                                    the list to view the
                                    complete conversation.
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* =================================================
                                    DETAIL HEADER
                                ================================================= */}

                                <div
                                    style={
                                        styles.detailHeader
                                    }
                                >
                                    <h2
                                        style={
                                            styles.detailSubject
                                        }
                                    >
                                        {selectedRequest.subject ||
                                            "Support Request"}
                                    </h2>

                                    <div
                                        style={
                                            styles.detailInfo
                                        }
                                    >
                                        {isAdmin && (
                                            <>
                                                <strong>
                                                    User:
                                                </strong>{" "}
                                                {selectedRequest.user_name ||
                                                    "Unknown user"}
                                                {" • "}
                                            </>
                                        )}

                                        <strong>
                                            Status:
                                        </strong>{" "}
                                        {normalizeStatus(
                                            selectedRequest.status
                                        )}

                                        {" • "}

                                        {formatDate(
                                            selectedRequest.created_at
                                        )}
                                    </div>
                                </div>

                                {/* =================================================
                                    MESSAGE HISTORY
                                ================================================= */}

                                <div
                                    style={
                                        styles.messages
                                    }
                                >
                                    {loadingDetails ? (
                                        <div
                                            style={
                                                styles.empty
                                            }
                                        >
                                            Loading conversation...
                                        </div>
                                    ) : selectedMessages.length ===
                                      0 ? (
                                        <div
                                            style={
                                                styles.empty
                                            }
                                        >
                                            <div
                                                style={{
                                                    fontSize:
                                                        "35px",
                                                    marginBottom:
                                                        "10px",
                                                }}
                                            >
                                                💬
                                            </div>

                                            No messages in this
                                            request.
                                        </div>
                                    ) : (
                                        selectedMessages.map(
                                            (
                                                item,
                                                index
                                            ) => {
                                                const senderRole =
                                                    String(
                                                        item.sender_role ||
                                                            item.role ||
                                                            ""
                                                    ).toLowerCase();

                                                const fromAdmin =
                                                    senderRole ===
                                                        "admin" ||
                                                    item.is_admin ===
                                                        true;

                                                return (
                                                    <div
                                                        key={
                                                            item.id ||
                                                            index
                                                        }
                                                        style={{
                                                            ...styles.messageBubble,
                                                            ...(fromAdmin
                                                                ? styles.adminMessage
                                                                : styles.userMessage),
                                                        }}
                                                    >
                                                        <div
                                                            style={
                                                                styles.messageSender
                                                            }
                                                        >
                                                            {fromAdmin
                                                                ? "JobConnect Admin"
                                                                : item.sender_name ||
                                                                  selectedRequest.user_name ||
                                                                  "You"}
                                                        </div>

                                                        <div>
                                                            {
                                                                item.message
                                                            }
                                                        </div>

                                                        <div
                                                            style={
                                                                styles.messageTime
                                                            }
                                                        >
                                                            {formatDate(
                                                                item.created_at
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )
                                    )}
                                </div>

                                {/* =================================================
                                    ADMIN ACTION AREA
                                ================================================= */}

                                {isAdmin ? (
                                    <div
                                        style={
                                            styles.replyArea
                                        }
                                    >

                                        {normalizeStatus(
                                            selectedRequest.status
                                        ) !==
                                            "RESOLVED" && (
                                            <>
                                                <textarea
                                                    value={
                                                        replyMessage
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setReplyMessage(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Type your reply to the user..."
                                                    style={
                                                        styles.textarea
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                />

                                                <div
                                                    style={
                                                        styles.actionRow
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            markRequestRead(
                                                                selectedRequest.id
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        style={{
                                                            ...styles.actionButton,
                                                            background:
                                                                "#e2e8f0",
                                                            color:
                                                                "#334155",
                                                        }}
                                                    >
                                                        Mark as Read
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            sendReply
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        style={{
                                                            ...styles.actionButton,
                                                            background:
                                                                "#0f766e",
                                                            color:
                                                                "#ffffff",
                                                        }}
                                                    >
                                                        {actionLoading
                                                            ? "Processing..."
                                                            : "Send Reply"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            resolveRequest
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        style={{
                                                            ...styles.actionButton,
                                                            background:
                                                                "#16a34a",
                                                            color:
                                                                "#ffffff",
                                                        }}
                                                    >
                                                        Problem Resolved
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            deleteRequest
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        style={{
                                                            ...styles.actionButton,
                                                            background:
                                                                "#dc2626",
                                                            color:
                                                                "#ffffff",
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {normalizeStatus(
                                            selectedRequest.status
                                        ) ===
                                            "RESOLVED" && (
                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "10px",
                                                    flexWrap:
                                                        "wrap",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color:
                                                            "#166534",
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    ✓ This request is
                                                    resolved and stored
                                                    in History.
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        deleteRequest
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    style={{
                                                        ...styles.actionButton,
                                                        background:
                                                            "#dc2626",
                                                        color:
                                                            "#ffffff",
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* =================================================
                                       USER ACTION AREA
                                    ================================================= */

                                    <div
                                        style={{
                                            ...styles.replyArea,
                                            display:
                                                "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems:
                                                "center",
                                            gap:
                                                "10px",
                                            flexWrap:
                                                "wrap",
                                        }}
                                    >
                                        <div
                                            style={{
                                                color:
                                                    "#64748b",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            {normalizeStatus(
                                                selectedRequest.status
                                            ) ===
                                            "RESOLVED"
                                                ? "✓ This request has been resolved by the JobConnect admin. You can view the complete conversation in History."
                                                : "Your support team reply will appear here automatically."}
                                        </div>

                                        {selectedRequest.is_read ===
                                            false && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    markRequestRead(
                                                        selectedRequest.id
                                                    )
                                                }
                                                style={{
                                                    ...styles.actionButton,
                                                    background:
                                                        "#e2e8f0",
                                                    color:
                                                        "#334155",
                                                }}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* =========================================================
                NEW REQUEST MODAL
            ========================================================= */}

            {showNewRequest && (
                <div
                    style={
                        styles.modalOverlay
                    }
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowNewRequest(
                                false
                            );
                        }
                    }}
                >
                    <div
                        style={
                            styles.modal
                        }
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "20px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize:
                                        "22px",
                                }}
                            >
                                New Help & Support Request
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewRequest(
                                        false
                                    )
                                }
                                style={{
                                    border:
                                        "none",
                                    background:
                                        "transparent",
                                    fontSize:
                                        "22px",
                                    cursor:
                                        "pointer",
                                    color:
                                        "#64748b",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                createRequest
                            }
                        >
                            <label
                                style={
                                    styles.label
                                }
                            >
                                Subject
                            </label>

                            <input
                                type="text"
                                value={
                                    subject
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSubject(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="What do you need help with?"
                                style={
                                    styles.input
                                }
                                maxLength={
                                    255
                                }
                                disabled={
                                    creatingRequest
                                }
                            />

                            <label
                                style={
                                    styles.label
                                }
                            >
                                Message
                            </label>

                            <textarea
                                value={
                                    message
                                }
                                onChange={(
                                    event
                                ) =>
                                    setMessage(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Describe your problem..."
                                style={{
                                    ...styles.textarea,
                                    minHeight:
                                        "160px",
                                    marginBottom:
                                        "16px",
                                }}
                                disabled={
                                    creatingRequest
                                }
                            />

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap:
                                        "10px",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewRequest(
                                            false
                                        )
                                    }
                                    disabled={
                                        creatingRequest
                                    }
                                    style={{
                                        ...styles.actionButton,
                                        background:
                                            "#e2e8f0",
                                        color:
                                            "#334155",
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        creatingRequest
                                    }
                                    style={{
                                        ...styles.actionButton,
                                        background:
                                            "#0f766e",
                                        color:
                                            "#ffffff",
                                    }}
                                >
                                    {creatingRequest
                                        ? "Submitting..."
                                        : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
                CONFIRMATION MODAL
            ========================================================= */}

            {confirmModal.open && (
                <div
                    style={
                        styles.modalOverlay
                    }
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeConfirmModal();
                        }
                    }}
                >
                    <div
                        style={
                            styles.confirmModal
                        }
                    >
                        <div
                            style={{
                                fontSize:
                                    "36px",
                                marginBottom:
                                    "12px",
                            }}
                        >
                            {confirmModal.danger
                                ? "⚠️"
                                : "❓"}
                        </div>

                        <h2
                            style={{
                                margin:
                                    "0 0 10px",
                                fontSize:
                                    "21px",
                                color:
                                    "#172033",
                            }}
                        >
                            {
                                confirmModal.title
                            }
                        </h2>

                        <p
                            style={{
                                margin:
                                    "0 0 22px",
                                color:
                                    "#64748b",
                                lineHeight:
                                    1.6,
                            }}
                        >
                            {
                                confirmModal.message
                            }
                        </p>

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "flex-end",
                                gap:
                                    "10px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={
                                    closeConfirmModal
                                }
                                style={{
                                    ...styles.actionButton,
                                    background:
                                        "#e2e8f0",
                                    color:
                                        "#334155",
                                }}
                            >
                                {
                                    confirmModal.cancelText
                                }
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmAction
                                }
                                disabled={
                                    actionLoading
                                }
                                style={{
                                    ...styles.actionButton,
                                    background:
                                        confirmModal.danger
                                            ? "#dc2626"
                                            : "#16a34a",
                                    color:
                                        "#ffffff",
                                }}
                            >
                                {
                                    confirmModal.confirmText
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                RESPONSIVE
            ========================================================= */}

            <style>
                {`
                    @media (max-width: 900px) {
                        .help-layout {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (max-width: 700px) {
                        body {
                            overflow-x: hidden;
                        }

                        .help-layout {
                            min-height: auto !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default HelpSupport;