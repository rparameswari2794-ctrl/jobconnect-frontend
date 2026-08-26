import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function CompanyVerification() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        company_name: "",
        contact_name: "",
        phone: "",
        company_email: "",
        company_description: "",
        website: "",
        location: "",
    });

    // Approved company photo only
    const [currentLogo, setCurrentLogo] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingSection, setEditingSection] = useState(null);
    const [showProgressModal, setShowProgressModal] =
        useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError("Please log in as an employer.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/auth/employer/profile/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to load company profile."
                );
            }

            setFormData({
                company_name: data.company_name || "",
                contact_name: data.contact_name || "",
                phone: data.phone || "",
                company_email: data.company_email || "",
                company_description:
                    data.company_description || "",
                website: data.website || "",
                location: data.location || "",
            });

            if (data.company_logo) {
                setCurrentLogo(data.company_logo);
            }
        } catch (err) {
            console.error("PROFILE LOAD ERROR:", err);

            setError(
                err.message ||
                    "Unable to load company profile."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    const requiredFields = [
        formData.company_name,
        formData.contact_name,
        formData.phone,
        formData.company_email,
        formData.company_description,
        formData.location,
    ];

    const completedFields =
        requiredFields.filter(
            (field) => field.trim()
        ).length;

    const completionPercentage = Math.round(
        (completedFields / requiredFields.length) *
            100
    );

    const isProfileComplete =
        completionPercentage === 100;

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.company_name.trim() ||
            !formData.contact_name.trim() ||
            !formData.phone.trim() ||
            !formData.company_email.trim() ||
            !formData.company_description.trim() ||
            !formData.location.trim()
        ) {
            setError(
                "Please complete all required company details."
            );

            return;
        }

        const token = localStorage.getItem("jc_token");

        if (!token) {
            setError(
                "Please log in as an employer."
            );

            return;
        }

        const data = new FormData();

        data.append(
            "company_name",
            formData.company_name
        );

        data.append(
            "contact_name",
            formData.contact_name
        );

        data.append(
            "phone",
            formData.phone
        );

        data.append(
            "company_email",
            formData.company_email
        );

        data.append(
            "company_description",
            formData.company_description
        );

        data.append(
            "website",
            formData.website
        );

        data.append(
            "location",
            formData.location
        );

        try {
            setSaving(true);

            const response = await fetch(
                `${API_BASE}/auth/employer/profile/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: data,
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                console.error(
                    "PROFILE UPDATE ERROR:",
                    result
                );

                throw new Error(
                    result.message ||
                        "Unable to save company profile."
                );
            }

            setFormData({
                company_name:
                    result.company_name || "",

                contact_name:
                    result.contact_name || "",

                phone:
                    result.phone || "",

                company_email:
                    result.company_email || "",

                company_description:
                    result.company_description ||
                    "",

                website:
                    result.website || "",

                location:
                    result.location || "",
            });

            if (result.company_logo) {
                setCurrentLogo(
                    result.company_logo
                );
            }

            setEditingSection(null);

            setSuccess(
                "Company profile updated successfully."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (err) {
            console.error(
                "PROFILE SAVE ERROR:",
                err
            );

            setError(
                err.message ||
                    "Unable to save company profile."
            );
        } finally {
            setSaving(false);
        }
    }

    function cancelEditing() {
        setEditingSection(null);
        setError("");
        loadProfile();
    }

    function openEdit(section) {
        setError("");
        setSuccess("");
        setEditingSection(section);

        setTimeout(() => {
            const element =
                document.getElementById(
                    `verification-${section}`
                );

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }, 50);
    }

    if (loading) {
        return (
            <div className="company-verification-page">
                <style>
                    {companyVerificationStyles}
                </style>

                <div className="verification-loading-screen">
                    <div className="verification-loading-spinner"></div>

                    <span>
                        Loading company verification...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="company-verification-page">

            <style>
                {companyVerificationStyles}
            </style>

            <main className="company-verification-container">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="verification-page-header">

                    <div className="verification-header-left">

                        <div className="verification-breadcrumb">
                            <span>Employer</span>
                            <b>›</b>
                            <strong>
                                Company Verification
                            </strong>
                        </div>

                        <div className="verification-title-row">

                            <div className="verification-title-icon">
                                ✓
                            </div>

                            <div>
                                <h1>
                                    Company Verification
                                </h1>

                                <p>
                                    Review and manage your
                                    verified company information.
                                </p>
                            </div>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="verification-progress-button"
                        onClick={() =>
                            setShowProgressModal(
                                true
                            )
                        }
                    >
                        <span className="verification-progress-icon">
                            ◔
                        </span>

                        <span>
                            Profile Progress
                        </span>

                        <strong>
                            {completionPercentage}%
                        </strong>
                    </button>

                </div>


                {/* =====================================================
                    ALERTS
                ===================================================== */}

                {error && (
                    <div className="verification-alert verification-alert-error">

                        <div className="verification-alert-icon">
                            !
                        </div>

                        <div>
                            {error}
                        </div>

                    </div>
                )}

                {success && (
                    <div className="verification-alert verification-alert-success">

                        <div className="verification-alert-icon">
                            ✓
                        </div>

                        <div>
                            {success}
                        </div>

                    </div>
                )}


                {/* =====================================================
                    VERIFICATION HERO
                ===================================================== */}

                <section className="verification-hero">

                    <div className="verification-hero-main">

                        <div className="verification-company-logo">

                            {currentLogo ? (
                                <img
                                    src={currentLogo}
                                    alt={
                                        formData.company_name ||
                                        "Company"
                                    }
                                />
                            ) : (
                                <div className="verification-logo-placeholder">
                                    🏢
                                </div>
                            )}

                            <span className="verification-logo-check">
                                ✓
                            </span>

                        </div>

                        <div className="verification-company-details">

                            <div className="verification-company-name">

                                <h2>
                                    {formData.company_name ||
                                        "Company Name"}
                                </h2>

                                <span className="verification-verified-badge">
                                    <span>✓</span>
                                    Verified Company
                                </span>

                            </div>

                            <div className="verification-company-meta">

                                <span>
                                    <b>⌖</b>
                                    {formData.location ||
                                        "Location not provided"}
                                </span>

                                <span>
                                    <b>◉</b>
                                    Employer Account
                                </span>

                            </div>

                            <p>
                                Your company information has
                                been reviewed and verified by
                                the administrator.
                            </p>

                        </div>

                    </div>


                    {/* HERO STATUS */}

                    <div className="verification-hero-status">

                        <div className="verification-status-top">

                            <div>
                                <span>
                                    Verification Status
                                </span>

                                <strong>
                                    Verified
                                </strong>
                            </div>

                            <div className="verification-status-check">
                                ✓
                            </div>

                        </div>

                        <div className="verification-mini-progress">

                            <span
                                style={{
                                    width: `${completionPercentage}%`,
                                }}
                            ></span>

                        </div>

                        <div className="verification-status-bottom">

                            <span>
                                Profile completion
                            </span>

                            <strong>
                                {completionPercentage}%
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    MAIN CARD
                ===================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="verification-main-card"
                >

                    {/* =================================================
                        COMPANY INFORMATION
                    ================================================= */}

                    <section
                        id="verification-company"
                        className="verification-section"
                    >

                        <div className="verification-section-header">

                            <div className="verification-section-title">

                                <div className="verification-section-number purple">
                                    01
                                </div>

                                <div>
                                    <h2>
                                        Company Information
                                    </h2>

                                    <p>
                                        Official company details
                                    </p>
                                </div>

                            </div>

                            {editingSection !== "company" && (
                                <button
                                    type="button"
                                    className="verification-edit-button"
                                    onClick={() =>
                                        openEdit(
                                            "company"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>
                            )}

                        </div>


                        {editingSection === "company" ? (

                            <div className="verification-edit-grid">

                                <ProfileInput
                                    label="Company Name"
                                    name="company_name"
                                    value={
                                        formData.company_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <ProfileInput
                                    label="Company Email"
                                    name="company_email"
                                    type="email"
                                    value={
                                        formData.company_email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <ProfileInput
                                    label="Phone"
                                    name="phone"
                                    type="tel"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <ProfileInput
                                    label="Location"
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <ProfileInput
                                    label="Website"
                                    name="website"
                                    type="url"
                                    value={
                                        formData.website
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="https://example.com"
                                />

                                <div className="verification-field full">

                                    <label>
                                        Company Description
                                        <span>*</span>
                                    </label>

                                    <textarea
                                        name="company_description"
                                        value={
                                            formData.company_description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="5"
                                        placeholder="Tell job seekers about your company..."
                                    />

                                </div>

                                <EditActions
                                    saving={saving}
                                    onCancel={
                                        cancelEditing
                                    }
                                />

                            </div>

                        ) : (

                            <div className="verification-info-grid">

                                <InfoItem
                                    label="Company Name"
                                    value={
                                        formData.company_name
                                    }
                                />

                                <InfoItem
                                    label="Company Email"
                                    value={
                                        formData.company_email
                                    }
                                />

                                <InfoItem
                                    label="Phone"
                                    value={
                                        formData.phone
                                    }
                                />

                                <InfoItem
                                    label="Location"
                                    value={
                                        formData.location
                                    }
                                />

                                <div className="verification-info-item">

                                    <span className="verification-info-label">
                                        Website
                                    </span>

                                    {formData.website ? (
                                        <a
                                            href={
                                                formData.website
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="verification-website-link"
                                        >
                                            Visit Website
                                            <span>
                                                ↗
                                            </span>
                                        </a>
                                    ) : (
                                        <strong>
                                            Not provided
                                        </strong>
                                    )}

                                </div>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        REPRESENTATIVE
                    ================================================= */}

                    <section
                        id="verification-representative"
                        className="verification-section"
                    >

                        <div className="verification-section-header">

                            <div className="verification-section-title">

                                <div className="verification-section-number blue">
                                    02
                                </div>

                                <div>
                                    <h2>
                                        Company Representative
                                    </h2>

                                    <p>
                                        Person responsible for
                                        hiring and company
                                        representation.
                                    </p>
                                </div>

                            </div>

                            {editingSection !==
                                "representative" && (
                                <button
                                    type="button"
                                    className="verification-edit-button"
                                    onClick={() =>
                                        openEdit(
                                            "representative"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>
                            )}

                        </div>


                        {editingSection ===
                        "representative" ? (

                            <div className="verification-edit-grid">

                                <ProfileInput
                                    label="Representative Name"
                                    name="contact_name"
                                    value={
                                        formData.contact_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <EditActions
                                    saving={saving}
                                    onCancel={
                                        cancelEditing
                                    }
                                />

                            </div>

                        ) : (

                            <div className="verification-representative-card">

                                <div className="verification-representative-avatar">
                                    {formData.contact_name
                                        ? formData.contact_name
                                              .charAt(0)
                                              .toUpperCase()
                                        : "R"}
                                </div>

                                <div className="verification-representative-details">

                                    <span>
                                        Representative
                                    </span>

                                    <strong>
                                        {formData.contact_name ||
                                            "Not provided"}
                                    </strong>

                                    <small>
                                        Responsible for hiring
                                        and company representation
                                    </small>

                                </div>

                                <div className="verification-representative-status">
                                    ✓ Verified
                                </div>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        ABOUT COMPANY
                    ================================================= */}

                    <section
                        id="verification-about"
                        className="verification-section"
                    >

                        <div className="verification-section-header">

                            <div className="verification-section-title">

                                <div className="verification-section-number green">
                                    03
                                </div>

                                <div>
                                    <h2>
                                        About the Company
                                    </h2>

                                    <p>
                                        A short description about
                                        your organization.
                                    </p>
                                </div>

                            </div>

                            {editingSection !== "about" && (
                                <button
                                    type="button"
                                    className="verification-edit-button"
                                    onClick={() =>
                                        openEdit(
                                            "about"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>
                            )}

                        </div>


                        {editingSection === "about" ? (

                            <div className="verification-edit-grid">

                                <div className="verification-field full">

                                    <label>
                                        Company Description
                                        <span>*</span>
                                    </label>

                                    <textarea
                                        name="company_description"
                                        value={
                                            formData.company_description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="7"
                                        placeholder="Tell job seekers about your company..."
                                    />

                                </div>

                                <EditActions
                                    saving={saving}
                                    onCancel={
                                        cancelEditing
                                    }
                                />

                            </div>

                        ) : (

                            <div className="verification-about-box">

                                <div className="verification-about-icon">
                                    "
                                </div>

                                <p>
                                    {formData.company_description ||
                                        "No company description has been provided yet."}
                                </p>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        APPROVED COMPANY PHOTO
                    ================================================= */}

                    <section className="verification-section">

                        <div className="verification-section-header">

                            <div className="verification-section-title">

                                <div className="verification-section-number orange">
                                    04
                                </div>

                                <div>
                                    <h2>
                                        Approved Company Photo
                                    </h2>

                                    <p>
                                        Administrator-approved
                                        company image.
                                    </p>
                                </div>

                            </div>

                            <span className="verification-approved-label">
                                ✓ Approved
                            </span>

                        </div>


                        <div className="verification-photo-card">

                            <div className="verification-photo-large">

                                {currentLogo ? (
                                    <img
                                        src={currentLogo}
                                        alt="Approved company"
                                    />
                                ) : (
                                    <div>
                                        🏢
                                    </div>
                                )}

                                <span className="verification-photo-check">
                                    ✓
                                </span>

                            </div>

                            <div className="verification-photo-content">

                                <div className="verification-photo-status">
                                    <span>✓</span>
                                    Administrator approved
                                </div>

                                <h3>
                                    Company photo
                                </h3>

                                <p>
                                    This is the company image
                                    currently associated with
                                    your verified employer
                                    profile.
                                </p>

                                <small>
                                    The approved company photo
                                    cannot be changed from this
                                    profile page.
                                </small>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        VERIFICATION STATUS
                    ================================================= */}

                    <section className="verification-confirmation">

                        <div className="verification-confirmation-icon">
                            ✓
                        </div>

                        <div className="verification-confirmation-content">

                            <span className="verification-confirmation-label">
                                COMPANY VERIFICATION
                            </span>

                            <strong>
                                Company profile verified
                            </strong>

                            <p>
                                Your company information has
                                been reviewed and verified by
                                the administrator.
                            </p>

                        </div>

                        <div className="verification-confirmation-badge">
                            <span>✓</span>
                            Verified
                        </div>

                    </section>


                    {/* =================================================
                        BOTTOM ACTIONS
                    ================================================= */}

                    <div className="verification-bottom-actions">

                        <button
                            type="button"
                            className="verification-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/employer/dashboard"
                                )
                            }
                        >
                            <span>←</span>
                            Back to Dashboard
                        </button>

                        <button
                            type="button"
                            className="verification-primary-button"
                            onClick={() =>
                                navigate(
                                    "/employer/jobs"
                                )
                            }
                        >
                            Manage Jobs
                            <span>→</span>
                        </button>

                    </div>

                </form>

            </main>


            {/* =========================================================
                PROFILE PROGRESS MODAL
            ========================================================= */}

            {showProgressModal && (

                <div
                    className="verification-modal-overlay"
                    onClick={() =>
                        setShowProgressModal(false)
                    }
                >

                    <div
                        className="verification-progress-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="verification-modal-close"
                            onClick={() =>
                                setShowProgressModal(
                                    false
                                )
                            }
                        >
                            ×
                        </button>


                        <div className="verification-modal-header">

                            <span>
                                PROFILE COMPLETION
                            </span>

                            <h2>
                                Company profile progress
                            </h2>

                            <p>
                                Complete all required company
                                information to maintain a
                                complete employer profile.
                            </p>

                        </div>


                        {/* =================================================
                            CSS PIE / DONUT CHART
                        ================================================= */}

                        <div className="verification-pie-wrapper">

                            <div
                                className="verification-pie-chart"
                                style={{
                                    "--completion":
                                        `${completionPercentage}%`,
                                }}
                            >

                                <div className="verification-pie-center">

                                    <strong>
                                        {completionPercentage}%
                                    </strong>

                                    <span>
                                        Complete
                                    </span>

                                </div>

                            </div>

                        </div>


                        <div className="verification-pie-legend">

                            <div>
                                <span className="legend-dot completed"></span>

                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {completedFields}
                                </strong>
                            </div>

                            <div>
                                <span className="legend-dot remaining"></span>

                                <span>
                                    Remaining
                                </span>

                                <strong>
                                    {requiredFields.length -
                                        completedFields}
                                </strong>
                            </div>

                        </div>


                        <div className="verification-progress-list">

                            <ProgressItem
                                label="Company name"
                                completed={
                                    !!formData.company_name.trim()
                                }
                            />

                            <ProgressItem
                                label="Representative"
                                completed={
                                    !!formData.contact_name.trim()
                                }
                            />

                            <ProgressItem
                                label="Phone"
                                completed={
                                    !!formData.phone.trim()
                                }
                            />

                            <ProgressItem
                                label="Company email"
                                completed={
                                    !!formData.company_email.trim()
                                }
                            />

                            <ProgressItem
                                label="Company description"
                                completed={
                                    !!formData.company_description.trim()
                                }
                            />

                            <ProgressItem
                                label="Location"
                                completed={
                                    !!formData.location.trim()
                                }
                            />

                        </div>


                        <button
                            type="button"
                            className="verification-modal-continue"
                            onClick={() =>
                                setShowProgressModal(
                                    false
                                )
                            }
                        >
                            Continue
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}


/* =========================================================
   INPUT COMPONENT
========================================================= */

function ProfileInput({
    label,
    name,
    type = "text",
    value,
    onChange,
    required = false,
    placeholder = "",
}) {
    return (
        <div className="verification-field">

            <label>
                {label}

                {required && (
                    <span>*</span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />

        </div>
    );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
    label,
    value,
}) {
    return (
        <div className="verification-info-item">

            <span className="verification-info-label">
                {label}
            </span>

            <strong>
                {value || "Not provided"}
            </strong>

        </div>
    );
}


/* =========================================================
   EDIT ACTIONS
========================================================= */

function EditActions({
    saving,
    onCancel,
}) {
    return (
        <div className="verification-edit-actions">

            <button
                type="button"
                className="verification-cancel-button"
                onClick={onCancel}
                disabled={saving}
            >
                Cancel
            </button>

            <button
                type="submit"
                className="verification-save-button"
                disabled={saving}
            >
                {saving ? (
                    <>
                        <span className="verification-small-spinner"></span>
                        Saving...
                    </>
                ) : (
                    <>
                        Save Changes
                        <span>✓</span>
                    </>
                )}
            </button>

        </div>
    );
}


/* =========================================================
   PROGRESS ITEM
========================================================= */

function ProgressItem({
    label,
    completed,
}) {
    return (
        <div className="verification-progress-item">

            <span
                className={`verification-progress-check ${
                    completed
                        ? "completed"
                        : ""
                }`}
            >
                {completed ? "✓" : ""}
            </span>

            <span className="verification-progress-label">
                {label}
            </span>

            <span
                className={`verification-progress-status ${
                    completed
                        ? "done"
                        : "pending"
                }`}
            >
                {completed
                    ? "Done"
                    : "Pending"}
            </span>

        </div>
    );
}


/* =========================================================
   ALL CSS
========================================================= */

const companyVerificationStyles = `

* {
    box-sizing: border-box;
}


/* =========================================================
   PAGE
========================================================= */

.company-verification-page {
    width: 100%;
    min-height: 100vh;

    padding: 32px 28px 50px;

    background:
        radial-gradient(
            circle at 5% 0%,
            rgba(99, 102, 241, 0.09),
            transparent 28%
        ),
        radial-gradient(
            circle at 100% 10%,
            rgba(16, 185, 129, 0.07),
            transparent 25%
        ),
        linear-gradient(
            180deg,
            #f8fafc 0%,
            #f1f5f9 100%
        );

    color: #172033;

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

.company-verification-container {
    width: min(1180px, 100%);
    margin: 0 auto;
}


/* =========================================================
   LOADING
========================================================= */

.verification-loading-screen {
    min-height: 500px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 11px;

    color: #64748b;

    font-size: 13px;
    font-weight: 650;
}

.verification-loading-spinner {
    width: 28px;
    height: 28px;

    border: 3px solid #e2e8f0;
    border-top-color: #4f46e5;

    border-radius: 50%;

    animation:
        verificationSpin
        0.7s linear infinite;
}

@keyframes verificationSpin {
    to {
        transform: rotate(360deg);
    }
}


/* =========================================================
   HEADER
========================================================= */

.verification-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    gap: 25px;

    margin-bottom: 20px;
}

.verification-breadcrumb {
    display: flex;
    align-items: center;

    gap: 8px;

    margin-bottom: 10px;

    color: #94a3b8;

    font-size: 10px;
    font-weight: 750;

    text-transform: uppercase;
    letter-spacing: 0.8px;
}

.verification-breadcrumb b {
    color: #cbd5e1;
}

.verification-breadcrumb strong {
    color: #6366f1;
}

.verification-title-row {
    display: flex;
    align-items: center;

    gap: 13px;
}

.verification-title-icon {
    width: 45px;
    height: 45px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
        );

    color: #fff;

    font-size: 20px;
    font-weight: 850;

    box-shadow:
        0 9px 22px
        rgba(
            79,
            70,
            229,
            0.22
        );
}

.verification-header-left h1 {
    margin: 0;

    color: #172033;

    font-size: clamp(
        27px,
        3vw,
        36px
    );

    line-height: 1.1;

    font-weight: 850;

    letter-spacing: -1px;
}

.verification-header-left p {
    margin: 7px 0 0;

    color: #64748b;

    font-size: 12px;

    line-height: 1.5;
}


/* =========================================================
   PROGRESS BUTTON
========================================================= */

.verification-progress-button {
    height: 45px;

    display: inline-flex;
    align-items: center;

    gap: 9px;

    padding: 0 13px;

    border: 1px solid #dbe2ea;
    border-radius: 11px;

    background: #fff;
    color: #475569;

    font-family: inherit;

    font-size: 11px;
    font-weight: 750;

    cursor: pointer;

    box-shadow:
        0 5px 18px
        rgba(
            15,
            23,
            42,
            0.05
        );

    transition: 0.2s ease;
}

.verification-progress-button:hover {
    border-color: #818cf8;

    color: #4f46e5;

    transform: translateY(-1px);

    box-shadow:
        0 8px 22px
        rgba(
            79,
            70,
            229,
            0.10
        );
}

.verification-progress-icon {
    color: #6366f1;

    font-size: 18px;
}

.verification-progress-button strong {
    min-width: 40px;

    padding: 5px 7px;

    border-radius: 7px;

    background: #eef2ff;

    color: #4f46e5;

    text-align: center;

    font-size: 10px;
}


/* =========================================================
   ALERTS
========================================================= */

.verification-alert {
    display: flex;
    align-items: center;

    gap: 10px;

    width: 100%;

    padding: 12px 15px;

    margin-bottom: 16px;

    border-radius: 11px;

    font-size: 12px;
    font-weight: 650;
}

.verification-alert-error {
    color: #b91c1c;

    background: #fef2f2;

    border: 1px solid #fecaca;
}

.verification-alert-success {
    color: #047857;

    background: #ecfdf5;

    border: 1px solid #a7f3d0;
}

.verification-alert-icon {
    width: 23px;
    height: 23px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: currentColor;

    color: white;

    font-size: 11px;
    font-weight: 850;
}


/* =========================================================
   VERIFICATION HERO
========================================================= */

.verification-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 25px;

    margin-bottom: 18px;

    padding: 24px 25px;

    border: 1px solid #dfe5ed;
    border-radius: 18px;

    background:
        linear-gradient(
            135deg,
            #ffffff 0%,
            #fafbff 65%,
            #f8faff 100%
        );

    box-shadow:
        0 14px 40px
        rgba(
            15,
            23,
            42,
            0.055
        );
}

.verification-hero-main {
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 17px;
}

.verification-company-logo {
    position: relative;

    width: 88px;
    height: 88px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: visible;

    border: 1px solid #dfe5ed;
    border-radius: 18px;

    background: #fff;

    box-shadow:
        0 8px 22px
        rgba(
            15,
            23,
            42,
            0.08
        );
}

.verification-company-logo img {
    width: 100%;
    height: 100%;

    padding: 8px;

    object-fit: contain;

    border-radius: 18px;
}

.verification-logo-placeholder {
    font-size: 36px;
}

.verification-logo-check {
    position: absolute;

    right: -6px;
    bottom: -6px;

    width: 25px;
    height: 25px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 3px solid #fff;
    border-radius: 50%;

    background: #10b981;

    color: #fff;

    font-size: 10px;
    font-weight: 850;

    box-shadow:
        0 4px 10px
        rgba(
            16,
            185,
            129,
            0.25
        );
}

.verification-company-details {
    min-width: 0;
}

.verification-company-name {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 9px;
}

.verification-company-name h2 {
    margin: 0;

    color: #172033;

    font-size: 22px;
    font-weight: 850;

    letter-spacing: -0.4px;
}

.verification-verified-badge {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding: 5px 9px;

    border: 1px solid #a7f3d0;
    border-radius: 999px;

    background: #ecfdf5;

    color: #047857;

    font-size: 9px;
    font-weight: 850;

    text-transform: uppercase;
}

.verification-verified-badge span {
    width: 14px;
    height: 14px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #10b981;

    color: #fff;

    font-size: 8px;
}

.verification-company-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 13px;

    margin-top: 8px;
}

.verification-company-meta span {
    color: #64748b;

    font-size: 10px;
    font-weight: 650;
}

.verification-company-meta b {
    margin-right: 4px;

    color: #6366f1;
}

.verification-company-details > p {
    margin: 6px 0 0;

    color: #94a3b8;

    font-size: 10px;
}


/* =========================================================
   HERO STATUS
========================================================= */

.verification-hero-status {
    width: 215px;

    flex-shrink: 0;

    padding-left: 22px;

    border-left: 1px solid #e7ecf2;
}

.verification-status-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.verification-status-top span {
    display: block;

    margin-bottom: 3px;

    color: #94a3b8;

    font-size: 9px;
    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: 0.7px;
}

.verification-status-top strong {
    color: #047857;

    font-size: 15px;
}

.verification-status-check {
    width: 32px;
    height: 32px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    background: #ecfdf5;

    color: #10b981;

    font-size: 14px;
    font-weight: 850;
}

.verification-mini-progress {
    height: 7px;

    overflow: hidden;

    margin: 10px 0 6px;

    border-radius: 999px;

    background: #e2e8f0;
}

.verification-mini-progress span {
    display: block;

    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            #6366f1,
            #4f46e5
        );

    transition: width 0.3s ease;
}

.verification-status-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.verification-status-bottom span {
    color: #94a3b8;

    font-size: 9px;
}

.verification-status-bottom strong {
    color: #4f46e5;

    font-size: 10px;
}


/* =========================================================
   MAIN CARD
========================================================= */

.verification-main-card {
    overflow: hidden;

    border: 1px solid #e2e8f0;
    border-radius: 18px;

    background: #fff;

    box-shadow:
        0 15px 45px
        rgba(
            15,
            23,
            42,
            0.06
        );
}


/* =========================================================
   SECTION
========================================================= */

.verification-section {
    padding: 29px 31px;

    border-bottom: 1px solid #edf1f5;
}

.verification-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 22px;
}

.verification-section-title {
    display: flex;
    align-items: flex-start;

    gap: 12px;
}

.verification-section-number {
    width: 36px;
    height: 36px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    font-size: 10px;
    font-weight: 850;
}

.verification-section-number.purple {
    color: #4f46e5;
    background: #eef2ff;
}

.verification-section-number.blue {
    color: #2563eb;
    background: #eff6ff;
}

.verification-section-number.green {
    color: #059669;
    background: #ecfdf5;
}

.verification-section-number.orange {
    color: #d97706;
    background: #fffbeb;
}

.verification-section-header h2 {
    margin: 0;

    color: #172033;

    font-size: 17px;
    font-weight: 820;
}

.verification-section-header p {
    margin: 4px 0 0;

    color: #94a3b8;

    font-size: 11px;

    line-height: 1.5;
}

.verification-edit-button {
    height: 34px;

    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding: 0 12px;

    border: 1px solid #dbe2ea;
    border-radius: 8px;

    background: #fff;
    color: #475569;

    font-family: inherit;

    font-size: 10px;
    font-weight: 750;

    cursor: pointer;

    transition: 0.2s ease;
}

.verification-edit-button:hover {
    border-color: #818cf8;

    background: #f8faff;

    color: #4f46e5;
}


/* =========================================================
   INFO GRID
========================================================= */

.verification-info-grid {
    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 1px;

    overflow: hidden;

    border: 1px solid #edf1f5;
    border-radius: 12px;

    background: #edf1f5;
}

.verification-info-item {
    min-width: 0;

    padding: 15px 17px;

    background: #fff;
}

.verification-info-label {
    display: block;

    margin-bottom: 6px;

    color: #94a3b8;

    font-size: 9px;
    font-weight: 800;

    letter-spacing: 0.6px;

    text-transform: uppercase;
}

.verification-info-item strong {
    display: block;

    overflow: hidden;

    color: #334155;

    font-size: 12px;
    font-weight: 700;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.verification-website-link {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    color: #4f46e5;

    font-size: 12px;
    font-weight: 750;

    text-decoration: none;
}

.verification-website-link:hover {
    text-decoration: underline;
}


/* =========================================================
   REPRESENTATIVE
========================================================= */

.verification-representative-card {
    display: flex;
    align-items: center;

    gap: 14px;

    padding: 17px;

    border: 1px solid #e8edf3;
    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            #fafbff,
            #fff
        );
}

.verification-representative-avatar {
    width: 50px;
    height: 50px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
        );

    color: #fff;

    font-size: 18px;
    font-weight: 800;

    box-shadow:
        0 7px 16px
        rgba(
            79,
            70,
            229,
            0.18
        );
}

.verification-representative-details {
    min-width: 0;
}

.verification-representative-details span {
    display: block;

    margin-bottom: 3px;

    color: #94a3b8;

    font-size: 9px;
    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: 0.6px;
}

.verification-representative-details strong {
    display: block;

    color: #334155;

    font-size: 14px;
}

.verification-representative-details small {
    display: block;

    margin-top: 4px;

    color: #94a3b8;

    font-size: 10px;
}

.verification-representative-status {
    margin-left: auto;

    padding: 7px 10px;

    border: 1px solid #a7f3d0;
    border-radius: 999px;

    background: #ecfdf5;

    color: #047857;

    font-size: 9px;
    font-weight: 800;
}


/* =========================================================
   ABOUT
========================================================= */

.verification-about-box {
    position: relative;

    padding: 22px 23px 22px 50px;

    border: 1px solid #e8edf3;
    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            #fafbff,
            #fff
        );
}

.verification-about-icon {
    position: absolute;

    left: 18px;
    top: 13px;

    color: #c7d2fe;

    font-family: Georgia, serif;

    font-size: 44px;
    line-height: 1;
}

.verification-about-box p {
    margin: 0;

    color: #475569;

    font-size: 13px;

    line-height: 1.75;
}


/* =========================================================
   APPROVED PHOTO
========================================================= */

.verification-approved-label {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding: 7px 10px;

    border: 1px solid #a7f3d0;
    border-radius: 999px;

    background: #ecfdf5;

    color: #047857;

    font-size: 9px;
    font-weight: 800;

    text-transform: uppercase;
}

.verification-photo-card {
    display: flex;
    align-items: center;

    gap: 21px;

    padding: 19px;

    border: 1px solid #e8edf3;
    border-radius: 14px;

    background:
        linear-gradient(
            135deg,
            #fafbff,
            #fff
        );
}

.verification-photo-large {
    position: relative;

    width: 125px;
    height: 125px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: visible;

    border: 1px solid #dfe5ec;
    border-radius: 15px;

    background: #fff;

    box-shadow:
        0 7px 20px
        rgba(
            15,
            23,
            42,
            0.06
        );
}

.verification-photo-large img {
    width: 100%;
    height: 100%;

    padding: 8px;

    object-fit: contain;

    border-radius: 15px;
}

.verification-photo-large > div {
    font-size: 43px;
}

.verification-photo-check {
    position: absolute;

    right: -7px;
    bottom: -7px;

    width: 27px;
    height: 27px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 3px solid #fff;
    border-radius: 50%;

    background: #10b981;

    color: #fff;

    font-size: 10px;
    font-weight: 850;
}

.verification-photo-content {
    min-width: 0;
}

.verification-photo-status {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    margin-bottom: 7px;

    color: #059669;

    font-size: 10px;
    font-weight: 800;
}

.verification-photo-status span {
    width: 16px;
    height: 16px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #10b981;

    color: white;

    font-size: 8px;
}

.verification-photo-content h3 {
    margin: 0;

    color: #334155;

    font-size: 14px;
}

.verification-photo-content p {
    max-width: 650px;

    margin: 5px 0;

    color: #64748b;

    font-size: 11px;

    line-height: 1.55;
}

.verification-photo-content small {
    display: block;

    color: #94a3b8;

    font-size: 9px;
}


/* =========================================================
   VERIFICATION CONFIRMATION
========================================================= */

.verification-confirmation {
    display: flex;
    align-items: center;

    gap: 14px;

    margin: 23px 31px;

    padding: 18px;

    border: 1px solid #a7f3d0;
    border-radius: 14px;

    background:
        linear-gradient(
            135deg,
            #ecfdf5,
            #f0fdf4
        );
}

.verification-confirmation-icon {
    width: 39px;
    height: 39px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: #10b981;

    color: white;

    font-size: 16px;
    font-weight: 850;

    box-shadow:
        0 6px 14px
        rgba(
            16,
            185,
            129,
            0.18
        );
}

.verification-confirmation-content {
    min-width: 0;

    flex: 1;
}

.verification-confirmation-label {
    display: block;

    margin-bottom: 3px;

    color: #059669;

    font-size: 8px;
    font-weight: 850;

    letter-spacing: 0.8px;
}

.verification-confirmation-content strong {
    display: block;

    color: #047857;

    font-size: 13px;
}

.verification-confirmation-content p {
    margin: 3px 0 0;

    color: #64748b;

    font-size: 10px;

    line-height: 1.5;
}

.verification-confirmation-badge {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding: 7px 10px;

    border: 1px solid #a7f3d0;
    border-radius: 999px;

    background: #fff;

    color: #047857;

    font-size: 9px;
    font-weight: 850;
}

.verification-confirmation-badge span {
    color: #10b981;
}


/* =========================================================
   EDIT FORM
========================================================= */

.verification-edit-grid {
    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 17px;
}

.verification-field {
    display: flex;
    flex-direction: column;

    min-width: 0;
}

.verification-field.full {
    grid-column: 1 / -1;
}

.verification-field label {
    margin-bottom: 7px;

    color: #334155;

    font-size: 10px;
    font-weight: 800;
}

.verification-field label span {
    margin-left: 3px;

    color: #ef4444;
}

.verification-field input,
.verification-field textarea {
    width: 100%;

    padding: 11px 12px;

    border: 1px solid #d8e0ea;
    border-radius: 9px;

    outline: none;

    background: #fff;
    color: #172033;

    font-family: inherit;

    font-size: 12px;

    transition: 0.2s ease;
}

.verification-field input {
    height: 42px;
}

.verification-field textarea {
    min-height: 110px;

    resize: vertical;

    line-height: 1.5;
}

.verification-field input::placeholder,
.verification-field textarea::placeholder {
    color: #a0aec0;
}

.verification-field input:focus,
.verification-field textarea:focus {
    border-color: #6366f1;

    box-shadow:
        0 0 0 3px
        rgba(
            99,
            102,
            241,
            0.10
        );
}


/* =========================================================
   EDIT ACTIONS
========================================================= */

.verification-edit-actions {
    grid-column: 1 / -1;

    display: flex;
    justify-content: flex-end;

    gap: 8px;

    padding-top: 3px;
}

.verification-cancel-button,
.verification-save-button {
    height: 39px;

    padding: 0 16px;

    border-radius: 8px;

    font-family: inherit;

    font-size: 10px;
    font-weight: 800;

    cursor: pointer;

    transition: 0.2s ease;
}

.verification-cancel-button {
    border: 1px solid #d8e0ea;

    background: #fff;

    color: #475569;
}

.verification-cancel-button:hover {
    background: #f8fafc;
}

.verification-save-button {
    display: inline-flex;
    align-items: center;

    gap: 7px;

    border: 1px solid #4f46e5;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
        );

    color: white;

    box-shadow:
        0 5px 14px
        rgba(
            79,
            70,
            229,
            0.18
        );
}

.verification-save-button:hover:not(:disabled) {
    transform: translateY(-1px);
}

.verification-save-button:disabled,
.verification-cancel-button:disabled {
    opacity: 0.6;

    cursor: not-allowed;
}

.verification-small-spinner {
    width: 12px;
    height: 12px;

    border: 2px solid
        rgba(
            255,
            255,
            255,
            0.4
        );

    border-top-color: #fff;

    border-radius: 50%;

    animation:
        verificationSpin
        0.7s linear infinite;
}


/* =========================================================
   BOTTOM ACTIONS
========================================================= */

.verification-bottom-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    padding: 18px 31px;

    border-top: 1px solid #edf1f5;

    background:
        linear-gradient(
            180deg,
            #fbfcfe,
            #f8fafc
        );
}

.verification-secondary-button,
.verification-primary-button {
    height: 42px;

    display: inline-flex;
    align-items: center;

    gap: 7px;

    padding: 0 16px;

    border-radius: 9px;

    font-family: inherit;

    font-size: 11px;
    font-weight: 800;

    cursor: pointer;

    transition: 0.2s ease;
}

.verification-secondary-button {
    border: 1px solid #d8e0ea;

    background: #fff;

    color: #475569;
}

.verification-secondary-button:hover {
    border-color: #b9c5d4;

    background: #f8fafc;
}

.verification-primary-button {
    border: 1px solid #4f46e5;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
        );

    color: #fff;

    box-shadow:
        0 6px 16px
        rgba(
            79,
            70,
            229,
            0.18
        );
}

.verification-primary-button:hover {
    transform: translateY(-1px);

    background:
        linear-gradient(
            135deg,
            #4f46e5,
            #4338ca
        );
}


/* =========================================================
   MODAL OVERLAY
========================================================= */

.verification-modal-overlay {
    position: fixed;

    inset: 0;

    z-index: 3000;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background:
        rgba(
            15,
            23,
            42,
            0.60
        );

    backdrop-filter: blur(6px);
}


/* =========================================================
   PROGRESS MODAL
========================================================= */

.verification-progress-modal {
    position: relative;

    width: min(480px, 100%);

    max-height: 91vh;

    overflow-y: auto;

    padding: 28px;

    border: 1px solid rgba(
        255,
        255,
        255,
        0.6
    );

    border-radius: 20px;

    background: #fff;

    box-shadow:
        0 30px 90px
        rgba(
            15,
            23,
            42,
            0.30
        );

    animation:
        verificationModalIn
        0.22s ease;
}

@keyframes verificationModalIn {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.verification-modal-close {
    position: absolute;

    top: 14px;
    right: 14px;

    width: 32px;
    height: 32px;

    border: none;
    border-radius: 50%;

    background: #f1f5f9;

    color: #64748b;

    font-size: 20px;

    cursor: pointer;

    transition: 0.2s ease;
}

.verification-modal-close:hover {
    background: #e2e8f0;

    color: #334155;

    transform: rotate(90deg);
}

.verification-modal-header {
    text-align: center;
}

.verification-modal-header > span {
    color: #6366f1;

    font-size: 9px;
    font-weight: 850;

    letter-spacing: 1px;
}

.verification-modal-header h2 {
    margin: 5px 0 5px;

    color: #172033;

    font-size: 21px;

    letter-spacing: -0.3px;
}

.verification-modal-header p {
    max-width: 350px;

    margin: 0 auto;

    color: #64748b;

    font-size: 11px;

    line-height: 1.5;
}


/* =========================================================
   PIE CHART
========================================================= */

.verification-pie-wrapper {
    display: flex;
    justify-content: center;

    margin: 23px 0 18px;
}

.verification-pie-chart {
    --completion: 0%;

    width: 150px;
    height: 150px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background:
        conic-gradient(
            #4f46e5
            var(--completion),
            #e2e8f0
            0
        );

    box-shadow:
        0 12px 30px
        rgba(
            79,
            70,
            229,
            0.14
        );

    animation:
        verificationPieIn
        0.8s ease;
}

@keyframes verificationPieIn {
    from {
        transform: scale(0.85) rotate(-20deg);
        opacity: 0.4;
    }

    to {
        transform: scale(1) rotate(0);
        opacity: 1;
    }
}

.verification-pie-chart::before {
    content: "";

    position: absolute;
}

.verification-pie-center {
    width: 112px;
    height: 112px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #fff;

    box-shadow:
        inset 0 0 0 1px #f1f5f9;
}

.verification-pie-center strong {
    color: #172033;

    font-size: 28px;
    font-weight: 850;

    letter-spacing: -1px;
}

.verification-pie-center span {
    margin-top: 1px;

    color: #94a3b8;

    font-size: 9px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: 0.5px;
}


/* =========================================================
   PIE LEGEND
========================================================= */

.verification-pie-legend {
    display: grid;

    grid-template-columns:
        repeat(2, 1fr);

    gap: 9px;

    margin-bottom: 15px;
}

.verification-pie-legend > div {
    display: flex;
    align-items: center;

    gap: 7px;

    padding: 11px 12px;

    border: 1px solid #edf1f5;
    border-radius: 9px;

    background: #f8fafc;

    color: #64748b;

    font-size: 10px;
}

.verification-pie-legend strong {
    margin-left: auto;

    color: #334155;

    font-size: 13px;
}

.legend-dot {
    width: 8px;
    height: 8px;

    flex-shrink: 0;

    border-radius: 50%;
}

.legend-dot.completed {
    background: #10b981;
}

.legend-dot.remaining {
    background: #f59e0b;
}


/* =========================================================
   MODAL PROGRESS LIST
========================================================= */

.verification-progress-list {
    margin-bottom: 17px;

    padding: 0 4px;
}

.verification-progress-item {
    display: flex;
    align-items: center;

    gap: 9px;

    padding: 9px 0;

    border-bottom: 1px solid #eef2f7;

    font-size: 11px;
}

.verification-progress-check {
    width: 20px;
    height: 20px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 1px solid #cbd5e1;

    border-radius: 50%;

    color: white;

    font-size: 9px;
}

.verification-progress-check.completed {
    border-color: #10b981;

    background: #10b981;
}

.verification-progress-label {
    color: #475569;
}

.verification-progress-status {
    margin-left: auto;

    font-size: 9px;
    font-weight: 800;
}

.verification-progress-status.done {
    color: #059669;
}

.verification-progress-status.pending {
    color: #d97706;
}


/* =========================================================
   MODAL BUTTON
========================================================= */

.verification-modal-continue {
    width: 100%;

    height: 42px;

    border: none;
    border-radius: 9px;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
        );

    color: white;

    font-family: inherit;

    font-size: 11px;
    font-weight: 800;

    cursor: pointer;

    box-shadow:
        0 7px 18px
        rgba(
            79,
            70,
            229,
            0.18
        );

    transition: 0.2s ease;
}

.verification-modal-continue:hover {
    transform: translateY(-1px);

    background:
        linear-gradient(
            135deg,
            #4f46e5,
            #4338ca
        );
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 850px) {

    .company-verification-page {
        padding: 23px 17px 35px;
    }

    .verification-page-header {
        align-items: flex-start;

        flex-direction: column;
    }

    .verification-progress-button {
        width: 100%;

        justify-content: center;
    }

    .verification-hero {
        align-items: flex-start;

        flex-direction: column;
    }

    .verification-hero-status {
        width: 100%;

        padding-left: 0;
        padding-top: 16px;

        border-left: none;
        border-top: 1px solid #e7ecf2;
    }

    .verification-info-grid {
        grid-template-columns: 1fr;
    }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

    .company-verification-page {
        padding: 17px 10px 28px;
    }

    .verification-title-row {
        align-items: flex-start;
    }

    .verification-title-icon {
        width: 39px;
        height: 39px;

        border-radius: 11px;

        font-size: 17px;
    }

    .verification-header-left h1 {
        font-size: 25px;
    }

    .verification-header-left p {
        font-size: 10px;
    }

    .verification-hero {
        padding: 19px;
    }

    .verification-hero-main {
        align-items: flex-start;
    }

    .verification-company-logo {
        width: 66px;
        height: 66px;
    }

    .verification-company-name {
        align-items: flex-start;

        flex-direction: column;

        gap: 6px;
    }

    .verification-company-name h2 {
        font-size: 18px;
    }

    .verification-company-meta {
        flex-direction: column;

        align-items: flex-start;

        gap: 5px;
    }

    .verification-section {
        padding: 23px 17px;
    }

    .verification-section-header {
        gap: 12px;
    }

    .verification-section-header h2 {
        font-size: 15px;
    }

    .verification-section-header p {
        font-size: 10px;
    }

    .verification-edit-grid {
        grid-template-columns: 1fr;
    }

    .verification-field.full {
        grid-column: auto;
    }

    .verification-edit-actions {
        grid-column: auto;

        flex-direction: column-reverse;
    }

    .verification-cancel-button,
    .verification-save-button {
        width: 100%;
    }

    .verification-representative-card {
        align-items: flex-start;

        flex-wrap: wrap;
    }

    .verification-representative-status {
        width: 100%;

        margin-left: 64px;

        text-align: center;
    }

    .verification-photo-card {
        align-items: flex-start;

        flex-direction: column;
    }

    .verification-photo-large {
        width: 100%;
        height: 175px;
    }

    .verification-confirmation {
        align-items: flex-start;

        margin: 17px;

        flex-wrap: wrap;
    }

    .verification-confirmation-badge {
        margin-left: 53px;
    }

    .verification-bottom-actions {
        padding: 16px 17px;

        flex-direction: column-reverse;
    }

    .verification-secondary-button,
    .verification-primary-button {
        width: 100%;

        justify-content: center;
    }

    .verification-progress-modal {
        padding: 23px 17px;
    }

    .verification-pie-chart {
        width: 135px;
        height: 135px;
    }

    .verification-pie-center {
        width: 101px;
        height: 101px;
    }

    .verification-pie-center strong {
        font-size: 25px;
    }

    .verification-pie-legend {
        grid-template-columns: 1fr;
    }

}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 400px) {

    .verification-page-header {
        margin-bottom: 15px;
    }

    .verification-title-icon {
        display: none;
    }

    .verification-company-logo {
        width: 58px;
        height: 58px;
    }

    .verification-company-name h2 {
        font-size: 16px;
    }

    .verification-verified-badge {
        font-size: 8px;
    }

    .verification-section-number {
        width: 31px;
        height: 31px;
    }

    .verification-section-title {
        gap: 9px;
    }

    .verification-section-header h2 {
        font-size: 14px;
    }

    .verification-edit-button {
        padding: 0 9px;

        font-size: 9px;
    }

}

`;

export default CompanyVerification;