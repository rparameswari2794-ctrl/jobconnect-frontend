import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams,
    useLocation
} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function AdminEmployerProfile() {

    const { id } = useParams();

    const navigate = useNavigate();

    const location = useLocation();

    const fromPage =
        location.state?.from || "verification";

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
            return `http://localhost:8000${url}`;
        }

        return `http://localhost:8000/${url}`;
    }

    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        loadProfile();

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

            const response = await fetch(
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

        return new Date(date).toLocaleDateString(
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
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="admin-dashboard">

                <main className="admin-main">

                    <div className="admin-empty-state">
                        Loading employer profile...
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
            <div className="admin-dashboard">

                <main className="admin-main">

                    <div className="verification-empty verification-error">
                        {error}
                    </div>

                    <button
                        type="button"
                        className="admin-back-button"
                        onClick={() => {

                            if (fromPage === "users") {

                                navigate("/admin/users");

                                return;
                            }

                            navigate("/admin/verifications");
                        }}
                    >
                        {fromPage === "users"
                            ? "← Back to Users"
                            : "← Back to Verification Queue"
                        }
                    </button>
                </main>

            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const approvalStatus =
        String(
            profile.approval_status || "pending"
        ).toLowerCase();

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
                    HEADER
                ================================================= */}

                <section className="admin-employer-profile-header">

                    <div className="admin-employer-header-left">

                        {/* LOGO */}

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
                                    onError={(e) => {
                                        e.currentTarget.style.display =
                                            "none";

                                        e.currentTarget.nextElementSibling.style.display =
                                            "flex";
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


                        {/* TITLE */}

                        <div>

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
                                    {approvalStatus}
                                </span>

                            </div>

                            <p>
                                Review the submitted company
                                information before verification.
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    COMPANY INFORMATION
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

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


                    <div className="admin-profile-grid">

                        <div className="admin-profile-field">

                            <label>
                                Company name
                            </label>

                            <div>
                                {profile.company_name || "—"}
                            </div>

                        </div>


                        <div className="admin-profile-field">

                            <label>
                                Company email
                            </label>

                            <div>
                                {profile.company_email ||
                                    profile.email ||
                                    "—"}
                            </div>

                        </div>


                        <div className="admin-profile-field">

                            <label>
                                Phone number
                            </label>

                            <div>
                                {profile.phone || "—"}
                            </div>

                        </div>


                        <div className="admin-profile-field">

                            <label>
                                Company website
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
                                        rel="noreferrer"
                                    >
                                        {profile.website}
                                    </a>

                                ) : (
                                    "—"
                                )}

                            </div>

                        </div>


                        <div className="admin-profile-field">

                            <label>
                                Company location
                            </label>

                            <div>
                                {profile.location || "—"}
                            </div>

                        </div>

                    </div>


                    {/* DESCRIPTION */}

                    <div className="admin-profile-description">

                        <label>
                            Company description
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

                            <h2>
                                Company Representative
                            </h2>

                            <p>
                                Person responsible for hiring.
                            </p>

                        </div>

                    </div>


                    <div className="admin-profile-grid">

                        <div className="admin-profile-field">

                            <label>
                                Representative name
                            </label>

                            <div>
                                {profile.contact_name || "—"}
                            </div>

                        </div>


                        <div className="admin-profile-field">

                            <label>
                                Representative email
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

                                <h2>
                                    Company Logo
                                </h2>

                                <p>
                                    Logo uploaded by the employer.
                                </p>

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

                            <h2>
                                Uploaded Documents
                            </h2>

                            <p>
                                Documents submitted by the employer
                                for verification.
                            </p>

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


                                        <a
                                            href={getMediaUrl(
                                                document.url
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="admin-document-button"
                                        >
                                            View Document
                                        </a>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="admin-no-documents">

                            <span>
                                📂
                            </span>

                            <p>
                                No documents have been uploaded.
                            </p>

                        </div>

                    )}

                </section>


                {/* =================================================
                    VERIFICATION DETAILS
                ================================================= */}

                <section className="admin-profile-card">

                    <div className="admin-profile-card-header">

                        <div>

                            <h2>
                                Verification Details
                            </h2>

                            <p>
                                Current profile and verification status.
                            </p>

                        </div>

                    </div>


                    <div className="admin-verification-details">

                        <div>

                            <span>
                                Profile completed
                            </span>

                            <strong
                                className={
                                    profile.profile_completed
                                        ? "text-success"
                                        : "text-danger"
                                }
                            >
                                {profile.profile_completed
                                    ? "Yes"
                                    : "No"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Approval status
                            </span>

                            <strong
                                className={
                                    getStatusClass(
                                        approvalStatus
                                    )
                                }
                            >
                                {approvalStatus}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Submitted
                            </span>

                            <strong>
                                {formatDate(
                                    profile.created_at
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Last updated
                            </span>

                            <strong>
                                {formatDate(
                                    profile.updated_at
                                )}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    BACK BUTTON
                ================================================= */}

                <div className="admin-profile-actions">

                    <button
                        type="button"
                        onClick={() => {

                            if (fromPage === "users") {

                                navigate("/admin/users");

                                return;
                            }

                            navigate("/admin/verifications");
                        }}
                    >
                        {fromPage === "users"
                            ? "← Back to Users"
                            : "← Back to Verification Queue"
                        }
                    </button>

                </div>

            </main>

        </div>
    );
}

export default AdminEmployerProfile;