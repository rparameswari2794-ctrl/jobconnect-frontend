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

    const [companyLogo, setCompanyLogo] = useState(null);
    const [currentLogo, setCurrentLogo] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =====================================================
    // LOAD EMPLOYER PROFILE
    // =====================================================

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
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load company profile."
                );
            }


            setFormData({
                company_name:
                    data.company_name || "",

                contact_name:
                    data.contact_name || "",

                phone:
                    data.phone || "",

                company_email:
                    data.company_email || "",

                company_description:
                    data.company_description || "",

                website:
                    data.website || "",

                location:
                    data.location || "",
            });


            if (data.company_logo) {

                setCurrentLogo(
                    data.company_logo
                );

            }

        } catch (err) {

            console.error(
                "PROFILE LOAD ERROR:",
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
    // INPUT CHANGE
    // =====================================================

    function handleChange(e) {

        const {
            name,
            value
        } = e.target;


        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    }


    // =====================================================
    // LOGO CHANGE
    // =====================================================

    function handleLogoChange(e) {

        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }


        setCompanyLogo(file);

    }


    // =====================================================
    // SAVE PROFILE
    // =====================================================

    async function handleSubmit(e) {

        e.preventDefault();

        setError("");
        setSuccess("");


        // -------------------------------------------------
        // REQUIRED FIELD CHECK
        // -------------------------------------------------

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


        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Please log in as an employer."
            );

            return;
        }


        // =================================================
        // FORM DATA
        // =================================================

        const data =
            new FormData();


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


        if (companyLogo) {

            data.append(
                "company_logo",
                companyLogo
            );

        }


        // =================================================
        // SAVE
        // =================================================

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


            // -------------------------------------------------
            // UPDATE LOCAL STATE
            // -------------------------------------------------

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
                    result.company_description || "",

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


            setCompanyLogo(null);


            setSuccess(
                "Company profile saved successfully."
            );


            // -------------------------------------------------
            // PROFILE COMPLETE
            // -------------------------------------------------

            if (
                result.profile_completed === true
            ) {

                setTimeout(() => {

                    navigate(
                        "/employer/jobs"
                    );

                }, 1200);

            }


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


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="company-verification-page">

                <main className="company-verification-main">

                    <div className="company-profile-loading">

                        Loading company profile...

                    </div>

                </main>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="company-verification-page">

            <main className="company-verification-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="company-verification-header">

                    <div>

                        <h1>
                            Company profile
                        </h1>

                        <p>
                            Complete your company details
                            before posting jobs.
                        </p>

                    </div>


                    {/* PROFILE STATUS */}

                    <div
                        className={
                            `company-profile-status ${
                                formData.company_name &&
                                formData.contact_name &&
                                formData.phone &&
                                formData.company_email &&
                                formData.company_description &&
                                formData.location
                                    ? "completed"
                                    : "incomplete"
                            }`
                        }
                    >

                        {formData.company_name &&
                        formData.contact_name &&
                        formData.phone &&
                        formData.company_email &&
                        formData.company_description &&
                        formData.location
                            ? "Profile completed"
                            : "Profile incomplete"}

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="company-profile-alert error">

                        {error}

                    </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (

                    <div className="company-profile-alert success">

                        {success}

                    </div>

                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    className="company-verification-card"
                    onSubmit={handleSubmit}
                >


                    {/* =================================================
                        COMPANY INFORMATION
                    ================================================= */}

                    <section className="verification-section">

                        <h2>
                            Company information
                        </h2>

                        <p className="section-description">

                            Provide your official company
                            information.

                        </p>


                        {/* COMPANY NAME */}

                        <div className="verification-field">

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
                                placeholder="Enter company name"
                            />

                        </div>


                        {/* COMPANY EMAIL */}

                        <div className="verification-field">

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
                                placeholder="company@example.com"
                            />

                        </div>


                        {/* PHONE */}

                        <div className="verification-field">

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
                                placeholder="+91 98765 43210"
                            />

                        </div>


                        {/* WEBSITE */}

                        <div className="verification-field">

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


                        {/* LOCATION */}

                        <div className="verification-field">

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
                                placeholder="Chennai, Tamil Nadu"
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="verification-field">

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
                                placeholder="Tell job seekers about your company..."
                                rows="5"
                            />

                        </div>

                    </section>


                    {/* =================================================
                        REPRESENTATIVE
                    ================================================= */}

                    <section className="verification-section">

                        <h2>
                            Company representative
                        </h2>

                        <p className="section-description">

                            Enter the person responsible
                            for hiring.

                        </p>


                        <div className="verification-field">

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
                                placeholder="Enter representative name"
                            />

                        </div>

                    </section>


                    {/* =================================================
                        COMPANY LOGO
                    ================================================= */}

                    <section className="verification-section">

                        <h2>
                            Company logo
                        </h2>

                        <p className="section-description">

                            Upload your company logo.
                            This helps job seekers identify
                            your company.

                        </p>


                        <div className="company-logo-area">


                            {/* CURRENT LOGO */}

                            {currentLogo && !companyLogo && (

                                <div className="company-logo-preview">

                                    <img
                                        src={currentLogo}
                                        alt="Company logo"
                                    />

                                </div>

                            )}


                            {/* NEW LOGO PREVIEW */}

                            {companyLogo && (

                                <div className="company-logo-preview">

                                    <img
                                        src={
                                            URL.createObjectURL(
                                                companyLogo
                                            )
                                        }
                                        alt="New company logo"
                                    />

                                </div>

                            )}


                            {/* UPLOAD */}

                            <label
                                className="verification-upload-button"
                            >

                                {companyLogo ||
                                currentLogo
                                    ? "Change logo"
                                    : "Upload logo"}

                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    hidden
                                    onChange={
                                        handleLogoChange
                                    }
                                />

                            </label>

                        </div>

                    </section>


                    {/* =================================================
                        IMPORTANT INFORMATION
                    ================================================= */}

                    <section className="company-verification-info">

                        <div className="info-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                What happens next?
                            </strong>

                            <p>

                                Complete your company profile
                                and save it. Your profile will
                                then be available for admin
                                verification.

                            </p>

                            <p>

                                You can post jobs only after
                                your employer account is approved.

                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="verification-actions">

                        <button
                            type="button"
                            className="cancel-verification-button"
                            onClick={() =>
                                navigate(
                                    "/employer/jobs"
                                )
                            }
                        >

                            Cancel

                        </button>


                        <button
                            type="submit"
                            className="submit-verification-button"
                            disabled={saving}
                        >

                            {saving
                                ? "Saving..."
                                : "Save company profile"}

                        </button>

                    </div>

                </form>

            </main>

        </div>
    );
}

export default CompanyVerification;