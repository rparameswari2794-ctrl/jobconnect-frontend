import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState("");

    // =====================================================
    // JOB MATCH STATE
    // =====================================================

    const [jobseekerProfile, setJobseekerProfile] = useState(null);
    const [matchLoading, setMatchLoading] = useState(true);

    // =====================================================
    // FETCH JOB DETAILS
    // =====================================================

    useEffect(() => {
        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    // =====================================================
    // FETCH JOBSEEKER PROFILE FOR MATCHING
    // =====================================================

    useEffect(() => {
        fetchJobseekerProfile();
    }, []);

    const fetchJobseekerProfile = async () => {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            setMatchLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/auth/jobseeker/profile/`,
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
                data = {};
            }

            console.log("JOBSEEKER PROFILE FOR MATCH:", {
                status: response.status,
                data,
            });

            if (response.status === 401) {
                setMatchLoading(false);
                return;
            }

            if (!response.ok) {
                setMatchLoading(false);
                return;
            }

            const profile =
                data.profile ||
                data.jobseeker ||
                data;

            setJobseekerProfile(profile);

        } catch (err) {
            console.error(
                "PROFILE MATCH ERROR:",
                err
            );
        } finally {
            setMatchLoading(false);
        }
    };

    // =====================================================
    // FETCH JOB
    // =====================================================

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
                    detail:
                        text ||
                        "Invalid server response.",
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

            const jobData =
                data.job ||
                data;

            console.log(
                "FINAL JOB DATA:",
                jobData
            );

            setJob(jobData);

        } catch (err) {
            console.error(
                "JOB DETAILS ERROR:",
                err
            );

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

    const handleApply = async () => {
        const token =
            localStorage.getItem("jc_token");

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

            const profileResponse =
                await fetch(
                    `${API_BASE}/auth/jobseeker/profile/`,
                    {
                        method: "GET",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            const profileText =
                await profileResponse.text();

            let profileData = {};

            try {
                profileData =
                    profileText
                        ? JSON.parse(profileText)
                        : {};
            } catch {
                profileData = {
                    detail:
                        profileText ||
                        "Unable to check profile status.",
                };
            }

            console.log(
                "PROFILE STATUS:",
                {
                    status:
                        profileResponse.status,
                    data: profileData,
                }
            );

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (
                profileResponse.status ===
                401
            ) {
                localStorage.removeItem(
                    "jc_token"
                );

                window.alert(
                    "Your session has expired. Please log in again."
                );

                navigate("/login");

                return;
            }

            // =================================================
            // PROFILE NOT FOUND
            // =================================================

            if (
                profileResponse.status ===
                404
            ) {
                window.alert(
                    "Please complete your jobseeker profile before applying for a job."
                );

                navigate(
                    "/jobseeker/profile"
                );

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
                profile.profile_completed ===
                true;

            const approvalStatus =
                String(
                    profile.approval_status ||
                    ""
                )
                    .toLowerCase()
                    .trim();

            console.log(
                "PROFILE CHECK:",
                {
                    profileCompleted,
                    approvalStatus,
                }
            );

            // =================================================
            // PROFILE NOT COMPLETED
            // =================================================

            if (!profileCompleted) {

                window.alert(
                    "Please complete your profile before applying for a job."
                );

                navigate(
                    "/jobseeker/profile"
                );

                return;
            }

            // =================================================
            // PROFILE COMPLETED BUT NOT APPROVED
            // =================================================

            if (
                approvalStatus !==
                "approved"
            ) {

                if (
                    approvalStatus ===
                    "pending"
                ) {

                    window.alert(
                        "Your profile is currently pending approval. You cannot apply for jobs until your profile is approved."
                    );

                } else if (
                    approvalStatus ===
                    "rejected"
                ) {

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

            const response =
                await fetch(
                    `${API_BASE}/auth/jobseeker/jobs/${jobId}/apply/`,
                    {
                        method: "POST",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            const text =
                await response.text();

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

            console.log(
                "APPLY RESPONSE:",
                {
                    status:
                        response.status,
                    data,
                }
            );

            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (
                response.status ===
                401
            ) {

                localStorage.removeItem(
                    "jc_token"
                );

                window.alert(
                    "Your session has expired. Please log in again."
                );

                navigate("/login");

                return;
            }

            // =================================================
            // FORBIDDEN
            // =================================================

            if (
                response.status ===
                403
            ) {

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

            if (
                response.status ===
                400
            ) {

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

            setJob(
                (previousJob) => ({
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
                })
            );

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
            <>
                <style>
                    {jobDetailsStyles}
                </style>

                <div className="job-details-page">

                    <div className="job-details-container">

                        <div className="job-details-loading">

                            <div className="loading-spinner"></div>

                            <span>
                                Loading job details...
                            </span>

                        </div>

                    </div>

                </div>
            </>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error && !job) {
        return (
            <>
                <style>
                    {jobDetailsStyles}
                </style>

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
            </>
        );
    }

    // =====================================================
    // JOB NOT FOUND
    // =====================================================

    if (!job) {
        return (
            <>
                <style>
                    {jobDetailsStyles}
                </style>

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
            </>
        );
    }

    // =====================================================
    // SKILLS
    // =====================================================

    const skills =
        Array.isArray(job.skills)
            ? job.skills
            : typeof job.skills ===
                "string"
                ? job.skills
                    .split(",")
                    .map(
                        (skill) =>
                            skill.trim()
                    )
                    .filter(Boolean)
                : [];

    // =====================================================
    // JOBSEEKER SKILLS
    // =====================================================

    const getProfileSkills = () => {

        if (!jobseekerProfile) {
            return [];
        }

        const possibleSkills =
            jobseekerProfile.skills ||
            jobseekerProfile.technical_skills ||
            jobseekerProfile.key_skills ||
            jobseekerProfile.skill ||
            jobseekerProfile.skills_list ||
            [];

        if (
            Array.isArray(
                possibleSkills
            )
        ) {
            return possibleSkills
                .map((skill) => {

                    if (
                        typeof skill ===
                        "string"
                    ) {
                        return skill;
                    }

                    if (
                        typeof skill ===
                        "object"
                    ) {
                        return (
                            skill.name ||
                            skill.skill ||
                            skill.title ||
                            ""
                        );
                    }

                    return "";
                })
                .filter(Boolean);
        }

        if (
            typeof possibleSkills ===
            "string"
        ) {
            return possibleSkills
                .split(",")
                .map(
                    (skill) =>
                        skill.trim()
                )
                .filter(Boolean);
        }

        return [];
    };

    const profileSkills =
        getProfileSkills();

    // =====================================================
    // MATCH SKILLS
    // =====================================================

    const normalizeSkill = (
        skill
    ) => {
        return String(skill || "")
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9+#.]/g,
                ""
            );
    };

    const normalizedProfileSkills =
        profileSkills.map(
            normalizeSkill
        );

    const matchedSkills =
        skills.filter(
            (jobSkill) => {

                const normalizedJobSkill =
                    normalizeSkill(
                        jobSkill
                    );

                return normalizedProfileSkills.some(
                    (profileSkill) => {

                        return (
                            profileSkill ===
                                normalizedJobSkill ||
                            profileSkill.includes(
                                normalizedJobSkill
                            ) ||
                            normalizedJobSkill.includes(
                                profileSkill
                            )
                        );
                    }
                );
            }
        );

    // =====================================================
    // JOB MATCH PERCENTAGE
    // =====================================================

    let skillMatchPercentage = 0;

    if (
        skills.length > 0 &&
        profileSkills.length > 0
    ) {
        skillMatchPercentage =
            Math.round(
                (
                    matchedSkills.length /
                    skills.length
                ) * 100
            );
    }

    // =====================================================
    // OVERALL MATCH
    // =====================================================

    const getOverallMatch = () => {

        if (
            !jobseekerProfile ||
            profileSkills.length === 0
        ) {
            return 0;
        }

        let score =
            skillMatchPercentage;

        // Experience matching
        const profileExperience =
            Number(
                jobseekerProfile.years_of_experience ??
                jobseekerProfile.experience_years ??
                jobseekerProfile.total_experience ??
                0
            );

        const minimumExperience =
            Number(
                job.minimum_experience ??
                0
            );

        if (
            minimumExperience > 0
        ) {
            if (
                profileExperience >=
                minimumExperience
            ) {
                score += 10;
            }
        } else {
            score += 10;
        }

        // Education information
        const profileEducation =
            String(
                jobseekerProfile.education ||
                jobseekerProfile.education_details ||
                ""
            )
                .trim();

        if (
            profileEducation
        ) {
            score += 10;
        }

        return Math.min(
            100,
            Math.round(score)
        );
    };

    const overallMatch =
        getOverallMatch();

    // =====================================================
    // MATCH MESSAGE
    // =====================================================

    const getMatchMessage = () => {

        if (
            matchLoading
        ) {
            return "Checking your profile...";
        }

        if (
            profileSkills.length === 0
        ) {
            return "Add your skills to your profile to see your job match.";
        }

        if (
            overallMatch >= 80
        ) {
            return "Excellent match! Your profile strongly matches this job.";
        }

        if (
            overallMatch >= 60
        ) {
            return "Good match! You meet many of the job requirements.";
        }

        if (
            overallMatch >= 40
        ) {
            return "Moderate match. Consider improving your missing skills.";
        }

        return "Low match. Review the required skills before applying.";
    };

    const matchMessage =
        getMatchMessage();

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

    const formatSalary = (
        amount
    ) => {

        if (
            amount === null ||
            amount === undefined ||
            Number.isNaN(amount)
        ) {
            return null;
        }

        return `₹${amount.toLocaleString(
            "en-IN"
        )}`;
    };

    let salary =
        "Salary not specified";

    if (
        salaryMin !== null &&
        salaryMax !== null
    ) {

        salary =
            `${formatSalary(
                salaryMin
            )} - ${formatSalary(
                salaryMax
            )} per year`;

    } else if (
        salaryMin !== null
    ) {

        salary =
            `${formatSalary(
                salaryMin
            )} per year`;

    } else if (
        salaryMax !== null
    ) {

        salary =
            `Up to ${formatSalary(
                salaryMax
            )} per year`;
    }

    // =====================================================
    // EXPERIENCE
    // =====================================================

    const getExperienceText =
        () => {

            const experienceValue =
                String(
                    job.experience ||
                    ""
                )
                    .toLowerCase()
                    .trim();

            if (
                experienceValue ===
                "fresher"
            ) {
                return "Fresher";
            }

            const minimum =
                job.minimum_experience !==
                    null &&
                    job.minimum_experience !==
                    undefined &&
                    job.minimum_experience !==
                    ""
                    ? Number(
                        job.minimum_experience
                    )
                    : null;

            const maximum =
                job.maximum_experience !==
                    null &&
                    job.maximum_experience !==
                    undefined &&
                    job.maximum_experience !==
                    ""
                    ? Number(
                        job.maximum_experience
                    )
                    : null;

            if (
                minimum !== null &&
                maximum !== null
            ) {
                return `${minimum} - ${maximum} years`;
            }

            if (
                minimum !== null
            ) {
                return `${minimum}+ years`;
            }

            if (
                maximum !== null
            ) {
                return `Up to ${maximum} years`;
            }

            if (
                experienceValue ===
                "0-2"
            ) {
                return "0 - 2 years";
            }

            if (
                experienceValue ===
                "2-5"
            ) {
                return "2 - 5 years";
            }

            if (
                experienceValue ===
                "5+"
            ) {
                return "5+ years";
            }

            if (job.experience) {
                return job.experience;
            }

            return "Experience not specified";
        };

    const experience =
        getExperienceText();

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
        jobTypeMap[
            job.job_type
        ] ||
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

    const workModeKey =
        String(
            job.work_mode ||
            ""
        )
            .toLowerCase()
            .trim();

    const workMode =
        workModeMap[
            workModeKey
        ] ||
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
        job.roles_responsibilities ||
        "";

    // =====================================================
    // KEY FEATURES
    // =====================================================

    const features =
        job.key_features ||
        "";

    // =====================================================
    // CREATED DATE
    // =====================================================

    const createdDate =
        job.created_at
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

    const renderTextList =
        (text) => {

            if (!text) {
                return null;
            }

            if (
                Array.isArray(text)
            ) {

                return text
                    .filter(Boolean)
                    .map(
                        (
                            item,
                            index
                        ) => (
                            <div
                                key={index}
                                className="job-detail-list-item"
                            >
                                • {item}
                            </div>
                        )
                    );
            }

            return String(text)
                .split(/\r?\n/)
                .map(
                    (item) =>
                        item.trim()
                )
                .filter(Boolean)
                .map(
                    (
                        item,
                        index
                    ) => (
                        <div
                            key={index}
                            className="job-detail-list-item"
                        >
                            • {item}
                        </div>
                    )
                );
        };

    // =====================================================
    // APPLICATION STATUS
    // =====================================================

    const alreadyApplied =
        job.applied === true ||
        Boolean(
            job.application_id
        );

    // =====================================================
    // JOB STATUS
    // =====================================================

    const jobStatus =
        String(
            job.status ||
            ""
        ).toUpperCase();

    const isPublished =
        jobStatus ===
            "PUBLISHED" ||
        (
            !jobStatus &&
            job.is_active !== false
        );

    // =====================================================
    // PIE CHART VALUES
    // =====================================================

    const chartMatch =
        overallMatch > 0
            ? overallMatch
            : 0;

    const chartRemaining =
        100 - chartMatch;

    const pieStyle = {
        background:
            `conic-gradient(
                #2563eb 0% ${chartMatch}%,
                #e5e7eb ${chartMatch}% 100%
            )`,
    };

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <>
            <style>
                {jobDetailsStyles}
            </style>

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
                        <span>←</span>
                        Back to Find Jobs
                    </button>

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="job-details-header">

                        <div className="job-header-left">

                            <div className="job-title-icon">
                                {job.title
                                    ? job.title
                                        .charAt(0)
                                        .toUpperCase()
                                    : "J"}
                            </div>

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

                        </div>

                        <div className="job-status">

                            {isPublished ? (

                                <span className="active-badge">
                                    ✓ Active
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

                            <span>✓</span>

                            {message}

                        </div>

                    )}

                    {/* =================================================
                        ERROR
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

                            {/* =================================================
                                JOB MATCH / PIE CHART
                            ================================================= */}

                            <section className="job-details-section job-match-section">

                                <div className="match-header">

                                    <div>

                                        <h2>
                                            <span className="section-icon">
                                                🎯
                                            </span>

                                            Your Job Match
                                        </h2>

                                        <p className="match-description">
                                            See how closely your profile matches
                                            the requirements of this job.
                                        </p>

                                    </div>

                                    <div className="match-status-label">

                                        {overallMatch >= 80
                                            ? "Excellent Match"
                                            : overallMatch >= 60
                                                ? "Good Match"
                                                : overallMatch >= 40
                                                    ? "Moderate Match"
                                                    : overallMatch > 0
                                                        ? "Low Match"
                                                        : "Not Available"}

                                    </div>

                                </div>

                                <div className="job-match-content">

                                    <div className="pie-chart-wrapper">

                                        <div
                                            className="job-match-pie"
                                            style={pieStyle}
                                        >

                                            <div className="pie-chart-center">

                                                <strong>
                                                    {overallMatch}%
                                                </strong>

                                                <span>
                                                    Match
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="match-details">

                                        <div className="match-score-title">
                                            Job Possibility
                                        </div>

                                        <div className="match-score-number">
                                            {overallMatch}%
                                        </div>

                                        <p>
                                            {matchMessage}
                                        </p>

                                        <div className="match-legend">

                                            <div className="legend-item">

                                                <span className="legend-dot matched"></span>

                                                <span>
                                                    Profile Match
                                                </span>

                                                <strong>
                                                    {chartMatch}%
                                                </strong>

                                            </div>

                                            <div className="legend-item">

                                                <span className="legend-dot remaining"></span>

                                                <span>
                                                    Remaining
                                                </span>

                                                <strong>
                                                    {chartRemaining}%
                                                </strong>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                    SKILL MATCH DETAILS
                                ================================================= */}

                                {skills.length > 0 && (

                                    <div className="skill-match-box">

                                        <div className="skill-match-title">
                                            Skill Compatibility
                                        </div>

                                        <div className="skill-match-count">

                                            <span className="matched-count">
                                                {matchedSkills.length}
                                            </span>

                                            <span>
                                                of
                                            </span>

                                            <span>
                                                {skills.length}
                                            </span>

                                            <span>
                                                required skills matched
                                            </span>

                                        </div>

                                        <div className="matched-skills">

                                            {matchedSkills.length >
                                                0 ? (

                                                matchedSkills.map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (

                                                        <span
                                                            key={index}
                                                            className="matched-skill"
                                                        >
                                                            ✓ {skill}
                                                        </span>

                                                    )
                                                )

                                            ) : (

                                                <span className="no-matched-skills">
                                                    No matching skills found.
                                                </span>

                                            )}

                                        </div>

                                    </div>

                                )}

                            </section>

                            {/* =================================================
                                DESCRIPTION
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        📋
                                    </span>

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

                            {/* =================================================
                                SKILLS
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        🛠
                                    </span>

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
                                                    className={
                                                        matchedSkills.some(
                                                            (
                                                                matched
                                                            ) =>
                                                                normalizeSkill(
                                                                    matched
                                                                ) ===
                                                                normalizeSkill(
                                                                    skill
                                                                )
                                                        )
                                                            ? "job-skill matched-job-skill"
                                                            : "job-skill"
                                                    }
                                                >

                                                    {matchedSkills.some(
                                                        (
                                                            matched
                                                        ) =>
                                                            normalizeSkill(
                                                                matched
                                                            ) ===
                                                            normalizeSkill(
                                                                skill
                                                            )
                                                    )
                                                        ? "✓ "
                                                        : ""}

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
                                RESPONSIBILITIES
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        ✓
                                    </span>

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

                            {/* =================================================
                                KEY FEATURES
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        ⭐
                                    </span>

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

                            {/* =================================================
                                JOB INFORMATION
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        ℹ
                                    </span>

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

                            {/* =================================================
                                EDUCATION
                            ================================================= */}

                            <section className="job-details-section">

                                <h2>

                                    <span className="section-icon">
                                        🎓
                                    </span>

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

                            {/* =================================================
                                APPLY CARD
                            ================================================= */}

                            <div className="apply-card">

                                <div className="apply-card-icon">
                                    🚀
                                </div>

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

                            {/* =================================================
                                JOB SUMMARY
                            ================================================= */}

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
        </>
    );
}


/* =========================================================
   FULL PAGE STYLE
========================================================= */

const jobDetailsStyles = `

* {
    box-sizing: border-box;
}

.job-details-page {
    min-height: calc(100vh - 70px);
    width: 100%;
    background: #f6f8fb;
    padding: 22px 28px 45px;
    color: #172033;
}

.job-details-container {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
}

/* =========================================================
   BACK BUTTON
========================================================= */

.back-button {
    border: none;
    background: transparent;
    color: #2563eb;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 7px 0;
    margin-bottom: 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.back-button:hover {
    color: #1d4ed8;
    transform: translateX(-2px);
}

/* =========================================================
   HEADER
========================================================= */

.job-details-header {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.05);
    margin-bottom: 18px;
}

.job-header-left {
    display: flex;
    align-items: flex-start;
    gap: 17px;
    min-width: 0;
}

.job-title-icon {
    width: 55px;
    height: 55px;
    flex: 0 0 55px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eff6ff;
    color: #2563eb;
    font-size: 23px;
    font-weight: 700;
}

.job-details-header h1 {
    margin: 0 0 5px;
    font-size: 27px;
    line-height: 1.25;
    font-weight: 750;
    color: #111827;
}

.job-details-header h3 {
    margin: 0 0 13px;
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
}

.job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    color: #64748b;
    font-size: 12.5px;
}

.job-meta span {
    display: inline-flex;
    align-items: center;
}

/* =========================================================
   STATUS
========================================================= */

.job-status {
    flex-shrink: 0;
}

.active-badge,
.inactive-badge {
    display: inline-flex;
    align-items: center;
    padding: 7px 13px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.active-badge {
    background: #ecfdf3;
    color: #15803d;
    border: 1px solid #bbf7d0;
}

.inactive-badge {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

/* =========================================================
   SUCCESS / ERROR
========================================================= */

.job-success-message {
    background: #ecfdf3;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 11px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    gap: 8px;
    align-items: center;
}

.job-details-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    padding: 12px 15px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.5;
}

/* =========================================================
   CONTENT
========================================================= */

.job-details-content {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 20px;
    align-items: start;
}

.job-details-main {
    min-width: 0;
}

/* =========================================================
   SECTIONS
========================================================= */

.job-details-section {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 21px 23px;
    margin-bottom: 17px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.035);
}

.job-details-section h2 {
    margin: 0 0 13px;
    color: #111827;
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 9px;
}

.section-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: #eff6ff;
    color: #2563eb;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
}

.job-details-section p {
    margin: 0;
    color: #5b6474;
    font-size: 13.5px;
    line-height: 1.75;
}

/* =========================================================
   JOB MATCH SECTION
========================================================= */

.job-match-section {
    border: 1px solid #dbeafe;
    background:
        linear-gradient(
            135deg,
            #ffffff 0%,
            #f8fbff 100%
        );
}

.match-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
}

.match-header h2 {
    margin-bottom: 5px;
}

.match-description {
    font-size: 12.5px !important;
    color: #64748b !important;
}

.match-status-label {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #dbeafe;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
}

/* =========================================================
   MATCH CONTENT
========================================================= */

.job-match-content {
    display: flex;
    align-items: center;
    gap: 38px;
    margin-top: 18px;
    padding: 18px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #edf2f7;
}

.pie-chart-wrapper {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.job-match-pie {
    width: 185px;
    height: 185px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow:
        0 8px 25px rgba(37, 99, 235, 0.12);
}

.job-match-pie::before {
    content: "";
    position: absolute;
    width: 135px;
    height: 135px;
    border-radius: 50%;
    background: #ffffff;
}

.pie-chart-center {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.pie-chart-center strong {
    font-size: 31px;
    line-height: 1;
    color: #111827;
    font-weight: 800;
}

.pie-chart-center span {
    margin-top: 5px;
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
}

.match-details {
    flex: 1;
    min-width: 0;
}

.match-score-title {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 3px;
}

.match-score-number {
    font-size: 32px;
    color: #2563eb;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 7px;
}

.match-details p {
    margin: 0 0 16px;
    color: #64748b;
    font-size: 12.5px;
    line-height: 1.65;
}

.match-legend {
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.legend-item {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
}

.legend-item strong {
    color: #1f2937;
    font-size: 12px;
}

.legend-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
}

.legend-dot.matched {
    background: #2563eb;
}

.legend-dot.remaining {
    background: #d1d5db;
}

/* =========================================================
   SKILL MATCH BOX
========================================================= */

.skill-match-box {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 11px;
    background: #f8fafc;
}

.skill-match-title {
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
}

.skill-match-count {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #64748b;
    font-size: 12px;
}

.matched-count {
    color: #2563eb;
    font-size: 16px;
    font-weight: 800;
}

.matched-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
}

.matched-skill {
    padding: 6px 9px;
    border-radius: 7px;
    background: #ecfdf3;
    border: 1px solid #bbf7d0;
    color: #15803d;
    font-size: 11px;
    font-weight: 650;
}

.no-matched-skills {
    color: #94a3b8;
    font-size: 12px;
}

/* =========================================================
   SKILLS
========================================================= */

.job-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.job-skill {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 7px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #dbeafe;
    font-size: 12px;
    font-weight: 600;
}

.matched-job-skill {
    background: #ecfdf3;
    border-color: #bbf7d0;
    color: #15803d;
}

/* =========================================================
   LIST
========================================================= */

.job-detail-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.job-detail-list-item {
    color: #4b5563;
    font-size: 13.5px;
    line-height: 1.65;
    padding-left: 2px;
}

/* =========================================================
   JOB INFORMATION
========================================================= */

.job-information-grid {
    display: grid;
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.job-information-item {
    border: 1px solid #edf0f4;
    background: #f8fafc;
    border-radius: 9px;
    padding: 11px 13px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.job-information-item strong {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.job-information-item span {
    color: #1f2937;
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
}

/* =========================================================
   SIDEBAR
========================================================= */

.job-details-sidebar {
    position: sticky;
    top: 85px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* =========================================================
   APPLY CARD
========================================================= */

.apply-card {
    background: #ffffff;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    padding: 20px;
    box-shadow:
        0 6px 20px rgba(37, 99, 235, 0.07);
}

.apply-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 12px;
}

.apply-card h2 {
    margin: 0 0 7px;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
}

.apply-card p {
    margin: 0 0 15px;
    color: #64748b;
    font-size: 12.5px;
    line-height: 1.6;
}

.apply-job-button {
    width: 100%;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.apply-job-button:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow:
        0 5px 12px rgba(
            37,
            99,
            235,
            0.2
        );
}

.apply-job-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}

.applications-button {
    width: 100%;
    margin-top: 9px;
    border: 1px solid #dbe2ea;
    border-radius: 8px;
    background: #ffffff;
    color: #334155;
    padding: 9px 12px;
    font-size: 12.5px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.2s ease;
}

.applications-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

/* =========================================================
   JOB SUMMARY
========================================================= */

.company-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 19px;
    box-shadow:
        0 4px 16px rgba(
            15,
            23,
            42,
            0.035
        );
}

.company-card h2 {
    margin: 0 0 13px;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
}

.job-summary-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 9px 0;
    border-bottom: 1px solid #f0f2f5;
}

.job-summary-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.job-summary-item:first-of-type {
    padding-top: 0;
}

.job-summary-item strong {
    color: #94a3b8;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35px;
}

.job-summary-item span {
    color: #334155;
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1.4;
    word-break: break-word;
}

/* =========================================================
   LOADING
========================================================= */

.job-details-loading {
    min-height: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #64748b;
    font-size: 13px;
}

.loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #dbeafe;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation:
        jobDetailsSpin
        0.8s linear infinite;
}

@keyframes jobDetailsSpin {

    to {
        transform: rotate(360deg);
    }

}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1100px) {

    .job-details-content {
        grid-template-columns:
            minmax(0, 1fr) 300px;
    }

    .job-details-page {
        padding-left: 20px;
        padding-right: 20px;
    }

}

@media (max-width: 900px) {

    .job-details-content {
        grid-template-columns: 1fr;
    }

    .job-details-sidebar {
        position: static;
        display: grid;
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

}

@media (max-width: 700px) {

    .job-details-page {
        padding: 15px 12px 30px;
    }

    .job-details-header {
        padding: 17px;
        flex-direction: column;
    }

    .job-header-left {
        width: 100%;
    }

    .job-details-header h1 {
        font-size: 21px;
    }

    .job-title-icon {
        width: 44px;
        height: 44px;
        flex-basis: 44px;
        font-size: 18px;
    }

    .job-meta {
        flex-direction: column;
        gap: 6px;
    }

    .job-status {
        align-self: flex-start;
    }

    .job-information-grid {
        grid-template-columns: 1fr;
    }

    .job-details-sidebar {
        grid-template-columns: 1fr;
    }

    .job-details-section {
        padding: 16px;
    }

    .job-match-content {
        flex-direction: column;
        text-align: center;
        gap: 22px;
    }

    .match-header {
        flex-direction: column;
    }

    .match-status-label {
        align-self: flex-start;
    }

    .match-details {
        width: 100%;
    }

    .match-legend {
        text-align: left;
    }

}

@media (max-width: 480px) {

    .job-details-page {
        padding: 12px 9px 25px;
    }

    .job-details-header {
        border-radius: 12px;
        padding: 14px;
    }

    .job-header-left {
        gap: 11px;
    }

    .job-title-icon {
        width: 40px;
        height: 40px;
        flex-basis: 40px;
        border-radius: 9px;
    }

    .job-details-header h1 {
        font-size: 18px;
    }

    .job-details-section h2 {
        font-size: 15px;
    }

    .job-details-section p,
    .job-detail-list-item {
        font-size: 12.5px;
    }

    .job-match-pie {
        width: 155px;
        height: 155px;
    }

    .job-match-pie::before {
        width: 112px;
        height: 112px;
    }

    .pie-chart-center strong {
        font-size: 26px;
    }

    .job-match-content {
        padding: 14px;
    }

}

`;

export default JobDetails;