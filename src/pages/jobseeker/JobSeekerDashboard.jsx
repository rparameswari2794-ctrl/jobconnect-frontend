import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

function JobseekerDashboard() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // LOAD APPLICATIONS
    // =====================================================

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        setLoading(true);
        setError("");

        try {
            const token =
                localStorage.getItem("jc_token") ||
                localStorage.getItem("access_token");

            console.log("=================================");
            console.log("APPLICATIONS API DEBUG");
            console.log("TOKEN EXISTS:", !!token);
            console.log("TOKEN:", token);
            console.log(
                "URL:",
                `${API_BASE}applications/`
            );
            console.log("=================================");

            if (!token) {
                setError(
                    "You are not logged in. Please login again."
                );
                setApplications([]);
                return;
            }

            const res = await fetch(
                `${API_BASE}applications/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                "APPLICATION API STATUS:",
                res.status
            );

            const data = await res.json();

            console.log(
                "APPLICATION API RESPONSE:",
                data
            );

            if (!res.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    `API request failed with status ${res.status}`
                );
            }

            if (!Array.isArray(data)) {
                console.error(
                    "Expected array but received:",
                    data
                );

                throw new Error(
                    "Invalid applications response from server."
                );
            }

            setApplications(data);

        } catch (err) {

            console.error(
                "APPLICATIONS ERROR:",
                err
            );

            setError(
                err.message ||
                "Could not load your applications right now."
            );

            setApplications([]);

        } finally {

            setLoading(false);

        }
    }

    // =====================================================
    // STATS
    // =====================================================

    const applicationsSent =
        applications.length;

    const awaitingResponse =
        applications.filter(
            (app) =>
                String(app.status).toUpperCase() === "APPLIED"
        ).length;

    const shortlisted =
        applications.filter(
            (app) =>
                String(app.status).toUpperCase() === "SHORTLISTED"
        ).length;

    const rejected =
        applications.filter(
            (app) =>
                String(app.status).toUpperCase() === "REJECTED"
        ).length;

    const hired =
        applications.filter(
            (app) =>
                String(app.status).toUpperCase() === "HIRED"
        ).length;

    // =====================================================
    // PIE CHART DATA
    // =====================================================

    const chartData = [
        {
            name: "Applied",
            value: awaitingResponse,
        },
        {
            name: "Shortlisted",
            value: shortlisted,
        },
        {
            name: "Rejected",
            value: rejected,
        },
        {
            name: "Hired",
            value: hired,
        },
    ].filter((item) => item.value > 0);

    // =====================================================
    // CHART COLORS
    // =====================================================

    const chartColors = [
        "#2563eb",
        "#7c3aed",
        "#ef4444",
        "#16a34a",
    ];

    // =====================================================
    // STATUS LABEL
    // =====================================================

    function formatStatus(status) {
        const normalized =
            String(status || "").toUpperCase();

        switch (normalized) {
            case "APPLIED":
                return "Applied";

            case "SHORTLISTED":
                return "Shortlisted";

            case "REJECTED":
                return "Rejected";

            case "HIRED":
                return "Hired";

            default:
                return status || "-";
        }
    }

    // =====================================================
    // DATE
    // =====================================================

    function formatDate(dateString) {
        if (!dateString) {
            return "-";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    }

    // =====================================================
    // GET JOB TITLE
    // =====================================================

    function getJobTitle(app) {
        return (
            app.job_title ||
            app.job?.title ||
            app.title ||
            "-"
        );
    }

    // =====================================================
    // GET COMPANY NAME
    // =====================================================

    function getCompanyName(app) {
        return (
            app.company_name ||
            app.company ||
            app.job?.company_name ||
            app.job?.company ||
            "-"
        );
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="jobseeker-dashboard">

            <main className="js-main">

                {/* =================================================
                    WELCOME
                ================================================= */}

                <section className="js-welcome">

                    <div>
                        <span className="js-welcome-label">
                            JOB SEEKER DASHBOARD
                        </span>

                        <h1>
                            Welcome back 👋
                        </h1>

                        <p>
                            Here's where your job search
                            stands today.
                        </p>
                    </div>

                    <div className="js-welcome-icon">
                        💼
                    </div>

                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="js-stat-grid">

                    {/* APPLICATIONS */}

                    <div className="js-stat-card applications-stat">

                        <div className="js-stat-icon">
                            📄
                        </div>

                        <div className="js-stat-content">

                            <span>
                                APPLICATIONS SENT
                            </span>

                            <h2>
                                {applicationsSent}
                            </h2>

                            <small>
                                Total applications
                            </small>

                        </div>

                    </div>


                    {/* AWAITING */}

                    <div className="js-stat-card awaiting-stat">

                        <div className="js-stat-icon">
                            ⏳
                        </div>

                        <div className="js-stat-content">

                            <span>
                                AWAITING RESPONSE
                            </span>

                            <h2>
                                {awaitingResponse}
                            </h2>

                            <small>
                                Applications pending
                            </small>

                        </div>

                    </div>


                    {/* SHORTLISTED */}

                    <div className="js-stat-card shortlisted-stat">

                        <div className="js-stat-icon">
                            ⭐
                        </div>

                        <div className="js-stat-content">

                            <span>
                                SHORTLISTED
                            </span>

                            <h2>
                                {shortlisted}
                            </h2>

                            <small>
                                Shortlisted applications
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ANALYTICS
                ================================================= */}

                <section className="js-analytics-grid">

                    {/* =================================================
                        PIE CHART
                    ================================================= */}

                    <div className="js-chart-card">

                        <div className="js-card-heading">

                            <div>
                                <h2>
                                    Application Overview
                                </h2>

                                <p>
                                    Your application status
                                </p>
                            </div>

                            <span className="js-chart-badge">
                                Overview
                            </span>

                        </div>


                        <div className="js-chart-wrapper">

                            {applications.length === 0 ? (

                                <div className="js-chart-empty">
                                    <div>
                                        📊
                                    </div>

                                    <p>
                                        No application data
                                        available yet.
                                    </p>
                                </div>

                            ) : (

                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >

                                    <PieChart>

                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="48%"
                                            innerRadius={75}
                                            outerRadius={110}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                        >

                                            {chartData.map(
                                                (entry, index) => (

                                                    <Cell
                                                        key={
                                                            `cell-${index}`
                                                        }
                                                        fill={
                                                            chartColors[
                                                                index %
                                                                chartColors.length
                                                            ]
                                                        }
                                                    />

                                                )
                                            )}

                                        </Pie>

                                        <Tooltip
                                            formatter={(
                                                value,
                                                name
                                            ) => [
                                                value,
                                                name,
                                            ]}
                                            contentStyle={{
                                                borderRadius:
                                                    "10px",
                                                border:
                                                    "1px solid #e5e7eb",
                                                boxShadow:
                                                    "0 8px 20px rgba(15,23,42,0.10)",
                                            }}
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                        />

                                    </PieChart>

                                </ResponsiveContainer>

                            )}

                        </div>

                    </div>


                    {/* =================================================
                        QUICK STATISTICS
                    ================================================= */}

                    <div className="js-summary-card">

                        <div className="js-card-heading">

                            <div>
                                <h2>
                                    Application Statistics
                                </h2>

                                <p>
                                    Current application progress
                                </p>
                            </div>

                        </div>


                        <div className="js-summary-list">

                            <div className="js-summary-row">

                                <div className="js-summary-left">

                                    <span className="js-summary-dot applied-dot"></span>

                                    <span>
                                        Applied
                                    </span>

                                </div>

                                <strong>
                                    {awaitingResponse}
                                </strong>

                            </div>


                            <div className="js-summary-row">

                                <div className="js-summary-left">

                                    <span className="js-summary-dot shortlisted-dot"></span>

                                    <span>
                                        Shortlisted
                                    </span>

                                </div>

                                <strong>
                                    {shortlisted}
                                </strong>

                            </div>


                            <div className="js-summary-row">

                                <div className="js-summary-left">

                                    <span className="js-summary-dot rejected-dot"></span>

                                    <span>
                                        Rejected
                                    </span>

                                </div>

                                <strong>
                                    {rejected}
                                </strong>

                            </div>


                            <div className="js-summary-row">

                                <div className="js-summary-left">

                                    <span className="js-summary-dot hired-dot"></span>

                                    <span>
                                        Hired
                                    </span>

                                </div>

                                <strong>
                                    {hired}
                                </strong>

                            </div>

                        </div>


                        <div className="js-success-rate">

                            <div>

                                <span>
                                    Total Applications
                                </span>

                                <strong>
                                    {applicationsSent}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Shortlisted Rate
                                </span>

                                <strong>
                                    {applicationsSent > 0
                                        ? `${Math.round(
                                            (shortlisted /
                                                applicationsSent) *
                                            100
                                        )}%`
                                        : "0%"}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    APPLICATIONS
                ================================================= */}

                <section className="js-applications-card">

                    <div className="js-applications-heading">

                        <div>
                            <h2>
                                My Applications
                            </h2>

                            <p>
                                Track your recent job applications
                            </p>
                        </div>

                        <span className="js-total-badge">
                            {applicationsSent} Total
                        </span>

                    </div>


                    <div className="js-table">

                        {/* HEADER */}

                        <div className="js-table-row js-table-header">

                            <div>
                                ROLE
                            </div>

                            <div>
                                COMPANY
                            </div>

                            <div>
                                APPLIED
                            </div>

                            <div>
                                STATUS
                            </div>

                        </div>


                        {/* LOADING */}

                        {loading && (

                            <div className="js-empty-state">

                                <div className="js-loading-spinner"></div>

                                <span>
                                    Loading applications...
                                </span>

                            </div>

                        )}


                        {/* ERROR */}

                        {!loading && error && (

                            <div className="js-empty-state js-error-state">

                                <span>
                                    ⚠️
                                </span>

                                {error}

                            </div>

                        )}


                        {/* NO APPLICATIONS */}

                        {!loading &&
                            !error &&
                            applications.length === 0 && (

                                <div className="js-empty-state">

                                    <div className="js-empty-icon">
                                        📄
                                    </div>

                                    <strong>
                                        No applications yet
                                    </strong>

                                    <span>
                                        Your submitted applications
                                        will appear here.
                                    </span>

                                </div>

                            )
                        }


                        {/* APPLICATION LIST */}

                        {!loading &&
                            !error &&
                            applications.length > 0 &&
                            applications.map((app) => (

                                <div
                                    key={app.id}
                                    className="js-table-row"
                                >

                                    <div
                                        className="js-role-cell"
                                        data-label="ROLE"
                                    >
                                        <strong>
                                            {getJobTitle(app)}
                                        </strong>
                                    </div>

                                    <div
                                        className="js-company-cell"
                                        data-label="COMPANY"
                                    >
                                        {getCompanyName(app)}
                                    </div>

                                    <div
                                        data-label="APPLIED"
                                    >
                                        {formatDate(
                                            app.applied_at ||
                                            app.created_at
                                        )}
                                    </div>

                                    <div
                                        data-label="STATUS"
                                    >
                                        <span
                                            className={
                                                `js-status-badge js-status-${String(
                                                    app.status || ""
                                                )
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`
                                            }
                                        >
                                            <span className="js-status-dot"></span>

                                            {formatStatus(
                                                app.status
                                            )}

                                        </span>
                                    </div>

                                </div>

                            ))
                        }

                    </div>

                </section>

            </main>

        </div>
    );
}

export default JobseekerDashboard;