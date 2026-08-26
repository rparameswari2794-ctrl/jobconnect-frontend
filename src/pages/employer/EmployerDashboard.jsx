import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function EmployerDashboard() {

    const [dashboard, setDashboard] = useState({
        employer_name: "",
        company_name: "",
        approval_status: "",
        live_postings: 0,
        closed_postings: 0,
        total_applicants: 0,
        jobs: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    useEffect(() => {
        loadDashboard();
    }, []);


    async function loadDashboard() {

        const token = localStorage.getItem("jc_token");

        console.log(
            "EMPLOYER DASHBOARD TOKEN EXISTS:",
            !!token
        );

        if (!token) {

            setError(
                "Please log in as an employer."
            );

            setLoading(false);

            return;
        }


        try {

            setLoading(true);
            setError("");


            const response = await fetch(
                `${API_BASE}/auth/employer/dashboard/`,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );


            console.log(
                "EMPLOYER DASHBOARD STATUS:",
                response.status
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "EMPLOYER DASHBOARD DATA:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to load employer dashboard."
                );
            }


            // =================================================
            // BACKEND RESPONSE
            // =================================================

            const profile =
                data.profile || {};

            const stats =
                data.stats || {};

            const jobs =
                Array.isArray(data.jobs)
                    ? data.jobs
                    : [];


            setDashboard({

                employer_name:
                    profile.contact_name || "",

                company_name:
                    profile.company_name || "",

                approval_status:
                    profile.approval_status || "",

                live_postings:
                    stats.live_jobs || 0,

                closed_postings:
                    stats.closed_jobs || 0,

                total_applicants:
                    stats.total_applicants || 0,

                jobs: jobs,

            });


        } catch (err) {

            console.error(
                "Employer dashboard error:",
                err
            );

            setError(
                err.message ||
                "Unable to load dashboard."
            );

        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // GET JOB STATUS
    // =====================================================

    function getJobStatus(job) {

        const status = String(
            job.status || ""
        )
            .toLowerCase()
            .trim();


        if (
            status === "live" ||
            status === "published" ||
            status === "active"
        ) {

            return "Live";
        }


        if (
            status === "closed" ||
            status === "inactive"
        ) {

            return "Closed";
        }


        if (job.is_active === true) {

            return "Live";
        }


        if (job.is_active === false) {

            return "Closed";
        }


        return "Closed";
    }


    // =====================================================
    // STATUS CSS CLASS
    // =====================================================

    function getStatusClass(status) {

        return (
            `employer-status ${status.toLowerCase()}`
        );
    }


    // =====================================================
    // PIE CHART
    // =====================================================

    const liveJobs =
        Number(dashboard.live_postings) || 0;

    const closedJobs =
        Number(dashboard.closed_postings) || 0;

    const totalJobs =
        liveJobs + closedJobs;

    const livePercentage =
        totalJobs > 0
            ? (liveJobs / totalJobs) * 100
            : 0;

    const closedPercentage =
        totalJobs > 0
            ? (closedJobs / totalJobs) * 100
            : 0;


    // =====================================================
    // LINE CHART DATA
    // =====================================================

    function getMonthlyJobData() {

        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const currentYear =
            new Date().getFullYear();

        const monthlyCounts =
            months.map(() => 0);


        dashboard.jobs.forEach((job) => {

            if (!job.created_at) {
                return;
            }

            const date =
                new Date(job.created_at);

            if (
                date.getFullYear() ===
                currentYear
            ) {

                const month =
                    date.getMonth();

                monthlyCounts[month]++;
            }

        });


        return months.map(
            (month, index) => ({
                month,
                value: monthlyCounts[index],
            })
        );
    }


    const lineData =
        getMonthlyJobData();


    const maxLineValue =
        Math.max(
            ...lineData.map(
                (item) => item.value
            ),
            1
        );


    // =====================================================
    // CREATE SVG LINE POINTS
    // =====================================================

    const chartWidth = 700;
    const chartHeight = 280;

    const chartPaddingX = 45;
    const chartPaddingY = 30;

    const usableWidth =
        chartWidth -
        chartPaddingX * 2;

    const usableHeight =
        chartHeight -
        chartPaddingY * 2;


    const linePoints =
        lineData.map(
            (item, index) => {

                const x =
                    chartPaddingX +
                    (
                        index /
                        (lineData.length - 1)
                    ) *
                    usableWidth;

                const y =
                    chartHeight -
                    chartPaddingY -
                    (
                        item.value /
                        maxLineValue
                    ) *
                    usableHeight;

                return {
                    ...item,
                    x,
                    y,
                };
            }
        );


    const linePath =
        linePoints
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="employer-dashboard-page">

                <main className="employer-dashboard-main">

                    <div className="dashboard-loading-card">

                        <div className="dashboard-loader"></div>

                        <p>
                            Loading dashboard...
                        </p>

                    </div>

                </main>

            </div>

        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="employer-dashboard-page">

                <main className="employer-dashboard-main">

                    <div className="dashboard-error-card">

                        <div className="error-icon">
                            !
                        </div>

                        <p className="dashboard-error">
                            {error}
                        </p>

                    </div>

                </main>

            </div>

        );
    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div className="employer-dashboard-page">

            <main className="employer-dashboard-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="employer-welcome">

                    <div className="welcome-content">

                        <div className="welcome-icon">
                            💼
                        </div>

                        <div>

                            <span className="welcome-label">
                                EMPLOYER DASHBOARD
                            </span>

                            <h1>

                                Welcome back,{" "}

                                {dashboard.employer_name ||
                                    dashboard.company_name ||
                                    "Employer"}

                            </h1>

                            <p>

                                {dashboard.company_name ||
                                    "Manage your jobs and applicants"}

                            </p>

                        </div>

                    </div>


                    <div className="approval-badge">

                        <span className="approval-dot"></span>

                        {dashboard.approval_status
                            ? dashboard.approval_status
                            : "Account"}

                    </div>

                </section>


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <section className="employer-stat-grid">


                    {/* CLOSED */}

                    <div className="employer-stat-card closed-card">

                        <div className="stat-card-top">

                            <div className="stat-icon">
                                📁
                            </div>

                            <span className="stat-arrow">
                                ↘
                            </span>

                        </div>

                        <h2>
                            {dashboard.closed_postings}
                        </h2>

                        <p>
                            CLOSED POSTINGS
                        </p>

                    </div>


                    {/* LIVE */}

                    <div className="employer-stat-card live-card">

                        <div className="stat-card-top">

                            <div className="stat-icon">
                                🚀
                            </div>

                            <span className="stat-arrow">
                                ↗
                            </span>

                        </div>

                        <h2>
                            {dashboard.live_postings}
                        </h2>

                        <p>
                            LIVE POSTINGS
                        </p>

                    </div>


                    {/* APPLICANTS */}

                    <div className="employer-stat-card applicants-card">

                        <div className="stat-card-top">

                            <div className="stat-icon">
                                👥
                            </div>

                            <span className="stat-arrow">
                                ↗
                            </span>

                        </div>

                        <h2>
                            {dashboard.total_applicants}
                        </h2>

                        <p>
                            TOTAL APPLICANTS
                        </p>

                    </div>


                </section>


                {/* =================================================
                    CHARTS
                ================================================= */}

                <section className="dashboard-charts-grid">


                    {/* =================================================
                        PIE CHART
                    ================================================= */}

                    <div className="dashboard-chart-card">

                        <div className="chart-header">

                            <div>

                                <span className="chart-small-title">
                                    JOB STATUS
                                </span>

                                <h2>
                                    Posting overview
                                </h2>

                            </div>

                            <div className="chart-header-icon">
                                ◔
                            </div>

                        </div>


                        <div className="pie-chart-area">

                            <div
                                className="pie-chart"
                                style={{
                                    background:
                                        totalJobs === 0
                                            ? "#e5e7eb"
                                            : `conic-gradient(
                                                #6366f1 0% ${livePercentage}%,
                                                #f97316 ${livePercentage}% 100%
                                            )`
                                }}
                            >

                                <div className="pie-chart-inner">

                                    <strong>
                                        {totalJobs}
                                    </strong>

                                    <span>
                                        Total Jobs
                                    </span>

                                </div>

                            </div>


                            <div className="pie-legend">

                                <div className="legend-item">

                                    <span className="legend-color live-color"></span>

                                    <div>

                                        <strong>
                                            {liveJobs}
                                        </strong>

                                        <span>
                                            Live Jobs
                                        </span>

                                    </div>

                                </div>


                                <div className="legend-item">

                                    <span className="legend-color closed-color"></span>

                                    <div>

                                        <strong>
                                            {closedJobs}
                                        </strong>

                                        <span>
                                            Closed Jobs
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        LINE CHART
                    ================================================= */}

                    <div className="dashboard-chart-card line-chart-card">

                        <div className="chart-header">

                            <div>

                                <span className="chart-small-title">
                                    JOB ACTIVITY
                                </span>

                                <h2>
                                    Jobs created this year
                                </h2>

                            </div>

                            <div className="chart-header-icon purple-icon">
                                ↗
                            </div>

                        </div>


                        <div className="line-chart-wrapper">

                            <svg
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                className="job-line-chart"
                                preserveAspectRatio="none"
                            >

                                {/* GRID LINES */}

                                {[0, 1, 2, 3, 4].map(
                                    (line) => {

                                        const y =
                                            chartPaddingY +
                                            (
                                                line / 4
                                            ) *
                                            usableHeight;

                                        return (

                                            <line
                                                key={line}
                                                x1={chartPaddingX}
                                                y1={y}
                                                x2={
                                                    chartWidth -
                                                    chartPaddingX
                                                }
                                                y2={y}
                                                className="chart-grid-line"
                                            />

                                        );

                                    }
                                )}


                                {/* AREA */}

                                <path
                                    d={`
                                        ${linePath}
                                        L ${linePoints[linePoints.length - 1].x}
                                        ${chartHeight - chartPaddingY}
                                        L ${linePoints[0].x}
                                        ${chartHeight - chartPaddingY}
                                        Z
                                    `}
                                    className="line-chart-area"
                                />


                                {/* LINE */}

                                <path
                                    d={linePath}
                                    className="job-line-path"
                                />


                                {/* POINTS */}

                                {linePoints.map(
                                    (point) => (

                                        <circle
                                            key={point.month}
                                            cx={point.x}
                                            cy={point.y}
                                            r="5"
                                            className="job-line-point"
                                        />

                                    )
                                )}

                            </svg>


                            <div className="line-chart-labels">

                                {lineData.map(
                                    (item) => (

                                        <span
                                            key={
                                                item.month
                                            }
                                        >
                                            {item.month}
                                        </span>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    JOB POSTS
                ================================================= */}

                <section className="employer-postings-card">

                    <div className="posting-card-heading">

                        <div>

                            <span className="chart-small-title">
                                JOB MANAGEMENT
                            </span>

                            <h2>
                                Your job postings
                            </h2>

                        </div>

                        <span className="posting-count">

                            {dashboard.jobs.length}{" "}
                            {dashboard.jobs.length === 1
                                ? "Job"
                                : "Jobs"}

                        </span>

                    </div>


                    <div className="employer-table">


                        {/* TABLE HEADER */}

                        <div className="employer-table-row employer-table-header">

                            <div>
                                JOB TITLE
                            </div>

                            <div>
                                STATUS
                            </div>

                            <div>
                                CREATED
                            </div>

                        </div>


                        {/* NO JOBS */}

                        {dashboard.jobs.length === 0 ? (

                            <div className="employer-empty-state">

                                <div className="empty-job-icon">
                                    📋
                                </div>

                                <strong>
                                    No job postings yet
                                </strong>

                                <span>
                                    Create your first job posting
                                    to start receiving applicants.
                                </span>

                            </div>

                        ) : (

                            dashboard.jobs.map((job) => {

                                const status =
                                    getJobStatus(job);


                                return (

                                    <div
                                        className="employer-table-row"
                                        key={job.id}
                                    >


                                        {/* JOB TITLE */}

                                        <div className="employer-job-title">

                                            <span className="job-row-icon">
                                                💼
                                            </span>

                                            {job.title ||
                                                "Untitled Job"}

                                        </div>


                                        {/* STATUS */}

                                        <div>

                                            <span
                                                className={getStatusClass(
                                                    status
                                                )}
                                            >

                                                <span className="status-dot"></span>

                                                {status}

                                            </span>

                                        </div>


                                        {/* CREATED */}

                                        <div className="created-date">

                                            {job.created_at
                                                ? new Date(
                                                    job.created_at
                                                ).toLocaleDateString()
                                                : "-"}

                                        </div>


                                    </div>

                                );

                            })

                        )}

                    </div>

                </section>


                {/* =================================================
                    CREATE JOB
                ================================================= */}

                <div className="employer-dashboard-actions">

                    {dashboard.approval_status === "approved" ? (

                        <Link
                            to="/employer/jobs/post"
                            className="create-job-button"
                        >
                            <span>+</span>
                            Create job posting
                        </Link>

                    ) : (

                        <button
                            type="button"
                            className="create-job-button"
                            disabled
                        >
                            <span>+</span>
                            Create job posting
                        </button>

                    )}

                </div>


            </main>

        </div>

    );

}


export default EmployerDashboard;