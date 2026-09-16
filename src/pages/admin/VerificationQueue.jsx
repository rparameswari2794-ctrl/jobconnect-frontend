import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

/* =========================================================
   TOKEN
========================================================= */

const getAccessToken = () => {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        ""
    );
};

/* =========================================================
   AUTH HEADERS
========================================================= */

const authHeaders = () => {
    const token = getAccessToken();

    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
};

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

const normalizeText = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
};

/* =========================================================
   NORMALIZE TYPE
========================================================= */

const normalizeType = (item) => {
    const rawType =
        item?.type ??
        item?.user_type ??
        item?.role ??
        item?.profile_type ??
        item?.account_type ??
        item?.user?.type ??
        item?.user?.role ??
        item?.user?.user_type ??
        item?.user?.account_type ??
        "";

    const type = normalizeText(rawType);

    if (
        type === "jobseeker" ||
        type === "job seeker" ||
        type === "job seeker profile" ||
        type === "candidate" ||
        type === "seeker"
    ) {
        return "job seeker";
    }

    if (
        type === "employer" ||
        type === "employer profile" ||
        type === "company"
    ) {
        return "employer";
    }

    return type;
};

/* =========================================================
   NORMALIZE STATUS
========================================================= */

const normalizeStatus = (item) => {
    const rawStatus =
        item?.approval_status ??
        item?.verification_status ??
        item?.status ??
        item?.approvalStatus ??
        item?.verificationStatus ??
        "";

    const status = normalizeText(rawStatus);

    if (
        status === "approved" ||
        status === "approve" ||
        status === "verified" ||
        status === "accepted"
    ) {
        return "approved";
    }

    if (
        status === "rejected" ||
        status === "reject" ||
        status === "declined" ||
        status === "denied"
    ) {
        return "rejected";
    }

    return "pending";
};

/* =========================================================
   GET DISABILITY VALUE
========================================================= */

const getDisabilityValue = (item) => {
    return (
        item?.disability ??
        item?.has_disability ??
        item?.is_disabled ??
        item?.hasDisability ??
        item?.isDisabled ??
        item?.disability_details?.has_disability ??
        item?.disability_details?.disability ??
        item?.profile?.disability ??
        item?.jobseeker_profile?.disability ??
        item?.jobseekerProfile?.disability ??
        item?.user?.disability ??
        item?.user?.has_disability ??
        item?.user?.is_disabled ??
        item?.user?.disability_details?.has_disability ??
        item?.user?.profile?.disability ??
        item?.user?.jobseeker_profile?.disability ??
        null
    );
};

/* =========================================================
   GET DISABILITY TYPE
========================================================= */

const getDisabilityTypeValue = (item) => {
    return (
        item?.disability_type ??
        item?.disabilityType ??
        item?.disability_category ??
        item?.disabilityCategory ??
        item?.disability_details?.type ??
        item?.disability_details?.category ??
        item?.profile?.disability_type ??
        item?.profile?.disability_category ??
        item?.jobseeker_profile?.disability_type ??
        item?.jobseeker_profile?.disability_category ??
        item?.jobseekerProfile?.disability_type ??
        item?.jobseekerProfile?.disability_category ??
        item?.user?.disability_type ??
        item?.user?.disability_category ??
        item?.user?.disability_details?.type ??
        item?.user?.disability_details?.category ??
        item?.user?.profile?.disability_type ??
        item?.user?.profile?.disability_category ??
        item?.user?.jobseeker_profile?.disability_type ??
        item?.user?.jobseeker_profile?.disability_category ??
        ""
    );
};

/* =========================================================
   DISABILITY DETECTION
========================================================= */

const isDisabledPerson = (item) => {
    if (
        !item ||
        normalizeType(item) !== "job seeker"
    ) {
        return false;
    }

    const rawDisability =
        getDisabilityValue(item);

    const disabilityType =
        normalizeText(
            getDisabilityTypeValue(item)
        );

    /* -----------------------------------------------------
       Explicit boolean / numeric true
    ----------------------------------------------------- */

    if (
        rawDisability === true ||
        rawDisability === 1 ||
        rawDisability === "1"
    ) {
        return true;
    }

    /* -----------------------------------------------------
       Disability type/category can itself identify
       a disabled person.

       Examples:
       visual
       visual impaired
       visual impairment
       visually impaired
       hearing
       hearing impaired
       locomotor
       locomotor disability
       physical disability
       mobility impairment
    ----------------------------------------------------- */

    if (disabilityType) {
        if (
            disabilityType.includes("visual") ||
            disabilityType.includes("vision") ||
            disabilityType.includes("visually") ||
            disabilityType.includes("hearing") ||
            disabilityType.includes("auditory") ||
            disabilityType.includes("deaf") ||
            disabilityType.includes("locomotor") ||
            disabilityType.includes("mobility") ||
            disabilityType.includes("movement") ||
            disabilityType.includes("physical") ||
            disabilityType.includes("orthopedic") ||
            disabilityType.includes("orthopaedic") ||
            disabilityType.includes("impaired") ||
            disabilityType.includes("impairment") ||
            disabilityType.includes("disabil")
        ) {
            return true;
        }
    }

    /* -----------------------------------------------------
       Explicit false values
    ----------------------------------------------------- */

    if (
        rawDisability === false ||
        rawDisability === 0 ||
        normalizeText(rawDisability) === "false" ||
        normalizeText(rawDisability) === "no" ||
        normalizeText(rawDisability) === "none" ||
        normalizeText(rawDisability) === "not disabled"
    ) {
        return false;
    }

    /* -----------------------------------------------------
       Text disability values
    ----------------------------------------------------- */

    const disabilityText =
        normalizeText(rawDisability);

    if (!disabilityText) {
        return false;
    }

    return (
        disabilityText === "true" ||
        disabilityText === "yes" ||
        disabilityText === "y" ||
        disabilityText === "disabled" ||
        disabilityText.includes("visual") ||
        disabilityText.includes("vision") ||
        disabilityText.includes("hearing") ||
        disabilityText.includes("auditory") ||
        disabilityText.includes("locomotor") ||
        disabilityText.includes("mobility") ||
        disabilityText.includes("physical") ||
        disabilityText.includes("impaired") ||
        disabilityText.includes("impairment") ||
        disabilityText.includes("disabil")
    );
};

/* =========================================================
   DISABILITY TYPE MATCH
   FULL OR PARTIAL MATCHING
========================================================= */

const hasDisabilityType = (item, type) => {
    if (
        !item ||
        normalizeType(item) !== "job seeker" ||
        !isDisabledPerson(item)
    ) {
        return false;
    }

    const actualType =
        normalizeText(
            getDisabilityTypeValue(item)
        );

    const target =
        normalizeText(type);

    if (
        !actualType ||
        !target
    ) {
        return false;
    }

    /* Direct full / partial match */
    if (
        actualType.includes(target) ||
        target.includes(actualType)
    ) {
        return true;
    }

    /* -----------------------------------------------------
       VISUAL ALIASES
    ----------------------------------------------------- */

    if (target === "visual") {
        return (
            actualType.includes("vision") ||
            actualType.includes("visually")
        );
    }

    /* -----------------------------------------------------
       HEARING ALIASES
    ----------------------------------------------------- */

    if (target === "hearing") {
        return (
            actualType.includes("auditory") ||
            actualType.includes("deaf") ||
            actualType.includes("hard of hearing")
        );
    }

    /* -----------------------------------------------------
       LOCOMOTOR ALIASES
    ----------------------------------------------------- */

    if (target === "locomotor") {
        return (
            actualType.includes("physical") ||
            actualType.includes("mobility") ||
            actualType.includes("movement") ||
            actualType.includes("orthopedic") ||
            actualType.includes("orthopaedic")
        );
    }

    return false;
};

/* =========================================================
   NORMALIZE SUBMISSION
========================================================= */

const normalizeSubmission = (item) => {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const id =
        item.id ??
        item.pk ??
        item.profile_id ??
        item.user_id ??
        item.user?.id;

    if (
        id === undefined ||
        id === null
    ) {
        return null;
    }

    const type =
        normalizeType(item);

    return {
        ...item,

        id,

        type,

        status:
            normalizeStatus(item),

        name:
            item.name ??
            item.full_name ??
            item.contact_name ??
            item.company_name ??
            item.user?.full_name ??
            item.user?.name ??
            item.user?.username ??
            item.email ??
            "Unknown",

        email:
            item.email ??
            item.user?.email ??
            item.company_email ??
            "",

        company_name:
            item.company_name ??
            item.company ??
            item.companyName ??
            item.user?.company_name ??
            "",

        submitted_at:
            item.submitted_at ??
            item.submitted ??
            item.created_at ??
            item.createdAt ??
            item.updated_at ??
            null,

        /* Disability fields */
        disability:
            getDisabilityValue(item),

        disability_category:
            item.disability_category ??
            item.disabilityCategory ??
            item.disability_details?.category ??
            item.profile?.disability_category ??
            item.jobseeker_profile?.disability_category ??
            "",

        disability_type:
            item.disability_type ??
            item.disabilityType ??
            item.disability_details?.type ??
            item.profile?.disability_type ??
            item.jobseeker_profile?.disability_type ??
            "",
    };
};

/* =========================================================
   EXTRACT LIST
========================================================= */

const extractList = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (
        !payload ||
        typeof payload !== "object"
    ) {
        return [];
    }

    if (
        Array.isArray(
            payload.results
        )
    ) {
        return payload.results;
    }

    if (
        Array.isArray(
            payload.data
        )
    ) {
        return payload.data;
    }

    if (
        Array.isArray(
            payload.items
        )
    ) {
        return payload.items;
    }

    if (
        Array.isArray(
            payload.verifications
        )
    ) {
        return payload.verifications;
    }

    if (
        Array.isArray(
            payload.verification_queue
        )
    ) {
        return payload.verification_queue;
    }

    if (
        Array.isArray(
            payload.jobseekers
        )
    ) {
        return payload.jobseekers;
    }

    if (
        Array.isArray(
            payload.job_seekers
        )
    ) {
        return payload.job_seekers;
    }

    if (
        Array.isArray(
            payload.employers
        )
    ) {
        return payload.employers;
    }

    return [];
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
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

/* =========================================================
   PAGE
========================================================= */

function VerificationQueue() {
    const navigate =
        useNavigate();

    /* =====================================================
       STATE
    ===================================================== */

    const [submissions, setSubmissions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const [selectedSubmission, setSelectedSubmission] =
        useState(null);

    const [modalType, setModalType] =
        useState("");

    const [rejectionReason, setRejectionReason] =
        useState("");

    const [processingId, setProcessingId] =
        useState(null);

    /* =====================================================
       LOAD VERIFICATION QUEUE
    ===================================================== */

    const loadQueue =
        async (
            isRefresh = false
        ) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const token =
                    getAccessToken();

                if (!token) {
                    setError(
                        "Authentication token is missing. Please login again."
                    );

                    return;
                }

                const response =
                    await fetch(
                        `${API_BASE}/admin/verifications/`,
                        {
                            method: "GET",
                            headers:
                                authHeaders(),
                        }
                    );

                let data =
                    null;

                try {
                    data =
                        await response.json();
                } catch {
                    data =
                        null;
                }

                if (
                    response.status ===
                    401
                ) {
                    localStorage.removeItem(
                        "jc_token"
                    );

                    localStorage.removeItem(
                        "access_token"
                    );

                    localStorage.removeItem(
                        "accessToken"
                    );

                    localStorage.removeItem(
                        "token"
                    );

                    setError(
                        "Your session has expired. Please login again."
                    );

                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            data?.detail ||
                            "Failed to load verification queue."
                    );
                }

                const list =
                    extractList(data);

                const normalized =
                    list
                        .map(
                            normalizeSubmission
                        )
                        .filter(Boolean);

                setSubmissions(
                    normalized
                );
            } catch (err) {
                console.error(
                    "Verification queue error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load verification queue."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadQueue();
    }, []);

    /* =====================================================
       SUCCESS MESSAGE AUTO HIDE
    ===================================================== */

    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timer =
            setTimeout(() => {
                setSuccessMessage(
                    ""
                );
            }, 4000);

        return () =>
            clearTimeout(timer);
    }, [successMessage]);

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredSubmissions =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return submissions.filter(
                (submission) => {
                    /* -----------------------------------------
                       TYPE FILTER
                    ----------------------------------------- */

                    const matchesType =
                        typeFilter ===
                            "all" ||
                        submission.type ===
                            typeFilter;

                    if (!matchesType) {
                        return false;
                    }

                    /* -----------------------------------------
                       SEARCH
                    ----------------------------------------- */

                    if (!query) {
                        return true;
                    }

                    const searchableText = [
                        submission.name,
                        submission.email,
                        submission.company_name,
                        submission.type,
                        submission.status,
                        submission.id,
                        submission.disability,
                        submission.disability_category,
                        submission.disability_type,
                    ]
                        .filter(
                            (value) =>
                                value !==
                                    undefined &&
                                value !== null
                        )
                        .join(" ")
                        .toLowerCase();

                    return searchableText.includes(
                        query
                    );
                }
            );
        }, [
            submissions,
            typeFilter,
            search,
        ]);

    /* =====================================================
       COUNTS
    ===================================================== */

    const totalCount =
        submissions.length;

    /*
     * The verification API returns the pending
     * verification queue.
     *
     * Keep this explicit in case another status
     * is returned by the API in the future.
     */
    const pendingCount =
        submissions.filter(
            (item) =>
                item.status ===
                "pending"
        ).length;

    /*
     * ONLY:
     *
     * Job Seeker
     * +
     * Pending
     * +
     * Disability
     *
     * Employers are never included.
     */
    const disabilityPendingCount =
        submissions.filter(
            (item) =>
                item.status ===
                    "pending" &&
                isDisabledPerson(
                    item
                )
        ).length;

    /* =====================================================
       VIEW PROFILE
    ===================================================== */

    const viewProfile =
        (submission) => {
            if (!submission) {
                return;
            }

            const id =
                submission.id;

            if (
                submission.type ===
                "job seeker"
            ) {
                navigate(
                    `/admin/jobseekers/${id}`
                );

                return;
            }

            if (
                submission.type ===
                "employer"
            ) {
                navigate(
                    `/admin/employers/${id}`
                );
            }
        };

    /* =====================================================
       APPROVE MODAL
    ===================================================== */

    const openApproveModal =
        (submission) => {
            setSelectedSubmission(
                submission
            );

            setModalType(
                "approve"
            );

            setError("");
        };

    /* =====================================================
       REJECT MODAL
    ===================================================== */

    const openRejectModal =
        (submission) => {
            setSelectedSubmission(
                submission
            );

            setModalType(
                "reject"
            );

            setRejectionReason(
                ""
            );

            setError("");
        };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal =
        () => {
            if (
                processingId !==
                null
            ) {
                return;
            }

            setSelectedSubmission(
                null
            );

            setModalType(
                ""
            );

            setRejectionReason(
                ""
            );
        };

    /* =====================================================
       APPROVE
       JOB SEEKER = POST
       EMPLOYER   = PATCH
    ===================================================== */

    const approveSubmission =
        async () => {
            if (
                !selectedSubmission
            ) {
                return;
            }

            const submission =
                selectedSubmission;

            try {
                setProcessingId(
                    submission.id
                );

                setError("");

                const isEmployer =
                    submission.type ===
                    "employer";

                const endpoint =
                    isEmployer
                        ? `${API_BASE}/admin/employers/${submission.id}/approve/`
                        : `${API_BASE}/admin/jobseekers/${submission.id}/approve/`;

                const method =
                    isEmployer
                        ? "PATCH"
                        : "POST";

                const response =
                    await fetch(
                        endpoint,
                        {
                            method,
                            headers:
                                authHeaders(),
                            body:
                                JSON.stringify(
                                    {}
                                ),
                        }
                    );

                let data =
                    null;

                try {
                    data =
                        await response.json();
                } catch {
                    data =
                        null;
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            data?.detail ||
                            `Failed to approve ${submission.type}.`
                    );
                }

                setSuccessMessage(
                    data?.message ||
                        `${
                            isEmployer
                                ? "Employer"
                                : "Job seeker"
                        } approved successfully.`
                );

                setSelectedSubmission(
                    null
                );

                setModalType(
                    ""
                );

                setRejectionReason(
                    ""
                );

                await loadQueue(
                    true
                );
            } catch (err) {
                console.error(
                    "Approve error:",
                    err
                );

                setError(
                    err?.message ||
                        "Failed to approve submission."
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };

    /* =====================================================
       REJECT
       JOB SEEKER = POST
       EMPLOYER   = PATCH
    ===================================================== */

    const rejectSubmission =
        async () => {
            if (
                !selectedSubmission
            ) {
                return;
            }

            const submission =
                selectedSubmission;

            const reason =
                rejectionReason.trim();

            if (!reason) {
                setError(
                    "Please enter a rejection reason."
                );

                return;
            }

            try {
                setProcessingId(
                    submission.id
                );

                setError("");

                const isEmployer =
                    submission.type ===
                    "employer";

                const endpoint =
                    isEmployer
                        ? `${API_BASE}/admin/employers/${submission.id}/reject/`
                        : `${API_BASE}/admin/jobseekers/${submission.id}/reject/`;

                const method =
                    isEmployer
                        ? "PATCH"
                        : "POST";

                const response =
                    await fetch(
                        endpoint,
                        {
                            method,
                            headers:
                                authHeaders(),
                            body:
                                JSON.stringify(
                                    {
                                        rejection_reason:
                                            reason,
                                    }
                                ),
                        }
                    );

                let data =
                    null;

                try {
                    data =
                        await response.json();
                } catch {
                    data =
                        null;
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            data?.detail ||
                            `Failed to reject ${submission.type}.`
                    );
                }

                setSuccessMessage(
                    data?.message ||
                        `${
                            isEmployer
                                ? "Employer"
                                : "Job seeker"
                        } rejected successfully.`
                );

                setSelectedSubmission(
                    null
                );

                setModalType(
                    ""
                );

                setRejectionReason(
                    ""
                );

                await loadQueue(
                    true
                );
            } catch (err) {
                console.error(
                    "Reject error:",
                    err
                );

                setError(
                    err?.message ||
                        "Failed to reject submission."
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };

    /* =====================================================
       STATUS
    ===================================================== */

    const renderStatus =
        (status) => {
            if (
                status ===
                "approved"
            ) {
                return (
                    <span className="vq-status approved">
                        Approved
                    </span>
                );
            }

            if (
                status ===
                "rejected"
            ) {
                return (
                    <span className="vq-status rejected">
                        Rejected
                    </span>
                );
            }

            return (
                <span className="vq-status pending">
                    Pending
                </span>
            );
        };

    /* =====================================================
       TYPE
    ===================================================== */

    const renderType =
        (type) => {
            if (
                type ===
                "employer"
            ) {
                return (
                    <span className="vq-type employer">
                        Employer
                    </span>
                );
            }

            return (
                <span className="vq-type jobseeker">
                    Job Seeker
                </span>
            );
        };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .verification-page {
                    width: 100%;
                    min-height: 100vh;
                    padding: 28px;
                    background: #f8fafc;
                }

                .verification-container {
                    width: 100%;
                    max-width: 1500px;
                    margin: 0 auto;
                }

                /* HEADER */

                .vq-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 26px;
                }

                .vq-header-left h1 {
                    margin: 0;
                    color: #111827;
                    font-size: 30px;
                    line-height: 1.2;
                    font-weight: 750;
                }

                .vq-header-left p {
                    margin: 7px 0 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .vq-refresh-btn {
                    border: 1px solid #d1d5db;
                    background: #ffffff;
                    color: #111827;
                    padding: 10px 17px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 650;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .vq-refresh-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }

                .vq-refresh-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                /* ALERTS */

                .vq-alert {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 13px 16px;
                    margin-bottom: 20px;
                    border-radius: 9px;
                    font-size: 14px;
                }

                .vq-alert-success {
                    color: #166534;
                    background: #dcfce7;
                    border: 1px solid #bbf7d0;
                }

                .vq-alert-error {
                    color: #991b1b;
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                }

                .vq-alert-close {
                    border: 0;
                    background: transparent;
                    font-size: 20px;
                    cursor: pointer;
                    color: inherit;
                }

                /* STATS */

                .vq-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 22px;
                }

                .vq-stat-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 19px;
                    box-shadow: 0 2px 7px rgba(0, 0, 0, 0.025);
                }

                .vq-stat-label {
                    color: #6b7280;
                    font-size: 13px;
                    font-weight: 550;
                    margin-bottom: 7px;
                }

                .vq-stat-value {
                    color: #111827;
                    font-size: 27px;
                    line-height: 1;
                    font-weight: 750;
                }

                /* FILTERS */

                .vq-filter-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    padding: 16px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    margin-bottom: 18px;
                }

                .vq-search-wrapper {
                    flex: 1;
                    min-width: 260px;
                }

                .vq-search {
                    width: 100%;
                    height: 42px;
                    padding: 0 13px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    outline: none;
                    font-size: 13px;
                    color: #111827;
                    background: #ffffff;
                }

                .vq-select {
                    height: 42px;
                    min-width: 170px;
                    padding: 0 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #111827;
                    font-size: 13px;
                    outline: none;
                    cursor: pointer;
                }

                .vq-search:focus,
                .vq-select:focus,
                .vq-textarea:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.10);
                }

                /* TABLE */

                .vq-table-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 7px rgba(0, 0, 0, 0.025);
                }

                .vq-table-scroll {
                    width: 100%;
                    overflow-x: auto;
                }

                .vq-table {
                    width: 100%;
                    min-width: 1000px;
                    border-collapse: collapse;
                }

                .vq-table thead th {
                    background: #f9fafb;
                    color: #4b5563;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    padding: 14px 16px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                    white-space: nowrap;
                }

                .vq-table tbody td {
                    padding: 15px 16px;
                    color: #374151;
                    font-size: 13px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: middle;
                }

                .vq-table tbody tr:last-child td {
                    border-bottom: 0;
                }

                .vq-table tbody tr:hover {
                    background: #fafafa;
                }

                /* APPLICANT */

                .vq-applicant {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                }

                .vq-avatar {
                    width: 40px;
                    height: 40px;
                    flex: 0 0 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #eef2ff;
                    color: #4338ca;
                    font-size: 14px;
                    font-weight: 750;
                }

                .vq-applicant-name {
                    color: #111827;
                    font-weight: 650;
                    margin-bottom: 3px;
                }

                .vq-applicant-email {
                    color: #6b7280;
                    font-size: 12px;
                }

                /* BADGES */

                .vq-status,
                .vq-type {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                    border-radius: 999px;
                    padding: 5px 10px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .vq-status.approved {
                    background: #dcfce7;
                    color: #166534;
                }

                .vq-status.rejected {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .vq-status.pending {
                    background: #fef3c7;
                    color: #92400e;
                }

                .vq-type.employer {
                    background: #ede9fe;
                    color: #6d28d9;
                }

                .vq-type.jobseeker {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                /* ACTIONS */

                .vq-actions {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    flex-wrap: wrap;
                }

                .vq-action-btn {
                    border: 0;
                    border-radius: 7px;
                    padding: 8px 11px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.15s ease;
                }

                .vq-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .vq-view-btn {
                    background: #f3f4f6;
                    color: #374151;
                }

                .vq-view-btn:hover {
                    background: #e5e7eb;
                }

                .vq-approve-btn {
                    background: #16a34a;
                    color: #ffffff;
                }

                .vq-approve-btn:hover {
                    background: #15803d;
                }

                .vq-reject-btn {
                    background: #dc2626;
                    color: #ffffff;
                }

                .vq-reject-btn:hover {
                    background: #b91c1c;
                }

                /* LOADING */

                .vq-loading {
                    padding: 70px 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }

                /* EMPTY */

                .vq-empty {
                    padding: 70px 20px;
                    text-align: center;
                }

                .vq-empty-icon {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 14px;
                    border-radius: 50%;
                    background: #f3f4f6;
                    color: #6b7280;
                    font-size: 23px;
                }

                .vq-empty h3 {
                    margin: 0 0 6px;
                    color: #111827;
                    font-size: 17px;
                }

                .vq-empty p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 13px;
                }

                /* MODAL */

                .vq-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.55);
                }

                .vq-modal {
                    width: 100%;
                    max-width: 520px;
                    background: #ffffff;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.22);
                }

                .vq-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 18px 20px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .vq-modal-title {
                    margin: 0;
                    color: #111827;
                    font-size: 19px;
                    font-weight: 700;
                }

                .vq-modal-close {
                    width: 32px;
                    height: 32px;
                    border: 0;
                    border-radius: 7px;
                    background: #f3f4f6;
                    color: #4b5563;
                    font-size: 21px;
                    cursor: pointer;
                }

                .vq-modal-close:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .vq-modal-body {
                    padding: 22px 20px;
                }

                .vq-modal-body p {
                    margin: 0 0 15px;
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .vq-modal-note {
                    padding: 12px;
                    border-radius: 8px;
                    background: #f8fafc;
                    color: #64748b !important;
                    font-size: 13px !important;
                }

                .vq-label {
                    display: block;
                    margin-bottom: 7px;
                    color: #374151;
                    font-size: 13px;
                    font-weight: 650;
                }

                .vq-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 11px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    resize: vertical;
                    outline: none;
                    font-family: inherit;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .vq-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 9px;
                    padding: 16px 20px;
                    border-top: 1px solid #e5e7eb;
                }

                .vq-modal-footer button {
                    border: 0;
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .vq-cancel-btn {
                    background: #f3f4f6;
                    color: #374151;
                }

                .vq-modal-footer .vq-confirm-approve {
                    background: #16a34a;
                    color: #ffffff;
                }

                .vq-modal-footer .vq-confirm-reject {
                    background: #dc2626;
                    color: #ffffff;
                }

                .vq-modal-footer button:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                /* RESPONSIVE */

                @media (max-width: 900px) {
                    .verification-page {
                        padding: 18px;
                    }

                    .vq-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .vq-header {
                        align-items: flex-start;
                    }
                }

                @media (max-width: 600px) {
                    .verification-page {
                        padding: 12px;
                    }

                    .vq-header {
                        flex-direction: column;
                    }

                    .vq-header-left h1 {
                        font-size: 24px;
                    }

                    .vq-refresh-btn {
                        width: 100%;
                    }

                    .vq-stats {
                        grid-template-columns: 1fr;
                    }

                    .vq-filter-card {
                        padding: 12px;
                    }

                    .vq-search-wrapper {
                        min-width: 100%;
                    }

                    .vq-select {
                        width: 100%;
                    }

                    .vq-modal-overlay {
                        padding: 12px;
                    }

                    .vq-modal-footer {
                        flex-direction: column-reverse;
                    }

                    .vq-modal-footer button {
                        width: 100%;
                    }
                }
            `}</style>

            <div className="verification-page">
                <div className="verification-container">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="vq-header">
                        <div className="vq-header-left">
                            <h1>
                                Verification Queue
                            </h1>

                            <p>
                                Review and manage
                                job seeker and
                                employer verification
                                requests.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="vq-refresh-btn"
                            onClick={() =>
                                loadQueue(true)
                            }
                            disabled={
                                refreshing
                            }
                        >
                            {
                                refreshing
                                    ? "Refreshing..."
                                    : "Refresh"
                            }
                        </button>
                    </div>

                    {/* =================================================
                        SUCCESS
                    ================================================= */}

                    {successMessage && (
                        <div className="vq-alert vq-alert-success">
                            <span>
                                {
                                    successMessage
                                }
                            </span>

                            <button
                                type="button"
                                className="vq-alert-close"
                                onClick={() =>
                                    setSuccessMessage(
                                        ""
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <div className="vq-alert vq-alert-error">
                            <span>
                                {
                                    error
                                }
                            </span>

                            <button
                                type="button"
                                className="vq-alert-close"
                                onClick={() =>
                                    setError(
                                        ""
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        STATS
                    ================================================= */}

                    <div className="vq-stats">

                        <div className="vq-stat-card">
                            <div className="vq-stat-label">
                                Total Submissions
                            </div>

                            <div className="vq-stat-value">
                                {
                                    totalCount
                                }
                            </div>
                        </div>

                        <div className="vq-stat-card">
                            <div className="vq-stat-label">
                                Pending
                            </div>

                            <div className="vq-stat-value">
                                {
                                    pendingCount
                                }
                            </div>
                        </div>

                        <div className="vq-stat-card">
                            <div className="vq-stat-label">
                                Disability Pending
                            </div>

                            <div className="vq-stat-value">
                                {
                                    disabilityPendingCount
                                }
                            </div>
                        </div>

                    </div>

                    {/* =================================================
                        FILTERS
                    ================================================= */}

                    <div className="vq-filter-card">

                        {/* SEARCH */}

                        <div className="vq-search-wrapper">
                            <input
                                type="text"
                                className="vq-search"
                                placeholder="Search by name, email, company..."
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        {/* TYPE FILTER */}

                        <select
                            className="vq-select"
                            value={
                                typeFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setTypeFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="all">
                                All Types
                            </option>

                            <option value="job seeker">
                                Job Seekers
                            </option>

                            <option value="employer">
                                Employers
                            </option>
                        </select>

                    </div>

                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <div className="vq-table-card">

                        {loading ? (

                            <div className="vq-loading">
                                Loading verification
                                queue...
                            </div>

                        ) : filteredSubmissions.length === 0 ? (

                            <div className="vq-empty">

                                <div className="vq-empty-icon">
                                    ✓
                                </div>

                                <h3>
                                    No submissions
                                    found
                                </h3>

                                <p>
                                    There are no
                                    verification
                                    requests matching
                                    your current
                                    filters.
                                </p>

                            </div>

                        ) : (

                            <div className="vq-table-scroll">

                                <table className="vq-table">

                                    <thead>
                                        <tr>
                                            <th>
                                                Applicant
                                            </th>

                                            <th>
                                                Type
                                            </th>

                                            <th>
                                                
                                            </th>

                                            <th>
                                                Submitted
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {
                                            filteredSubmissions.map(
                                                (
                                                    submission
                                                ) => {

                                                    const isProcessing =
                                                        processingId ===
                                                        submission.id;

                                                    return (
                                                        <tr
                                                            key={`${submission.type}-${submission.id}`}
                                                        >

                                                            {/* APPLICANT */}

                                                            <td>
                                                                <div className="vq-applicant">

                                                                    <div className="vq-avatar">
                                                                        {
                                                                            String(
                                                                                submission.name ||
                                                                                    "?"
                                                                            )
                                                                                .charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase()
                                                                        }
                                                                    </div>

                                                                    <div>

                                                                        <div className="vq-applicant-name">
                                                                            {
                                                                                submission.name
                                                                            }
                                                                        </div>

                                                                        <div className="vq-applicant-email">
                                                                            {
                                                                                submission.email ||
                                                                                "No email"
                                                                            }
                                                                        </div>

                                                                    </div>

                                                                </div>
                                                            </td>

                                                            {/* TYPE */}

                                                            <td>
                                                                {
                                                                    renderType(
                                                                        submission.type
                                                                    )
                                                                }
                                                            </td>

                                                            {/* COMPANY */}

                                                            <td>
                                                                {
                                                                    submission.company_name ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            {/* DATE */}

                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        submission.submitted_at
                                                                    )
                                                                }
                                                            </td>

                                                            {/* STATUS */}

                                                            <td>
                                                                {
                                                                    renderStatus(
                                                                        submission.status
                                                                    )
                                                                }
                                                            </td>

                                                            {/* ACTIONS */}

                                                            <td>

                                                                <div className="vq-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="vq-action-btn vq-view-btn"
                                                                        onClick={() =>
                                                                            viewProfile(
                                                                                submission
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                    </button>

                                                                    {
                                                                        submission.status ===
                                                                            "pending" && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    className="vq-action-btn vq-approve-btn"
                                                                                    onClick={() =>
                                                                                        openApproveModal(
                                                                                            submission
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        isProcessing
                                                                                    }
                                                                                >
                                                                                    Approve
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    className="vq-action-btn vq-reject-btn"
                                                                                    onClick={() =>
                                                                                        openRejectModal(
                                                                                            submission
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        isProcessing
                                                                                    }
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </>
                                                                        )
                                                                    }

                                                                </div>

                                                            </td>

                                                        </tr>
                                                    );
                                                }
                                            )
                                        }

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>

                </div>
            </div>

            {/* =====================================================
                APPROVE MODAL
            ===================================================== */}

            {
                modalType === "approve" &&
                selectedSubmission && (
                    <div
                        className="vq-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="vq-modal">

                            <div className="vq-modal-header">

                                <h2 className="vq-modal-title">
                                    Confirm Approval
                                </h2>

                                <button
                                    type="button"
                                    className="vq-modal-close"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <div className="vq-modal-body">

                                <p>
                                    Are you sure you
                                    want to approve{" "}
                                    <strong>
                                        {
                                            selectedSubmission.name
                                        }
                                    </strong>
                                    ?
                                </p>

                                <p className="vq-modal-note">
                                    Account type:{" "}
                                    <strong>
                                        {
                                            selectedSubmission.type ===
                                            "employer"
                                                ? "Employer"
                                                : "Job Seeker"
                                        }
                                    </strong>
                                </p>

                            </div>

                            <div className="vq-modal-footer">

                                <button
                                    type="button"
                                    className="vq-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="vq-confirm-approve"
                                    onClick={
                                        approveSubmission
                                    }
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                >
                                    {
                                        processingId !==
                                        null
                                            ? "Approving..."
                                            : "Confirm Approval"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>
                )
            }

            {/* =====================================================
                REJECT MODAL
            ===================================================== */}

            {
                modalType === "reject" &&
                selectedSubmission && (
                    <div
                        className="vq-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="vq-modal">

                            <div className="vq-modal-header">

                                <h2 className="vq-modal-title">
                                    Reject Verification
                                </h2>

                                <button
                                    type="button"
                                    className="vq-modal-close"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <div className="vq-modal-body">

                                <p>
                                    You are rejecting{" "}
                                    <strong>
                                        {
                                            selectedSubmission.name
                                        }
                                    </strong>
                                    .
                                </p>

                                <label className="vq-label">
                                    Rejection Reason
                                </label>

                                <textarea
                                    className="vq-textarea"
                                    value={
                                        rejectionReason
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setRejectionReason(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter the reason for rejection..."
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                />

                            </div>

                            <div className="vq-modal-footer">

                                <button
                                    type="button"
                                    className="vq-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        processingId !==
                                        null
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="vq-confirm-reject"
                                    onClick={
                                        rejectSubmission
                                    }
                                    disabled={
                                        processingId !==
                                            null ||
                                        !rejectionReason.trim()
                                    }
                                >
                                    {
                                        processingId !==
                                        null
                                            ? "Rejecting..."
                                            : "Confirm Rejection"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>
                )
            }

        </>
    );
}

export default VerificationQueue;
