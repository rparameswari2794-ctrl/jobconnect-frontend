import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE = `${
    import.meta.env.VITE_API_BASE_URL || ""
}/auth/jobseeker/`;

const PROFILE_API = `${API_BASE}profile/`;
const SUBMIT_API = `${API_BASE}submit-profile/`;

/* =========================================================
   HELPERS
========================================================= */

const getAuthToken = () => {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
    );
};

const isTrue = (value) => {
    if (value === true) return true;
    if (
        value === false ||
        value === null ||
        value === undefined
    ) {
        return false;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        return [
            "true",
            "1",
            "yes",
            "y",
        ].includes(value.trim().toLowerCase());
    }

    return Boolean(value);
};

const getFileNameFromUrl = (url) => {
    if (!url) return "";

    const cleanUrl = String(url).split("?")[0];
    const parts = cleanUrl.split("/");

    return parts[parts.length - 1] || "Uploaded File";
};

const getErrorMessage = async (response, fallback) => {
    try {
        const data = await response.json();

        if (data?.detail) return data.detail;
        if (data?.message) return data.message;
        if (data?.error) return data.error;

        if (data && typeof data === "object") {
            const firstKey = Object.keys(data)[0];

            if (firstKey) {
                const value = data[firstKey];

                if (Array.isArray(value)) {
                    return `${firstKey}: ${value.join(", ")}`;
                }

                if (typeof value === "string") {
                    return `${firstKey}: ${value}`;
                }
            }
        }
    } catch (err) {
        // Not JSON.
    }

    return fallback;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function ProfileReview() {
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(
        Boolean(location.state?.profileSubmitted)
    );

    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    const loadProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();

            if (!token) {
                setError(
                    "Authentication token missing. Please login again."
                );
                return;
            }

            const response = await fetch(
                PROFILE_API,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                "Review Profile GET status:",
                response.status
            );

            if (response.status === 401) {
                setError(
                    "Your session is not authorized. Please login again."
                );
                return;
            }

            if (!response.ok) {
                const message =
                    await getErrorMessage(
                        response,
                        "Failed to load profile."
                    );

                throw new Error(message);
            }

            const data = await response.json();

            /*
             IMPORTANT:
             This is the actual backend profile.
             Do not locally change profile_completed here.
            */

            console.log(
                "REVIEW PROFILE:",
                data
            );

            console.log(
                "REVIEW PROFILE COMPLETION:",
                data?.profile_completed
            );

            console.log(
                "REVIEW PROFILE APPROVAL:",
                data?.approval_status
            );

            setProfile(data);
        } catch (err) {
            console.error(
                "Review profile loading error:",
                err
            );

            setError(
                err?.message ||
                    "Failed to load profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    /* =====================================================
       COMPLETION
    ===================================================== */

    const profileCompletion = useMemo(() => {
        if (!profile) {
            return {
                percentage: 0,
                completed: 0,
                total: 0,
            };
        }

        const disability = isTrue(
            profile?.disability ??
                profile?.is_disabled
        );

        const items = [
            Boolean(profile?.full_name),
            Boolean(profile?.phone),
            Boolean(profile?.location),
            Boolean(profile?.headline),
            Boolean(profile?.skills),
            Boolean(profile?.linkedin),
            Boolean(profile?.email),
            Boolean(profile?.profile_photo),
            Boolean(profile?.resume),
            Boolean(
                profile?.aadhaar ||
                    profile?.aadhaar_card ||
                    profile?.id_proof
            ),
            Boolean(
                profile?.educations?.length
            ),
            Boolean(
                profile?.experiences?.length
            ),
            Boolean(
                profile?.projects?.length
            ),
        ];

        /*
         Disability certificate is required only for
         candidates who selected disability = true.
        */

        if (disability) {
            items.push(
                Boolean(profile?.disability_certificate)
            );
        }

        const completed = items.filter(Boolean).length;
        const total = items.length;

        const percentage =
            total > 0
                ? Math.round(
                      (completed / total) * 100
                  )
                : 0;

        return {
            percentage,
            completed,
            total,
        };
    }, [profile]);

    /* =====================================================
       APPROVAL STATUS
    ===================================================== */

    const approvalStatus = String(
        profile?.approval_status || "pending"
    ).toLowerCase();

    const isPending =
        approvalStatus === "pending";

    const isApproved =
        approvalStatus === "approved";

    const isRejected =
        approvalStatus === "rejected";

    /* =====================================================
       SUBMIT PROFILE
    ===================================================== */

    const submitProfile = async () => {
        if (submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            const token = getAuthToken();

            if (!token) {
                setError(
                    "Authentication token missing. Please login again."
                );
                return;
            }

            const response = await fetch(
                SUBMIT_API,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            console.log(
                "Submit Profile status:",
                response.status
            );

            if (response.status === 401) {
                setError(
                    "Your session is not authorized. Please login again."
                );
                return;
            }

            const data = await response.json().catch(
                () => ({})
            );

            console.log(
                "SUBMIT PROFILE RESPONSE:",
                data
            );

            if (!response.ok) {
                let message =
                    data?.detail ||
                    data?.message ||
                    data?.error;

                if (!message && data) {
                    const firstKey =
                        Object.keys(data)[0];

                    if (firstKey) {
                        const value =
                            data[firstKey];

                        if (Array.isArray(value)) {
                            message = `${firstKey}: ${value.join(
                                ", "
                            )}`;
                        } else if (
                            typeof value === "string"
                        ) {
                            message = `${firstKey}: ${value}`;
                        }
                    }
                }

                throw new Error(
                    message ||
                        "Failed to submit profile for approval."
                );
            }

            /*
             IMPORTANT CORRECTION

             Do NOT do this:

             setProfile({
                 ...profile,
                 profile_completed: true
             });

             That would only change React state.

             Instead reload the actual profile from
             Django so the UI reflects the database.
            */

            await loadProfile();

            setShowSuccess(true);
        } catch (err) {
            console.error(
                "Submit profile error:",
                err
            );

            setError(
                err?.message ||
                    "Failed to submit profile for approval."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* =====================================================
       SUCCESS OK
    ===================================================== */

    const handleSuccessOK = () => {
        setShowSuccess(false);

        navigate(
            "/jobseeker/profile/review",
            {
                replace: true,
                state: {
                    profileSubmitted: false,
                },
            }
        );
    };

    /* =====================================================
       BACK TO DOCUMENTS
    ===================================================== */

    const handleBackToDocuments = () => {
        navigate("/jobseeker/profile/documents");
    };

    /* =====================================================
       EDIT PROFILE
    ===================================================== */

    const handleEditProfile = () => {
        navigate("/jobseeker/profile");
    };

    /* =====================================================
       FILE NAME
    ===================================================== */

    const getDocumentName = (url) => {
        if (!url) return "Not uploaded";

        return getFileNameFromUrl(url);
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="pr-wrapper">
                <style>{styles}</style>

                <div className="pr-loading">
                    <div className="pr-spinner"></div>

                    <p>
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    /* =====================================================
       NO PROFILE
    ===================================================== */

    if (!profile) {
        return (
            <div className="pr-wrapper">
                <style>{styles}</style>

                <main className="pr-container">

                    <div className="pr-alert pr-alert-error">
                        <span>⚠️</span>

                        <p>
                            Unable to load your profile.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="pr-btn pr-btn-primary"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>

                </main>
            </div>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="pr-wrapper">
            <style>{styles}</style>

            <main className="pr-container">

                {/* =================================================
                   HEADER
                ================================================= */}

                <div className="pr-heading">

                    <span className="pr-eyebrow">
                        STEP 3 OF 3
                    </span>

                    <h1>
                        Review Your Profile
                    </h1>

                    <p>
                        Review your information carefully
                        before submitting it for administrator
                        verification.
                    </p>

                </div>

                {/* =================================================
                   SUCCESS MESSAGE
                ================================================= */}

                {showSuccess && (
                    <div className="pr-success-overlay">

                        <div className="pr-success-modal">

                            <div className="pr-success-icon">
                                ✓
                            </div>

                            <h2>
                                Profile Submitted
                            </h2>

                            <p>
                                Your profile has been submitted
                                for verification. Your information
                                is now locked while the administrator
                                reviews it.
                            </p>

                            <button
                                type="button"
                                className="pr-btn pr-btn-primary"
                                onClick={handleSuccessOK}
                            >
                                OK
                            </button>

                        </div>

                    </div>
                )}

                {/* =================================================
                   ERROR
                ================================================= */}

                {error && (
                    <div className="pr-alert pr-alert-error">

                        <span>⚠️</span>

                        <p>{error}</p>

                    </div>
                )}

                {/* =================================================
                   APPROVAL STATUS
                ================================================= */}

                <div
                    className={`pr-status-card pr-status-${approvalStatus}`}
                >

                    <div className="pr-status-icon">
                        {isApproved
                            ? "✓"
                            : isRejected
                            ? "!"
                            : "⏳"}
                    </div>

                    <div className="pr-status-content">

                        <h2>
                            {isApproved
                                ? "Profile Approved"
                                : isRejected
                                ? "Profile Rejected"
                                : "Pending Verification"}
                        </h2>

                        <p>
                            {isApproved
                                ? "Your profile has been approved by the administrator."
                                : isRejected
                                ? profile?.rejection_reason ||
                                  "Your profile requires changes before it can be approved."
                                : "Your profile has been submitted for verification. Your information is now locked while the administrator reviews it."}
                        </p>

                    </div>

                </div>

                {/* =================================================
                   COMPLETION
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Profile Completion
                            </h2>

                            <p>
                                {profileCompletion.completed} of{" "}
                                {profileCompletion.total} sections
                                completed
                            </p>
                        </div>

                        <strong className="pr-percentage">
                            {profileCompletion.percentage}%
                        </strong>

                    </div>

                    <div className="pr-progress">

                        <div
                            className="pr-progress-bar"
                            style={{
                                width: `${profileCompletion.percentage}%`,
                            }}
                        ></div>

                    </div>

                </div>

                {/* =================================================
                   PERSONAL DETAILS
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Personal Details
                            </h2>

                            <p>
                                Basic profile information
                            </p>
                        </div>

                    </div>

                    <div className="pr-grid">

                        <InfoItem
                            label="Full Name"
                            value={
                                profile?.full_name
                            }
                        />

                        <InfoItem
                            label="Email"
                            value={
                                profile?.email
                            }
                        />

                        <InfoItem
                            label="Phone"
                            value={
                                profile?.phone
                            }
                        />

                        <InfoItem
                            label="Location"
                            value={
                                profile?.location
                            }
                        />

                        <InfoItem
                            label="Headline"
                            value={
                                profile?.headline
                            }
                            fullWidth
                        />

                        <InfoItem
                            label="Skills"
                            value={
                                profile?.skills
                            }
                            fullWidth
                        />

                        <InfoItem
                            label="LinkedIn"
                            value={
                                profile?.linkedin
                            }
                            fullWidth
                        />

                    </div>

                </div>

                {/* =================================================
                   DISABILITY
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Disability Information
                            </h2>

                            <p>
                                Accessibility information
                            </p>
                        </div>

                    </div>

                    <div className="pr-grid">

                        <InfoItem
                            label="Disability"
                            value={
                                isTrue(
                                    profile?.disability
                                )
                                    ? "Yes"
                                    : "No"
                            }
                        />

                        {isTrue(
                            profile?.disability
                        ) && (
                            <>
                                <InfoItem
                                    label="Category"
                                    value={
                                        profile?.disability_category
                                    }
                                />

                                <InfoItem
                                    label="Type"
                                    value={
                                        profile?.disability_type
                                    }
                                />

                                <InfoItem
                                    label="Percentage"
                                    value={
                                        profile?.disability_percentage
                                            ? `${profile.disability_percentage}%`
                                            : ""
                                    }
                                />
                            </>
                        )}

                    </div>

                </div>

                {/* =================================================
                   EDUCATION
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Education
                            </h2>

                            <p>
                                Academic qualifications
                            </p>
                        </div>

                    </div>

                    {profile?.educations?.length ? (
                        <div className="pr-list">

                            {profile.educations.map(
                                (education, index) => (
                                    <div
                                        className="pr-list-item"
                                        key={
                                            education.id ||
                                            index
                                        }
                                    >

                                        <h3>
                                            {education.degree ||
                                                education.course ||
                                                "Education"}
                                        </h3>

                                        <p>
                                            {education.institution ||
                                                education.college ||
                                                ""}
                                        </p>

                                        <small>
                                            {education.start_year ||
                                                ""}{" "}
                                            {education.end_year
                                                ? `- ${education.end_year}`
                                                : ""}
                                        </small>

                                    </div>
                                )
                            )}

                        </div>
                    ) : (
                        <EmptyValue text="No education details added." />
                    )}

                </div>

                {/* =================================================
                   EXPERIENCE
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Experience
                            </h2>

                            <p>
                                Professional experience
                            </p>
                        </div>

                    </div>

                    {profile?.experiences?.length ? (
                        <div className="pr-list">

                            {profile.experiences.map(
                                (experience, index) => (
                                    <div
                                        className="pr-list-item"
                                        key={
                                            experience.id ||
                                            index
                                        }
                                    >

                                        <h3>
                                            {experience.job_title ||
                                                experience.position ||
                                                "Experience"}
                                        </h3>

                                        <p>
                                            {experience.company ||
                                                ""}
                                        </p>

                                        <small>
                                            {experience.description ||
                                                ""}
                                        </small>

                                    </div>
                                )
                            )}

                        </div>
                    ) : (
                        <EmptyValue text="No experience details added." />
                    )}

                </div>

                {/* =================================================
                   PROJECTS
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Projects
                            </h2>

                            <p>
                                Projects and achievements
                            </p>
                        </div>

                    </div>

                    {profile?.projects?.length ? (
                        <div className="pr-list">

                            {profile.projects.map(
                                (project, index) => (
                                    <div
                                        className="pr-list-item"
                                        key={
                                            project.id ||
                                            index
                                        }
                                    >

                                        <h3>
                                            {project.title ||
                                                project.name ||
                                                "Project"}
                                        </h3>

                                        <p>
                                            {project.description ||
                                                ""}
                                        </p>

                                    </div>
                                )
                            )}

                        </div>
                    ) : (
                        <EmptyValue text="No projects added." />
                    )}

                </div>

                {/* =================================================
                   DOCUMENTS
                ================================================= */}

                <div className="pr-card">

                    <div className="pr-card-header">

                        <div>
                            <h2>
                                Documents
                            </h2>

                            <p>
                                Uploaded verification documents
                            </p>
                        </div>

                    </div>

                    <div className="pr-document-list">

                        <DocumentItem
                            label="Profile Photo"
                            value={
                                profile?.profile_photo
                            }
                        />

                        <DocumentItem
                            label="Resume / CV"
                            value={
                                profile?.resume
                            }
                        />

                        <DocumentItem
                            label="Government ID"
                            value={
                                profile?.aadhaar ||
                                profile?.aadhaar_card ||
                                profile?.id_proof
                            }
                        />

                        {isTrue(
                            profile?.disability
                        ) && (
                            <DocumentItem
                                label="Disability Certificate"
                                value={
                                    profile?.disability_certificate
                                }
                            />
                        )}

                        {profile?.disability_id && (
                            <DocumentItem
                                label="Disability ID"
                                value={
                                    profile?.disability_id
                                }
                            />
                        )}

                    </div>

                </div>

                {/* =================================================
                   ACTIONS
                ================================================= */}

                <div className="pr-actions">

                    {!isPending && !isApproved && (
                        <button
                            type="button"
                            className="pr-btn pr-btn-secondary"
                            onClick={
                                handleBackToDocuments
                            }
                        >
                            ← Back to Documents
                        </button>
                    )}

                    {isRejected && (
                        <button
                            type="button"
                            className="pr-btn pr-btn-secondary"
                            onClick={
                                handleEditProfile
                            }
                        >
                            Edit Profile
                        </button>
                    )}

                    {!isPending && !isApproved && (
                        <button
                            type="button"
                            className="pr-btn pr-btn-primary"
                            onClick={submitProfile}
                            disabled={submitting}
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit for Approval"}
                        </button>
                    )}

                    {isPending && (
                        <div className="pr-locked">

                            <span>
                                🔒
                            </span>

                            <div>
                                <strong>
                                    Profile Locked
                                </strong>

                                <p>
                                    Your profile is currently
                                    under administrator review.
                                </p>
                            </div>

                        </div>
                    )}

                </div>

            </main>
        </div>
    );
}

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
    label,
    value,
    fullWidth = false,
}) => {
    return (
        <div
            className={`pr-info-item ${
                fullWidth
                    ? "pr-info-full"
                    : ""
            }`}
        >

            <span>
                {label}
            </span>

            <strong>
                {value || "Not provided"}
            </strong>

        </div>
    );
};

/* =========================================================
   DOCUMENT ITEM
========================================================= */

const DocumentItem = ({
    label,
    value,
}) => {
    return (
        <div className="pr-document-item">

            <div className="pr-document-icon">
                📄
            </div>

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {value
                        ? getFileNameFromUrl(value)
                        : "Not uploaded"}
                </strong>

            </div>

            {value && (
                <span className="pr-document-check">
                    ✓
                </span>
            )}

        </div>
    );
};

/* =========================================================
   EMPTY
========================================================= */

const EmptyValue = ({ text }) => {
    return (
        <div className="pr-empty">
            {text}
        </div>
    );
};

/* =========================================================
   STYLES
========================================================= */

const styles = `
.pr-wrapper {
    width: 100%;
    min-height: 100vh;
    background: #f8fafc;
    color: #0f172a;
    font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Oxygen,
        Ubuntu,
        Cantarell,
        sans-serif;
    padding: 1rem;
    box-sizing: border-box;
}

.pr-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
}

.pr-heading {
    margin-bottom: 2rem;
}

.pr-eyebrow {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #2563eb;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.pr-heading h1 {
    margin: 0 0 0.5rem;
    font-size: 1.8rem;
    font-weight: 700;
}

.pr-heading p {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
}

.pr-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

.pr-alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.pr-alert p {
    margin: 0;
}

.pr-status-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border: 1px solid;
}

.pr-status-pending {
    background: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
}

.pr-status-approved {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
}

.pr-status-rejected {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
}

.pr-status-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.7);
    font-size: 1.25rem;
    font-weight: 700;
}

.pr-status-content h2 {
    margin: 0 0 0.25rem;
    font-size: 1.05rem;
}

.pr-status-content p {
    margin: 0;
    line-height: 1.5;
    font-size: 0.875rem;
}

.pr-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pr-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
}

.pr-card-header h2 {
    margin: 0;
    font-size: 1.1rem;
}

.pr-card-header p {
    margin: 0.25rem 0 0;
    color: #64748b;
    font-size: 0.8125rem;
}

.pr-percentage {
    font-size: 1.25rem;
    color: #2563eb;
}

.pr-progress {
    height: 8px;
    margin: 0 1.5rem 1.5rem;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
}

.pr-progress-bar {
    height: 100%;
    background: #2563eb;
    border-radius: inherit;
    transition: width 0.3s ease;
}

.pr-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    padding: 1.5rem;
}

.pr-info-item {
    min-width: 0;
}

.pr-info-full {
    grid-column: 1 / -1;
}

.pr-info-item span {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.pr-info-item strong {
    display: block;
    color: #334155;
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-word;
}

.pr-list {
    display: flex;
    flex-direction: column;
}

.pr-list-item {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
}

.pr-list-item:last-child {
    border-bottom: none;
}

.pr-list-item h3 {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
}

.pr-list-item p {
    margin: 0 0 0.25rem;
    color: #475569;
    font-size: 0.875rem;
    line-height: 1.5;
}

.pr-list-item small {
    color: #94a3b8;
    font-size: 0.75rem;
    line-height: 1.5;
}

.pr-empty {
    padding: 1.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
}

.pr-document-list {
    display: flex;
    flex-direction: column;
}

.pr-document-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
}

.pr-document-item:last-child {
    border-bottom: none;
}

.pr-document-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.pr-document-item > div:nth-child(2) {
    flex: 1;
    min-width: 0;
}

.pr-document-item span {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
}

.pr-document-item strong {
    display: block;
    margin-top: 0.2rem;
    color: #334155;
    font-size: 0.8125rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.pr-document-check {
    color: #16a34a !important;
    font-size: 1rem !important;
    font-weight: 700;
}

.pr-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.pr-btn {
    padding: 0.7rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pr-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.pr-btn-primary {
    background: #2563eb;
    color: #ffffff;
    border: 1px solid #2563eb;
}

.pr-btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
    border-color: #1d4ed8;
}

.pr-btn-secondary {
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
}

.pr-btn-secondary:hover:not(:disabled) {
    background: #f8fafc;
}

.pr-locked {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-sizing: border-box;
}

.pr-locked > span {
    font-size: 1.25rem;
}

.pr-locked strong {
    display: block;
    font-size: 0.875rem;
}

.pr-locked p {
    margin: 0.2rem 0 0;
    color: #64748b;
    font-size: 0.8125rem;
}

.pr-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.pr-loading p {
    color: #64748b;
}

.pr-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: pr-spin 0.8s linear infinite;
    margin-bottom: 1rem;
}

@keyframes pr-spin {
    to {
        transform: rotate(360deg);
    }
}

.pr-success-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.55);
}

.pr-success-modal {
    width: 100%;
    max-width: 430px;
    padding: 2rem;
    background: #ffffff;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.pr-success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #dcfce7;
    color: #16a34a;
    font-size: 2rem;
    font-weight: 700;
}

.pr-success-modal h2 {
    margin: 0 0 0.75rem;
    font-size: 1.4rem;
}

.pr-success-modal p {
    margin: 0 0 1.5rem;
    color: #64748b;
    line-height: 1.6;
    font-size: 0.9rem;
}

@media (max-width: 640px) {
    .pr-wrapper {
        padding: 0.5rem;
    }

    .pr-container {
        padding: 1rem 0.5rem 2rem;
    }

    .pr-grid {
        grid-template-columns: 1fr;
        padding: 1rem;
    }

    .pr-info-full {
        grid-column: auto;
    }

    .pr-card-header {
        padding: 1rem;
    }

    .pr-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .pr-btn {
        width: 100%;
    }

    .pr-status-card {
        padding: 1rem;
    }

    .pr-document-item {
        padding: 1rem;
    }
}
`;

export default ProfileReview;

