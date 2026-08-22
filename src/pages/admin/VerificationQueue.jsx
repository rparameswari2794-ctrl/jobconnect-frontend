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

            const response =
                await fetch(
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


            setSubmissions(
                normalizedData
            );


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

        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError("Admin login session has expired.");
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

        const submission = modal?.submission;

        if (!submission) {
            return;
        }

        const token = localStorage.getItem("jc_token");

        if (!token) {
            setModalError("Admin login session has expired.");
            return;
        }

        const processingKey =
            `${submission.type}-${submission.id}`;

        setProcessingId(processingKey);
        setModalError("");

        try {

            let endpoint;

            if (submission.type === "job seeker") {

                endpoint =
                    `${API_BASE}/admin/jobseekers/${submission.id}/approve/`;

            } else if (submission.type === "employer") {

                endpoint =
                    `${API_BASE}/admin/employers/${submission.id}/approve/`;

            } else {

                throw new Error("Invalid submission type.");

            }

            const response = await fetch(
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
                await response.json().catch(() => ({}));

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

            setSubmissions(previous =>
                previous.filter(
                    item =>
                        !(
                            item.id === submission.id &&
                            item.type === submission.type
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

        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError("Admin login session has expired.");
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

        const submission = modal?.submission;

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

            if (submission.type === "job seeker") {

                endpoint =
                    `${API_BASE}/admin/jobseekers/${submission.id}/reject/`;

            } else if (submission.type === "employer") {

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

            setSubmissions(previous =>
                previous.filter(
                    item =>
                        !(
                            item.id === submission.id &&
                            item.type === submission.type
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
    // DATE
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

    function handleViewProfile(submission) {

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

        <div className="admin-dashboard">

            <main className="admin-main">


                {/* =================================================
                    SUCCESS MESSAGE
                ================================================= */}

                {successMessage && (

                    <div className="verification-success-message">

                        <span>
                            ✓
                        </span>

                        {successMessage}

                    </div>

                )}


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="verification-queue-header">

                    <h1>
                        Verification queue
                    </h1>

                    <p>

                        {submissions.length} pending
                        submission
                        {submissions.length !== 1
                            ? "s"
                            : ""
                        }
                        {" "}waiting for admin verification.

                    </p>

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
                    TABLE
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="verification-table">


                        {/* =================================================
                            TABLE HEADER
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


                                                {/* VIEW */}

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


                                                {/* APPROVE */}

                                                <button
                                                    type="button"
                                                    className="approve-button"
                                                    disabled={processing}
                                                    onClick={() =>
                                                        handleApprove(submission)
                                                    }
                                                >
                                                    {processing
                                                        ? "Processing..."
                                                        : "Approve"
                                                    }
                                                </button>

                                                {/* REJECT */}

                                                <button
                                                    type="button"
                                                    className="reject-button"
                                                    disabled={processing}
                                                    onClick={() =>
                                                        handleReject(submission)
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

                </section>

            </main>


            {/* =====================================================
                APPROVE / REJECT MODAL
            ===================================================== */}

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
                                    Approve Job Seeker? or Employer?
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


                                    {/* CANCEL */}

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


                                    {/* APPROVE */}

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
                                    Reject Job Seeker? or Reject Employer
                                </h2>


                                <p>

                                    You are rejecting{" "}

                                    <strong>
                                        {modal.submission.name}
                                    </strong>

                                    .

                                </p>


                                {/* REASON */}

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


                                {/* ERROR */}

                                {modalError && (

                                    <div className="rejection-validation">

                                        {modalError}

                                    </div>

                                )}


                                <div className="verification-modal-actions">


                                    {/* CANCEL */}

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


                                    {/* REJECT */}

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

        </div>

    );
}

export default VerificationQueue;