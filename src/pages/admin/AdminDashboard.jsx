import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError("Admin login session not found.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/admin/dashboard/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            console.log(
                "ADMIN DASHBOARD:",
                response.status,
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load dashboard."
                );
            }

            setDashboard(data);

        } catch (err) {
            console.error("Dashboard error:", err);

            setError(
                err.message ||
                "Unable to load dashboard."
            );

        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>{adminDashboardCSS}</style>

                <div className="admin-dashboard">
                    <main className="admin-main">

                        <div className="dashboard-loading-card">
                            <div className="loading-spinner"></div>
                            <h3>Loading dashboard...</h3>
                            <p>
                                Please wait while we load the latest
                                platform statistics.
                            </p>
                        </div>

                    </main>
                </div>
            </>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <>
                <style>{adminDashboardCSS}</style>

                <div className="admin-dashboard">
                    <main className="admin-main">

                        <div className="dashboard-error-card">

                            <div className="error-icon">
                                !
                            </div>

                            <h3>
                                Unable to load dashboard
                            </h3>

                            <p>
                                {error}
                            </p>

                            <button
                                className="retry-button"
                                onClick={loadDashboard}
                            >
                                Try Again
                            </button>

                        </div>

                    </main>
                </div>
            </>
        );
    }

    /* =====================================================
       DASHBOARD DATA
    ===================================================== */

    const pendingVerifications =
        dashboard?.pending_verifications ?? 0;

    const pendingJobseekers =
        dashboard?.pending_jobseekers ?? 0;

    const pendingEmployers =
        dashboard?.pending_employers ?? 0;

    const rejectedAccounts =
        dashboard?.rejected_accounts ?? 0;

    const totalUsers =
        dashboard?.total_users ?? 0;

    const liveJobPosts =
        dashboard?.live_job_posts ?? 0;

    const totalJobseekers =
        dashboard?.total_jobseekers ?? 0;

    const totalEmployers =
        dashboard?.total_employers ?? 0;

    /* =====================================================
       CHART DATA
       Uses existing API values only.
    ===================================================== */

    const chartData = [
        {
            label: "Job Seekers",
            value: totalJobseekers,
            className: "chart-jobseekers",
        },
        {
            label: "Employers",
            value: totalEmployers,
            className: "chart-employers",
        },
        {
            label: "Live Jobs",
            value: liveJobPosts,
            className: "chart-jobs",
        },
        {
            label: "Pending",
            value: pendingVerifications,
            className: "chart-pending",
        },
        {
            label: "Rejected",
            value: rejectedAccounts,
            className: "chart-rejected",
        },
    ];

    const maxChartValue = Math.max(
        ...chartData.map((item) => item.value),
        1
    );

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <style>{adminDashboardCSS}</style>

            <div className="admin-dashboard">

                <main className="admin-main">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <section className="dashboard-header">

                        <div>
                            <div className="dashboard-eyebrow">
                                ADMIN PANEL
                            </div>

                            <h1>
                                Admin dashboard
                            </h1>

                            <p>
                                Platform health and verification overview
                            </p>
                        </div>

                        <div className="dashboard-status">
                            <span className="status-dot"></span>
                            Platform active
                        </div>

                    </section>


                    {/* =================================================
                        STATISTICS CARDS
                    ================================================= */}

                    <section className="trust-overview">

                        <div className="section-heading">

                            <div>
                                <h2>
                                    Trust overview
                                </h2>

                                <p>
                                    Platform health at a glance
                                </p>
                            </div>

                        </div>


                        <div className="admin-stat-grid">

                            {/* PENDING VERIFICATIONS */}

                            <div className="admin-stat-card pending-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon pending-icon">
                                        ✓
                                    </div>

                                    <span className="stat-label">
                                        PENDING
                                    </span>

                                </div>

                                <h3>
                                    {pendingVerifications}
                                </h3>

                                <p>
                                    Pending verifications
                                </p>

                                <small>
                                    {pendingJobseekers} job seeker
                                    {pendingJobseekers !== 1 ? "s" : ""}
                                    {" · "}
                                    {pendingEmployers} employer
                                    {pendingEmployers !== 1 ? "s" : ""}
                                </small>

                            </div>


                            {/* REJECTED ACCOUNTS */}

                            <div className="admin-stat-card rejected-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon rejected-icon">
                                        !
                                    </div>

                                    <span className="stat-label">
                                        REJECTED
                                    </span>

                                </div>

                                <h3>
                                    {rejectedAccounts}
                                </h3>

                                <p>
                                    Rejected accounts
                                </p>

                                <small>
                                    Requires attention
                                </small>

                            </div>


                            {/* TOTAL USERS */}

                            <div className="admin-stat-card users-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon users-icon">
                                        U
                                    </div>

                                    <span className="stat-label">
                                        USERS
                                    </span>

                                </div>

                                <h3>
                                    {totalUsers}
                                </h3>

                                <p>
                                    Total users
                                </p>

                                <small>
                                    Excluding admin
                                </small>

                            </div>


                            {/* LIVE JOB POSTS */}

                            <div className="admin-stat-card jobs-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon jobs-icon">
                                        J
                                    </div>

                                    <span className="stat-label">
                                        JOBS
                                    </span>

                                </div>

                                <h3>
                                    {liveJobPosts}
                                </h3>

                                <p>
                                    Live job posts
                                </p>

                                <small>
                                    Currently active
                                </small>

                            </div>


                            {/* JOB SEEKERS */}

                            <div className="admin-stat-card seeker-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon seeker-icon">
                                        JS
                                    </div>

                                    <span className="stat-label">
                                        JOB SEEKERS
                                    </span>

                                </div>

                                <h3>
                                    {totalJobseekers}
                                </h3>

                                <p>
                                    Approved job seekers
                                </p>

                                <small>
                                    Verified accounts
                                </small>

                            </div>


                            {/* EMPLOYERS */}

                            <div className="admin-stat-card employer-card">

                                <div className="stat-card-top">

                                    <div className="stat-icon employer-icon">
                                        E
                                    </div>

                                    <span className="stat-label">
                                        EMPLOYERS
                                    </span>

                                </div>

                                <h3>
                                    {totalEmployers}
                                </h3>

                                <p>
                                    Approved employers
                                </p>

                                <small>
                                    Verified companies
                                </small>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        APPLICATION / PLATFORM STATISTICS CHART
                    ================================================= */}

                    <section className="statistics-section">

                        <div className="statistics-header">

                            <div>
                                <h2>
                                    Application statistics
                                </h2>

                                <p>
                                    Current platform activity overview
                                </p>
                            </div>

                            <div className="statistics-total">
                                <span>
                                    Total users
                                </span>

                                <strong>
                                    {totalUsers}
                                </strong>
                            </div>

                        </div>


                        <div className="chart-container">

                            <div className="chart-y-axis">

                                <span>
                                    {maxChartValue}
                                </span>

                                <span>
                                    {Math.round(maxChartValue * 0.75)}
                                </span>

                                <span>
                                    {Math.round(maxChartValue * 0.5)}
                                </span>

                                <span>
                                    {Math.round(maxChartValue * 0.25)}
                                </span>

                                <span>
                                    0
                                </span>

                            </div>


                            <div className="bar-chart">

                                <div className="chart-grid-lines">

                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>

                                </div>


                                <div className="bars-area">

                                    {chartData.map(
                                        (item, index) => {

                                            const height =
                                                item.value === 0
                                                    ? 3
                                                    : Math.max(
                                                        (item.value /
                                                            maxChartValue) *
                                                        100,
                                                        5
                                                    );

                                            return (
                                                <div
                                                    className="bar-column"
                                                    key={item.label}
                                                >

                                                    <div className="bar-value">
                                                        {item.value}
                                                    </div>

                                                    <div className="bar-wrapper">

                                                        <div
                                                            className={`chart-bar ${item.className}`}
                                                            style={{
                                                                height: `${height}%`,
                                                            }}
                                                        ></div>

                                                    </div>

                                                    <div className="bar-label">
                                                        {item.label}
                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                        </div>


                        {/* CHART LEGEND */}

                        <div className="chart-legend">

                            <div>
                                <span className="legend-dot seeker-dot"></span>
                                Job Seekers
                            </div>

                            <div>
                                <span className="legend-dot employer-dot"></span>
                                Employers
                            </div>

                            <div>
                                <span className="legend-dot jobs-dot"></span>
                                Live Jobs
                            </div>

                            <div>
                                <span className="legend-dot pending-dot"></span>
                                Pending
                            </div>

                            <div>
                                <span className="legend-dot rejected-dot"></span>
                                Rejected
                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        VERIFICATION BREAKDOWN
                    ================================================= */}

                    <section className="bottom-section">

                        <div className="breakdown-card">

                            <div className="breakdown-header">

                                <div>
                                    <h2>
                                        Verification overview
                                    </h2>

                                    <p>
                                        Current verification workload
                                    </p>
                                </div>

                            </div>


                            <div className="verification-list">

                                <div className="verification-row">

                                    <div className="verification-info">

                                        <span className="verification-icon pending-small">
                                            P
                                        </span>

                                        <div>
                                            <strong>
                                                Pending job seekers
                                            </strong>

                                            <small>
                                                Waiting for verification
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="verification-number">
                                        {pendingJobseekers}
                                    </strong>

                                </div>


                                <div className="verification-row">

                                    <div className="verification-info">

                                        <span className="verification-icon employer-small">
                                            E
                                        </span>

                                        <div>
                                            <strong>
                                                Pending employers
                                            </strong>

                                            <small>
                                                Waiting for verification
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="verification-number">
                                        {pendingEmployers}
                                    </strong>

                                </div>


                                <div className="verification-row">

                                    <div className="verification-info">

                                        <span className="verification-icon rejected-small">
                                            R
                                        </span>

                                        <div>
                                            <strong>
                                                Rejected accounts
                                            </strong>

                                            <small>
                                                Accounts requiring attention
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="verification-number rejected-number">
                                        {rejectedAccounts}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        {/* PLATFORM SUMMARY */}

                        <div className="summary-card">

                            <div className="summary-header">

                                <div>
                                    <h2>
                                        Platform summary
                                    </h2>

                                    <p>
                                        Current approved accounts
                                    </p>
                                </div>

                            </div>


                            <div className="summary-content">

                                <div className="summary-item">

                                    <span className="summary-circle">
                                        JS
                                    </span>

                                    <div>
                                        <strong>
                                            {totalJobseekers}
                                        </strong>

                                        <span>
                                            Job seekers
                                        </span>
                                    </div>

                                </div>


                                <div className="summary-item">

                                    <span className="summary-circle">
                                        E
                                    </span>

                                    <div>
                                        <strong>
                                            {totalEmployers}
                                        </strong>

                                        <span>
                                            Employers
                                        </span>
                                    </div>

                                </div>


                                <div className="summary-item">

                                    <span className="summary-circle">
                                        J
                                    </span>

                                    <div>
                                        <strong>
                                            {liveJobPosts}
                                        </strong>

                                        <span>
                                            Live jobs
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>

                </main>

            </div>
        </>
    );
}


/* =========================================================
   ADMIN DASHBOARD CSS
========================================================= */

const adminDashboardCSS = `

* {
    box-sizing: border-box;
}


/* =========================================================
   MAIN
========================================================= */

.admin-dashboard {
    width: 100%;
    min-height: calc(100vh - 62px);
    background: #f5f7f5;
    color: #19352a;
}


.admin-main {
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding: 34px 36px 50px;
}


/* =========================================================
   HEADER
========================================================= */

.dashboard-header {
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 30px;
}


.dashboard-eyebrow {
    color: #5d7868;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 7px;
}


.dashboard-header h1 {
    margin: 0;
    color: #19352a;
    font-size: 30px;
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -0.7px;
}


.dashboard-header p {
    margin: 8px 0 0;
    color: #718078;
    font-size: 13px;
}


.dashboard-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    background: #ffffff;
    border: 1px solid #e4ebe4;
    border-radius: 20px;
    color: #527060;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
}


.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #55a56d;
    box-shadow: 0 0 0 4px #eaf5ec;
}


/* =========================================================
   TRUST OVERVIEW
========================================================= */

.trust-overview {
    width: 100%;
}


.section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}


.section-heading h2,
.statistics-header h2,
.breakdown-header h2,
.summary-header h2 {
    margin: 0;
    color: #19352a;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.25px;
}


.section-heading p,
.statistics-header p,
.breakdown-header p,
.summary-header p {
    margin: 5px 0 0;
    color: #7a8780;
    font-size: 11.5px;
}


/* =========================================================
   STAT GRID
========================================================= */

.admin-stat-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
}


/* =========================================================
   STAT CARD
========================================================= */

.admin-stat-card {
    min-width: 0;
    min-height: 172px;

    padding: 18px;

    background: #ffffff;

    border: 1px solid #e5ebe5;
    border-radius: 14px;

    box-shadow:
        0 5px 18px rgba(25, 53, 42, 0.045);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}


.admin-stat-card:hover {
    transform: translateY(-3px);

    border-color: #d6e2d8;

    box-shadow:
        0 10px 26px rgba(25, 53, 42, 0.08);
}


.stat-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}


.stat-icon {
    width: 34px;
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 9px;

    font-size: 10px;
    font-weight: 800;
}


.pending-icon {
    background: #edf5df;
    color: #557b39;
}


.rejected-icon {
    background: #faece8;
    color: #a34c39;
}


.users-icon {
    background: #edf2f7;
    color: #4d687d;
}


.jobs-icon {
    background: #eaf4ef;
    color: #397056;
}


.seeker-icon {
    background: #eef3e8;
    color: #557344;
}


.employer-icon {
    background: #edf1f7;
    color: #536b88;
}


.stat-label {
    color: #98a39d;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.7px;
}


.admin-stat-card h3 {
    margin: 17px 0 3px;

    color: #19352a;

    font-size: 29px;
    line-height: 1;

    font-weight: 800;

    letter-spacing: -0.8px;
}


.admin-stat-card p {
    margin: 0;

    color: #42534a;

    font-size: 11.5px;
    font-weight: 700;
}


.admin-stat-card small {
    display: block;

    margin-top: 9px;

    color: #8a968f;

    font-size: 10px;
    line-height: 1.4;
}


/* =========================================================
   APPLICATION STATISTICS
========================================================= */

.statistics-section {
    margin-top: 28px;

    padding: 23px 24px 18px;

    background: #ffffff;

    border: 1px solid #e4ebe5;
    border-radius: 16px;

    box-shadow:
        0 6px 22px rgba(25, 53, 42, 0.045);
}


.statistics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 24px;
}


.statistics-total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
}


.statistics-total span {
    color: #8a968f;
    font-size: 10px;
}


.statistics-total strong {
    color: #19352a;
    font-size: 20px;
    font-weight: 800;
}


/* =========================================================
   BAR CHART
========================================================= */

.chart-container {
    width: 100%;

    height: 310px;

    display: flex;

    gap: 12px;
}


.chart-y-axis {
    width: 40px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    padding: 0 0 36px;

    color: #9aa49e;

    font-size: 9px;

    text-align: right;
}


.bar-chart {
    position: relative;

    flex: 1;

    min-width: 0;

    height: 100%;
}


.chart-grid-lines {
    position: absolute;

    inset: 0 0 36px 0;

    display: flex;

    flex-direction: column;

    justify-content: space-between;

    pointer-events: none;
}


.chart-grid-lines span {
    width: 100%;

    height: 1px;

    background: #edf1ed;
}


.bars-area {
    position: relative;

    height: 100%;

    display: flex;

    align-items: stretch;

    justify-content: space-around;

    gap: 20px;

    padding: 0 25px;
}


.bar-column {
    position: relative;

    height: 100%;

    flex: 1;

    max-width: 120px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: flex-end;
}


.bar-value {
    position: absolute;

    bottom: 45px;

    color: #486052;

    font-size: 10px;

    font-weight: 800;
}


.bar-wrapper {
    position: absolute;

    left: 50%;

    bottom: 37px;

    transform: translateX(-50%);

    width: 45px;

    height: calc(100% - 62px);

    display: flex;

    align-items: flex-end;

    justify-content: center;
}


.chart-bar {
    width: 100%;

    min-height: 3px;

    border-radius: 8px 8px 3px 3px;

    transition:
        height 0.6s ease,
        opacity 0.2s ease;
}


.chart-bar:hover {
    opacity: 0.75;
}


.chart-jobseekers {
    background: linear-gradient(
        180deg,
        #6f9a55,
        #416d3e
    );
}


.chart-employers {
    background: linear-gradient(
        180deg,
        #7694b3,
        #4d6e8f
    );
}


.chart-jobs {
    background: linear-gradient(
        180deg,
        #73a487,
        #397056
    );
}


.chart-pending {
    background: linear-gradient(
        180deg,
        #b7d978,
        #789e4e
    );
}


.chart-rejected {
    background: linear-gradient(
        180deg,
        #d98976,
        #aa5140
    );
}


.bar-label {
    position: absolute;

    bottom: 8px;

    width: 100%;

    color: #69766f;

    font-size: 10px;
    font-weight: 650;

    text-align: center;

    white-space: nowrap;
}


/* =========================================================
   CHART LEGEND
========================================================= */

.chart-legend {
    display: flex;

    align-items: center;

    justify-content: center;

    flex-wrap: wrap;

    gap: 18px;

    padding-top: 15px;

    border-top: 1px solid #edf1ed;
}


.chart-legend div {
    display: inline-flex;

    align-items: center;

    gap: 6px;

    color: #6f7d75;

    font-size: 10px;
    font-weight: 600;
}


.legend-dot {
    width: 7px;
    height: 7px;

    border-radius: 50%;
}


.seeker-dot {
    background: #557b46;
}


.employer-dot {
    background: #587695;
}


.jobs-dot {
    background: #397056;
}


.pending-dot {
    background: #8ba85c;
}


.rejected-dot {
    background: #b25a47;
}


/* =========================================================
   BOTTOM SECTION
========================================================= */

.bottom-section {
    display: grid;

    grid-template-columns: 1.4fr 1fr;

    gap: 18px;

    margin-top: 18px;
}


.breakdown-card,
.summary-card {
    min-width: 0;

    background: #ffffff;

    border: 1px solid #e4ebe5;

    border-radius: 16px;

    padding: 21px 22px;

    box-shadow:
        0 6px 22px rgba(25, 53, 42, 0.04);
}


/* =========================================================
   VERIFICATION LIST
========================================================= */

.verification-list {
    margin-top: 16px;
}


.verification-row {
    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 15px;

    padding: 13px 0;

    border-bottom: 1px solid #eef2ee;
}


.verification-row:last-child {
    border-bottom: none;

    padding-bottom: 2px;
}


.verification-info {
    min-width: 0;

    display: flex;

    align-items: center;

    gap: 10px;
}


.verification-icon {
    width: 31px;
    height: 31px;

    flex-shrink: 0;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 8px;

    font-size: 9px;
    font-weight: 800;
}


.pending-small {
    color: #5f7e3f;
    background: #edf5df;
}


.employer-small {
    color: #536e8c;
    background: #edf2f7;
}


.rejected-small {
    color: #a04b39;
    background: #faece8;
}


.verification-info div {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
}


.verification-info strong {
    color: #35463d;

    font-size: 11px;
    font-weight: 700;
}


.verification-info small {
    color: #909a94;

    font-size: 9.5px;
}


.verification-number {
    color: #274635;

    font-size: 16px;
    font-weight: 800;
}


.rejected-number {
    color: #a34c39;
}


/* =========================================================
   PLATFORM SUMMARY
========================================================= */

.summary-content {
    display: flex;

    flex-direction: column;

    gap: 10px;

    margin-top: 18px;
}


.summary-item {
    display: flex;

    align-items: center;

    gap: 11px;

    padding: 11px;

    background: #f8faf8;

    border: 1px solid #edf1ed;

    border-radius: 10px;
}


.summary-circle {
    width: 35px;
    height: 35px;

    flex-shrink: 0;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 9px;

    background: #e9f1e8;

    color: #4e704f;

    font-size: 9px;

    font-weight: 800;
}


.summary-item div {
    display: flex;

    flex-direction: column;

    gap: 2px;
}


.summary-item strong {
    color: #274635;

    font-size: 16px;

    font-weight: 800;
}


.summary-item span:not(.summary-circle) {
    color: #89948e;

    font-size: 9.5px;
}


/* =========================================================
   LOADING
========================================================= */

.dashboard-loading-card {
    min-height: 300px;

    display: flex;

    flex-direction: column;

    align-items: center;
    justify-content: center;

    background: #ffffff;

    border: 1px solid #e5ebe5;

    border-radius: 16px;
}


.loading-spinner {
    width: 34px;
    height: 34px;

    margin-bottom: 15px;

    border: 3px solid #e6ede6;

    border-top-color: #4f8062;

    border-radius: 50%;

    animation:
        dashboardSpin
        0.8s linear infinite;
}


@keyframes dashboardSpin {
    to {
        transform: rotate(360deg);
    }
}


.dashboard-loading-card h3 {
    margin: 0;

    color: #30473a;

    font-size: 15px;
}


.dashboard-loading-card p {
    margin: 6px 0 0;

    color: #8a968f;

    font-size: 11px;
}


/* =========================================================
   ERROR
========================================================= */

.dashboard-error-card {
    min-height: 300px;

    display: flex;

    flex-direction: column;

    align-items: center;
    justify-content: center;

    padding: 30px;

    background: #ffffff;

    border: 1px solid #f0ddd8;

    border-radius: 16px;

    text-align: center;
}


.error-icon {
    width: 42px;
    height: 42px;

    display: flex;

    align-items: center;
    justify-content: center;

    margin-bottom: 12px;

    border-radius: 50%;

    background: #faece8;

    color: #a34c39;

    font-size: 18px;

    font-weight: 800;
}


.dashboard-error-card h3 {
    margin: 0;

    color: #5a332b;

    font-size: 16px;
}


.dashboard-error-card p {
    max-width: 500px;

    margin: 7px 0 18px;

    color: #8b726d;

    font-size: 11px;
}


.retry-button {
    border: none;

    padding: 9px 17px;

    border-radius: 8px;

    background: #315f45;

    color: #ffffff;

    font-size: 11px;

    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}


.retry-button:hover {
    background: #264c37;

    transform: translateY(-1px);
}


/* =========================================================
   LARGE TABLET
========================================================= */

@media (max-width: 1200px) {

    .admin-main {
        padding: 30px 24px 45px;
    }

    .admin-stat-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 800px) {

    .admin-main {
        padding: 25px 18px 40px;
    }


    .dashboard-header {
        align-items: flex-start;

        flex-direction: column;

        margin-bottom: 24px;
    }


    .dashboard-header h1 {
        font-size: 26px;
    }


    .dashboard-status {
        align-self: flex-start;
    }


    .admin-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }


    .bottom-section {
        grid-template-columns: 1fr;
    }

}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 560px) {

    .admin-dashboard {
        min-height: calc(100vh - 60px);
    }


    .admin-main {
        padding: 20px 13px 35px;
    }


    .dashboard-header h1 {
        font-size: 23px;
    }


    .dashboard-header p {
        font-size: 11px;
    }


    .admin-stat-grid {
        grid-template-columns: 1fr 1fr;

        gap: 10px;
    }


    .admin-stat-card {
        min-height: 155px;

        padding: 14px;
    }


    .admin-stat-card h3 {
        font-size: 25px;

        margin-top: 14px;
    }


    .admin-stat-card p {
        font-size: 10.5px;
    }


    .admin-stat-card small {
        font-size: 9px;
    }


    .statistics-section {
        padding: 18px 13px 15px;
    }


    .statistics-header {
        align-items: flex-start;

        flex-direction: column;

        gap: 10px;
    }


    .statistics-total {
        align-items: flex-start;
    }


    .chart-container {
        height: 260px;
    }


    .bars-area {
        padding: 0 5px;

        gap: 5px;
    }


    .bar-wrapper {
        width: 30px;
    }


    .bar-label {
        font-size: 8px;
    }


    .bar-value {
        font-size: 9px;
    }


    .chart-legend {
        gap: 10px 13px;

        justify-content: flex-start;
    }


    .chart-legend div {
        font-size: 9px;
    }


    .breakdown-card,
    .summary-card {
        padding: 17px 15px;
    }

}


/* =========================================================
   VERY SMALL MOBILE
========================================================= */

@media (max-width: 380px) {

    .admin-stat-grid {
        grid-template-columns: 1fr;
    }


    .admin-stat-card {
        min-height: 135px;
    }


    .chart-container {
        height: 240px;
    }


    .bar-wrapper {
        width: 25px;
    }


    .bar-label {
        font-size: 7px;

        transform: rotate(-18deg);

        transform-origin: center;
    }

}

`;

export default AdminDashboard;