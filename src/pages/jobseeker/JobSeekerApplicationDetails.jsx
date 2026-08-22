import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/auth/jobseeker/";

function JobseekerApplicationDetails() {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // FETCH APPLICATION DETAILS
    // =====================================================

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    async function fetchApplication() {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}applications/${applicationId}/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const text = await response.text();

            let data = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = {
                    detail: text || "Invalid server response.",
                };
            }

            console.log("=================================");
            console.log("APPLICATION DETAILS RESPONSE");
            console.log("STATUS:", response.status);
            console.log("DATA:", data);
            console.log("=================================");

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (response.status === 401) {
                localStorage.removeItem("jc_token");
                navigate("/login");
                return;
            }

            // =================================================
            // ERROR
            // =================================================

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        data.detail ||
                        "Could not load application details."
                );
            }

            setApplication(data);
        } catch (err) {
            console.error(
                "APPLICATION DETAILS ERROR:",
                err
            );

            setError(
                err.message ||
                    "Could not load application details right now."
            );
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // FORMAT APPLICATION STATUS
    // =====================================================

    function formatStatus(status) {
        switch (String(status || "").toLowerCase()) {
            case "applied":
                return "Applied";

            case "shortlisted":
                return "Shortlisted";

            case "hired":
                return "Hired";

            case "rejected":
                return "Not selected";

            default:
                return status || "Unknown";
        }
    }

    // =====================================================
    // FORMAT SALARY
    // FRONTEND ONLY
    // =====================================================

    function formatSalary(min, max) {
        const parseSalary = (value) => {
            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return null;
            }

            const cleanedValue = String(value)
                .replace(/₹/g, "")
                .replace(/,/g, "")
                .trim();

            if (cleanedValue === "") {
                return null;
            }

            const number = Number(cleanedValue);

            return Number.isFinite(number)
                ? number
                : null;
        };

        const salaryMin = parseSalary(min);
        const salaryMax = parseSalary(max);

        const formatAmount = (amount) => {
            return `₹${amount.toLocaleString("en-IN")}`;
        };

        // Both minimum and maximum
        if (
            salaryMin !== null &&
            salaryMax !== null
        ) {
            return (
                `${formatAmount(salaryMin)} - ` +
                `${formatAmount(salaryMax)} per year`
            );
        }

        // Only minimum
        if (salaryMin !== null) {
            return `${formatAmount(salaryMin)} per year`;
        }

        // Only maximum
        if (salaryMax !== null) {
            return `Up to ${formatAmount(salaryMax)} per year`;
        }

        return "Salary not specified";
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="job-details-page">
                <main className="job-details-main">
                    <p>
                        Loading application details...
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
            <div className="job-details-page">
                <main className="job-details-main">

                    <p className="job-details-error">
                        {error}
                    </p>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        ← Back to My Applications
                    </button>

                </main>
            </div>
        );
    }

    // =====================================================
    // NO APPLICATION
    // =====================================================

    if (!application) {
        return (
            <div className="job-details-page">
                <main className="job-details-main">

                    <p className="job-details-error">
                        Application not found.
                    </p>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        ← Back to My Applications
                    </button>

                </main>
            </div>
        );
    }

    // =====================================================
    // SKILLS
    // =====================================================

    const skills = Array.isArray(application.skills)
        ? application.skills
              .filter(Boolean)
              .map((skill) => String(skill).trim())
              .filter(Boolean)
        : typeof application.skills === "string"
        ? application.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
        : [];

    // =====================================================
    // SALARY
    // =====================================================

    const salary = formatSalary(
        application.salary_min,
        application.salary_max
    );

    // =====================================================
    // EXPERIENCE
    // =====================================================

    const experience =
        application.experience_display ||
        application.experience ||
        "Not specified";

    // =====================================================
    // JOB TYPE
    // =====================================================

    const jobType =
        application.job_type_display ||
        application.job_type ||
        "Not specified";

    // =====================================================
    // LOCATION
    // =====================================================

    const location =
        application.location ||
        "Not specified";

    // =====================================================
    // APPLIED DATE
    // =====================================================

    const appliedDate = application.applied_at
        ? new Date(
              application.applied_at
          ).toLocaleDateString(
              "en-IN",
              {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              }
          )
        : "Not available";

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="job-details-page">

            <main className="job-details-main">

                {/* =================================================
                    BACK
                ================================================= */}

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Back to My Applications
                </button>

                {/* =================================================
                    JOB HEADER
                ================================================= */}

                <section className="job-details-header">

                    <div>

                        <h1>
                            {application.job_title ||
                                "Job Title"}
                        </h1>

                        <p className="job-details-company">
                            {application.company_name ||
                                "Company"}
                        </p>

                    </div>

                    {/* APPLICATION STATUS */}

                    <span
                        className={
                            `application-status ${
                                String(
                                    application.status || ""
                                )
                                    .toLowerCase()
                                    .replace(
                                        /\s+/g,
                                        "-"
                                    )
                            }`
                        }
                    >
                        {formatStatus(
                            application.status
                        )}
                    </span>

                </section>

                {/* =================================================
                    JOB INFORMATION
                ================================================= */}

                <section className="job-details-card">

                    {/* LOCATION */}

                    <div className="job-detail-item">

                        <strong>
                            Location
                        </strong>

                        <span>
                            {location}
                        </span>

                    </div>

                    {/* JOB TYPE */}

                    <div className="job-detail-item">

                        <strong>
                            Job type
                        </strong>

                        <span>
                            {jobType}
                        </span>

                    </div>

                    {/* EXPERIENCE */}

                    <div className="job-detail-item">

                        <strong>
                            Experience
                        </strong>

                        <span>
                            {experience}
                        </span>

                    </div>

                    {/* SALARY */}

                    <div className="job-detail-item">

                        <strong>
                            Salary
                        </strong>

                        <span>
                            {salary}
                        </span>

                    </div>

                </section>

                {/* =================================================
                    JOB DESCRIPTION
                ================================================= */}

                <section className="job-details-section">

                    <h2>
                        Job description
                    </h2>

                    <p
                        style={{
                            whiteSpace: "pre-line",
                        }}
                    >
                        {application.description ||
                            "No job description provided."}
                    </p>

                </section>

                {/* =================================================
                    SKILLS
                ================================================= */}

                <section className="job-details-section">

                    <h2>
                        Skills
                    </h2>

                    {skills.length > 0 ? (

                        <div className="job-tags">

                            {skills.map(
                                (skill, index) => (

                                    <span
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>

                                )
                            )}

                        </div>

                    ) : (

                        <p>
                            No specific skills mentioned.
                        </p>

                    )}

                </section>

                {/* =================================================
                    APPLICATION INFORMATION
                ================================================= */}

                <section className="job-details-section">

                    <h2>
                        Application details
                    </h2>

                    <p>

                        <strong>
                            Applied on:
                        </strong>{" "}

                        {appliedDate}

                    </p>

                    <p>

                        <strong>
                            Status:
                        </strong>{" "}

                        {formatStatus(
                            application.status
                        )}

                    </p>

                </section>

            </main>

        </div>
    );
}

export default JobseekerApplicationDetails;