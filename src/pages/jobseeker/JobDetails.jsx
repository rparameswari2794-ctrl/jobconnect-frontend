import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState("");

    // =====================================================
    // FETCH JOB DETAILS
    // =====================================================

    useEffect(() => {
        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const fetchJob = async () => {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/auth/jobseeker/jobs/${jobId}/`,
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

            console.log("JOB DETAILS:", {
                status: response.status,
                data,
            });

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
                    "Unable to load job details."
                );
            }

            // =================================================
            // JOB OBJECT
            // =================================================

            const jobData = data.job || data;

            console.log("FINAL JOB DATA:", jobData);

            setJob(jobData);
        } catch (err) {
            console.error("JOB DETAILS ERROR:", err);

            setError(
                err.message ||
                "Unable to load job details."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // APPLY JOB
    // =====================================================

    // =====================================================
    // APPLY JOB
    // =====================================================

    const handleApply = async () => {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!jobId) {
            window.alert("Invalid job.");
            return;
        }

        setApplying(true);
        setMessage("");
        setError("");

        try {

            // =================================================
            // STEP 1: CHECK JOBSEEKER PROFILE
            // =================================================

            const profileResponse = await fetch(
                `${API_BASE}/auth/jobseeker/profile/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const profileText = await profileResponse.text();

            let profileData = {};

            try {
                profileData = profileText
                    ? JSON.parse(profileText)
                    : {};
            } catch {
                profileData = {
                    detail:
                        profileText ||
                        "Unable to check profile status.",
                };
            }

            console.log("PROFILE STATUS:", {
                status: profileResponse.status,
                data: profileData,
            });

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (profileResponse.status === 401) {
                localStorage.removeItem("jc_token");

                window.alert(
                    "Your session has expired. Please log in again."
                );

                navigate("/login");
                return;
            }

            // =================================================
            // PROFILE NOT FOUND
            // =================================================

            if (profileResponse.status === 404) {
                window.alert(
                    "Please complete your jobseeker profile before applying for a job."
                );

                navigate("/jobseeker/profile");
                return;
            }

            // =================================================
            // PROFILE API ERROR
            // =================================================

            if (!profileResponse.ok) {
                window.alert(
                    profileData.message ||
                    profileData.detail ||
                    "Unable to verify your profile."
                );

                return;
            }

            // =================================================
            // GET PROFILE STATUS
            // =================================================

            const profile =
                profileData.profile ||
                profileData;

            const profileCompleted =
                profile.profile_completed === true;

            const approvalStatus =
                String(
                    profile.approval_status || ""
                )
                    .toLowerCase()
                    .trim();

            console.log("PROFILE CHECK:", {
                profileCompleted,
                approvalStatus,
            });

            // =================================================
            // PROFILE NOT COMPLETED
            // =================================================

            if (!profileCompleted) {

                window.alert(
                    "Please complete your profile before applying for a job."
                );

                navigate("/jobseeker/profile");

                return;
            }

            // =================================================
            // PROFILE COMPLETED BUT NOT APPROVED
            // =================================================

            if (approvalStatus !== "approved") {

                if (approvalStatus === "pending") {

                    window.alert(
                        "Your profile is currently pending approval. You cannot apply for jobs until your profile is approved."
                    );

                } else if (approvalStatus === "rejected") {

                    window.alert(
                        "Your profile has been rejected. Please update your profile and resubmit it for approval before applying for jobs."
                    );

                } else {

                    window.alert(
                        "Your profile has not been approved yet. Please wait for approval before applying for jobs."
                    );

                }

                return;
            }

            // =================================================
            // PROFILE COMPLETED + APPROVED
            // CONTINUE WITH JOB APPLICATION
            // =================================================

            const response = await fetch(
                `${API_BASE}/auth/jobseeker/jobs/${jobId}/apply/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const text = await response.text();

            let data = {};

            try {
                data = text
                    ? JSON.parse(text)
                    : {};
            } catch {
                data = {
                    detail:
                        text ||
                        "Invalid server response.",
                };
            }

            console.log("APPLY RESPONSE:", {
                status: response.status,
                data,
            });

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (response.status === 401) {

                localStorage.removeItem("jc_token");

                window.alert(
                    "Your session has expired. Please log in again."
                );

                navigate("/login");

                return;
            }

            // =================================================
            // FORBIDDEN
            // =================================================

            if (response.status === 403) {

                window.alert(
                    data.message ||
                    data.detail ||
                    "Your profile is not approved. You cannot apply for this job."
                );

                return;
            }

            // =================================================
            // BAD REQUEST
            // =================================================

            if (response.status === 400) {

                window.alert(
                    data.message ||
                    data.detail ||
                    "You have already applied for this job."
                );

                return;
            }

            // =================================================
            // OTHER ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to apply for this job."
                );
            }

            // =================================================
            // SUCCESS
            // =================================================

            setMessage(
                data.message ||
                "Job application submitted successfully."
            );

            setJob((previousJob) => ({
                ...previousJob,

                applied: true,

                application_id:
                    data.application?.id ||
                    data.application_id ||
                    previousJob?.application_id ||
                    null,

                application_status:
                    data.application?.status ||
                    data.status ||
                    "APPLIED",
            }));

            // Optional success popup

            window.alert(
                data.message ||
                "Job application submitted successfully."
            );

        } catch (err) {

            console.error(
                "JOB APPLICATION ERROR:",
                err
            );

            window.alert(
                err.message ||
                "Unable to submit application."
            );

            setError(
                err.message ||
                "Unable to submit application."
            );

        } finally {

            setApplying(false);

        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="job-details-page">
                <div className="job-details-container">
                    <div className="job-details-loading">
                        Loading job details...
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error && !job) {
        return (
            <div className="job-details-page">
                <div className="job-details-container">

                    <div className="job-details-error">
                        {error}
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/jobseeker/jobs"
                            )
                        }
                    >
                        ← Back to Find Jobs
                    </button>

                </div>
            </div>
        );
    }

    // =====================================================
    // JOB NOT FOUND
    // =====================================================

    if (!job) {
        return (
            <div className="job-details-page">
                <div className="job-details-container">

                    <div className="job-details-error">
                        Job not found.
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/jobseeker/jobs"
                            )
                        }
                    >
                        ← Back to Find Jobs
                    </button>

                </div>
            </div>
        );
    }

    // =====================================================
    // SKILLS
    // =====================================================

    const skills = Array.isArray(job.skills)
        ? job.skills
        : typeof job.skills === "string"
            ? job.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
            : [];

    // =====================================================
    // SALARY
    // =====================================================

    const salaryMin =
        job.salary_min !== null &&
            job.salary_min !== undefined &&
            job.salary_min !== ""
            ? Number(job.salary_min)
            : null;

    const salaryMax =
        job.salary_max !== null &&
            job.salary_max !== undefined &&
            job.salary_max !== ""
            ? Number(job.salary_max)
            : null;

    const formatSalary = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            Number.isNaN(amount)
        ) {
            return null;
        }

        return `₹${amount.toLocaleString("en-IN")}`;
    };

    let salary = "Salary not specified";

    if (
        salaryMin !== null &&
        salaryMax !== null
    ) {
        salary =
            `${formatSalary(salaryMin)} - ` +
            `${formatSalary(salaryMax)} per year`;
    } else if (salaryMin !== null) {
        salary =
            `${formatSalary(salaryMin)} per year`;
    } else if (salaryMax !== null) {
        salary =
            `Up to ${formatSalary(salaryMax)} per year`;
    }

    // =====================================================
    // EXPERIENCE
    // =====================================================

    const getExperienceText = () => {
        const experienceValue =
            String(job.experience || "")
                .toLowerCase()
                .trim();

        if (experienceValue === "fresher") {
            return "Fresher";
        }

        const minimum =
            job.minimum_experience !== null &&
                job.minimum_experience !== undefined &&
                job.minimum_experience !== ""
                ? Number(job.minimum_experience)
                : null;

        const maximum =
            job.maximum_experience !== null &&
                job.maximum_experience !== undefined &&
                job.maximum_experience !== ""
                ? Number(job.maximum_experience)
                : null;

        if (
            minimum !== null &&
            maximum !== null
        ) {
            return `${minimum} - ${maximum} years`;
        }

        if (minimum !== null) {
            return `${minimum}+ years`;
        }

        if (maximum !== null) {
            return `Up to ${maximum} years`;
        }

        // Backend experience category
        if (experienceValue === "0-2") {
            return "0 - 2 years";
        }

        if (experienceValue === "2-5") {
            return "2 - 5 years";
        }

        if (experienceValue === "5+") {
            return "5+ years";
        }

        if (job.experience) {
            return job.experience;
        }

        return "Experience not specified";
    };

    const experience = getExperienceText();

    // =====================================================
    // JOB TYPE
    // =====================================================

    const jobTypeMap = {
        full_time: "Full Time",
        part_time: "Part Time",
        contract: "Contract",
        internship: "Internship",
    };

    const jobType =
        jobTypeMap[job.job_type] ||
        job.job_type ||
        "Job type not specified";

    // =====================================================
    // WORK MODE
    // =====================================================

    const workModeMap = {
        remote: "Remote",
        hybrid: "Hybrid",
        onsite: "On-site",
        on_site: "On-site",
        "on-site": "On-site",
    };

    const workModeKey = String(
        job.work_mode || ""
    )
        .toLowerCase()
        .trim();

    const workMode =
        workModeMap[workModeKey] ||
        job.work_mode ||
        "Work mode not specified";

    // =====================================================
    // EDUCATION
    // =====================================================

    const education =
        job.education_details ||
        "Education details not specified.";

    // =====================================================
    // RESPONSIBILITIES
    // =====================================================

    const responsibilities =
        job.roles_responsibilities || "";

    // =====================================================
    // KEY FEATURES
    // =====================================================

    const features =
        job.key_features || "";

    // =====================================================
    // CREATED DATE
    // =====================================================

    const createdDate = job.created_at
        ? new Date(
            job.created_at
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
    // COMPANY
    //
    // JobSerializer only returns employer ID.
    // Do not assume company_name exists.
    // =====================================================

    const companyName =
        job.employer_name ||
        job.company_name ||
        "Company";

    // =====================================================
    // LOCATION
    // =====================================================

    const location =
        job.location ||
        "Location not specified";

    // =====================================================
    // TEXT LIST
    // =====================================================

    const renderTextList = (text) => {
        if (!text) {
            return null;
        }

        if (Array.isArray(text)) {
            return text
                .filter(Boolean)
                .map((item, index) => (
                    <div
                        key={index}
                        className="job-detail-list-item"
                    >
                        • {item}
                    </div>
                ));
        }

        return String(text)
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item, index) => (
                <div
                    key={index}
                    className="job-detail-list-item"
                >
                    • {item}
                </div>
            ));
    };

    // =====================================================
    // APPLICATION STATUS
    // =====================================================

    const alreadyApplied =
        job.applied === true ||
        Boolean(job.application_id);

    // =====================================================
    // JOB STATUS
    // =====================================================

    const jobStatus =
        String(job.status || "")
            .toUpperCase();

    const isPublished =
        jobStatus === "PUBLISHED" ||
        (
            !jobStatus &&
            job.is_active !== false
        );

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="job-details-page">

            <div className="job-details-container">

                {/* =================================================
                    BACK
                ================================================= */}

                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate(
                            "/jobseeker/jobs"
                        )
                    }
                >
                    ← Back to Find Jobs
                </button>

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="job-details-header">

                    <div>

                        <h1>
                            {job.title ||
                                "Job Title"}
                        </h1>

                        <h3>
                            {companyName}
                        </h3>

                        <div className="job-meta">

                            <span>
                                📍 {location}
                            </span>

                            <span>
                                💼 {jobType}
                            </span>

                            <span>
                                🏠 {workMode}
                            </span>

                            <span>
                                💰 {salary}
                            </span>

                            <span>
                                🗓 Posted {createdDate}
                            </span>

                        </div>

                    </div>

                    <div className="job-status">

                        {isPublished ? (
                            <span className="active-badge">
                                Active
                            </span>
                        ) : (
                            <span className="inactive-badge">
                                Closed
                            </span>
                        )}

                    </div>

                </div>

                {/* =================================================
                    SUCCESS MESSAGE
                ================================================= */}

                {message && (
                    <div className="job-success-message">
                        {message}
                    </div>
                )}

                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {error && job && (
                    <div className="job-details-error">
                        {error}
                    </div>
                )}

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="job-details-content">

                    {/* =================================================
                        MAIN
                    ================================================= */}

                    <div className="job-details-main">

                        {/* DESCRIPTION */}

                        <section className="job-details-section">

                            <h2>
                                Description
                            </h2>

                            <p
                                style={{
                                    whiteSpace:
                                        "pre-line",
                                }}
                            >
                                {job.description ||
                                    "No job description provided."}
                            </p>

                        </section>

                        {/* SKILLS */}

                        <section className="job-details-section">

                            <h2>
                                Skills
                            </h2>

                            {skills.length > 0 ? (

                                <div className="job-skills">

                                    {skills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={index}
                                                className="job-skill"
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

                        {/* RESPONSIBILITIES */}

                        <section className="job-details-section">

                            <h2>
                                Roles & Responsibilities
                            </h2>

                            {responsibilities ? (

                                <div className="job-detail-list">

                                    {renderTextList(
                                        responsibilities
                                    )}

                                </div>

                            ) : (
                                <p>
                                    No roles & responsibilities specified.
                                </p>
                            )}

                        </section>

                        {/* KEY FEATURES */}

                        <section className="job-details-section">

                            <h2>
                                Key Features / What This Role Offers
                            </h2>

                            {features ? (

                                <div className="job-detail-list">

                                    {renderTextList(
                                        features
                                    )}

                                </div>

                            ) : (
                                <p>
                                    No key features specified.
                                </p>
                            )}

                        </section>

                        {/* JOB INFORMATION */}

                        <section className="job-details-section">

                            <h2>
                                Job Information
                            </h2>

                            <div className="job-information-grid">

                                <div className="job-information-item">

                                    <strong>
                                        Location
                                    </strong>

                                    <span>
                                        {location}
                                    </span>

                                </div>

                                <div className="job-information-item">

                                    <strong>
                                        Work Mode
                                    </strong>

                                    <span>
                                        {workMode}
                                    </span>

                                </div>

                                <div className="job-information-item">

                                    <strong>
                                        Job Type
                                    </strong>

                                    <span>
                                        {jobType}
                                    </span>

                                </div>

                                <div className="job-information-item">

                                    <strong>
                                        Experience
                                    </strong>

                                    <span>
                                        {experience}
                                    </span>

                                </div>

                                <div className="job-information-item">

                                    <strong>
                                        Salary
                                    </strong>

                                    <span>
                                        {salary}
                                    </span>

                                </div>

                            </div>

                        </section>

                        {/* EDUCATION */}

                        <section className="job-details-section">

                            <h2>
                                Education Details
                            </h2>

                            {Array.isArray(
                                education
                            ) ? (

                                <div className="job-detail-list">

                                    {education
                                        .filter(Boolean)
                                        .map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="job-detail-list-item"
                                                >
                                                    •{" "}
                                                    {item}
                                                </div>
                                            )
                                        )}

                                </div>

                            ) : (

                                <p
                                    style={{
                                        whiteSpace:
                                            "pre-line",
                                    }}
                                >
                                    {education}
                                </p>

                            )}

                        </section>

                    </div>

                    {/* =================================================
                        SIDEBAR
                    ================================================= */}

                    <aside className="job-details-sidebar">

                        {/* APPLY CARD */}

                        <div className="apply-card">

                            <h2>
                                Interested in this job?
                            </h2>

                            <p>
                                Apply now and start
                                your application
                                process.
                            </p>

                            {!isPublished ? (

                                <button
                                    type="button"
                                    className="apply-job-button"
                                    disabled
                                >
                                    Job Closed
                                </button>

                            ) : alreadyApplied ? (

                                <button
                                    type="button"
                                    className="apply-job-button"
                                    disabled
                                >
                                    ✓ Already Applied
                                </button>

                            ) : (

                                <button
                                    type="button"
                                    className="apply-job-button"
                                    onClick={
                                        handleApply
                                    }
                                    disabled={
                                        applying
                                    }
                                >
                                    {applying
                                        ? "Applying..."
                                        : "Apply Now"}
                                </button>

                            )}

                            <button
                                type="button"
                                className="applications-button"
                                onClick={() =>
                                    navigate(
                                        "/jobseeker/applications"
                                    )
                                }
                            >
                                View My Applications
                            </button>

                        </div>

                        {/* JOB SUMMARY */}

                        <div className="company-card">

                            <h2>
                                Job Summary
                            </h2>

                            <div className="job-summary-item">

                                <strong>
                                    Company
                                </strong>

                                <span>
                                    {companyName}
                                </span>

                            </div>

                            <div className="job-summary-item">

                                <strong>
                                    Location
                                </strong>

                                <span>
                                    {location}
                                </span>

                            </div>

                            <div className="job-summary-item">

                                <strong>
                                    Work Mode
                                </strong>

                                <span>
                                    {workMode}
                                </span>

                            </div>

                            <div className="job-summary-item">

                                <strong>
                                    Job Type
                                </strong>

                                <span>
                                    {jobType}
                                </span>

                            </div>

                            <div className="job-summary-item">

                                <strong>
                                    Experience
                                </strong>

                                <span>
                                    {experience}
                                </span>

                            </div>

                            <div className="job-summary-item">

                                <strong>
                                    Salary
                                </strong>

                                <span>
                                    {salary}
                                </span>

                            </div>

                        </div>

                    </aside>

                </div>

            </div>

        </div>
    );
}

export default JobDetails;