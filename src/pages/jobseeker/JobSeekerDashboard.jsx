import { useEffect, useState } from "react";

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

                    <h1>
                        Welcome back
                    </h1>

                    <p>
                        Here's where your search stands today
                    </p>

                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="js-stat-grid">

                    <div className="js-stat-card">

                        <h2>
                            {applicationsSent}
                        </h2>

                        <p>
                            APPLICATIONS SENT
                        </p>

                    </div>


                    <div className="js-stat-card">

                        <h2>
                            {awaitingResponse}
                        </h2>

                        <p>
                            AWAITING RESPONSE
                        </p>

                    </div>


                    <div className="js-stat-card">

                        <h2>
                            {shortlisted}
                        </h2>

                        <p>
                            SHORTLISTED
                        </p>

                    </div>

                </section>


                {/* =================================================
                    APPLICATIONS
                ================================================= */}

                <section className="js-applications-card">

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

                                Loading applications...

                            </div>

                        )}


                        {/* ERROR */}

                        {!loading && error && (

                            <div className="js-empty-state">

                                {error}

                            </div>

                        )}


                        {/* NO APPLICATIONS */}

                        {!loading &&
                            !error &&
                            applications.length === 0 && (

                                <div className="js-empty-state">

                                    No applications yet.

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

                                    <div>
                                        {getJobTitle(app)}
                                    </div>

                                    <div>
                                        {getCompanyName(app)}
                                    </div>

                                    <div>
                                        {formatDate(
                                            app.applied_at ||
                                            app.created_at
                                        )}
                                    </div>

                                    <div>
                                        {formatStatus(
                                            app.status
                                        )}
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