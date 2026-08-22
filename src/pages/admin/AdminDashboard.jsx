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

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="admin-dashboard">
                <main className="admin-main">
                    <section className="trust-overview">
                        <div className="admin-empty-state">
                            Loading dashboard...
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="admin-dashboard">
                <main className="admin-main">
                    <section className="trust-overview">
                        <div className="verification-empty verification-error">
                            {error}
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    // =====================================================
    // DASHBOARD DATA
    // =====================================================

    const pendingVerifications =
        dashboard?.pending_verifications ?? 0;

    const pendingJobseekers =
        dashboard?.pending_jobseekers ?? 0;

    const pendingEmployers =
        dashboard?.pending_employers ?? 0;

    // Rejected Job Seekers + Rejected Employers
    const rejectedAccounts =
        dashboard?.rejected_accounts ?? 0;

    const totalUsers =
        dashboard?.total_users ?? 0;

    const liveJobPosts =
        dashboard?.live_job_posts ?? 0;

    // Only APPROVED Job Seekers
    const totalJobseekers =
        dashboard?.total_jobseekers ?? 0;

    // Only APPROVED Employers
    const totalEmployers =
        dashboard?.total_employers ?? 0;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="admin-dashboard">

            <main className="admin-main">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="verification-queue-header">

                    <h1>
                        Admin dashboard
                    </h1>

                    <p>
                        Platform health and verification overview
                    </p>

                </section>


                {/* =================================================
                    TRUST OVERVIEW
                ================================================= */}

                <section className="trust-overview">

                    <div className="trust-overview-header">

                        <h2>
                            Trust overview
                        </h2>

                        <p>
                            Platform health at a glance
                        </p>

                    </div>


                    <div className="admin-stat-grid">


                        {/* =================================================
                            PENDING VERIFICATIONS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {pendingVerifications}
                            </h3>

                            <p>
                                PENDING VERIFICATIONS
                            </p>

                            <small>
                                {pendingJobseekers} job seeker
                                {pendingJobseekers !== 1 ? "s" : ""}
                                {" · "}
                                {pendingEmployers} employer
                                {pendingEmployers !== 1 ? "s" : ""}
                            </small>

                        </div>


                        {/* =================================================
                            REJECTED ACCOUNTS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {rejectedAccounts}
                            </h3>

                            <p>
                                REJECTED ACCOUNTS
                            </p>

                        </div>


                        {/* =================================================
                            TOTAL USERS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {totalUsers}
                            </h3>

                            <p>
                                TOTAL USERS
                            </p>

                            <small>
                                Excluding admin
                            </small>

                        </div>


                        {/* =================================================
                            LIVE JOB POSTS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {liveJobPosts}
                            </h3>

                            <p>
                                LIVE JOB POSTS
                            </p>

                        </div>


                        {/* =================================================
                            APPROVED JOB SEEKERS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {totalJobseekers}
                            </h3>

                            <p>
                                JOB SEEKERS
                            </p>

                        </div>


                        {/* =================================================
                            APPROVED EMPLOYERS
                        ================================================= */}

                        <div className="admin-stat-card">

                            <h3>
                                {totalEmployers}
                            </h3>

                            <p>
                                EMPLOYERS
                            </p>

                        </div>


                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminDashboard;