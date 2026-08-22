import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
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


    /*
    =========================================================
    TOKEN
    =========================================================
    */

    function getToken() {
        return localStorage.getItem("jc_token");
    }


    /*
    =========================================================
    MEDIA URL
    =========================================================
    */

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
            return `http://localhost:8000${url}`;
        }

        return `http://localhost:8000/${url}`;
    }


    /*
    =========================================================
    LOAD PROFILE
    =========================================================
    */

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


    /*
    =========================================================
    SET FORM DATA
    =========================================================
    */

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


    /*
    =========================================================
    HANDLE INPUT CHANGE
    =========================================================
    */

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


    /*
    =========================================================
    DOCUMENT CHANGE
    =========================================================
    */

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


    /*
    =========================================================
    AUTHORIZATION LETTER
    =========================================================
    */

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


    /*
    =========================================================
    START EDITING
    =========================================================
    */

    function startEditing(section) {

        /*
        Pending profiles must never be editable.
        */

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


    /*
    =========================================================
    CANCEL EDIT
    =========================================================
    */

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


    /*
    =========================================================
    VALIDATION
    =========================================================
    */

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

        /*
        -----------------------------------------------------
        AUTHORIZATION LETTER
        -----------------------------------------------------
        */

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


    /*
    =========================================================
    SUBMIT / SAVE
    =========================================================
    */

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


        /*
        -----------------------------------------------------
        PENDING PROFILE CANNOT BE EDITED
        -----------------------------------------------------
        */

        if (
            profile?.approval_status === "pending" &&
            profile?.profile_completed
        ) {

            setError(
                "Your company profile is waiting for admin approval and is currently locked."
            );

            return;
        }


        /*
        -----------------------------------------------------
        VALIDATE
        -----------------------------------------------------
        */

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


            /*
            -------------------------------------------------
            COMPANY INFORMATION
            -------------------------------------------------
            */

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


            /*
            -------------------------------------------------
            COMPANY LOGO
            -------------------------------------------------
            */

            if (companyLogo) {

                data.append(
                    "company_logo",
                    companyLogo
                );
            }


            /*
            -------------------------------------------------
            GST
            -------------------------------------------------
            */

            if (gstCertificate) {

                data.append(
                    "company_gst_certificate",
                    gstCertificate
                );
            }


            /*
            -------------------------------------------------
            REGISTRATION
            -------------------------------------------------
            */

            if (registrationCertificate) {

                data.append(
                    "company_registration_certificate",
                    registrationCertificate
                );
            }


            /*
            -------------------------------------------------
            AUTHORIZATION LETTER
            -------------------------------------------------
            */

            if (authorizationLetter) {

                data.append(
                    "authorization_letter",
                    authorizationLetter
                );
            }


            /*
            -------------------------------------------------
            PATCH
            -------------------------------------------------
            */

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


            /*
            -------------------------------------------------
            UPDATE PROFILE
            -------------------------------------------------
            */

            setProfile(result);

            setFormDataFromProfile(result);


            setCompanyLogo(null);
            setGstCertificate(null);
            setRegistrationCertificate(null);
            setAuthorizationLetter(null);


            setEditingSection(null);


            /*
            -------------------------------------------------
            IMPORTANT:
            BACKEND SHOULD RETURN:
            approval_status = pending
            -------------------------------------------------
            */

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


            /*
            -------------------------------------------------
            RELOAD PROFILE
            -------------------------------------------------
            */

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


    /*
    =========================================================
    LOADING
    =========================================================
    */

    if (loading) {

        return (
            <div className="profile-details-page">

                <main className="profile-details-main">

                    <div className="completed-loading">

                        <p>
                            Loading company profile...
                        </p>

                    </div>

                </main>

            </div>
        );
    }


    /*
    =========================================================
    ERROR WITHOUT PROFILE
    =========================================================
    */

    if (error && !profile) {

        return (
            <div className="profile-details-page">

                <main className="profile-details-main">

                    <div className="documents-error">
                        {error}
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/employer/dashboard"
                            )
                        }
                    >
                        Back to dashboard
                    </button>

                </main>

            </div>
        );
    }


    /*
    =========================================================
    STATUS
    =========================================================
    */

    const approvalStatus =
        String(
            profile?.approval_status || ""
        )
            .toLowerCase()
            .trim();


    const profileCompleted =
        profile?.profile_completed === true;


    /*
    =========================================================
    PENDING = LOCKED
    =========================================================
    */

    if (
        profileCompleted &&
        approvalStatus === "pending"
    ) {

        return (
            <div className="profile-details-page">

                <main className="profile-details-main">

                    <section className="profile-details-header">

                        <h1>
                            Company Profile & Verification
                        </h1>

                        <p>
                            Your company profile has been
                            submitted for admin verification.
                        </p>

                    </section>


                    {error && (
                        <div className="profile-error">
                            {error}
                        </div>
                    )}


                    <section className="profile-section submitted-profile-section">

                        <div className="submitted-profile-content">

                            <div className="submitted-success-icon">
                                ✓
                            </div>

                            <h2>
                                Company Profile Submitted
                            </h2>

                            <p>
                                Your company information and
                                verification documents have
                                been successfully submitted.
                            </p>


                            <div className="submitted-status">

                                <span className="submitted-status-dot">
                                </span>

                                <strong>
                                    Pending Admin Approval
                                </strong>

                            </div>


                            <p className="profile-freeze-message">

                                🔒 Your company profile is
                                currently locked while the
                                administrator verifies your
                                information.

                            </p>


                            <p>
                                You cannot edit your company
                                details or verification
                                documents until the
                                administrator completes
                                verification.
                            </p>

                        </div>

                    </section>


                    <div className="employer-approved-actions">

                        <button
                            type="button"
                            className="profile-cancel-button"
                            onClick={() =>
                                navigate(
                                    "/employer/dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    /*
    =========================================================
    APPROVED PROFILE
    =========================================================
    */

    if (
        profileCompleted &&
        approvalStatus === "approved"
    ) {

        return (
            <div className="profile-details-page">

                <main className="profile-details-main">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <section className="profile-details-header approved-profile-header">

                        <div className="approved-header-content">

                            <div>

                                <h1>
                                    My Company Profile
                                </h1>

                                <p>
                                    Your company profile has
                                    been verified by the
                                    administrator.
                                </p>

                            </div>


                            <div className="approved-profile-right">

                                <div className="approved-profile-photo">

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

                                        <div className="approved-photo-placeholder">
                                            🏢
                                        </div>

                                    )}

                                </div>


                                <div className="verified-badge-small">
                                    ✓ Verified
                                </div>

                            </div>

                        </div>

                    </section>


                    {error && (
                        <div className="profile-error">
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="profile-success">
                            {success}
                        </div>
                    )}


                    {/* =================================================
                        COMPANY INFORMATION
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

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

                                    <div className="profile-field">

                                        <label>
                                            Company Name
                                        </label>

                                        <input
                                            type="text"
                                            name="company_name"
                                            value={
                                                formData.company_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <div className="profile-field">

                                        <label>
                                            Company Email
                                        </label>

                                        <input
                                            type="email"
                                            name="company_email"
                                            value={
                                                formData.company_email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <div className="profile-field">

                                        <label>
                                            Phone
                                        </label>

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={
                                                formData.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <div className="profile-field">

                                        <label>
                                            Website
                                        </label>

                                        <input
                                            type="url"
                                            name="website"
                                            value={
                                                formData.website
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <div className="profile-field">

                                        <label>
                                            Location
                                        </label>

                                        <input
                                            type="text"
                                            name="location"
                                            value={
                                                formData.location
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

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
                                            Visit Website
                                        </a>

                                    ) : (
                                        <p>-</p>
                                    )}

                                </div>

                            </div>
                        )}

                    </section>


                    {/* =================================================
                        REPRESENTATIVE
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

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

                                    <div className="profile-field">

                                        <label>
                                            Representative Name
                                        </label>

                                        <input
                                            type="text"
                                            name="contact_name"
                                            value={
                                                formData.contact_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


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
                                            Authorization Letter Required
                                        </strong>

                                        <p>
                                            Since the representative
                                            is not a Director, CEO,
                                            or Proprietor, an
                                            authorization letter
                                            from the company is
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


                    {/* =================================================
                        ABOUT COMPANY
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <div>

                                <h2>
                                    About the Company
                                </h2>

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


                    {/* =================================================
                        COMPANY LOGO
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <div>

                                <h2>
                                    Company Logo
                                </h2>

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

                                    <div>

                                        <label>
                                            Upload company logo
                                        </label>

                                        <p>
                                            JPG, JPEG or PNG
                                        </p>

                                    </div>


                                    <label className="logo-upload-button">

                                        {companyLogo
                                            ? "Change logo"
                                            : "Upload logo"}

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


                    {/* =================================================
                        VERIFICATION DOCUMENTS
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <div>

                                <h2>
                                    Verification Documents
                                </h2>

                                <p>
                                    Documents submitted for
                                    company verification.
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


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="employer-approved-actions">

                        <button
                            type="button"
                            className="profile-cancel-button"
                            onClick={() =>
                                navigate(
                                    "/employer/dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>


                        <button
                            type="button"
                            className="profile-save-button"
                            onClick={() =>
                                navigate(
                                    "/employer/jobs"
                                )
                            }
                        >
                            Manage Jobs
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    /*
    =========================================================
    NEW / REJECTED PROFILE
    =========================================================
    */

    return (

        <div className="employer-profile-page">

            <main className="employer-profile-main">


                <section className="employer-profile-header">

                    <h1>
                        Company Profile
                    </h1>

                    <p>

                        {approvalStatus === "rejected"

                            ? "Your company profile was rejected. Please correct the information and submit it again."

                            : "Complete your company details before posting jobs."
                        }

                    </p>

                </section>


                {approvalStatus === "rejected" && (

                    <div className="profile-error">

                        <strong>
                            Company profile rejected
                        </strong>

                        <br />

                        {profile?.rejection_reason ||
                            "Please review your company information and submit it again."}

                    </div>

                )}


                {error && (
                    <div className="profile-error">
                        {error}
                    </div>
                )}


                {success && (
                    <div className="profile-success">
                        {success}
                    </div>
                )}


                <form
                    className="employer-profile-card"
                    onSubmit={handleSubmit}
                >


                    {/* =================================================
                        COMPANY INFORMATION
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <div>

                                <h2>
                                    Company Information
                                </h2>

                                <p>
                                    Provide your official
                                    company information.
                                </p>

                            </div>

                        </div>


                        <div className="profile-grid">

                            <div className="profile-field">

                                <label>
                                    Company name
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="company_name"
                                    value={
                                        formData.company_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Company email
                                    <span>*</span>
                                </label>

                                <input
                                    type="email"
                                    name="company_email"
                                    value={
                                        formData.company_email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Phone number
                                    <span>*</span>
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Company website
                                </label>

                                <input
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

                            </div>


                            <div className="profile-field">

                                <label>
                                    Company location
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        REPRESENTATIVE
                    ================================================= */}

                    <section className="profile-section">

                        <h2>
                            Company Representative
                        </h2>

                        <p>
                            Enter the person responsible
                            for hiring.
                        </p>


                        <div className="profile-grid">

                            <div className="profile-field">

                                <label>
                                    Representative name
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="contact_name"
                                    value={
                                        formData.contact_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Position in company
                                    <span>*</span>
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
                                    Authorization Letter Required
                                </strong>

                                <p>
                                    Since the representative
                                    is not a Director, CEO,
                                    or Proprietor, an
                                    authorization letter
                                    from the company is
                                    required.
                                </p>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <section className="profile-section">

                        <h2>
                            About the Company
                        </h2>

                        <div className="profile-field">

                            <label>
                                Company description
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
                                rows="6"
                                required
                            />

                        </div>

                    </section>


                    {/* =================================================
                        LOGO
                    ================================================= */}

                    <section className="profile-section">

                        <h2>
                            Company Logo
                        </h2>


                        <div className="profile-logo-upload">

                            <div>

                                <label>
                                    Upload company logo
                                </label>

                                <p>
                                    JPG, JPEG or PNG
                                </p>

                            </div>


                            <label className="logo-upload-button">

                                {companyLogo
                                    ? "Change logo"
                                    : "Upload logo"}

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


                    {/* =================================================
                        VERIFICATION DOCUMENTS
                    ================================================= */}

                    <section className="profile-section">

                        <h2>
                            Verification Documents
                        </h2>

                        <p>
                            Upload official company
                            verification documents.
                        </p>


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


                    {/* =================================================
                        NEXT STEP
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-next-step">

                            <h3>
                                What happens next?
                            </h3>

                            <p>
                                Your company information
                                and documents will be submitted
                                for admin verification.
                            </p>

                            <p>
                                🔒 After submission, your
                                profile will be locked while
                                admin verification is in progress.
                            </p>

                            <p>
                                You can post jobs only after
                                your employer account is approved.
                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <div className="employer-profile-actions">

                        <button
                            type="button"
                            className="profile-cancel-button"
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
                            className="profile-save-button"
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
    );
}


/*
=============================================================
DETAIL
=============================================================
*/

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


/*
=============================================================
POSITION LABEL
=============================================================
*/

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


/*
=============================================================
SECTION BUTTONS
=============================================================
*/

function SectionButtons({
    saving,
    onCancel,
    onSave
}) {

    return (

        <div className="section-edit-actions">

            <button
                type="button"
                className="profile-cancel-button"
                onClick={onCancel}
                disabled={saving}
            >
                Cancel
            </button>


            <button
                type="button"
                className="profile-save-button"
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


/*
=============================================================
DOCUMENT UPLOAD
=============================================================
*/

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


/*
=============================================================
DOCUMENT VIEW
=============================================================
*/

function DocumentView({
    title,
    file,
    getMediaUrl
}) {

    return (

        <div className="document-view-card">

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


            {file ? (

                <a
                    href={getMediaUrl(file)}
                    target="_blank"
                    rel="noreferrer"
                    className="document-view-button"
                >
                    View
                </a>

            ) : (

                <span className="document-missing">
                    Not available
                </span>

            )}

        </div>
    );
}


export default EmployerProfile;