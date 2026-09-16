import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

const JOBSEEKER_API = `${API_BASE}/auth/jobseeker`;

const PROFILE_API = `${JOBSEEKER_API}/profile/`;
const EDUCATION_API = `${JOBSEEKER_API}/education/`;
const EXPERIENCE_API = `${JOBSEEKER_API}/experience/`;
const PROJECT_API = `${JOBSEEKER_API}/projects/`;

const DOCUMENTS_ROUTE = "/jobseeker/profile/documents";
const REVIEW_ROUTE = "/jobseeker/profile/review";
const COMPLETED_ROUTE = "/jobseeker/profile/completed";

/* =========================================================
   ICONS
========================================================= */

const Icon = ({ name, size = 20 }) => {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c.8-4.2 3.5-6 8-6s7.2 1.8 8 6" />
            </>
        ),

        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),

        phone: (
            <>
                <path d="M6.5 3.5 9 3l2 5-2.2 1.8a16 16 0 0 0 5.4 5.4L16 13l5 2 .5 2.5c.2 1-.4 2-1.4 2.4-1.2.5-2.7.4-4.5-.3-3.1-1.2-6.3-3.6-9-6.4-2.8-2.7-5.2-5.9-6.4-9C-.5 2.4-.6.9-.1-.3.3-1.3 1.3-1.9 2.3-1.7z" />
            </>
        ),

        location: (
            <>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),

        link: (
            <>
                <path d="M10 13.5a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                <path d="M14 10.5a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 19.5l1.1-1.1" />
            </>
        ),

        briefcase: (
            <>
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 12h18" />
                <path d="M10 12v2h4v-2" />
            </>
        ),

        graduation: (
            <>
                <path d="m2 9 10-5 10 5-10 5L2 9Z" />
                <path d="M6 11.5v4.2c3.3 2.3 8.7 2.3 12 0v-4.2" />
                <path d="M22 9v6" />
            </>
        ),

        folder: (
            <>
                <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" />
            </>
        ),

        accessibility: (
            <>
                <circle cx="12" cy="4" r="2" />
                <path d="M5 8h14" />
                <path d="M12 8v5" />
                <path d="m8 21 4-8 4 8" />
            </>
        ),

        edit: (
            <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </>
        ),

        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),

        trash: (
            <>
                <path d="M4 7h16" />
                <path d="M10 11v6M14 11v6" />
                <path d="M6 7l1 13h10l1-13" />
                <path d="M9 7V4h6v3" />
            </>
        ),

        check: (
            <>
                <path d="m5 12 4 4L19 6" />
            </>
        ),

        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),

        calendar: (
            <>
                <rect x="3" y="4.5" width="18" height="16" rx="2" />
                <path d="M16 2.5v4M8 2.5v4M3 9h18" />
            </>
        ),

        chevron: (
            <>
                <path d="m6 9 6 6 6-6" />
            </>
        ),

        external: (
            <>
                <path d="M14 5h5v5" />
                <path d="M19 5 10 14" />
                <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
            </>
        ),

        save: (
            <>
                <path d="M5 3h12l3 3v15H5z" />
                <path d="M8 3v6h8V3" />
                <path d="M8 21v-7h8v7" />
            </>
        ),

        close: (
            <>
                <path d="m6 6 12 12M18 6 6 18" />
            </>
        ),

        alert: (
            <>
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9v5M12 17h.01" />
            </>
        ),

        info: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
            </>
        ),

        heart: (
            <>
                <path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 3.7 7.6 3.2 9.8 4.2 12 6.6c2.2-2.4 4.4-3.4 6.6-2.9C22 4.5 23.3 8 21.5 11.2 19 15.65 12 20 12 20Z" />
            </>
        ),
    };

    return <svg {...common}>{icons[name] || icons.info}</svg>;
};

/* =========================================================
   API ERROR
========================================================= */

const getApiError = (data) => {
    if (!data) return "Something went wrong.";

    if (typeof data === "string") return data;

    if (data.detail) return data.detail;

    if (data.message) return data.message;

    if (data.error) return data.error;

    if (typeof data === "object") {
        const messages = [];

        Object.entries(data).forEach(([field, value]) => {
            if (Array.isArray(value)) {
                messages.push(`${field}: ${value.join(", ")}`);
            } else if (typeof value === "string") {
                messages.push(`${field}: ${value}`);
            } else if (value && typeof value === "object") {
                messages.push(`${field}: ${JSON.stringify(value)}`);
            }
        });

        if (messages.length) return messages.join(" | ");
    }

    return "Unable to complete the request.";
};

/* =========================================================
   EMPTY FORMS
========================================================= */

const EMPTY_EDUCATION = {
    degree: "",
    university: "",
    college: "",
    start_year: "",
    end_year: "",
    passing_month_year: "",
    percentage_cgpa: "",
    activities: "",
};

const EMPTY_EXPERIENCE = {
    job_title: "",
    company: "",
    employment_type: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
};

const EMPTY_PROJECT = {
    title: "",
    project_type: "",
    technologies: "",
    project_link: "",
    description: "",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ProfileDetails() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingEducation, setSavingEducation] = useState(false);
    const [savingExperience, setSavingExperience] = useState(false);
    const [savingProject, setSavingProject] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingProfile, setEditingProfile] = useState(false);

    const [educationList, setEducationList] = useState([]);
    const [experienceList, setExperienceList] = useState([]);
    const [projectList, setProjectList] = useState([]);

    const [editingEducationId, setEditingEducationId] = useState(null);
    const [editingExperienceId, setEditingExperienceId] = useState(null);
    const [editingProjectId, setEditingProjectId] = useState(null);

    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);

    const [educationForm, setEducationForm] = useState(EMPTY_EDUCATION);
    const [experienceForm, setExperienceForm] = useState(EMPTY_EXPERIENCE);
    const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);

    /* =====================================================
       TOKEN
    ===================================================== */

    const getToken = () =>
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

    /* =====================================================
       COMMON REQUEST
    ===================================================== */

    const apiRequest = async (url, options = {}) => {
        const token = getToken();

        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {}),
                ...(options.headers || {}),
            },
        });

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(getApiError(data));
        }

        return data;
    };

    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    const loadProfile = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest(PROFILE_API);

            setProfile(data);

            setEducationList(
                data.educations ||
                data.education ||
                []
            );

            setExperienceList(
                data.experiences ||
                data.experience_details ||
                []
            );

            setProjectList(
                data.projects ||
                []
            );

            if (
                data.profile_completed === true &&
                data.approval_status === "approved"
            ) {
                navigate(COMPLETED_ROUTE, {
                    replace: true,
                });

                return;
            }

            if (
                data.profile_completed === true &&
                data.approval_status === "pending"
            ) {
                navigate(REVIEW_ROUTE, {
                    replace: true,
                });

                return;
            }
        } catch (err) {
            setError(err.message || "Unable to load profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    /* =====================================================
       PROFILE COMPLETION
    ===================================================== */

    const completion = useMemo(() => {
        if (!profile) return 0;

        const fields = [
            profile.full_name,
            profile.phone,
            profile.email,
            profile.location,
            profile.headline,
            profile.skills,
            profile.linkedin,
            educationList.length > 0,
            experienceList.length > 0,
            projectList.length > 0,
        ];

        const completed = fields.filter(Boolean).length;

        return Math.round((completed / fields.length) * 100);
    }, [
        profile,
        educationList,
        experienceList,
        projectList,
    ]);

    /* =====================================================
       PROFILE FORM
    ===================================================== */

    const updateProfileField = (field, value) => {
        setProfile((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveProfile = async () => {
        setError("");
        setSuccess("");

        if (!profile?.full_name?.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!profile?.phone?.trim()) {
            setError("Phone number is required.");
            return;
        }

        if (profile.disability) {
            const percentage =
                profile.disability_percentage;

            if (
                percentage === "" ||
                percentage === null ||
                percentage === undefined
            ) {
                setError(
                    "Please enter your disability percentage."
                );
                return;
            }

            const numericPercentage =
                Number(percentage);

            if (
                Number.isNaN(numericPercentage) ||
                numericPercentage < 0 ||
                numericPercentage > 100
            ) {
                setError(
                    "Disability percentage must be between 0 and 100."
                );
                return;
            }
        }

        setSavingProfile(true);

        try {
            const payload = {
                full_name:
                    profile.full_name?.trim() || "",
                phone:
                    profile.phone?.trim() || "",
                location:
                    profile.location?.trim() || "",
                linkedin:
                    profile.linkedin?.trim() || "",
                headline:
                    profile.headline?.trim() || "",
                skills:
                    profile.skills?.trim() || "",

                disability:
                    Boolean(profile.disability),

                disability_category:
                    profile.disability
                        ? (
                            profile.disability_category ||
                            ""
                        ).trim()
                        : "",

                disability_type:
                    profile.disability
                        ? (
                            profile.disability_type ||
                            ""
                        ).trim()
                        : "",

                disability_percentage:
                    profile.disability &&
                    profile.disability_percentage !== "" &&
                    profile.disability_percentage !== null &&
                    profile.disability_percentage !== undefined
                        ? Number(
                            profile.disability_percentage
                        )
                        : null,
            };

            const data = await apiRequest(
                PROFILE_API,
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                }
            );

            setProfile((prev) => ({
                ...prev,
                ...data,
                ...payload,
            }));

            setEditingProfile(false);

            setSuccess(
                "Profile details updated successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to update profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    /* =====================================================
       EDUCATION
    ===================================================== */

    const saveEducation = async () => {
        setError("");
        setSuccess("");

        if (!educationForm.degree.trim()) {
            setError("Degree is required.");
            return;
        }

        setSavingEducation(true);

        try {
            let data;

            if (editingEducationId) {
                data = await apiRequest(
                    `${EDUCATION_API}${editingEducationId}/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(
                            educationForm
                        ),
                    }
                );

                setEducationList((prev) =>
                    prev.map((item) =>
                        item.id === editingEducationId
                            ? data
                            : item
                    )
                );
            } else {
                data = await apiRequest(
                    EDUCATION_API,
                    {
                        method: "POST",
                        body: JSON.stringify(
                            educationForm
                        ),
                    }
                );

                setEducationList((prev) => [
                    ...prev,
                    data,
                ]);
            }

            setEducationForm(EMPTY_EDUCATION);
            setEditingEducationId(null);
            setShowEducationForm(false);

            setSuccess(
                "Education details saved successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to save education."
            );
        } finally {
            setSavingEducation(false);
        }
    };

    const editEducation = (item) => {
        setEducationForm({
            degree: item.degree || "",
            university: item.university || "",
            college: item.college || "",
            start_year: item.start_year || "",
            end_year: item.end_year || "",
            passing_month_year:
                item.passing_month_year || "",
            percentage_cgpa:
                item.percentage_cgpa || "",
            activities: item.activities || "",
        });

        setEditingEducationId(item.id);
        setShowEducationForm(true);

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    };

    /* =====================================================
       EXPERIENCE
    ===================================================== */

    const saveExperience = async () => {
        setError("");
        setSuccess("");

        if (!experienceForm.job_title.trim()) {
            setError("Job title is required.");
            return;
        }

        if (!experienceForm.company.trim()) {
            setError("Company name is required.");
            return;
        }

        if (!experienceForm.start_date) {
            setError("Start date is required.");
            return;
        }

        if (
            !experienceForm.is_current &&
            !experienceForm.end_date
        ) {
            setError(
                "Please provide an end date or select Current Job."
            );
            return;
        }

        setSavingExperience(true);

        try {
            let data;

            const payload = {
                ...experienceForm,
                end_date: experienceForm.is_current
                    ? null
                    : experienceForm.end_date || null,
            };

            if (editingExperienceId) {
                data = await apiRequest(
                    `${EXPERIENCE_API}${editingExperienceId}/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    }
                );

                setExperienceList((prev) =>
                    prev.map((item) =>
                        item.id === editingExperienceId
                            ? data
                            : item
                    )
                );
            } else {
                data = await apiRequest(
                    EXPERIENCE_API,
                    {
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );

                setExperienceList((prev) => [
                    ...prev,
                    data,
                ]);
            }

            setExperienceForm(EMPTY_EXPERIENCE);
            setEditingExperienceId(null);
            setShowExperienceForm(false);

            setSuccess(
                "Experience details saved successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to save experience."
            );
        } finally {
            setSavingExperience(false);
        }
    };

    const editExperience = (item) => {
        setExperienceForm({
            job_title: item.job_title || "",
            company: item.company || "",
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

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    };

    /* =====================================================
       PROJECT
    ===================================================== */

    const saveProject = async () => {
        setError("");
        setSuccess("");

        if (!projectForm.title.trim()) {
            setError("Project title is required.");
            return;
        }

        setSavingProject(true);

        try {
            let data;

            if (editingProjectId) {
                data = await apiRequest(
                    `${PROJECT_API}${editingProjectId}/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(
                            projectForm
                        ),
                    }
                );

                setProjectList((prev) =>
                    prev.map((item) =>
                        item.id === editingProjectId
                            ? data
                            : item
                    )
                );
            } else {
                data = await apiRequest(
                    PROJECT_API,
                    {
                        method: "POST",
                        body: JSON.stringify(
                            projectForm
                        ),
                    }
                );

                setProjectList((prev) => [
                    ...prev,
                    data,
                ]);
            }

            setProjectForm(EMPTY_PROJECT);
            setEditingProjectId(null);
            setShowProjectForm(false);

            setSuccess(
                "Project details saved successfully."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to save project."
            );
        } finally {
            setSavingProject(false);
        }
    };

    const editProject = (item) => {
        setProjectForm({
            title: item.title || "",
            project_type:
                item.project_type || "",
            technologies:
                item.technologies || "",
            project_link:
                item.project_link ||
                item.project_url ||
                "",
            description:
                item.description || "",
        });

        setEditingProjectId(item.id);
        setShowProjectForm(true);

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    };

    /* =====================================================
       NEXT
    ===================================================== */

    const handleNext = () => {
        navigate(DOCUMENTS_ROUTE);
    };

    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    const profilePhoto =
        profile?.profile_photo ||
        profile?.photo ||
        profile?.profile_image ||
        profile?.image ||
        "";

    const initials = useMemo(() => {
        const name =
            profile?.full_name ||
            "Job Seeker";

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) =>
                word.charAt(0).toUpperCase()
            )
            .join("");
    }, [profile]);

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>{styles}</style>

                <div className="profile-loading">
                    <div className="loading-spinner" />

                    <div>
                        <strong>
                            Loading your profile
                        </strong>

                        <span>
                            Please wait a moment...
                        </span>
                    </div>
                </div>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <style>{styles}</style>

                <div className="profile-error-page">
                    <div className="error-icon">
                        <Icon name="alert" size={28} />
                    </div>

                    <h2>
                        Profile could not be loaded
                    </h2>

                    <p>
                        {error ||
                            "Please try again."}
                    </p>

                    <button
                        className="btn-primary"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>
                </div>
            </>
        );
    }

    const isRejected =
        profile.approval_status === "rejected";

    const rejectionReason =
        profile.rejection_reason ||
        profile.admin_rejection_reason ||
        profile.rejection_message;

    return (
        <>
            <style>{styles}</style>

            <div className="profile-page">

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main className="profile-container">

                    {/* =================================================
                        PROFILE PHOTO HEADER
                    ================================================= */}

                    <section className="profile-hero">

                        <div className="profile-hero-left">

                            <div className="profile-photo-wrap">

                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt={
                                            profile.full_name ||
                                            "Profile"
                                        }
                                        className="profile-photo"
                                    />
                                ) : (
                                    <div className="profile-initials">
                                        {initials}
                                    </div>
                                )}

                                <span
                                    className={
                                        profile.approval_status ===
                                            "approved"
                                            ? "status-dot approved"
                                            : profile.approval_status ===
                                                "pending"
                                                ? "status-dot pending"
                                                : "status-dot"
                                    }
                                />
                            </div>

                            <div className="profile-hero-info">

                                <span className="eyebrow">
                                    PROFESSIONAL PROFILE
                                </span>

                                <h1>
                                    {profile.full_name ||
                                        "Your Name"}
                                </h1>

                                <p>
                                    {profile.headline ||
                                        "Build a strong professional profile to improve your job opportunities."}
                                </p>

                                <div className="hero-contact">

                                    {profile.email && (
                                        <span>
                                            <Icon
                                                name="mail"
                                                size={15}
                                            />

                                            {profile.email}
                                        </span>
                                    )}

                                    {profile.location && (
                                        <span>
                                            <Icon
                                                name="location"
                                                size={15}
                                            />

                                            {profile.location}
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>

                        <div className="completion-box">

                            <div className="completion-ring">

                                <svg
                                    viewBox="0 0 44 44"
                                    className="completion-svg"
                                >
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        className="ring-track"
                                    />

                                    <circle
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        className="ring-progress"
                                        style={{
                                            strokeDasharray: `${completion * 1.13} 113`,
                                        }}
                                    />
                                </svg>

                                <strong>
                                    {completion}%
                                </strong>

                            </div>

                            <div>
                                <span className="completion-label">
                                    PROFILE
                                </span>

                                <strong>
                                    {completion >= 80
                                        ? "Almost there"
                                        : "Complete your profile"}
                                </strong>

                                <small>
                                    Add details to stand out.
                                </small>
                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        STEPPER
                    ================================================= */}

                    <section className="stepper-card">

                        <div className="step active">
                            <div className="step-number">
                                <Icon
                                    name="check"
                                    size={16}
                                />
                            </div>

                            <div>
                                <strong>
                                    Details
                                </strong>

                                <span>
                                    Profile information
                                </span>
                            </div>
                        </div>

                        <div className="step-line" />

                        <div className="step">
                            <div className="step-number">
                                02
                            </div>

                            <div>
                                <strong>
                                    Documents
                                </strong>

                                <span>
                                    Resume & certificates
                                </span>
                            </div>
                        </div>

                        <div className="step-line" />

                        <div className="step">
                            <div className="step-number">
                                03
                            </div>

                            <div>
                                <strong>
                                    Review
                                </strong>

                                <span>
                                    Submit for approval
                                </span>
                            </div>
                        </div>

                    </section>

                    {/* =================================================
                        REJECTION
                    ================================================= */}

                    {isRejected && (
                        <section className="rejection-card">

                            <div className="rejection-icon">
                                <Icon
                                    name="alert"
                                    size={22}
                                />
                            </div>

                            <div className="rejection-content">

                                <span className="rejection-label">
                                    PROFILE CHANGES REQUIRED
                                </span>

                                <h3>
                                    Your profile needs
                                    attention
                                </h3>

                                <p>
                                    {rejectionReason ||
                                        "Please review your profile details and update the required information before submitting again."}
                                </p>

                            </div>

                        </section>
                    )}

                    {/* =================================================
                        ALERTS
                    ================================================= */}

                    {error && (
                        <div className="alert alert-error">
                            <Icon
                                name="alert"
                                size={19}
                            />

                            <span>{error}</span>

                            <button
                                onClick={() =>
                                    setError("")
                                }
                                aria-label="Close error"
                            >
                                <Icon
                                    name="close"
                                    size={17}
                                />
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <Icon
                                name="check"
                                size={19}
                            />

                            <span>{success}</span>

                            <button
                                onClick={() =>
                                    setSuccess("")
                                }
                                aria-label="Close success"
                            >
                                <Icon
                                    name="close"
                                    size={17}
                                />
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        PAGE HEADING
                    ================================================= */}

                    <div className="page-heading">

                        <div>
                            <span className="eyebrow">
                                STEP 01 / PROFILE DETAILS
                            </span>

                            <h2>
                                Tell employers about yourself
                            </h2>

                            <p>
                                Keep your professional
                                information accurate and
                                up to date.
                            </p>
                        </div>

                        {!editingProfile && (
                            <button
                                className="btn-secondary"
                                onClick={() =>
                                    setEditingProfile(true)
                                }
                            >
                                <Icon
                                    name="edit"
                                    size={17}
                                />

                                Edit Profile
                            </button>
                        )}

                    </div>

                    {/* =================================================
                        PERSONAL INFORMATION
                    ================================================= */}

                    <section className="section-card">

                        <div className="section-header">

                            <div className="section-title-wrap">

                                <div className="section-icon">
                                    <Icon
                                        name="user"
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <span>
                                        PERSONAL
                                    </span>

                                    <h3>
                                        Personal Information
                                    </h3>
                                </div>

                            </div>

                            {!editingProfile && (
                                <button
                                    className="icon-button"
                                    onClick={() =>
                                        setEditingProfile(true)
                                    }
                                    aria-label="Edit personal information"
                                >
                                    <Icon
                                        name="edit"
                                        size={18}
                                    />
                                </button>
                            )}

                        </div>

                        <div className="form-grid">

                            <FormField
                                label="Full Name"
                                required
                                icon="user"
                                value={
                                    profile.full_name ||
                                    ""
                                }
                                disabled={
                                    !editingProfile
                                }
                                onChange={(value) =>
                                    updateProfileField(
                                        "full_name",
                                        value
                                    )
                                }
                            />

                            <FormField
                                label="Email Address"
                                icon="mail"
                                value={
                                    profile.email ||
                                    ""
                                }
                                disabled
                                help="Email cannot be changed here."
                            />

                            <FormField
                                label="Phone Number"
                                required
                                icon="phone"
                                value={
                                    profile.phone ||
                                    ""
                                }
                                disabled={
                                    !editingProfile
                                }
                                onChange={(value) =>
                                    updateProfileField(
                                        "phone",
                                        value
                                    )
                                }
                            />

                            <FormField
                                label="Location"
                                icon="location"
                                value={
                                    profile.location ||
                                    ""
                                }
                                disabled={
                                    !editingProfile
                                }
                                onChange={(value) =>
                                    updateProfileField(
                                        "location",
                                        value
                                    )
                                }
                            />

                            <FormField
                                label="Professional Headline"
                                icon="briefcase"
                                value={
                                    profile.headline ||
                                    ""
                                }
                                disabled={
                                    !editingProfile
                                }
                                onChange={(value) =>
                                    updateProfileField(
                                        "headline",
                                        value
                                    )
                                }
                                full
                            />

                            <FormField
                                label="LinkedIn Profile"
                                icon="link"
                                value={
                                    profile.linkedin ||
                                    ""
                                }
                                disabled={
                                    !editingProfile
                                }
                                onChange={(value) =>
                                    updateProfileField(
                                        "linkedin",
                                        value
                                    )
                                }
                                full
                            />

                            <div className="field full">

                                <label>
                                    Skills
                                </label>

                                <textarea
                                    value={
                                        profile.skills ||
                                        ""
                                    }
                                    disabled={
                                        !editingProfile
                                    }
                                    placeholder="Example: React, JavaScript, Python, Django, MySQL"
                                    onChange={(e) =>
                                        updateProfileField(
                                            "skills",
                                            e.target.value
                                        )
                                    }
                                />

                                <small>
                                    Separate skills with
                                    commas.
                                </small>

                            </div>

                        </div>

                        {/* ---------------------------------------------
                            DISABILITY / ACCESSIBILITY (merged in-line)
                        --------------------------------------------- */}

                        <div className="disability-block">

                            <div className="disability-row">

                                <div className="disability-row-left">

                                    <div
                                        className={
                                            profile.disability
                                                ? "disability-icon on"
                                                : "disability-icon"
                                        }
                                    >
                                        <Icon
                                            name="accessibility"
                                            size={19}
                                        />
                                    </div>

                                    <div>
                                        <span className="disability-eyebrow">
                                            ACCESSIBILITY
                                        </span>

                                        <strong>
                                            Disability Details
                                        </strong>

                                        <small>
                                            {profile.disability
                                                ? "Included in your profile"
                                                : "Optional — share only if relevant"}
                                        </small>
                                    </div>

                                </div>

                                {editingProfile ? (
                                    <label className="switch">

                                        <input
                                            type="checkbox"
                                            checked={
                                                Boolean(
                                                    profile.disability
                                                )
                                            }
                                            onChange={(e) => {
                                                const checked =
                                                    e.target
                                                        .checked;

                                                setProfile(
                                                    (prev) => ({
                                                        ...prev,
                                                        disability:
                                                            checked,
                                                        disability_percentage:
                                                            checked
                                                                ? prev.disability_percentage
                                                                : null,
                                                    })
                                                );
                                            }}
                                        />

                                        <span className="switch-slider" />

                                    </label>
                                ) : (
                                    <span
                                        className={
                                            profile.disability
                                                ? "disability-pill on"
                                                : "disability-pill"
                                        }
                                    >
                                        {profile.disability
                                            ? "Enabled"
                                            : "Not provided"}
                                    </span>
                                )}

                            </div>

                            {profile.disability && (
                                <div className="form-grid disability-fields">

                                    <FormField
                                        label="Disability Category"
                                        value={
                                            profile.disability_category ||
                                            ""
                                        }
                                        disabled={
                                            !editingProfile
                                        }
                                        onChange={(value) =>
                                            updateProfileField(
                                                "disability_category",
                                                value
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Disability Type"
                                        value={
                                            profile.disability_type ||
                                            ""
                                        }
                                        disabled={
                                            !editingProfile
                                        }
                                        onChange={(value) =>
                                            updateProfileField(
                                                "disability_type",
                                                value
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Disability Percentage"
                                        type="number"
                                        value={
                                            profile.disability_percentage ??
                                            ""
                                        }
                                        disabled={
                                            !editingProfile
                                        }
                                        onChange={(value) =>
                                            updateProfileField(
                                                "disability_percentage",
                                                value
                                            )
                                        }
                                    />

                                </div>
                            )}

                        </div>

                        {editingProfile && (
                            <div className="form-actions">

                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setEditingProfile(
                                            false
                                        );
                                        loadProfile();
                                    }}
                                    disabled={
                                        savingProfile
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn-primary"
                                    onClick={saveProfile}
                                    disabled={
                                        savingProfile
                                    }
                                >
                                    <Icon
                                        name="save"
                                        size={17}
                                    />

                                    {savingProfile
                                        ? "Saving..."
                                        : "Save Profile"}
                                </button>

                            </div>
                        )}

                    </section>

                    {/* =================================================
                        EDUCATION
                    ================================================= */}

                    <section className="section-card">

                        <div className="section-header">

                            <div className="section-title-wrap">

                                <div className="section-icon">
                                    <Icon
                                        name="graduation"
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <span>
                                        EDUCATION
                                    </span>

                                    <h3>
                                        Academic Background
                                    </h3>
                                </div>

                            </div>

                            {!showEducationForm && (
                                <button
                                    className="btn-outline-small"
                                    onClick={() => {
                                        setEducationForm(
                                            EMPTY_EDUCATION
                                        );
                                        setEditingEducationId(
                                            null
                                        );
                                        setShowEducationForm(
                                            true
                                        );
                                    }}
                                >
                                    <Icon
                                        name="plus"
                                        size={16}
                                    />

                                    Add Education
                                </button>
                            )}

                        </div>

                        {educationList.length > 0 ? (
                            <div className="timeline-list">

                                {educationList.map(
                                    (item, index) => (
                                        <div
                                            className="timeline-item"
                                            key={
                                                item.id ||
                                                index
                                            }
                                        >

                                            <div className="timeline-dot">
                                                <Icon
                                                    name="graduation"
                                                    size={15}
                                                />
                                            </div>

                                            <div className="timeline-content">

                                                <div className="item-top">

                                                    <div>
                                                        <span className="item-number">
                                                            0
                                                            {index +
                                                                1}
                                                        </span>

                                                        <h4>
                                                            {item.degree ||
                                                                "Education"}
                                                        </h4>
                                                    </div>

                                                    <button
                                                        className="icon-button"
                                                        onClick={() =>
                                                            editEducation(
                                                                item
                                                            )
                                                        }
                                                        aria-label="Edit education"
                                                    >
                                                        <Icon
                                                            name="edit"
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                </div>

                                                <p className="item-company">
                                                    {item.college ||
                                                        item.university ||
                                                        "Institution not specified"}
                                                </p>

                                                <div className="item-meta">

                                                    {item.start_year &&
                                                        item.end_year && (
                                                            <span>
                                                                {item.start_year}
                                                                {" — "}
                                                                {item.end_year}
                                                            </span>
                                                        )}

                                                    {item.percentage_cgpa && (
                                                        <span>
                                                            {item.percentage_cgpa}
                                                        </span>
                                                    )}

                                                </div>

                                                {item.activities && (
                                                    <p className="item-description">
                                                        {
                                                            item.activities
                                                        }
                                                    </p>
                                                )}

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        ) : (
                            <EmptyState
                                icon="graduation"
                                title="No education added"
                                text="Add your academic qualifications to strengthen your profile."
                            />
                        )}

                        {showEducationForm && (
                            <div className="inline-form">

                                <div className="inline-form-header">

                                    <div>
                                        <span>
                                            {editingEducationId
                                                ? "EDIT EDUCATION"
                                                : "NEW EDUCATION"}
                                        </span>

                                        <h4>
                                            Academic qualification
                                        </h4>
                                    </div>

                                    <button
                                        className="icon-button"
                                        onClick={() => {
                                            setShowEducationForm(
                                                false
                                            );
                                            setEditingEducationId(
                                                null
                                            );
                                        }}
                                        aria-label="Close education form"
                                    >
                                        <Icon
                                            name="close"
                                            size={18}
                                        />
                                    </button>

                                </div>

                                <div className="form-grid">

                                    <FormField
                                        label="Degree"
                                        required
                                        value={
                                            educationForm.degree
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    degree: value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="University"
                                        value={
                                            educationForm.university
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    university:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="College"
                                        value={
                                            educationForm.college
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    college:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Start Year"
                                        value={
                                            educationForm.start_year
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    start_year:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="End Year"
                                        value={
                                            educationForm.end_year
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    end_year:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Passing Month & Year"
                                        value={
                                            educationForm.passing_month_year
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    passing_month_year:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Percentage / CGPA"
                                        value={
                                            educationForm.percentage_cgpa
                                        }
                                        onChange={(value) =>
                                            setEducationForm(
                                                (prev) => ({
                                                    ...prev,
                                                    percentage_cgpa:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <div className="field full">

                                        <label>
                                            Activities
                                        </label>

                                        <textarea
                                            value={
                                                educationForm.activities
                                            }
                                            onChange={(e) =>
                                                setEducationForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        activities:
                                                            e.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Achievements, activities, clubs, certifications..."
                                        />

                                    </div>

                                </div>

                                <div className="form-actions">

                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowEducationForm(
                                                false
                                            );
                                            setEditingEducationId(
                                                null
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn-primary"
                                        onClick={
                                            saveEducation
                                        }
                                        disabled={
                                            savingEducation
                                        }
                                    >
                                        <Icon
                                            name="save"
                                            size={16}
                                        />

                                        {savingEducation
                                            ? "Saving..."
                                            : "Save Education"}
                                    </button>

                                </div>

                            </div>
                        )}

                    </section>

                    {/* =================================================
                        EXPERIENCE
                    ================================================= */}

                    <section className="section-card">

                        <div className="section-header">

                            <div className="section-title-wrap">

                                <div className="section-icon">
                                    <Icon
                                        name="briefcase"
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <span>
                                        EXPERIENCE
                                    </span>

                                    <h3>
                                        Work Experience
                                    </h3>
                                </div>

                            </div>

                            {!showExperienceForm && (
                                <button
                                    className="btn-outline-small"
                                    onClick={() => {
                                        setExperienceForm(
                                            EMPTY_EXPERIENCE
                                        );
                                        setEditingExperienceId(
                                            null
                                        );
                                        setShowExperienceForm(
                                            true
                                        );
                                    }}
                                >
                                    <Icon
                                        name="plus"
                                        size={16}
                                    />

                                    Add Experience
                                </button>
                            )}

                        </div>

                        {experienceList.length > 0 ? (
                            <div className="timeline-list">

                                {experienceList.map(
                                    (item, index) => (
                                        <div
                                            className="timeline-item"
                                            key={
                                                item.id ||
                                                index
                                            }
                                        >

                                            <div className="timeline-dot">
                                                <Icon
                                                    name="briefcase"
                                                    size={15}
                                                />
                                            </div>

                                            <div className="timeline-content">

                                                <div className="item-top">

                                                    <div>
                                                        <span className="item-number">
                                                            0
                                                            {index +
                                                                1}
                                                        </span>

                                                        <h4>
                                                            {item.job_title ||
                                                                "Job Role"}
                                                        </h4>
                                                    </div>

                                                    <button
                                                        className="icon-button"
                                                        onClick={() =>
                                                            editExperience(
                                                                item
                                                            )
                                                        }
                                                        aria-label="Edit experience"
                                                    >
                                                        <Icon
                                                            name="edit"
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                </div>

                                                <p className="item-company">
                                                    {item.company ||
                                                        "Company not specified"}
                                                </p>

                                                <div className="item-meta">

                                                    {item.employment_type && (
                                                        <span>
                                                            {
                                                                item.employment_type
                                                            }
                                                        </span>
                                                    )}

                                                    {item.start_date && (
                                                        <span>
                                                            {
                                                                item.start_date
                                                            }
                                                            {" — "}
                                                            {item.is_current
                                                                ? "Present"
                                                                : item.end_date ||
                                                                ""}
                                                        </span>
                                                    )}

                                                    {item.is_current && (
                                                        <span className="current-badge">
                                                            CURRENT
                                                        </span>
                                                    )}

                                                </div>

                                                {item.description && (
                                                    <p className="item-description">
                                                        {
                                                            item.description
                                                        }
                                                    </p>
                                                )}

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        ) : (
                            <EmptyState
                                icon="briefcase"
                                title="No experience added"
                                text="Show employers where you have worked and what you have achieved."
                            />
                        )}

                        {showExperienceForm && (
                            <div className="inline-form">

                                <div className="inline-form-header">

                                    <div>
                                        <span>
                                            {editingExperienceId
                                                ? "EDIT EXPERIENCE"
                                                : "NEW EXPERIENCE"}
                                        </span>

                                        <h4>
                                            Work experience
                                        </h4>
                                    </div>

                                    <button
                                        className="icon-button"
                                        onClick={() => {
                                            setShowExperienceForm(
                                                false
                                            );
                                            setEditingExperienceId(
                                                null
                                            );
                                        }}
                                        aria-label="Close experience form"
                                    >
                                        <Icon
                                            name="close"
                                            size={18}
                                        />
                                    </button>

                                </div>

                                <div className="form-grid">

                                    <FormField
                                        label="Job Title"
                                        required
                                        value={
                                            experienceForm.job_title
                                        }
                                        onChange={(value) =>
                                            setExperienceForm(
                                                (prev) => ({
                                                    ...prev,
                                                    job_title:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Company"
                                        required
                                        value={
                                            experienceForm.company
                                        }
                                        onChange={(value) =>
                                            setExperienceForm(
                                                (prev) => ({
                                                    ...prev,
                                                    company:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <SelectField
                                        label="Employment Type"
                                        value={
                                            experienceForm.employment_type
                                        }
                                        options={[
                                            "Full Time",
                                            "Part Time",
                                            "Contract",
                                            "Internship",
                                            "Freelance",
                                        ]}
                                        onChange={(value) =>
                                            setExperienceForm(
                                                (prev) => ({
                                                    ...prev,
                                                    employment_type:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Start Date"
                                        type="date"
                                        required
                                        value={
                                            experienceForm.start_date
                                        }
                                        onChange={(value) =>
                                            setExperienceForm(
                                                (prev) => ({
                                                    ...prev,
                                                    start_date:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    {!experienceForm.is_current && (
                                        <FormField
                                            label="End Date"
                                            type="date"
                                            value={
                                                experienceForm.end_date
                                            }
                                            onChange={(value) =>
                                                setExperienceForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        end_date:
                                                            value,
                                                    })
                                                )
                                            }
                                        />
                                    )}

                                    <div className="field checkbox-field">

                                        <label className="checkbox-label">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    experienceForm.is_current
                                                }
                                                onChange={(e) =>
                                                    setExperienceForm(
                                                        (prev) => ({
                                                            ...prev,
                                                            is_current:
                                                                e
                                                                    .target
                                                                    .checked,
                                                            end_date:
                                                                e
                                                                    .target
                                                                    .checked
                                                                    ? ""
                                                                    : prev.end_date,
                                                        })
                                                    )
                                                }
                                            />

                                            <span className="checkbox-box">
                                                <Icon
                                                    name="check"
                                                    size={13}
                                                />
                                            </span>

                                            <span>
                                                I currently
                                                work here
                                            </span>

                                        </label>

                                    </div>

                                    <div className="field full">

                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            value={
                                                experienceForm.description
                                            }
                                            onChange={(e) =>
                                                setExperienceForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        description:
                                                            e.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Describe your responsibilities, achievements and contributions..."
                                        />

                                    </div>

                                </div>

                                <div className="form-actions">

                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowExperienceForm(
                                                false
                                            );
                                            setEditingExperienceId(
                                                null
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn-primary"
                                        onClick={
                                            saveExperience
                                        }
                                        disabled={
                                            savingExperience
                                        }
                                    >
                                        <Icon
                                            name="save"
                                            size={16}
                                        />

                                        {savingExperience
                                            ? "Saving..."
                                            : "Save Experience"}
                                    </button>

                                </div>

                            </div>
                        )}

                    </section>

                    {/* =================================================
                        PROJECTS
                    ================================================= */}

                    <section className="section-card">

                        <div className="section-header">

                            <div className="section-title-wrap">

                                <div className="section-icon">
                                    <Icon
                                        name="folder"
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <span>
                                        PORTFOLIO
                                    </span>

                                    <h3>
                                        Projects
                                    </h3>
                                </div>

                            </div>

                            {!showProjectForm && (
                                <button
                                    className="btn-outline-small"
                                    onClick={() => {
                                        setProjectForm(
                                            EMPTY_PROJECT
                                        );
                                        setEditingProjectId(
                                            null
                                        );
                                        setShowProjectForm(
                                            true
                                        );
                                    }}
                                >
                                    <Icon
                                        name="plus"
                                        size={16}
                                    />

                                    Add Project
                                </button>
                            )}

                        </div>

                        {projectList.length > 0 ? (
                            <div className="project-grid">

                                {projectList.map(
                                    (item, index) => (
                                        <article
                                            className="project-card"
                                            key={
                                                item.id ||
                                                index
                                            }
                                        >

                                            <div className="project-card-top">

                                                <div className="project-number">
                                                    {String(
                                                        index +
                                                        1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <button
                                                    className="icon-button"
                                                    onClick={() =>
                                                        editProject(
                                                            item
                                                        )
                                                    }
                                                    aria-label="Edit project"
                                                >
                                                    <Icon
                                                        name="edit"
                                                        size={17}
                                                    />
                                                </button>

                                            </div>

                                            <h4>
                                                {item.title ||
                                                    "Untitled Project"}
                                            </h4>

                                            {item.project_type && (
                                                <span className="project-type">
                                                    {
                                                        item.project_type
                                                    }
                                                </span>
                                            )}

                                            {item.description && (
                                                <p>
                                                    {
                                                        item.description
                                                    }
                                                </p>
                                            )}

                                            {item.technologies && (
                                                <div className="technology-list">

                                                    {String(
                                                        item.technologies
                                                    )
                                                        .split(
                                                            ","
                                                        )
                                                        .map(
                                                            (
                                                                tech,
                                                                i
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        i
                                                                    }
                                                                >
                                                                    {tech.trim()}
                                                                </span>
                                                            )
                                                        )}

                                                </div>
                                            )}

                                            {(item.project_link ||
                                                item.project_url) && (
                                                    <a
                                                        href={
                                                            item.project_link ||
                                                            item.project_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="project-link"
                                                    >
                                                        View Project

                                                        <Icon
                                                            name="external"
                                                            size={15}
                                                        />
                                                    </a>
                                                )}

                                        </article>
                                    )
                                )}

                            </div>
                        ) : (
                            <EmptyState
                                icon="folder"
                                title="No projects added"
                                text="Showcase your best projects, technical work and achievements."
                            />
                        )}

                        {showProjectForm && (
                            <div className="inline-form">

                                <div className="inline-form-header">

                                    <div>
                                        <span>
                                            {editingProjectId
                                                ? "EDIT PROJECT"
                                                : "NEW PROJECT"}
                                        </span>

                                        <h4>
                                            Project details
                                        </h4>
                                    </div>

                                    <button
                                        className="icon-button"
                                        onClick={() => {
                                            setShowProjectForm(
                                                false
                                            );
                                            setEditingProjectId(
                                                null
                                            );
                                        }}
                                        aria-label="Close project form"
                                    >
                                        <Icon
                                            name="close"
                                            size={18}
                                        />
                                    </button>

                                </div>

                                <div className="form-grid">

                                    <FormField
                                        label="Project Title"
                                        required
                                        value={
                                            projectForm.title
                                        }
                                        onChange={(value) =>
                                            setProjectForm(
                                                (prev) => ({
                                                    ...prev,
                                                    title: value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Project Type"
                                        value={
                                            projectForm.project_type
                                        }
                                        onChange={(value) =>
                                            setProjectForm(
                                                (prev) => ({
                                                    ...prev,
                                                    project_type:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <FormField
                                        label="Technologies"
                                        value={
                                            projectForm.technologies
                                        }
                                        onChange={(value) =>
                                            setProjectForm(
                                                (prev) => ({
                                                    ...prev,
                                                    technologies:
                                                        value,
                                                })
                                            )
                                        }
                                        full
                                    />

                                    <FormField
                                        label="Project Link"
                                        value={
                                            projectForm.project_link
                                        }
                                        onChange={(value) =>
                                            setProjectForm(
                                                (prev) => ({
                                                    ...prev,
                                                    project_link:
                                                        value,
                                                })
                                            )
                                        }
                                        full
                                    />

                                    <div className="field full">

                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            value={
                                                projectForm.description
                                            }
                                            onChange={(e) =>
                                                setProjectForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        description:
                                                            e.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Describe the project, your role and the outcome..."
                                        />

                                    </div>

                                </div>

                                <div className="form-actions">

                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowProjectForm(
                                                false
                                            );
                                            setEditingProjectId(
                                                null
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn-primary"
                                        onClick={saveProject}
                                        disabled={
                                            savingProject
                                        }
                                    >
                                        <Icon
                                            name="save"
                                            size={16}
                                        />

                                        {savingProject
                                            ? "Saving..."
                                            : "Save Project"}
                                    </button>

                                </div>

                            </div>
                        )}

                    </section>

                    {/* =================================================
                        NEXT ACTION
                    ================================================= */}

                    <section className="next-card">

                        <div className="next-card-left">

                            <div className="next-icon">
                                <Icon
                                    name="arrow"
                                    size={23}
                                />
                            </div>

                            <div>
                                <span>
                                    NEXT STEP
                                </span>

                                <h3>
                                    Continue to Documents
                                </h3>

                                <p>
                                    Upload your resume and
                                    supporting documents in
                                    the next step.
                                </p>
                            </div>

                        </div>

                        <button
                            className="btn-primary next-button"
                            onClick={handleNext}
                        >
                            Continue

                            <Icon
                                name="arrow"
                                size={17}
                            />
                        </button>

                    </section>

                </main>

            </div>
        </>
    );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
    label,
    value,
    onChange,
    disabled = false,
    required = false,
    type = "text",
    icon,
    help,
    full = false,
}) {
    return (
        <div
            className={`field ${
                full ? "full" : ""
            }`}
        >

            <label>
                {label}

                {required && (
                    <span className="required">
                        *
                    </span>
                )}
            </label>

            <div className="input-wrap">

                {icon && (
                    <span className="input-icon">
                        <Icon
                            name={icon}
                            size={17}
                        />
                    </span>
                )}

                <input
                    type={type}
                    value={value ?? ""}
                    disabled={disabled}
                    onChange={(e) =>
                        onChange?.(
                            e.target.value
                        )
                    }
                />

            </div>

            {help && (
                <small>
                    {help}
                </small>
            )}

        </div>
    );
}

/* =========================================================
   SELECT
========================================================= */

function SelectField({
    label,
    value,
    options,
    onChange,
}) {
    return (
        <div className="field">

            <label>
                {label}
            </label>

            <div className="select-wrap">

                <select
                    value={value}
                    onChange={(e) =>
                        onChange(
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        Select
                    </option>

                    {options.map((option) => (
                        <option
                            value={option}
                            key={option}
                        >
                            {option}
                        </option>
                    ))}
                </select>

                <span>
                    <Icon
                        name="chevron"
                        size={16}
                    />
                </span>

            </div>

        </div>
    );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
    icon,
    title,
    text,
}) {
    return (
        <div className="empty-state">

            <div className="empty-icon">
                <Icon
                    name={icon}
                    size={24}
                />
            </div>

            <div>
                <h4>
                    {title}
                </h4>

                <p>
                    {text}
                </p>
            </div>

        </div>
    );
}

/* =========================================================
   ADVANCED BLACK & WHITE CSS
========================================================= */

const styles = `

:root {
    --black: #050505;
    --ink: #111111;
    --text: #292929;
    --muted: #777777;
    --muted-2: #999999;

    --white: #ffffff;
    --bg: #f5f5f5;
    --soft: #fafafa;
    --soft-2: #f0f0f0;

    --line: #e3e3e3;
    --line-dark: #cfcfcf;

    --shadow-sm:
        0 4px 16px rgba(0, 0, 0, .045);

    --shadow:
        0 15px 45px rgba(0, 0, 0, .075);

    --radius: 20px;
}

/* =========================================================
   RESET
========================================================= */

* {
    box-sizing: border-box;
}

.profile-page {
    min-height: 100vh;
    background:
        linear-gradient(
            180deg,
            #f8f8f8 0%,
            #f2f2f2 100%
        );

    color: var(--ink);

    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    padding: 34px 20px 70px;
}

/* =========================================================
   CONTAINER
========================================================= */

.profile-container {
    width: min(1180px, 100%);
    margin: 0 auto;
}

/* =========================================================
   PROFILE HERO
========================================================= */

.profile-hero {
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 26px;

    min-height: 190px;

    padding: 28px 30px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;

    box-shadow: var(--shadow);

    position: relative;
    overflow: hidden;
}

.profile-hero::before {
    content: "";
    position: absolute;

    width: 220px;
    height: 220px;

    border-radius: 50%;

    right: -90px;
    top: -100px;

    border: 1px solid #ededed;
}

.profile-hero::after {
    content: "";
    position: absolute;

    width: 140px;
    height: 140px;

    border-radius: 50%;

    right: 50px;
    bottom: -100px;

    background: #f8f8f8;
}

.profile-hero-left {
    display: flex;
    align-items: center;
    gap: 22px;

    position: relative;
    z-index: 2;

    min-width: 0;
}

.profile-photo-wrap {
    width: 108px;
    height: 108px;

    flex: 0 0 108px;

    position: relative;
}

.profile-photo,
.profile-initials {
    width: 108px;
    height: 108px;

    border-radius: 50%;

    object-fit: cover;

    border: 5px solid #fff;

    box-shadow:
        0 0 0 1px #d8d8d8,
        0 12px 28px rgba(0,0,0,.10);
}

.profile-initials {
    background:
        linear-gradient(
            145deg,
            #0b0b0b,
            #444
        );

    color: white;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 31px;
    font-weight: 800;
    letter-spacing: -1px;
}

.status-dot {
    position: absolute;

    width: 17px;
    height: 17px;

    border-radius: 50%;

    right: 5px;
    bottom: 7px;

    background: #777;

    border: 3px solid white;
}

.status-dot.approved {
    background: #111;
}

.status-dot.pending {
    background: #777;
}

.profile-hero-info {
    min-width: 0;
}

.eyebrow {
    display: block;

    font-size: 10px;
    font-weight: 900;

    letter-spacing: 1.8px;

    color: #858585;

    margin-bottom: 5px;
}

.profile-hero-info h1 {
    margin: 0;

    font-size: clamp(25px, 3vw, 34px);

    line-height: 1.08;

    letter-spacing: -1.2px;

    font-weight: 850;
}

.profile-hero-info p {
    margin: 8px 0 12px;

    color: #6e6e6e;

    font-size: 14px;

    max-width: 610px;

    line-height: 1.55;
}

.hero-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 13px;
}

.hero-contact span {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    font-size: 12px;
    color: #666;
}

.completion-box {
    position: relative;
    z-index: 2;

    display: flex;
    align-items: center;
    gap: 13px;

    min-width: 190px;

    padding: 15px;

    border: 1px solid var(--line);

    border-radius: 16px;

    background: #fafafa;
}

.completion-ring {
    width: 64px;
    height: 64px;

    position: relative;

    flex: 0 0 64px;
}

.completion-svg {
    width: 100%;
    height: 100%;

    transform: rotate(-90deg);
}

.ring-track,
.ring-progress {
    fill: none;
    stroke-width: 4;
}

.ring-track {
    stroke: #dedede;
}

.ring-progress {
    stroke: #111;
    stroke-linecap: round;
}

.completion-ring strong {
    position: absolute;

    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 14px;
}

.completion-label {
    display: block;

    font-size: 9px;
    letter-spacing: 1.5px;
    font-weight: 900;

    color: #999;
}

.completion-box > div:last-child strong {
    display: block;

    font-size: 13px;

    margin-top: 2px;
}

.completion-box small {
    display: block;

    color: #888;

    font-size: 10px;

    margin-top: 2px;
}

/* =========================================================
   STEPPER
========================================================= */

.stepper-card {
    margin-top: 18px;

    background: white;

    border: 1px solid var(--line);

    border-radius: 18px;

    padding: 17px 22px;

    display: flex;
    align-items: center;

    box-shadow: var(--shadow-sm);
}

.step {
    display: flex;
    align-items: center;

    gap: 10px;

    min-width: 0;
}

.step-number {
    width: 32px;
    height: 32px;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    flex: 0 0 32px;

    background: #f0f0f0;

    color: #888;

    font-size: 10px;
    font-weight: 900;
}

.step.active .step-number {
    background: #111;
    color: #fff;
}

.step strong {
    display: block;

    font-size: 12px;
}

.step span {
    display: block;

    color: #999;

    font-size: 10px;

    margin-top: 2px;
}

.step-line {
    height: 1px;

    background: #dedede;

    flex: 1;

    margin: 0 18px;
}

/* =========================================================
   REJECTION
========================================================= */

.rejection-card {
    margin-top: 18px;

    padding: 20px;

    background: #fff;

    border: 1px solid #222;

    border-radius: 18px;

    display: flex;
    gap: 15px;

    box-shadow: var(--shadow-sm);
}

.rejection-icon {
    width: 43px;
    height: 43px;

    border-radius: 12px;

    background: #111;

    color: white;

    display: flex;
    align-items: center;
    justify-content: center;

    flex: 0 0 43px;
}

.rejection-label {
    font-size: 9px;

    letter-spacing: 1.5px;

    font-weight: 900;

    color: #777;
}

.rejection-content h3 {
    margin: 4px 0 5px;

    font-size: 17px;
}

.rejection-content p {
    margin: 0;

    color: #666;

    font-size: 13px;

    line-height: 1.55;
}

/* =========================================================
   ALERT
========================================================= */

.alert {
    margin-top: 18px;

    border-radius: 14px;

    padding: 13px 15px;

    display: flex;
    align-items: center;
    gap: 10px;

    font-size: 13px;
}

.alert button {
    margin-left: auto;

    background: transparent;
    border: 0;

    cursor: pointer;

    color: inherit;
}

.alert-error {
    background: #fff;
    border: 1px solid #222;
    color: #111;
}

.alert-success {
    background: #f7f7f7;
    border: 1px solid #cfcfcf;
    color: #222;
}

/* =========================================================
   PAGE HEADING
========================================================= */

.page-heading {
    margin: 38px 2px 18px;

    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    gap: 20px;
}

.page-heading h2 {
    margin: 4px 0 5px;

    font-size: 27px;

    letter-spacing: -.8px;

    line-height: 1.15;
}

.page-heading p {
    margin: 0;

    font-size: 13px;

    color: #777;
}

/* =========================================================
   SECTION CARD
========================================================= */

.section-card {
    background: white;

    border: 1px solid var(--line);

    border-radius: var(--radius);

    padding: 25px;

    margin-bottom: 18px;

    box-shadow: var(--shadow-sm);

    transition:
        box-shadow .2s ease,
        transform .2s ease;
}

.section-card:hover {
    box-shadow: var(--shadow);
}

.section-header {
    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 15px;

    margin-bottom: 25px;
}

.section-title-wrap {
    display: flex;

    align-items: center;

    gap: 13px;
}

.section-icon {
    width: 43px;
    height: 43px;

    border-radius: 13px;

    background: #f1f1f1;

    color: #111;

    display: flex;
    align-items: center;
    justify-content: center;
}

.section-icon.dark {
    background: #111;
    color: white;
}

.section-title-wrap span {
    display: block;

    color: #999;

    font-size: 9px;

    font-weight: 900;

    letter-spacing: 1.6px;
}

.section-title-wrap h3 {
    margin: 3px 0 0;

    font-size: 18px;

    letter-spacing: -.3px;
}

/* =========================================================
   FORM GRID
========================================================= */

.form-grid {
    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 18px;
}

.field {
    min-width: 0;
}

.field.full {
    grid-column: 1 / -1;
}

.field label {
    display: block;

    margin-bottom: 7px;

    font-size: 11px;

    font-weight: 800;

    color: #333;
}

.required {
    color: #111;

    margin-left: 3px;
}

.input-wrap {
    position: relative;
}

.input-wrap input,
.field textarea,
.select-wrap select {
    width: 100%;

    border: 1px solid #dcdcdc;

    background: #fff;

    border-radius: 11px;

    color: #161616;

    font-size: 13px;

    outline: none;

    transition:
        border-color .18s ease,
        box-shadow .18s ease,
        background .18s ease;
        
}

.input-wrap input {
    height: 46px;

    padding:
        0 13px;
}

.input-wrap input:has(+ *) {
    padding-left: 40px;
}

.input-icon {
    position: absolute;

    left: 5px;
    top: 50%;

    transform: translateY(-50%);

    color: #e9e4e4ff;

    pointer-events: none;
}

.field textarea {
    min-height: 105px;

    padding: 13px;

    resize: vertical;

    line-height: 1.55;
}

.field input:focus,
.field textarea:focus,
.select-wrap select:focus {
    border-color: #111;

    box-shadow:
        0 0 0 3px
        rgba(0,0,0,.07);
}

.field input:disabled,
.field textarea:disabled {
    background: #f7f7f7;

    color: #777;

    cursor: not-allowed;
}

.field small {
    display: block;

    margin-top: 5px;

    font-size: 10px;

    color: #999;
}

.select-wrap {
    position: relative;
}

.select-wrap select {
    height: 46px;

    padding: 0 38px 0 13px;

    appearance: none;

    cursor: pointer;
}

.select-wrap > span {
    position: absolute;

    right: 13px;
    top: 50%;

    transform: translateY(-50%);

    pointer-events: none;

    color: #777;
}

/* =========================================================
   BUTTONS
========================================================= */

.btn-primary,
.btn-secondary,
.btn-outline-small {
    border-radius: 11px;

    min-height: 43px;

    padding: 0 17px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    font-size: 12px;

    font-weight: 800;

    cursor: pointer;

    transition:
        transform .18s ease,
        background .18s ease,
        border-color .18s ease,
        box-shadow .18s ease;
}

.btn-primary {
    border: 1px solid #111;

    background: #111;

    color: white;
}

.btn-primary:hover {
    background: #2b2b2b;

    transform: translateY(-1px);

    box-shadow:
        0 8px 18px
        rgba(0,0,0,.12);
}

.btn-secondary {
    border: 1px solid #d4d4d4;

    background: white;

    color: #111;
}

.btn-secondary:hover {
    border-color: #111;

    transform: translateY(-1px);
}

.btn-outline-small {
    min-height: 37px;

    padding: 0 12px;

    background: white;

    border: 1px solid #d5d5d5;

    color: #111;
}

.btn-outline-small:hover {
    border-color: #111;

    background: #f7f7f7;
}

.btn-primary:disabled,
.btn-secondary:disabled {
    opacity: .55;

    cursor: not-allowed;

    transform: none;
}

.icon-button {
    width: 36px;
    height: 36px;

    border-radius: 10px;

    border: 1px solid #dedede;

    background: white;

    color: #333;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    cursor: pointer;

    transition:
        border-color .18s ease,
        background .18s ease,
        transform .18s ease;
}

.icon-button:hover {
    border-color: #111;

    background: #f7f7f7;

    transform: translateY(-1px);
}

/* =========================================================
   FORM ACTIONS
========================================================= */

.form-actions {
    display: flex;

    justify-content: flex-end;

    gap: 9px;

    margin-top: 22px;

    padding-top: 19px;

    border-top: 1px solid #eeeeee;
}

/* =========================================================
   DISABILITY (merged into Personal Information)
========================================================= */

.disability-block {
    margin-top: 22px;

    padding-top: 22px;

    border-top: 1px dashed #e2e2e2;
}

.disability-row {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 16px;

    padding: 16px 18px;

    background:
        linear-gradient(
            180deg,
            #fafafa 0%,
            #f5f5f5 100%
        );

    border: 1px solid #e7e7e7;

    border-radius: 14px;
}

.disability-row-left {
    display: flex;

    align-items: center;

    gap: 13px;

    min-width: 0;
}

.disability-icon {
    width: 40px;
    height: 40px;

    flex: 0 0 40px;

    border-radius: 11px;

    background: #eeeeee;

    color: #777;

    display: flex;

    align-items: center;
    justify-content: center;

    transition:
        background .2s ease,
        color .2s ease;
}

.disability-icon.on {
    background: #111;

    color: white;
}

.disability-eyebrow {
    display: block;

    font-size: 9px;

    letter-spacing: 1.4px;

    font-weight: 900;

    color: #999;
}

.disability-row-left strong {
    display: block;

    font-size: 13px;

    margin-top: 2px;
}

.disability-row-left small {
    display: block;

    color: #888;

    font-size: 10.5px;

    margin-top: 2px;
}

.disability-pill {
    border: 1px solid #dcdcdc;

    background: white;

    border-radius: 20px;

    padding: 7px 12px;

    font-size: 10px;

    font-weight: 800;

    color: #888;

    flex: 0 0 auto;
}

.disability-pill.on {
    background: #111;

    border-color: #111;

    color: white;
}

.disability-fields {
    margin-top: 16px;

    padding: 18px;

    background: #fcfcfc;

    border: 1px solid #ededed;

    border-radius: 14px;
}

/* =========================================================
   SWITCH
========================================================= */

.switch {
    position: relative;

    width: 48px;
    height: 27px;

    display: block;

    flex: 0 0 auto;
}

.switch input {
    opacity: 0;

    width: 0;
    height: 0;
}

.switch-slider {
    position: absolute;

    inset: 0;

    background: #d4d4d4;

    border-radius: 30px;

    cursor: pointer;

    transition: .2s ease;
}

.switch-slider::before {
    content: "";

    position: absolute;

    width: 21px;
    height: 21px;

    left: 3px;
    top: 3px;

    background: white;

    border-radius: 50%;

    box-shadow:
        0 2px 5px rgba(0,0,0,.18);

    transition: .2s ease;
}

.switch input:checked + .switch-slider {
    background: #111;
}

.switch input:checked + .switch-slider::before {
    transform: translateX(21px);
}

/* =========================================================
   TIMELINE
========================================================= */

.timeline-list {
    position: relative;

    margin-left: 6px;
}

.timeline-list::before {
    content: "";

    position: absolute;

    left: 17px;
    top: 16px;
    bottom: 18px;

    width: 1px;

    background: #dedede;
}

.timeline-item {
    position: relative;

    display: flex;

    gap: 18px;

    padding-bottom: 24px;
}

.timeline-item:last-child {
    padding-bottom: 0;
}

.timeline-dot {
    width: 36px;
    height: 36px;

    border-radius: 50%;

    flex: 0 0 36px;

    background: white;

    border: 1px solid #d5d5d5;

    color: #222;

    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;

    z-index: 2;
}

.timeline-content {
    flex: 1;

    min-width: 0;

    padding: 1px 0;
}

.item-top {
    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 12px;
}

.item-top > div {
    min-width: 0;
}

.item-number {
    display: inline-flex;

    color: #999;

    font-size: 9px;

    font-weight: 900;

    margin-right: 7px;
}

.item-top h4 {
    display: inline;

    margin: 0;

    font-size: 15px;

    font-weight: 800;
}

.item-company {
    margin: 5px 0 8px;

    color: #555;

    font-size: 12px;
}

.item-meta {
    display: flex;

    align-items: center;

    flex-wrap: wrap;

    gap: 7px;
}

.item-meta span {
    display: inline-flex;

    align-items: center;

    padding: 5px 8px;

    border-radius: 7px;

    background: #f2f2f2;

    color: #666;

    font-size: 9px;

    font-weight: 700;
}

.current-badge {
    background: #111 !important;

    color: white !important;

    letter-spacing: .7px;
}

.item-description {
    margin: 10px 0 0;

    font-size: 12px;

    color: #777;

    line-height: 1.55;
}

/* =========================================================
   INLINE FORM
========================================================= */

.inline-form {
    margin-top: 22px;

    padding: 21px;

    background: #fafafa;

    border: 1px solid #dedede;

    border-radius: 15px;
}

.inline-form-header {
    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 15px;

    margin-bottom: 20px;
}

.inline-form-header span {
    font-size: 9px;

    letter-spacing: 1.5px;

    color: #999;

    font-weight: 900;
}

.inline-form-header h4 {
    margin: 4px 0 0;

    font-size: 16px;
}

/* =========================================================
   CHECKBOX
========================================================= */

.checkbox-field {
    display: flex;

    align-items: flex-end;
}

.checkbox-label {
    display: flex !important;

    align-items: center;

    gap: 9px;

    margin-bottom: 8px;

    cursor: pointer;

    font-size: 12px !important;

    font-weight: 700 !important;
}

.checkbox-label input {
    display: none;
}

.checkbox-box {
    width: 20px;
    height: 20px;

    border: 1px solid #ccc;

    border-radius: 6px;

    display: flex;

    align-items: center;
    justify-content: center;

    color: transparent;

    background: white;
}

.checkbox-label input:checked
+ .checkbox-box {
    background: #111;

    color: white;

    border-color: #111;
}

/* =========================================================
   PROJECTS
========================================================= */

.project-grid {
    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 14px;
}

.project-card {
    border: 1px solid #e1e1e1;

    border-radius: 15px;

    padding: 18px;

    background: #fff;

    min-height: 235px;

    display: flex;

    flex-direction: column;

    transition:
        transform .2s ease,
        border-color .2s ease,
        box-shadow .2s ease;
}

.project-card:hover {
    transform: translateY(-3px);

    border-color: #bcbcbc;

    box-shadow:
        0 12px 30px rgba(0,0,0,.07);
}

.project-card-top {
    display: flex;

    justify-content: space-between;

    align-items: center;
}

.project-number {
    width: 31px;
    height: 31px;

    border-radius: 9px;

    background: #111;

    color: white;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 9px;

    font-weight: 900;
}

.project-card h4 {
    margin: 15px 0 6px;

    font-size: 16px;

    letter-spacing: -.2px;
}

.project-type {
    display: inline-flex;

    width: fit-content;

    padding: 4px 7px;

    border-radius: 6px;

    background: #f0f0f0;

    color: #666;

    font-size: 8px;

    font-weight: 900;

    text-transform: uppercase;

    letter-spacing: .8px;
}

.project-card p {
    margin: 11px 0;

    color: #777;

    font-size: 11px;

    line-height: 1.55;
}

.technology-list {
    display: flex;

    flex-wrap: wrap;

    gap: 5px;

    margin-top: auto;

    padding-top: 7px;
}

.technology-list span {
    padding: 5px 7px;

    background: #f3f3f3;

    border-radius: 6px;

    font-size: 9px;

    color: #555;
}

.project-link {
    margin-top: 13px;

    padding-top: 12px;

    border-top: 1px solid #ededed;

    display: inline-flex;

    align-items: center;

    gap: 6px;

    color: #111;

    font-size: 11px;

    font-weight: 800;

    text-decoration: none;
}

.project-link:hover {
    text-decoration: underline;
}

/* =========================================================
   EMPTY STATE
========================================================= */

.empty-state {
    border: 1px dashed #d3d3d3;

    background: #fafafa;

    border-radius: 14px;

    padding: 22px;

    display: flex;

    align-items: center;

    gap: 13px;
}

.empty-icon {
    width: 43px;
    height: 43px;

    flex: 0 0 43px;

    border-radius: 12px;

    background: #ededed;

    color: #777;

    display: flex;

    align-items: center;
    justify-content: center;
}

.empty-state h4 {
    margin: 0 0 3px;

    font-size: 13px;
}

.empty-state p {
    margin: 0;

    color: #888;

    font-size: 11px;

    line-height: 1.5;
}

/* =========================================================
   NEXT CARD
========================================================= */

.next-card {
    margin-top: 22px;

    padding: 22px 24px;

    background: #111;

    color: white;

    border-radius: 19px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

    box-shadow:
        0 18px 40px rgba(0,0,0,.14);
}

.next-card-left {
    display: flex;

    align-items: center;

    gap: 14px;
}

.next-icon {
    width: 48px;
    height: 48px;

    border-radius: 14px;

    background: #292929;

    display: flex;

    align-items: center;
    justify-content: center;
}

.next-card-left > div:last-child > span {
    font-size: 9px;

    letter-spacing: 1.5px;

    font-weight: 900;

    color: #aaa;
}

.next-card h3 {
    margin: 3px 0;

    font-size: 16px;
}

.next-card p {
    margin: 0;

    color: #aaa;

    font-size: 11px;
}

.next-button {
    background: white;

    color: #111;

    border-color: white;

    flex: 0 0 auto;
}

.next-button:hover {
    background: #ededed;
}

/* =========================================================
   LOADING
========================================================= */

.profile-loading {
    min-height: 100vh;

    display: flex;

    align-items: center;
    justify-content: center;

    gap: 14px;

    background: #f5f5f5;

    color: #222;
}

.profile-loading > div:last-child span {
    display: block;

    color: #888;

    font-size: 11px;

    margin-top: 3px;
}

.loading-spinner {
    width: 32px;
    height: 32px;

    border-radius: 50%;

    border: 3px solid #ddd;

    border-top-color: #111;

    animation:
        spin .8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* =========================================================
   ERROR PAGE
========================================================= */

.profile-error-page {
    min-height: 100vh;

    display: flex;

    align-items: center;
    justify-content: center;

    flex-direction: column;

    text-align: center;

    padding: 30px;

    background: #f5f5f5;
}

.error-icon {
    width: 58px;
    height: 58px;

    border-radius: 16px;

    background: #111;

    color: white;

    display: flex;

    align-items: center;
    justify-content: center;

    margin-bottom: 15px;
}

.profile-error-page h2 {
    margin: 0 0 7px;

    font-size: 21px;
}

.profile-error-page p {
    margin: 0 0 18px;

    color: #777;

    font-size: 13px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 980px) {

    .profile-hero {
        align-items: flex-start;

        flex-direction: column;
    }

    .completion-box {
        width: 100%;
    }

    .project-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 760px) {

    .profile-page {
        padding:
            18px 12px 45px;
    }

    .profile-hero {
        padding: 21px;

        border-radius: 20px;
    }

    .profile-hero-left {
        align-items: flex-start;
    }

    .profile-photo-wrap,
    .profile-photo,
    .profile-initials {
        width: 82px;
        height: 82px;
    }

    .profile-photo-wrap {
        flex-basis: 82px;
    }

    .profile-initials {
        font-size: 24px;
    }

    .stepper-card {
        overflow-x: auto;

        padding: 14px;

        gap: 10px;
    }

    .step {
        min-width: 145px;
    }

    .step-line {
        min-width: 20px;

        margin: 0 3px;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .field.full {
        grid-column: auto;
    }

    .section-card {
        padding: 19px;

        border-radius: 17px;
    }

    .page-heading {
        align-items: flex-start;

        flex-direction: column;
    }

    .page-heading h2 {
        font-size: 23px;
    }

    .page-heading .btn-secondary {
        width: 100%;
    }

    .project-grid {
        grid-template-columns: 1fr;
    }

    .next-card {
        align-items: flex-start;

        flex-direction: column;
    }

    .next-button {
        width: 100%;
    }
}

@media (max-width: 520px) {

    .profile-hero-left {
        flex-direction: column;
    }

    .profile-hero-info h1 {
        font-size: 27px;
    }

    .hero-contact {
        flex-direction: column;

        gap: 6px;
    }

    .completion-box {
        min-width: 0;
    }

    .section-header {
        align-items: flex-start;

        flex-direction: column;
    }

    .section-header > .btn-outline-small {
        width: 100%;
    }

    .disability-row {
        flex-direction: column;

        align-items: flex-start;
    }

    .disability-fields {
        padding: 14px;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions button {
        width: 100%;
    }

    .rejection-card {
        align-items: flex-start;
    }

    .next-card {
        padding: 19px;
    }
}

`;