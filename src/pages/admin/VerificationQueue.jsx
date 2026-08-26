import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function VerificationQueue() {
    const navigate = useNavigate();

    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [processingId, setProcessingId] = useState(null);

    // =====================================================
    // MODAL STATE
    // =====================================================

    const [modal, setModal] = useState(null);

    const [rejectionReason, setRejectionReason] =
        useState("");

    const [modalError, setModalError] =
        useState("");

    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    const [successMessage, setSuccessMessage] =
        useState("");

    // =====================================================
    // LOAD VERIFICATION QUEUE
    // =====================================================

    useEffect(() => {
        fetchVerificationQueue();
    }, []);

    async function fetchVerificationQueue() {
        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            setError(
                "Admin login session not found."
            );

            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/admin/verifications/`,
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

            const data =
                await response
                    .json()
                    .catch(() => []);

            console.log(
                "VERIFICATION QUEUE:",
                response.status,
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Failed to load verification queue."
                );
            }

            const normalizedData =
                Array.isArray(data)
                    ? data
                    : [];

            console.log(
                "NORMALIZED VERIFICATION QUEUE:",
                normalizedData
            );

            setSubmissions(normalizedData);

        } catch (err) {
            console.error(
                "Verification queue error:",
                err
            );

            setError(
                err.message ||
                "Could not load verification queue."
            );

            setSubmissions([]);

        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // OPEN APPROVE MODAL
    // =====================================================

    function handleApprove(submission) {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            setError(
                "Admin login session has expired."
            );
            return;
        }

        if (
            submission.type !== "job seeker" &&
            submission.type !== "employer"
        ) {
            return;
        }

        setModalError("");

        setModal({
            type: "approve",
            submission: submission,
        });
    }

    // =====================================================
    // CONFIRM APPROVE
    // =====================================================

    async function confirmApprove() {
        const submission =
            modal?.submission;

        if (!submission) {
            return;
        }

        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            setModalError(
                "Admin login session has expired."
            );
            return;
        }

        const processingKey =
            `${submission.type}-${submission.id}`;

        setProcessingId(processingKey);
        setModalError("");

        try {
            let endpoint;

            if (
                submission.type ===
                "job seeker"
            ) {
                endpoint =
                    `${API_BASE}/admin/jobseekers/${submission.id}/approve/`;
            } else if (
                submission.type ===
                "employer"
            ) {
                endpoint =
                    `${API_BASE}/admin/employers/${submission.id}/approve/`;
            } else {
                throw new Error(
                    "Invalid submission type."
                );
            }

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            console.log(
                "APPROVE RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to approve profile."
                );
            }

            setSubmissions(
                previous =>
                    previous.filter(
                        item =>
                            !(
                                item.id ===
                                    submission.id &&
                                item.type ===
                                    submission.type
                            )
                    )
            );

            setModal(null);

            setSuccessMessage(
                `${submission.name} approved successfully.`
            );

            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);

        } catch (err) {
            console.error(
                "Approve error:",
                err
            );

            setModalError(
                err.message ||
                "Unable to approve profile."
            );

        } finally {
            setProcessingId(null);
        }
    }

    // =====================================================
    // OPEN REJECT MODAL
    // =====================================================

    function handleReject(submission) {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            setError(
                "Admin login session has expired."
            );
            return;
        }

        if (
            submission.type !== "job seeker" &&
            submission.type !== "employer"
        ) {
            return;
        }

        setRejectionReason("");
        setModalError("");

        setModal({
            type: "reject",
            submission: submission,
        });
    }

    // =====================================================
    // CONFIRM REJECT
    // =====================================================

    async function confirmReject() {
        const submission =
            modal?.submission;

        if (!submission) {
            return;
        }

        const trimmedReason =
            rejectionReason.trim();

        if (!trimmedReason) {
            setModalError(
                "Rejection reason is required."
            );
            return;
        }

        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            setModalError(
                "Admin login session has expired."
            );
            return;
        }

        const processingKey =
            `${submission.type}-${submission.id}`;

        setProcessingId(processingKey);
        setModalError("");

        try {
            let endpoint;

            if (
                submission.type ===
                "job seeker"
            ) {
                endpoint =
                    `${API_BASE}/admin/jobseekers/${submission.id}/reject/`;
            } else if (
                submission.type ===
                "employer"
            ) {
                endpoint =
                    `${API_BASE}/admin/employers/${submission.id}/reject/`;
            } else {
                throw new Error(
                    "Invalid submission type."
                );
            }

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            rejection_reason:
                                trimmedReason,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            console.log(
                "REJECT RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to reject profile."
                );
            }

            setSubmissions(
                previous =>
                    previous.filter(
                        item =>
                            !(
                                item.id ===
                                    submission.id &&
                                item.type ===
                                    submission.type
                            )
                    )
            );

            setModal(null);

            setRejectionReason("");

            setSuccessMessage(
                `${submission.name} rejected successfully.`
            );

            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);

        } catch (err) {
            console.error(
                "Reject error:",
                err
            );

            setModalError(
                err.message ||
                "Unable to reject profile."
            );

        } finally {
            setProcessingId(null);
        }
    }

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    function closeModal() {
        if (processingId) {
            return;
        }

        setModal(null);
        setRejectionReason("");
        setModalError("");
    }

    // =====================================================
    // FILTER
    // =====================================================

    const filteredSubmissions =
        filter === "all"
            ? submissions
            : submissions.filter(
                item =>
                    item.type === filter
            );

    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    // =====================================================
    // VIEW PROFILE
    // =====================================================

    function handleViewProfile(
        submission
    ) {
        if (
            submission.type ===
            "job seeker"
        ) {
            navigate(
                `/admin/jobseekers/${submission.id}`
            );

            return;
        }

        if (
            submission.type ===
            "employer"
        ) {
            navigate(
                `/admin/employers/${submission.id}`
            );

            return;
        }
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <>
           
        <style>{`

            /* =====================================================
               VERIFICATION QUEUE PAGE
            ===================================================== */

            .verification-page {
                width: 100%;
                min-height: 100%;
                box-sizing: border-box;
                padding: 28px;
                background: #f6f8fb;
            }

            /* =====================================================
               HEADER
            ===================================================== */

            .verification-queue-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 22px;
            }

            .verification-queue-header h1 {
                margin: 0;
                color: #172033;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.4px;
            }

            .verification-queue-header p {
                margin: 7px 0 0;
                color: #7b8494;
                font-size: 14px;
            }

            /* =====================================================
               SUCCESS MESSAGE
            ===================================================== */

            .verification-success-message {
                display: flex;
                align-items: center;
                gap: 10px;

                width: 100%;
                box-sizing: border-box;

                margin-bottom: 18px;
                padding: 13px 16px;

                background: #f0faf4;
                border: 1px solid #bde7cc;
                border-radius: 10px;

                color: #16713a;
                font-size: 14px;
                font-weight: 600;

                box-shadow: 0 3px 10px rgba(22, 113, 58, 0.05);
            }

            .verification-success-message span {
                width: 23px;
                height: 23px;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 50%;
                background: #22a35a;
                color: white;

                font-size: 13px;
                font-weight: 700;
            }

            /* =====================================================
               FILTER BAR
            ===================================================== */

            .verification-filters {
                display: inline-flex;
                align-items: center;
                gap: 4px;

                margin-bottom: 18px;
                padding: 5px;

                background: #ffffff;
                border: 1px solid #e3e7ed;
                border-radius: 10px;

                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            }

            .verification-filter {
                border: none;
                outline: none;

                padding: 9px 17px;

                border-radius: 7px;

                background: transparent;
                color: #6b7280;

                font-size: 13px;
                font-weight: 600;

                cursor: pointer;

                transition: all 0.2s ease;
            }

            .verification-filter:hover {
                background: #f5f7fa;
                color: #26344d;
            }

            .verification-filter.active {
                background: #1d4ed8;
                color: #ffffff;

                box-shadow: 0 3px 8px rgba(29, 78, 216, 0.18);
            }

            /* =====================================================
               TABLE CARD
            ===================================================== */

            .verification-queue-card {
                width: 100%;
                box-sizing: border-box;

                background: #ffffff;

                border: 1px solid #e3e7ed;
                border-radius: 14px;

                overflow: hidden;

                box-shadow:
                    0 5px 20px rgba(15, 23, 42, 0.05);
            }

            .verification-table {
                width: 100%;
                min-width: 1100px;
            }

            /* =====================================================
               TABLE ROW
            ===================================================== */

            .verification-table-row {
                display: grid;

                grid-template-columns:
                    1.2fr
                    0.8fr
                    1.5fr
                    1fr
                    0.9fr
                    0.75fr
                    2fr;

                align-items: center;

                column-gap: 18px;

                padding: 0 22px;

                box-sizing: border-box;
            }

            /* =====================================================
               TABLE HEADER
            ===================================================== */

            .verification-table-header {
                min-height: 50px;

                background: #f8fafc;

                border-bottom: 1px solid #e7ebf0;

                color: #8992a2;

                font-size: 10px;
                font-weight: 700;

                letter-spacing: 0.8px;
            }

            .verification-table-header > div {
                white-space: nowrap;
            }

            /* =====================================================
               DATA ROW
            ===================================================== */

            .verification-data-row {
                min-height: 76px;

                border-bottom: 1px solid #edf0f4;

                color: #374151;

                font-size: 13px;

                transition: background 0.2s ease;
            }

            .verification-data-row:last-child {
                border-bottom: none;
            }

            .verification-data-row:hover {
                background: #fafcff;
            }

            /* =====================================================
               NAME
            ===================================================== */

            .verification-name {
                color: #182236;

                font-size: 14px;
                font-weight: 650;

                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* =====================================================
               TYPE BADGE
            ===================================================== */

            .verification-type {
                display: inline-flex;
                align-items: center;

                padding: 6px 10px;

                border-radius: 20px;

                font-size: 11px;
                font-weight: 600;

                white-space: nowrap;
            }

            .jobseeker-type {
                background: #eef4ff;
                color: #315dbf;
                border: 1px solid #d9e6ff;
            }

            .employer-type {
                background: #f5efff;
                color: #7146b8;
                border: 1px solid #e7dbff;
            }

            /* =====================================================
               PENDING
            ===================================================== */

            .pending-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;

                padding: 6px 10px;

                border-radius: 20px;

                background: #fff8e8;
                border: 1px solid #ffe6b5;

                color: #a56600;

                font-size: 11px;
                font-weight: 600;
            }

            .pending-status::before {
                content: "";

                width: 6px;
                height: 6px;

                border-radius: 50%;

                background: #f0a000;
            }

            /* =====================================================
               ACTIONS
            ===================================================== */

            .verification-actions {
                display: flex;
                align-items: center;
                gap: 7px;

                white-space: nowrap;
            }

            .verification-actions button {
                height: 34px;

                padding: 0 12px;

                border-radius: 7px;

                font-size: 12px;
                font-weight: 600;

                cursor: pointer;

                transition: all 0.2s ease;
            }

            /* =====================================================
               VIEW PROFILE
            ===================================================== */

            .view-profile-button {
                border: 1px solid #dce2ea;

                background: #ffffff;
                color: #344054;
            }

            .view-profile-button:hover {
                background: #f4f7fb;
                border-color: #c6cfdb;
                color: #172033;
            }

            /* =====================================================
               APPROVE
            ===================================================== */

            .approve-button {
                border: 1px solid #b9e4c8;

                background: #edf9f1;
                color: #198044;
            }

            .approve-button:hover:not(:disabled) {
                background: #d9f5e3;
                border-color: #91d5aa;
            }

            /* =====================================================
               REJECT
            ===================================================== */

            .reject-button {
                border: 1px solid #f0c3c6;

                background: #fff4f4;
                color: #c43d46;
            }

            .reject-button:hover:not(:disabled) {
                background: #ffe6e7;
                border-color: #e7a4a8;
            }

            /* =====================================================
               DISABLED
            ===================================================== */

            .verification-actions button:disabled {
                opacity: 0.55;
                cursor: not-allowed;
            }

            /* =====================================================
               EMPTY / LOADING / ERROR
            ===================================================== */

            .verification-empty {
                min-height: 190px;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 30px;

                box-sizing: border-box;

                background: #ffffff;

                color: #7b8494;

                font-size: 14px;
                font-weight: 500;

                text-align: center;
            }

            .verification-error {
                background: #fff8f8;
                color: #c43d46;
            }

            /* =====================================================
               MODAL OVERLAY
            ===================================================== */

            .verification-modal-overlay {
                position: fixed;

                inset: 0;

                z-index: 9999;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 20px;

                box-sizing: border-box;

                background: rgba(15, 23, 42, 0.50);

                backdrop-filter: blur(4px);
            }

            /* =====================================================
               MODAL
            ===================================================== */

            .verification-modal {
                width: 100%;
                max-width: 450px;

                box-sizing: border-box;

                padding: 30px;

                background: #ffffff;

                border: 1px solid #e5e9ef;
                border-radius: 16px;

                text-align: center;

                box-shadow:
                    0 25px 70px rgba(15, 23, 42, 0.22);

                animation: verificationModalIn 0.2s ease-out;
            }

            @keyframes verificationModalIn {
                from {
                    opacity: 0;
                    transform: translateY(12px) scale(0.97);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* =====================================================
               MODAL ICON
            ===================================================== */

            .verification-modal-icon {
                width: 58px;
                height: 58px;

                display: flex;
                align-items: center;
                justify-content: center;

                margin: 0 auto 18px;

                border-radius: 50%;

                font-size: 24px;
                font-weight: 700;
            }

            .approve-modal-icon {
                background: #eaf8ef;
                color: #1b9a4b;

                border: 1px solid #c8ead4;
            }

            .reject-modal-icon {
                background: #fff0f0;
                color: #d0444c;

                border: 1px solid #f3cccc;
            }

            /* =====================================================
               MODAL TITLE
            ===================================================== */

            .verification-modal h2 {
                margin: 0;

                color: #172033;

                font-size: 20px;
                font-weight: 700;

                line-height: 1.4;
            }

            .verification-modal > p {
                margin: 10px 0 20px;

                color: #697386;

                font-size: 14px;
                line-height: 1.6;
            }

            .verification-modal > p strong {
                color: #26344d;
            }

            /* =====================================================
               TEXTAREA
            ===================================================== */

            .rejection-reason-input {
                width: 100%;
                min-height: 115px;

                box-sizing: border-box;

                padding: 12px 13px;

                resize: vertical;

                outline: none;

                border: 1px solid #d9dee7;
                border-radius: 9px;

                background: #ffffff;
                color: #293347;

                font-family: inherit;
                font-size: 13px;

                transition: all 0.2s ease;
            }

            .rejection-reason-input::placeholder {
                color: #9aa3b2;
            }

            .rejection-reason-input:focus {
                border-color: #7195e8;

                box-shadow:
                    0 0 0 3px rgba(49, 93, 191, 0.10);
            }

            .rejection-reason-input:disabled {
                background: #f5f6f8;
                cursor: not-allowed;
            }

            /* =====================================================
               VALIDATION
            ===================================================== */

            .rejection-validation {
                margin-top: 12px;

                padding: 10px 12px;

                border: 1px solid #f0c4c7;
                border-radius: 8px;

                background: #fff5f5;

                color: #c43d46;

                font-size: 12px;
                line-height: 1.5;

                text-align: left;
            }

            /* =====================================================
               MODAL BUTTONS
            ===================================================== */

            .verification-modal-actions {
                display: flex;
                justify-content: flex-end;
                align-items: center;

                gap: 9px;

                margin-top: 22px;
            }

            .verification-modal-actions button {
                height: 39px;

                padding: 0 18px;

                border-radius: 8px;

                font-size: 13px;
                font-weight: 600;

                cursor: pointer;

                transition: all 0.2s ease;
            }

            .modal-cancel-button {
                border: 1px solid #d9dee7;

                background: #ffffff;
                color: #596579;
            }

            .modal-cancel-button:hover:not(:disabled) {
                background: #f6f7f9;
                border-color: #c6ccd6;
            }

            .modal-approve-button {
                border: none;

                background: #20894a;
                color: #ffffff;
            }

            .modal-approve-button:hover:not(:disabled) {
                background: #18743d;
            }

            .modal-reject-button {
                border: none;

                background: #c8444c;
                color: #ffffff;
            }

            .modal-reject-button:hover:not(:disabled) {
                background: #ae353d;
            }

            .modal-cancel-button:disabled,
            .modal-approve-button:disabled,
            .modal-reject-button:disabled {
                opacity: 0.55;
                cursor: not-allowed;
            }

            /* =====================================================
               RESPONSIVE
            ===================================================== */

            @media (max-width: 1200px) {

                .verification-queue-card {
                    overflow-x: auto;
                }

                .verification-table {
                    min-width: 1100px;
                }
            }

            @media (max-width: 768px) {

                .verification-page {
                    padding: 20px;
                }

                .verification-queue-header h1 {
                    font-size: 24px;
                }

                .verification-queue-header p {
                    font-size: 13px;
                }

                .verification-filters {
                    display: flex;
                    width: 100%;
                    overflow-x: auto;
                    box-sizing: border-box;
                }

                .verification-filter {
                    flex: 0 0 auto;
                }

                .verification-modal {
                    max-width: 100%;
                    padding: 24px;
                }

                .verification-modal-actions {
                    flex-direction: column-reverse;
                }

                .verification-modal-actions button {
                    width: 100%;
                }
            }

            @media (max-width: 480px) {

                .verification-page {
                    padding: 15px;
                }

                .verification-queue-header h1 {
                    font-size: 22px;
                }

                .verification-success-message {
                    font-size: 13px;
                }

                .verification-modal {
                    padding: 20px;
                    border-radius: 13px;
                }

                .verification-modal h2 {
                    font-size: 18px;
                }
            }

        `}</style>

        {/* YOUR EXISTING JSX STARTS HERE */}

        


            {/* =================================================
               PAGE
            ================================================= */}

            <div className="verification-page">

                <main className="verification-main">

                    {/* =================================================
                       SUCCESS MESSAGE
                    ================================================= */}

                    {successMessage && (
                        <div className="verification-success-message">

                            <span className="verification-success-icon">
                                ✓
                            </span>

                            <span>
                                {successMessage}
                            </span>

                        </div>
                    )}


                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <section className="verification-queue-header">

                        <div>

                            <h1 className="verification-header-title">
                                Verification Queue
                            </h1>

                            <p className="verification-header-subtitle">
                                {submissions.length} pending{" "}
                                submission
                                {submissions.length !== 1
                                    ? "s"
                                    : ""
                                }{" "}
                                waiting for admin verification.
                            </p>

                        </div>

                    </section>


                    {/* =================================================
                       FILTERS
                    ================================================= */}

                    <div className="verification-filters">

                        <button
                            type="button"
                            className={
                                filter === "all"
                                    ? "verification-filter active"
                                    : "verification-filter"
                            }
                            onClick={() =>
                                setFilter("all")
                            }
                        >
                            All
                        </button>


                        <button
                            type="button"
                            className={
                                filter === "job seeker"
                                    ? "verification-filter active"
                                    : "verification-filter"
                            }
                            onClick={() =>
                                setFilter("job seeker")
                            }
                        >
                            Job seekers
                        </button>


                        <button
                            type="button"
                            className={
                                filter === "employer"
                                    ? "verification-filter active"
                                    : "verification-filter"
                            }
                            onClick={() =>
                                setFilter("employer")
                            }
                        >
                            Employers
                        </button>

                    </div>


                    {/* =================================================
                       TABLE CARD
                    ================================================= */}

                    <section className="verification-queue-card">

                        <div className="verification-table-wrapper">

                            <div className="verification-table">

                                {/* =================================================
                                   HEADER
                                ================================================= */}

                                <div className="verification-table-row verification-table-header">

                                    <div>
                                        NAME
                                    </div>

                                    <div>
                                        TYPE
                                    </div>

                                    <div>
                                        EMAIL
                                    </div>

                                    <div>
                                        LOCATION
                                    </div>

                                    <div>
                                        SUBMITTED
                                    </div>

                                    <div>
                                        STATUS
                                    </div>

                                    <div>
                                        ACTION
                                    </div>

                                </div>


                                {/* =================================================
                                   LOADING
                                ================================================= */}

                                {loading && (
                                    <div className="verification-empty">
                                        Loading verification submissions...
                                    </div>
                                )}


                                {/* =================================================
                                   ERROR
                                ================================================= */}

                                {!loading &&
                                    error && (
                                        <div className="verification-empty verification-error">
                                            {error}
                                        </div>
                                    )}


                                {/* =================================================
                                   EMPTY
                                ================================================= */}

                                {!loading &&
                                    !error &&
                                    filteredSubmissions.length === 0 && (
                                        <div className="verification-empty">

                                            {filter === "all"
                                                ? "No pending verification submissions."
                                                : filter === "job seeker"
                                                    ? "No pending job seekers."
                                                    : "No pending employers."
                                            }

                                        </div>
                                    )}


                                {/* =================================================
                                   DATA
                                ================================================= */}

                                {!loading &&
                                    !error &&
                                    filteredSubmissions.length > 0 &&
                                    filteredSubmissions.map(
                                        submission => {

                                            const processing =
                                                processingId ===
                                                `${submission.type}-${submission.id}`;

                                            const isJobSeeker =
                                                submission.type ===
                                                "job seeker";

                                            return (
                                                <div
                                                    className="verification-table-row verification-data-row"
                                                    key={`${submission.type}-${submission.id}`}
                                                >

                                                    {/* NAME */}

                                                    <div className="verification-name">
                                                        {submission.name ||
                                                            "Not provided"}
                                                    </div>


                                                    {/* TYPE */}

                                                    <div>

                                                        <span
                                                            className={
                                                                isJobSeeker
                                                                    ? "verification-type jobseeker-type"
                                                                    : "verification-type employer-type"
                                                            }
                                                        >
                                                            {submission.type}
                                                        </span>

                                                    </div>


                                                    {/* EMAIL */}

                                                    <div>
                                                        {submission.email ||
                                                            "—"}
                                                    </div>


                                                    {/* LOCATION */}

                                                    <div>
                                                        {submission.location ||
                                                            "—"}
                                                    </div>


                                                    {/* SUBMITTED */}

                                                    <div>
                                                        {formatDate(
                                                            submission.submitted
                                                        )}
                                                    </div>


                                                    {/* STATUS */}

                                                    <div>

                                                        <span className="pending-status">
                                                            Pending
                                                        </span>

                                                    </div>


                                                    {/* ACTION */}

                                                    <div className="verification-actions">

                                                        <button
                                                            type="button"
                                                            className="view-profile-button"
                                                            onClick={() =>
                                                                handleViewProfile(
                                                                    submission
                                                                )
                                                            }
                                                        >
                                                            View Profile
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="approve-button"
                                                            disabled={
                                                                processing
                                                            }
                                                            onClick={() =>
                                                                handleApprove(
                                                                    submission
                                                                )
                                                            }
                                                        >
                                                            {processing
                                                                ? "Processing..."
                                                                : "Approve"
                                                            }
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="reject-button"
                                                            disabled={
                                                                processing
                                                            }
                                                            onClick={() =>
                                                                handleReject(
                                                                    submission
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </button>

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                            </div>

                        </div>

                    </section>

                </main>

            </div>


            {/* =================================================
               APPROVE / REJECT MODAL
            ================================================= */}

            {modal && (

                <div
                    className="verification-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="verification-modal">

                        {/* =================================================
                           APPROVE MODAL
                        ================================================= */}

                        {modal.type === "approve" && (
                            <>

                                <div className="verification-modal-icon approve-modal-icon">
                                    ✓
                                </div>

                                <h2>
                                    Approve Job Seeker or Employer?
                                </h2>

                                <p>
                                    Are you sure you want to approve{" "}
                                    <strong>
                                        {modal.submission.name}
                                    </strong>
                                    ?
                                </p>


                                {modalError && (
                                    <div className="rejection-validation">
                                        {modalError}
                                    </div>
                                )}


                                <div className="verification-modal-actions">

                                    <button
                                        type="button"
                                        className="modal-cancel-button"
                                        disabled={
                                            processingId !== null
                                        }
                                        onClick={
                                            closeModal
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="button"
                                        className="modal-approve-button"
                                        disabled={
                                            processingId !== null
                                        }
                                        onClick={
                                            confirmApprove
                                        }
                                    >
                                        {processingId !== null
                                            ? "Approving..."
                                            : "Approve"
                                        }
                                    </button>

                                </div>

                            </>
                        )}


                        {/* =================================================
                           REJECT MODAL
                        ================================================= */}

                        {modal.type === "reject" && (
                            <>

                                <div className="verification-modal-icon reject-modal-icon">
                                    !
                                </div>

                                <h2>
                                    Reject Job Seeker or Employer?
                                </h2>

                                <p>
                                    You are rejecting{" "}
                                    <strong>
                                        {modal.submission.name}
                                    </strong>
                                    .
                                </p>


                                <textarea
                                    className="rejection-reason-input"
                                    placeholder="Enter rejection reason"
                                    value={
                                        rejectionReason
                                    }
                                    onChange={
                                        (event) => {

                                            setRejectionReason(
                                                event.target.value
                                            );

                                            setModalError("");
                                        }
                                    }
                                    disabled={
                                        processingId !== null
                                    }
                                />


                                {modalError && (
                                    <div className="rejection-validation">
                                        {modalError}
                                    </div>
                                )}


                                <div className="verification-modal-actions">

                                    <button
                                        type="button"
                                        className="modal-cancel-button"
                                        disabled={
                                            processingId !== null
                                        }
                                        onClick={
                                            closeModal
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="button"
                                        className="modal-reject-button"
                                        disabled={
                                            processingId !== null
                                        }
                                        onClick={
                                            confirmReject
                                        }
                                    >
                                        {processingId !== null
                                            ? "Rejecting..."
                                            : "Reject"
                                        }
                                    </button>

                                </div>

                            </>
                        )}

                    </div>

                </div>

            )}

        </>
    );
}

export default VerificationQueue;