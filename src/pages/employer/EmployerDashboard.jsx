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
            //
            // {
            //   profile: {...},
            //   stats: {...},
            //   jobs: [...]
            // }
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


        // =================================================
        // LIVE
        // =================================================

        if (
            status === "live" ||
            status === "published" ||
            status === "active"
        ) {
            return "Live";
        }


        // =================================================
        // CLOSED
        // =================================================

        if (
            status === "closed" ||
            status === "inactive"
        ) {
            return "Closed";
        }


        // =================================================
        // BACKWARD COMPATIBILITY
        // =================================================

        if (job.is_active === true) {
            return "Live";
        }

        if (job.is_active === false) {
            return "Closed";
        }


        // =================================================
        // DEFAULT
        // =================================================

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
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="employer-dashboard-page">

                <main className="employer-dashboard-main">

                    <p>
                        Loading dashboard...
                    </p>

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

                    <p className="dashboard-error">
                        {error}
                    </p>

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

                    <h1>

                        Welcome back,{" "}

                        {dashboard.employer_name ||
                            dashboard.company_name ||
                            "Employer"}

                    </h1>


                    <p>

                        {dashboard.company_name}

                    </p>

                </section>


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <section className="employer-stat-grid">


                    {/* =================================================
                        CLOSED JOBS
                    ================================================= */}

                    <div className="employer-stat-card">

                        <h2>
                            {dashboard.closed_postings}
                        </h2>

                        <p>
                            CLOSED POSTINGS
                        </p>

                    </div>


                    {/* =================================================
                        LIVE JOBS
                    ================================================= */}

                    <div className="employer-stat-card">

                        <h2>
                            {dashboard.live_postings}
                        </h2>

                        <p>
                            LIVE POSTINGS
                        </p>

                    </div>


                    {/* =================================================
                        APPLICANTS
                    ================================================= */}

                    <div className="employer-stat-card">

                        <h2>
                            {dashboard.total_applicants}
                        </h2>

                        <p>
                            TOTAL APPLICANTS
                        </p>

                    </div>


                </section>


                {/* =================================================
                    JOB POSTS
                ================================================= */}

                <section className="employer-postings-card">

                    <div className="employer-table">


                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

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


                        {/* =================================================
                            NO JOBS
                        ================================================= */}

                        {dashboard.jobs.length === 0 ? (

                            <div className="employer-empty-state">

                                No job postings yet.

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


                                        {/* =================================
                                            JOB TITLE
                                        ================================= */}

                                        <div className="employer-job-title">

                                            {job.title ||
                                                "Untitled Job"}

                                        </div>


                                        {/* =================================
                                            STATUS
                                        ================================= */}

                                        <div>

                                            <span
                                                className={getStatusClass(
                                                    status
                                                )}
                                            >

                                                {status}

                                            </span>

                                        </div>


                                        {/* =================================
                                            CREATED
                                        ================================= */}

                                        <div>

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
                            + Create job posting
                        </Link>

                    ) : (

                        <button
                            type="button"
                            className="create-job-button"
                            disabled
                        >
                            + Create job posting
                        </button>

                    )}

                </div>


            </main>

        </div>

    );

}


export default EmployerDashboard;