import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function MyJobs() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);

    const [showProfileModal, setShowProfileModal] =
        useState(false);

    const [showApprovalModal, setShowApprovalModal] =
        useState(false);

    const [closeJobModal, setCloseJobModal] =
        useState(null);

    const [closingJobId, setClosingJobId] =
        useState(null);

    /* =====================================================
       LOAD PROFILE + JOBS
    ===================================================== */

    useEffect(() => {
        loadJobsAndProfile();
    }, []);

    async function loadJobsAndProfile() {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError("Please log in as an employer.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            /* =================================================
               LOAD EMPLOYER PROFILE
            ================================================= */

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

            /* =================================================
               LOAD EMPLOYER JOBS
            ================================================= */

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

            console.log(
                "EMPLOYER JOBS FULL:",
                jobsData
            );

            if (Array.isArray(jobsData)) {
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
            }

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

    /* =====================================================
       POST A JOB
    ===================================================== */

    function handlePostJob() {
        console.log(
            "POST JOB PROFILE:",
            profile
        );

        /* =================================================
           PROFILE NOT LOADED / NOT COMPLETED
        ================================================= */

        if (
            !profile ||
            profile.profile_completed !== true
        ) {
            setShowProfileModal(true);
            return;
        }

        /* =================================================
           PROFILE COMPLETED BUT NOT APPROVED
        ================================================= */

        if (
            profile.approval_status !== "approved"
        ) {
            setShowApprovalModal(true);
            return;
        }

        /* =================================================
           PROFILE COMPLETED + ADMIN APPROVED
        ================================================= */

        navigate("/employer/jobs/post");
    }

    /* =====================================================
       OPEN CLOSE JOB MODAL
    ===================================================== */

    function openCloseJobModal(job) {
        if (!job.is_active) {
            return;
        }

        setCloseJobModal(job);
    }

    /* =====================================================
       CLOSE JOB
    ===================================================== */

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

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

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

    /* =====================================================
       DASHBOARD STATISTICS
    ===================================================== */

    const totalJobs = jobs.length;

    const activeJobs = jobs.filter(
        (job) => job.is_active
    ).length;

    const closedJobs = jobs.filter(
        (job) => !job.is_active
    ).length;

    const totalApplicants = jobs.reduce(
        (total, job) =>
            total +
            Number(job.applicants_count || 0),
        0
    );

    /* =====================================================
       LINE CHART DATA
    ===================================================== */

    const chartData = useMemo(() => {
        if (!jobs.length) {
            return [];
        }

        return jobs.map((job, index) => ({
            label:
                job.title ||
                `Job ${index + 1}`,

            value:
                Number(
                    job.applicants_count || 0
                ),
        }));
    }, [jobs]);

    const chartMax = Math.max(
        1,
        ...chartData.map(
            (item) => item.value
        )
    );

    /* =====================================================
       CREATE SVG LINE CHART
    ===================================================== */

    function ApplicantLineChart() {
        if (!chartData.length) {
            return (
                <div className="chart-empty">
                    <div className="chart-empty-icon">
                        ◌
                    </div>

                    <p>
                        No applicant data available yet.
                    </p>
                </div>
            );
        }

        const width = 760;
        const height = 260;

        const paddingLeft = 55;
        const paddingRight = 25;
        const paddingTop = 25;
        const paddingBottom = 50;

        const chartWidth =
            width -
            paddingLeft -
            paddingRight;

        const chartHeight =
            height -
            paddingTop -
            paddingBottom;

        const getX = (index) => {
            if (chartData.length === 1) {
                return (
                    paddingLeft +
                    chartWidth / 2
                );
            }

            return (
                paddingLeft +
                (index /
                    (chartData.length - 1)) *
                    chartWidth
            );
        };

        const getY = (value) => {
            return (
                paddingTop +
                chartHeight -
                (value / chartMax) *
                    chartHeight
            );
        };

        const points = chartData.map(
            (item, index) => ({
                x: getX(index),
                y: getY(item.value),
            })
        );

        const linePoints =
            points
                .map(
                    (point) =>
                        `${point.x},${point.y}`
                )
                .join(" ");

        const areaPoints = `
            ${paddingLeft},${paddingTop + chartHeight}
            ${linePoints}
            ${paddingLeft + chartWidth},${paddingTop + chartHeight}
        `;

        return (
            <div className="line-chart-wrapper">
                <svg
                    className="applicant-line-chart"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Applicants per job line chart"
                >
                    {/* =====================================
                        GRID LINES
                    ===================================== */}

                    {[0, 1, 2, 3, 4].map(
                        (line) => {
                            const y =
                                paddingTop +
                                (chartHeight / 4) *
                                    line;

                            const value =
                                Math.round(
                                    chartMax -
                                    (chartMax / 4) *
                                        line
                                );

                            return (
                                <g key={line}>
                                    <line
                                        x1={
                                            paddingLeft
                                        }
                                        y1={y}
                                        x2={
                                            paddingLeft +
                                            chartWidth
                                        }
                                        y2={y}
                                        className="chart-grid-line"
                                    />

                                    <text
                                        x={
                                            paddingLeft -
                                            10
                                        }
                                        y={
                                            y + 4
                                        }
                                        textAnchor="end"
                                        className="chart-axis-text"
                                    >
                                        {value}
                                    </text>
                                </g>
                            );
                        }
                    )}

                    {/* =====================================
                        AREA
                    ===================================== */}

                    <polygon
                        points={areaPoints}
                        className="chart-area"
                    />

                    {/* =====================================
                        LINE
                    ===================================== */}

                    <polyline
                        points={linePoints}
                        fill="none"
                        className="chart-line"
                    />

                    {/* =====================================
                        DATA POINTS
                    ===================================== */}

                    {points.map(
                        (point, index) => (
                            <g key={index}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    className="chart-point"
                                />

                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="2.5"
                                    className="chart-point-inner"
                                />

                                <text
                                    x={point.x}
                                    y={
                                        point.y -
                                        12
                                    }
                                    textAnchor="middle"
                                    className="chart-value-text"
                                >
                                    {
                                        chartData[
                                            index
                                        ].value
                                    }
                                </text>
                            </g>
                        )
                    )}

                    {/* =====================================
                        X AXIS LABELS
                    ===================================== */}

                    {chartData.map(
                        (item, index) => {
                            const maxLabels = 8;

                            if (
                                chartData.length >
                                    maxLabels &&
                                index %
                                    Math.ceil(
                                        chartData.length /
                                            maxLabels
                                    ) !==
                                    0 &&
                                index !==
                                    chartData.length -
                                        1
                            ) {
                                return null;
                            }

                            const label =
                                item.label.length >
                                14
                                    ? item.label.substring(
                                          0,
                                          14
                                      ) + "..."
                                    : item.label;

                            return (
                                <text
                                    key={index}
                                    x={getX(index)}
                                    y={
                                        height -
                                        15
                                    }
                                    textAnchor="middle"
                                    className="chart-label-text"
                                >
                                    {label}
                                </text>
                            );
                        }
                    )}
                </svg>
            </div>
        );
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>
                    {myJobsCSS}
                </style>

                <div className="my-jobs-page">
                    <main className="my-jobs-main">
                        <div className="jobs-loading-screen">
                            <div className="loading-spinner"></div>

                            <p>
                                Loading your jobs...
                            </p>
                        </div>
                    </main>
                </div>
            </>
        );
    }

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <>
            <style>
                {myJobsCSS}
            </style>

            <div className="my-jobs-page">
                <main className="my-jobs-main">

                    {/* =================================================
                        PAGE HEADER
                    ================================================= */}

                    <section className="my-jobs-header">

                        <div className="page-heading">

                            <div className="heading-icon">
                                💼
                            </div>

                            <div>
                                <h1>
                                    My jobs
                                </h1>

                                <p>
                                    Manage your job
                                    postings and
                                    applications
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="post-job-button"
                            onClick={
                                handlePostJob
                            }
                        >
                            <span className="post-job-plus">
                                +
                            </span>

                            Post a job
                        </button>

                    </section>

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <section className="my-jobs-card error-card">

                            <div className="jobs-message jobs-error">
                                <span className="error-icon">
                                    ⚠
                                </span>

                                {error}
                            </div>

                        </section>
                    )}

                    {/* =================================================
                        STATISTICS
                    ================================================= */}

                    {!error && (
                        <section className="stats-grid">

                            <div className="stat-card">

                                <div className="stat-icon green">
                                    💼
                                </div>

                                <div className="stat-content">
                                    <span>
                                        Total jobs
                                    </span>

                                    <strong>
                                        {totalJobs}
                                    </strong>
                                </div>

                            </div>

                            <div className="stat-card">

                                <div className="stat-icon lime">
                                    ✓
                                </div>

                                <div className="stat-content">
                                    <span>
                                        Active jobs
                                    </span>

                                    <strong>
                                        {activeJobs}
                                    </strong>
                                </div>

                            </div>

                            <div className="stat-card">

                                <div className="stat-icon orange">
                                    ◷
                                </div>

                                <div className="stat-content">
                                    <span>
                                        Closed jobs
                                    </span>

                                    <strong>
                                        {closedJobs}
                                    </strong>
                                </div>

                            </div>

                            <div className="stat-card">

                                <div className="stat-icon blue">
                                    👥
                                </div>

                                <div className="stat-content">
                                    <span>
                                        Total applicants
                                    </span>

                                    <strong>
                                        {totalApplicants}
                                    </strong>
                                </div>

                            </div>

                        </section>
                    )}

                    {/* =================================================
                        APPLICANT LINE CHART
                    ================================================= */}

                    {!error &&
                        jobs.length > 0 && (
                            <section className="chart-card">

                                <div className="chart-header">

                                    <div>
                                        <h2>
                                            Applicant
                                            activity
                                        </h2>

                                        <p>
                                            Applicants
                                            received for
                                            each job
                                        </p>
                                    </div>

                                    <div className="chart-badge">
                                        <span></span>
                                        Applicants
                                    </div>

                                </div>

                                <ApplicantLineChart />

                            </section>
                        )}

                    {/* =================================================
                        NO JOBS
                    ================================================= */}

                    {!error &&
                        jobs.length === 0 && (
                            <section className="my-jobs-card empty-card">

                                <div className="empty-state">

                                    <div className="empty-icon">
                                        💼
                                    </div>

                                    <h2>
                                        No job postings yet
                                    </h2>

                                    <p>
                                        Start attracting
                                        talented candidates
                                        by posting your
                                        first job.
                                    </p>

                                    <button
                                        type="button"
                                        className="empty-post-button"
                                        onClick={
                                            handlePostJob
                                        }
                                    >
                                        + Post your first
                                        job
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

                                <div className="jobs-card-header">

                                    <div>
                                        <h2>
                                            Job postings
                                        </h2>

                                        <p>
                                            All your current
                                            and previous
                                            postings
                                        </p>
                                    </div>

                                    <span className="job-count-badge">
                                        {jobs.length}{" "}
                                        {jobs.length === 1
                                            ? "posting"
                                            : "postings"}
                                    </span>

                                </div>

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

                                    {jobs.map(
                                        (job) => (
                                            <div
                                                className={
                                                    `jobs-table-row ${
                                                        !job.is_active
                                                            ? "job-row-closed"
                                                            : ""
                                                    }`
                                                }
                                                key={
                                                    job.id
                                                }
                                            >

                                                {/* TITLE */}

                                                <div className="job-title-cell">

                                                    <div className="job-small-icon">
                                                        💼
                                                    </div>

                                                    <div className="job-title-wrapper">
                                                        <div className="job-title">
                                                            {
                                                                job.title ||
                                                                "—"
                                                            }
                                                        </div>

                                                        <span className="job-id">
                                                            Job #
                                                            {
                                                                job.id
                                                            }
                                                        </span>
                                                    </div>

                                                </div>

                                                {/* STATUS */}

                                                <div>

                                                    <span
                                                        className={
                                                            `job-status ${
                                                                job.is_active
                                                                    ? "published"
                                                                    : "closed"
                                                            }`
                                                        }
                                                    >
                                                        <span className="status-dot"></span>

                                                        {job.is_active
                                                            ? "ACTIVE"
                                                            : "CLOSED"}
                                                    </span>

                                                </div>

                                                {/* APPLICANTS */}

                                                <div className="applicant-count">
                                                    <span className="applicant-icon">
                                                        👥
                                                    </span>

                                                    {job.applicants_count ??
                                                        "—"}
                                                </div>

                                                {/* POSTED */}

                                                <div className="posted-date">

                                                    {job.posted_display ||
                                                        (job.created_at
                                                            ? new Date(
                                                                  job.created_at
                                                              ).toLocaleDateString()
                                                            : "—")}

                                                </div>

                                                {/* ACTION */}

                                                <div className="job-actions">

                                                    <Link
                                                        to={`/employer/jobs/${job.id}/applicants`}
                                                        className="job-action-link"
                                                    >
                                                        View applicants
                                                    </Link>

                                                    {job.is_active && (
                                                        <button
                                                            type="button"
                                                            className="close-job-button"
                                                            onClick={() =>
                                                                openCloseJobModal(
                                                                    job
                                                                )
                                                            }
                                                            disabled={
                                                                closingJobId ===
                                                                job.id
                                                            }
                                                        >
                                                            Close job
                                                        </button>
                                                    )}

                                                    {!job.is_active && (
                                                        <span className="job-closed-text">
                                                            Job closed
                                                        </span>
                                                    )}

                                                </div>

                                            </div>
                                        )
                                    )}

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
                            setShowProfileModal(
                                false
                            )
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
                                    setShowProfileModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                            <div className="employer-modal-icon warning">
                                ⚠️
                            </div>

                            <h2>
                                Complete your profile
                            </h2>

                            <p>
                                Please complete your
                                employer profile before
                                posting a job.
                            </p>

                            <div className="employer-modal-actions">

                                <button
                                    type="button"
                                    className="modal-secondary-button"
                                    onClick={() =>
                                        setShowProfileModal(
                                            false
                                        )
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
                    APPROVAL MODAL
                ===================================================== */}

                {showApprovalModal && (
                    <div
                        className="employer-modal-overlay"
                        onClick={() =>
                            setShowApprovalModal(
                                false
                            )
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
                                    setShowApprovalModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                            <div className="employer-modal-icon pending">
                                ⏳
                            </div>

                            <h2>
                                Account pending approval
                            </h2>

                            <p>
                                Your employer profile is
                                complete, but your account
                                has not been approved by
                                the administrator yet.
                            </p>

                            <p>
                                You can post a job after
                                your employer account is
                                approved.
                            </p>

                            {profile?.approval_status && (
                                <p className="approval-status-message">
                                    Current status:{" "}
                                    <strong>
                                        {
                                            profile.approval_status
                                        }
                                    </strong>
                                </p>
                            )}

                            <div className="employer-modal-actions">

                                <button
                                    type="button"
                                    className="modal-primary-button"
                                    onClick={() =>
                                        setShowApprovalModal(
                                            false
                                        )
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
                                setCloseJobModal(
                                    null
                                );
                            }
                        }}
                    >

                        <div
                            className="employer-modal close-job-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <button
                                type="button"
                                className="employer-modal-close"
                                onClick={() => {
                                    if (
                                        !closingJobId
                                    ) {
                                        setCloseJobModal(
                                            null
                                        );
                                    }
                                }}
                                disabled={
                                    !!closingJobId
                                }
                            >
                                ×
                            </button>

                            <div className="employer-modal-icon danger">
                                ⚠️
                            </div>

                            <h2>
                                Close this job?
                            </h2>

                            <p>
                                Are you sure you want
                                to close this job?
                            </p>

                            <div className="close-job-name">
                                <strong>
                                    {
                                        closeJobModal.title ||
                                        "This job"
                                    }
                                </strong>
                            </div>

                            <p className="close-job-warning">
                                Once you close this job,
                                it will be removed from
                                the Job Seeker Find Jobs
                                page and cannot be
                                reopened.
                            </p>

                            <div className="employer-modal-actions">

                                <button
                                    type="button"
                                    className="modal-secondary-button"
                                    onClick={() => {
                                        if (
                                            !closingJobId
                                        ) {
                                            setCloseJobModal(
                                                null
                                            );
                                        }
                                    }}
                                    disabled={
                                        !!closingJobId
                                    }
                                >
                                    Cancel
                                </button>

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
                                        : "Yes, Close Job"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>
        </>
    );
}

/* =========================================================
   CSS
========================================================= */

const myJobsCSS = `

/* =========================================================
   ROOT
========================================================= */

.my-jobs-page {
    --jobs-dark: #19352a;
    --jobs-green: #2f5d43;
    --jobs-green-light: #4f8062;
    --jobs-lime: #c7e36b;

    --jobs-bg: #f5f7f4;
    --jobs-card: #ffffff;

    --jobs-text: #17251d;
    --jobs-muted: #718078;

    --jobs-border: #e3e9e1;

    width: 100%;
    max-width:1100px;
    min-height: calc(100vh - 62px);
    

    background:
        linear-gradient(
            180deg,
            #f7f9f6 0%,
            #f2f5f1 100%
        );

    color: var(--jobs-text);

    font-family:
        "Inter",
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    padding: 32px 28px 50px;
}

.my-jobs-page *,
.my-jobs-page *::before,
.my-jobs-page *::after {
    box-sizing: border-box;
}


/* =========================================================
   MAIN
========================================================= */

.my-jobs-main {
    width: 100%;
    max-width: 950px;
    margin: 0 10px;
}


/* =========================================================
   HEADER
========================================================= */

.my-jobs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 24px;
}

.page-heading {
    display: flex;
    align-items: center;
    gap: 14px;
}

.heading-icon {
    width: 48px;
    height: 48px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 14px;

    background:
        linear-gradient(
            135deg,
            #e8f2e5,
            #f3f7ed
        );

    border: 1px solid #dce9d8;

    font-size: 21px;
}

.page-heading h1 {
    margin: 0 0 4px;

    color: var(--jobs-dark);

    font-size: 28px;
    font-weight: 800;

    letter-spacing: -0.7px;
}

.page-heading p {
    margin: 0;

    color: var(--jobs-muted);

    font-size: 13px;
    font-weight: 500;
}


/* =========================================================
   POST JOB
========================================================= */

.post-job-button {
    height: 42px;

    padding: 0 18px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    border: none;
    border-radius: 10px;

    background:
        linear-gradient(
            135deg,
            #315f45,
            #244b36
        );

    color: #ffffff;

    font-size: 12.5px;
    font-weight: 750;

    cursor: pointer;

    box-shadow:
        0 7px 18px
        rgba(47, 93, 67, 0.16);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.post-job-button:hover {
    transform: translateY(-2px);

    box-shadow:
        0 10px 24px
        rgba(47, 93, 67, 0.22);
}

.post-job-plus {
    font-size: 18px;
    line-height: 1;
}


/* =========================================================
   STATISTICS
========================================================= */

.stats-grid {
    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 15px;

    margin-bottom: 20px;
}

.stat-card {
    min-height: 100px;

    padding: 18px;

    display: flex;
    align-items: center;

    gap: 13px;

    background: var(--jobs-card);

    border:
        1px solid var(--jobs-border);

    border-radius: 14px;

    box-shadow:
        0 4px 16px
        rgba(25, 53, 42, 0.035);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);

    box-shadow:
        0 9px 24px
        rgba(25, 53, 42, 0.07);
}

.stat-icon {
    width: 44px;
    height: 44px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 12px;

    font-size: 18px;
}

.stat-icon.green {
    background: #e8f2e7;
    color: #2f5d43;
}

.stat-icon.lime {
    background: #f0f7d9;
    color: #637c25;
}

.stat-icon.orange {
    background: #fff1e5;
    color: #bb6a25;
}

.stat-icon.blue {
    background: #e8f0fa;
    color: #426a98;
}

.stat-content {
    display: flex;
    flex-direction: column;

    gap: 4px;
}

.stat-content span {
    color: var(--jobs-muted);

    font-size: 11px;
    font-weight: 600;
}

.stat-content strong {
    color: var(--jobs-dark);

    font-size: 23px;
    font-weight: 800;

    line-height: 1;
}


/* =========================================================
   CHART CARD
========================================================= */

.chart-card {
    width: 100%;

    margin-bottom: 20px;

    padding: 22px;

    background: #ffffff;

    border:
        1px solid var(--jobs-border);

    border-radius: 16px;

    box-shadow:
        0 4px 18px
        rgba(25, 53, 42, 0.035);
}

.chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 8px;
}

.chart-header h2 {
    margin: 0 0 4px;

    color: var(--jobs-dark);

    font-size: 16px;
    font-weight: 800;
}

.chart-header p {
    margin: 0;

    color: var(--jobs-muted);

    font-size: 11.5px;
}

.chart-badge {
    display: inline-flex;
    align-items: center;

    gap: 7px;

    padding: 6px 10px;

    border-radius: 20px;

    background: #f1f6ef;

    color: var(--jobs-green);

    font-size: 10.5px;
    font-weight: 700;

    white-space: nowrap;
}

.chart-badge span {
    width: 7px;
    height: 7px;

    border-radius: 50%;

    background: var(--jobs-green);
}


/* =========================================================
   LINE CHART
========================================================= */

.line-chart-wrapper {
    width: 100%;
    height: 270px;

    margin-top: 10px;

    overflow: hidden;
}

.applicant-line-chart {
    width: 100%;
    height: 100%;

    display: block;

    overflow: visible;
}

.chart-grid-line {
    stroke: #e8ede7;
    stroke-width: 1;
    stroke-dasharray: 4 5;
}

.chart-axis-text {
    fill: #8a958e;

    font-size: 10px;
    font-weight: 500;
}

.chart-area {
    fill: rgba(79, 128, 98, 0.10);
}

.chart-line {
    stroke: #2f5d43;

    stroke-width: 3;

    stroke-linecap: round;
    stroke-linejoin: round;

    filter:
        drop-shadow(
            0 3px 5px
            rgba(47, 93, 67, 0.15)
        );
}

.chart-point {
    fill: #ffffff;

    stroke: #2f5d43;

    stroke-width: 3;
}

.chart-point-inner {
    fill: #c7e36b;
}

.chart-value-text {
    fill: #2f5d43;

    font-size: 10px;
    font-weight: 800;
}

.chart-label-text {
    fill: #7b877f;

    font-size: 9px;
    font-weight: 600;
}

.chart-empty {
    height: 220px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 8px;

    color: var(--jobs-muted);
}

.chart-empty-icon {
    font-size: 30px;
}

.chart-empty p {
    margin: 0;

    font-size: 12px;
}


/* =========================================================
   MAIN CARD
========================================================= */

.my-jobs-card {
    width: 100%;

    background: var(--jobs-card);

    border:
        1px solid var(--jobs-border);

    border-radius: 16px;

    overflow: hidden;

    box-shadow:
        0 4px 18px
        rgba(25, 53, 42, 0.035);
}

.jobs-card-header {
    min-height: 74px;

    padding: 18px 22px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    border-bottom:
        1px solid var(--jobs-border);
}

.jobs-card-header h2 {
    margin: 0 0 4px;

    color: var(--jobs-dark);

    font-size: 16px;
    font-weight: 800;
}

.jobs-card-header p {
    margin: 0;

    color: var(--jobs-muted);

    font-size: 11.5px;
}

.job-count-badge {
    padding: 6px 10px;

    border-radius: 20px;

    background: #f0f5ee;

    color: var(--jobs-green);

    font-size: 10px;
    font-weight: 750;
}


/* =========================================================
   JOB TABLE
========================================================= */

.jobs-table {
    width: 100%;
}

.jobs-table-row {
    display: grid;

    grid-template-columns:
        minmax(230px, 2fr)
        minmax(100px, 0.8fr)
        minmax(100px, 0.8fr)
        minmax(100px, 0.8fr)
        minmax(220px, 1.5fr);

    align-items: center;

    min-height: 70px;

    padding: 10px 22px;

    gap: 16px;

    border-bottom:
        1px solid #edf0ec;
}

.jobs-table-row:last-child {
    border-bottom: none;
}

.jobs-table-header {
    min-height: 42px;

    background: #fafbf9;

    color: #87928b;

    font-size: 9px;
    font-weight: 800;

    letter-spacing: 0.7px;
}

.jobs-table-row:not(.jobs-table-header):hover {
    background: #fbfdfb;
}

.job-row-closed {
    background: #fcfcfb;
}

.job-row-closed .job-title {
    color: #8c958f;
}


/* =========================================================
   TITLE
========================================================= */

.job-title-cell {
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 11px;
}

.job-small-icon {
    width: 35px;
    height: 35px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #eef4eb;

    border-radius: 9px;

    font-size: 14px;
}

.job-title-wrapper {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
}

.job-title {
    color: var(--jobs-text);

    font-size: 12px;
    font-weight: 750;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.job-id {
    color: #98a19b;

    font-size: 9px;
    font-weight: 500;
}


/* =========================================================
   STATUS
========================================================= */

.job-status {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    width: fit-content;

    padding: 5px 8px;

    border-radius: 20px;

    font-size: 9px;
    font-weight: 800;

    letter-spacing: 0.2px;
}

.status-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;
}

.job-status.published {
    color: #2e704b;

    background: #eaf5eb;
}

.job-status.published .status-dot {
    background: #49a66b;
}

.job-status.closed {
    color: #8a6651;

    background: #f8eee8;
}

.job-status.closed .status-dot {
    background: #b88565;
}


/* =========================================================
   APPLICANTS
========================================================= */

.applicant-count {
    display: flex;
    align-items: center;

    gap: 6px;

    color: var(--jobs-text);

    font-size: 11.5px;
    font-weight: 650;
}

.applicant-icon {
    font-size: 12px;
}


/* =========================================================
   POSTED DATE
========================================================= */

.posted-date {
    color: #6f7b74;

    font-size: 10.5px;
    font-weight: 550;
}


/* =========================================================
   ACTIONS
========================================================= */

.job-actions {
    display: flex;
    align-items: center;

    justify-content: flex-start;

    gap: 8px;

    flex-wrap: wrap;
}

.job-action-link {
    min-height: 30px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0 10px;

    border-radius: 7px;

    color: var(--jobs-green);

    background: #eef5ec;

    text-decoration: none;

    font-size: 10px;
    font-weight: 700;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.job-action-link:hover {
    color: var(--jobs-green);

    background: #e2efdf;

    transform: translateY(-1px);
}

.close-job-button {
    min-height: 30px;

    padding: 0 10px;

    border:
        1px solid #f0d8d0;

    border-radius: 7px;

    background: #fff8f6;

    color: #a8402a;

    font-size: 10px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.close-job-button:hover {
    background: #fbe9e4;

    transform: translateY(-1px);
}

.close-job-button:disabled {
    opacity: 0.55;

    cursor: not-allowed;

    transform: none;
}

.job-closed-text {
    color: #9a7a68;

    font-size: 10px;
    font-weight: 650;
}


/* =========================================================
   EMPTY STATE
========================================================= */

.empty-card {
    min-height: 330px;

    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-state {
    max-width: 400px;

    padding: 45px 20px;

    text-align: center;
}

.empty-icon {
    width: 64px;
    height: 64px;

    margin: 0 auto 15px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 18px;

    background: #edf4ea;

    font-size: 28px;
}

.empty-state h2 {
    margin: 0 0 8px;

    color: var(--jobs-dark);

    font-size: 18px;
    font-weight: 800;
}

.empty-state p {
    margin: 0 0 20px;

    color: var(--jobs-muted);

    font-size: 12px;
    line-height: 1.6;
}

.empty-post-button {
    min-height: 38px;

    padding: 0 15px;

    border: none;
    border-radius: 9px;

    background: var(--jobs-green);

    color: #ffffff;

    font-size: 11px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.empty-post-button:hover {
    background: var(--jobs-dark);

    transform: translateY(-1px);
}


/* =========================================================
   ERROR
========================================================= */

.error-card {
    margin-bottom: 20px;
}

.jobs-message {
    min-height: 90px;

    padding: 20px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    color: var(--jobs-muted);

    font-size: 12px;

    text-align: center;
}

.jobs-error {
    color: #a8402a;

    background: #fff9f7;
}

.error-icon {
    font-size: 15px;
}


/* =========================================================
   LOADING
========================================================= */

.jobs-loading-screen {
    min-height: 450px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 13px;

    color: var(--jobs-muted);
}

.jobs-loading-screen p {
    margin: 0;

    font-size: 12px;
    font-weight: 600;
}

.loading-spinner {
    width: 34px;
    height: 34px;

    border:
        3px solid #e5ebe3;

    border-top-color:
        var(--jobs-green);

    border-radius: 50%;

    animation:
        myJobsSpin
        0.8s linear infinite;
}

@keyframes myJobsSpin {
    to {
        transform: rotate(360deg);
    }
}


/* =========================================================
   MODAL OVERLAY
========================================================= */

.employer-modal-overlay {
    position: fixed;

    inset: 0;

    z-index: 5000;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background:
        rgba(
            18,
            30,
            23,
            0.48
        );

    backdrop-filter:
        blur(5px);

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


/* =========================================================
   MODAL
========================================================= */

.employer-modal {
    position: relative;

    width: 100%;
    max-width: 430px;

    padding: 30px;

    background: #ffffff;

    border:
        1px solid #e3e9e1;

    border-radius: 18px;

    text-align: center;

    box-shadow:
        0 25px 70px
        rgba(16, 31, 23, 0.25);

    animation:
        modalIn
        0.22s ease;
}

@keyframes modalIn {
    from {
        opacity: 0;

        transform:
            translateY(10px)
            scale(0.97);
    }

    to {
        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }
}

.employer-modal-close {
    position: absolute;

    top: 12px;
    right: 13px;

    width: 30px;
    height: 30px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: none;

    background: #f3f6f2;

    color: #66736b;

    border-radius: 50%;

    font-size: 20px;

    cursor: pointer;
}

.employer-modal-close:hover {
    background: #e9eee8;

    color: var(--jobs-dark);
}

.employer-modal-icon {
    width: 54px;
    height: 54px;

    margin: 0 auto 15px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 16px;

    font-size: 24px;
}

.employer-modal-icon.warning {
    background: #fff4df;
}

.employer-modal-icon.pending {
    background: #eef3fb;
}

.employer-modal-icon.danger {
    background: #fceae5;
}

.employer-modal h2 {
    margin: 0 0 10px;

    color: var(--jobs-dark);

    font-size: 19px;
    font-weight: 800;
}

.employer-modal p {
    margin: 0 auto 10px;

    max-width: 350px;

    color: var(--jobs-muted);

    font-size: 12px;

    line-height: 1.6;
}

.approval-status-message {
    margin-top: 15px !important;

    padding: 9px 12px;

    border-radius: 8px;

    background: #f4f7f3;

    color: var(--jobs-text) !important;
}

.close-job-name {
    margin: 16px auto;

    padding: 12px 15px;

    max-width: 330px;

    border-radius: 9px;

    background: #f4f7f2;

    color: var(--jobs-dark);

    font-size: 12px;
}

.close-job-warning {
    color: #a66a54 !important;

    font-size: 11px !important;
}


/* =========================================================
   MODAL ACTIONS
========================================================= */

.employer-modal-actions {
    display: flex;

    justify-content: center;

    gap: 9px;

    margin-top: 22px;
}

.modal-primary-button,
.modal-secondary-button,
.modal-danger-button {
    min-height: 36px;

    padding: 0 15px;

    border-radius: 8px;

    font-size: 11px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.modal-primary-button {
    border: none;

    background: var(--jobs-green);

    color: #ffffff;
}

.modal-primary-button:hover {
    background: var(--jobs-dark);

    transform: translateY(-1px);
}

.modal-secondary-button {
    border:
        1px solid #dfe6de;

    background: #ffffff;

    color: #5e6b63;
}

.modal-secondary-button:hover {
    background: #f5f7f4;
}

.modal-danger-button {
    border: none;

    background: #b84c36;

    color: #ffffff;
}

.modal-danger-button:hover {
    background: #963b29;

    transform: translateY(-1px);
}

.modal-primary-button:disabled,
.modal-secondary-button:disabled,
.modal-danger-button:disabled {
    opacity: 0.55;

    cursor: not-allowed;

    transform: none;
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 1100px) {

    .my-jobs-page {
        padding:
            26px 20px 45px;
        width: 100%;
        box-sizing:border-box;
    }

    .stats-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .jobs-table-row {
        grid-template-columns:
            minmax(190px, 1.7fr)
            minmax(90px, 0.7fr)
            minmax(90px, 0.7fr)
            minmax(90px, 0.7fr)
            minmax(190px, 1.4fr);

        padding-left: 18px;
        padding-right: 18px;

        gap: 10px;
    }
}


/* =========================================================
   MOBILE TABLE
========================================================= */

@media (max-width: 800px) {

    .my-jobs-page {
        min-height: calc(100vh - 56px);
        width: 100%;
        box-sizing:border-box;

        padding:
            20px 12px;
        
    }

    .my-jobs-header {
        align-items: flex-start;

        flex-direction: column;
    }

    .post-job-button {
        width: 100%;
    }

    .stats-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));

        gap: 10px;
    }

    .stat-card {
        padding: 14px;

        min-height: 88px;
    }

    .stat-icon {
        width: 38px;
        height: 38px;

        font-size: 15px;
    }

    .stat-content strong {
        font-size: 20px;
    }

    .chart-card {
        padding: 15px;
    }

    .line-chart-wrapper {
        height: 230px;
    }

    .jobs-card-header {
        padding: 15px;
    }

    .jobs-table {
        overflow-x: auto;
    }

    .jobs-table-row {
        min-width: 850px;
    }

    .jobs-table-header {
        min-height: 40px;
    }
}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 480px) {

    .my-jobs-page {
        padding:
            17px 9px;

        width: 100%;
        box-sizing:border-box;
        
    }

    .page-heading {
        gap: 10px;
    }

    .heading-icon {
        width: 40px;
        height: 40px;

        border-radius: 11px;

        font-size: 17px;
    }

    .page-heading h1 {
        font-size: 22px;
    }

    .page-heading p {
        font-size: 10.5px;
    }

    .stats-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .stat-card {
        gap: 8px;

        padding: 12px;

        border-radius: 11px;
    }

    .stat-icon {
        width: 32px;
        height: 32px;

        border-radius: 9px;

        font-size: 13px;
    }

    .stat-content span {
        font-size: 9px;
    }

    .stat-content strong {
        font-size: 18px;
    }

    .chart-header {
        flex-direction: column;

        gap: 9px;
    }

    .chart-badge {
        align-self: flex-start;
    }

    .line-chart-wrapper {
        height: 200px;
    }

    .employer-modal {
        padding:
            25px 18px;

        border-radius: 15px;
    }

    .employer-modal-actions {
        flex-direction: column-reverse;
    }

    .modal-primary-button,
    .modal-secondary-button,
    .modal-danger-button {
        width: 100%;
    }
}

`;


export default MyJobs;