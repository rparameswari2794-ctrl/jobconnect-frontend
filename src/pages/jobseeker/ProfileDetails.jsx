import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

const PROFILE_API = `${API_BASE}profile/`;
const EDUCATION_API = `${API_BASE}education/`;
const EXPERIENCE_API = `${API_BASE}experience/`;
const PROJECT_API = `${API_BASE}projects/`;

const DOCUMENTS_ROUTE = "/jobseeker/profile/documents";
const REVIEW_ROUTE = "/jobseeker/profile/review";

function ProfileDetails() {
    const navigate = useNavigate();

    // =====================================================
    // PROFILE
    // =====================================================

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingProfile, setEditingProfile] = useState(false);

    const [profileForm, setProfileForm] = useState({
        full_name: "",
        phone: "",
        linkedin: "",
        headline: "",
        skills: "",
        location: "",
    });

    // =====================================================
    // EDUCATION
    // =====================================================

    const [education, setEducation] = useState([]);

    const [showEducationForm, setShowEducationForm] =
        useState(false);

    const [editingEducationId, setEditingEducationId] =
        useState(null);

    const [educationForm, setEducationForm] = useState({
        degree: "",
        university: "",
        college: "",
        passing_month_year: "",
        percentage_cgpa: "",
    });

    const [savingEducation, setSavingEducation] =
        useState(false);

    // =====================================================
    // EXPERIENCE
    // =====================================================

    const [experiences, setExperiences] = useState([]);

    const [showExperienceForm, setShowExperienceForm] =
        useState(false);

    const [editingExperienceId, setEditingExperienceId] =
        useState(null);

    const [experienceForm, setExperienceForm] = useState({
        job_title: "",
        company: "",
        employment_type: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: "",
    });

    const [savingExperience, setSavingExperience] =
        useState(false);

    // =====================================================
    // PROJECTS
    // =====================================================

    const [projects, setProjects] = useState([]);

    const [showProjectForm, setShowProjectForm] =
        useState(false);

    const [editingProjectId, setEditingProjectId] =
        useState(null);

    // IMPORTANT:
    // Backend field is project_link, NOT project_url
    const [projectForm, setProjectForm] = useState({
        title: "",
        project_type: "",
        technologies: "",
        project_link: "",
        description: "",
    });

    const [savingProject, setSavingProject] =
        useState(false);

    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(PROFILE_API, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data =
                await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getApiError(data) ||
                    "Unable to load profile."
                );
            }

            console.log("PROFILE DETAILS:", data);

            // =================================================
            // PROFILE COMPLETION / APPROVAL
            // =================================================

            if (data.profile_completed === true) {
                if (data.approval_status === "approved") {
                    navigate(
                        "/jobseeker/profile/completed",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                if (
                    data.approval_status === "pending" ||
                    !data.approval_status
                ) {
                    navigate(
                        REVIEW_ROUTE,
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                if (
                    data.approval_status !== "rejected"
                ) {
                    navigate(
                        REVIEW_ROUTE,
                        {
                            replace: true,
                        }
                    );

                    return;
                }
            }

            // =================================================
            // REJECTED PROFILE
            // =================================================

            setProfile(data);

            // =================================================
            // PROFILE
            // =================================================

            setProfileForm({
                full_name:
                    typeof data.full_name === "string"
                        ? data.full_name
                        : "",

                phone:
                    typeof data.phone === "string"
                        ? data.phone
                        : "",

                linkedin:
                    typeof data.linkedin === "string"
                        ? data.linkedin
                        : "",

                headline:
                    typeof data.headline === "string"
                        ? data.headline
                        : "",

                skills:
                    typeof data.skills === "string"
                        ? data.skills
                        : "",

                location:
                    typeof data.location === "string"
                        ? data.location
                        : "",
            });

            // =================================================
            // EDUCATION
            // =================================================

            const educationData =
                Array.isArray(data.education)
                    ? data.education
                    : Array.isArray(data.educations)
                        ? data.educations
                        : [];

            setEducation(educationData);

            // =================================================
            // EXPERIENCE
            // =================================================

            const experienceData =
                Array.isArray(data.experience_details)
                    ? data.experience_details
                    : Array.isArray(data.experiences)
                        ? data.experiences
                        : [];

            setExperiences(experienceData);

            // =================================================
            // PROJECTS
            // =================================================

            const projectData =
                Array.isArray(data.projects)
                    ? data.projects
                    : [];

            setProjects(projectData);

            console.log(
                "PROJECTS LOADED:",
                projectData
            );

        } catch (err) {
            console.error(
                "Profile loading error:",
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
    // API ERROR
    // =====================================================

    function getApiError(data) {
        if (!data) {
            return "";
        }

        if (typeof data === "string") {
            return data;
        }

        if (data.detail) {
            return Array.isArray(data.detail)
                ? data.detail.join(", ")
                : String(data.detail);
        }

        if (data.message) {
            return Array.isArray(data.message)
                ? data.message.join(", ")
                : String(data.message);
        }

        if (typeof data === "object") {
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
                    } else if (
                        typeof value === "string"
                    ) {
                        messages.push(
                            `${field}: ${value}`
                        );
                    }
                }
            );

            return messages.join(" | ");
        }

        return "";
    }

    // =====================================================
    // PROFILE CHANGE
    // =====================================================

    function handleProfileChange(event) {
        const {
            name,
            value,
        } = event.target;

        setProfileForm(previous => ({
            ...previous,
            [name]: value,
        }));
    }

    // =====================================================
    // SAVE PROFILE
    // =====================================================

    async function saveProfile() {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const profilePayload = {
                full_name:
                    String(
                        profileForm.full_name || ""
                    ).trim(),

                phone:
                    String(
                        profileForm.phone || ""
                    ).trim(),

                linkedin:
                    String(
                        profileForm.linkedin || ""
                    ).trim(),

                headline:
                    String(
                        profileForm.headline || ""
                    ).trim(),

                skills:
                    String(
                        profileForm.skills || ""
                    ).trim(),

                location:
                    String(
                        profileForm.location || ""
                    ).trim(),
            };

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

                    body: JSON.stringify(
                        profilePayload
                    ),
                }
            );

            const data =
                await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getApiError(data) ||
                    "Unable to save profile."
                );
            }

            const updatedProfile =
                data.profile || data;

            setProfile(previous => ({
                ...previous,
                ...updatedProfile,
            }));

            setProfileForm({
                full_name:
                    updatedProfile.full_name ||
                    profilePayload.full_name,

                phone:
                    updatedProfile.phone ||
                    profilePayload.phone,

                linkedin:
                    updatedProfile.linkedin ||
                    profilePayload.linkedin,

                headline:
                    updatedProfile.headline ||
                    profilePayload.headline,

                skills:
                    updatedProfile.skills ||
                    profilePayload.skills,

                location:
                    updatedProfile.location ||
                    profilePayload.location,
            });

            setEditingProfile(false);

            setSuccess(
                "Profile details saved successfully."
            );
        } catch (err) {
            console.error(
                "Save profile error:",
                err
            );

            setError(
                err.message ||
                "Unable to save profile."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // EDUCATION
    // =====================================================

    function handleEducationChange(event) {
        const {
            name,
            value,
        } = event.target;

        setEducationForm(previous => ({
            ...previous,
            [name]: value,
        }));
    }

    function resetEducationForm() {
        setEducationForm({
            degree: "",
            university: "",
            college: "",
            passing_month_year: "",
            percentage_cgpa: "",
        });

        setEditingEducationId(null);
        setShowEducationForm(false);
    }

    function startAddEducation() {
        setEducationForm({
            degree: "",
            university: "",
            college: "",
            passing_month_year: "",
            percentage_cgpa: "",
        });

        setEditingEducationId(null);
        setShowEducationForm(true);

        setError("");
        setSuccess("");
    }

    function startEditEducation(item) {
        setEducationForm({
            degree:
                item.degree || "",

            university:
                item.university || "",

            college:
                item.college || "",

            passing_month_year:
                item.passing_month_year ||
                item.end_year ||
                "",

            percentage_cgpa:
                item.percentage_cgpa || "",
        });

        setEditingEducationId(item.id);
        setShowEducationForm(true);

        setError("");
        setSuccess("");
    }

    async function saveEducation() {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        setSavingEducation(true);
        setError("");
        setSuccess("");

        try {
            const isEditing =
                Boolean(editingEducationId);

            const url =
                isEditing
                    ? `${EDUCATION_API}${editingEducationId}/`
                    : EDUCATION_API;

            const method =
                isEditing
                    ? "PATCH"
                    : "POST";

            const payload = {
                degree:
                    String(
                        educationForm.degree || ""
                    ).trim(),

                university:
                    String(
                        educationForm.university || ""
                    ).trim(),

                college:
                    String(
                        educationForm.college || ""
                    ).trim(),

                passing_month_year:
                    String(
                        educationForm.passing_month_year ||
                        ""
                    ).trim(),

                percentage_cgpa:
                    String(
                        educationForm.percentage_cgpa ||
                        ""
                    ).trim(),
            };

            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getApiError(data) ||
                    "Unable to save education."
                );
            }

            if (isEditing) {
                setEducation(previous =>
                    previous.map(item =>
                        item.id === editingEducationId
                            ? data
                            : item
                    )
                );
            } else {
                setEducation(previous => [
                    ...previous,
                    data,
                ]);
            }

            resetEducationForm();

            setSuccess(
                isEditing
                    ? "Education updated successfully."
                    : "Education added successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to save education."
            );
        } finally {
            setSavingEducation(false);
        }
    }

    // =====================================================
    // EXPERIENCE
    // =====================================================

    function handleExperienceChange(event) {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setExperienceForm(previous => ({
            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    }

    function resetExperienceForm() {
        setExperienceForm({
            job_title: "",
            company: "",
            employment_type: "",
            start_date: "",
            end_date: "",
            is_current: false,
            description: "",
        });

        setEditingExperienceId(null);
        setShowExperienceForm(false);
    }

    function startAddExperience() {
        setExperienceForm({
            job_title: "",
            company: "",
            employment_type: "",
            start_date: "",
            end_date: "",
            is_current: false,
            description: "",
        });

        setEditingExperienceId(null);
        setShowExperienceForm(true);

        setError("");
        setSuccess("");
    }

    function startEditExperience(item) {
        setExperienceForm({
            job_title:
                item.job_title || "",

            company:
                item.company || "",

            employment_type:
                item.employment_type || "",

            start_date:
                item.start_date || "",

            end_date:
                item.end_date || "",

            is_current:
                Boolean(item.is_current),

            description:
                item.description || "",
        });

        setEditingExperienceId(item.id);
        setShowExperienceForm(true);

        setError("");
        setSuccess("");
    }

    async function saveExperience() {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!experienceForm.job_title.trim()) {
            setError("Job Title is required.");
            return;
        }

        if (!experienceForm.company.trim()) {
            setError("Company is required.");
            return;
        }

        if (!experienceForm.start_date) {
            setError("Start Date is required.");
            return;
        }

        setSavingExperience(true);
        setError("");
        setSuccess("");

        try {
            const isEditing =
                Boolean(editingExperienceId);

            const url =
                isEditing
                    ? `${EXPERIENCE_API}${editingExperienceId}/`
                    : EXPERIENCE_API;

            const method =
                isEditing
                    ? "PATCH"
                    : "POST";

            const payload = {
                job_title:
                    experienceForm.job_title.trim(),

                company:
                    experienceForm.company.trim(),

                employment_type:
                    experienceForm.employment_type.trim(),

                start_date:
                    experienceForm.start_date,

                end_date:
                    experienceForm.is_current
                        ? null
                        : (
                            experienceForm.end_date ||
                            null
                        ),

                is_current:
                    Boolean(
                        experienceForm.is_current
                    ),

                description:
                    experienceForm.description.trim(),
            };

            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getApiError(data) ||
                    "Unable to save experience."
                );
            }

            if (isEditing) {
                setExperiences(previous =>
                    previous.map(item =>
                        item.id === editingExperienceId
                            ? data
                            : item
                    )
                );
            } else {
                setExperiences(previous => [
                    ...previous,
                    data,
                ]);
            }

            resetExperienceForm();

            setSuccess(
                isEditing
                    ? "Experience updated successfully."
                    : "Experience added successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to save experience."
            );
        } finally {
            setSavingExperience(false);
        }
    }

    // =====================================================
    // PROJECT
    // =====================================================

    function handleProjectChange(event) {
        const {
            name,
            value,
        } = event.target;

        setProjectForm(previous => ({
            ...previous,
            [name]: value,
        }));
    }

    function resetProjectForm() {
        setProjectForm({
            title: "",
            project_type: "",
            technologies: "",
            project_link: "",
            description: "",
        });

        setEditingProjectId(null);
        setShowProjectForm(false);
    }

    function startAddProject() {
        setProjectForm({
            title: "",
            project_type: "",
            technologies: "",
            project_link: "",
            description: "",
        });

        setEditingProjectId(null);
        setShowProjectForm(true);

        setError("");
        setSuccess("");
    }

    function startEditProject(item) {
        setProjectForm({
            title:
                item.title || "",

            project_type:
                item.project_type || "",

            technologies:
                item.technologies || "",

            // IMPORTANT:
            // Backend returns project_link
            project_link:
                item.project_link || "",

            description:
                item.description || "",
        });

        setEditingProjectId(item.id);
        setShowProjectForm(true);

        setError("");
        setSuccess("");
    }

    async function saveProject() {
        const token =
            localStorage.getItem("jc_token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!projectForm.title.trim()) {
            setError("Project Title is required.");
            return;
        }

        setSavingProject(true);
        setError("");
        setSuccess("");

        try {
            const isEditing =
                Boolean(editingProjectId);

            const url =
                isEditing
                    ? `${PROJECT_API}${editingProjectId}/`
                    : PROJECT_API;

            const method =
                isEditing
                    ? "PATCH"
                    : "POST";

            // =================================================
            // IMPORTANT
            // Backend field = project_link
            // =================================================

            const payload = {
                title:
                    projectForm.title.trim(),

                project_type:
                    projectForm.project_type.trim(),

                technologies:
                    projectForm.technologies.trim(),

                project_link:
                    projectForm.project_link.trim(),

                description:
                    projectForm.description.trim(),
            };

            console.log(
                "PROJECT SAVE PAYLOAD:",
                payload
            );

            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "PROJECT SAVE RESPONSE:",
                data
            );

            console.log(
                "PROJECT LINK RETURNED:",
                data.project_link
            );

            if (!response.ok) {
                throw new Error(
                    getApiError(data) ||
                    "Unable to save project."
                );
            }

            // =================================================
            // UPDATE LOCAL PROJECT LIST
            // =================================================

            if (isEditing) {
                setProjects(previous =>
                    previous.map(item =>
                        item.id === editingProjectId
                            ? data
                            : item
                    )
                );
            } else {
                setProjects(previous => [
                    ...previous,
                    data,
                ]);
            }

            resetProjectForm();

            setSuccess(
                isEditing
                    ? "Project updated successfully."
                    : "Project added successfully."
            );

        } catch (err) {
            console.error(
                "Save project error:",
                err
            );

            setError(
                err.message ||
                "Unable to save project."
            );
        } finally {
            setSavingProject(false);
        }
    }

    // =====================================================
    // NEXT
    // =====================================================

    function handleNext() {
        navigate(
            DOCUMENTS_ROUTE
        );
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="profile-details-page">
                <main className="profile-details-main">
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

    if (error && !profile) {
        return (
            <div className="profile-details-page">
                <main className="profile-details-main">
                    <div className="documents-error">
                        {error}
                    </div>
                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-details-page">
                <main className="profile-details-main">
                    <p>
                        Profile not found.
                    </p>
                </main>
            </div>
        );
    }

    // =====================================================
    // REJECTED
    // =====================================================

    const isRejected =
        profile.approval_status === "rejected";

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="profile-details-page">

            {/* =================================================
                REJECTED MESSAGE
            ================================================= */}

            {isRejected && (
                <section className="profile-section rejection-section">

                    <div className="rejection-content">

                        <div className="rejection-icon">
                            !
                        </div>

                        <div>

                            <h2>
                                Profile Rejected
                            </h2>

                            <p>
                                Your profile was rejected by
                                the administrator.
                            </p>

                            {(
                                profile.rejection_reason ||
                                profile.admin_rejection_reason ||
                                profile.rejection_message
                            ) && (
                                <div className="rejection-reason">

                                    <strong>
                                        Admin rejection reason:
                                    </strong>

                                    <p>
                                        {
                                            profile.rejection_reason ||
                                            profile.admin_rejection_reason ||
                                            profile.rejection_message
                                        }
                                    </p>

                                </div>
                            )}

                            <p className="rejection-help">
                                Please update the required
                                information below and submit
                                your profile again.
                            </p>

                        </div>

                    </div>

                </section>
            )}

            {/* =================================================
                STEPS
            ================================================= */}

            <div className="profile-steps">

                <div className="profile-step active">
                    <span>1</span>
                    Details
                </div>

                <div className="profile-step-line" />

                <div className="profile-step">
                    <span>2</span>
                    Documents
                </div>

                <div className="profile-step-line" />

                <div className="profile-step">
                    <span>3</span>
                    Review
                </div>

            </div>

            <main className="profile-details-main">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="profile-details-header">

                    <h1>
                        {isRejected
                            ? "Update your profile"
                            : "Profile & verification"}
                    </h1>

                    <p>
                        {isRejected
                            ? "Correct the information requested by the administrator and submit your profile again."
                            : "Review and complete your profile details."}
                    </p>

                </section>

                {error && (
                    <div className="documents-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="documents-success">
                        {success}
                    </div>
                )}

                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <div>

                            <h2>
                                Personal Information
                            </h2>

                        </div>

                        {!editingProfile && (
                            <button
                                type="button"
                                className="pen-button"
                                onClick={() => {
                                    setEditingProfile(true);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                ✎
                            </button>
                        )}

                    </div>

                    <div className="profile-form">

                        <div className="form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="full_name"
                                value={
                                    profileForm.full_name
                                }
                                onChange={
                                    handleProfileChange
                                }
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
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
                                    profileForm.phone
                                }
                                onChange={
                                    handleProfileChange
                                }
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
                                }
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
                                Email cannot be changed here.
                            </small>

                        </div>

                        <div className="form-group">

                            <label>
                                Location
                            </label>

                            <input
                                type="text"
                                name="location"
                                value={
                                    profileForm.location
                                }
                                onChange={
                                    handleProfileChange
                                }
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
                                }
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
                                    profileForm.linkedin
                                }
                                onChange={
                                    handleProfileChange
                                }
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Professional Headline
                            </label>

                            <input
                                type="text"
                                name="headline"
                                value={
                                    profileForm.headline
                                }
                                onChange={
                                    handleProfileChange
                                }
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
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
                                    profileForm.skills
                                }
                                onChange={
                                    handleProfileChange
                                }
                                rows="3"
                                readOnly={
                                    !editingProfile
                                }
                                className={
                                    !editingProfile
                                        ? "readonly-input"
                                        : ""
                                }
                            />

                        </div>

                        {editingProfile && (
                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="back-button"
                                    onClick={() => {

                                        setEditingProfile(false);

                                        setProfileForm({
                                            full_name:
                                                profile.full_name || "",

                                            phone:
                                                profile.phone || "",

                                            linkedin:
                                                profile.linkedin || "",

                                            headline:
                                                profile.headline || "",

                                            skills:
                                                profile.skills || "",

                                            location:
                                                profile.location || "",
                                        });

                                        setError("");

                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="save-profile-button"
                                    onClick={saveProfile}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Profile"}
                                </button>

                            </div>
                        )}

                    </div>

                </section>

                {/* =================================================
                    EDUCATION
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <div>

                            <h2>
                                Education
                            </h2>

                            <p className="section-description">
                                Add your educational qualifications.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="add-button"
                            onClick={
                                startAddEducation
                            }
                        >
                            + Add education
                        </button>

                    </div>

                    {education.length > 0 ? (
                        education.map(item => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                <div className="card-header">

                                    <h3>
                                        {item.degree ||
                                            "Education"}
                                    </h3>

                                    <button
                                        type="button"
                                        className="pen-button"
                                        onClick={() =>
                                            startEditEducation(
                                                item
                                            )
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>

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

                    {showEducationForm && (
                        <div className="profile-card edit-form">

                            <h3>
                                {editingEducationId
                                    ? "Edit Education"
                                    : "Add Education"}
                            </h3>

                            <div className="profile-form">

                                <div className="form-group">

                                    <label>
                                        Degree
                                    </label>

                                    <input
                                        type="text"
                                        name="degree"
                                        value={
                                            educationForm.degree
                                        }
                                        onChange={
                                            handleEducationChange
                                        }
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
                                            educationForm.university
                                        }
                                        onChange={
                                            handleEducationChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        College
                                    </label>

                                    <input
                                        type="text"
                                        name="college"
                                        value={
                                            educationForm.college
                                        }
                                        onChange={
                                            handleEducationChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Passing Month / Year
                                    </label>

                                    <input
                                        type="text"
                                        name="passing_month_year"
                                        value={
                                            educationForm.passing_month_year
                                        }
                                        onChange={
                                            handleEducationChange
                                        }
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
                                            educationForm.percentage_cgpa
                                        }
                                        onChange={
                                            handleEducationChange
                                        }
                                    />

                                </div>

                                <div className="form-actions">

                                    <button
                                        type="button"
                                        className="back-button"
                                        onClick={
                                            resetEducationForm
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="save-profile-button"
                                        onClick={
                                            saveEducation
                                        }
                                        disabled={
                                            savingEducation
                                        }
                                    >
                                        {savingEducation
                                            ? "Saving..."
                                            : editingEducationId
                                                ? "Update Education"
                                                : "Save Education"}
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                </section>

                {/* =================================================
                    EXPERIENCE
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <div>

                            <h2>
                                Experience
                            </h2>

                            <p className="section-description">
                                Add your professional experience.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="add-button"
                            onClick={
                                startAddExperience
                            }
                        >
                            + Add experience
                        </button>

                    </div>

                    {experiences.length > 0 ? (

                        experiences.map(item => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                <div className="card-header">

                                    <h3>
                                        {item.job_title ||
                                            "Experience"}
                                    </h3>

                                    <button
                                        type="button"
                                        className="pen-button"
                                        onClick={() =>
                                            startEditExperience(
                                                item
                                            )
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>

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

                    {showExperienceForm && (

                        <div className="profile-card edit-form">

                            <h3>
                                {editingExperienceId
                                    ? "Edit Experience"
                                    : "Add Experience"}
                            </h3>

                            <div className="profile-form">

                                <div className="form-group">

                                    <label>
                                        Job Title
                                    </label>

                                    <input
                                        type="text"
                                        name="job_title"
                                        value={
                                            experienceForm.job_title
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
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
                                            experienceForm.company
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Employment Type
                                    </label>

                                    <select
                                        name="employment_type"
                                        value={
                                            experienceForm.employment_type
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
                                    >

                                        <option value="">
                                            Select
                                        </option>

                                        <option value="full_time">
                                            Full Time
                                        </option>

                                        <option value="part_time">
                                            Part Time
                                        </option>

                                        <option value="contract">
                                            Contract
                                        </option>

                                        <option value="internship">
                                            Internship
                                        </option>

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        name="start_date"
                                        value={
                                            experienceForm.start_date
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        End Date
                                    </label>

                                    <input
                                        type="date"
                                        name="end_date"
                                        value={
                                            experienceForm.end_date
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
                                        disabled={
                                            experienceForm.is_current
                                        }
                                    />

                                </div>

                                <div className="form-group checkbox-group">

                                    <label className="current-job-label">

                                        <input
                                            type="checkbox"
                                            name="is_current"
                                            checked={
                                                experienceForm.is_current
                                            }
                                            onChange={
                                                handleExperienceChange
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
                                            experienceForm.description
                                        }
                                        onChange={
                                            handleExperienceChange
                                        }
                                        rows="4"
                                    />

                                </div>

                                <div className="form-actions">

                                    <button
                                        type="button"
                                        className="back-button"
                                        onClick={
                                            resetExperienceForm
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="save-profile-button"
                                        onClick={
                                            saveExperience
                                        }
                                        disabled={
                                            savingExperience
                                        }
                                    >
                                        {savingExperience
                                            ? "Saving..."
                                            : editingExperienceId
                                                ? "Update Experience"
                                                : "Save Experience"}
                                    </button>

                                </div>

                            </div>

                        </div>

                    )}

                </section>

                {/* =================================================
                    PROJECTS
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title-row">

                        <div>

                            <h2>
                                Projects
                            </h2>

                            <p className="section-description">
                                Add projects that demonstrate
                                your skills.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="add-button"
                            onClick={
                                startAddProject
                            }
                        >
                            + Add project
                        </button>

                    </div>

                    {projects.length > 0 ? (

                        projects.map(item => (

                            <div
                                className="profile-card"
                                key={item.id}
                            >

                                <div className="card-header">

                                    <h3>
                                        {item.title ||
                                            "Project"}
                                    </h3>

                                    <button
                                        type="button"
                                        className="pen-button"
                                        onClick={() =>
                                            startEditProject(
                                                item
                                            )
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>

                                <p>
                                    <strong>
                                        Project Type:
                                    </strong>{" "}

                                    {item.project_type ||
                                        "Not provided"}
                                </p>

                                <p>
                                    <strong>
                                        Technologies:
                                    </strong>{" "}

                                    {item.technologies ||
                                        "Not provided"}
                                </p>

                                {/* IMPORTANT:
                                    Backend field = project_link
                                */}

                                {item.project_link && (

                                    <p>

                                        <a
                                            href={
                                                item.project_link
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View Project
                                        </a>

                                    </p>

                                )}

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
                            No projects added.
                        </p>

                    )}

                    {/* =================================================
                        PROJECT FORM
                    ================================================= */}

                    {showProjectForm && (

                        <div className="profile-card edit-form">

                            <h3>
                                {editingProjectId
                                    ? "Edit Project"
                                    : "Add Project"}
                            </h3>

                            <div className="profile-form">

                                <div className="form-group">

                                    <label>
                                        Project Title
                                    </label>

                                    <input
                                        type="text"
                                        name="title"
                                        value={
                                            projectForm.title
                                        }
                                        onChange={
                                            handleProjectChange
                                        }
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
                                            projectForm.project_type
                                        }
                                        onChange={
                                            handleProjectChange
                                        }
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
                                            projectForm.technologies
                                        }
                                        onChange={
                                            handleProjectChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Project URL
                                    </label>

                                    <input
                                        type="url"
                                        name="project_link"
                                        value={
                                            projectForm.project_link
                                        }
                                        onChange={
                                            handleProjectChange
                                        }
                                        placeholder="https://example.com"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            projectForm.description
                                        }
                                        onChange={
                                            handleProjectChange
                                        }
                                        rows="4"
                                    />

                                </div>

                                <div className="form-actions">

                                    <button
                                        type="button"
                                        className="back-button"
                                        onClick={
                                            resetProjectForm
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="save-profile-button"
                                        onClick={
                                            saveProject
                                        }
                                        disabled={
                                            savingProject
                                        }
                                    >
                                        {savingProject
                                            ? "Saving..."
                                            : editingProjectId
                                                ? "Update Project"
                                                : "Save Project"}
                                    </button>

                                </div>

                            </div>

                        </div>

                    )}

                </section>

                {/* =================================================
                    NEXT
                ================================================= */}

                <div className="profile-save-area">

                    <div className="documents-actions">

                        <button
                            type="button"
                            className="save-profile-button"
                            onClick={handleNext}
                        >
                            Next: Documents →
                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default ProfileDetails;