
import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
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

function AdminEmployerProfile() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =====================================================
    // MEDIA URL
    // =====================================================

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


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        if (id) {
            loadProfile();
        }

    }, [id]);


    async function loadProfile() {

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Admin login session not found."
            );

            setLoading(false);

            return;
        }


        try {

            setLoading(true);

            setError("");


            const response =
                await fetch(
                    `${API_BASE}/admin/employers/${id}/`,
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


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            console.log(
                "ADMIN EMPLOYER PROFILE:",
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


        } catch (err) {

            console.error(
                "EMPLOYER PROFILE ERROR:",
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


    // =====================================================
    // DATE
    // =====================================================

    function formatDate(date) {

        if (!date) {
            return "—";
        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }


    // =====================================================
    // STATUS
    // =====================================================

    function getStatusClass(status) {

        const value =
            String(status || "")
                .toLowerCase();


        if (value === "approved") {
            return "admin-profile-status approved";
        }


        if (value === "rejected") {
            return "admin-profile-status rejected";
        }


        return "admin-profile-status pending";
    }


    // =====================================================
    // STATUS CHART CLASS
    // =====================================================

    function getStatusChartClass(status) {

        const value =
            String(status || "")
                .toLowerCase();


        if (value === "approved") {
            return "status-chart approved-chart";
        }


        if (value === "rejected") {
            return "status-chart rejected-chart";
        }


        return "status-chart pending-chart";
    }


    // =====================================================
    // STATUS TEXT
    // =====================================================

    function getStatusText(status) {

        const value =
            String(status || "pending")
                .toLowerCase();


        if (value === "approved") {
            return "Approved";
        }


        if (value === "rejected") {
            return "Rejected";
        }


        return "Pending";
    }


    // =====================================================
    // BACK NAVIGATION
    // =====================================================

    const approvalStatus =
        String(
            profile?.approval_status || "pending"
        )
            .trim()
            .toLowerCase();


    function handleBack() {

        if (approvalStatus === "approved") {

            navigate("/admin/users");

            return;
        }

        navigate("/admin/verifications");
    }


    const backButtonText =
        approvalStatus === "approved"
            ? "← Back to Users"
            : "← Back to Verification Queue";


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="admin-dashboard">

                <main className="admin-main admin-employer-profile-page">

                    <section className="admin-profile-loading-card">

                        <div className="admin-loading-spinner"></div>

                        <p>
                            Loading employer profile...
                        </p>

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

                <main className="admin-main admin-employer-profile-page">

                    <section className="admin-profile-error-card">

                        <div className="error-icon">
                            !
                        </div>

                        <h2>
                            Unable to load profile
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="admin-profile-back-button"
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

                <main className="admin-main admin-employer-profile-page">

                    <section className="admin-profile-error-card">

                        <div className="error-icon">
                            !
                        </div>

                        <h2>
                            Employer profile not found
                        </h2>

                        <p>
                            The requested employer profile could not
                            be found.
                        </p>

                        <button
                            type="button"
                            className="admin-profile-back-button"
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
    // DOCUMENTS
    // =====================================================

    const documents =
        Array.isArray(profile.documents)
            ? profile.documents
            : [];


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="admin-dashboard">

            <main className="admin-main admin-employer-profile-page">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="admin-page-top">

                    <div>

                        <div className="admin-breadcrumb">
                            Admin / Employers / Profile
                        </div>

                        <h1>
                            Employer Profile
                        </h1>

                        <p>
                            Review the submitted company information
                            before verification.
                        </p>

                    </div>

                </section>


                {/* =================================================
                    COMPANY PROFILE HEADER
                ================================================= */}

                <section className="admin-employer-profile-header">

                    <div className="admin-employer-header-left">


                        {/* COMPANY LOGO */}

                        <div className="admin-company-logo">

                            {profile.company_logo ? (

                                <img
                                    src={getMediaUrl(
                                        profile.company_logo
                                    )}
                                    alt={
                                        profile.company_name ||
                                        "Company logo"
                                    }
                                    onError={(event) => {

                                        event.currentTarget.style.display =
                                            "none";

                                        if (
                                            event.currentTarget
                                                .nextElementSibling
                                        ) {

                                            event.currentTarget
                                                .nextElementSibling
                                                .style.display =
                                                "flex";
                                        }

                                    }}
                                />

                            ) : null}


                            <div
                                className="admin-company-logo-placeholder"
                                style={{
                                    display:
                                        profile.company_logo
                                            ? "none"
                                            : "flex"
                                }}
                            >

                                🏢

                            </div>

                        </div>


                        {/* COMPANY INFORMATION */}

                        <div className="admin-employer-heading">

                            <div className="admin-employer-title-row">

                                <h1>
                                    {profile.company_name ||
                                        "Employer Profile"}
                                </h1>


                                <span
                                    className={
                                        getStatusClass(
                                            approvalStatus
                                        )
                                    }
                                >

                                    {getStatusText(
                                        approvalStatus
                                    )}

                                </span>

                            </div>


                            <p>
                                Employer account and company
                                verification profile
                            </p>

                        </div>

                    </div>


                    {/* STATUS MINI CARD */}

                    <div className="admin-header-status-box">

                        <div
                            className={
                                getStatusChartClass(
                                    approvalStatus
                                )
                            }
                        >

                            <div className="status-chart-inner">

                                <strong>
                                    100%
                                </strong>

                            </div>

                        </div>


                        <div className="status-chart-content">

                            <span>
                                Verification Status
                            </span>

                            <strong>
                                {getStatusText(
                                    approvalStatus
                                )}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    COMPANY INFORMATION
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

                        <div>

                            <div className="admin-section-icon">
                                🏢
                            </div>

                            <div>

                                <h2>
                                    Company Information
                                </h2>

                                <p>
                                    Official company details submitted
                                    by the employer.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="admin-profile-grid">


                        {/* COMPANY NAME */}

                        <div className="admin-profile-field">

                            <label>
                                Company Name
                            </label>

                            <div>
                                {profile.company_name || "—"}
                            </div>

                        </div>


                        {/* COMPANY EMAIL */}

                        <div className="admin-profile-field">

                            <label>
                                Company Email
                            </label>

                            <div>
                                {profile.company_email ||
                                    profile.email ||
                                    "—"}
                            </div>

                        </div>


                        {/* PHONE */}

                        <div className="admin-profile-field">

                            <label>
                                Phone Number
                            </label>

                            <div>
                                {profile.phone || "—"}
                            </div>

                        </div>


                        {/* WEBSITE */}

                        <div className="admin-profile-field">

                            <label>
                                Company Website
                            </label>

                            <div>

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
                                        rel="noopener noreferrer"
                                        className="profile-link"
                                    >

                                        {profile.website}

                                    </a>

                                ) : (

                                    "—"

                                )}

                            </div>

                        </div>


                        {/* LOCATION */}

                        <div className="admin-profile-field">

                            <label>
                                Company Location
                            </label>

                            <div>
                                {profile.location || "—"}
                            </div>

                        </div>

                    </div>


                    {/* DESCRIPTION */}

                    <div className="admin-profile-description">

                        <label>
                            Company Description
                        </label>

                        <p>
                            {profile.company_description ||
                                "No company description provided."}
                        </p>

                    </div>

                </section>


                {/* =================================================
                    COMPANY REPRESENTATIVE
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

                        <div>

                            <div className="admin-section-icon">
                                👤
                            </div>

                            <div>

                                <h2>
                                    Company Representative
                                </h2>

                                <p>
                                    Person responsible for hiring.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="admin-profile-grid">


                        {/* REPRESENTATIVE NAME */}

                        <div className="admin-profile-field">

                            <label>
                                Representative Name
                            </label>

                            <div>
                                {profile.contact_name || "—"}
                            </div>

                        </div>


                        {/* REPRESENTATIVE EMAIL */}

                        <div className="admin-profile-field">

                            <label>
                                Representative Email
                            </label>

                            <div>
                                {profile.email || "—"}
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    COMPANY LOGO
                ================================================= */}

                {profile.company_logo && (

                    <section className="admin-profile-card">

                        <div className="admin-profile-card-header">

                            <div>

                                <div className="admin-section-icon">
                                    🖼️
                                </div>

                                <div>

                                    <h2>
                                        Company Logo
                                    </h2>

                                    <p>
                                        Logo uploaded by the employer.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="admin-logo-preview">

                            <img
                                src={getMediaUrl(
                                    profile.company_logo
                                )}
                                alt={
                                    profile.company_name ||
                                    "Company logo"
                                }
                                onError={(event) => {

                                    event.currentTarget.style.display =
                                        "none";

                                }}
                            />

                        </div>

                    </section>

                )}


                {/* =================================================
                    UPLOADED DOCUMENTS
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

                        <div>

                            <div className="admin-section-icon">
                                📄
                            </div>

                            <div>

                                <h2>
                                    Uploaded Documents
                                </h2>

                                <p>
                                    Documents submitted by the employer
                                    for verification.
                                </p>

                            </div>

                        </div>

                    </div>


                    {documents.length > 0 ? (

                        <div className="admin-documents-list">

                            {documents.map(
                                (document, index) => (

                                    <div
                                        className="admin-document-item"
                                        key={
                                            document.name ||
                                            document.url ||
                                            index
                                        }
                                    >

                                        <div className="admin-document-icon">
                                            📄
                                        </div>


                                        <div className="admin-document-info">

                                            <strong>
                                                {document.label ||
                                                    document.name ||
                                                    "Document"}
                                            </strong>

                                            <span>
                                                Uploaded document
                                            </span>

                                        </div>


                                        {document.url ? (

                                            <a
                                                href={getMediaUrl(
                                                    document.url
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="admin-document-button"
                                            >

                                                View Document

                                            </a>

                                        ) : (

                                            <span className="document-unavailable">
                                                No file available
                                            </span>

                                        )}

                                    </div>
                                )
                            )}

                        </div>

                    ) : (

                        <div className="admin-no-documents">

                            <div className="empty-document-icon">
                                📂
                            </div>

                            <div>

                                <strong>
                                    No documents uploaded
                                </strong>

                                <p>
                                    No verification documents have
                                    been submitted.
                                </p>

                            </div>

                        </div>

                    )}

                </section>


                {/* =================================================
                    VERIFICATION DETAILS
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

                        <div>

                            <div className="admin-section-icon">
                                ✓
                            </div>

                            <div>

                                <h2>
                                    Verification Details
                                </h2>

                                <p>
                                    Current profile and verification
                                    status.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="verification-layout">


                        {/* DONUT CHART */}

                        <div className="verification-chart-card">

                            <div
                                className={
                                    getStatusChartClass(
                                        approvalStatus
                                    )
                                }
                            >

                                <div className="status-chart-inner">

                                    <strong>
                                        100%
                                    </strong>

                                    <span>
                                        Status
                                    </span>

                                </div>

                            </div>


                            <h3>
                                {getStatusText(
                                    approvalStatus
                                )}
                            </h3>

                            <p>
                                Current verification status
                            </p>

                        </div>


                        {/* DETAILS */}

                        <div className="admin-verification-details">


                            {/* PROFILE COMPLETED */}

                            <div className="verification-detail-item">

                                <span>
                                    Profile Completed
                                </span>

                                <strong
                                    className={
                                        profile.profile_completed
                                            ? "text-success"
                                            : "text-danger"
                                    }
                                >

                                    <span className="status-dot"></span>

                                    {profile.profile_completed
                                        ? "Yes"
                                        : "No"}

                                </strong>

                            </div>


                            {/* APPROVAL STATUS */}

                            <div className="verification-detail-item">

                                <span>
                                    Approval Status
                                </span>

                                <strong
                                    className={
                                        getStatusClass(
                                            approvalStatus
                                        )
                                    }
                                >

                                    {getStatusText(
                                        approvalStatus
                                    )}

                                </strong>

                            </div>


                            {/* SUBMITTED */}

                            <div className="verification-detail-item">

                                <span>
                                    Submitted
                                </span>

                                <strong>
                                    {formatDate(
                                        profile.created_at
                                    )}
                                </strong>

                            </div>


                            {/* LAST UPDATED */}

                            <div className="verification-detail-item">

                                <span>
                                    Last Updated
                                </span>

                                <strong>
                                    {formatDate(
                                        profile.updated_at
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    BACK BUTTON
                ================================================= */}

                <div className="admin-profile-actions">

                    <button
                        type="button"
                        className="profile-back-button"
                        onClick={handleBack}
                    >

                        {backButtonText}

                    </button>

                </div>


            </main>

        </div>
    );
}


// =====================================================
// RESPONSIVE ADMIN EMPLOYER PROFILE CSS
// =====================================================

const adminEmployerProfileCSS = `

/* =====================================================
   GLOBAL BOX SIZING
===================================================== */

.admin-employer-profile-page,
.admin-employer-profile-page *,
.admin-employer-profile-page *::before,
.admin-employer-profile-page *::after {
    box-sizing: border-box;
}


/* =====================================================
   MAIN PAGE
===================================================== */

.admin-employer-profile-page {
    width: 100%;
    max-width: 1180px;
    min-width: 0;

    margin: 0 auto;

    padding: 24px 28px 40px;

    overflow-x: hidden;
}


.admin-employer-profile-page img,
.admin-employer-profile-page a,
.admin-employer-profile-page p,
.admin-employer-profile-page div,
.admin-employer-profile-page h1,
.admin-employer-profile-page h2,
.admin-employer-profile-page h3 {
    max-width: 100%;
}


/* =====================================================
   PAGE TOP
===================================================== */

.admin-page-top {
    width: 100%;
    margin-bottom: 20px;
}

.admin-breadcrumb {
    font-size: 12px;
    font-weight: 600;
    color: #8a94a6;
    margin-bottom: 7px;
}

.admin-page-top h1 {
    margin: 0;
    font-size: 27px;
    font-weight: 700;
    color: #172033;
    letter-spacing: -0.4px;
}

.admin-page-top p {
    margin: 6px 0 0;
    color: #788397;
    font-size: 14px;
}


/* =====================================================
   COMPANY HEADER
===================================================== */

.admin-employer-profile-header {
    width: 100%;
    min-width: 0;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 24px;

    padding: 22px;

    margin-bottom: 18px;

    background: #ffffff;

    border: 1px solid #e8ecf2;

    border-radius: 16px;

    box-shadow:
        0 4px 16px rgba(31, 41, 55, 0.05);
}


.admin-employer-header-left {
    min-width: 0;
    flex: 1;

    display: flex;
    align-items: center;

    gap: 16px;
}


/* =====================================================
   COMPANY LOGO
===================================================== */

.admin-company-logo {
    width: 78px;
    height: 78px;

    flex: 0 0 78px;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: hidden;

    border-radius: 14px;

    background: #f4f7fb;

    border: 1px solid #e4e9f0;
}


.admin-company-logo img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: contain;

    padding: 8px;
}


.admin-company-logo-placeholder {
    width: 100%;
    height: 100%;

    align-items: center;
    justify-content: center;

    font-size: 30px;

    background: #f1f5f9;
}


/* =====================================================
   EMPLOYER HEADING
===================================================== */

.admin-employer-heading {
    min-width: 0;
    flex: 1;
}


.admin-employer-title-row {
    min-width: 0;

    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 10px;
}


.admin-employer-title-row h1 {
    min-width: 0;

    margin: 0;

    font-size: 23px;
    font-weight: 700;

    color: #172033;

    overflow-wrap: anywhere;
    word-break: break-word;
}


.admin-employer-heading > p {
    margin: 7px 0 0;

    color: #7b8799;

    font-size: 13px;

    overflow-wrap: anywhere;
}


/* =====================================================
   STATUS BADGE
===================================================== */

.admin-profile-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 5px 11px;

    border-radius: 999px;

    font-size: 11px;
    font-weight: 700;

    text-transform: capitalize;

    white-space: nowrap;
}


.admin-profile-status.approved {
    color: #16845b;
    background: #e8f8f1;
}


.admin-profile-status.rejected {
    color: #d34b5d;
    background: #fdecef;
}


.admin-profile-status.pending {
    color: #b47708;
    background: #fff5dc;
}


/* =====================================================
   HEADER STATUS BOX
===================================================== */

.admin-header-status-box {
    flex: 0 0 auto;

    min-width: 175px;

    display: flex;
    align-items: center;

    gap: 12px;

    padding: 10px 14px;

    border-radius: 13px;

    background: #f8fafc;

    border: 1px solid #e7ebf1;
}


.status-chart {
    width: 58px;
    height: 58px;

    flex: 0 0 58px;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
}


.approved-chart {
    background:
        conic-gradient(
            #20b981 0deg 360deg,
            #e8f8f1 360deg
        );
}


.rejected-chart {
    background:
        conic-gradient(
            #ef5b6b 0deg 360deg,
            #fdecef 360deg
        );
}


.pending-chart {
    background:
        conic-gradient(
            #f0a51a 0deg 360deg,
            #fff4d9 360deg
        );
}


.status-chart-inner {
    width: 42px;
    height: 42px;

    border-radius: 50%;

    background: #ffffff;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    box-shadow:
        0 1px 4px rgba(0, 0, 0, 0.05);
}


.status-chart-inner strong {
    font-size: 11px;
    line-height: 1;

    color: #253044;
}


.status-chart-inner span {
    margin-top: 3px;

    font-size: 7px;

    color: #8b95a5;
}


.status-chart-content {
    min-width: 0;

    display: flex;
    flex-direction: column;
}


.status-chart-content span {
    color: #8a94a6;

    font-size: 10px;
    font-weight: 600;
}


.status-chart-content strong {
    margin-top: 3px;

    font-size: 14px;

    color: #202b3c;
}


/* =====================================================
   PROFILE CARD
===================================================== */

.admin-profile-card {
    width: 100%;
    min-width: 0;

    margin-bottom: 18px;

    padding: 22px;

    background: #ffffff;

    border: 1px solid #e8ecf2;

    border-radius: 15px;

    box-shadow:
        0 3px 12px rgba(31, 41, 55, 0.035);

    overflow: hidden;
}


/* =====================================================
   CARD HEADER
===================================================== */

.admin-profile-card-header {
    width: 100%;
    min-width: 0;

    margin-bottom: 20px;
}


.admin-profile-card-header > div {
    display: flex;
    align-items: flex-start;

    gap: 11px;

    min-width: 0;
}


.admin-section-icon {
    width: 36px;
    height: 36px;

    flex: 0 0 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 9px;

    background: #f1f5ff;

    font-size: 16px;
}


.admin-profile-card-header h2 {
    margin: 0;

    font-size: 17px;
    font-weight: 700;

    color: #202a3b;
}


.admin-profile-card-header p {
    margin: 4px 0 0;

    color: #8993a4;

    font-size: 12px;

    overflow-wrap: anywhere;
}


/* =====================================================
   PROFILE GRID
===================================================== */

.admin-profile-grid {
    width: 100%;
    min-width: 0;

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 14px 18px;
}


/* =====================================================
   PROFILE FIELD
===================================================== */

.admin-profile-field {
    min-width: 0;

    padding: 13px 14px;

    background: #fafbfd;

    border: 1px solid #edf0f4;

    border-radius: 10px;

    overflow: hidden;
}


.admin-profile-field label {
    display: block;

    margin-bottom: 6px;

    color: #8a94a6;

    font-size: 10px;
    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.45px;
}


.admin-profile-field > div {
    color: #283346;

    font-size: 13px;
    font-weight: 600;

    line-height: 1.5;

    overflow-wrap: anywhere;
    word-break: break-word;
}


.admin-profile-field a {
    display: inline-block;

    max-width: 100%;

    color: #3967d6;

    font-size: 13px;
    font-weight: 600;

    text-decoration: none;

    overflow-wrap: anywhere;
    word-break: break-word;
}


.admin-profile-field a:hover {
    text-decoration: underline;
}


/* =====================================================
   COMPANY DESCRIPTION
===================================================== */

.admin-profile-description {
    margin-top: 16px;

    padding: 15px;

    background: #fafbfd;

    border: 1px solid #edf0f4;

    border-radius: 10px;
}


.admin-profile-description label {
    display: block;

    margin-bottom: 7px;

    color: #8a94a6;

    font-size: 10px;
    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.45px;
}


.admin-profile-description p {
    margin: 0;

    color: #414c5e;

    font-size: 13px;

    line-height: 1.65;

    overflow-wrap: anywhere;
    word-break: break-word;
}


/* =====================================================
   LOGO PREVIEW
===================================================== */

.admin-logo-preview {
    width: 100%;
    min-height: 170px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background: #fafbfd;

    border: 1px solid #edf0f4;

    border-radius: 12px;

    overflow: hidden;
}


.admin-logo-preview img {
    display: block;

    max-width: 100%;
    width: auto;

    max-height: 180px;

    height: auto;

    object-fit: contain;
}


/* =====================================================
   DOCUMENT LIST
===================================================== */

.admin-documents-list {
    width: 100%;
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 10px;
}


.admin-document-item {
    width: 100%;
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 12px;

    padding: 13px 14px;

    background: #fafbfd;

    border: 1px solid #edf0f4;

    border-radius: 10px;

    overflow: hidden;
}


.admin-document-icon {
    width: 38px;
    height: 38px;

    flex: 0 0 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 9px;

    background: #eef3ff;

    font-size: 17px;
}


.admin-document-info {
    min-width: 0;
    flex: 1;
}


.admin-document-info strong {
    display: block;

    color: #293447;

    font-size: 13px;

    overflow-wrap: anywhere;
    word-break: break-word;
}


.admin-document-info span {
    display: block;

    margin-top: 3px;

    color: #9099a8;

    font-size: 11px;
}


.admin-document-button {
    flex: 0 0 auto;

    padding: 7px 12px;

    border-radius: 7px;

    background: #eef3ff;

    color: #4169cf;

    font-size: 11px;
    font-weight: 700;

    text-decoration: none;

    white-space: nowrap;
}


.admin-document-button:hover {
    background: #e1e9ff;
}


.document-unavailable {
    flex: 0 0 auto;

    color: #9aa2ae;

    font-size: 11px;
}


/* =====================================================
   NO DOCUMENTS
===================================================== */

.admin-no-documents {
    min-height: 105px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 12px;

    padding: 20px;

    background: #fafbfd;

    border: 1px dashed #dfe4eb;

    border-radius: 11px;
}


.empty-document-icon {
    font-size: 25px;
}


.admin-no-documents strong {
    display: block;

    color: #4c5667;

    font-size: 13px;
}


.admin-no-documents p {
    margin: 4px 0 0;

    color: #969eac;

    font-size: 11px;
}


/* =====================================================
   VERIFICATION LAYOUT
===================================================== */

.verification-layout {
    width: 100%;
    min-width: 0;

    display: grid;

    grid-template-columns:
        190px minmax(0, 1fr);

    gap: 20px;

    align-items: stretch;
}


/* =====================================================
   VERIFICATION CHART CARD
===================================================== */

.verification-chart-card {
    min-width: 0;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    padding: 18px;

    border-radius: 12px;

    background: #fafbfd;

    border: 1px solid #edf0f4;
}


.verification-chart-card .status-chart {
    width: 100px;
    height: 100px;
}


.verification-chart-card
.status-chart
.status-chart-inner {
    width: 74px;
    height: 74px;
}


.verification-chart-card
.status-chart
.status-chart-inner strong {
    font-size: 16px;
}


.verification-chart-card
.status-chart
.status-chart-inner span {
    font-size: 9px;
}


.verification-chart-card h3 {
    margin: 12px 0 3px;

    font-size: 15px;

    color: #283346;
}


.verification-chart-card p {
    margin: 0;

    color: #929baa;

    font-size: 11px;

    text-align: center;
}


/* =====================================================
   VERIFICATION DETAILS
===================================================== */

.admin-verification-details {
    min-width: 0;

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 12px;
}


.verification-detail-item {
    min-width: 0;

    display: flex;
    flex-direction: column;

    justify-content: center;

    gap: 6px;

    padding: 13px 14px;

    background: #fafbfd;

    border: 1px solid #edf0f4;

    border-radius: 10px;

    overflow: hidden;
}


.verification-detail-item > span {
    color: #8b95a5;

    font-size: 10px;
    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 0.4px;
}


.verification-detail-item > strong {
    color: #293447;

    font-size: 13px;

    overflow-wrap: anywhere;
}


.status-dot {
    width: 7px;
    height: 7px;

    display: inline-block;

    margin-right: 5px;

    border-radius: 50%;

    background: currentColor;
}


.text-success {
    color: #16845b !important;
}


.text-danger {
    color: #d34b5d !important;
}


/* =====================================================
   ACTIONS
===================================================== */

.admin-profile-actions {
    width: 100%;

    display: flex;

    justify-content: flex-start;

    margin-top: 4px;
}


.admin-profile-actions button,
.admin-profile-back-button {
    border: none;

    padding: 10px 17px;

    border-radius: 9px;

    background: #edf2ff;

    color: #3e63c8;

    font-size: 12px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}


.admin-profile-actions button:hover,
.admin-profile-back-button:hover {
    background: #e1e9ff;

    transform: translateY(-1px);
}


/* =====================================================
   LOADING
===================================================== */

.admin-profile-loading-card {
    min-height: 300px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    padding: 30px;

    background: #ffffff;

    border: 1px solid #e8ecf2;

    border-radius: 15px;
}


.admin-profile-loading-card p {
    margin-top: 14px;

    color: #7d8797;

    font-size: 13px;
}


.admin-loading-spinner {
    width: 34px;
    height: 34px;

    border: 3px solid #e6ebf3;

    border-top-color: #4c6fdc;

    border-radius: 50%;

    animation:
        adminProfileSpin
        0.8s linear infinite;
}


@keyframes adminProfileSpin {

    to {
        transform: rotate(360deg);
    }

}


/* =====================================================
   ERROR
===================================================== */

.admin-profile-error-card {
    min-height: 260px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    padding: 30px;

    text-align: center;

    background: #ffffff;

    border: 1px solid #f0d9dd;

    border-radius: 15px;
}


.error-icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 12px;

    border-radius: 50%;

    background: #fdecef;

    color: #d34b5d;

    font-size: 20px;
    font-weight: 800;
}


.admin-profile-error-card h2 {
    margin: 0;

    font-size: 17px;

    color: #30394a;
}


.admin-profile-error-card p {
    max-width: 500px;

    margin: 7px 0 18px;

    color: #8a94a4;

    font-size: 12px;

    overflow-wrap: anywhere;
}


/* =====================================================
   TABLET
===================================================== */

@media (max-width: 1000px) {

    .admin-employer-profile-page {
        max-width: 100%;

        padding:
            20px 20px 35px;
    }


    .admin-employer-profile-header {
        align-items: flex-start;

        flex-direction: column;
    }


    .admin-header-status-box {
        width: 100%;
    }


    .verification-layout {
        grid-template-columns:
            160px minmax(0, 1fr);
    }

}


/* =====================================================
   SMALL TABLET
===================================================== */

@media (max-width: 800px) {

    .admin-profile-grid {
        grid-template-columns: 1fr;
    }


    .verification-layout {
        grid-template-columns: 1fr;
    }


    .verification-chart-card {
        min-height: 190px;
    }

}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 600px) {

    .admin-employer-profile-page {
        width: 100%;
        max-width: 100%;

        padding:
            15px 12px 30px;

        overflow-x: hidden;
    }


    .admin-page-top {
        margin-bottom: 14px;
    }


    .admin-page-top h1 {
        font-size: 22px;
    }


    .admin-page-top p {
        font-size: 12px;
    }


    .admin-employer-profile-header {
        padding: 15px;

        gap: 16px;

        border-radius: 13px;
    }


    .admin-employer-header-left {
        width: 100%;

        align-items: flex-start;

        gap: 12px;
    }


    .admin-company-logo {
        width: 62px;
        height: 62px;

        flex: 0 0 62px;
    }


    .admin-company-logo-placeholder {
        font-size: 23px;
    }


    .admin-employer-title-row {
        width: 100%;

        gap: 7px;
    }


    .admin-employer-title-row h1 {
        font-size: 18px;

        line-height: 1.3;
    }


    .admin-employer-heading > p {
        font-size: 11px;

        line-height: 1.5;
    }


    .admin-header-status-box {
        min-width: 0;

        padding: 9px 11px;
    }


    .status-chart {
        width: 50px;
        height: 50px;

        flex: 0 0 50px;
    }


    .status-chart-inner {
        width: 36px;
        height: 36px;
    }


    .status-chart-inner strong {
        font-size: 10px;
    }


    .admin-profile-card {
        padding: 16px;

        margin-bottom: 13px;

        border-radius: 12px;
    }


    .admin-profile-card-header {
        margin-bottom: 14px;
    }


    .admin-profile-card-header h2 {
        font-size: 15px;
    }


    .admin-profile-card-header p {
        font-size: 11px;
    }


    .admin-section-icon {
        width: 32px;
        height: 32px;

        flex: 0 0 32px;

        font-size: 14px;
    }


    .admin-profile-grid {
        grid-template-columns: 1fr;

        gap: 10px;
    }


    .admin-profile-field {
        padding: 11px 12px;
    }


    .admin-profile-field label,
    .verification-detail-item > span {
        font-size: 9px;
    }


    .admin-profile-field > div {
        font-size: 12px;
    }


    .admin-profile-description {
        padding: 12px;

        margin-top: 11px;
    }


    .admin-profile-description p {
        font-size: 12px;
    }


    .admin-logo-preview {
        min-height: 130px;

        padding: 14px;
    }


    .admin-logo-preview img {
        max-height: 130px;
    }


    .admin-document-item {
        align-items: flex-start;

        flex-wrap: wrap;

        padding: 11px;
    }


    .admin-document-info {
        flex: 1 1 calc(100% - 55px);

        min-width: 0;
    }


    .admin-document-button {
        width: 100%;

        text-align: center;

        margin-top: 3px;
    }


    .document-unavailable {
        width: 100%;

        margin-left: 50px;
    }


    .verification-layout {
        grid-template-columns: 1fr;

        gap: 12px;
    }


    .verification-chart-card {
        min-height: 180px;
    }


    .verification-chart-card .status-chart {
        width: 90px;
        height: 90px;
    }


    .verification-chart-card
    .status-chart
    .status-chart-inner {
        width: 67px;
        height: 67px;
    }


    .admin-verification-details {
        grid-template-columns: 1fr;

        gap: 9px;
    }


    .verification-detail-item {
        padding: 11px 12px;
    }


    .admin-profile-actions button {
        width: 100%;

        padding: 11px;
    }

}


/* =====================================================
   VERY SMALL MOBILE
===================================================== */

@media (max-width: 400px) {

    .admin-employer-profile-page {
        padding-left: 8px;
        padding-right: 8px;
    }


    .admin-employer-profile-header {
        padding: 12px;
    }


    .admin-company-logo {
        width: 54px;
        height: 54px;

        flex-basis: 54px;
    }


    .admin-employer-title-row h1 {
        font-size: 16px;
    }


    .admin-profile-card {
        padding: 13px;
    }


    .admin-profile-card-header h2 {
        font-size: 14px;
    }


    .admin-profile-card-header p {
        font-size: 10px;
    }


    .admin-profile-field > div {
        font-size: 11px;
    }

}

`;


// =====================================================
// STYLE WRAPPER
// =====================================================

function AdminEmployerProfileWithStyle() {

    return (
        <>
            <style>
                {adminEmployerProfileCSS}
            </style>

            <AdminEmployerProfile />
        </>
    );
}


export default AdminEmployerProfileWithStyle;
