import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

function ApplicantProfile() {

    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");


    // =========================================================
    // LOAD APPLICANT PROFILE
    // =========================================================

    useEffect(() => {

        if (applicationId) {
            fetchApplicantProfile();
        }

    }, [applicationId]);


    async function fetchApplicantProfile() {

        setLoading(true);
        setError("");

        const token = localStorage.getItem("jc_token");

        if (!token) {

            setError(
                "Please log in as an employer."
            );

            setLoading(false);

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/auth/employer/applications/${applicationId}/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },
                }
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "APPLICANT PROFILE:",
                data
            );


            if (!response.ok) {

                if (response.status === 401) {

                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }


                if (response.status === 404) {

                    throw new Error(
                        data.message ||
                        "Applicant profile was not found."
                    );
                }


                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load candidate profile."
                );
            }


            setApplication(data);

        }
        catch (err) {

            console.error(
                "APPLICANT PROFILE ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load candidate profile."
            );

        }
        finally {

            setLoading(false);
        }
    }


    // =========================================================
    // FILE URL
    // =========================================================

    function getFileUrl(file) {

        if (!file) {
            return "";
        }


        if (
            typeof file === "string" &&
            (
                file.startsWith("http://") ||
                file.startsWith("https://")
            )
        ) {
            return file;
        }


        if (
            typeof file === "string"
        ) {

            if (file.startsWith("/")) {
                return `${BACKEND_ORIGIN}${file}`;
            }

            return `${BACKEND_ORIGIN}/${file}`;
        }


        return "";
    }


    // =========================================================
    // NORMALIZE STATUS
    // =========================================================

    function normalizeStatus(status) {

        if (!status) {
            return "APPLIED";
        }


        return status
            .toString()
            .trim()
            .toUpperCase();
    }


    // =========================================================
    // STATUS LABEL
    // =========================================================

    function getStatusLabel(status) {

        const normalized =
            normalizeStatus(status);


        switch (normalized) {

            case "APPLIED":
                return "Applied";

            case "UNDER REVIEW":
                return "Under Review";

            case "SHORTLISTED":
                return "Shortlisted";

            case "INTERVIEW SCHEDULED":
                return "Interview Scheduled";

            case "REJECTED":
                return "Rejected";

            case "HIRED":
                return "Hired";

            default:
                return "Applied";
        }
    }


    // =========================================================
    // STATUS CLASS
    // =========================================================

    function getStatusClass(status) {

        const normalized =
            normalizeStatus(status);


        switch (normalized) {

            case "APPLIED":
                return "profile-status applied";

            case "UNDER REVIEW":
                return "profile-status under-review";

            case "SHORTLISTED":
                return "profile-status shortlisted";

            case "INTERVIEW SCHEDULED":
                return "profile-status interview-scheduled";

            case "REJECTED":
                return "profile-status rejected";

            case "HIRED":
                return "profile-status hired";

            default:
                return "profile-status";
        }
    }


    // =========================================================
    // UPDATE STATUS
    // =========================================================

    async function updateApplicationStatus(
        newStatus
    ) {

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            alert(
                "Please log in as an employer."
            );

            return;
        }


        if (updatingStatus) {
            return;
        }


        const currentStatus =
            normalizeStatus(
                application?.application?.status
            );


        const requestedStatus =
            normalizeStatus(newStatus);


        // =====================================================
        // FINAL STATUS
        // =====================================================

        if (
            currentStatus === "HIRED" ||
            currentStatus === "REJECTED"
        ) {

            alert(
                "This application is already finalized."
            );

            return;
        }


        // =====================================================
        // PREVENT SAME STATUS
        // =====================================================

        if (
            currentStatus === requestedStatus
        ) {

            return;
        }


        console.log(
            "CURRENT STATUS:",
            currentStatus
        );

        console.log(
            "NEW STATUS:",
            requestedStatus
        );


        setUpdatingStatus(true);
        setStatusMessage("");


        try {

            const response = await fetch(
                `${API_BASE}/auth/employer/applications/${applicationId}/status/`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        status:
                            requestedStatus,
                    }),
                }
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "STATUS UPDATE RESPONSE:",
                response.status,
                data
            );


            if (!response.ok) {

                if (
                    response.status === 401
                ) {

                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }


                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to update application status."
                );
            }


            // =================================================
            // UPDATE LOCAL APPLICATION DATA
            // =================================================

            setApplication(
                previous => {

                    if (!previous) {
                        return previous;
                    }


                    return {
                        ...previous,

                        application: {
                            ...previous.application,

                            status:
                                data.status ||
                                requestedStatus,
                        },
                    };
                }
            );


            setStatusMessage(
                `Application status changed to ${getStatusLabel(
                    data.status ||
                    requestedStatus
                )}.`
            );

        }
        catch (err) {

            console.error(
                "STATUS UPDATE ERROR:",
                err
            );


            alert(
                err.message ||
                "Unable to update application status."
            );

        }
        finally {

            setUpdatingStatus(false);
        }
    }


    // =========================================================
    // STATUS BUTTON DISABLED LOGIC
    // =========================================================

    function isStatusButtonDisabled(
        buttonStatus
    ) {

        const currentStatus =
            normalizeStatus(
                application?.application?.status
            );


        const targetStatus =
            normalizeStatus(
                buttonStatus
            );


        // -----------------------------------------------------
        // While updating
        // -----------------------------------------------------

        if (updatingStatus) {
            return true;
        }


        // -----------------------------------------------------
        // Final statuses
        // -----------------------------------------------------

        if (
            currentStatus === "HIRED" ||
            currentStatus === "REJECTED"
        ) {

            return true;
        }


        // -----------------------------------------------------
        // APPLIED
        // -----------------------------------------------------

        if (
            currentStatus === "APPLIED"
        ) {

            return (
                targetStatus !==
                "UNDER REVIEW"
            );
        }


        // -----------------------------------------------------
        // UNDER REVIEW
        // -----------------------------------------------------

        if (
            currentStatus ===
            "UNDER REVIEW"
        ) {

            return (
                targetStatus !==
                "SHORTLISTED"
            );
        }


        // -----------------------------------------------------
        // SHORTLISTED
        // -----------------------------------------------------

        if (
            currentStatus ===
            "SHORTLISTED"
        ) {

            return (
                targetStatus !==
                "INTERVIEW SCHEDULED"
            );
        }


        // -----------------------------------------------------
        // INTERVIEW SCHEDULED
        // -----------------------------------------------------

        if (
            currentStatus ===
            "INTERVIEW SCHEDULED"
        ) {

            return !(
                targetStatus === "HIRED" ||
                targetStatus === "REJECTED"
            );
        }


        return false;
    }


    // =========================================================
    // STATUS BUTTON CLASS
    // =========================================================

    function getStatusButtonClass(
        buttonStatus
    ) {

        const currentStatus =
            normalizeStatus(
                application?.application?.status
            );


        const targetStatus =
            normalizeStatus(
                buttonStatus
            );


        let className =
            "application-status-button";


        if (
            targetStatus ===
            currentStatus
        ) {

            className += " current";
        }


        if (
            targetStatus ===
            "UNDER REVIEW"
        ) {

            className += " under-review-button";
        }


        if (
            targetStatus ===
            "SHORTLISTED"
        ) {

            className += " shortlist-button";
        }


        if (
            targetStatus ===
            "INTERVIEW SCHEDULED"
        ) {

            className +=
                " interview-button";
        }


        if (
            targetStatus ===
            "REJECTED"
        ) {

            className +=
                " reject-button";
        }


        if (
            targetStatus ===
            "HIRED"
        ) {

            className +=
                " hired-button";
        }


        return className;
    }


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="applicant-profile-page">

                <div className="applicant-profile-message">

                    Loading candidate profile...

                </div>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (

            <div className="applicant-profile-page">

                <div className="applicant-profile-message error">

                    {error}

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate(-1)
                    }
                    className="back-button"
                >
                    ← Back
                </button>

            </div>
        );
    }


    // =========================================================
    // DATA
    // =========================================================

    const candidate =
        application?.jobseeker ||
        {};


    const applicationData =
        application?.application ||
        {};


    const education =
        Array.isArray(
            application?.education
        )
            ? application.education
            : [];


    const experience =
        Array.isArray(
            application?.experience_details
        )
            ? application.experience_details
            : [];


    const projects =
        Array.isArray(
            application?.projects
        )
            ? application.projects
            : [];


    const currentStatus =
        normalizeStatus(
            applicationData.status
        );


    // =========================================================
    // INITIALS
    // =========================================================

    const initials =
        candidate.full_name
            ? candidate.full_name
                .split(" ")
                .filter(Boolean)
                .map(
                    name =>
                        name[0]
                )
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "--";


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="applicant-profile-page">

            <main className="applicant-profile-main">


                {/* =================================================
                    BACK
                ================================================= */}

                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    ← Back to Applicants
                </button>


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="candidate-profile-header">


                    <div className="candidate-profile-avatar">

                        {initials}

                    </div>


                    <div className="candidate-header-content">

                        <h1>
                            {
                                candidate.full_name ||
                                "Candidate"
                            }
                        </h1>


                        {candidate.headline && (

                            <p className="candidate-headline">

                                {
                                    candidate.headline
                                }

                            </p>
                        )}


                        {candidate.location && (

                            <span className="candidate-location">

                                📍{" "}
                                {
                                    candidate.location
                                }

                            </span>
                        )}

                    </div>


                    <div className="candidate-header-status">

                        <span
                            className={getStatusClass(
                                currentStatus
                            )}
                        >

                            {getStatusLabel(
                                currentStatus
                            )}

                        </span>

                    </div>

                </section>


                {/* =================================================
                    STATUS ACTIONS
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Application Status
                    </h2>


                    <div className="application-status-actions">


                        {/* UNDER REVIEW */}

                        <button
                            type="button"
                            className={getStatusButtonClass(
                                "UNDER REVIEW"
                            )}
                            disabled={isStatusButtonDisabled(
                                "UNDER REVIEW"
                            )}
                            onClick={() =>
                                updateApplicationStatus(
                                    "UNDER REVIEW"
                                )
                            }
                        >

                            {currentStatus ===
                                "UNDER REVIEW"
                                ? "✓ Under Review"
                                : "Under Review"}

                        </button>


                        {/* SHORTLISTED */}

                        <button
                            type="button"
                            className={getStatusButtonClass(
                                "SHORTLISTED"
                            )}
                            disabled={isStatusButtonDisabled(
                                "SHORTLISTED"
                            )}
                            onClick={() =>
                                updateApplicationStatus(
                                    "SHORTLISTED"
                                )
                            }
                        >

                            {currentStatus ===
                                "SHORTLISTED"
                                ? "✓ Shortlisted"
                                : "Shortlist"}

                        </button>


                        {/* INTERVIEW SCHEDULED */}

                        <button
                            type="button"
                            className={getStatusButtonClass(
                                "INTERVIEW SCHEDULED"
                            )}
                            disabled={isStatusButtonDisabled(
                                "INTERVIEW SCHEDULED"
                            )}
                            onClick={() =>
                                updateApplicationStatus(
                                    "INTERVIEW SCHEDULED"
                                )
                            }
                        >

                            {currentStatus ===
                                "INTERVIEW SCHEDULED"
                                ? "✓ Interview Scheduled"
                                : "Interview Scheduled"}

                        </button>


                        {/* REJECT */}

                        <button
                            type="button"
                            className={getStatusButtonClass(
                                "REJECTED"
                            )}
                            disabled={isStatusButtonDisabled(
                                "REJECTED"
                            )}
                            onClick={() =>
                                updateApplicationStatus(
                                    "REJECTED"
                                )
                            }
                        >

                            {currentStatus ===
                                "REJECTED"
                                ? "✓ Rejected"
                                : "Reject"}

                        </button>


                        {/* HIRED */}

                        <button
                            type="button"
                            className={getStatusButtonClass(
                                "HIRED"
                            )}
                            disabled={isStatusButtonDisabled(
                                "HIRED"
                            )}
                            onClick={() =>
                                updateApplicationStatus(
                                    "HIRED"
                                )
                            }
                        >

                            {currentStatus ===
                                "HIRED"
                                ? "✓ Hired"
                                : "Hire"}

                        </button>

                    </div>


                    {statusMessage && (

                        <p className="status-success-message">

                            {statusMessage}

                        </p>
                    )}

                </section>


                {/* =================================================
                    APPLICATION INFORMATION
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Application Information
                    </h2>


                    <div className="candidate-info-grid">


                        <div>

                            <label>
                                Applied For
                            </label>

                            <strong>
                                {
                                    applicationData.job_title ||
                                    "Job"
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Application Status
                            </label>

                            <strong>
                                {
                                    getStatusLabel(
                                        currentStatus
                                    )
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Applied On
                            </label>

                            <strong>

                                {
                                    applicationData.applied_at
                                        ? new Date(
                                            applicationData.applied_at
                                        ).toLocaleDateString(
                                            "en-IN",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )
                                        : "Recently"
                                }

                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PERSONAL INFORMATION
                    QUALIFICATION REMOVED
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Personal Information
                    </h2>


                    <div className="candidate-info-grid">


                        <div>

                            <label>
                                Full Name
                            </label>

                            <strong>
                                {
                                    candidate.full_name ||
                                    "Not provided"
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Email
                            </label>

                            <strong>
                                {
                                    candidate.email ||
                                    "Not provided"
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Phone
                            </label>

                            <strong>
                                {
                                    candidate.phone ||
                                    "Not provided"
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Location
                            </label>

                            <strong>
                                {
                                    candidate.location ||
                                    "Not provided"
                                }
                            </strong>

                        </div>


                        <div>

                            <label>
                                Skills
                            </label>

                            <strong>
                                {
                                    candidate.skills ||
                                    "Not provided"
                                }
                            </strong>

                        </div>


                        {candidate.linkedin && (

                            <div>

                                <label>
                                    LinkedIn
                                </label>

                                <strong>

                                    <a
                                        href={
                                            candidate.linkedin
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View LinkedIn Profile
                                    </a>

                                </strong>

                            </div>
                        )}

                    </div>

                </section>


                {/* =================================================
                    EXPERIENCE
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Professional Experience
                    </h2>


                    {experience.length > 0 ? (

                        experience.map(
                            (item, index) => (

                                <div
                                    className="candidate-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >

                                    <h3>
                                        {
                                            item.job_title ||
                                            item.title ||
                                            "Experience"
                                        }
                                    </h3>


                                    {item.company && (

                                        <p>
                                            {
                                                item.company
                                            }
                                        </p>
                                    )}


                                    {item.description && (

                                        <p>
                                            {
                                                item.description
                                            }
                                        </p>
                                    )}


                                    {(item.start_date ||
                                        item.end_date ||
                                        item.currently_working) && (

                                            <span>

                                                {
                                                    item.start_date ||
                                                    ""
                                                }

                                                {" - "}

                                                {
                                                    item.currently_working
                                                        ? "Present"
                                                        : item.end_date ||
                                                        ""
                                                }

                                            </span>
                                        )}

                                </div>

                            )
                        )

                    ) : (

                        <p className="empty-text">
                            No experience details provided.
                        </p>
                    )}

                </section>


                {/* =================================================
                    EDUCATION
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Education
                    </h2>

                    {Array.isArray(education) && education.length > 0 ? (

                        education.map((item, index) => (

                            <div
                                className="candidate-item"
                                key={item.id || index}
                            >

                                <h3>
                                    {item.degree || "Education"}
                                </h3>

                                {item.college && (

                                    <p>
                                        <strong>
                                            College:
                                        </strong>{" "}
                                        {item.college}
                                    </p>

                                )}

                                {item.university && (

                                    <p>
                                        <strong>
                                            University:
                                        </strong>{" "}
                                        {item.university}
                                    </p>

                                )}

                                {(item.start_year || item.end_year) && (

                                    <p>

                                        <strong>
                                            Duration:
                                        </strong>{" "}

                                        {item.start_year || ""}

                                        {" - "}

                                        {item.end_year || ""}

                                    </p>

                                )}

                                {item.passing_month_year && (

                                    <p>

                                        <strong>
                                            Passing:
                                        </strong>{" "}

                                        {item.passing_month_year}

                                    </p>

                                )}

                                {item.percentage_cgpa && (

                                    <p>

                                        <strong>
                                            Percentage / CGPA:
                                        </strong>{" "}

                                        {item.percentage_cgpa}

                                    </p>

                                )}

                                {item.activities && (

                                    <p>

                                        <strong>
                                            Activities:
                                        </strong>{" "}

                                        {item.activities}

                                    </p>

                                )}

                            </div>

                        ))

                    ) : (

                        <p className="empty-text">
                            No education details provided.
                        </p>

                    )}

                </section>


                {/* =================================================
                    PROJECTS
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Projects
                    </h2>

                    {projects.length > 0 ? (

                        projects.map((project, index) => (

                            <div
                                className="candidate-item"
                                key={project.id || index}
                            >

                                <h3>
                                    {project.title ||
                                        project.name ||
                                        "Project"}
                                </h3>

                                {project.description && (
                                    <p>
                                        {project.description}
                                    </p>
                                )}

                                {project.technologies && (
                                    <p>
                                        <strong>
                                            Technologies:
                                        </strong>{" "}
                                        {project.technologies}
                                    </p>
                                )}


                                {project.project_url && (
                                    <p>
                                        <strong>
                                            Project URL:
                                        </strong>{" "}

                                        <a
                                            href={project.project_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View Project
                                        </a>
                                    </p>
                                )}

                            </div>

                        ))

                    ) : (

                        <p className="empty-text">
                            No projects provided.
                        </p>

                    )}

                </section>


                {/* =================================================
                    DOCUMENTS
                ================================================= */}

                <section className="candidate-section">

                    <h2>
                        Uploaded Documents
                    </h2>


                    <div className="documents-grid">


                        {/* RESUME */}

                        <div className="document-card">

                            <h3>
                                Resume
                            </h3>


                            {candidate.resume ? (

                                <a
                                    href={getFileUrl(
                                        candidate.resume
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-button"
                                >
                                    📄 View Resume
                                </a>

                            ) : (

                                <p>
                                    Resume not uploaded
                                </p>
                            )}

                        </div>


                        {/* AADHAAR */}

                        <div className="document-card">

                            <h3>
                                Aadhaar
                            </h3>


                            {candidate.aadhaar ? (

                                <a
                                    href={getFileUrl(
                                        candidate.aadhaar
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-button"
                                >
                                    📄 View Aadhaar
                                </a>

                            ) : (

                                <p>
                                    Aadhaar not uploaded
                                </p>
                            )}

                        </div>


                        {/* PROFILE PHOTO */}

                        <div className="document-card">

                            <h3>
                                Profile Photo
                            </h3>


                            {candidate.profile_photo ? (

                                <a
                                    href={getFileUrl(
                                        candidate.profile_photo
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-button"
                                >
                                    🖼 View Photo
                                </a>

                            ) : (

                                <p>
                                    Profile photo not uploaded
                                </p>
                            )}

                        </div>

                    </div>

                </section>


            </main>

        </div>
    );
}


export default ApplicantProfile;