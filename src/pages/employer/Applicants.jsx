
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const EMPLOYER_API = `${API_BASE}/auth/employer`;


/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        ""
    );
}


/* =========================================================
   CLEAR AUTH
========================================================= */

function clearAuth() {
    const keys = [
        "jc_token",
        "refresh_token",
        "jc_user",
        "user",
        "access_token",
        "access",
        "accessToken",
        "token",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text,
        };
    }
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(data, fallback) {
    if (!data) {
        return fallback;
    }

    if (typeof data === "string") {
        return data;
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.message) {
        return data.message;
    }

    if (data.error) {
        return data.error;
    }

    if (data.non_field_errors) {
        if (Array.isArray(data.non_field_errors)) {
            return data.non_field_errors.join(", ");
        }

        return String(data.non_field_errors);
    }

    return fallback;
}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
    switch ((status || "").toUpperCase()) {
        case "APPLIED":
            return "status-applied";

        case "UNDER REVIEW":
            return "status-review";

        case "SHORTLISTED":
            return "status-shortlisted";

        case "INTERVIEW SCHEDULED":
            return "status-interview";

        case "REJECTED":
            return "status-rejected";

        case "HIRED":
            return "status-hired";

        default:
            return "status-default";
    }
}


/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
    switch ((status || "").toUpperCase()) {
        case "APPLIED":
            return "Applied";

        case "UNDER REVIEW":
            return "Under Review";

        case "SHORTLISTED":
            return "Shortlisted";

        case "INTERVIEW SCHEDULED":
            return "Interview Scheduled";

        case "REJECTED":
            return "Rejected";

        case "HIRED":
            return "Hired";

        default:
            return status || "Applied";
    }
}


/* =========================================================
   COMPONENT
========================================================= */

function Applicants() {
    const { jobId } = useParams();

    const navigate = useNavigate();

    const [job, setJob] = useState(null);

    const [applicants, setApplicants] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [updatingId, setUpdatingId] = useState(null);


    /* =====================================================
       MODAL STATE
    ===================================================== */

    const [modal, setModal] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        confirmAction: null,
        confirmText: "OK",
        cancelText: "Cancel",
        showCancel: false,
    });


    /* =====================================================
       OPEN INFO / ERROR MODAL
    ===================================================== */

    function showModal(
        message,
        type = "info",
        title = ""
    ) {
        let modalTitle = title;

        if (!modalTitle) {
            if (type === "success") {
                modalTitle = "Success";
            } else if (type === "error") {
                modalTitle = "Error";
            } else if (type === "warning") {
                modalTitle = "Warning";
            } else {
                modalTitle = "Information";
            }
        }

        setModal({
            open: true,
            type,
            title: modalTitle,
            message,
            confirmAction: null,
            confirmText: "OK",
            cancelText: "Cancel",
            showCancel: false,
        });
    }


    /* =====================================================
       OPEN CONFIRMATION MODAL
    ===================================================== */

    function showConfirmModal({
        title,
        message,
        confirmText = "Confirm",
        cancelText = "Cancel",
        type = "warning",
        onConfirm,
    }) {
        setModal({
            open: true,
            type,
            title,
            message,
            confirmAction: onConfirm,
            confirmText,
            cancelText,
            showCancel: true,
        });
    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {
        setModal((previous) => ({
            ...previous,
            open: false,
            confirmAction: null,
        }));
    }


    /* =====================================================
       MODAL CONFIRM
    ===================================================== */

    async function handleModalConfirm() {
        const action = modal.confirmAction;

        if (!action) {
            closeModal();
            return;
        }

        closeModal();

        await action();
    }


    /* =====================================================
       FETCH APPLICANTS
    ===================================================== */

    async function fetchApplicants(showLoading = true) {
        if (!jobId) {
            setError("Job ID is missing.");
            setLoading(false);
            return;
        }

        const token = getToken();

        if (!token) {
            clearAuth();

            navigate("/login", {
                replace: true,
            });

            return;
        }

        try {
            if (showLoading) {
                setLoading(true);
            }

            setError("");

            const url =
                `${EMPLOYER_API}/jobs/${jobId}/applicants/`;

            console.log(
                "EMPLOYER APPLICANTS URL:",
                url
            );

            const response = await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },
                }
            );

            const data =
                await parseResponse(response);

            console.log(
                "APPLICANTS STATUS:",
                response.status
            );

            console.log(
                "APPLICANTS RESPONSE:",
                data
            );


            /* =============================================
               UNAUTHORIZED
            ============================================= */

            if (response.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }


            /* =============================================
               FORBIDDEN
            ============================================= */

            if (response.status === 403) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "You are not allowed to view applicants for this job."
                    )
                );
            }


            /* =============================================
               NOT FOUND
            ============================================= */

            if (response.status === 404) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Job not found."
                    )
                );
            }


            /* =============================================
               OTHER ERROR
            ============================================= */

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Unable to load applicants."
                    )
                );
            }


            /* =============================================
               SUCCESS
            ============================================= */

            setJob(
                data?.job || null
            );

            setApplicants(
                Array.isArray(data?.applicants)
                    ? data.applicants
                    : []
            );

        } catch (err) {
            console.error(
                "APPLICANTS FETCH ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load applicants."
            );

        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchApplicants(true);
    }, [jobId]);


    /* =====================================================
       UPDATE APPLICATION STATUS
    ===================================================== */

    async function updateStatus(
        applicationId,
        newStatus
    ) {
        const token = getToken();

        if (!token) {
            clearAuth();

            navigate("/login", {
                replace: true,
            });

            return;
        }

        if (!applicationId) {
            showModal(
                "Application ID is missing.",
                "error",
                "Application Error"
            );

            return;
        }

        const normalizedStatus =
            String(newStatus || "")
                .trim()
                .toUpperCase();


        /* =============================================
           VALIDATE STATUS
        ============================================= */

        const allowedStatuses = [
            "APPLIED",
            "UNDER REVIEW",
            "SHORTLISTED",
            "INTERVIEW SCHEDULED",
            "REJECTED",
            "HIRED",
        ];

        if (!allowedStatuses.includes(normalizedStatus)) {
            showModal(
                "Invalid application status.",
                "error",
                "Invalid Status"
            );

            return;
        }


        /* =============================================
           FIND CURRENT APPLICANT
        ============================================= */

        const currentApplicant =
            applicants.find(
                (item) =>
                    Number(item?.id) ===
                    Number(applicationId)
            );

        const currentStatus =
            String(
                currentApplicant?.status || ""
            )
                .trim()
                .toUpperCase();


        /* =============================================
           HIRING CONFIRMATION
        ============================================= */

        if (
            normalizedStatus === "HIRED" &&
            currentStatus !== "HIRED"
        ) {
            showConfirmModal({
                title: "Confirm Hiring",
                message:
                    "Are you sure you want to hire this candidate?\n\n" +
                    "This will mark this application as HIRED and " +
                    "automatically reject the candidate's other " +
                    "applications within your company.",
                confirmText: "Hire Candidate",
                cancelText: "Cancel",
                type: "warning",

                onConfirm: async () => {
                    await performStatusUpdate(
                        applicationId,
                        normalizedStatus
                    );
                },
            });

            return;
        }


        await performStatusUpdate(
            applicationId,
            normalizedStatus
        );
    }


    /* =====================================================
       ACTUAL STATUS UPDATE
    ===================================================== */

    async function performStatusUpdate(
        applicationId,
        normalizedStatus
    ) {
        const token = getToken();

        if (!token) {
            clearAuth();

            navigate("/login", {
                replace: true,
            });

            return;
        }

        try {
            setUpdatingId(applicationId);

            const response = await fetch(
                `${EMPLOYER_API}/applications/${applicationId}/status/`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body: JSON.stringify({
                        status:
                            normalizedStatus,
                    }),
                }
            );

            const data =
                await parseResponse(response);

            console.log(
                "STATUS UPDATE RESPONSE:",
                {
                    statusCode:
                        response.status,

                    applicationId,

                    requestedStatus:
                        normalizedStatus,

                    data,
                }
            );


            /* =============================================
               UNAUTHORIZED
            ============================================= */

            if (response.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }


            /* =============================================
               FORBIDDEN
            ============================================= */

            if (response.status === 403) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "You are not allowed to update this application."
                    )
                );
            }


            /* =============================================
               NOT FOUND
            ============================================= */

            if (response.status === 404) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Application not found."
                    )
                );
            }


            /* =============================================
               CONFLICT
            ============================================= */

            if (response.status === 409) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "This candidate has already been hired by another company."
                    )
                );
            }


            /* =============================================
               OTHER ERROR
            ============================================= */

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Unable to update application status."
                    )
                );
            }


            /* =============================================
               HIRING WORKFLOW
            ============================================= */

            if (normalizedStatus === "HIRED") {
                const sameCompanyRejected =
                    Number(
                        data?.same_company_rejected || 0
                    );

                const alreadyHired =
                    Boolean(
                        data?.already_hired
                    );

                console.log(
                    "========================================"
                );

                console.log(
                    alreadyHired
                        ? "HIRED APPLICATION SYNCHRONIZED"
                        : "CANDIDATE HIRED"
                );

                console.log(
                    "Application ID:",
                    applicationId
                );

                console.log(
                    "Same Company Rejected:",
                    sameCompanyRejected
                );

                console.log(
                    "Rejected Application IDs:",
                    data?.rejected_application_ids
                );

                console.log(
                    "========================================"
                );


                /* =========================================
                   SUCCESS MESSAGE
                ========================================= */

                if (alreadyHired) {
                    showModal(
                        sameCompanyRejected > 0
                            ? `Synchronization completed successfully.\n\n${sameCompanyRejected} other application(s) from this company were rejected.`
                            : "Synchronization completed.\n\nNo other active applications from this company needed to be rejected.",
                        "success",
                        "Applications Synchronized"
                    );
                } else {
                    showModal(
                        sameCompanyRejected > 0
                            ? `Candidate hired successfully.\n\n${sameCompanyRejected} other application(s) from your company were automatically rejected.`
                            : "Candidate hired successfully.\n\nNo other active applications from your company needed to be rejected.",
                        "success",
                        "Candidate Hired"
                    );
                }
            } else {
                showModal(
                    `Application status changed to ${getStatusLabel(normalizedStatus)}.`,
                    "success",
                    "Status Updated"
                );
            }


            /* =============================================
               REFRESH APPLICANTS
            ============================================= */

            await fetchApplicants(false);

        } catch (err) {
            console.error(
                "STATUS UPDATE ERROR:",
                err
            );

            showModal(
                err.message ||
                "Unable to update status.",
                "error",
                "Update Failed"
            );

        } finally {
            setUpdatingId(null);
        }
    }


    /* =====================================================
       SYNCHRONIZE ALREADY HIRED APPLICATION
    ===================================================== */

    function synchronizeHiredApplication(
        applicationId
    ) {
        showConfirmModal({
            title: "Synchronize Applications",

            message:
                "Synchronize this candidate's applications?\n\n" +
                "This will keep this application as HIRED and " +
                "reject the candidate's other applications " +
                "belonging to your company.\n\n" +
                "Applications belonging to other companies " +
                "will NOT be changed.",

            confirmText: "Synchronize",
            cancelText: "Cancel",
            type: "warning",

            onConfirm: async () => {
                await performStatusUpdate(
                    applicationId,
                    "HIRED"
                );
            },
        });
    }


    /* =====================================================
       VIEW APPLICANT
    ===================================================== */

    function viewApplicant(applicant) {
        const applicationId =
            applicant?.id;

        console.log(
            "VIEW APPLICANT:",
            {
                applicationId,
                applicant,
            }
        );

        if (!applicationId) {
            showModal(
                "Application ID is not available.",
                "error",
                "Application Error"
            );

            return;
        }

        navigate(
            `/employer/applicants/${applicationId}`
        );
    }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div style={styles.page}>

                <div style={styles.center}>

                    <div
                        style={styles.spinner}
                    />

                    <p>
                        Loading applicants...
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <div style={styles.page}>

                <button
                    style={styles.backButton}
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    ← Back
                </button>

                <div
                    style={styles.errorCard}
                >

                    <h2>
                        Unable to load applicants
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        style={
                            styles.primaryButton
                        }
                        onClick={() =>
                            fetchApplicants(true)
                        }
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div style={styles.page}>

            {/* =========================================
                HEADER
            ========================================= */}

            <div style={styles.header}>

                <div>

                    <button
                        style={
                            styles.backButton
                        }
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ← Back
                    </button>

                    <h1 style={styles.title}>
                        Applicants
                    </h1>

                    <p
                        style={
                            styles.subtitle
                        }
                    >
                        {job?.title
                            ? `Applicants for ${job.title}`
                            : "View and manage applicants"}
                    </p>

                </div>

                <div style={styles.count}>
                    {applicants.length}{" "}
                    Applicant
                    {applicants.length !== 1
                        ? "s"
                        : ""}
                </div>

            </div>


            {/* =========================================
                EMPTY
            ========================================= */}

            {applicants.length === 0 ? (

                <div
                    style={
                        styles.emptyCard
                    }
                >

                    <div
                        style={
                            styles.emptyIcon
                        }
                    >
                        👤
                    </div>

                    <h2>
                        No applicants yet
                    </h2>

                    <p>
                        No jobseekers have applied
                        for this job yet.
                    </p>

                </div>

            ) : (

                <div style={styles.list}>

                    {applicants.map(
                        (applicant) => {

                            const applicationId =
                                applicant?.id;

                            const name =
                                applicant?.jobseeker_name ||
                                applicant?.jobseeker?.full_name ||
                                applicant?.name ||
                                "Applicant";

                            const disabilityType =
                                applicant?.disability_type ||
                                applicant?.jobseeker?.disability_type ||
                                "";

                            const currentStatus =
                                applicant?.status ||
                                "APPLIED";

                            const normalizedCurrentStatus =
                                String(currentStatus)
                                    .trim()
                                    .toUpperCase();

                            const isRejected =
                                normalizedCurrentStatus ===
                                "REJECTED";

                            const isHired =
                                normalizedCurrentStatus ===
                                "HIRED";

                            const isUpdating =
                                Number(updatingId) ===
                                Number(applicationId);


                            return (
                                <div
                                    key={
                                        applicationId
                                    }
                                    style={
                                        styles.card
                                    }
                                >

                                    {/* =========================
                                        AVATAR
                                    ========================= */}

                                    <div
                                        style={
                                            styles.avatar
                                        }
                                    >
                                        {name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>


                                    {/* =========================
                                        INFORMATION
                                    ========================= */}

                                    <div
                                        style={
                                            styles.info
                                        }
                                    >

                                        <h3
                                            style={
                                                styles.name
                                            }
                                        >
                                            {name}
                                        </h3>

                                        {disabilityType && (
                                            <p
                                                style={
                                                    styles.secondary
                                                }
                                            >
                                                Disability:{" "}
                                                {
                                                    disabilityType
                                                }
                                            </p>
                                        )}

                                        <p
                                            style={
                                                styles.applicationId
                                            }
                                        >
                                            Application ID:{" "}
                                            {
                                                applicationId
                                            }
                                        </p>

                                        <span
                                            className={
                                                getStatusClass(
                                                    currentStatus
                                                )
                                            }
                                            style={{
                                                ...styles.status,

                                                ...(isHired
                                                    ? styles.statusHired
                                                    : {}),

                                                ...(isRejected
                                                    ? styles.statusRejected
                                                    : {}),
                                            }}
                                        >
                                            {
                                                getStatusLabel(
                                                    currentStatus
                                                )
                                            }
                                        </span>


                                        {/* =================================
                                            HIRED INFORMATION
                                        ================================= */}

                                        {isHired && (
                                            <p
                                                style={
                                                    styles.hiredHint
                                                }
                                            >
                                                ✓ This application is
                                                already hired. Use{" "}
                                                <strong>
                                                    Synchronize Applications
                                                </strong>{" "}
                                                to reject this candidate's
                                                other applications with
                                                your company.
                                            </p>
                                        )}

                                    </div>


                                    {/* =========================
                                        ACTIONS
                                    ========================= */}

                                    <div
                                        style={
                                            styles.actions
                                        }
                                    >

                                        <button
                                            style={
                                                styles.viewButton
                                            }
                                            onClick={() =>
                                                viewApplicant(
                                                    applicant
                                                )
                                            }
                                        >
                                            View Profile
                                        </button>


                                        {/* =================================
                                            NORMAL STATUS SELECT
                                        ================================= */}

                                        <select
                                            value={
                                                currentStatus
                                            }

                                            disabled={
                                                isUpdating ||
                                                isRejected
                                            }

                                            onChange={(e) =>
                                                updateStatus(
                                                    applicationId,
                                                    e.target.value
                                                )
                                            }

                                            style={{
                                                ...styles.select,

                                                ...(isRejected
                                                    ? styles.finalSelect
                                                    : {}),

                                                ...(isHired
                                                    ? styles.hiredSelect
                                                    : {}),
                                            }}
                                        >

                                            <option
                                                value="APPLIED"
                                            >
                                                Applied
                                            </option>

                                            <option
                                                value="UNDER REVIEW"
                                            >
                                                Under Review
                                            </option>

                                            <option
                                                value="SHORTLISTED"
                                            >
                                                Shortlisted
                                            </option>

                                            <option
                                                value="INTERVIEW SCHEDULED"
                                            >
                                                Interview Scheduled
                                            </option>

                                            <option
                                                value="REJECTED"
                                            >
                                                Rejected
                                            </option>

                                            <option
                                                value="HIRED"
                                            >
                                                Hired
                                            </option>

                                        </select>


                                        {/* =================================
                                            SYNCHRONIZE BUTTON
                                        ================================= */}

                                        {isHired && (
                                            <button
                                                type="button"

                                                disabled={
                                                    isUpdating
                                                }

                                                onClick={() =>
                                                    synchronizeHiredApplication(
                                                        applicationId
                                                    )
                                                }

                                                style={
                                                    styles.syncButton
                                                }
                                            >
                                                {isUpdating
                                                    ? "Synchronizing..."
                                                    : "Synchronize Applications"}
                                            </button>
                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>
            )}


            {/* =====================================================
                CUSTOM MODAL
            ===================================================== */}

            {modal.open && (
                <div
                    style={styles.modalOverlay}
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div
                        style={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="applicants-modal-title"
                    >

                        {/* ================================
                            MODAL ICON
                        ================================= */}

                        <div
                            style={{
                                ...styles.modalIcon,
                                ...(modal.type === "success"
                                    ? styles.modalIconSuccess
                                    : {}),
                                ...(modal.type === "error"
                                    ? styles.modalIconError
                                    : {}),
                                ...(modal.type === "warning"
                                    ? styles.modalIconWarning
                                    : {}),
                            }}
                        >
                            {modal.type === "success"
                                ? "✓"
                                : modal.type === "error"
                                    ? "!"
                                    : modal.type === "warning"
                                        ? "?"
                                        : "i"}
                        </div>


                        {/* ================================
                            MODAL TITLE
                        ================================= */}

                        <h2
                            id="applicants-modal-title"
                            style={styles.modalTitle}
                        >
                            {modal.title}
                        </h2>


                        {/* ================================
                            MODAL MESSAGE
                        ================================= */}

                        <div
                            style={styles.modalMessage}
                        >
                            {String(
                                modal.message || ""
                            )
                                .split("\n")
                                .map(
                                    (
                                        line,
                                        index
                                    ) => (
                                        <p
                                            key={
                                                index
                                            }
                                            style={
                                                styles.modalParagraph
                                            }
                                        >
                                            {line ||
                                                "\u00A0"}
                                        </p>
                                    )
                                )}
                        </div>


                        {/* ================================
                            MODAL ACTIONS
                        ================================= */}

                        <div
                            style={
                                styles.modalActions
                            }
                        >

                            {modal.showCancel && (
                                <button
                                    type="button"
                                    style={
                                        styles.modalCancelButton
                                    }
                                    onClick={
                                        closeModal
                                    }
                                >
                                    {
                                        modal.cancelText
                                    }
                                </button>
                            )}

                            <button
                                type="button"
                                autoFocus
                                style={{
                                    ...styles.modalConfirmButton,

                                    ...(modal.type ===
                                    "error"
                                        ? styles.modalErrorButton
                                        : {}),

                                    ...(modal.type ===
                                    "success"
                                        ? styles.modalSuccessButton
                                        : {}),

                                    ...(modal.type ===
                                    "warning"
                                        ? styles.modalWarningButton
                                        : {}),
                                }}
                                onClick={
                                    handleModalConfirm
                                }
                            >
                                {
                                    modal.confirmText
                                }
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}


/* =========================================================
   STYLES
========================================================= */

const styles = {

    page: {
        minHeight: "100vh",
        padding: "32px",
        background: "#f7f8fa",
        boxSizing: "border-box",
    },


    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "28px",
    },


    title: {
        margin: "10px 0 5px",
        fontSize: "30px",
    },


    subtitle: {
        margin: 0,
        color: "#666",
    },


    count: {
        padding: "10px 16px",
        background: "#fff",
        borderRadius: "10px",
        fontWeight: "600",
    },


    backButton: {
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "15px",
        padding: 0,
    },


    list: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },


    card: {
        background: "#fff",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
    },


    avatar: {
        width: "55px",
        height: "55px",
        borderRadius: "50%",
        background: "#e9eefc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        fontWeight: "700",
        flexShrink: 0,
    },


    info: {
        flex: 1,
        minWidth: 0,
    },


    name: {
        margin: "0 0 5px",
    },


    secondary: {
        margin: "3px 0",
        color: "#555",
    },


    applicationId: {
        margin: "5px 0",
        color: "#888",
        fontSize: "13px",
    },


    status: {
        display: "inline-block",
        marginTop: "5px",
        padding: "5px 9px",
        borderRadius: "6px",
        fontSize: "12px",
        background: "#eee",
        fontWeight: "600",
    },


    statusHired: {
        background: "#dcfce7",
        color: "#166534",
    },


    statusRejected: {
        background: "#fee2e2",
        color: "#991b1b",
    },


    hiredHint: {
        margin: "8px 0 0",
        fontSize: "12px",
        color: "#166534",
        lineHeight: "1.4",
    },


    actions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },


    viewButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },


    select: {
        padding: "9px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
    },


    hiredSelect: {
        borderColor: "#86efac",
        background: "#f0fdf4",
        color: "#166534",
        fontWeight: "600",
    },


    finalSelect: {
        borderColor: "#cbd5e1",
        background: "#f8fafc",
        color: "#64748b",
        cursor: "not-allowed",
    },


    syncButton: {
        border: "none",
        background: "#16a34a",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },


    emptyCard: {
        background: "#fff",
        padding: "60px 30px",
        textAlign: "center",
        borderRadius: "14px",
    },


    emptyIcon: {
        fontSize: "40px",
    },


    errorCard: {
        background: "#fff",
        padding: "30px",
        borderRadius: "14px",
        maxWidth: "600px",
    },


    primaryButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
    },


    center: {
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },


    spinner: {
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        border: "4px solid #ddd",
        borderTop: "4px solid #2563eb",
    },


    /* =====================================================
       MODAL
    ===================================================== */

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 99999,
        backdropFilter: "blur(3px)",
    },


    modal: {
        width: "100%",
        maxWidth: "480px",
        background: "#fff",
        borderRadius: "18px",
        padding: "30px",
        boxSizing: "border-box",
        boxShadow:
            "0 20px 60px rgba(0,0,0,0.25)",
        textAlign: "center",
        animation:
            "jobconnectModalIn 0.18s ease-out",
    },


    modalIcon: {
        width: "58px",
        height: "58px",
        margin: "0 auto 16px",
        borderRadius: "50%",
        background: "#dbeafe",
        color: "#1d4ed8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        fontWeight: "800",
    },


    modalIconSuccess: {
        background: "#dcfce7",
        color: "#15803d",
    },


    modalIconError: {
        background: "#fee2e2",
        color: "#dc2626",
    },


    modalIconWarning: {
        background: "#fef3c7",
        color: "#d97706",
    },


    modalTitle: {
        margin: "0 0 14px",
        fontSize: "22px",
        color: "#111827",
    },


    modalMessage: {
        color: "#4b5563",
        fontSize: "15px",
        lineHeight: "1.6",
        marginBottom: "24px",
    },


    modalParagraph: {
        margin: "0 0 5px",
    },


    modalActions: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        flexWrap: "wrap",
    },


    modalCancelButton: {
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        padding: "11px 20px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "600",
        minWidth: "100px",
    },


    modalConfirmButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "11px 22px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "600",
        minWidth: "100px",
    },


    modalSuccessButton: {
        background: "#16a34a",
    },


    modalErrorButton: {
        background: "#dc2626",
    },


    modalWarningButton: {
        background: "#d97706",
    },
};


export default Applicants;
