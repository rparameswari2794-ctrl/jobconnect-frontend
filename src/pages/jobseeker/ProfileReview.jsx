import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

const PROFILE_API =
    `${API_BASE}profile/`;

const SUBMIT_API =
    `${API_BASE}submit-profile/`;

function ProfileReview() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        loadProfile();

    }, []);


    async function loadProfile() {

        const token =
            localStorage.getItem("jc_token");

        if (!token) {

            navigate(
                "/login",
                { replace: true }
            );

            return;
        }


        try {

            setLoading(true);
            setError("");


            const response =
                await fetch(
                    PROFILE_API,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            Accept:
                                "application/json",
                        },
                    }
                );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "REVIEW PROFILE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load profile."
                );
            }


            setProfile(data);


        } catch (err) {

            console.error(
                "Review profile error:",
                err
            );

            setError(
                err.message ||
                "Unable to load your profile."
            );


        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // SUBMIT PROFILE
    // =====================================================

    async function submitProfile() {

        console.log("=================================");
        console.log("SUBMIT BUTTON CLICKED");
        console.log("=================================");

        const token = localStorage.getItem("jc_token");

        console.log("TOKEN EXISTS:", !!token);
        console.log("SUBMIT URL:", SUBMIT_API);

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        try {

            setSubmitting(true);
            setError("");

            console.log("STARTING POST REQUEST...");

            const response = await fetch(
                SUBMIT_API,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },

                    body: JSON.stringify({}),
                }
            );

            console.log(
                "POST REQUEST COMPLETED"
            );

            console.log(
                "RESPONSE STATUS:",
                response.status
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            console.log(
                "RESPONSE DATA:",
                data
            );

            // =================================================
            // IMPORTANT: SHOW ALL DJANGO ERRORS
            // =================================================

            if (!response.ok) {

                let errorMessage =
                    "Unable to submit profile.";

                if (data.detail) {
                    errorMessage =
                        Array.isArray(data.detail)
                            ? data.detail.join(", ")
                            : String(data.detail);
                }

                else if (data.message) {
                    errorMessage =
                        Array.isArray(data.message)
                            ? data.message.join(", ")
                            : String(data.message);
                }

                else if (typeof data === "object") {

                    const messages = [];

                    Object.entries(data).forEach(
                        ([field, value]) => {

                            if (Array.isArray(value)) {

                                messages.push(
                                    `${field}: ${value.join(", ")}`
                                );

                            } else if (
                                typeof value === "object" &&
                                value !== null
                            ) {

                                messages.push(
                                    `${field}: ${JSON.stringify(value)}`
                                );

                            } else {

                                messages.push(
                                    `${field}: ${value}`
                                );
                            }
                        }
                    );

                    if (messages.length > 0) {
                        errorMessage =
                            messages.join(" | ");
                    }
                }

                throw new Error(errorMessage);
            }

            console.log(
                "PROFILE SUBMITTED SUCCESSFULLY"
            );

            setShowSuccess(true);

        } catch (err) {

            console.error(
                "SUBMIT PROFILE ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to submit your profile."
            );

        } finally {

            setSubmitting(false);
        }
    }


    // =====================================================
    // SUCCESS POPUP OK
    // =====================================================

    function handleSuccessOK() {

        setShowSuccess(false);

        /*
         * Go to the normal profile page.
         *
         * Profile page will fetch the database again.
         * Since approval_status is now pending,
         * it will show the frozen/locked profile.
         */

        navigate(
            "/jobseeker/profile",
            {
                replace: true,
                state: {
                    profileSubmitted: true,
                },
            }
        );
    }


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="profile-review-page">

                <main className="profile-review-main">

                    <div className="profile-loading">

                        Loading your profile...

                    </div>

                </main>

            </div>
        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (
            <div className="profile-review-page">

                <main className="profile-review-main">

                    <div className="documents-error">

                        {error}

                    </div>

                </main>

            </div>
        );
    }


    // =====================================================
    // PROFILE NOT FOUND
    // =====================================================

    if (!profile) {

        return (
            <div className="profile-review-page">

                <main className="profile-review-main">

                    <p>
                        Profile not found.
                    </p>

                </main>

            </div>
        );
    }


    // =====================================================
    // RELATED DATA
    // =====================================================

    const education =
        Array.isArray(profile.education)
            ? profile.education
            : Array.isArray(profile.educations)
                ? profile.educations
                : [];


    const experiences =
        Array.isArray(profile.experience)
            ? profile.experience
            : Array.isArray(profile.experiences)
                ? profile.experiences
                : [];


    const projects =
        Array.isArray(profile.projects)
            ? profile.projects
            : [];


    // =====================================================
    // STATUS
    // =====================================================

    const isPending =
        profile.approval_status === "pending";


    const isApproved =
        profile.approval_status === "approved";


    const isRejected =
        profile.approval_status === "rejected";


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="profile-review-page">


            {/* =================================================
                SUCCESS POPUP
            ================================================= */}

            {showSuccess && (

                <div className="profile-success-overlay">

                    <div className="profile-success-popup">

                        <div className="success-icon">
                            ✓
                        </div>


                        <h2>
                            Profile Submitted Successfully
                        </h2>


                        <p>
                            Your profile has been submitted
                            for administrator verification.
                        </p>


                        <p>
                            Your profile is now locked while
                            it is under review.
                        </p>


                        <button
                            type="button"
                            onClick={handleSuccessOK}
                        >
                            OK
                        </button>

                    </div>

                </div>
            )}


            {/* =================================================
                STEPS
            ================================================= */}

            <div className="profile-steps">

                <div className="profile-step completed">

                    <span>
                        ✓
                    </span>

                    Details

                </div>


                <div
                    className=
                    "profile-step-line completed"
                />


                <div className="profile-step completed">

                    <span>
                        ✓
                    </span>

                    Documents

                </div>


                <div
                    className=
                    "profile-step-line completed"
                />


                <div className="profile-step active">

                    <span>
                        3
                    </span>

                    Review

                </div>

            </div>


            <main className="profile-review-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="profile-details-header">

                    <h1>
                        Profile & Verification
                    </h1>


                    {isPending && (

                        <p>
                            Your profile has been submitted
                            for verification. Your information
                            is now locked while the administrator
                            reviews it.
                        </p>

                    )}


                    {isApproved && (

                        <p>
                            Your profile has been approved by
                            the administrator.
                        </p>

                    )}


                    {isRejected && (

                        <p>
                            Your profile was rejected.
                            Please review the administrator's
                            feedback and update your profile.
                        </p>

                    )}


                    {!isPending &&
                        !isApproved &&
                        !isRejected && (

                            <p>
                                Please review your information
                                before submitting your profile
                                for verification.
                            </p>

                        )}

                </section>


                {/* =================================================
                    STATUS
                ================================================= */}

                <section className="verification-status-card">

                    <div className="verification-status-icon">

                        {isPending && "✓"}

                        {isApproved && "✓"}

                        {isRejected && ""}

                        {!isPending &&
                            !isApproved &&
                            !isRejected &&
                            ""}

                    </div>


                    <div>

                        {isPending && (

                            <>
                                <h2>
                                    Profile submitted
                                </h2>

                                <p>
                                    Your profile is currently
                                    under administrator verification.
                                </p>

                                <span className="pending-badge">
                                    Pending Verification
                                </span>
                            </>

                        )}


                        {isApproved && (

                            <>
                                <h2>
                                    Profile Approved
                                </h2>

                                <p>
                                    Your profile has been approved
                                    by the administrator.
                                </p>

                                <span className="approved-badge">
                                    Approved
                                </span>
                            </>

                        )}


                        {isRejected && (

                            <>
                                <h2>
                                    Profile Rejected
                                </h2>

                                <p>
                                    Please update your profile
                                    based on the administrator's
                                    feedback.
                                </p>

                                <span className="rejected-badge">
                                    Rejected
                                </span>
                            </>

                        )}


                        {!isPending &&
                            !isApproved &&
                            !isRejected && (

                                <>
                                    <h2>
                                        Review Your Profile
                                    </h2>

                                    <p>
                                        Please check your profile
                                        details before submitting
                                        for verification.
                                    </p>
                                </>

                            )}

                    </div>

                </section>


                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <h2>
                            Personal Information
                        </h2>

                    </div>


                    <div className="profile-form">


                        <div className="form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                value={
                                    profile.full_name || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Phone
                            </label>

                            <input
                                type="text"
                                value={
                                    profile.phone || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                value={
                                    profile.email || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                            <small>
                                Email cannot be changed.
                            </small>

                        </div>


                        <div className="form-group">

                            <label>
                                Location
                            </label>

                            <input
                                type="text"
                                value={
                                    profile.location || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                LinkedIn
                            </label>

                            <input
                                type="text"
                                value={
                                    profile.linkedin || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Professional Headline
                            </label>

                            <input
                                type="text"
                                value={
                                    profile.headline || ""
                                }
                                readOnly
                                className="readonly-input"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Skills
                            </label>

                            <textarea
                                value={
                                    profile.skills || ""
                                }
                                readOnly
                                rows="3"
                                className="readonly-input"
                            />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    EDUCATION
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <h2>
                            Education
                        </h2>

                    </div>


                    {education.length > 0 ? (

                        education.map((item) => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                <h3>
                                    {item.degree ||
                                        "Education"}
                                </h3>


                                <p>
                                    <strong>
                                        University:
                                    </strong>{" "}

                                    {item.university ||
                                        "Not provided"}
                                </p>


                                <p>
                                    <strong>
                                        College:
                                    </strong>{" "}

                                    {item.college ||
                                        "Not provided"}
                                </p>


                                <p>
                                    <strong>
                                        Passing:
                                    </strong>{" "}

                                    {item.passing_month_year ||
                                        item.end_year ||
                                        "Not provided"}
                                </p>


                                <p>
                                    <strong>
                                        Percentage / CGPA:
                                    </strong>{" "}

                                    {item.percentage_cgpa ||
                                        "Not provided"}
                                </p>

                            </div>

                        ))

                    ) : (

                        <p>
                            No education details added.
                        </p>

                    )}

                </section>


                {/* =================================================
                    EXPERIENCE
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <h2>
                            Experience
                        </h2>

                    </div>


                    {experiences.length > 0 ? (

                        experiences.map((item) => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                <h3>
                                    {item.job_title ||
                                        "Experience"}
                                </h3>


                                <p>
                                    <strong>
                                        Company:
                                    </strong>{" "}

                                    {item.company ||
                                        "Not provided"}
                                </p>


                                <p>
                                    <strong>
                                        Employment Type:
                                    </strong>{" "}

                                    {item.employment_type ||
                                        "Not provided"}
                                </p>


                                <p>
                                    <strong>
                                        Duration:
                                    </strong>{" "}

                                    {item.start_date || ""}

                                    {" - "}

                                    {item.is_current
                                        ? "Present"
                                        : item.end_date || ""}
                                </p>


                                {item.description && (

                                    <p>

                                        <strong>
                                            Description:
                                        </strong>{" "}

                                        {item.description}

                                    </p>

                                )}

                            </div>

                        ))

                    ) : (

                        <p>
                            No experience details added.
                        </p>

                    )}

                </section>


                {/* =================================================
    PROJECTS
================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <h2>
                            Projects
                        </h2>

                    </div>


                    {projects.length > 0 ? (

                        projects.map((item) => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                {/* PROJECT TITLE */}

                                <h3>
                                    {item.title ||
                                        item.name ||
                                        "Project"}
                                </h3>


                                {/* PROJECT TYPE */}

                                <p>

                                    <strong>
                                        Project Type:
                                    </strong>{" "}

                                    {item.project_type ||
                                        "Not provided"}

                                </p>


                                {/* TECHNOLOGIES */}

                                <p>

                                    <strong>
                                        Technologies:
                                    </strong>{" "}

                                    {item.technologies ||
                                        "Not provided"}

                                </p>


                                {/* PROJECT URL */}

                                <p>

                                    <strong>
                                        Project URL:
                                    </strong>{" "}

                                    {item.project_link ? (

                                        <a
                                            href={item.project_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.project_link}
                                        </a>

                                    ) : (

                                        "Not provided"

                                    )}

                                </p>


                                {/* DESCRIPTION */}

                                <p>

                                    <strong>
                                        Description:
                                    </strong>{" "}

                                    {item.description ||
                                        "Not provided"}

                                </p>

                            </div>

                        ))

                    ) : (

                        <p>
                            No projects added.
                        </p>

                    )}

                </section>

                {/* =================================================
                    SUBMIT BUTTON
                ================================================= */}

                {!isPending &&
                    !isApproved && (

                        <section
                            className=
                            "profile-submit-section"
                        >

                            <button
                                type="button"
                                className=
                                "submit-profile-button"
                                onClick={submitProfile}
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Submitting..."
                                    : "Submit for Verification"}

                            </button>

                        </section>

                    )}


                {/* =================================================
                    PENDING
                ================================================= */}

                {isPending && (

                    <section
                        className=
                        "profile-lock-message"
                    >

                        <strong>
                            🔒 Profile locked
                        </strong>


                        <p>
                            Your submitted profile cannot
                            be edited while verification is
                            in progress.
                        </p>

                    </section>

                )}


                {/* =================================================
                    APPROVED
                ================================================= */}

                {isApproved && (

                    <section
                        className=
                        "profile-lock-message"
                    >

                        <strong>
                            ✓ Profile approved
                        </strong>


                        <p>
                            Your profile has been approved
                            by the administrator.
                        </p>

                    </section>

                )}

            </main>

        </div>
    );
}

export default ProfileReview;