import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const JOBSEEKER_API = `${API_BASE}/auth/jobseeker`;

function JobSeekerApplicationDetails() {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // TOKEN
    // =====================================================

    function getToken() {
        return (
            localStorage.getItem("jc_token") ||
            localStorage.getItem("access_token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("access") ||
            localStorage.getItem("token")
        );
    }

    // =====================================================
    // AUTH HEADERS
    // =====================================================

    function getAuthHeaders() {
        const token = getToken();

        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        };
    }

    // =====================================================
    // PARSE RESPONSE
    // =====================================================

    async function parseResponse(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                detail: text,
            };
        }
    }

    // =====================================================
    // NORMALIZE APPLICATION LIST
    // =====================================================

    function normalizeApplications(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.applications)) {
            return data.applications;
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    }

    // =====================================================
    // GET APPLICATION ID
    // =====================================================

    function getApplicationId(item) {
        return (
            item?.application_id ??
            item?.id ??
            item?.application?.id ??
            item?.application?.application_id
        );
    }

    // =====================================================
    // FETCH APPLICATION
    // =====================================================

    async function fetchApplication() {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `${JOBSEEKER_API}/applications/`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
            );

            const data = await parseResponse(response);

            console.log(
                "================================="
            );
            console.log(
                "APPLICATIONS RESPONSE"
            );
            console.log(
                "STATUS:",
                response.status
            );
            console.log(
                "DATA:",
                data
            );
            console.log(
                "REQUESTED APPLICATION ID:",
                applicationId
            );
            console.log(
                "================================="
            );

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (response.status === 401) {
                localStorage.removeItem("jc_token");
                localStorage.removeItem("access_token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("access");
                localStorage.removeItem("token");

                navigate("/login");
                return;
            }

            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.detail ||
                        "Could not load applications."
                );
            }

            // =================================================
            // NORMALIZE
            // =================================================

            const applications =
                normalizeApplications(data);

            console.log(
                "NORMALIZED APPLICATIONS:",
                applications
            );

            // =================================================
            // FIND APPLICATION
            // =================================================

            const requestedId = String(applicationId);

            const foundApplication =
                applications.find((item) => {
                    const id =
                        getApplicationId(item);

                    return (
                        id !== null &&
                        id !== undefined &&
                        String(id) === requestedId
                    );
                });

            console.log(
                "FOUND APPLICATION:",
                foundApplication
            );

            // =================================================
            // NOT FOUND
            // =================================================

            if (!foundApplication) {
                setApplication(null);

                setError(
                    `Application #${applicationId} was not found.`
                );

                return;
            }

            // =================================================
            // NESTED APPLICATION
            // =================================================

            const nestedApplication =
                foundApplication.application &&
                typeof foundApplication.application ===
                    "object" &&
                !Array.isArray(
                    foundApplication.application
                )
                    ? foundApplication.application
                    : {};

            // =================================================
            // NORMALIZED APPLICATION
            // =================================================

            const normalizedApplication = {
                ...nestedApplication,
                ...foundApplication,

                application_id:
                    foundApplication.application_id ??
                    foundApplication.id ??
                    nestedApplication.application_id ??
                    nestedApplication.id ??
                    applicationId,
            };

            // =================================================
            // PRESERVE JOB OBJECT
            // =================================================

            if (
                foundApplication.job &&
                typeof foundApplication.job === "object" &&
                !Array.isArray(foundApplication.job)
            ) {
                normalizedApplication.job =
                    foundApplication.job;
            }

            // =================================================
            // PRESERVE JOB DETAILS
            // =================================================

            if (
                foundApplication.job_details &&
                typeof foundApplication.job_details ===
                    "object" &&
                !Array.isArray(
                    foundApplication.job_details
                )
            ) {
                normalizedApplication.job_details =
                    foundApplication.job_details;
            }

            console.log(
                "NORMALIZED APPLICATION:",
                normalizedApplication
            );

            console.log(
                "JOB:",
                normalizedApplication.job
            );

            console.log(
                "JOB DETAILS:",
                normalizedApplication.job_details
            );

            setApplication(
                normalizedApplication
            );
        } catch (err) {
            console.error(
                "APPLICATION DETAILS ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Could not load application details right now."
            );
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // LOAD APPLICATION
    // =====================================================

    useEffect(() => {
        if (!applicationId) {
            setError("Invalid application ID.");
            setLoading(false);
            return;
        }

        fetchApplication();
    }, [applicationId]);

    // =====================================================
    // FORMAT STATUS
    // =====================================================

    function formatStatus(status) {
        const value = String(status || "")
            .toLowerCase()
            .trim();

        switch (value) {
            case "applied":
                return "Applied";

            case "under review":
            case "under_review":
                return "Under Review";

            case "shortlisted":
                return "Shortlisted";

            case "interview scheduled":
            case "interview_scheduled":
                return "Interview Scheduled";

            case "hired":
                return "Hired";

            case "rejected":
                return "Not selected";

            case "pending":
                return "Pending";

            default:
                return status || "Unknown";
        }
    }

    // =====================================================
    // STATUS CLASS
    // =====================================================

    function getStatusClass(status) {
        const value = String(status || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/_/g, "-");

        return `application-details-status ${value}`;
    }

    // =====================================================
    // SALARY
    // =====================================================

    function formatSalary(min, max) {
        function parseSalary(value) {
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

            if (!cleanedValue) {
                return null;
            }

            const number = Number(cleanedValue);

            return Number.isFinite(number)
                ? number
                : null;
        }

        const salaryMin = parseSalary(min);
        const salaryMax = parseSalary(max);

        function formatAmount(amount) {
            return `₹${amount.toLocaleString("en-IN")}`;
        }

        if (
            salaryMin !== null &&
            salaryMax !== null
        ) {
            return (
                `${formatAmount(salaryMin)} - ` +
                `${formatAmount(salaryMax)} per year`
            );
        }

        if (salaryMin !== null) {
            return `${formatAmount(
                salaryMin
            )} per year`;
        }

        if (salaryMax !== null) {
            return `Up to ${formatAmount(
                salaryMax
            )} per year`;
        }

        return "Salary not specified";
    }

    // =====================================================
    // DATE
    // =====================================================

    function formatDate(value) {
        if (!value) {
            return "Not available";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    // =====================================================
    // SKILLS
    // =====================================================

    function getSkills(value) {
        if (Array.isArray(value)) {
            return value
                .filter(Boolean)
                .map((skill) =>
                    String(skill).trim()
                )
                .filter(Boolean);
        }

        if (typeof value === "string") {
            return value
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);
        }

        return [];
    }

    // =====================================================
    // DISPLAY VALUE
    // =====================================================

    function getDisplayValue(
        value,
        fallback = "Not specified"
    ) {
        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        const text = String(value).trim();

        return text ? text : fallback;
    }

    // =====================================================
    // BACK
    // =====================================================

    function goBack() {
        navigate(-1);
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="application-details-page">
                <main className="application-details-main">
                    <section className="application-loading-card">
                        <div className="application-loading-spinner" />

                        <h2>
                            Loading application...
                        </h2>

                        <p>
                            Please wait while we load
                            your application details.
                        </p>
                    </section>
                </main>

                <style>{pageStyles}</style>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="application-details-page">
                <main className="application-details-main">
                    <section className="application-error-card">
                        <div className="application-error-icon">
                            !
                        </div>

                        <h1>
                            Unable to load application
                        </h1>

                        <p>
                            {error}
                        </p>

                        <div className="application-error-actions">
                            <button
                                type="button"
                                className="back-button"
                                onClick={goBack}
                            >
                                ← Back to My Applications
                            </button>

                            <button
                                type="button"
                                className="retry-button"
                                onClick={fetchApplication}
                            >
                                Try Again
                            </button>
                        </div>
                    </section>
                </main>

                <style>{pageStyles}</style>
            </div>
        );
    }

    // =====================================================
    // NO APPLICATION
    // =====================================================

    if (!application) {
        return (
            <div className="application-details-page">
                <main className="application-details-main">
                    <section className="application-error-card">
                        <div className="application-error-icon">
                            ?
                        </div>

                        <h1>
                            Application not found
                        </h1>

                        <p>
                            We could not find the
                            requested application.
                        </p>

                        <button
                            type="button"
                            className="back-button"
                            onClick={goBack}
                        >
                            ← Back to My Applications
                        </button>
                    </section>
                </main>

                <style>{pageStyles}</style>
            </div>
        );
    }

    // =====================================================
    // JOB DETAILS
    // =====================================================

    /*
     * IMPORTANT:
     *
     * Supports:
     *
     * application.job_details
     *
     * OR
     *
     * application.job
     *
     * OR
     *
     * flattened application fields.
     */

    const nestedJob =
        application.job &&
        typeof application.job === "object" &&
        !Array.isArray(application.job)
            ? application.job
            : {};

    const jobDetails =
        application.job_details &&
        typeof application.job_details === "object" &&
        !Array.isArray(application.job_details)
            ? application.job_details
            : {};

    /*
     * job_details gets priority because this is the
     * complete object returned by the corrected serializer.
     */
    const job = {
        ...nestedJob,
        ...jobDetails,
    };

    // =====================================================
    // EMPLOYER
    // =====================================================

    const employer =
        job.employer &&
        typeof job.employer === "object" &&
        !Array.isArray(job.employer)
            ? job.employer
            : {};

    // =====================================================
    // JOB TITLE
    // =====================================================

    const jobTitle =
        job.title ||
        application.job_title ||
        application.title ||
        "Job Title";

    // =====================================================
    // COMPANY
    // =====================================================

    const companyName =
        job.company_name ||
        employer.company_name ||
        employer.name ||
        application.company_name ||
        application.company ||
        application.employer_name ||
        "Company";

    // =====================================================
    // LOCATION
    // =====================================================

    const location =
        job.location ||
        application.location ||
        application.job_location ||
        "Not specified";

    // =====================================================
    // DESCRIPTION
    // =====================================================

    const description =
        job.description ||
        application.description ||
        application.job_description ||
        "No job description provided.";

    // =====================================================
    // SKILLS
    // =====================================================

    const skills = getSkills(
        job.skills ??
            application.skills ??
            application.required_skills
    );

    // =====================================================
    // JOB TYPE
    // =====================================================

    const jobType =
        job.job_type_display ||
        application.job_type_display ||
        job.job_type ||
        application.job_type ||
        "Not specified";

    // =====================================================
    // WORK MODE
    // =====================================================

    const workMode =
        job.work_mode_display ||
        application.work_mode_display ||
        job.work_mode ||
        application.work_mode ||
        "Not specified";

    // =====================================================
    // EXPERIENCE
    // =====================================================

    let experience =
        job.experience_display ||
        application.experience_display ||
        job.experience ||
        application.experience ||
        "";

    if (!experience) {
        const minimumExperience =
            job.minimum_experience ??
            application.minimum_experience;

        const maximumExperience =
            job.maximum_experience ??
            application.maximum_experience;

        if (
            minimumExperience !== null &&
            minimumExperience !== undefined &&
            minimumExperience !== ""
        ) {
            if (
                maximumExperience !== null &&
                maximumExperience !== undefined &&
                maximumExperience !== ""
            ) {
                experience =
                    `${minimumExperience} - ${maximumExperience} years`;
            } else {
                experience =
                    `${minimumExperience}+ years`;
            }
        }
    }

    if (!experience) {
        experience = "Not specified";
    }

    // =====================================================
    // SALARY
    // =====================================================

    const salary = formatSalary(
        job.salary_min ??
            application.salary_min ??
            application.min_salary,

        job.salary_max ??
            application.salary_max ??
            application.max_salary
    );

    // =====================================================
    // ROLES & RESPONSIBILITIES
    // =====================================================

    const rolesResponsibilities =
        job.roles_responsibilities ||
        application.roles_responsibilities ||
        "";

    // =====================================================
    // KEY FEATURES
    // =====================================================

    const keyFeatures =
        job.key_features ||
        application.key_features ||
        "";

    // =====================================================
    // EDUCATION
    // =====================================================

    const educationDetails =
        job.education_details ||
        application.education_details ||
        "";

    // =====================================================
    // DISABILITY JOB
    // =====================================================

    const isDisabilityJob =
        job.is_disability_job ??
        application.is_disability_job ??
        false;

    // =====================================================
    // APPLIED DATE
    // =====================================================

    const appliedDate = formatDate(
        application.applied_at ||
            application.created_at ||
            application.applied_on
    );

    // =====================================================
    // STATUS
    // =====================================================

    const status =
        application.status ||
        application.application_status ||
        "Unknown";

    const statusText =
        formatStatus(status);

    // =====================================================
    // APPLICATION ID
    // =====================================================

    const displayApplicationId =
        application.application_id ||
        application.id ||
        applicationId;

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="application-details-page">
            <main className="application-details-main">

                {/* =================================================
                    HEADER
                ================================================= */}

               
                {/* =================================================
                    BACK
                ================================================= */}

                <button
                    type="button"
                    className="application-back-button"
                    onClick={goBack}
                >
                    <span>←</span>
                    Back to My Applications
                </button>

                {/* =================================================
                    JOB SUMMARY
                ================================================= */}

                <section className="application-section application-job-summary">

                    <div className="application-job-heading">

                        <div className="application-company-logo">
                            {companyName
                                ? String(companyName)
                                      .charAt(0)
                                      .toUpperCase()
                                : "J"}
                        </div>

                        <div>

                            <span className="section-label">
                                APPLIED POSITION
                            </span>

                            <h2>
                                {jobTitle}
                            </h2>

                            <p>
                                {companyName}
                            </p>

                        </div>

                    </div>

                    <div className="application-summary-status">

                        <span className="application-summary-label">
                            Application Status
                        </span>

                        <span
                            className={getStatusClass(
                                status
                            )}
                        >
                            <span className="application-status-dot" />

                            {statusText}
                        </span>

                    </div>

                </section>

                {/* =================================================
                    JOB INFORMATION
                ================================================= */}

                <section className="application-section">

                    <div className="application-section-title">

                        <div>

                            <span className="section-label">
                                JOB INFORMATION
                            </span>

                            <h2>
                                Position Details
                            </h2>

                        </div>

                    </div>

                    <div className="application-info-grid">

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                📍
                            </div>

                            <div>
                                <label>
                                    Location
                                </label>

                                <strong>
                                    {getDisplayValue(
                                        location
                                    )}
                                </strong>
                            </div>

                        </div>

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                💼
                            </div>

                            <div>
                                <label>
                                    Job Type
                                </label>

                                <strong>
                                    {getDisplayValue(
                                        jobType
                                    )}
                                </strong>
                            </div>

                        </div>

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                ⏱️
                            </div>

                            <div>
                                <label>
                                    Experience
                                </label>

                                <strong>
                                    {getDisplayValue(
                                        experience
                                    )}
                                </strong>
                            </div>

                        </div>

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                ₹
                            </div>

                            <div>
                                <label>
                                    Salary
                                </label>

                                <strong>
                                    {salary}
                                </strong>
                            </div>

                        </div>

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                🏢
                            </div>

                            <div>
                                <label>
                                    Work Mode
                                </label>

                                <strong>
                                    {getDisplayValue(
                                        workMode
                                    )}
                                </strong>
                            </div>

                        </div>

                        <div className="application-info-card">

                            <div className="application-info-icon">
                                ♿
                            </div>

                            <div>
                                <label>
                                    Disability Job
                                </label>

                                <strong>
                                    {isDisabilityJob
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <section className="application-section">

                    <div className="application-section-title">

                        <div>

                            <span className="section-label">
                                DESCRIPTION
                            </span>

                            <h2>
                                Job Description
                            </h2>

                        </div>

                    </div>

                    <div className="application-description">

                        <p>
                            {description}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    ROLES & RESPONSIBILITIES
                ================================================= */}

                {rolesResponsibilities ? (
                    <section className="application-section">

                        <div className="application-section-title">

                            <div>

                                <span className="section-label">
                                    RESPONSIBILITIES
                                </span>

                                <h2>
                                    Roles & Responsibilities
                                </h2>

                            </div>

                        </div>

                        <div className="application-description">

                            <p>
                                {rolesResponsibilities}
                            </p>

                        </div>

                    </section>
                ) : null}

                {/* =================================================
                    KEY FEATURES
                ================================================= */}

                {keyFeatures ? (
                    <section className="application-section">

                        <div className="application-section-title">

                            <div>

                                <span className="section-label">
                                    HIGHLIGHTS
                                </span>

                                <h2>
                                    Key Features
                                </h2>

                            </div>

                        </div>

                        <div className="application-description">

                            <p>
                                {keyFeatures}
                            </p>

                        </div>

                    </section>
                ) : null}

                {/* =================================================
                    EDUCATION
                ================================================= */}

                {educationDetails ? (
                    <section className="application-section">

                        <div className="application-section-title">

                            <div>

                                <span className="section-label">
                                    EDUCATION
                                </span>

                                <h2>
                                    Education Requirements
                                </h2>

                            </div>

                        </div>

                        <div className="application-description">

                            <p>
                                {educationDetails}
                            </p>

                        </div>

                    </section>
                ) : null}

                {/* =================================================
                    SKILLS
                ================================================= */}

                <section className="application-section">

                    <div className="application-section-title">

                        <div>

                            <span className="section-label">
                                REQUIREMENTS
                            </span>

                            <h2>
                                Skills
                            </h2>

                        </div>

                    </div>

                    {skills.length > 0 ? (
                        <div className="application-skills">

                            {skills.map(
                                (skill, index) => (
                                    <span
                                        className="application-skill-tag"
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>
                                )
                            )}

                        </div>
                    ) : (
                        <p className="application-empty">
                            No specific skills mentioned.
                        </p>
                    )}

                </section>

                {/* =================================================
                    APPLICATION INFORMATION
                ================================================= */}

                <section className="application-section">

                    <div className="application-section-title">

                        <div>

                            <span className="section-label">
                                APPLICATION
                            </span>

                            <h2>
                                Application Information
                            </h2>

                        </div>

                    </div>

                    <div className="application-details-grid">

                        <div className="application-detail-item">

                            <label>
                                Applied On
                            </label>

                            <p>
                                {appliedDate}
                            </p>

                        </div>

                        <div className="application-detail-item">

                            <label>
                                Current Status
                            </label>

                            <p>
                                <span
                                    className={getStatusClass(
                                        status
                                    )}
                                >
                                    <span className="application-status-dot" />

                                    {statusText}
                                </span>
                            </p>

                        </div>

                        <div className="application-detail-item">

                            <label>
                                Application ID
                            </label>

                            <p>
                                #{displayApplicationId}
                            </p>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <section className="application-details-footer">

                    <div>

                        <strong>
                            Need to view your other applications?
                        </strong>

                        <p>
                            Return to your applications
                            dashboard to track all your
                            job applications.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="application-primary-button"
                        onClick={goBack}
                    >
                        View My Applications →
                    </button>

                </section>

            </main>

            <style>{pageStyles}</style>
        </div>
    );
}

// =============================================================
// PAGE CSS
// =============================================================

const pageStyles = `

* {
    box-sizing: border-box;
}

.application-details-page {
    min-height: 100vh;
    width: 100%;
    background: #f8fafc;
    color: #111827;
}

.application-details-main {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
}

/* =========================================================
   HEADER
========================================================= */

.application-details-header {
    width: 100%;
    margin-bottom: 1.5rem;
    padding: 2rem;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    box-shadow:
        0 12px 35px
        rgba(15, 23, 42, 0.05);
}

.application-header-content {
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2rem;
}

.application-header-title {
    flex: 1;
    min-width: 0;
}

.application-brand {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1.8rem;
}

.application-brand-logo {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
    flex-shrink: 0;
}

.application-brand-logo svg {
    width: 42px;
    height: 42px;
    display: block;
}

.application-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
}

.application-brand-text strong {
    font-size: 1.08rem;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.02em;
}

.application-brand-text span {
    margin-top: 0.25rem;
    font-size: 0.68rem;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.04em;
}

.application-header-label {
    display: block;
    margin-bottom: 0.4rem;
    color: #6366f1;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.12em;
}

.application-details-header h1 {
    margin: 0 0 0.4rem;
    color: #111827;
    font-size: clamp(
        1.7rem,
        3vw,
        2.25rem
    );
    font-weight: 800;
    letter-spacing: -0.04em;
}

.application-details-header p {
    margin: 0;
    color: #6b7280;
    font-size: 0.92rem;
    line-height: 1.6;
}

.application-header-status {
    flex-shrink: 0;
}

/* =========================================================
   BACK
========================================================= */

.application-back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    border: 0;
    background: transparent;
    color: #4f46e5;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.6rem 0;
    margin-bottom: 1.2rem;
    transition:
        color 0.2s ease,
        transform 0.2s ease;
}

.application-back-button:hover {
    color: #3730a3;
    transform: translateX(-3px);
}

/* =========================================================
   STATUS
========================================================= */

.application-details-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 34px;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 800;
    white-space: nowrap;
    border: 1px solid transparent;
}

.application-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    background: currentColor;
}

.application-details-status.applied {
    color: #4f46e5;
    background: #eef2ff;
    border-color: #c7d2fe;
}

.application-details-status.under-review {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;
}

.application-details-status.shortlisted {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
}

.application-details-status.interview-scheduled {
    color: #7c3aed;
    background: #f5f3ff;
    border-color: #ddd6fe;
}

.application-details-status.hired {
    color: #15803d;
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.application-details-status.rejected {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
}

.application-details-status.pending {
    color: #d97706;
    background: #fffbeb;
    border-color: #fde68a;
}

.application-details-status.unknown {
    color: #6b7280;
    background: #f3f4f6;
    border-color: #e5e7eb;
}

/* =========================================================
   SECTIONS
========================================================= */

.application-section {
    width: 100%;
    margin-bottom: 1.25rem;
    padding: 1.5rem;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    box-shadow:
        0 8px 25px
        rgba(15, 23, 42, 0.035);
}

.application-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
}

.section-label {
    display: block;
    margin-bottom: 0.25rem;
    color: #9ca3af;
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.application-section-title h2 {
    margin: 0;
    color: #111827;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.025em;
}

/* =========================================================
   JOB SUMMARY
========================================================= */

.application-job-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
}

.application-job-heading {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
}

.application-company-logo {
    width: 62px;
    height: 62px;
    flex: 0 0 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background:
        linear-gradient(
            135deg,
            #4f46e5,
            #6366f1
        );
    color: white;
    font-size: 1.45rem;
    font-weight: 800;
    box-shadow:
        0 10px 24px
        rgba(79, 70, 229, 0.18);
}

.application-job-heading h2 {
    margin: 0.25rem 0;
    color: #111827;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.025em;
}

.application-job-heading p {
    margin: 0;
    color: #6b7280;
    font-size: 0.92rem;
    font-weight: 600;
}

.application-summary-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.45rem;
}

.application-summary-label {
    color: #9ca3af;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

/* =========================================================
   INFORMATION
========================================================= */

.application-info-grid {
    display: grid;
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.application-info-card {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1rem;
    border: 1px solid #eef0f4;
    border-radius: 14px;
    background: #fafafa;
    transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.application-info-card:hover {
    transform: translateY(-2px);
    border-color: #dddff5;
    box-shadow:
        0 8px 24px
        rgba(15, 23, 42, 0.06);
}

.application-info-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #eef2ff;
    color: #4f46e5;
    font-size: 1.1rem;
}

.application-info-card div:last-child {
    min-width: 0;
}

.application-info-card label {
    display: block;
    margin-bottom: 0.25rem;
    color: #9ca3af;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.application-info-card strong {
    display: block;
    color: #1f2937;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.4;
    overflow-wrap: anywhere;
}

/* =========================================================
   DESCRIPTION
========================================================= */

.application-description {
    padding: 1.15rem;
    border-radius: 14px;
    background: #fafafa;
    border: 1px solid #eef0f4;
}

.application-description p {
    margin: 0;
    color: #4b5563;
    font-size: 0.92rem;
    line-height: 1.8;
    white-space: pre-line;
}

/* =========================================================
   SKILLS
========================================================= */

.application-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
}

.application-skill-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.48rem 0.8rem;
    border-radius: 999px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    font-size: 0.78rem;
    font-weight: 700;
}

.application-empty {
    margin: 0;
    color: #9ca3af;
    font-size: 0.86rem;
}

/* =========================================================
   APPLICATION DETAILS
========================================================= */

.application-details-grid {
    display: grid;
    grid-template-columns:
        repeat(3, minmax(0, 1fr));
    gap: 1rem;
}

.application-detail-item {
    min-width: 0;
    padding: 1rem;
    border-radius: 14px;
    background: #fafafa;
    border: 1px solid #eef0f4;
}

.application-detail-item label {
    display: block;
    margin-bottom: 0.45rem;
    color: #9ca3af;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
}

.application-detail-item p {
    margin: 0;
    color: #1f2937;
    font-size: 0.9rem;
    font-weight: 700;
}

/* =========================================================
   FOOTER
========================================================= */

.application-details-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding: 1.35rem 1.5rem;
    border-radius: 16px;
    background:
        linear-gradient(
            135deg,
            #eef2ff,
            #f8fafc
        );
    border: 1px solid #e0e7ff;
}

.application-details-footer strong {
    display: block;
    margin-bottom: 0.25rem;
    color: #1f2937;
    font-size: 0.95rem;
}

.application-details-footer p {
    margin: 0;
    color: #6b7280;
    font-size: 0.8rem;
    line-height: 1.5;
}

.application-primary-button,
.back-button,
.retry-button {
    border: 0;
    border-radius: 10px;
    padding: 0.7rem 1rem;
    background: #4f46e5;
    color: white;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    box-shadow:
        0 7px 18px
        rgba(79, 70, 229, 0.2);
    transition:
        transform 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
}

.application-primary-button:hover,
.back-button:hover,
.retry-button:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow:
        0 10px 22px
        rgba(79, 70, 229, 0.25);
}

.retry-button {
    background: #111827;
}

.retry-button:hover {
    background: #000000;
}

.application-error-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

/* =========================================================
   LOADING
========================================================= */

.application-loading-card {
    min-height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem;
    border-radius: 18px;
    background: white;
    border: 1px solid #eef0f4;
    box-shadow:
        0 12px 35px
        rgba(15, 23, 42, 0.05);
}

.application-loading-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation:
        applicationSpin 0.8s
        linear infinite;
}

@keyframes applicationSpin {
    to {
        transform: rotate(360deg);
    }
}

.application-loading-card h2 {
    margin: 1rem 0 0.4rem;
    color: #111827;
    font-size: 1.1rem;
}

.application-loading-card p {
    margin: 0;
    color: #6b7280;
    font-size: 0.85rem;
}

/* =========================================================
   ERROR
========================================================= */

.application-error-card {
    min-height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem;
    border-radius: 18px;
    background: white;
    border: 1px solid #eef0f4;
    box-shadow:
        0 12px 35px
        rgba(15, 23, 42, 0.05);
}

.application-error-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #fef2f2;
    color: #dc2626;
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 1rem;
}

.application-error-card h1 {
    margin: 0 0 0.5rem;
    color: #111827;
    font-size: 1.25rem;
}

.application-error-card p {
    max-width: 520px;
    margin: 0 0 1.3rem;
    color: #6b7280;
    font-size: 0.88rem;
    line-height: 1.6;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 900px) {

    .application-details-main {
        padding: 1.5rem 1rem 2.5rem;
    }

    .application-header-content {
        align-items: flex-start;
    }

    .application-details-header {
        padding: 1.5rem;
    }

    .application-details-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {

    .application-header-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .application-header-status {
        width: 100%;
    }

    .application-job-summary {
        flex-direction: column;
        align-items: flex-start;
    }

    .application-summary-status {
        align-items: flex-start;
    }

    .application-info-grid {
        grid-template-columns: 1fr;
    }

    .application-details-footer {
        flex-direction: column;
        align-items: flex-start;
    }

    .application-primary-button {
        width: 100%;
    }

    .application-details-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 520px) {

    .application-details-main {
        padding: 1rem 0.75rem 2rem;
    }

    .application-details-header {
        padding: 1.25rem;
        border-radius: 16px;
    }

    .application-section {
        padding: 1.15rem;
        border-radius: 15px;
    }

    .application-brand {
        margin-bottom: 1.25rem;
    }

    .application-brand-logo,
    .application-brand-logo svg {
        width: 36px;
        height: 36px;
    }

    .application-brand-text strong {
        font-size: 0.95rem;
    }

    .application-brand-text span {
        font-size: 0.6rem;
    }

    .application-details-header h1 {
        font-size: 1.55rem;
    }

    .application-job-heading {
        align-items: flex-start;
    }

    .application-company-logo {
        width: 50px;
        height: 50px;
        flex-basis: 50px;
        border-radius: 13px;
        font-size: 1.15rem;
    }

    .application-job-heading h2 {
        font-size: 1.1rem;
    }

    .application-info-card {
        padding: 0.85rem;
    }

    .application-details-footer {
        padding: 1.15rem;
    }
}

`;

export default JobSeekerApplicationDetails;

