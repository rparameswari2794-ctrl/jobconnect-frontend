import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BACKEND_ORIGIN = API_BASE.replace(
    /\/api\/?$/,
    ""
);

const PROFILE_API = `${API_BASE}/auth/employer/profile/`;


function EmployerProfile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        company_name: "",
        contact_name: "",
        representative_position: "",
        phone: "",
        company_email: "",
        company_description: "",
        website: "",
        location: "",
    });

    const [companyLogo, setCompanyLogo] = useState(null);

    const [gstCertificate, setGstCertificate] =
        useState(null);

    const [registrationCertificate, setRegistrationCertificate] =
        useState(null);

    const [authorizationLetter, setAuthorizationLetter] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingSection, setEditingSection] =
        useState(null);


    /* =========================================================
       TOKEN
    ========================================================= */

    function getToken() {
        return localStorage.getItem("jc_token");
    }


    /* =========================================================
       MEDIA URL
    ========================================================= */

    function getMediaUrl(url) {

        if (!url) {
            return "";
        }

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {
            return url;
        }

        if (url.startsWith("/")) {
            return `${BACKEND_ORIGIN}${url}`;
        }

        return `${BACKEND_ORIGIN}/${url}`;
    }


    /* =========================================================
       LOAD PROFILE
    ========================================================= */

    useEffect(() => {
        loadProfile();
    }, []);


    async function loadProfile() {

        const token = getToken();

        if (!token) {
            navigate("/login");
            return;
        }

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                PROFILE_API,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json().catch(
                    () => ({})
                );

            console.log(
                "EMPLOYER PROFILE:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load employer profile."
                );
            }

            setProfile(data);

            setFormDataFromProfile(data);

        } catch (err) {

            console.error(
                "LOAD PROFILE ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load employer profile."
            );

        } finally {

            setLoading(false);
        }
    }


    /* =========================================================
       SET FORM DATA
    ========================================================= */

    function setFormDataFromProfile(data) {

        setFormData({

            company_name:
                data.company_name || "",

            contact_name:
                data.contact_name || "",

            representative_position:
                data.representative_position || "",

            phone:
                data.phone || "",

            company_email:
                data.company_email ||
                data.email ||
                "",

            company_description:
                data.company_description || "",

            website:
                data.website || "",

            location:
                data.location || "",
        });
    }


    /* =========================================================
       HANDLE INPUT
    ========================================================= */

    function handleChange(e) {

        const {
            name,
            value
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    }


    /* =========================================================
       DOCUMENT CHANGE
    ========================================================= */

    function handleDocumentChange(
        e,
        setter
    ) {

        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        setter(file);

        setError("");
        setSuccess("");
    }


    /* =========================================================
       AUTHORIZATION LETTER
    ========================================================= */

    function requiresAuthorizationLetter() {

        const position =
            formData.representative_position;

        return (
            position !== "" &&
            position !== "director" &&
            position !== "ceo" &&
            position !== "proprietor"
        );
    }


    /* =========================================================
       START EDITING
    ========================================================= */

    function startEditing(section) {

        if (
            profile?.approval_status === "pending" &&
            profile?.profile_completed
        ) {
            return;
        }

        setEditingSection(section);

        setError("");
        setSuccess("");
    }


    /* =========================================================
       CANCEL EDIT
    ========================================================= */

    function cancelEditing() {

        setEditingSection(null);

        if (profile) {
            setFormDataFromProfile(profile);
        }

        setCompanyLogo(null);
        setGstCertificate(null);
        setRegistrationCertificate(null);
        setAuthorizationLetter(null);

        setError("");
        setSuccess("");
    }


    /* =========================================================
       VALIDATION
    ========================================================= */

    function validateForm() {

        if (!formData.company_name.trim()) {
            return "Company name is required.";
        }

        if (!formData.company_email.trim()) {
            return "Company email is required.";
        }

        if (!formData.phone.trim()) {
            return "Phone number is required.";
        }

        if (!formData.location.trim()) {
            return "Company location is required.";
        }

        if (!formData.company_description.trim()) {
            return "Company description is required.";
        }

        if (!formData.contact_name.trim()) {
            return "Representative name is required.";
        }

        if (!formData.representative_position) {
            return "Please select the representative position.";
        }

        if (
            requiresAuthorizationLetter() &&
            !authorizationLetter &&
            !profile?.authorization_letter
        ) {

            return (
                "Authorization Letter is required when " +
                "the representative is not a Director, CEO, or Proprietor."
            );
        }

        return "";
    }


    /* =========================================================
       SUBMIT / SAVE
    ========================================================= */

    async function handleSubmit(e) {

        if (e) {
            e.preventDefault();
        }

        const token = getToken();

        if (!token) {

            setError(
                "Please log in as an employer."
            );

            return;
        }

        if (
            profile?.approval_status === "pending" &&
            profile?.profile_completed
        ) {

            setError(
                "Your company profile is waiting for admin approval and is currently locked."
            );

            return;
        }

        const validationError =
            validateForm();

        if (validationError) {

            setError(
                validationError
            );

            return;
        }

        try {

            setSaving(true);
            setError("");
            setSuccess("");

            const data =
                new FormData();

            data.append(
                "company_name",
                formData.company_name.trim()
            );

            data.append(
                "contact_name",
                formData.contact_name.trim()
            );

            data.append(
                "representative_position",
                formData.representative_position
            );

            data.append(
                "phone",
                formData.phone.trim()
            );

            data.append(
                "company_email",
                formData.company_email.trim()
            );

            data.append(
                "company_description",
                formData.company_description.trim()
            );

            data.append(
                "website",
                formData.website.trim()
            );

            data.append(
                "location",
                formData.location.trim()
            );

            if (companyLogo) {

                data.append(
                    "company_logo",
                    companyLogo
                );
            }

            if (gstCertificate) {

                data.append(
                    "company_gst_certificate",
                    gstCertificate
                );
            }

            if (registrationCertificate) {

                data.append(
                    "company_registration_certificate",
                    registrationCertificate
                );
            }

            if (authorizationLetter) {

                data.append(
                    "authorization_letter",
                    authorizationLetter
                );
            }

            const response =
                await fetch(
                    PROFILE_API,
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
                await response.json().catch(
                    () => ({})
                );

            console.log(
                "UPDATED EMPLOYER PROFILE:",
                result
            );

            if (!response.ok) {

                let message =
                    result.detail ||
                    result.message;

                if (!message) {

                    message =
                        Object.values(result)
                            .flat()
                            .join(" ");
                }

                throw new Error(
                    message ||
                    "Unable to update company profile."
                );
            }

            setProfile(result);

            setFormDataFromProfile(result);

            setCompanyLogo(null);
            setGstCertificate(null);
            setRegistrationCertificate(null);
            setAuthorizationLetter(null);

            setEditingSection(null);

            if (
                result.approval_status === "pending"
            ) {

                setSuccess(
                    "Your company profile has been submitted again for admin verification."
                );

            } else {

                setSuccess(
                    "Company profile updated successfully."
                );
            }

            await loadProfile();

        } catch (err) {

            console.error(
                "SUBMIT PROFILE ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to update company profile."
            );

        } finally {

            setSaving(false);
        }
    }


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (
            <>
                <style>{PROFILE_STYLES}</style>

                <div className="employer-profile-page">

                    <main className="employer-profile-main">

                        <div className="profile-loading">

                            <div className="loading-spinner"></div>

                            <h3>
                                Loading Employer Company Profile
                            </h3>

                            <p>
                                Please wait while we load your company information.
                            </p>

                        </div>

                    </main>

                </div>
            </>
        );
    }


    /* =========================================================
       ERROR WITHOUT PROFILE
    ========================================================= */

    if (error && !profile) {

        return (
            <>
                <style>{PROFILE_STYLES}</style>

                <div className="employer-profile-page">

                    <main className="employer-profile-main">

                        <div className="profile-error error-center">
                            <span className="message-icon">!</span>
                            <div>{error}</div>
                        </div>

                        <button
                            type="button"
                            className="profile-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/employer/dashboard"
                                )
                            }
                        >
                            ← Back to Dashboard
                        </button>

                    </main>

                </div>
            </>
        );
    }


    /* =========================================================
       STATUS
    ========================================================= */

    const approvalStatus =
        String(
            profile?.approval_status || ""
        )
            .toLowerCase()
            .trim();


    const profileCompleted =
        profile?.profile_completed === true;


    /* =========================================================
       PENDING PROFILE
    ========================================================= */

    if (
        profileCompleted &&
        approvalStatus === "pending"
    ) {

        return (
            <>
                <style>{PROFILE_STYLES}</style>

                <div className="employer-profile-page">

                    <main className="employer-profile-main">

                        <section className="profile-page-heading">

                            <div className="heading-icon">
                                🏢
                            </div>

                            <div>
                                <span className="heading-label">
                                    EMPLOYER ACCOUNT
                                </span>

                                <h1>
                                    Employer Company Profile
                                </h1>

                                <p>
                                    Your company profile has been submitted
                                    for admin verification.
                                </p>
                            </div>

                        </section>


                        {error && (
                            <div className="profile-error">
                                <span>!</span>
                                {error}
                            </div>
                        )}


                        <section className="profile-status-card pending-card">

                            <div className="status-circle pending-circle">
                                ⏳
                            </div>

                            <h2>
                                Company Profile Submitted
                            </h2>

                            <p className="status-description">
                                Your company information and verification
                                documents have been successfully submitted.
                            </p>

                            <div className="pending-status">
                                <span className="status-dot"></span>
                                Pending Admin Approval
                            </div>

                            <div className="profile-lock-box">
                                <span className="lock-icon">🔒</span>

                                <div>
                                    <strong>
                                        Profile temporarily locked
                                    </strong>

                                    <p>
                                        Your company profile is currently
                                        locked while the administrator
                                        verifies your information.
                                    </p>
                                </div>
                            </div>

                            <p className="status-note">
                                You cannot edit your company details or
                                verification documents until the administrator
                                completes verification.
                            </p>

                        </section>


                        <div className="profile-bottom-actions">

                            <button
                                type="button"
                                className="profile-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/employer/dashboard"
                                    )
                                }
                            >
                                ← Back to Dashboard
                            </button>

                        </div>

                    </main>
                </div>
            </>
        );
    }


    /* =========================================================
       APPROVED PROFILE
    ========================================================= */

    if (
        profileCompleted &&
        approvalStatus === "approved"
    ) {

        return (
            <>
                <style>{PROFILE_STYLES}</style>

                <div className="employer-profile-page">

                    <main className="employer-profile-main">

                        {/* HEADER */}

                        {/* <section className="profile-page-heading approved-heading">

                            <div className="heading-icon verified-heading-icon">
                                ✓
                            </div>

                            <div className="heading-text">

                                <span className="heading-label">
                                    VERIFIED EMPLOYER
                                </span>

                                <h1>
                                    Employer Company Profile
                                </h1>

                                <p>
                                    Manage your verified company information,
                                    representative details and documents.
                                </p>

                            </div>

                            <div className="verified-pill">
                                ✓ Verified
                            </div>

                        </section> */}


                        {error && (
                            <div className="profile-error">
                                <span>!</span>
                                {error}
                            </div>
                        )}


                        {success && (
                            <div className="profile-success">
                                <span>✓</span>
                                {success}
                            </div>
                        )}


                        {/* COMPANY SUMMARY */}

                        <section className="company-summary-card">

                            <div className="company-summary-logo">

                                {profile.company_logo ? (

                                    <img
                                        src={getMediaUrl(
                                            profile.company_logo
                                        )}
                                        alt={
                                            profile.company_name
                                        }
                                    />

                                ) : (

                                    <div className="company-placeholder">
                                        🏢
                                    </div>

                                )}

                            </div>


                            <div className="company-summary-info">

                                <span>
                                    VERIFIED COMPANY
                                </span>

                                <h2>
                                    {profile.company_name ||
                                        "Company Name"}
                                </h2>

                                <p>
                                    📍 {profile.location || "Location not available"}
                                </p>

                            </div>


                            <div className="company-summary-status">

                                <div className="verified-check">
                                    ✓
                                </div>

                                <strong>
                                    Verified
                                </strong>

                                <small>
                                    
                                </small>

                            </div>

                        </section>


                        {/* COMPANY INFORMATION */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    🏢
                                </div>

                                <div>

                                    <h2>
                                        Company Information
                                    </h2>

                                    <p>
                                        Official company details
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="section-edit-button"
                                    onClick={() =>
                                        startEditing("company")
                                    }
                                >
                                    ✎ Edit
                                </button>

                            </div>


                            {editingSection === "company" ? (

                                <>

                                    <div className="profile-grid">

                                        <ProfileInput
                                            label="Company Name"
                                            name="company_name"
                                            value={
                                                formData.company_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <ProfileInput
                                            label="Company Email"
                                            type="email"
                                            name="company_email"
                                            value={
                                                formData.company_email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <ProfileInput
                                            label="Phone"
                                            type="tel"
                                            name="phone"
                                            value={
                                                formData.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <ProfileInput
                                            label="Website"
                                            type="url"
                                            name="website"
                                            value={
                                                formData.website
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                        />

                                    </div>


                                    <SectionButtons
                                        saving={saving}
                                        onCancel={cancelEditing}
                                        onSave={handleSubmit}
                                    />

                                </>

                            ) : (

                                <div className="profile-details-grid">

                                    <Detail
                                        label="Company Name"
                                        value={
                                            profile.company_name
                                        }
                                    />

                                    <Detail
                                        label="Company Email"
                                        value={
                                            profile.company_email ||
                                            profile.email
                                        }
                                    />

                                    <Detail
                                        label="Phone"
                                        value={
                                            profile.phone
                                        }
                                    />

                                    <Detail
                                        label="Location"
                                        value={
                                            profile.location
                                        }
                                    />


                                    <div className="profile-detail-item">

                                        <label>
                                            Website
                                        </label>

                                        {profile.website ? (

                                            <a
                                                href={
                                                    profile.website.startsWith(
                                                        "http"
                                                    )
                                                        ? profile.website
                                                        : `https://${profile.website}`
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit Website ↗
                                            </a>

                                        ) : (
                                            <p>-</p>
                                        )}

                                    </div>

                                </div>
                            )}

                        </section>


                        {/* REPRESENTATIVE */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    👤
                                </div>

                                <div>

                                    <h2>
                                        Company Representative
                                    </h2>

                                    <p>
                                        Person responsible for hiring
                                        and company representation.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="section-edit-button"
                                    onClick={() =>
                                        startEditing(
                                            "representative"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>

                            </div>


                            {editingSection === "representative" ? (

                                <>

                                    <div className="profile-grid">

                                        <ProfileInput
                                            label="Representative Name"
                                            name="contact_name"
                                            value={
                                                formData.contact_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />


                                        <div className="profile-field">

                                            <label>
                                                Position
                                            </label>

                                            <select
                                                name="representative_position"
                                                value={
                                                    formData.representative_position
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="">
                                                    Select position
                                                </option>

                                                <option value="director">
                                                    Director
                                                </option>

                                                <option value="ceo">
                                                    CEO
                                                </option>

                                                <option value="proprietor">
                                                    Proprietor
                                                </option>

                                                <option value="hr">
                                                    HR
                                                </option>

                                                <option value="manager">
                                                    Manager
                                                </option>

                                                <option value="authorized_person">
                                                    Authorized Person
                                                </option>

                                                <option value="other">
                                                    Other
                                                </option>

                                            </select>

                                        </div>

                                    </div>


                                    {requiresAuthorizationLetter() && (

                                        <div className="authorization-notice">

                                            <strong>
                                                ⚠ Authorization Letter Required
                                            </strong>

                                            <p>
                                                Since the representative is
                                                not a Director, CEO, or
                                                Proprietor, an authorization
                                                letter from the company is
                                                required.
                                            </p>

                                        </div>

                                    )}


                                    <SectionButtons
                                        saving={saving}
                                        onCancel={cancelEditing}
                                        onSave={handleSubmit}
                                    />

                                </>

                            ) : (

                                <div className="profile-details-grid">

                                    <Detail
                                        label="Representative"
                                        value={
                                            profile.contact_name
                                        }
                                    />

                                    <Detail
                                        label="Position"
                                        value={
                                            getPositionLabel(
                                                profile.representative_position
                                            )
                                        }
                                    />

                                </div>

                            )}

                        </section>


                        {/* DESCRIPTION */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    📝
                                </div>

                                <div>

                                    <h2>
                                        About the Company
                                    </h2>

                                    <p>
                                        Company overview and description
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="section-edit-button"
                                    onClick={() =>
                                        startEditing(
                                            "description"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>

                            </div>


                            {editingSection === "description" ? (

                                <>

                                    <div className="profile-field">

                                        <label>
                                            Company Description
                                        </label>

                                        <textarea
                                            name="company_description"
                                            rows="7"
                                            value={
                                                formData.company_description
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <SectionButtons
                                        saving={saving}
                                        onCancel={cancelEditing}
                                        onSave={handleSubmit}
                                    />

                                </>

                            ) : (

                                <div className="company-description">

                                    <p>
                                        {profile.company_description ||
                                            "No company description available."}
                                    </p>

                                </div>

                            )}

                        </section>


                        {/* LOGO */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    🖼
                                </div>

                                <div>

                                    <h2>
                                        Company Logo
                                    </h2>

                                    <p>
                                        Your official company branding
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="section-edit-button"
                                    onClick={() =>
                                        startEditing("logo")
                                    }
                                >
                                    ✎ Edit
                                </button>

                            </div>


                            {editingSection === "logo" ? (

                                <>

                                    <div className="profile-logo-upload">

                                        <div className="logo-upload-info">

                                            <div className="upload-icon">
                                                🖼
                                            </div>

                                            <div>

                                                <label>
                                                    Upload company logo
                                                </label>

                                                <p>
                                                    JPG, JPEG or PNG
                                                </p>

                                            </div>

                                        </div>


                                        <label className="logo-upload-button">

                                            {companyLogo
                                                ? "Change Logo"
                                                : "Upload Logo"}

                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                                hidden
                                                onChange={(e) =>
                                                    handleDocumentChange(
                                                        e,
                                                        setCompanyLogo
                                                    )
                                                }
                                            />

                                        </label>

                                    </div>


                                    {companyLogo && (

                                        <p className="uploaded-logo">
                                            ✓ {companyLogo.name}
                                        </p>

                                    )}


                                    <SectionButtons
                                        saving={saving}
                                        onCancel={cancelEditing}
                                        onSave={handleSubmit}
                                    />

                                </>

                            ) : (

                                <div className="existing-logo-preview">

                                    {profile.company_logo ? (

                                        <img
                                            src={getMediaUrl(
                                                profile.company_logo
                                            )}
                                            alt="Company logo"
                                        />

                                    ) : (

                                        <div className="approved-photo-placeholder">
                                            🏢
                                        </div>

                                    )}

                                </div>

                            )}

                        </section>


                        {/* DOCUMENTS */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    📄
                                </div>

                                <div>

                                    <h2>
                                        Verification Documents
                                    </h2>

                                    <p>
                                        Documents submitted for company
                                        verification.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="section-edit-button"
                                    onClick={() =>
                                        startEditing(
                                            "documents"
                                        )
                                    }
                                >
                                    ✎ Edit
                                </button>

                            </div>


                            {editingSection === "documents" ? (

                                <>

                                    <DocumentUpload
                                        title="Company GST Certificate"
                                        file={gstCertificate}
                                        setFile={setGstCertificate}
                                        existing={
                                            profile.company_gst_certificate
                                        }
                                        getMediaUrl={getMediaUrl}
                                        required={true}
                                    />


                                    <DocumentUpload
                                        title="Company Registration Certificate"
                                        file={registrationCertificate}
                                        setFile={setRegistrationCertificate}
                                        existing={
                                            profile.company_registration_certificate
                                        }
                                        getMediaUrl={getMediaUrl}
                                        required={true}
                                    />


                                    <DocumentUpload
                                        title="Authorization Letter"
                                        file={authorizationLetter}
                                        setFile={setAuthorizationLetter}
                                        existing={
                                            profile.authorization_letter
                                        }
                                        getMediaUrl={getMediaUrl}
                                        required={
                                            requiresAuthorizationLetter()
                                        }
                                        description={
                                            requiresAuthorizationLetter()
                                                ? "Required because the representative is not a Director, CEO, or Proprietor."
                                                : "Required only when the representative is not a Director, CEO, or Proprietor."
                                        }
                                    />


                                    <SectionButtons
                                        saving={saving}
                                        onCancel={cancelEditing}
                                        onSave={handleSubmit}
                                    />

                                </>

                            ) : (

                                <div className="verification-documents-list">

                                    <DocumentView
                                        title="Company GST Certificate"
                                        file={
                                            profile.company_gst_certificate
                                        }
                                        getMediaUrl={getMediaUrl}
                                    />

                                    <DocumentView
                                        title="Company Registration Certificate"
                                        file={
                                            profile.company_registration_certificate
                                        }
                                        getMediaUrl={getMediaUrl}
                                    />

                                    <DocumentView
                                        title="Authorization Letter"
                                        file={
                                            profile.authorization_letter
                                        }
                                        getMediaUrl={getMediaUrl}
                                    />

                                </div>

                            )}

                        </section>


                        {/* ACTIONS */}

                        <div className="profile-bottom-actions">

                            <button
                                type="button"
                                className="profile-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/employer/dashboard"
                                    )
                                }
                            >
                                ← Back to Dashboard
                            </button>


                            <button
                                type="button"
                                className="profile-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/employer/jobs"
                                    )
                                }
                            >
                                Manage Jobs →
                            </button>

                        </div>

                    </main>

                </div>
            </>
        );
    }


    /* =========================================================
       NEW / REJECTED PROFILE
    ========================================================= */

    return (

        <>
            <style>{PROFILE_STYLES}</style>

            <div className="employer-profile-page">

                <main className="employer-profile-main">

                    <section className="profile-page-heading">

                        <div className="heading-icon">
                            🏢
                        </div>

                        <div>

                            <span className="heading-label">
                                EMPLOYER ACCOUNT
                            </span>

                            <h1>
                                Employer Company Profile
                            </h1>

                            <p>

                                {approvalStatus === "rejected"

                                    ? "Your company profile was rejected. Please correct the information and submit it again."

                                    : "Complete your company details before posting jobs."
                                }

                            </p>

                        </div>

                    </section>


                    {approvalStatus === "rejected" && (

                        <div className="profile-error">

                            <span>!</span>

                            <div>

                                <strong>
                                    Company Profile Rejected
                                </strong>

                                <br />

                                {profile?.rejection_reason ||
                                    "Please review your company information and submit it again."}

                            </div>

                        </div>

                    )}


                    {error && (
                        <div className="profile-error">
                            <span>!</span>
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="profile-success">
                            <span>✓</span>
                            {success}
                        </div>
                    )}


                    <form
                        className="employer-profile-card"
                        onSubmit={handleSubmit}
                    >

                        {/* COMPANY INFORMATION */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    🏢
                                </div>

                                <div>

                                    <h2>
                                        Company Information
                                    </h2>

                                    <p>
                                        Provide your official company
                                        information.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-grid">

                                <ProfileInput
                                    label="Company Name"
                                    required
                                    name="company_name"
                                    value={
                                        formData.company_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <ProfileInput
                                    label="Company Email"
                                    required
                                    type="email"
                                    name="company_email"
                                    value={
                                        formData.company_email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <ProfileInput
                                    label="Phone Number"
                                    required
                                    type="tel"
                                    name="phone"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <ProfileInput
                                    label="Company Website"
                                    type="url"
                                    name="website"
                                    value={
                                        formData.website
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="https://www.example.com"
                                />

                                <ProfileInput
                                    label="Company Location"
                                    required
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </section>


                        {/* REPRESENTATIVE */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    👤
                                </div>

                                <div>

                                    <h2>
                                        Company Representative
                                    </h2>

                                    <p>
                                        Enter the person responsible
                                        for hiring.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-grid">

                                <ProfileInput
                                    label="Representative Name"
                                    required
                                    name="contact_name"
                                    value={
                                        formData.contact_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />


                                <div className="profile-field">

                                    <label>
                                        Position in Company
                                        <span className="required-star">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="representative_position"
                                        value={
                                            formData.representative_position
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select position
                                        </option>

                                        <option value="director">
                                            Director
                                        </option>

                                        <option value="ceo">
                                            CEO
                                        </option>

                                        <option value="proprietor">
                                            Proprietor
                                        </option>

                                        <option value="hr">
                                            HR
                                        </option>

                                        <option value="manager">
                                            Manager
                                        </option>

                                        <option value="authorized_person">
                                            Authorized Person
                                        </option>

                                        <option value="other">
                                            Other
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {requiresAuthorizationLetter() && (

                                <div className="authorization-notice">

                                    <strong>
                                        ⚠ Authorization Letter Required
                                    </strong>

                                    <p>
                                        Since the representative is not
                                        a Director, CEO, or Proprietor,
                                        an authorization letter from the
                                        company is required.
                                    </p>

                                </div>

                            )}

                        </section>


                        {/* DESCRIPTION */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    📝
                                </div>

                                <div>

                                    <h2>
                                        About the Company
                                    </h2>

                                    <p>
                                        Tell employers and applicants
                                        about your company.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-field">

                                <label>
                                    Company Description
                                    <span className="required-star">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    name="company_description"
                                    value={
                                        formData.company_description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="6"
                                    required
                                    placeholder="Describe your company, services, culture and work environment..."
                                />

                            </div>

                        </section>


                        {/* LOGO */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    🖼
                                </div>

                                <div>

                                    <h2>
                                        Company Logo
                                    </h2>

                                    <p>
                                        Add your official company logo.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-logo-upload">

                                <div className="logo-upload-info">

                                    <div className="upload-icon">
                                        🖼
                                    </div>

                                    <div>

                                        <label>
                                            Upload Company Logo
                                        </label>

                                        <p>
                                            JPG, JPEG or PNG
                                        </p>

                                    </div>

                                </div>


                                <label className="logo-upload-button">

                                    {companyLogo
                                        ? "Change Logo"
                                        : "Upload Logo"}

                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                        hidden
                                        onChange={(e) =>
                                            handleDocumentChange(
                                                e,
                                                setCompanyLogo
                                            )
                                        }
                                    />

                                </label>

                            </div>


                            {companyLogo && (

                                <p className="uploaded-logo">
                                    ✓ {companyLogo.name}
                                </p>

                            )}

                        </section>


                        {/* DOCUMENTS */}

                        <section className="profile-section">

                            <div className="profile-section-title">

                                <div className="section-heading-icon">
                                    📄
                                </div>

                                <div>

                                    <h2>
                                        Verification Documents
                                    </h2>

                                    <p>
                                        Upload official company
                                        verification documents.
                                    </p>

                                </div>

                            </div>


                            <DocumentUpload
                                title="Company GST Certificate"
                                file={gstCertificate}
                                setFile={setGstCertificate}
                                existing={
                                    profile?.company_gst_certificate
                                }
                                getMediaUrl={getMediaUrl}
                                required={true}
                            />


                            <DocumentUpload
                                title="Company Registration Certificate"
                                file={registrationCertificate}
                                setFile={setRegistrationCertificate}
                                existing={
                                    profile?.company_registration_certificate
                                }
                                getMediaUrl={getMediaUrl}
                                required={true}
                            />


                            <DocumentUpload
                                title="Authorization Letter"
                                file={authorizationLetter}
                                setFile={setAuthorizationLetter}
                                existing={
                                    profile?.authorization_letter
                                }
                                getMediaUrl={getMediaUrl}
                                required={
                                    requiresAuthorizationLetter()
                                }
                                description={
                                    requiresAuthorizationLetter()
                                        ? "Required because the representative is not a Director, CEO, or Proprietor."
                                        : "Not required for Director, CEO, or Proprietor."
                                }
                            />

                        </section>


                        {/* NEXT STEP */}

                        <section className="profile-section">

                            <div className="profile-next-step">

                                <div className="next-step-icon">
                                    🔐
                                </div>

                                <div>

                                    <h3>
                                        What happens next?
                                    </h3>

                                    <p>
                                        Your company information and
                                        documents will be submitted
                                        for admin verification.
                                    </p>

                                    <p>
                                        After submission, your profile
                                        will be locked while admin
                                        verification is in progress.
                                    </p>

                                    <p>
                                        You can post jobs only after
                                        your employer account is approved.
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* BUTTONS */}

                        <div className="employer-profile-actions">

                            <button
                                type="button"
                                className="profile-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/employer/dashboard"
                                    )
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="profile-primary-button"
                                disabled={saving}
                            >

                                {saving

                                    ? "Submitting..."

                                    : approvalStatus === "rejected"

                                        ? "Submit Again"

                                        : "Submit for Verification"

                                }

                            </button>

                        </div>

                    </form>

                </main>

            </div>
        </>
    );
}


/* =============================================================
   PROFILE INPUT
============================================================= */

function ProfileInput({
    label,
    required,
    type = "text",
    name,
    value,
    onChange,
    placeholder
}) {

    return (

        <div className="profile-field">

            <label>
                {label}

                {required && (
                    <span className="required-star">
                        *
                    </span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
            />

        </div>
    );
}


/* =============================================================
   DETAIL
============================================================= */

function Detail({
    label,
    value
}) {

    return (

        <div className="profile-detail-item">

            <label>
                {label}
            </label>

            <p>
                {value || "-"}
            </p>

        </div>
    );
}


/* =============================================================
   POSITION LABEL
============================================================= */

function getPositionLabel(position) {

    const labels = {

        director: "Director",

        ceo: "CEO",

        proprietor: "Proprietor",

        hr: "HR",

        manager: "Manager",

        authorized_person:
            "Authorized Person",

        other: "Other",
    };

    return labels[position] || "-";
}


/* =============================================================
   SECTION BUTTONS
============================================================= */

function SectionButtons({
    saving,
    onCancel,
    onSave
}) {

    return (

        <div className="section-edit-actions">

            <button
                type="button"
                className="profile-secondary-button"
                onClick={onCancel}
                disabled={saving}
            >
                Cancel
            </button>


            <button
                type="button"
                className="profile-primary-button"
                onClick={onSave}
                disabled={saving}
            >

                {saving
                    ? "Saving..."
                    : "Save Changes"}

            </button>

        </div>
    );
}


/* =============================================================
   DOCUMENT UPLOAD
============================================================= */

function DocumentUpload({
    title,
    file,
    setFile,
    existing,
    getMediaUrl,
    required,
    description
}) {

    return (

        <div className="document-upload-card">

            <div className="document-upload-info">

                <div className="document-icon">
                    📄
                </div>

                <div>

                    <label>

                        {title}

                        {required && (
                            <span className="required-star">
                                *
                            </span>
                        )}

                    </label>


                    <p>
                        {description ||
                            "Upload PDF, JPG, JPEG or PNG."}
                    </p>


                    {existing && !file && (

                        <a
                            href={getMediaUrl(existing)}
                            target="_blank"
                            rel="noreferrer"
                            className="document-view-link"
                        >
                            📄 View existing document
                        </a>

                    )}


                    {file && (

                        <p className="uploaded-document">

                            ✓ {file.name}

                        </p>

                    )}

                </div>

            </div>


            <label className="document-upload-button">

                {file
                    ? "Change"
                    : existing
                        ? "Replace"
                        : "Upload"}

                <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => {

                        const selectedFile =
                            e.target.files?.[0];

                        if (selectedFile) {
                            setFile(selectedFile);
                        }

                    }}
                />

            </label>

        </div>
    );
}


/* =============================================================
   DOCUMENT VIEW
============================================================= */

function DocumentView({
    title,
    file,
    getMediaUrl
}) {

    return (

        <div className="document-view-card">

            <div className="document-view-info">

                <div className="document-icon">
                    📄
                </div>

                <div>

                    <strong>
                        {title}
                    </strong>

                    <p>
                        {file
                            ? "Document uploaded"
                            : "Document not uploaded"}
                    </p>

                </div>

            </div>


            {file ? (

                <a
                    href={getMediaUrl(file)}
                    target="_blank"
                    rel="noreferrer"
                    className="document-view-button"
                >
                    View ↗
                </a>

            ) : (

                <span className="document-missing">
                    Not available
                </span>

            )}

        </div>
    );
}


/* =============================================================
   ALL CSS INSIDE PAGE
============================================================= */

const PROFILE_STYLES = `

* {
    box-sizing: border-box;
}

.employer-profile-page {
    min-height: 100vh;
    width: 100%;
    background:
        radial-gradient(
            circle at top left,
            rgba(37, 99, 235, 0.08),
            transparent 32%
        ),
        #f5f7fb;
    padding: 38px 24px 60px;
    color: #172033;
    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
}

.employer-profile-main {
    width: min(1120px, 100%);
    margin: 0 auto;
}

/* =========================================================
   PAGE HEADER
========================================================= */

.profile-page-heading {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 25px;
    padding: 26px 30px;
    border: 1px solid #e4e9f2;
    border-radius: 20px;
    background: rgba(255,255,255,0.96);
    box-shadow: 0 12px 35px rgba(15,23,42,0.06);
}

.heading-icon {
    width: 58px;
    height: 58px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 17px;
    background: linear-gradient(
        135deg,
        #2563eb,
        #4f46e5
    );
    color: #fff;
    font-size: 27px;
    box-shadow: 0 10px 24px rgba(37,99,235,0.24);
}

.heading-text {
    min-width: 0;
}

.heading-label {
    display: block;
    margin-bottom: 4px;
    color: #2563eb;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.3px;
}

.profile-page-heading h1 {
    margin: 0;
    color: #111827;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
}

.profile-page-heading p {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
}

.verified-heading-icon {
    background: linear-gradient(
        135deg,
        #059669,
        #10b981
    );
}

.approved-heading {
    border-color: #dcefe8;
}

.verified-pill {
    margin-left: auto;
    padding: 9px 15px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
}

/* =========================================================
   COMPANY SUMMARY
========================================================= */

.company-summary-card {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 22px;
    padding: 24px;
    border-radius: 20px;
    background: linear-gradient(
        135deg,
        #172554,
        #1e3a8a
    );
    color: #fff;
    box-shadow: 0 15px 35px rgba(30,58,138,0.18);
}

.company-summary-logo {
    width: 86px;
    height: 86px;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: #fff;
    border: 4px solid rgba(255,255,255,0.25);
}

.company-summary-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.company-placeholder {
    font-size: 35px;
}

.company-summary-info {
    flex: 1;
}

.company-summary-info > span {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.3px;
    opacity: 0.72;
}

.company-summary-info h2 {
    margin: 5px 0 5px;
    font-size: 23px;
    font-weight: 800;
}

.company-summary-info p {
    margin: 0;
    color: #dbeafe;
    font-size: 13px;
}

.company-summary-status {
    min-width: 115px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 22px;
    border-left: 1px solid rgba(255,255,255,0.18);
}

.verified-check {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    border-radius: 50%;
    background: #10b981;
    font-weight: 900;
}

.company-summary-status strong {
    font-size: 13px;
}

.company-summary-status small {
    margin-top: 2px;
    color: #bfdbfe;
    font-size: 10px;
}

/* =========================================================
   PROFILE SECTIONS
========================================================= */

.profile-section {
    margin-bottom: 20px;
    padding: 27px;
    border: 1px solid #e4e9f2;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 8px 25px rgba(15,23,42,0.045);
}

.profile-section-title {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    margin-bottom: 23px;
}

.section-heading-icon {
    width: 39px;
    height: 39px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 18px;
}

.profile-section-title > div:nth-child(2) {
    flex: 1;
}

.profile-section h2 {
    margin: 0;
    color: #172033;
    font-size: 18px;
    font-weight: 800;
}

.profile-section-title p {
    margin: 4px 0 0;
    color: #7b879b;
    font-size: 13px;
    line-height: 1.5;
}

.profile-section > h2 {
    margin-bottom: 7px;
}

.profile-section > p {
    margin-top: 0;
    margin-bottom: 22px;
    color: #7b879b;
    font-size: 13px;
}

/* =========================================================
   GRID
========================================================= */

.profile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.profile-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.profile-field label {
    color: #374151;
    font-size: 13px;
    font-weight: 700;
}

.required-star {
    margin-left: 3px;
    color: #dc2626;
}

.profile-field input,
.profile-field select,
.profile-field textarea {
    width: 100%;
    border: 1px solid #d9e0eb;
    border-radius: 11px;
    background: #fbfcfe;
    color: #172033;
    font-size: 14px;
    outline: none;
    transition:
        border-color .2s ease,
        box-shadow .2s ease,
        background .2s ease;
}

.profile-field input,
.profile-field select {
    min-height: 47px;
    padding: 0 14px;
}

.profile-field textarea {
    min-height: 145px;
    padding: 13px 14px;
    resize: vertical;
    line-height: 1.6;
}

.profile-field input::placeholder,
.profile-field textarea::placeholder {
    color: #a1aabd;
}

.profile-field input:focus,
.profile-field select:focus,
.profile-field textarea:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow:
        0 0 0 4px rgba(59,130,246,0.10);
}

/* =========================================================
   DETAILS
========================================================= */

.profile-details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    border: 1px solid #edf0f5;
    border-radius: 14px;
    overflow: hidden;
}

.profile-detail-item {
    min-width: 0;
    padding: 17px 18px;
    border-right: 1px solid #edf0f5;
    border-bottom: 1px solid #edf0f5;
    background: #fcfdff;
}

.profile-detail-item:nth-child(even) {
    border-right: none;
}

.profile-detail-item label {
    display: block;
    margin-bottom: 6px;
    color: #8994a7;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .65px;
}

.profile-detail-item p {
    margin: 0;
    color: #253044;
    font-size: 14px;
    font-weight: 650;
    word-break: break-word;
}

.profile-detail-item a {
    color: #2563eb;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
}

.profile-detail-item a:hover {
    text-decoration: underline;
}

/* =========================================================
   EDIT BUTTON
========================================================= */

.section-edit-button {
    margin-left: auto;
    flex-shrink: 0;
    padding: 8px 13px;
    border: 1px solid #dbe3ef;
    border-radius: 9px;
    background: #fff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: .2s ease;
}

.section-edit-button:hover {
    border-color: #2563eb;
    background: #eff6ff;
    transform: translateY(-1px);
}

/* =========================================================
   DESCRIPTION
========================================================= */

.company-description {
    padding: 20px;
    border: 1px solid #edf0f5;
    border-radius: 14px;
    background: #fafbfe;
}

.company-description p {
    margin: 0;
    color: #526075;
    font-size: 14px;
    line-height: 1.8;
    white-space: pre-line;
}

/* =========================================================
   LOGO
========================================================= */

.profile-logo-upload {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 20px;
    border: 1px dashed #cbd5e1;
    border-radius: 15px;
    background: #fafcff;
}

.logo-upload-info {
    display: flex;
    align-items: center;
    gap: 13px;
}

.upload-icon {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #eff6ff;
    font-size: 21px;
}

.logo-upload-info label {
    display: block;
    color: #263247;
    font-size: 14px;
    font-weight: 800;
}

.logo-upload-info p {
    margin: 3px 0 0;
    color: #8994a7;
    font-size: 12px;
}

.logo-upload-button,
.document-upload-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 16px;
    border: 1px solid #2563eb;
    border-radius: 9px;
    background: #2563eb;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: .2s ease;
}

.logo-upload-button:hover,
.document-upload-button:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
}

.uploaded-logo,
.uploaded-document {
    margin: 12px 0 0;
    color: #047857;
    font-size: 12px;
    font-weight: 700;
}

.existing-logo-preview {
    width: 150px;
    height: 150px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 17px;
    background: #f8fafc;
}

.existing-logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.approved-photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #eff6ff;
    font-size: 42px;
}

/* =========================================================
   DOCUMENTS
========================================================= */

.verification-documents-list {
    display: flex;
    flex-direction: column;
    gap: 11px;
}

.document-upload-card,
.document-view-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 17px;
    margin-bottom: 12px;
    border: 1px solid #e5eaf1;
    border-radius: 14px;
    background: #fbfcfe;
}

.document-upload-info,
.document-view-info {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
}

.document-icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #eef2ff;
    font-size: 18px;
}

.document-upload-info label,
.document-view-info strong {
    display: block;
    color: #263247;
    font-size: 13px;
    font-weight: 800;
}

.document-upload-info p,
.document-view-info p {
    margin: 4px 0 0;
    color: #8994a7;
    font-size: 11px;
    line-height: 1.5;
}

.document-view-link {
    display: inline-block;
    margin-top: 7px;
    color: #2563eb;
    font-size: 11px;
    font-weight: 700;
    text-decoration: none;
}

.document-view-link:hover {
    text-decoration: underline;
}

.document-view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 68px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
}

.document-view-button:hover {
    background: #dbeafe;
}

.document-missing {
    padding: 7px 10px;
    border-radius: 7px;
    background: #f1f5f9;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
}

/* =========================================================
   AUTHORIZATION
========================================================= */

.authorization-notice {
    margin-top: 20px;
    padding: 15px 17px;
    border: 1px solid #fde68a;
    border-radius: 12px;
    background: #fffbeb;
}

.authorization-notice strong {
    color: #92400e;
    font-size: 13px;
}

.authorization-notice p {
    margin: 5px 0 0;
    color: #a16207;
    font-size: 12px;
    line-height: 1.6;
}

/* =========================================================
   NEXT STEP
========================================================= */

.profile-next-step {
    display: flex;
    gap: 15px;
    padding: 20px;
    border: 1px solid #bfdbfe;
    border-radius: 15px;
    background: linear-gradient(
        135deg,
        #eff6ff,
        #f8faff
    );
}

.next-step-icon {
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #dbeafe;
    font-size: 20px;
}

.profile-next-step h3 {
    margin: 0 0 7px;
    color: #1e3a8a;
    font-size: 15px;
}

.profile-next-step p {
    margin: 5px 0;
    color: #526075;
    font-size: 12px;
    line-height: 1.6;
}

/* =========================================================
   ACTIONS
========================================================= */

.employer-profile-actions,
.profile-bottom-actions,
.section-edit-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 11px;
    margin-top: 20px;
}

.employer-profile-actions {
    padding: 22px 27px;
    border-top: 1px solid #edf0f5;
}

.profile-bottom-actions {
    margin-top: 25px;
}

.profile-primary-button,
.profile-secondary-button,
.profile-save-button,
.profile-cancel-button {
    min-height: 43px;
    padding: 0 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: .2s ease;
}

.profile-primary-button,
.profile-save-button {
    border: 1px solid #2563eb;
    background: linear-gradient(
        135deg,
        #2563eb,
        #4f46e5
    );
    color: #fff;
    box-shadow: 0 7px 18px rgba(37,99,235,0.17);
}

.profile-primary-button:hover,
.profile-save-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 23px rgba(37,99,235,0.24);
}

.profile-secondary-button,
.profile-cancel-button {
    border: 1px solid #d8e0eb;
    background: #fff;
    color: #475569;
}

.profile-secondary-button:hover,
.profile-cancel-button:hover {
    border-color: #94a3b8;
    background: #f8fafc;
}

button:disabled {
    opacity: .55;
    cursor: not-allowed;
    transform: none !important;
}

/* =========================================================
   FORM CARD
========================================================= */

.employer-profile-card {
    overflow: hidden;
    border: 1px solid #e4e9f2;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 12px 35px rgba(15,23,42,0.055);
}

.employer-profile-card .profile-section {
    margin: 0;
    border: none;
    border-bottom: 1px solid #edf0f5;
    border-radius: 0;
    box-shadow: none;
}

/* =========================================================
   MESSAGES
========================================================= */

.profile-error,
.profile-success {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.55;
}

.profile-error {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #991b1b;
}

.profile-error > span {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #dc2626;
    color: #fff;
    font-size: 11px;
    font-weight: 900;
}

.profile-success {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #166534;
}

.profile-success > span {
    font-weight: 900;
}

.error-center {
    justify-content: center;
}

/* =========================================================
   PENDING STATUS
========================================================= */

.profile-status-card {
    padding: 45px 30px;
    border: 1px solid #e4e9f2;
    border-radius: 22px;
    background: #fff;
    text-align: center;
    box-shadow: 0 12px 35px rgba(15,23,42,0.055);
}

.status-circle {
    width: 78px;
    height: 78px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 17px;
    border-radius: 50%;
    font-size: 32px;
}

.pending-circle {
    background: #fff7ed;
    border: 8px solid #ffedd5;
}

.profile-status-card h2 {
    margin: 0;
    color: #172033;
    font-size: 23px;
}

.status-description {
    max-width: 560px;
    margin: 10px auto 20px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
}

.pending-status {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 23px;
    padding: 9px 15px;
    border-radius: 999px;
    background: #fff7ed;
    color: #c2410c;
    font-size: 12px;
    font-weight: 800;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f97316;
}

.profile-lock-box {
    max-width: 620px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0 auto 18px;
    padding: 17px;
    border: 1px solid #dbeafe;
    border-radius: 13px;
    background: #eff6ff;
    text-align: left;
}

.lock-icon {
    font-size: 20px;
}

.profile-lock-box strong {
    display: block;
    color: #1e40af;
    font-size: 13px;
}

.profile-lock-box p {
    margin: 4px 0 0;
    color: #526075;
    font-size: 12px;
    line-height: 1.55;
}

.status-note {
    margin: 0 auto;
    max-width: 600px;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.6;
}

.profile-bottom-actions {
    justify-content: center;
}

/* =========================================================
   LOADING
========================================================= */

.profile-loading {
    min-height: 430px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.loading-spinner {
    width: 42px;
    height: 42px;
    margin-bottom: 18px;
    border: 4px solid #dbeafe;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: profileSpin .8s linear infinite;
}

@keyframes profileSpin {
    to {
        transform: rotate(360deg);
    }
}

.profile-loading h3 {
    margin: 0;
    color: #1e293b;
    font-size: 17px;
}

.profile-loading p {
    margin: 7px 0 0;
    color: #94a3b8;
    font-size: 13px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 850px) {

    .employer-profile-page {
        padding: 25px 15px 45px;
    }

    .profile-page-heading {
        padding: 22px;
    }

    .profile-page-heading h1 {
        font-size: 24px;
    }

    .company-summary-card {
        flex-wrap: wrap;
    }

    .company-summary-status {
        width: 100%;
        flex-direction: row;
        justify-content: flex-start;
        gap: 9px;
        padding: 15px 0 0;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.18);
    }

    .verified-check {
        margin: 0;
    }

    .company-summary-status small {
        margin-left: -3px;
    }

    .profile-grid {
        grid-template-columns: 1fr;
    }

}

@media (max-width: 600px) {

    .employer-profile-page {
        padding: 16px 10px 35px;
    }

    .profile-page-heading {
        align-items: flex-start;
        padding: 18px;
        border-radius: 15px;
    }

    .heading-icon {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        font-size: 21px;
    }

    .profile-page-heading h1 {
        font-size: 20px;
    }

    .profile-page-heading p {
        font-size: 12px;
    }

    .heading-label {
        font-size: 9px;
    }

    .verified-pill {
        display: none;
    }

    .profile-section {
        padding: 19px 15px;
        border-radius: 15px;
    }

    .profile-section-title {
        flex-wrap: wrap;
    }

    .profile-section-title .section-edit-button {
        margin-left: auto;
    }

    .profile-details-grid {
        grid-template-columns: 1fr;
    }

    .profile-detail-item,
    .profile-detail-item:nth-child(even) {
        border-right: none;
    }

    .company-summary-card {
        padding: 18px;
        border-radius: 15px;
    }

    .company-summary-logo {
        width: 65px;
        height: 65px;
        border-radius: 14px;
    }

    .company-summary-info h2 {
        font-size: 18px;
    }

    .company-summary-info p {
        font-size: 11px;
    }

    .profile-logo-upload {
        align-items: flex-start;
        flex-direction: column;
    }

    .logo-upload-button {
        width: 100%;
    }

    .document-upload-card,
    .document-view-card {
        align-items: flex-start;
        flex-direction: column;
    }

    .document-upload-button,
    .document-view-button {
        width: 100%;
    }

    .employer-profile-actions,
    .profile-bottom-actions,
    .section-edit-actions {
        flex-direction: column-reverse;
        width: 100%;
    }

    .employer-profile-actions {
        padding: 20px 15px;
    }

    .profile-primary-button,
    .profile-secondary-button,
    .profile-save-button,
    .profile-cancel-button {
        width: 100%;
    }

    .profile-status-card {
        padding: 32px 18px;
        border-radius: 16px;
    }

    .profile-status-card h2 {
        font-size: 20px;
    }

    .profile-lock-box {
        text-align: left;
    }

    .profile-next-step {
        flex-direction: column;
    }

}

@media (max-width: 400px) {

    .profile-page-heading {
        gap: 10px;
    }

    .profile-page-heading h1 {
        font-size: 18px;
    }

    .company-summary-info h2 {
        font-size: 16px;
    }

    .profile-section h2 {
        font-size: 16px;
    }

}

`;


export default EmployerProfile;

