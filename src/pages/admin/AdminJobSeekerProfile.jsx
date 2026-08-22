import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
    useLocation
} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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


            // IMPORTANT:
            // Look specifically at education and project data
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
    // HELPERS
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


        return `http://localhost:8000${file}`;
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
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="admin-dashboard">

                <main className="admin-main">

                    <section className="verification-queue-card">

                        <div className="admin-empty-state">

                            Loading job seeker profile...

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

                    <section className="verification-queue-card">

                        <div className="verification-empty verification-error">

                            {error}

                        </div>


                        <button
                            type="button"
                            className="back-button"
                            onClick={handleBack}
                        >

                            {backButtonText}

                        </button>

                    </section>

                </main>

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

                    <section className="verification-queue-card">

                        <div className="verification-empty">

                            Job seeker profile not found.

                        </div>


                        <button
                            type="button"
                            className="back-button"
                            onClick={handleBack}
                        >

                            {backButtonText}

                        </button>

                    </section>

                </main>

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
    // PAGE
    // =====================================================

    return (

        <div className="admin-dashboard">

            <main className="admin-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="verification-queue-header">

                    <h1>
                        Job Seeker Profile
                    </h1>


                    <p>
                        Review submitted profile details
                        before verification.
                    </p>

                </section>


                {/* =================================================
                    PROFILE HEADER
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="admin-profile-header">


                        {/* PROFILE PHOTO */}

                        <div className="admin-profile-photo passport-photo">

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


                        {/* NAME */}

                        <div className="admin-profile-heading">

                            <h2>
                                {displayValue(
                                    profile.full_name
                                )}
                            </h2>


                            <p>
                                {displayValue(
                                    profile.headline
                                )}
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Personal Information
                        </h2>


                        <div className="admin-profile-grid">


                            {/* FULL NAME */}

                            <div className="profile-field">

                                <label>
                                    Full Name
                                </label>

                                <p>
                                    {displayValue(
                                        profile.full_name
                                    )}
                                </p>

                            </div>


                            {/* EMAIL */}

                            <div className="profile-field">

                                <label>
                                    Email
                                </label>

                                <p>
                                    {displayValue(
                                        profile.email
                                    )}
                                </p>

                            </div>


                            {/* PHONE */}

                            <div className="profile-field">

                                <label>
                                    Phone
                                </label>

                                <p>
                                    {displayValue(
                                        profile.phone
                                    )}
                                </p>

                            </div>


                            {/* LOCATION */}

                            <div className="profile-field">

                                <label>
                                    Location
                                </label>

                                <p>
                                    {displayValue(
                                        profile.location
                                    )}
                                </p>

                            </div>


                            {/* HEADLINE */}

                            <div className="profile-field profile-field-full">

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

                    </div>

                </section>


                {/* =================================================
                    PROFESSIONAL INFORMATION
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Professional Information
                        </h2>


                        <div className="admin-profile-grid">

                            <div className="profile-field profile-field-full">

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

                                        <span>
                                            Not provided
                                        </span>

                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    EDUCATION
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Education
                        </h2>


                        {profile.educations &&
                            profile.educations.length > 0 ? (

                            <div className="admin-education-list">

                                {profile.educations.map(
                                    (education) => (

                                        <div
                                            key={education.id}
                                            className="admin-education-card"
                                        >

                                            {/* DEGREE */}

                                            <h3>
                                                {displayValue(
                                                    education.degree
                                                )}
                                            </h3>


                                            {/* UNIVERSITY */}

                                            <p>
                                                <strong>
                                                    University
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    education.university
                                                )}
                                            </p>


                                            {/* COLLEGE */}

                                            <p>
                                                <strong>
                                                    College
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    education.college
                                                )}
                                            </p>


                                            

                                            {/* PASSING MONTH & YEAR */}

                                            <p>
                                                <strong>
                                                    Passing Month & Year
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    education.passing_month_year
                                                )}
                                            </p>


                                            {/* PERCENTAGE / CGPA */}

                                            <p>
                                                <strong>
                                                    Percentage / CGPA
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    education.percentage_cgpa
                                                )}
                                            </p>


                                            

                                        </div>

                                    )
                                )}

                            </div>

                        ) : (

                            <p>
                                Not provided
                            </p>

                        )}

                    </div>

                </section>


                {/* =================================================
                    EXPERIENCE
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Experience
                        </h2>


                        {profile.experiences &&
                            profile.experiences.length > 0 ? (

                            <div className="admin-experience-list">

                                {profile.experiences.map(
                                    (experience) => (

                                        <div
                                            key={experience.id}
                                            className="admin-experience-card"
                                        >

                                            {/* JOB TITLE */}

                                            <h3>
                                                {displayValue(
                                                    experience.job_title
                                                )}
                                            </h3>


                                            {/* COMPANY */}

                                            <p>
                                                <strong>
                                                    Company
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    experience.company
                                                )}
                                            </p>


                                            {/* EMPLOYMENT TYPE */}

                                            <p>
                                                <strong>
                                                    Employment Type
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    experience.employment_type
                                                )}
                                            </p>


                                            {/* START DATE */}

                                            <p>
                                                <strong>
                                                    Start Date
                                                </strong>
                                            </p>

                                            <p>
                                                {formatDate(
                                                    experience.start_date
                                                )}
                                            </p>


                                            {/* END DATE */}

                                            <p>
                                                <strong>
                                                    End Date
                                                </strong>
                                            </p>

                                            <p>
                                                {experience.is_current
                                                    ? "Present"
                                                    : formatDate(
                                                        experience.end_date
                                                    )
                                                }
                                            </p>


                                            {/* DESCRIPTION */}

                                            <p>
                                                <strong>
                                                    Description
                                                </strong>
                                            </p>

                                            <p>
                                                {displayValue(
                                                    experience.description
                                                )}
                                            </p>

                                        </div>

                                    )
                                )}

                            </div>

                        ) : (

                            <p>
                                Not provided
                            </p>

                        )}

                    </div>

                </section>


                {/* =================================================
                    PROJECTS
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Projects
                        </h2>


                        {profile.projects &&
                            profile.projects.length > 0 ? (

                            <div className="admin-project-list">

                                {profile.projects.map(
                                    (project) => {

                                        /*
                                         * IMPORTANT:
                                         *
                                         * Your Project form uses:
                                         *     title
                                         *     project_type
                                         *     technologies
                                         *     project_url
                                         *     description
                                         *
                                         * But your previous API response
                                         * showed "name".
                                         *
                                         * Therefore support BOTH.
                                         */

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
                                                className="admin-project-card"
                                            >

                                                {/* PROJECT TITLE */}

                                                <h3>
                                                    {displayValue(
                                                        projectTitle
                                                    )}
                                                </h3>


                                                {/* PROJECT TYPE */}

                                                <p>
                                                    <strong>
                                                        Project Type
                                                    </strong>
                                                </p>

                                                <p>
                                                    {displayValue(
                                                        project.project_type
                                                    )}
                                                </p>


                                                {/* TECHNOLOGIES */}

                                                <p>
                                                    <strong>
                                                        Technologies
                                                    </strong>
                                                </p>

                                                <p>
                                                    {displayValue(
                                                        project.technologies
                                                    )}
                                                </p>


                                                {/* PROJECT URL */}

                                                <p>
                                                    <strong>
                                                        Project URL
                                                    </strong>
                                                </p>


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


                                                {/* DESCRIPTION */}

                                                <p>
                                                    <strong>
                                                        Description
                                                    </strong>
                                                </p>

                                                <p>
                                                    {displayValue(
                                                        project.description
                                                    )}
                                                </p>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        ) : (

                            <p>
                                Not provided
                            </p>

                        )}

                    </div>

                </section>


                {/* =================================================
                    PROFESSIONAL LINKS
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Professional Links
                        </h2>


                        <div className="admin-profile-grid">

                            <div className="profile-field">

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
                                    >

                                        View LinkedIn Profile

                                    </a>

                                ) : (

                                    <p>
                                        Not provided
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    UPLOADED DOCUMENTS
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Uploaded Documents
                        </h2>


                        {/* AADHAAR */}

                        <div className="document-row">

                            <div>

                                <strong>
                                    Aadhaar Card
                                </strong>

                                <p>
                                    Government ID document
                                </p>


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

                            <div>

                                <strong>
                                    Resume
                                </strong>

                                <p>
                                    Submitted resume
                                </p>


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

                            <div>

                                <strong>
                                    Profile Photo
                                </strong>

                                <p>
                                    Submitted profile image
                                </p>


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
                    DO NOT CHANGE
                ================================================= */}

                <section className="verification-queue-card">

                    <div className="profile-section">

                        <h2>
                            Verification Information
                        </h2>


                        <div className="admin-profile-grid">


                            {/* STATUS */}

                            <div className="profile-field">

                                <label>
                                    Status
                                </label>

                                <p>
                                    {formatApprovalStatus(
                                        profile.approval_status
                                    )}
                                </p>

                            </div>


                            {/* PROFILE COMPLETED */}

                            <div className="profile-field">

                                <label>
                                    Profile Completed
                                </label>

                                <p>
                                    {profile.profile_completed
                                        ? "Yes"
                                        : "No"
                                    }
                                </p>

                            </div>


                            {/* SUBMITTED */}

                            <div className="profile-field">

                                <label>
                                    Submitted
                                </label>

                                <p>
                                    {formatDate(
                                        profile.created_at
                                    )}
                                </p>

                            </div>


                            {/* LAST UPDATED */}

                            <div className="profile-field">

                                <label>
                                    Last Updated
                                </label>

                                <p>
                                    {formatDate(
                                        profile.updated_at
                                    )}
                                </p>

                            </div>


                            {/* REJECTION REASON */}

                            {profile.rejection_reason && (

                                <div className="profile-field profile-field-full">

                                    <label>
                                        Rejection Reason
                                    </label>

                                    <p>
                                        {profile.rejection_reason}
                                    </p>

                                </div>

                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    BOTTOM ACTION
                ================================================= */}

                <section className="admin-profile-actions">

                    <button
                        type="button"
                        className="back-button"
                        onClick={handleBack}
                    >

                        {backButtonText}

                    </button>

                </section>


            </main>

        </div>

    );
}

export default AdminJobSeekerProfile;