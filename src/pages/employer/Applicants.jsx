import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Applicants() {

    const { jobId } = useParams();
    const navigate = useNavigate();

    const [applicants, setApplicants] = useState([]);
    const [job, setJob] = useState(null);

    const [activeFilter, setActiveFilter] =
        useState("all");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [updatingId, setUpdatingId] =
        useState(null);


    // =====================================================
    // LOAD APPLICANTS
    // =====================================================

    useEffect(() => {

        if (jobId) {
            fetchApplicants();
        }

    }, [jobId]);


    async function fetchApplicants() {

        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("jc_token");

        if (!token) {

            setError(
                "Please log in as an employer."
            );

            setLoading(false);
            return;
        }

        try {

            const response = await fetch(
                `${API_BASE}/auth/employer/jobs/${jobId}/applicants/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
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
                "EMPLOYER APPLICANTS:",
                data
            );


            if (!response.ok) {

                if (response.status === 401) {

                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load applicants."
                );
            }


            setJob(
                data.job || null
            );


            if (
                Array.isArray(
                    data.applicants
                )
            ) {

                setApplicants(
                    data.applicants
                );

            } else {

                setApplicants([]);
            }


        } catch (err) {

            console.error(
                "APPLICANTS ERROR:",
                err
            );

            setError(
                err.message ||
                "Could not load applicants."
            );

            setApplicants([]);

        } finally {

            setLoading(false);
        }
    }


    // =====================================================
    // NORMALIZE STATUS
    // =====================================================

    function normalizeStatus(status) {

        if (!status) {
            return "APPLIED";
        }

        return status
            .trim()
            .toUpperCase();
    }


    // =====================================================
    // STATUS LABEL
    // =====================================================

    function getStatusLabel(status) {

        const normalized =
            normalizeStatus(status);

        switch (normalized) {

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
                return "Applied";
        }
    }


    // =====================================================
    // STATUS CLASS
    // =====================================================

    function getStatusClass(status) {

        const normalized =
            normalizeStatus(status);

        switch (normalized) {

            case "APPLIED":
                return "applicant-status applied";

            case "UNDER REVIEW":
                return "applicant-status under-review";

            case "SHORTLISTED":
                return "applicant-status shortlisted";

            case "INTERVIEW SCHEDULED":
                return "applicant-status interview-scheduled";

            case "REJECTED":
                return "applicant-status rejected";

            case "HIRED":
                return "applicant-status hired";

            default:
                return "applicant-status";
        }
    }


    // =====================================================
    // FILTER
    // =====================================================

    const filteredApplicants =
        applicants.filter(
            (applicant) => {

                if (
                    activeFilter === "all"
                ) {
                    return true;
                }

                const status =
                    normalizeStatus(
                        applicant.status
                    );


                if (
                    activeFilter ===
                    "under review"
                ) {

                    return (
                        status ===
                        "UNDER REVIEW"
                    );
                }


                return (
                    status ===
                    activeFilter
                        .toUpperCase()
                );
            }
        );


    // =====================================================
    // COUNTS
    // =====================================================

    const appliedCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "APPLIED"
        ).length;


    const underReviewCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "UNDER REVIEW"
        ).length;


    const shortlistedCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "SHORTLISTED"
        ).length;


    const interviewCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "INTERVIEW SCHEDULED"
        ).length;


    const rejectedCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "REJECTED"
        ).length;


    const hiredCount =
        applicants.filter(
            (a) =>
                normalizeStatus(
                    a.status
                ) === "HIRED"
        ).length;


    // =====================================================
    // UPDATE STATUS
    // =====================================================

    async function updateStatus(
        applicationId,
        newStatus
    ) {

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            alert(
                "Please log in as an employer."
            );

            return;
        }


        setUpdatingId(applicationId);
        setError("");


        console.log(
            "UPDATE APPLICATION:",
            applicationId,
            newStatus
        );


        try {

            const response = await fetch(
                `${API_BASE}/auth/employer/applications/${applicationId}/status/`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "STATUS RESPONSE:",
                response.status,
                data
            );


            if (!response.ok) {

                if (
                    response.status === 401
                ) {

                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }


                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to update application status."
                );
            }


            // =================================================
            // UPDATE UI WITHOUT RELOADING
            // =================================================

            setApplicants(
                (previous) =>
                    previous.map(
                        (applicant) => {

                            if (
                                applicant.id !==
                                applicationId
                            ) {

                                return applicant;
                            }


                            return {
                                ...applicant,

                                status:
                                    data.status ||
                                    newStatus,
                            };
                        }
                    )
            );


        } catch (err) {

            console.error(
                "UPDATE STATUS ERROR:",
                err
            );

            alert(
                err.message ||
                "Unable to update application status."
            );

        } finally {

            setUpdatingId(null);
        }
    }


    // =====================================================
    // CHECK IF FINAL STATUS
    // =====================================================

    function isFinalStatus(status) {

        const normalized =
            normalizeStatus(status);

        return (
            normalized === "REJECTED" ||
            normalized === "HIRED"
        );
    }


    // =====================================================
    // CHECK IF BUTTON IS CURRENT STATUS
    // =====================================================

    function isCurrentStatus(
        applicant,
        buttonStatus
    ) {

        return (
            normalizeStatus(
                applicant.status
            ) === buttonStatus
        );
    }


    // =====================================================
    // VIEW PROFILE
    // =====================================================

    function handleViewApplicant(
        applicant
    ) {

        if (!applicant?.id) {

            alert(
                "Application ID is missing."
            );

            return;
        }


        navigate(
            `/employer/applicants/${applicant.id}`
        );
    }


    // =====================================================
    // CANDIDATE
    // =====================================================

    function getCandidate(
        applicant
    ) {

        return (
            applicant?.jobseeker ||
            {}
        );
    }


    // =====================================================
    // NAME
    // =====================================================

    function getCandidateName(
        applicant
    ) {

        const candidate =
            getCandidate(applicant);

        return (
            candidate.full_name ||
            candidate.name ||
            "Candidate"
        );
    }


    // =====================================================
    // INITIALS
    // =====================================================

    function getInitials(
        applicant
    ) {

        const name =
            getCandidateName(
                applicant
            );


        if (
            !name ||
            name === "Candidate"
        ) {

            return "--";
        }


        return name
            .split(" ")
            .filter(Boolean)
            .map(
                (part) =>
                    part[0]
            )
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }


    // =====================================================
    // DATE
    // =====================================================

    function formatDate(
        dateValue
    ) {

        if (!dateValue) {
            return "Recently";
        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Recently";
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
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="applicants-page">

                <main className="applicants-main">

                    <div className="applicants-message">
                        Loading applicants...
                    </div>

                </main>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="applicants-page">

            <main className="applicants-main">

                {/* HEADER */}

                <section className="applicants-header">

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/employer/jobs"
                            )
                        }
                    >
                        ← Back to My Jobs
                    </button>


                    <h1>
                        Applicants
                    </h1>


                    {job && (
                        <p>
                            Applications for{" "}
                            <strong>
                                {job.title}
                            </strong>
                        </p>
                    )}


                    <p>
                        {applicants.length}{" "}
                        applicant
                        {applicants.length !== 1
                            ? "s"
                            : ""}
                    </p>

                </section>


                {/* ERROR */}

                {error && (

                    <div className="applicants-message error">
                        {error}
                    </div>

                )}


                {/* FILTERS */}

                {!error && (

                    <div className="applicant-filters">

                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "all"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "all"
                                )
                            }
                        >
                            All ({applicants.length})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "applied"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "applied"
                                )
                            }
                        >
                            Applied ({appliedCount})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "under review"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "under review"
                                )
                            }
                        >
                            Under Review ({underReviewCount})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "shortlisted"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "shortlisted"
                                )
                            }
                        >
                            Shortlisted ({shortlistedCount})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "interview scheduled"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "interview scheduled"
                                )
                            }
                        >
                            Interview Scheduled ({interviewCount})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "rejected"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "rejected"
                                )
                            }
                        >
                            Rejected ({rejectedCount})
                        </button>


                        <button
                            type="button"
                            className={
                                activeFilter ===
                                    "hired"
                                    ? "applicant-filter active"
                                    : "applicant-filter"
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "hired"
                                )
                            }
                        >
                            Hired ({hiredCount})
                        </button>

                    </div>

                )}


                {/* EMPTY */}

                {!error &&
                    filteredApplicants.length ===
                    0 && (

                        <div className="applicants-message">
                            No applicants found.
                        </div>

                    )}


                {/* TABLE */}

                {!error &&
                    filteredApplicants.length >
                    0 && (

                        <section className="applicants-card">

                            <div className="applicants-table">

                                {/* TABLE HEADER */}

                                <div className="applicant-row applicant-header-row">

                                    <div>
                                        CANDIDATE
                                    </div>

                                    

                                    <div>
                                        APPLIED
                                    </div>

                                    <div>
                                        VERIFIED
                                    </div>

                                    <div>
                                        STATUS
                                    </div>

                                    <div>
                                        ACTION
                                    </div>

                                </div>


                                {/* APPLICANTS */}

                                {filteredApplicants.map(
                                    (applicant) => {

                                        const candidate =
                                            getCandidate(
                                                applicant
                                            );


                                        const candidateName =
                                            getCandidateName(
                                                applicant
                                            );


                                        const status =
                                            normalizeStatus(
                                                applicant.status
                                            );


                                        const isUpdating =
                                            updatingId ===
                                            applicant.id;


                                        const finalStatus =
                                            isFinalStatus(
                                                status
                                            );


                                        return (

                                            <div
                                                className="applicant-row"
                                                key={
                                                    applicant.id
                                                }
                                            >

                                                {/* CANDIDATE */}

                                                <div className="candidate-info">

                                                    <div className="candidate-avatar">

                                                        {getInitials(
                                                            applicant
                                                        )}

                                                    </div>


                                                    <div className="candidate-details">

                                                        <strong>
                                                            {
                                                                candidateName
                                                            }
                                                        </strong>


                                                        {candidate.headline && (

                                                            <span>
                                                                {
                                                                    candidate.headline
                                                                }
                                                            </span>

                                                        )}

                                                    </div>

                                                </div>


                                                


                                                {/* APPLIED */}

                                                <div>

                                                    {formatDate(
                                                        applicant.applied_at
                                                    )}

                                                </div>


                                                {/* VERIFIED */}

                                                <div>

                                                    {candidate.approval_status ===
                                                        "approved" ? (

                                                        <span className="verified-check">
                                                            ✓ Verified
                                                        </span>

                                                    ) : (

                                                        <span className="not-verified">
                                                            —
                                                        </span>

                                                    )}

                                                </div>


                                                {/* CURRENT STATUS */}

                                                <div>

                                                    <span
                                                        className={
                                                            getStatusClass(
                                                                status
                                                            )
                                                        }
                                                    >
                                                        {
                                                            getStatusLabel(
                                                                status
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                {/* ACTIONS */}

                                                <div className="applicant-actions">

                                                    {/* VIEW PROFILE */}

                                                    <button
                                                        type="button"
                                                        className="view-button"
                                                        onClick={() =>
                                                            handleViewApplicant(
                                                                applicant
                                                            )
                                                        }
                                                    >
                                                        View Profile
                                                    </button>


                                                    {/* =========================
                                                        APPLIED
                                                    ========================= */}

                                                    {status ===
                                                        "APPLIED" && (

                                                            <button
                                                                type="button"
                                                                className="under-review-button"
                                                                disabled={
                                                                    isUpdating ||
                                                                    finalStatus
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        applicant.id,
                                                                        "UNDER REVIEW"
                                                                    )
                                                                }
                                                            >
                                                                {isUpdating
                                                                    ? "Updating..."
                                                                    : "Under Review"}
                                                            </button>

                                                        )}


                                                    {/* =========================
                                                        UNDER REVIEW
                                                    ========================= */}

                                                    {status ===
                                                        "UNDER REVIEW" && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    className="under-review-button active-status-button"
                                                                    disabled
                                                                >
                                                                    ✓ Under Review
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="shortlist-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "SHORTLISTED"
                                                                        )
                                                                    }
                                                                >
                                                                    {isUpdating
                                                                        ? "Updating..."
                                                                        : "Shortlist"}
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="reject-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "REJECTED"
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>

                                                            </>

                                                        )}


                                                    {/* =========================
                                                        SHORTLISTED
                                                    ========================= */}

                                                    {status ===
                                                        "SHORTLISTED" && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    className="under-review-button"
                                                                    disabled
                                                                >
                                                                    ✓ Under Review
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="shortlist-button active-status-button"
                                                                    disabled
                                                                >
                                                                    ✓ Shortlisted
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="interview-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "INTERVIEW SCHEDULED"
                                                                        )
                                                                    }
                                                                >
                                                                    Interview Scheduled
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="reject-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "REJECTED"
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>

                                                            </>

                                                        )}


                                                    {/* =========================
                                                        INTERVIEW SCHEDULED
                                                    ========================= */}

                                                    {status ===
                                                        "INTERVIEW SCHEDULED" && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    className="under-review-button"
                                                                    disabled
                                                                >
                                                                    ✓ Under Review
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="shortlist-button"
                                                                    disabled
                                                                >
                                                                    ✓ Shortlisted
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="interview-button active-status-button"
                                                                    disabled
                                                                >
                                                                    ✓ Interview Scheduled
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="reject-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "REJECTED"
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="hire-button"
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            applicant.id,
                                                                            "HIRED"
                                                                        )
                                                                    }
                                                                >
                                                                    Hire
                                                                </button>

                                                            </>

                                                        )}


                                                    {/* =========================
                                                        REJECTED
                                                    ========================= */}

                                                    {status ===
                                                        "REJECTED" && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    className="reject-button active-status-button"
                                                                    disabled
                                                                >
                                                                    ✓ Rejected
                                                                </button>

                                                            </>

                                                        )}


                                                    {/* =========================
                                                        HIRED
                                                    ========================= */}

                                                    {status ===
                                                        "HIRED" && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    className="hire-button active-status-button"
                                                                    disabled
                                                                >
                                                                    ✓ Hired
                                                                </button>

                                                            </>

                                                        )}

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                        </section>

                    )}

            </main>

        </div>
    );
}

export default Applicants;