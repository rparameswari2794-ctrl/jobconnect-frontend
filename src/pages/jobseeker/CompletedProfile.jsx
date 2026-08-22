import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/auth/jobseeker/";

const PROFILE_API = `${API_BASE}profile/`;
const EDUCATION_API = `${API_BASE}education/`;
const EXPERIENCE_API = `${API_BASE}experience/`;
const PROJECT_API = `${API_BASE}projects/`;

function CompletedProfile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [education, setEducation] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [projects, setProjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showOverlay, setShowOverlay] = useState(false);
    const [overlaySection, setOverlaySection] = useState("");
    const [overlayAction, setOverlayAction] = useState("add");
    const [selectedItem, setSelectedItem] = useState(null);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState({});

    // =====================================================
    // TOKEN
    // =====================================================

    function getToken() {
        return localStorage.getItem("jc_token");
    }

    // =====================================================
    // MEDIA URL
    // =====================================================

    function getMediaUrl(url) {
        if (!url) return "";

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
    // SAFE VALUE
    // Prevent React object rendering error
    // =====================================================

    function safeValue(value, fallback = "-") {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        if (typeof value === "object") {
            return "";
        }

        return String(value);
    }

    // =====================================================
    // NORMALIZE API RESPONSE
    // =====================================================

    function normalizeList(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            Array.isArray(data.results)
        ) {
            return data.results;
        }

        return [];
    }

    // =====================================================
    // LOAD ALL
    // =====================================================

    useEffect(() => {
        loadAllProfileData();
    }, []);

    async function loadAllProfileData() {
        const token = getToken();

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [
                profileResponse,
                educationResponse,
                experienceResponse,
                projectResponse,
            ] = await Promise.all([
                fetch(PROFILE_API, {
                    headers,
                }),

                fetch(EDUCATION_API, {
                    headers,
                }),

                fetch(EXPERIENCE_API, {
                    headers,
                }),

                fetch(PROJECT_API, {
                    headers,
                }),
            ]);

            // =================================================
            // PROFILE
            // =================================================

            const profileData =
                await profileResponse
                    .json()
                    .catch(() => ({}));

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.detail ||
                    profileData.message ||
                    "Unable to load profile."
                );
            }

            // =================================================
            // EDUCATION
            // =================================================

            const educationData =
                await educationResponse
                    .json()
                    .catch(() => []);

            // =================================================
            // EXPERIENCE
            // =================================================

            const experienceData =
                await experienceResponse
                    .json()
                    .catch(() => []);

            // =================================================
            // PROJECTS
            // =================================================

            const projectData =
                await projectResponse
                    .json()
                    .catch(() => []);

            console.log(
                "PROFILE:",
                profileData
            );

            console.log(
                "EDUCATION:",
                educationData
            );

            console.log(
                "EXPERIENCE:",
                experienceData
            );

            console.log(
                "PROJECTS:",
                projectData
            );

            setProfile(profileData);

            /*
             * Profile serializer already contains:
             *
             * educations
             * experiences
             * projects
             *
             * Therefore use the dedicated endpoints when
             * available, but fall back to profile data.
             */

            const educationList =
                normalizeList(educationData);

            const experienceList =
                normalizeList(experienceData);

            const projectList =
                normalizeList(projectData);

            setEducation(
                educationList.length > 0
                    ? educationList
                    : normalizeList(
                        profileData.educations
                    )
            );

            setExperiences(
                experienceList.length > 0
                    ? experienceList
                    : normalizeList(
                        profileData.experiences
                    )
            );

            setProjects(
                projectList.length > 0
                    ? projectList
                    : normalizeList(
                        profileData.projects
                    )
            );

        } catch (err) {
            console.error(
                "Completed profile error:",
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
    // OPEN OVERLAY
    // =====================================================

    function openOverlay(
        section,
        action = "add",
        item = null
    ) {
        setOverlaySection(section);
        setOverlayAction(action);
        setSelectedItem(item);
        setFormError("");
        setMessage("");

        // =================================================
        // PERSONAL
        // =================================================

        if (section === "personal") {
            setForm({
                full_name:
                    profile?.full_name || "",

                phone:
                    profile?.phone || "",

                location:
                    profile?.location || "",
            });
        }

        // =================================================
        // PROFESSIONAL
        // =================================================

        if (section === "professional") {
            setForm({
                headline:
                    profile?.headline || "",

            

                skills:
                    profile?.skills || "",

                linkedin:
                    profile?.linkedin || "",
            });
        }

        // =================================================
        // EDUCATION
        // =================================================

        if (section === "education") {
            setForm({
                degree:
                    item?.degree || "",

                university:
                    item?.university || "",

                college:
                    item?.college || "",

                start_year:
                    item?.start_year || "",

                end_year:
                    item?.end_year || "",

                passing_month_year:
                    item?.passing_month_year || "",

                percentage_cgpa:
                    item?.percentage_cgpa || "",

                activities:
                    item?.activities || "",
            });
        }

        // =================================================
        // EXPERIENCE
        // =================================================

        if (section === "experience") {
            setForm({
                job_title:
                    item?.job_title || "",

                company:
                    item?.company || "",

                employment_type:
                    item?.employment_type || "",

                start_date:
                    item?.start_date || "",

                end_date:
                    item?.end_date || "",

                is_current:
                    item?.is_current || false,

                description:
                    item?.description || "",
            });
        }

        // =================================================
        // PROJECT
        // =================================================

        if (section === "project") {
            setForm({
                title:
                    item?.title || "",

                project_type:
                    item?.project_type || "",

                technologies:
                    item?.technologies || "",

                project_link:
                    item?.project_link || "",

                description:
                    item?.description || "",
            });
        }

        setShowOverlay(true);
    }

    // =====================================================
    // CLOSE
    // =====================================================

    function closeOverlay() {
        if (saving) return;

        setShowOverlay(false);
        setOverlaySection("");
        setOverlayAction("add");
        setSelectedItem(null);
        setForm({});
        setFormError("");
        setMessage("");
    }

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    function handleChange(event) {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setForm(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    }

    // =====================================================
    // SAVE PROFILE
    // =====================================================

    async function saveProfileSection() {
        const token = getToken();

        try {
            setSaving(true);
            setFormError("");
            setMessage("");

            const response = await fetch(
                PROFILE_API,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(form),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    Object.values(data)
                        .flat()
                        .join(" ") ||
                    "Unable to update profile."
                );
            }

            setProfile(prev => ({
                ...prev,
                ...data,
            }));

            setMessage(
                "Profile updated successfully."
            );

            setTimeout(() => {
                closeOverlay();
            }, 700);

        } catch (err) {
            setFormError(
                err.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // SAVE EDUCATION
    // =====================================================

    async function saveEducation() {
        const token = getToken();

        try {
            setSaving(true);
            setFormError("");
            setMessage("");

            const isEdit =
                overlayAction === "edit";

            const url = isEdit
                ? `${EDUCATION_API}${selectedItem.id}/`
                : EDUCATION_API;

            const response = await fetch(
                url,
                {
                    method: isEdit
                        ? "PATCH"
                        : "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(form),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    Object.values(data)
                        .flat()
                        .join(" ") ||
                    "Unable to save education."
                );
            }

            setMessage(
                isEdit
                    ? "Education updated successfully."
                    : "Education added successfully."
            );

            await loadAllProfileData();

            setTimeout(() => {
                closeOverlay();
            }, 700);

        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                "Unable to save education."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // SAVE EXPERIENCE
    // =====================================================

    async function saveExperience() {
        const token = getToken();

        try {
            setSaving(true);
            setFormError("");
            setMessage("");

            const isEdit =
                overlayAction === "edit";

            const url = isEdit
                ? `${EXPERIENCE_API}${selectedItem.id}/`
                : EXPERIENCE_API;

            const payload = {
                job_title:
                    form.job_title || "",

                company:
                    form.company || "",

                employment_type:
                    form.employment_type || "",

                start_date:
                    form.start_date || "",

                end_date:
                    form.is_current
                        ? null
                        : (
                            form.end_date || ""
                        ),

                is_current:
                    Boolean(form.is_current),

                description:
                    form.description || "",
            };

            const response = await fetch(
                url,
                {
                    method: isEdit
                        ? "PATCH"
                        : "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    Object.values(data)
                        .flat()
                        .join(" ") ||
                    "Unable to save experience."
                );
            }

            setMessage(
                isEdit
                    ? "Experience updated successfully."
                    : "Experience added successfully."
            );

            await loadAllProfileData();

            setTimeout(() => {
                closeOverlay();
            }, 700);

        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                "Unable to save experience."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // SAVE PROJECT
    // =====================================================

    async function saveProject() {
        const token = getToken();

        try {
            setSaving(true);
            setFormError("");
            setMessage("");

            const isEdit =
                overlayAction === "edit";

            const url = isEdit
                ? `${PROJECT_API}${selectedItem.id}/`
                : PROJECT_API;

            const payload = {
                title:
                    form.title || "",

                project_type:
                    form.project_type || "",

                technologies:
                    form.technologies || "",

                project_link:
                    form.project_link || "",

                description:
                    form.description || "",
            };

            const response = await fetch(
                url,
                {
                    method: isEdit
                        ? "PATCH"
                        : "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    Object.values(data)
                        .flat()
                        .join(" ") ||
                    "Unable to save project."
                );
            }

            setMessage(
                isEdit
                    ? "Project updated successfully."
                    : "Project added successfully."
            );

            await loadAllProfileData();

            setTimeout(() => {
                closeOverlay();
            }, 700);

        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                "Unable to save project."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // DELETE
    // =====================================================

    async function deleteItem() {
        const token = getToken();

        try {
            setSaving(true);
            setFormError("");

            let url = "";

            if (
                overlaySection ===
                "education"
            ) {
                url =
                    `${EDUCATION_API}${selectedItem.id}/`;
            }

            if (
                overlaySection ===
                "experience"
            ) {
                url =
                    `${EXPERIENCE_API}${selectedItem.id}/`;
            }

            if (
                overlaySection ===
                "project"
            ) {
                url =
                    `${PROJECT_API}${selectedItem.id}/`;
            }

            if (!url) {
                throw new Error(
                    "Invalid delete request."
                );
            }

            const response = await fetch(
                url,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (
                !response.ok &&
                response.status !== 204
            ) {
                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to delete item."
                );
            }

            await loadAllProfileData();

            closeOverlay();

        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                "Unable to delete item."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // SUBMIT
    // =====================================================

    function handleSubmit(event) {
        event.preventDefault();

        if (
            overlaySection === "personal" ||
            overlaySection === "professional"
        ) {
            saveProfileSection();
            return;
        }

        if (
            overlaySection === "education"
        ) {
            saveEducation();
            return;
        }

        if (
            overlaySection === "experience"
        ) {
            saveExperience();
            return;
        }

        if (
            overlaySection === "project"
        ) {
            saveProject();
        }
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="completed-profile-page">
                <main className="completed-profile-main">
                    <div className="completed-loading">
                        <p>Loading profile...</p>
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
            <div className="completed-profile-page">
                <main className="completed-profile-main">

                    <div className="documents-error">
                        {error}
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/jobseeker/dashboard"
                            )
                        }
                    >
                        Back to dashboard
                    </button>

                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="completed-profile-page">
                <main className="completed-profile-main">
                    <div className="documents-error">
                        Profile not found.
                    </div>
                </main>
            </div>
        );
    }

    const approvalStatus =
        profile.approval_status;

    // =====================================================
    // PENDING
    // =====================================================

    if (
        profile.profile_completed === true &&
        approvalStatus === "pending"
    ) {
        return (
            <div className="profile-details-page">
                <main className="profile-details-main">

                    <section className="profile-details-header">
                        <h1>
                            Profile & verification
                        </h1>

                        <p>
                            Your profile has been submitted
                            for admin verification.
                        </p>
                    </section>

                    <section className="profile-section submitted-profile-section">

                        <div className="submitted-profile-content">

                            <div className="submitted-success-icon">
                                ✓
                            </div>

                            <h2>
                                Profile submitted
                            </h2>

                            <p>
                                Your profile is currently
                                waiting for admin verification.
                            </p>

                            <div className="submitted-status">
                                <span className="submitted-status-dot" />

                                <strong>
                                    Pending admin approval
                                </strong>
                            </div>

                            <p>
                                🔒 You cannot edit your profile
                                while verification is in progress.
                            </p>

                        </div>

                    </section>

                </main>
            </div>
        );
    }

    // =====================================================
    // REJECTED
    // =====================================================

    if (
        approvalStatus === "rejected"
    ) {
        return (
            <div className="completed-profile-page">
                <main className="completed-profile-main">

                    <section className="profile-submitted-card rejected-card">

                        <div className="profile-submitted-icon">
                            !
                        </div>

                        <h1>
                            Profile rejected
                        </h1>

                        <p>
                            Your profile could not be
                            approved at this time.
                        </p>

                        {profile.rejection_reason && (
                            <div className="rejection-reason">
                                <strong>
                                    Reason:
                                </strong>

                                <p>
                                    {safeValue(
                                        profile.rejection_reason
                                    )}
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            className="edit-profile-button"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/profile"
                                )
                            }
                        >
                            Edit profile
                        </button>

                    </section>

                </main>
            </div>
        );
    }

    // =====================================================
    // APPROVED
    // =====================================================

    if (
        profile.profile_completed === true &&
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

                            <div className="approved-header-title">
                                <h1>
                                    My Profile
                                </h1>
                            </div>

                            <div className="approved-profile-right">

                                <div className="approved-profile-photo">

                                    {profile.profile_photo ? (
                                        <img
                                            src={getMediaUrl(
                                                profile.profile_photo
                                            )}
                                            alt={
                                                profile.full_name ||
                                                "Profile"
                                            }
                                        />
                                    ) : (
                                        <div className="approved-photo-placeholder">
                                            👤
                                        </div>
                                    )}

                                </div>

                                <div className="verified-badge-small">
                                    ✓ Verified
                                </div>

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        BASIC
                    ================================================= */}

                    <section className="profile-section verified-profile-basic-section">

                        <div className="verified-profile-basic">

                            <h2>
                                {safeValue(
                                    profile.full_name
                                )}
                            </h2>

                            <p>
                                {safeValue(
                                    profile.headline,
                                    "Job Seeker"
                                )}
                            </p>

                        </div>

                    </section>

                    {/* =================================================
                        PERSONAL
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <h2>
                                Personal Details
                            </h2>

                            <button
                                type="button"
                                className="section-edit-button"
                                onClick={() =>
                                    openOverlay(
                                        "personal",
                                        "edit"
                                    )
                                }
                            >
                                ✏️ Edit
                            </button>

                        </div>

                        <div className="profile-details-grid">

                            <div className="profile-detail-item">
                                <label>
                                    Full Name
                                </label>

                                <p>
                                    {safeValue(
                                        profile.full_name
                                    )}
                                </p>
                            </div>

                            <div className="profile-detail-item">
                                <label>
                                    Email
                                </label>

                                <p>
                                    {safeValue(
                                        profile.email
                                    )}
                                </p>
                            </div>

                            <div className="profile-detail-item">
                                <label>
                                    Phone
                                </label>

                                <p>
                                    {safeValue(
                                        profile.phone
                                    )}
                                </p>
                            </div>

                            <div className="profile-detail-item">
                                <label>
                                    Location
                                </label>

                                <p>
                                    {safeValue(
                                        profile.location
                                    )}
                                </p>
                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        PROFESSIONAL
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <h2>
                                Professional Details
                            </h2>

                            <button
                                type="button"
                                className="section-edit-button"
                                onClick={() =>
                                    openOverlay(
                                        "professional",
                                        "edit"
                                    )
                                }
                            >
                                ✏️ Edit
                            </button>

                        </div>

                        <div className="profile-details-grid">

                            <div className="profile-detail-item">
                                <label>
                                    Headline
                                </label>

                                <p>
                                    {safeValue(
                                        profile.headline
                                    )}
                                </p>
                            </div>

                            
                            <div className="profile-detail-item">
                                <label>
                                    Skills
                                </label>

                                <p>
                                    {safeValue(
                                        profile.skills
                                    )}
                                </p>
                            </div>

                            <div className="profile-detail-item">

                                <label>
                                    LinkedIn
                                </label>

                                {profile.linkedin ? (
                                    <a
                                        href={
                                            profile.linkedin
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View LinkedIn
                                    </a>
                                ) : (
                                    <p>-</p>
                                )}

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        EDUCATION
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <h2>
                                Education
                            </h2>

                            <button
                                type="button"
                                className="section-add-button"
                                onClick={() =>
                                    openOverlay(
                                        "education",
                                        "add"
                                    )
                                }
                            >
                                + Add
                            </button>

                        </div>

                        {education.length > 0 ? (

                            <div className="profile-items-list">

                                {education.map(item => (

                                    <div
                                        className="profile-item profile-item-with-actions"
                                        key={item.id}
                                    >

                                        <div className="profile-item-content">

                                            <h3>
                                                {safeValue(
                                                    item.degree
                                                )}
                                            </h3>

                                            {item.college && (
                                                <p>
                                                    College:{" "}
                                                    {safeValue(
                                                        item.college
                                                    )}
                                                </p>
                                            )}

                                            {item.university && (
                                                <p>
                                                    University:{" "}
                                                    {safeValue(
                                                        item.university
                                                    )}
                                                </p>
                                            )}

                                            {(
                                                item.start_year ||
                                                item.end_year
                                            ) && (
                                                <small>
                                                    {safeValue(
                                                        item.start_year
                                                    )}
                                                    {" - "}
                                                    {item.end_year
                                                        ? safeValue(
                                                            item.end_year
                                                        )
                                                        : "Present"}
                                                </small>
                                            )}

                                            {item.passing_month_year && (
                                                <p>
                                                    Passing:{" "}
                                                    {safeValue(
                                                        item.passing_month_year
                                                    )}
                                                </p>
                                            )}

                                            {item.percentage_cgpa && (
                                                <p>
                                                    Percentage / CGPA:{" "}
                                                    {safeValue(
                                                        item.percentage_cgpa
                                                    )}
                                                </p>
                                            )}

                                            {item.activities && (
                                                <p>
                                                    Activities:{" "}
                                                    {safeValue(
                                                        item.activities
                                                    )}
                                                </p>
                                            )}

                                        </div>

                                        <div className="profile-item-actions">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openOverlay(
                                                        "education",
                                                        "edit",
                                                        item
                                                    )
                                                }
                                                title="Edit education"
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openOverlay(
                                                        "education",
                                                        "delete",
                                                        item
                                                    )
                                                }
                                                title="Delete education"
                                            >
                                                🗑️
                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        ) : (
                            <p className="profile-empty">
                                No education details added.
                            </p>
                        )}

                    </section>

                    {/* =================================================
                        EXPERIENCE
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <h2>
                                Experience
                            </h2>

                            <button
                                type="button"
                                className="section-add-button"
                                onClick={() =>
                                    openOverlay(
                                        "experience",
                                        "add"
                                    )
                                }
                            >
                                + Add
                            </button>

                        </div>

                        {experiences.length > 0 ? (

                            <div className="profile-items-list">

                                {experiences.map(item => (

                                    <div
                                        className="profile-item profile-item-with-actions"
                                        key={item.id}
                                    >

                                        <div className="profile-item-content">

                                            <h3>
                                                {safeValue(
                                                    item.job_title
                                                )}
                                            </h3>

                                            <p>
                                                {safeValue(
                                                    item.company
                                                )}
                                            </p>

                                            {item.employment_type && (
                                                <p>
                                                    Employment Type:{" "}
                                                    {safeValue(
                                                        item.employment_type
                                                    )}
                                                </p>
                                            )}

                                            {(item.start_date ||
                                                item.end_date ||
                                                item.is_current) && (
                                                <small>
                                                    {safeValue(
                                                        item.start_date
                                                    )}
                                                    {" - "}

                                                    {item.is_current
                                                        ? "Present"
                                                        : safeValue(
                                                            item.end_date
                                                        )}
                                                </small>
                                            )}

                                            {item.description && (
                                                <p>
                                                    {safeValue(
                                                        item.description
                                                    )}
                                                </p>
                                            )}

                                        </div>

                                        <div className="profile-item-actions">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openOverlay(
                                                        "experience",
                                                        "edit",
                                                        item
                                                    )
                                                }
                                                title="Edit experience"
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openOverlay(
                                                        "experience",
                                                        "delete",
                                                        item
                                                    )
                                                }
                                                title="Delete experience"
                                            >
                                                🗑️
                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        ) : (
                            <p className="profile-empty">
                                No experience details added.
                            </p>
                        )}

                    </section>

                    {/* =================================================
                        PROJECTS
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">

                            <h2>
                                Projects
                            </h2>

                            <button
                                type="button"
                                className="section-add-button"
                                onClick={() =>
                                    openOverlay(
                                        "project",
                                        "add"
                                    )
                                }
                            >
                                + Add
                            </button>

                        </div>

                        {projects.length > 0 ? (

                            <div className="profile-items-list">

                                {projects.map(item => {

                                    const projectLink =
                                        item.project_link || "";

                                    return (
                                        <div
                                            className="profile-item profile-item-with-actions"
                                            key={item.id}
                                        >

                                            <div className="profile-item-content">

                                                <h3>
                                                    {safeValue(
                                                        item.title
                                                    )}
                                                </h3>

                                                {item.project_type && (
                                                    <p>
                                                        Type:{" "}
                                                        {safeValue(
                                                            item.project_type
                                                        )}
                                                    </p>
                                                )}

                                                {item.description && (
                                                    <p>
                                                        {safeValue(
                                                            item.description
                                                        )}
                                                    </p>
                                                )}

                                                {item.technologies && (
                                                    <small>
                                                        Technologies:{" "}
                                                        {safeValue(
                                                            item.technologies
                                                        )}
                                                    </small>
                                                )}

                                                {projectLink && (
                                                    <div className="project-link">

                                                        <a
                                                            href={
                                                                projectLink.startsWith(
                                                                    "http"
                                                                )
                                                                    ? projectLink
                                                                    : `https://${projectLink}`
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            View Project
                                                        </a>

                                                    </div>
                                                )}

                                            </div>

                                            <div className="profile-item-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openOverlay(
                                                            "project",
                                                            "edit",
                                                            item
                                                        )
                                                    }
                                                    title="Edit project"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openOverlay(
                                                            "project",
                                                            "delete",
                                                            item
                                                        )
                                                    }
                                                    title="Delete project"
                                                >
                                                    🗑️
                                                </button>

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                        ) : (
                            <p className="profile-empty">
                                No projects added.
                            </p>
                        )}

                    </section>

                    {/* =================================================
                        DOCUMENTS
                    ================================================= */}

                    <section className="profile-section">

                        <div className="profile-section-title">
                            <h2>
                                Uploaded Documents
                            </h2>
                        </div>

                        <div className="profile-documents-list">

                            {profile.resume && (
                                <div className="profile-document-card">

                                    <div className="profile-document-info">

                                        <span className="document-icon">
                                            📄
                                        </span>

                                        <div>
                                            <strong>
                                                Resume
                                            </strong>

                                            <p>
                                                Resume uploaded
                                            </p>
                                        </div>

                                    </div>

                                    <a
                                        href={getMediaUrl(
                                            profile.resume
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="document-view-button"
                                    >
                                        View
                                    </a>

                                </div>
                            )}

                            {profile.aadhaar && (
                                <div className="profile-document-card">

                                    <div className="profile-document-info">

                                        <span className="document-icon">
                                            🪪
                                        </span>

                                        <div>
                                            <strong>
                                                Aadhaar
                                            </strong>

                                            <p>
                                                Document uploaded
                                            </p>
                                        </div>

                                    </div>

                                    <a
                                        href={getMediaUrl(
                                            profile.aadhaar
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="document-view-button"
                                    >
                                        View
                                    </a>

                                </div>
                            )}

                            {!profile.resume &&
                                !profile.aadhaar && (
                                    <p className="profile-empty">
                                        No documents uploaded.
                                    </p>
                                )}

                        </div>

                    </section>

                </main>

                {/* =====================================================
                    OVERLAY
                ===================================================== */}

                {showOverlay && (
                    <div
                        className="profile-edit-overlay"
                        onMouseDown={closeOverlay}
                    >

                        <div
                            className="profile-edit-panel"
                            onMouseDown={e =>
                                e.stopPropagation()
                            }
                        >

                            <div className="profile-edit-panel-header">

                                <h2>

                                    {overlayAction === "delete"
                                        ? "Delete"
                                        : overlayAction === "add"
                                            ? "Add"
                                            : "Edit"
                                    }{" "}

                                    {overlaySection === "personal"
                                        ? "Personal Details"
                                        : overlaySection === "professional"
                                            ? "Professional Details"
                                            : overlaySection === "education"
                                                ? "Education"
                                                : overlaySection === "experience"
                                                    ? "Experience"
                                                    : "Project"
                                    }

                                </h2>

                                <button
                                    type="button"
                                    className="profile-edit-close"
                                    onClick={closeOverlay}
                                >
                                    ×
                                </button>

                            </div>

                            {/* =================================================
                                DELETE
                            ================================================= */}

                            {overlayAction === "delete" ? (

                                <div className="delete-confirmation">

                                    <div className="delete-icon">
                                        🗑️
                                    </div>

                                    <h3>
                                        Are you sure?
                                    </h3>

                                    <p>
                                        This detail will be permanently
                                        deleted from your profile.
                                    </p>

                                    {formError && (
                                        <div className="overlay-error">
                                            {formError}
                                        </div>
                                    )}

                                    <div className="overlay-actions">

                                        <button
                                            type="button"
                                            className="overlay-cancel-button"
                                            onClick={closeOverlay}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            className="overlay-delete-button"
                                            onClick={deleteItem}
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <form
                                    onSubmit={handleSubmit}
                                    className="profile-edit-form"
                                >

                                    {/* =================================================
                                        PERSONAL
                                    ================================================= */}

                                    {overlaySection === "personal" && (
                                        <>
                                            <div className="form-group">

                                                <label>
                                                    Full Name
                                                </label>

                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={
                                                        form.full_name || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Phone
                                                </label>

                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={
                                                        form.phone || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Location
                                                </label>

                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={
                                                        form.location || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>
                                        </>
                                    )}

                                    {/* =================================================
                                        PROFESSIONAL
                                    ================================================= */}

                                    {overlaySection === "professional" && (
                                        <>
                                            <div className="form-group">

                                                <label>
                                                    Headline
                                                </label>

                                                <input
                                                    type="text"
                                                    name="headline"
                                                    value={
                                                        form.headline || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                            

                                        

                                            <div className="form-group">

                                                <label>
                                                    Skills
                                                </label>

                                                <textarea
                                                    name="skills"
                                                    value={
                                                        form.skills || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    rows="4"
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    LinkedIn
                                                </label>

                                                <input
                                                    type="url"
                                                    name="linkedin"
                                                    value={
                                                        form.linkedin || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="https://www.linkedin.com/in/username"
                                                />

                                            </div>
                                        </>
                                    )}

                                    {/* =================================================
                                        EDUCATION
                                    ================================================= */}

                                    {overlaySection === "education" && (
                                        <>
                                            <div className="form-group">

                                                <label>
                                                    Degree / Qualification
                                                </label>

                                                <input
                                                    type="text"
                                                    name="degree"
                                                    value={
                                                        form.degree || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    required
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    University
                                                </label>

                                                <input
                                                    type="text"
                                                    name="university"
                                                    value={
                                                        form.university || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    College / Institution
                                                </label>

                                                <input
                                                    type="text"
                                                    name="college"
                                                    value={
                                                        form.college || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group">

                                                    <label>
                                                        Start Year
                                                    </label>

                                                    <input
                                                        type="number"
                                                        name="start_year"
                                                        value={
                                                            form.start_year || ""
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />

                                                </div>

                                                <div className="form-group">

                                                    <label>
                                                        End Year
                                                    </label>

                                                    <input
                                                        type="number"
                                                        name="end_year"
                                                        value={
                                                            form.end_year || ""
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />

                                                </div>

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Passing Month & Year
                                                </label>

                                                <input
                                                    type="text"
                                                    name="passing_month_year"
                                                    value={
                                                        form.passing_month_year || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="May 2024"
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Percentage / CGPA
                                                </label>

                                                <input
                                                    type="text"
                                                    name="percentage_cgpa"
                                                    value={
                                                        form.percentage_cgpa || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="7.66 CGPA"
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Activities
                                                </label>

                                                <textarea
                                                    name="activities"
                                                    value={
                                                        form.activities || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    rows="3"
                                                />

                                            </div>
                                        </>
                                    )}

                                    {/* =================================================
                                        EXPERIENCE
                                    ================================================= */}

                                    {overlaySection === "experience" && (
                                        <>
                                            <div className="form-group">

                                                <label>
                                                    Job Title
                                                </label>

                                                <input
                                                    type="text"
                                                    name="job_title"
                                                    value={
                                                        form.job_title || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    required
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Company
                                                </label>

                                                <input
                                                    type="text"
                                                    name="company"
                                                    value={
                                                        form.company || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    required
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Employment Type
                                                </label>

                                                <input
                                                    type="text"
                                                    name="employment_type"
                                                    value={
                                                        form.employment_type || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Full Time / Part Time / Contract"
                                                />

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group">

                                                    <label>
                                                        Start Date
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="start_date"
                                                        value={
                                                            form.start_date || ""
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                        placeholder="August 2022"
                                                    />

                                                </div>

                                                {!form.is_current && (
                                                    <div className="form-group">

                                                        <label>
                                                            End Date
                                                        </label>

                                                        <input
                                                            type="text"
                                                            name="end_date"
                                                            value={
                                                                form.end_date || ""
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="March 2026"
                                                            required={
                                                                !form.is_current
                                                            }
                                                        />

                                                    </div>
                                                )}

                                            </div>

                                            <div className="form-group checkbox-group">

                                                <label>

                                                    <input
                                                        type="checkbox"
                                                        name="is_current"
                                                        checked={
                                                            Boolean(
                                                                form.is_current
                                                            )
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />

                                                    <span>
                                                        I currently work here
                                                    </span>

                                                </label>

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Description
                                                </label>

                                                <textarea
                                                    name="description"
                                                    value={
                                                        form.description || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    rows="5"
                                                />

                                            </div>
                                        </>
                                    )}

                                    {/* =================================================
                                        PROJECT
                                    ================================================= */}

                                    {overlaySection === "project" && (
                                        <>
                                            <div className="form-group">

                                                <label>
                                                    Project Title
                                                </label>

                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={
                                                        form.title || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    required
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Project Type
                                                </label>

                                                <input
                                                    type="text"
                                                    name="project_type"
                                                    value={
                                                        form.project_type || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="E-commerce / Web Application"
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Technologies
                                                </label>

                                                <input
                                                    type="text"
                                                    name="technologies"
                                                    value={
                                                        form.technologies || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="React, Python, Django, MySQL"
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Project Link
                                                </label>

                                                <input
                                                    type="url"
                                                    name="project_link"
                                                    value={
                                                        form.project_link || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="https://github.com/..."
                                                />

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Description
                                                </label>

                                                <textarea
                                                    name="description"
                                                    value={
                                                        form.description || ""
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    rows="5"
                                                />

                                            </div>
                                        </>
                                    )}

                                    {/* =================================================
                                        ERROR / SUCCESS
                                    ================================================= */}

                                    {formError && (
                                        <div className="overlay-error">
                                            {formError}
                                        </div>
                                    )}

                                    {message && (
                                        <div className="overlay-success">
                                            {message}
                                        </div>
                                    )}

                                    {/* =================================================
                                        ACTIONS
                                    ================================================= */}

                                    <div className="overlay-actions">

                                        <button
                                            type="button"
                                            className="overlay-cancel-button"
                                            onClick={closeOverlay}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="overlay-save-button"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : overlayAction === "edit"
                                                    ? "Save Changes"
                                                    : "Add"}
                                        </button>

                                    </div>

                                </form>
                            )}

                        </div>

                    </div>
                )}

            </div>
        );
    }

    return null;
}

export default CompletedProfile;