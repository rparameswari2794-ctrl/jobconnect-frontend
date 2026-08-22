import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function MyJobs() {

    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    // Job currently selected for closing
    const [closeJobModal, setCloseJobModal] = useState(null);

    // Job currently being closed
    const [closingJobId, setClosingJobId] = useState(null);


    // =====================================================
    // LOAD PROFILE + JOBS
    // =====================================================

    useEffect(() => {

        loadJobsAndProfile();

    }, []);


    async function loadJobsAndProfile() {

        const token = localStorage.getItem("jc_token");

        if (!token) {

            setError(
                "Please log in as an employer."
            );

            setLoading(false);

            return;
        }


        try {

            // =================================================
            // LOAD EMPLOYER PROFILE
            // =================================================

            const profileResponse = await fetch(
                `${API_BASE}/auth/employer/profile/`,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            if (!profileResponse.ok) {

                let message =
                    "Unable to load employer profile.";

                try {

                    const errorData =
                        await profileResponse.json();

                    message =
                        errorData.message ||
                        message;

                } catch {

                    // Ignore JSON parsing error

                }

                throw new Error(message);
            }


            const profileData =
                await profileResponse.json();


            console.log(
                "EMPLOYER PROFILE:",
                profileData
            );


            setProfile(profileData);


            // =================================================
            // LOAD EMPLOYER JOBS
            // =================================================

            const jobsResponse = await fetch(
                `${API_BASE}/auth/employer/jobs/`,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            if (!jobsResponse.ok) {

                let message =
                    "Unable to load jobs.";

                try {

                    const errorData =
                        await jobsResponse.json();

                    message =
                        errorData.message ||
                        message;

                } catch {

                    // Ignore JSON parsing error

                }

                throw new Error(message);
            }


            const jobsData =
                await jobsResponse.json();


            console.log("EMPLOYER JOBS FULL:", jobsData);

            jobsData.forEach((job) => {
                console.log(
                    "JOB:",
                    job.id,
                    "|",
                    job.title,
                    "| is_active:",
                    job.is_active,
                    "| type:",
                    typeof job.is_active
                );
            });


            setJobs(
                Array.isArray(jobsData)
                    ? jobsData
                    : []
            );

        } catch (err) {

            console.error(
                "MY JOBS ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load jobs."
            );

        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // POST A JOB
    // =====================================================

    function handlePostJob() {

        console.log(
            "POST JOB PROFILE:",
            profile
        );


        // =================================================
        // PROFILE NOT LOADED / NOT COMPLETED
        // =================================================

        if (
            !profile ||
            profile.profile_completed !== true
        ) {

            setShowProfileModal(true);

            return;
        }


        // =================================================
        // PROFILE COMPLETED BUT NOT APPROVED
        // =================================================

        if (
            profile.approval_status !== "approved"
        ) {

            setShowApprovalModal(true);

            return;
        }


        // =================================================
        // PROFILE COMPLETED + ADMIN APPROVED
        // =================================================

        navigate(
            "/employer/jobs/post"
        );
    }


    // =====================================================
    // OPEN CLOSE JOB MODAL
    // =====================================================

    function openCloseJobModal(job) {

        // Do not open modal for an already closed job
        if (!job.is_active) {

            return;
        }

        setCloseJobModal(job);
    }


    // =====================================================
    // CLOSE JOB
    // =====================================================

    async function handleCloseJob(jobId) {

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Please log in as an employer."
            );

            return;
        }


        try {

            setClosingJobId(jobId);


            // =================================================
            // CLOSE JOB API
            // =================================================

            const response = await fetch(
                `${API_BASE}/auth/employer/jobs/${jobId}/close/`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        is_active: false,
                    }),
                }
            );


            // =================================================
            // READ RESPONSE SAFELY
            // =================================================

            let data = {};

            try {

                data = await response.json();

            } catch {

                data = {};

            }


            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to close the job."
                );
            }


            console.log(
                "JOB CLOSED:",
                data
            );


            // =================================================
            // UPDATE JOB IN MY JOBS
            //
            // IMPORTANT:
            // Do NOT remove the job from this list.
            //
            // Only change:
            // is_active = false
            // =================================================

            setJobs((currentJobs) => {

                return currentJobs.map((job) => {

                    if (job.id === jobId) {

                        return {
                            ...job,
                            is_active: false,
                        };
                    }

                    return job;
                });

            });


            // =================================================
            // CLOSE MODAL
            // =================================================

            setCloseJobModal(null);

        } catch (err) {

            console.error(
                "CLOSE JOB ERROR:",
                err
            );

            alert(
                err.message ||
                "Unable to close the job."
            );

        } finally {

            setClosingJobId(null);
        }
    }


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="my-jobs-page">

                <main className="my-jobs-main">

                    <div className="jobs-message">

                        Loading jobs...

                    </div>

                </main>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="my-jobs-page">

            <main className="my-jobs-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="my-jobs-header">

                    <div>

                        <h1>
                            My jobs
                        </h1>

                        <p>

                            {jobs.length} posting
                            {jobs.length === 1
                                ? ""
                                : "s"}

                        </p>

                    </div>


                    {/* =============================================
                        POST JOB BUTTON
                    ============================================= */}

                    <button
                        type="button"
                        className="post-job-button"
                        onClick={handlePostJob}
                    >

                        + Post a job

                    </button>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <section className="my-jobs-card">

                        <div className="jobs-message jobs-error">

                            {error}

                        </div>

                    </section>

                )}


                {/* =================================================
                    NO JOBS
                ================================================= */}

                {!error &&
                    jobs.length === 0 && (

                        <section className="my-jobs-card">

                            <div className="jobs-message">

                                No job postings yet.

                                <br />

                                <button
                                    type="button"
                                    className="empty-post-link"
                                    onClick={
                                        handlePostJob
                                    }
                                >

                                    Post your first job

                                </button>

                            </div>

                        </section>

                    )}


                {/* =================================================
                    JOB LIST
                ================================================= */}

                {!error &&
                    jobs.length > 0 && (

                        <section className="my-jobs-card">

                            <div className="jobs-table">


                                {/* =================================
                                    TABLE HEADER
                                ================================= */}

                                <div className="jobs-table-row jobs-table-header">

                                    <div>
                                        TITLE
                                    </div>

                                    <div>
                                        STATUS
                                    </div>

                                    <div>
                                        APPLICANTS
                                    </div>

                                    <div>
                                        POSTED
                                    </div>

                                    <div>
                                        ACTION
                                    </div>

                                </div>


                                {/* =================================
                                    JOB LIST
                                ================================= */}

                                {jobs.map((job) => (

                                    <div
                                        className={
                                            `jobs-table-row ${!job.is_active
                                                ? "job-row-closed"
                                                : ""
                                            }`
                                        }
                                        key={job.id}
                                    >


                                        {/* =============================
                                            TITLE
                                        ============================= */}

                                        <div className="job-title">

                                            {job.title || "—"}

                                        </div>


                                        {/* =============================
                                            STATUS
                                        ============================= */}

                                        <div>

                                            <span
                                                className={
                                                    `job-status ${job.is_active
                                                        ? "published"
                                                        : "closed"
                                                    }`
                                                }
                                            >

                                                {job.is_active
                                                    ? "ACTIVE"
                                                    : "CLOSED"}

                                            </span>

                                        </div>


                                        {/* =============================
                                            APPLICANTS
                                        ============================= */}

                                        <div>

                                            {job.applicants_count ??
                                                "—"}

                                        </div>


                                        {/* =============================
                                            POSTED
                                        ============================= */}

                                        <div>

                                            {job.posted_display ||

                                                (
                                                    job.created_at
                                                        ? new Date(
                                                            job.created_at
                                                        ).toLocaleDateString()
                                                        : "—"
                                                )}

                                        </div>


                                        {/* =====================================================
    ACTION
===================================================== */}

                                        <div className="job-actions">

                                            {/* =================================================
        VIEW APPLICANTS
        Available for BOTH active and closed jobs
    ================================================= */}

                                            <Link
                                                to={`/employer/jobs/${job.id}/applicants`}
                                                className="job-action-link"
                                            >
                                                View applicants
                                            </Link>


                                            {/* =================================================
        ACTIVE JOB
        Show Close Job button only while active
    ================================================= */}

                                            {job.is_active && (

                                                <button
                                                    type="button"
                                                    className="close-job-button"
                                                    onClick={() =>
                                                        openCloseJobModal(job)
                                                    }
                                                    disabled={
                                                        closingJobId === job.id
                                                    }
                                                >
                                                    Close job
                                                </button>

                                            )}


                                            {/* =================================================
        CLOSED JOB
        Do not show Close Job button
    ================================================= */}

                                            {!job.is_active && (

                                                <span className="job-closed-text">
                                                    Job closed
                                                </span>

                                            )}

                                        </div>
                                    </div>

                                ))}

                            </div>

                        </section>

                    )}

            </main>


            {/* =====================================================
                PROFILE INCOMPLETE MODAL
            ===================================================== */}

            {showProfileModal && (

                <div
                    className="employer-modal-overlay"
                    onClick={() =>
                        setShowProfileModal(false)
                    }
                >

                    <div
                        className="employer-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="employer-modal-close"
                            onClick={() =>
                                setShowProfileModal(false)
                            }
                        >

                            ×

                        </button>


                        <div className="employer-modal-icon">

                            ⚠️

                        </div>


                        <h2>

                            Complete your profile

                        </h2>


                        <p>

                            Please complete your employer
                            profile before posting a job.

                        </p>


                        <div className="employer-modal-actions">

                            <button
                                type="button"
                                className="modal-secondary-button"
                                onClick={() =>
                                    setShowProfileModal(false)
                                }
                            >

                                Cancel

                            </button>


                            <button
                                type="button"
                                className="modal-primary-button"
                                onClick={() => {

                                    setShowProfileModal(
                                        false
                                    );

                                    navigate(
                                        "/employer/profile"
                                    );

                                }}
                            >

                                Complete profile

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                APPROVAL PENDING / REJECTED MODAL
            ===================================================== */}

            {showApprovalModal && (

                <div
                    className="employer-modal-overlay"
                    onClick={() =>
                        setShowApprovalModal(false)
                    }
                >

                    <div
                        className="employer-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="employer-modal-close"
                            onClick={() =>
                                setShowApprovalModal(false)
                            }
                        >

                            ×

                        </button>


                        <div className="employer-modal-icon">

                            ⏳

                        </div>


                        <h2>

                            Account pending approval

                        </h2>


                        <p>

                            Your employer profile is complete,
                            but your account has not been approved
                            by the administrator yet.

                        </p>


                        <p>

                            You can post a job after your
                            employer account is approved.

                        </p>


                        {profile?.approval_status && (

                            <p className="approval-status-message">

                                Current status:{" "}

                                <strong>

                                    {profile.approval_status}

                                </strong>

                            </p>

                        )}


                        <div className="employer-modal-actions">

                            <button
                                type="button"
                                className="modal-primary-button"
                                onClick={() =>
                                    setShowApprovalModal(false)
                                }
                            >

                                Okay

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                CLOSE JOB CONFIRMATION MODAL
            ===================================================== */}

            {closeJobModal && (

                <div
                    className="employer-modal-overlay"
                    onClick={() => {

                        if (!closingJobId) {

                            setCloseJobModal(null);

                        }

                    }}
                >

                    <div
                        className="employer-modal close-job-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* =========================================
                            CLOSE MODAL BUTTON
                        ========================================= */}

                        <button
                            type="button"
                            className="employer-modal-close"
                            onClick={() => {

                                if (!closingJobId) {

                                    setCloseJobModal(null);

                                }

                            }}
                            disabled={
                                !!closingJobId
                            }
                        >

                            ×

                        </button>


                        {/* =========================================
                            ICON
                        ========================================= */}

                        <div className="employer-modal-icon">

                            ⚠️

                        </div>


                        {/* =========================================
                            TITLE
                        ========================================= */}

                        <h2>

                            Close this job?

                        </h2>


                        {/* =========================================
                            MESSAGE
                        ========================================= */}

                        <p>

                            Are you sure you want to close this job?

                        </p>


                        {/* =========================================
                            JOB TITLE
                        ========================================= */}

                        <div className="close-job-name">

                            <strong>

                                {closeJobModal.title ||
                                    "This job"}

                            </strong>

                        </div>


                        {/* =========================================
                            WARNING
                        ========================================= */}

                        <p className="close-job-warning">

                            Once you close this job, it will be
                            removed from the Job Seeker Find Jobs
                            page and cannot be reopened.

                        </p>


                        {/* =========================================
                            BUTTONS
                        ========================================= */}

                        <div className="employer-modal-actions">


                            {/* CANCEL */}

                            <button
                                type="button"
                                className="modal-secondary-button"
                                onClick={() => {

                                    if (!closingJobId) {

                                        setCloseJobModal(null);

                                    }

                                }}
                                disabled={
                                    !!closingJobId
                                }
                            >

                                Cancel

                            </button>


                            {/* CONFIRM */}

                            <button
                                type="button"
                                className="modal-danger-button"
                                onClick={() =>
                                    handleCloseJob(
                                        closeJobModal.id
                                    )
                                }
                                disabled={
                                    closingJobId ===
                                    closeJobModal.id
                                }
                            >

                                {closingJobId ===
                                    closeJobModal.id

                                    ? "Closing..."

                                    : "Yes, Close Job"

                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default MyJobs;