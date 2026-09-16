
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const EMPLOYER_API = `${API_BASE}/auth/employer`;


/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}


/* =========================================================
   CLEAR AUTH
========================================================= */

function clearAuth() {
    const keys = [
        "jc_token",
        "refresh_token",
        "jc_user",
        "user",
        "access_token",
        "access",
        "token",
        "accessToken",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text,
        };
    }
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(data, fallback) {
    if (!data) {
        return fallback;
    }

    if (typeof data === "string") {
        return data;
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.message) {
        return data.message;
    }

    if (data.error) {
        return data.error;
    }

    return fallback;
}


/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
    switch (
        String(status || "")
            .trim()
            .toUpperCase()
    ) {
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
            return status || "Applied";
    }
}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
    switch (
        String(status || "")
            .trim()
            .toUpperCase()
    ) {
        case "APPLIED":
            return "status-applied";

        case "UNDER REVIEW":
            return "status-review";

        case "SHORTLISTED":
            return "status-shortlisted";

        case "INTERVIEW SCHEDULED":
            return "status-interview";

        case "REJECTED":
            return "status-rejected";

        case "HIRED":
            return "status-hired";

        default:
            return "status-default";
    }
}


/* =========================================================
   COMPONENT
========================================================= */

function ApplicantProfile() {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [actionMessage, setActionMessage] = useState("");

    const [hiringResult, setHiringResult] = useState(null);


    /* =====================================================
       LOAD APPLICANT
    ===================================================== */

    async function loadApplicant() {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            if (!applicationId) {
                setError("Application ID is missing.");
                return;
            }

            const url =
                `${EMPLOYER_API}/applications/${applicationId}/`;

            console.log(
                "APPLICANT PROFILE URL:",
                url
            );

            const response = await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },
                }
            );

            const result =
                await parseResponse(response);

            console.log(
                "APPLICANT PROFILE STATUS:",
                response.status
            );

            console.log(
                "APPLICANT PROFILE RESPONSE:",
                result
            );


            /* =============================================
               UNAUTHORIZED
            ============================================= */

            if (response.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }


            /* =============================================
               FORBIDDEN
            ============================================= */

            if (response.status === 403) {
                setError(
                    getErrorMessage(
                        result,
                        "You are not allowed to view this applicant."
                    )
                );

                return;
            }


            /* =============================================
               NOT FOUND
            ============================================= */

            if (response.status === 404) {
                setError(
                    getErrorMessage(
                        result,
                        "Application not found."
                    )
                );

                return;
            }


            /* =============================================
               OTHER ERROR
            ============================================= */

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Failed to load applicant."
                    )
                );
            }


            /* =============================================
               SUCCESS
            ============================================= */

            setData(result);

        } catch (err) {
            console.error(
                "Applicant loading error:",
                err
            );

            setError(
                err.message ||
                "Unable to load applicant."
            );

        } finally {
            setLoading(false);
        }
    }


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadApplicant();
    }, [applicationId]);


    /* =====================================================
       UPDATE APPLICATION STATUS
    ===================================================== */

    async function updateStatus(newStatus) {
        const normalizedStatus =
            String(newStatus || "")
                .trim()
                .toUpperCase();

        if (!normalizedStatus) {
            return;
        }


        /* =================================================
           DO NOT ALLOW STATUS CHANGES AFTER FINAL STATUS
        ================================================= */

        const currentStatus =
            String(
                data?.application?.status || ""
            )
                .trim()
                .toUpperCase();

        if (
            currentStatus === "HIRED" ||
            currentStatus === "REJECTED"
        ) {
            alert(
                `This application is already ${currentStatus}. Its status cannot be changed.`
            );

            return;
        }


        const token = getToken();

        if (!token) {
            clearAuth();

            navigate("/login", {
                replace: true,
            });

            return;
        }


        try {
            setUpdatingStatus(true);
            setActionMessage("");
            setHiringResult(null);


            /* =============================================
               HIRING CONFIRMATION
            ============================================= */

            if (normalizedStatus === "HIRED") {
                const confirmed = window.confirm(
                    "Are you sure you want to hire this applicant?\n\n" +
                    "After hiring:\n" +
                    "• Other applications with your company will be rejected automatically.\n" +
                    "• Applications with other companies will remain unchanged.\n" +
                    "• The jobseeker will receive hiring and profile-update notifications.\n" +
                    "• Other employers and admins will be notified."
                );

                if (!confirmed) {
                    setUpdatingStatus(false);
                    return;
                }
            }


            /* =============================================
               PATCH STATUS
            ============================================= */

            const url =
                `${EMPLOYER_API}/applications/${applicationId}/status/`;

            console.log(
                "UPDATING APPLICATION:",
                {
                    applicationId,
                    status: normalizedStatus,
                    url,
                }
            );

            const response = await fetch(
                url,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body: JSON.stringify({
                        status: normalizedStatus,
                    }),
                }
            );

            const result =
                await parseResponse(response);

            console.log(
                "STATUS UPDATE RESPONSE:",
                response.status,
                result
            );


            /* =============================================
               UNAUTHORIZED
            ============================================= */

            if (response.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }


            /* =============================================
               FORBIDDEN
            ============================================= */

            if (response.status === 403) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "You are not allowed to update this application."
                    )
                );
            }


            /* =============================================
               ALREADY HIRED
            ============================================= */

            if (response.status === 409) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "This jobseeker has already been hired by another company."
                    )
                );
            }


            /* =============================================
               OTHER ERROR
            ============================================= */

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Unable to update application status."
                    )
                );
            }


            /* =============================================
               HIRING RESULT
            ============================================= */

            if (normalizedStatus === "HIRED") {

                setHiringResult(result);

                setActionMessage(
                    "Application hired successfully."
                );

            } else {

                setActionMessage(
                    `Application status changed to ${getStatusLabel(
                        normalizedStatus
                    )}.`
                );
            }


            /* =============================================
               IMPORTANT
               
               RELOAD FROM DATABASE.
               
               This ensures that the UI gets the real
               status after backend hiring workflow.
            ============================================= */

            await loadApplicant();

        } catch (err) {
            console.error(
                "Status update error:",
                err
            );

            alert(
                err.message ||
                "Unable to update application status."
            );

        } finally {
            setUpdatingStatus(false);
        }
    }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div style={styles.center}>
                <div style={styles.spinner}></div>

                <p>
                    Loading applicant...
                </p>
            </div>
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <div style={styles.page}>

                <button
                    onClick={() => navigate(-1)}
                    style={styles.backButton}
                >
                    ← Back
                </button>

                <div style={styles.errorBox}>
                    {error}
                </div>

            </div>
        );
    }


    /* =====================================================
       DATA
    ===================================================== */

    const candidate =
        data?.jobseeker || {};

    const application =
        data?.application || {};

    const job =
        application?.job || {};


    /* =====================================================
       RELATED DATA
    ===================================================== */

    const educations =
        Array.isArray(candidate?.educations)
            ? candidate.educations
            : [];

    const experiences =
        Array.isArray(candidate?.experiences)
            ? candidate.experiences
            : [];

    const projects =
        Array.isArray(candidate?.projects)
            ? candidate.projects
            : [];


    /* =====================================================
       DOCUMENT URL
    ===================================================== */

    function getFileUrl(file) {

        if (!file) {
            return null;
        }

        if (
            typeof file === "string" &&
            file.startsWith("http")
        ) {
            return file;
        }

        if (
            typeof file === "string"
        ) {
            return `${window.location.origin}${file}`;
        }

        return null;
    }


    const resumeUrl =
        getFileUrl(
            candidate.resume
        );

    const aadhaarUrl =
        getFileUrl(
            candidate.aadhaar
        );

    const disabilityCertificateUrl =
        getFileUrl(
            candidate.disability_certificate
        );

    const profilePhotoUrl =
        getFileUrl(
            candidate.profile_photo
        );


    /* =====================================================
       CURRENT STATUS
    ===================================================== */

    const currentStatus =
        String(
            application.status || "APPLIED"
        )
            .trim()
            .toUpperCase();

    const isFinalStatus =
        currentStatus === "HIRED" ||
        currentStatus === "REJECTED";


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div style={styles.page}>

            {/* =================================================
               HEADER
            ================================================= */}

            <div style={styles.header}>

                <button
                    onClick={() => navigate(-1)}
                    style={styles.backButton}
                >
                    ← Back
                </button>

                <div style={styles.headerInfo}>

                    <h1 style={styles.title}>
                        {candidate.full_name ||
                            "Applicant"}
                    </h1>

                    <p style={styles.subtitle}>
                        {candidate.headline ||
                            "Job Applicant"}
                    </p>

                </div>

                <span
                    className={getStatusClass(
                        currentStatus
                    )}
                    style={styles.status}
                >
                    {getStatusLabel(
                        currentStatus
                    )}
                </span>

            </div>


            {/* =================================================
               SUCCESS MESSAGE
            ================================================= */}

            {actionMessage && (
                <div style={styles.successBox}>
                    {actionMessage}
                </div>
            )}


            {/* =================================================
               HIRING RESULT
            ================================================= */}

            {hiringResult && (
                <section style={styles.hiringResultCard}>

                    <h2 style={styles.sectionTitle}>
                        Hiring Process Completed
                    </h2>

                    <div style={styles.resultGrid}>

                        <div style={styles.resultItem}>
                            <strong>
                                Hired Application
                            </strong>

                            <span>
                                #{hiringResult.application_id}
                            </span>
                        </div>

                        <div style={styles.resultItem}>
                            <strong>
                                Same Company Rejected
                            </strong>

                            <span>
                                {hiringResult.same_company_rejected ?? 0}
                            </span>
                        </div>

                        <div style={styles.resultItem}>
                            <strong>
                                Other Companies Notified
                            </strong>

                            <span>
                                {hiringResult.other_company_employers_notified ?? 0}
                            </span>
                        </div>

                        <div style={styles.resultItem}>
                            <strong>
                                Jobseeker Notification
                            </strong>

                            <span>
                                {hiringResult.jobseeker_hired_notification
                                    ? "Sent"
                                    : "Not sent"}
                            </span>
                        </div>

                        <div style={styles.resultItem}>
                            <strong>
                                Profile Update Notification
                            </strong>

                            <span>
                                {hiringResult.jobseeker_profile_update_notification
                                    ? "Sent"
                                    : "Not sent"}
                            </span>
                        </div>

                        <div style={styles.resultItem}>
                            <strong>
                                Admin Notification
                            </strong>

                            <span>
                                {hiringResult.admin_notified
                                    ? "Sent"
                                    : "Not sent"}
                            </span>
                        </div>

                    </div>

                </section>
            )}


            {/* =================================================
               PROFILE PHOTO
            ================================================= */}

            {profilePhotoUrl && (

                <section style={styles.card}>

                    <h2 style={styles.sectionTitle}>
                        Profile Photo
                    </h2>

                    <img
                        src={profilePhotoUrl}
                        alt="Applicant"
                        style={styles.profilePhoto}
                    />

                </section>
            )}


            {/* =================================================
               APPLICATION INFORMATION
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Application Information
                </h2>

                <Info
                    label="Application ID"
                    value={
                        application.application_id ||
                        application.id ||
                        applicationId ||
                        "-"
                    }
                />

                <Info
                    label="Status"
                    value={getStatusLabel(
                        application.status
                    )}
                />

                <Info
                    label="Applied At"
                    value={
                        application.applied_at
                            ? new Date(
                                application.applied_at
                            ).toLocaleString()
                            : "-"
                    }
                />

                <Info
                    label="Job"
                    value={
                        job.title ||
                        "-"
                    }
                />

                <Info
                    label="Company"
                    value={
                        job.company_name ||
                        "-"
                    }
                />

            </section>


            {/* =================================================
               JOB DETAILS
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Job Details
                </h2>

                <Info
                    label="Job Title"
                    value={job.title}
                />

                <Info
                    label="Location"
                    value={job.location}
                />

                <Info
                    label="Job Type"
                    value={
                        job.job_type_display ||
                        job.job_type
                    }
                />

                <Info
                    label="Work Mode"
                    value={
                        job.work_mode_display ||
                        job.work_mode
                    }
                />

                <Info
                    label="Experience"
                    value={
                        job.experience_display ||
                        job.experience
                    }
                />

                <Info
                    label="Minimum Experience"
                    value={
                        job.minimum_experience
                    }
                />

                <Info
                    label="Maximum Experience"
                    value={
                        job.maximum_experience
                    }
                />

                <Info
                    label="Salary"
                    value={
                        job.salary_min != null ||
                        job.salary_max != null
                            ? `${job.salary_min ?? "-"} - ${job.salary_max ?? "-"}`
                            : "-"
                    }
                />

                <Info
                    label="Skills"
                    value={job.skills}
                />

                <Info
                    label="Education Details"
                    value={
                        job.education_details
                    }
                />

                <Info
                    label="Description"
                    value={
                        job.description
                    }
                />

                <Info
                    label="Roles & Responsibilities"
                    value={
                        job.roles_responsibilities
                    }
                />

                <Info
                    label="Key Features"
                    value={
                        job.key_features
                    }
                />

            </section>


            {/* =================================================
               CANDIDATE INFORMATION
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Candidate Information
                </h2>

                <Info
                    label="Full Name"
                    value={
                        candidate.full_name
                    }
                />

                <Info
                    label="Email"
                    value={
                        candidate.email
                    }
                />

                <Info
                    label="Phone"
                    value={
                        candidate.phone
                    }
                />

                <Info
                    label="Location"
                    value={
                        candidate.location
                    }
                />

                <Info
                    label="Headline"
                    value={
                        candidate.headline
                    }
                />

                <Info
                    label="Skills"
                    value={
                        candidate.skills
                    }
                />

                <Info
                    label="LinkedIn"
                    value={
                        candidate.linkedin
                    }
                    link
                />

            </section>


            {/* =================================================
               DISABILITY INFORMATION
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Accessibility Information
                </h2>

                <Info
                    label="Disability"
                    value={
                        candidate.disability
                            ? "Yes"
                            : "No"
                    }
                />

                {candidate.disability && (
                    <>
                        <Info
                            label="Category"
                            value={
                                candidate.disability_category
                            }
                        />

                        <Info
                            label="Type"
                            value={
                                candidate.disability_type
                            }
                        />

                        <Info
                            label="Percentage"
                            value={
                                candidate.disability_percentage != null
                                    ? `${candidate.disability_percentage}%`
                                    : "-"
                            }
                        />
                    </>
                )}

            </section>


            {/* =================================================
               EDUCATION
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Education
                </h2>

                {educations.length === 0 ? (

                    <p>
                        No education details available.
                    </p>

                ) : (

                    educations.map(
                        (item, index) => (

                            <div
                                key={
                                    item.id ||
                                    index
                                }
                                style={styles.item}
                            >

                                <h3>
                                    {item.degree ||
                                        "Education"}
                                </h3>

                                <Info
                                    label="University"
                                    value={
                                        item.university
                                    }
                                />

                                <Info
                                    label="College"
                                    value={
                                        item.college
                                    }
                                />

                                <Info
                                    label="Start Year"
                                    value={
                                        item.start_year
                                    }
                                />

                                <Info
                                    label="End Year"
                                    value={
                                        item.end_year
                                    }
                                />

                                <Info
                                    label="Passing Month / Year"
                                    value={
                                        item.passing_month_year
                                    }
                                />

                                <Info
                                    label="Percentage / CGPA"
                                    value={
                                        item.percentage_cgpa
                                    }
                                />

                                <Info
                                    label="Activities"
                                    value={
                                        item.activities
                                    }
                                />

                            </div>
                        )
                    )
                )}

            </section>


            {/* =================================================
               EXPERIENCE
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Experience
                </h2>

                {experiences.length === 0 ? (

                    <p>
                        No experience details available.
                    </p>

                ) : (

                    experiences.map(
                        (item, index) => (

                            <div
                                key={
                                    item.id ||
                                    index
                                }
                                style={styles.item}
                            >

                                <h3>
                                    {item.job_title ||
                                        "Experience"}
                                </h3>

                                <Info
                                    label="Company"
                                    value={
                                        item.company
                                    }
                                />

                                <Info
                                    label="Employment Type"
                                    value={
                                        item.employment_type
                                    }
                                />

                                <Info
                                    label="Start Date"
                                    value={
                                        item.start_date
                                    }
                                />

                                <Info
                                    label="End Date"
                                    value={
                                        item.is_current
                                            ? "Currently working"
                                            : item.end_date
                                    }
                                />

                                <Info
                                    label="Description"
                                    value={
                                        item.description
                                    }
                                />

                            </div>
                        )
                    )
                )}

            </section>


            {/* =================================================
               PROJECTS
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Projects
                </h2>

                {projects.length === 0 ? (

                    <p>
                        No project details available.
                    </p>

                ) : (

                    projects.map(
                        (item, index) => (

                            <div
                                key={
                                    item.id ||
                                    index
                                }
                                style={styles.item}
                            >

                                <h3>
                                    {item.title ||
                                        "Project"}
                                </h3>

                                <Info
                                    label="Project Type"
                                    value={
                                        item.project_type
                                    }
                                />

                                <Info
                                    label="Technologies"
                                    value={
                                        item.technologies
                                    }
                                />

                                <Info
                                    label="Description"
                                    value={
                                        item.description
                                    }
                                />

                                <Info
                                    label="Project Link"
                                    value={
                                        item.project_link
                                    }
                                    link
                                />

                            </div>
                        )
                    )
                )}

            </section>


            {/* =================================================
               DOCUMENTS
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Documents
                </h2>

                <DocumentLink
                    label="Resume"
                    url={resumeUrl}
                />

                <DocumentLink
                    label="Aadhaar"
                    url={aadhaarUrl}
                />

                <DocumentLink
                    label="Disability Certificate"
                    url={
                        disabilityCertificateUrl
                    }
                />

            </section>


            {/* =================================================
               PROFILE STATUS
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Profile Status
                </h2>

                <Info
                    label="Profile Completed"
                    value={
                        candidate.profile_completed
                            ? "Yes"
                            : "No"
                    }
                />

                <Info
                    label="Approval Status"
                    value={
                        candidate.approval_status
                    }
                />

                <Info
                    label="Rejection Reason"
                    value={
                        candidate.rejection_reason
                    }
                />

                <Info
                    label="Profile Created"
                    value={
                        candidate.created_at
                    }
                />

                <Info
                    label="Profile Updated"
                    value={
                        candidate.updated_at
                    }
                />

            </section>


            {/* =================================================
               STATUS ACTIONS
            ================================================= */}

            <section style={styles.card}>

                <h2 style={styles.sectionTitle}>
                    Application Status
                </h2>


                {isFinalStatus ? (

                    <div style={styles.finalStatusBox}>

                        <strong>
                            {currentStatus === "HIRED"
                                ? "🎉 This applicant has been hired."
                                : "This application has been rejected."}
                        </strong>

                        <p>
                            Final application statuses
                            cannot be changed.
                        </p>

                    </div>

                ) : (

                    <div style={styles.actions}>

                        <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() =>
                                updateStatus(
                                    "UNDER REVIEW"
                                )
                            }
                            style={{
                                ...styles.actionButton,
                                ...styles.reviewButton,
                            }}
                        >
                            Under Review
                        </button>


                        <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() =>
                                updateStatus(
                                    "SHORTLISTED"
                                )
                            }
                            style={{
                                ...styles.actionButton,
                                ...styles.shortlistButton,
                            }}
                        >
                            Shortlist
                        </button>


                        <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() =>
                                updateStatus(
                                    "INTERVIEW SCHEDULED"
                                )
                            }
                            style={{
                                ...styles.actionButton,
                                ...styles.interviewButton,
                            }}
                        >
                            Schedule Interview
                        </button>


                        <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() =>
                                updateStatus(
                                    "REJECTED"
                                )
                            }
                            style={{
                                ...styles.actionButton,
                                ...styles.rejectButton,
                            }}
                        >
                            Reject
                        </button>


                        <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() =>
                                updateStatus(
                                    "HIRED"
                                )
                            }
                            style={{
                                ...styles.actionButton,
                                ...styles.hireButton,
                            }}
                        >
                            {updatingStatus
                                ? "Processing..."
                                : "Hire"}
                        </button>

                    </div>
                )}

            </section>

        </div>
    );
}


/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
    label,
    value,
    link = false,
}) {

    const displayValue =
        value === null ||
        value === undefined ||
        value === ""
            ? "-"
            : String(value);

    return (
        <div style={styles.infoRow}>

            <strong style={styles.label}>
                {label}
            </strong>

            {link &&
            displayValue !== "-" ? (

                <a
                    href={displayValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    {displayValue}
                </a>

            ) : (

                <span
                    style={
                        styles.value
                    }
                >
                    {displayValue}
                </span>

            )}

        </div>
    );
}


/* =========================================================
   DOCUMENT LINK
========================================================= */

function DocumentLink({
    label,
    url,
}) {

    return (
        <div style={styles.infoRow}>

            <strong style={styles.label}>
                {label}
            </strong>

            {url ? (

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    View {label}
                </a>

            ) : (

                <span>
                    Not uploaded
                </span>

            )}

        </div>
    );
}


/* =========================================================
   STYLES
========================================================= */

const styles = {

    page: {
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "#f7f8fa",
        minHeight: "100vh",
        boxSizing: "border-box",
    },

    center: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
    },

    spinner: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "4px solid #ddd",
        borderTop: "4px solid #2563eb",
        animation:
            "spin 1s linear infinite",
    },

    header: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
    },

    headerInfo: {
        flex: 1,
    },

    backButton: {
        padding: "10px 16px",
        border: "1px solid #ddd",
        background: "#fff",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
    },

    title: {
        margin: 0,
        fontSize: "28px",
    },

    subtitle: {
        margin: "5px 0 0",
        color: "#666",
    },

    status: {
        padding: "8px 14px",
        borderRadius: "20px",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },

    card: {
        background: "#fff",
        padding: "25px",
        marginBottom: "20px",
        borderRadius: "12px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
    },

    hiringResultCard: {
        background: "#ecfdf5",
        border: "1px solid #86efac",
        padding: "25px",
        marginBottom: "20px",
        borderRadius: "12px",
    },

    resultGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
    },

    resultItem: {
        background: "#fff",
        borderRadius: "10px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        border: "1px solid #d1fae5",
    },

    sectionTitle: {
        marginTop: 0,
        marginBottom: "20px",
    },

    infoRow: {
        display: "grid",
        gridTemplateColumns:
            "240px 1fr",
        gap: "15px",
        padding: "10px 0",
        borderBottom:
            "1px solid #eee",
    },

    label: {
        color: "#555",
    },

    value: {
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },

    link: {
        color: "#1565c0",
        textDecoration: "none",
        wordBreak: "break-all",
    },

    item: {
        border: "1px solid #eee",
        padding: "18px",
        borderRadius: "10px",
        marginBottom: "15px",
    },

    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
    },

    actionButton: {
        border: "none",
        color: "#fff",
        padding: "11px 17px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },

    reviewButton: {
        background: "#2563eb",
    },

    shortlistButton: {
        background: "#7c3aed",
    },

    interviewButton: {
        background: "#0891b2",
    },

    rejectButton: {
        background: "#dc2626",
    },

    hireButton: {
        background: "#16a34a",
    },

    finalStatusBox: {
        padding: "18px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
    },

    successBox: {
        background: "#ecfdf5",
        color: "#166534",
        border:
            "1px solid #86efac",
        padding: "15px 18px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontWeight: "600",
    },

    errorBox: {
        padding: "20px",
        background: "#ffebee",
        color: "#c62828",
        borderRadius: "10px",
        marginTop: "20px",
    },

    profilePhoto: {
        width: "160px",
        height: "160px",
        objectFit: "cover",
        borderRadius: "10px",
        border: "1px solid #ddd",
    },
};


/* =========================================================
   EXPORT
========================================================= */

export default ApplicantProfile;

