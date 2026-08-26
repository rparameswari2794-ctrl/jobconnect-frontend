import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
    useLocation
} from "react-router-dom";


// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BACKEND_ORIGIN = API_BASE.replace(
    /\/api\/?$/,
    ""
);


// =====================================================
// COMPONENT
// =====================================================

function AdminJobSeekerProfile() {

    const { id } = useParams();

    const location = useLocation();

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =====================================================
    // WHERE DID THE ADMIN COME FROM?
    // =====================================================

    const fromPage =
        location.state?.from || "verification";


    // =====================================================
    // BACK NAVIGATION
    // =====================================================

    function handleBack() {

        if (fromPage === "users") {

            navigate("/admin/users");

            return;
        }

        navigate("/admin/verifications");
    }


    // =====================================================
    // BACK BUTTON TEXT
    // =====================================================

    const backButtonText =
        fromPage === "users"
            ? "← Back to Users"
            : "← Back to Verification Queue";


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        if (id) {

            fetchProfile();

        }

    }, [id]);


    async function fetchProfile() {

        const token =
            localStorage.getItem("jc_token");


        console.log(
            "PROFILE ID:",
            id
        );


        console.log(
            "ADMIN TOKEN EXISTS:",
            !!token
        );


        console.log(
            "PROFILE OPENED FROM:",
            fromPage
        );


        if (!token) {

            setError(
                "Admin login session not found."
            );

            setLoading(false);

            return;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE}/admin/jobseekers/${id}/`,
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


            const text =
                await response.text();


            let data = {};


            try {

                data =
                    text
                        ? JSON.parse(text)
                        : {};

            } catch {

                data = {
                    message: text,
                };

            }


            console.log(
                "PROFILE API STATUS:",
                response.status
            );


            console.log(
                "PROFILE API RESPONSE:",
                data
            );


            console.log(
                "EDUCATION DATA:",
                data.educations
            );


            console.log(
                "EXPERIENCE DATA:",
                data.experiences
            );


            console.log(
                "PROJECT DATA:",
                data.projects
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    `Unable to load job seeker profile. Status: ${response.status}`
                );
            }


            setProfile(data);


        } catch (err) {

            console.error(
                "FETCH PROFILE ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to load profile."
            );


        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // DISPLAY VALUE
    // =====================================================

    function displayValue(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "Not provided";

        }

        return value;

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {

            return "Not provided";

        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateValue;

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
    // FILE URL
    // =====================================================

    function getFileUrl(file) {

        if (!file) {

            return null;

        }


        if (
            file.startsWith("http://") ||
            file.startsWith("https://")
        ) {

            return file;

        }


        if (file.startsWith("/")) {

            return `${BACKEND_ORIGIN}${file}`;

        }


        return `${BACKEND_ORIGIN}/${file}`;

    }


    // =====================================================
    // APPROVAL STATUS
    // =====================================================

    function formatApprovalStatus(status) {

        if (!status) {

            return "Not provided";

        }


        return (
            status.charAt(0).toUpperCase() +
            status.slice(1)
        );

    }


    // =====================================================
    // STATUS CLASS
    // =====================================================

    function getStatusClass(status) {

        const value =
            String(status || "")
                .toLowerCase();

        if (value === "approved") {
            return "profile-status approved";
        }

        if (value === "rejected") {
            return "profile-status rejected";
        }

        return "profile-status pending";
    }


    // =====================================================
    // PROFILE COMPLETION
    // =====================================================

    function calculateProfileCompletion() {

        if (!profile) {
            return 0;
        }

        const checks = [
            profile.full_name,
            profile.email,
            profile.phone,
            profile.location,
            profile.headline,
            profile.skills,
            profile.educations?.length,
            profile.experiences?.length,
            profile.projects?.length,
            profile.linkedin,
            profile.resume,
            profile.profile_photo
        ];

        const completed =
            checks.filter(
                value =>
                    value !== undefined &&
                    value !== null &&
                    value !== "" &&
                    value !== 0
            ).length;

        return Math.round(
            (completed / checks.length) * 100
        );
    }


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="admin-dashboard">

                <main className="admin-main">

                    <section className="profile-loading-card">

                        <div className="profile-loading-spinner"></div>

                        <h3>
                            Loading Job Seeker Profile
                        </h3>

                        <p>
                            Please wait while the profile is being loaded.
                        </p>

                    </section>

                </main>

                <style>{adminJobSeekerProfileCSS}</style>

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

                    <section className="profile-error-card">

                        <div className="profile-error-icon">
                            !
                        </div>

                        <h3>
                            Unable to Load Profile
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="profile-back-button"
                            onClick={handleBack}
                        >
                            {backButtonText}
                        </button>

                    </section>

                </main>

                <style>{adminJobSeekerProfileCSS}</style>

            </div>

        );

    }


    // =====================================================
    // NO PROFILE
    // =====================================================

    if (!profile) {

        return (

            <div className="admin-dashboard">

                <main className="admin-main">

                    <section className="profile-error-card">

                        <div className="profile-error-icon">
                            !
                        </div>

                        <h3>
                            Job Seeker Profile Not Found
                        </h3>

                        <p>
                            The requested profile could not be found.
                        </p>

                        <button
                            type="button"
                            className="profile-back-button"
                            onClick={handleBack}
                        >
                            {backButtonText}
                        </button>

                    </section>

                </main>

                <style>{adminJobSeekerProfileCSS}</style>

            </div>

        );

    }


    // =====================================================
    // FILE URLS
    // =====================================================

    const profilePhoto =
        getFileUrl(
            profile.profile_photo
        );


    const resume =
        getFileUrl(
            profile.resume
        );


    const aadhaarCard =
        getFileUrl(
            profile.aadhaar
        );


    // =====================================================
    // PROFILE COMPLETION
    // =====================================================

    const profileCompletion =
        calculateProfileCompletion();


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="admin-dashboard">

            <main className="admin-main admin-jobseeker-profile-page">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="profile-page-header">

                    <div>

                        <span className="profile-page-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>
                            Job Seeker Profile
                        </h1>

                        <p>
                            Review submitted profile details before verification.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="top-back-button"
                        onClick={handleBack}
                    >
                        {backButtonText}
                    </button>

                </section>


                {/* =================================================
                    PROFILE HERO
                ================================================= */}

                <section className="profile-hero-card">

                    <div className="profile-hero-main">


                        {/* PROFILE PHOTO */}

                        <div className="profile-photo-wrapper">

                            <div className="profile-photo-frame">

                                {profilePhoto ? (

                                    <img
                                        src={profilePhoto}
                                        alt={
                                            profile.full_name ||
                                            "Job seeker"
                                        }
                                    />

                                ) : (

                                    <div className="profile-photo-placeholder">

                                        {profile.full_name
                                            ? profile.full_name
                                                .charAt(0)
                                                .toUpperCase()
                                            : "?"
                                        }

                                    </div>

                                )}

                            </div>

                        </div>


                        {/* NAME */}

                        <div className="profile-hero-content">

                            <div className="profile-name-row">

                                <h2>
                                    {displayValue(
                                        profile.full_name
                                    )}
                                </h2>

                                <span
                                    className={
                                        getStatusClass(
                                            profile.approval_status
                                        )
                                    }
                                >
                                    {formatApprovalStatus(
                                        profile.approval_status
                                    )}
                                </span>

                            </div>

                            <p className="profile-headline">

                                {displayValue(
                                    profile.headline
                                )}

                            </p>


                            <div className="profile-quick-info">

                                <span>
                                    ✉ {displayValue(profile.email)}
                                </span>

                                <span>
                                    ☎ {displayValue(profile.phone)}
                                </span>

                                <span>
                                    📍 {displayValue(profile.location)}
                                </span>

                            </div>

                        </div>


                        {/* PIE CHART */}

                        <div className="profile-completion-box">

                            <div
                                className="profile-pie-chart"
                                style={{
                                    "--completion":
                                        `${profileCompletion}%`
                                }}
                            >

                                <div className="profile-pie-inner">

                                    <strong>
                                        {profileCompletion}%
                                    </strong>

                                    <span>
                                        Complete
                                    </span>

                                </div>

                            </div>

                            <p>
                                Profile Completion
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            👤
                        </div>

                        <div>

                            <h2>
                                Personal Information
                            </h2>

                            <p>
                                Basic information provided by the job seeker.
                            </p>

                        </div>

                    </div>


                    <div className="profile-info-grid">


                        <div className="profile-info-item">

                            <label>
                                Full Name
                            </label>

                            <p>
                                {displayValue(
                                    profile.full_name
                                )}
                            </p>

                        </div>


                        <div className="profile-info-item">

                            <label>
                                Email
                            </label>

                            <p className="break-text">
                                {displayValue(
                                    profile.email
                                )}
                            </p>

                        </div>


                        <div className="profile-info-item">

                            <label>
                                Phone
                            </label>

                            <p>
                                {displayValue(
                                    profile.phone
                                )}
                            </p>

                        </div>


                        <div className="profile-info-item">

                            <label>
                                Location
                            </label>

                            <p>
                                {displayValue(
                                    profile.location
                                )}
                            </p>

                        </div>


                        <div className="profile-info-item full-width">

                            <label>
                                Headline
                            </label>

                            <p>
                                {displayValue(
                                    profile.headline
                                )}
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PROFESSIONAL INFORMATION
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            💼
                        </div>

                        <div>

                            <h2>
                                Professional Information
                            </h2>

                            <p>
                                Skills and professional capabilities.
                            </p>

                        </div>

                    </div>


                    <div className="skills-container">

                        <label>
                            Skills
                        </label>

                        <div className="profile-skills">

                            {profile.skills ? (

                                profile.skills
                                    .split(",")
                                    .map(
                                        (
                                            skill,
                                            index
                                        ) => (

                                            <span
                                                className="skill-tag"
                                                key={index}
                                            >
                                                {skill.trim()}
                                            </span>

                                        )
                                    )

                            ) : (

                                <span className="not-provided">
                                    Not provided
                                </span>

                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    EDUCATION
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            🎓
                        </div>

                        <div>

                            <h2>
                                Education
                            </h2>

                            <p>
                                Academic qualifications submitted by the candidate.
                            </p>

                        </div>

                    </div>


                    {profile.educations &&
                    profile.educations.length > 0 ? (

                        <div className="profile-record-grid">

                            {profile.educations.map(
                                (education) => (

                                    <div
                                        key={education.id}
                                        className="profile-record-card"
                                    >

                                        <div className="record-card-title">

                                            <h3>
                                                {displayValue(
                                                    education.degree
                                                )}
                                            </h3>

                                            <span>
                                                Education
                                            </span>

                                        </div>


                                        <div className="profile-mini-grid">

                                            <div>

                                                <span>
                                                    University
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        education.university
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    College
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        education.college
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    Passing Month & Year
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        education.passing_month_year
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    Percentage / CGPA
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        education.percentage_cgpa
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="empty-record">
                            Not provided
                        </div>

                    )}

                </section>


                {/* =================================================
                    EXPERIENCE
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            🏢
                        </div>

                        <div>

                            <h2>
                                Experience
                            </h2>

                            <p>
                                Previous and current professional experience.
                            </p>

                        </div>

                    </div>


                    {profile.experiences &&
                    profile.experiences.length > 0 ? (

                        <div className="profile-record-grid">

                            {profile.experiences.map(
                                (experience) => (

                                    <div
                                        key={experience.id}
                                        className="profile-record-card"
                                    >

                                        <div className="record-card-title">

                                            <h3>
                                                {displayValue(
                                                    experience.job_title
                                                )}
                                            </h3>

                                            <span>
                                                Experience
                                            </span>

                                        </div>


                                        <div className="profile-mini-grid">

                                            <div>

                                                <span>
                                                    Company
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        experience.company
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    Employment Type
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        experience.employment_type
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    Start Date
                                                </span>

                                                <p>
                                                    {formatDate(
                                                        experience.start_date
                                                    )}
                                                </p>

                                            </div>


                                            <div>

                                                <span>
                                                    End Date
                                                </span>

                                                <p>
                                                    {experience.is_current
                                                        ? "Present"
                                                        : formatDate(
                                                            experience.end_date
                                                        )
                                                    }
                                                </p>

                                            </div>

                                        </div>


                                        <div className="profile-description-block">

                                            <span>
                                                Description
                                            </span>

                                            <p>
                                                {displayValue(
                                                    experience.description
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="empty-record">
                            Not provided
                        </div>

                    )}

                </section>


                {/* =================================================
                    PROJECTS
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            🚀
                        </div>

                        <div>

                            <h2>
                                Projects
                            </h2>

                            <p>
                                Projects and practical work submitted by the candidate.
                            </p>

                        </div>

                    </div>


                    {profile.projects &&
                    profile.projects.length > 0 ? (

                        <div className="profile-record-grid">

                            {profile.projects.map(
                                (project) => {

                                    const projectTitle =
                                        project.title ||
                                        project.name ||
                                        project.project_name;


                                    const projectUrl =
                                        project.project_url ||
                                        project.url ||
                                        project.link;


                                    return (

                                        <div
                                            key={project.id}
                                            className="profile-record-card"
                                        >

                                            <div className="record-card-title">

                                                <h3>
                                                    {displayValue(
                                                        projectTitle
                                                    )}
                                                </h3>

                                                <span>
                                                    Project
                                                </span>

                                            </div>


                                            <div className="profile-mini-grid">

                                                <div>

                                                    <span>
                                                        Project Type
                                                    </span>

                                                    <p>
                                                        {displayValue(
                                                            project.project_type
                                                        )}
                                                    </p>

                                                </div>


                                                <div>

                                                    <span>
                                                        Technologies
                                                    </span>

                                                    <p className="break-text">
                                                        {displayValue(
                                                            project.technologies
                                                        )}
                                                    </p>

                                                </div>

                                            </div>


                                            <div className="profile-description-block">

                                                <span>
                                                    Project URL
                                                </span>


                                                {projectUrl ? (

                                                    <p>

                                                        <a
                                                            href={
                                                                projectUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {projectUrl}
                                                        </a>

                                                    </p>

                                                ) : (

                                                    <p>
                                                        Not provided
                                                    </p>

                                                )}

                                            </div>


                                            <div className="profile-description-block">

                                                <span>
                                                    Description
                                                </span>

                                                <p>
                                                    {displayValue(
                                                        project.description
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    ) : (

                        <div className="empty-record">
                            Not provided
                        </div>

                    )}

                </section>


                {/* =================================================
                    PROFESSIONAL LINKS
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            🔗
                        </div>

                        <div>

                            <h2>
                                Professional Links
                            </h2>

                            <p>
                                Online professional profiles.
                            </p>

                        </div>

                    </div>


                    <div className="profile-info-grid">

                        <div className="profile-info-item">

                            <label>
                                LinkedIn
                            </label>


                            {profile.linkedin ? (

                                <a
                                    href={
                                        profile.linkedin
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-link"
                                >
                                    View LinkedIn Profile →
                                </a>

                            ) : (

                                <p>
                                    Not provided
                                </p>

                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    UPLOADED DOCUMENTS
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            📁
                        </div>

                        <div>

                            <h2>
                                Uploaded Documents
                            </h2>

                            <p>
                                Documents submitted for verification.
                            </p>

                        </div>

                    </div>


                    <div className="document-list">


                        {/* AADHAAR */}

                        <div className="document-row">

                            <div className="document-icon">
                                🪪
                            </div>

                            <div className="document-content">

                                <strong>
                                    Aadhaar Card
                                </strong>

                                <p>
                                    Government ID document
                                </p>

                            </div>


                            <div className="document-action">

                                {aadhaarCard ? (

                                    <a
                                        href={aadhaarCard}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Aadhaar
                                    </a>

                                ) : (

                                    <span>
                                        Not uploaded
                                    </span>

                                )}

                            </div>

                        </div>


                        {/* RESUME */}

                        <div className="document-row">

                            <div className="document-icon">
                                📄
                            </div>

                            <div className="document-content">

                                <strong>
                                    Resume
                                </strong>

                                <p>
                                    Submitted resume
                                </p>

                            </div>


                            <div className="document-action">

                                {resume ? (

                                    <a
                                        href={resume}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Resume
                                    </a>

                                ) : (

                                    <span>
                                        Not uploaded
                                    </span>

                                )}

                            </div>

                        </div>


                        {/* PROFILE PHOTO */}

                        <div className="document-row">

                            <div className="document-icon">
                                🖼️
                            </div>

                            <div className="document-content">

                                <strong>
                                    Profile Photo
                                </strong>

                                <p>
                                    Submitted profile image
                                </p>

                            </div>


                            <div className="document-action">

                                {profilePhoto ? (

                                    <a
                                        href={profilePhoto}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Photo
                                    </a>

                                ) : (

                                    <span>
                                        Not uploaded
                                    </span>

                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    VERIFICATION INFORMATION
                ================================================= */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div className="profile-section-icon">
                            ✓
                        </div>

                        <div>

                            <h2>
                                Verification Information
                            </h2>

                            <p>
                                Current profile verification details.
                            </p>

                        </div>

                    </div>


                    <div className="verification-info-grid">


                        <div className="verification-item">

                            <span>
                                Status
                            </span>

                            <strong
                                className={
                                    getStatusClass(
                                        profile.approval_status
                                    )
                                }
                            >
                                {formatApprovalStatus(
                                    profile.approval_status
                                )}
                            </strong>

                        </div>


                        <div className="verification-item">

                            <span>
                                Profile Completed
                            </span>

                            <strong
                                className={
                                    profile.profile_completed
                                        ? "success-text"
                                        : "danger-text"
                                }
                            >
                                {profile.profile_completed
                                    ? "Yes"
                                    : "No"
                                }
                            </strong>

                        </div>


                        <div className="verification-item">

                            <span>
                                Submitted
                            </span>

                            <strong>
                                {formatDate(
                                    profile.created_at
                                )}
                            </strong>

                        </div>


                        <div className="verification-item">

                            <span>
                                Last Updated
                            </span>

                            <strong>
                                {formatDate(
                                    profile.updated_at
                                )}
                            </strong>

                        </div>


                        {profile.rejection_reason && (

                            <div className="verification-item full-width">

                                <span>
                                    Rejection Reason
                                </span>

                                <strong className="danger-text">
                                    {profile.rejection_reason}
                                </strong>

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    BOTTOM ACTION
                ================================================= */}

                <section className="profile-bottom-actions">

                    <button
                        type="button"
                        className="profile-back-button"
                        onClick={handleBack}
                    >
                        {backButtonText}
                    </button>

                </section>


            </main>


            {/* =====================================================
                PAGE STYLE
            ===================================================== */}

            <style>{adminJobSeekerProfileCSS}</style>

        </div>

    );

}


// =====================================================
// STYLE
// =====================================================

const adminJobSeekerProfileCSS = `

/* =====================================================
   GLOBAL BOX SIZING
===================================================== */

.admin-jobseeker-profile-page,
.admin-jobseeker-profile-page *,
.admin-jobseeker-profile-page *::before,
.admin-jobseeker-profile-page *::after {

    box-sizing: border-box;

}


/* =====================================================
   MAIN PAGE
===================================================== */

.admin-jobseeker-profile-page {

    width: 100%;

    max-width: 1180px;

    min-width: 0;

    margin: 0 auto;

    padding: 22px 24px 50px;

    overflow-x: hidden;

}


/* =====================================================
   PAGE HEADER
===================================================== */

.profile-page-header {

    width: 100%;

    display: flex;

    justify-content: space-between;

    align-items: flex-end;

    gap: 20px;

    margin-bottom: 20px;

}


.profile-page-eyebrow {

    display: inline-block;

    font-size: 11px;

    font-weight: 700;

    letter-spacing: 1.4px;

    color: #64748b;

    margin-bottom: 6px;

}


.profile-page-header h1 {

    margin: 0;

    color: #172033;

    font-size: 28px;

    line-height: 1.2;

    font-weight: 750;

}


.profile-page-header p {

    margin: 7px 0 0;

    color: #718096;

    font-size: 14px;

}


.top-back-button {

    flex: 0 0 auto;

    border: 1px solid #dbe2ea;

    background: #ffffff;

    color: #334155;

    border-radius: 9px;

    padding: 10px 15px;

    font-size: 13px;

    font-weight: 600;

    cursor: pointer;

    white-space: nowrap;

    transition: 0.2s ease;

}


.top-back-button:hover {

    background: #f8fafc;

    border-color: #cbd5e1;

    transform: translateY(-1px);

}


/* =====================================================
   HERO CARD
===================================================== */

.profile-hero-card {

    width: 100%;

    min-width: 0;

    background: #ffffff;

    border: 1px solid #e5eaf0;

    border-radius: 16px;

    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.05);

    margin-bottom: 18px;

    overflow: hidden;

}


.profile-hero-main {

    width: 100%;

    min-width: 0;

    display: flex;

    align-items: center;

    gap: 22px;

    padding: 24px;

}


/* =====================================================
   PROFILE PHOTO
===================================================== */

.profile-photo-wrapper {

    flex: 0 0 auto;

}


.profile-photo-frame {

    width: 94px;

    height: 94px;

    border-radius: 14px;

    overflow: hidden;

    background: #f1f5f9;

    border: 1px solid #dbe3ec;

    display: flex;

    align-items: center;

    justify-content: center;

}


.profile-photo-frame img {

    width: 100%;

    height: 100%;

    display: block;

    object-fit: cover;

}


.profile-photo-placeholder {

    width: 100%;

    height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    background: linear-gradient(
        135deg,
        #e8eef7,
        #f5f7fa
    );

    color: #475569;

    font-size: 32px;

    font-weight: 700;

}


/* =====================================================
   HERO CONTENT
===================================================== */

.profile-hero-content {

    flex: 1 1 auto;

    min-width: 0;

    max-width: 100%;

}


.profile-name-row {

    display: flex;

    align-items: center;

    flex-wrap: wrap;

    gap: 10px;

}


.profile-name-row h2 {

    margin: 0;

    min-width: 0;

    max-width: 100%;

    color: #172033;

    font-size: 23px;

    line-height: 1.3;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.profile-headline {

    margin: 7px 0 12px;

    color: #64748b;

    font-size: 14px;

    line-height: 1.5;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.profile-quick-info {

    display: flex;

    flex-wrap: wrap;

    gap: 8px 18px;

}


.profile-quick-info span {

    min-width: 0;

    color: #64748b;

    font-size: 12px;

    overflow-wrap: anywhere;

    word-break: break-word;

}


/* =====================================================
   STATUS
===================================================== */

.profile-status {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 999px;

    padding: 5px 10px;

    font-size: 11px;

    font-weight: 700;

    line-height: 1;

    text-transform: capitalize;

    white-space: nowrap;

}


.profile-status.approved {

    color: #047857;

    background: #ecfdf5;

    border: 1px solid #a7f3d0;

}


.profile-status.pending {

    color: #b45309;

    background: #fffbeb;

    border: 1px solid #fde68a;

}


.profile-status.rejected {

    color: #b91c1c;

    background: #fef2f2;

    border: 1px solid #fecaca;

}


/* =====================================================
   PIE CHART
===================================================== */

.profile-completion-box {

    flex: 0 0 125px;

    width: 125px;

    text-align: center;

}


.profile-pie-chart {

    width: 92px;

    height: 92px;

    margin: 0 auto 8px;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    background:
        conic-gradient(
            #2563eb var(--completion),
            #e8edf4 var(--completion)
        );

    position: relative;

}


.profile-pie-chart::before {

    content: "";

    position: absolute;

    inset: 8px;

    border-radius: 50%;

    background: #ffffff;

}


.profile-pie-inner {

    position: relative;

    z-index: 1;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

}


.profile-pie-inner strong {

    color: #172033;

    font-size: 20px;

    line-height: 1;

}


.profile-pie-inner span {

    margin-top: 4px;

    color: #64748b;

    font-size: 9px;

}


.profile-completion-box > p {

    margin: 0;

    color: #64748b;

    font-size: 11px;

    font-weight: 600;

}


/* =====================================================
   COMMON PROFILE CARD
===================================================== */

.profile-card {

    width: 100%;

    max-width: 100%;

    min-width: 0;

    background: #ffffff;

    border: 1px solid #e5eaf0;

    border-radius: 14px;

    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.035);

    margin-bottom: 18px;

    padding: 22px;

    overflow: hidden;

}


/* =====================================================
   CARD HEADER
===================================================== */

.profile-card-header {

    display: flex;

    align-items: flex-start;

    gap: 12px;

    margin-bottom: 20px;

}


.profile-section-icon {

    width: 38px;

    height: 38px;

    flex: 0 0 38px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 10px;

    background: #f1f5f9;

    font-size: 17px;

}


.profile-card-header h2 {

    margin: 0;

    color: #172033;

    font-size: 18px;

    line-height: 1.35;

}


.profile-card-header p {

    margin: 4px 0 0;

    color: #7b8798;

    font-size: 12px;

    line-height: 1.5;

}


/* =====================================================
   INFORMATION GRID
===================================================== */

.profile-info-grid {

    width: 100%;

    min-width: 0;

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 13px;

}


.profile-info-item {

    min-width: 0;

    max-width: 100%;

    padding: 14px 15px;

    background: #f8fafc;

    border: 1px solid #edf1f5;

    border-radius: 10px;

    overflow: hidden;

}


.profile-info-item.full-width {

    grid-column: 1 / -1;

}


.profile-info-item label {

    display: block;

    margin-bottom: 5px;

    color: #7b8798;

    font-size: 10px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.6px;

}


.profile-info-item p {

    margin: 0;

    color: #273449;

    font-size: 13px;

    line-height: 1.55;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.break-text {

    overflow-wrap: anywhere !important;

    word-break: break-word !important;

}


/* =====================================================
   SKILLS
===================================================== */

.skills-container {

    width: 100%;

    min-width: 0;

}


.skills-container > label {

    display: block;

    margin-bottom: 9px;

    color: #7b8798;

    font-size: 10px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.6px;

}


.profile-skills {

    display: flex;

    flex-wrap: wrap;

    gap: 8px;

    max-width: 100%;

}


.skill-tag {

    max-width: 100%;

    padding: 7px 11px;

    background: #eef4ff;

    border: 1px solid #d8e5ff;

    color: #315ca8;

    border-radius: 7px;

    font-size: 12px;

    font-weight: 600;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.not-provided {

    color: #94a3b8;

    font-size: 13px;

}


/* =====================================================
   RECORD GRID
===================================================== */

.profile-record-grid {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 14px;

    width: 100%;

    min-width: 0;

}


.profile-record-card {

    min-width: 0;

    max-width: 100%;

    padding: 17px;

    border: 1px solid #e7ecf2;

    background: #fbfcfe;

    border-radius: 11px;

    overflow: hidden;

}


.record-card-title {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 10px;

    margin-bottom: 15px;

}


.record-card-title h3 {

    margin: 0;

    min-width: 0;

    color: #273449;

    font-size: 15px;

    line-height: 1.4;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.record-card-title span {

    flex: 0 0 auto;

    padding: 4px 8px;

    background: #f1f5f9;

    color: #64748b;

    border-radius: 5px;

    font-size: 9px;

    font-weight: 700;

    text-transform: uppercase;

}


/* =====================================================
   MINI GRID
===================================================== */

.profile-mini-grid {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 12px;

}


.profile-mini-grid > div {

    min-width: 0;

}


.profile-mini-grid span,
.profile-description-block > span {

    display: block;

    margin-bottom: 4px;

    color: #94a3b8;

    font-size: 10px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.4px;

}


.profile-mini-grid p {

    margin: 0;

    color: #334155;

    font-size: 12px;

    line-height: 1.5;

    overflow-wrap: anywhere;

    word-break: break-word;

}


/* =====================================================
   DESCRIPTION
===================================================== */

.profile-description-block {

    min-width: 0;

    margin-top: 15px;

    padding-top: 14px;

    border-top: 1px solid #edf1f5;

}


.profile-description-block p {

    margin: 0;

    color: #475569;

    font-size: 12px;

    line-height: 1.6;

    overflow-wrap: anywhere;

    word-break: break-word;

}


/* =====================================================
   LINKS
===================================================== */

.profile-link {

    display: inline-block;

    max-width: 100%;

    color: #2563eb;

    font-size: 13px;

    font-weight: 600;

    text-decoration: none;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.profile-link:hover {

    text-decoration: underline;

}


.profile-description-block a {

    color: #2563eb;

    overflow-wrap: anywhere;

    word-break: break-word;

}


/* =====================================================
   EMPTY
===================================================== */

.empty-record {

    padding: 18px;

    background: #f8fafc;

    border: 1px dashed #dbe3ec;

    border-radius: 9px;

    color: #94a3b8;

    font-size: 13px;

    text-align: center;

}


/* =====================================================
   DOCUMENTS
===================================================== */

.document-list {

    width: 100%;

    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 10px;

}


.document-row {

    width: 100%;

    min-width: 0;

    display: flex;

    align-items: center;

    gap: 13px;

    padding: 13px 14px;

    background: #f8fafc;

    border: 1px solid #e9eef4;

    border-radius: 10px;

}


.document-icon {

    width: 38px;

    height: 38px;

    flex: 0 0 38px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #ffffff;

    border: 1px solid #e2e8f0;

    border-radius: 9px;

    font-size: 17px;

}


.document-content {

    flex: 1 1 auto;

    min-width: 0;

}


.document-content strong {

    display: block;

    color: #334155;

    font-size: 13px;

}


.document-content p {

    margin: 3px 0 0;

    color: #94a3b8;

    font-size: 11px;

}


.document-action {

    flex: 0 0 auto;

    min-width: 0;

}


.document-action a {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    padding: 7px 11px;

    background: #ffffff;

    border: 1px solid #dbe3ec;

    color: #2563eb;

    border-radius: 7px;

    text-decoration: none;

    font-size: 11px;

    font-weight: 600;

    white-space: nowrap;

}


.document-action a:hover {

    background: #eff6ff;

}


.document-action span {

    color: #94a3b8;

    font-size: 11px;

}


/* =====================================================
   VERIFICATION
===================================================== */

.verification-info-grid {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 12px;

}


.verification-item {

    min-width: 0;

    padding: 14px;

    background: #f8fafc;

    border: 1px solid #e9eef4;

    border-radius: 10px;

}


.verification-item.full-width {

    grid-column: 1 / -1;

}


.verification-item span {

    display: block;

    margin-bottom: 6px;

    color: #94a3b8;

    font-size: 10px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.5px;

}


.verification-item strong {

    display: block;

    color: #334155;

    font-size: 13px;

    line-height: 1.5;

    overflow-wrap: anywhere;

    word-break: break-word;

}


.success-text {

    color: #047857 !important;

}


.danger-text {

    color: #dc2626 !important;

}


/* =====================================================
   BOTTOM ACTION
===================================================== */

.profile-bottom-actions {

    width: 100%;

    display: flex;

    justify-content: flex-start;

    padding: 2px 0 10px;

}


.profile-back-button {

    border: 0;

    border-radius: 9px;

    padding: 10px 17px;

    background: #1e293b;

    color: #ffffff;

    font-size: 13px;

    font-weight: 600;

    cursor: pointer;

    transition: 0.2s ease;

}


.profile-back-button:hover {

    background: #0f172a;

    transform: translateY(-1px);

}


/* =====================================================
   LOADING
===================================================== */

.profile-loading-card {

    max-width: 520px;

    margin: 80px auto;

    padding: 40px 25px;

    text-align: center;

    background: #ffffff;

    border: 1px solid #e5eaf0;

    border-radius: 15px;

    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.05);

}


.profile-loading-spinner {

    width: 34px;

    height: 34px;

    margin: 0 auto 18px;

    border: 3px solid #e2e8f0;

    border-top-color: #2563eb;

    border-radius: 50%;

    animation: profileSpinner 0.8s linear infinite;

}


@keyframes profileSpinner {

    to {
        transform: rotate(360deg);
    }

}


.profile-loading-card h3 {

    margin: 0;

    color: #334155;

    font-size: 17px;

}


.profile-loading-card p {

    margin: 7px 0 0;

    color: #94a3b8;

    font-size: 13px;

}


/* =====================================================
   ERROR
===================================================== */

.profile-error-card {

    max-width: 600px;

    margin: 70px auto;

    padding: 35px 25px;

    text-align: center;

    background: #ffffff;

    border: 1px solid #fee2e2;

    border-radius: 15px;

    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.05);

}


.profile-error-icon {

    width: 42px;

    height: 42px;

    margin: 0 auto 15px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    background: #fef2f2;

    color: #dc2626;

    font-weight: 800;

}


.profile-error-card h3 {

    margin: 0;

    color: #334155;

    font-size: 18px;

}


.profile-error-card p {

    margin: 8px 0 20px;

    color: #64748b;

    font-size: 13px;

    overflow-wrap: anywhere;

}


/* =====================================================
   TABLET
===================================================== */

@media (max-width: 1000px) {

    .admin-jobseeker-profile-page {

        max-width: 100%;

        padding-left: 18px;

        padding-right: 18px;

    }


    .profile-hero-main {

        gap: 16px;

    }


    .profile-completion-box {

        flex-basis: 105px;

        width: 105px;

    }


    .profile-record-grid {

        grid-template-columns: 1fr;

    }

}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 700px) {

    .admin-jobseeker-profile-page {

        padding: 16px 12px 35px;

    }


    .profile-page-header {

        flex-direction: column;

        align-items: flex-start;

        gap: 12px;

    }


    .profile-page-header h1 {

        font-size: 23px;

    }


    .top-back-button {

        width: 100%;

    }


    .profile-hero-main {

        flex-wrap: wrap;

        align-items: flex-start;

        padding: 18px;

    }


    .profile-photo-frame {

        width: 76px;

        height: 76px;

    }


    .profile-hero-content {

        flex: 1 1 calc(100% - 100px);

    }


    .profile-name-row h2 {

        font-size: 19px;

    }


    .profile-completion-box {

        width: 100%;

        flex-basis: 100%;

        display: flex;

        align-items: center;

        gap: 12px;

        text-align: left;

        padding-top: 12px;

        border-top: 1px solid #edf1f5;

    }


    .profile-pie-chart {

        width: 72px;

        height: 72px;

        margin: 0;

        flex: 0 0 72px;

    }


    .profile-pie-chart::before {

        inset: 7px;

    }


    .profile-pie-inner strong {

        font-size: 16px;

    }


    .profile-completion-box > p {

        font-size: 12px;

    }


    .profile-info-grid {

        grid-template-columns: 1fr;

    }


    .profile-info-item.full-width {

        grid-column: auto;

    }


    .profile-card {

        padding: 17px;

        border-radius: 12px;

    }


    .profile-mini-grid {

        grid-template-columns: 1fr;

    }


    .verification-info-grid {

        grid-template-columns: 1fr;

    }


    .verification-item.full-width {

        grid-column: auto;

    }


    .document-row {

        align-items: flex-start;

        flex-wrap: wrap;

    }


    .document-content {

        flex: 1 1 calc(100% - 55px);

    }


    .document-action {

        width: 100%;

        margin-left: 51px;

    }


    .document-action a {

        width: 100%;

    }


    .profile-bottom-actions {

        padding-bottom: 20px;

    }


    .profile-back-button {

        width: 100%;

    }

}


/* =====================================================
   SMALL MOBILE
===================================================== */

@media (max-width: 420px) {

    .admin-jobseeker-profile-page {

        padding-left: 8px;

        padding-right: 8px;

    }


    .profile-hero-main {

        padding: 14px;

    }


    .profile-card {

        padding: 14px;

    }


    .profile-photo-frame {

        width: 65px;

        height: 65px;

    }


    .profile-hero-content {

        flex: 1 1 calc(100% - 85px);

    }


    .profile-name-row h2 {

        font-size: 17px;

    }


    .profile-headline {

        font-size: 12px;

    }


    .profile-quick-info {

        flex-direction: column;

        gap: 4px;

    }


    .profile-card-header h2 {

        font-size: 16px;

    }


    .profile-card-header p {

        font-size: 11px;

    }


    .profile-section-icon {

        width: 34px;

        height: 34px;

        flex-basis: 34px;

    }

}

`;

export default AdminJobSeekerProfile;