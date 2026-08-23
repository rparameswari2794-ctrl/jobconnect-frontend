import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

function MyApplications() {

    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");


    // =====================================================
    // FETCH APPLICATIONS
    // =====================================================

    useEffect(() => {
        fetchApplications();
    }, []);


    async function fetchApplications() {

        setLoading(true);
        setError("");

        try {

            const token = localStorage.getItem("jc_token");

            const res = await fetch(
                `${API_BASE}applications/`,
                {
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {},
                }
            );

            if (!res.ok) {
                throw new Error(
                    "Failed to load applications"
                );
            }

            const data = await res.json();

            setApplications(
                Array.isArray(data) ? data : []
            );

        } catch (err) {

            console.error(err);

            setError(
                "Could not load your applications right now."
            );

            setApplications([]);

        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // NORMALIZE STATUS
    // =====================================================

    function normalizeStatus(status) {

        return String(status || "")
            .toLowerCase()
            .trim()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

    }


    // =====================================================
    // FILTER APPLICATIONS
    // =====================================================

    const filteredApplications =
        activeFilter === "all"
            ? applications
            : applications.filter(
                (application) =>
                    normalizeStatus(application.status) ===
                    activeFilter
            );


    // =====================================================
    // COUNTS
    // =====================================================

    const allCount = applications.length;


    const appliedCount = applications.filter(
        (application) =>
            normalizeStatus(application.status) === "applied"
    ).length;


    const shortlistedCount = applications.filter(
        (application) =>
            normalizeStatus(application.status) === "shortlisted"
    ).length;


    const interviewScheduledCount = applications.filter(
        (application) =>
            normalizeStatus(application.status) ===
            "interview_scheduled"
    ).length;


    const hiredCount = applications.filter(
        (application) =>
            normalizeStatus(application.status) === "hired"
    ).length;


    const rejectedCount = applications.filter(
        (application) =>
            normalizeStatus(application.status) === "rejected"
    ).length;


    // =====================================================
    // FORMAT STATUS
    // =====================================================

    function formatStatus(status) {

        switch (normalizeStatus(status)) {

            case "applied":
                return "Applied";

            case "shortlisted":
                return "Shortlisted";

            case "interview_scheduled":
                return "Interview Scheduled";

            case "hired":
                return "Hired";

            case "rejected":
                return "Not selected";

            default:
                return status || "Unknown";

        }
    }


    // =====================================================
    // STATUS CSS CLASS
    // =====================================================

    function getStatusClass(status) {

        return normalizeStatus(status);

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "Recently";
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "Recently";
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
    // VIEW APPLICATION
    // =====================================================

    function handleViewApplication(applicationId) {

        navigate(
            `/jobseeker/application/${applicationId}`
        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="my-applications-page">

            <main className="my-applications-main">


                {/* HEADER */}

                <section className="applications-header">

                    <h1>
                        My Applications
                    </h1>

                    <p>

                        {loading
                            ? "Loading applications..."
                            : `${allCount} application${allCount === 1 ? "" : "s"} sent`
                        }

                    </p>

                </section>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="application-filters">


                    {/* ALL */}

                    <button
                        type="button"
                        className={
                            activeFilter === "all"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("all")
                        }
                    >
                        All ({allCount})
                    </button>


                    {/* APPLIED */}

                    <button
                        type="button"
                        className={
                            activeFilter === "applied"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("applied")
                        }
                    >
                        Applied ({appliedCount})
                    </button>


                    {/* SHORTLISTED */}

                    <button
                        type="button"
                        className={
                            activeFilter === "shortlisted"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("shortlisted")
                        }
                    >
                        Shortlisted ({shortlistedCount})
                    </button>


                    {/* INTERVIEW SCHEDULED */}

                    <button
                        type="button"
                        className={
                            activeFilter === "interview_scheduled"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter(
                                "interview_scheduled"
                            )
                        }
                    >
                        Interview Scheduled (
                        {interviewScheduledCount}
                        )
                    </button>


                    {/* HIRED */}

                    <button
                        type="button"
                        className={
                            activeFilter === "hired"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("hired")
                        }
                    >
                        Hired ({hiredCount})
                    </button>


                    {/* NOT SELECTED */}

                    <button
                        type="button"
                        className={
                            activeFilter === "rejected"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("rejected")
                        }
                    >
                        Not selected ({rejectedCount})
                    </button>

                </div>


                {/* =================================================
                    APPLICATIONS CARD
                ================================================= */}

                <section className="applications-card">


                    {/* TABLE HEADER */}

                    <div className="applications-table-header">

                        <div>ROLE</div>

                        <div>COMPANY</div>

                        <div>APPLIED</div>

                        <div>STATUS</div>

                        <div></div>

                    </div>


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading && (

                        <div className="applications-message">

                            Loading applications...

                        </div>

                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {!loading && error && (

                        <div className="applications-message error">

                            {error}

                        </div>

                    )}


                    {/* =================================================
                        EMPTY
                    ================================================= */}

                    {!loading &&
                        !error &&
                        filteredApplications.length === 0 && (

                            <div className="applications-message">

                                No applications found.

                            </div>

                        )
                    }


                    {/* =================================================
                        APPLICATION LIST
                    ================================================= */}

                    {!loading &&
                        !error &&
                        filteredApplications.map(
                            (application) => (

                                <div
                                    className="application-row"
                                    key={application.id}
                                >


                                    {/* ROLE */}

                                    <div className="application-role">

                                        {application.job_title ||
                                            "Job"}

                                    </div>


                                    {/* COMPANY */}

                                    <div>

                                        {application.company_name ||
                                            "Company"}

                                    </div>


                                    {/* APPLIED DATE */}

                                    <div className="application-date">

                                        {formatDate(
                                            application.applied_at
                                        )}

                                    </div>


                                    {/* STATUS */}

                                    <div>

                                        <span
                                            className={
                                                `application-status ${getStatusClass(
                                                    application.status
                                                )}`
                                            }
                                        >

                                            {formatStatus(
                                                application.status
                                            )}

                                        </span>

                                    </div>


                                    {/* VIEW */}

                                    <div>

                                        <button
                                            type="button"
                                            className="view-application-button"
                                            onClick={() =>
                                                handleViewApplication(
                                                    application.id
                                                )
                                            }
                                        >
                                            View
                                        </button>

                                    </div>


                                </div>

                            )
                        )
                    }

                </section>

            </main>

        </div>
    );
}

export default MyApplications;