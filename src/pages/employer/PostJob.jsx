import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function PostJob() {

    const navigate = useNavigate();

    // =========================================================
    // FORM DATA
    // =========================================================

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        experienceType: "",
        minExperience: "",
        maxExperience: "",
        education: "",
        location: "",
        jobType: "",
        workMode: "",
        salaryMin: "",
        salaryMax: "",
        isDisabilityJob: false,
    });

    // =========================================================
    // SKILLS
    // =========================================================

    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");

    // =========================================================
    // RESPONSIBILITIES / FEATURES
    // =========================================================

    const [responsibilities, setResponsibilities] = useState("");
    const [features, setFeatures] = useState("");

    // =========================================================
    // LOADING
    // =========================================================

    const [loading, setLoading] = useState(false);

    // =========================================================
    // POPUP
    // =========================================================

    const [popup, setPopup] = useState({
        show: false,
        type: "",
        title: "",
        message: "",
    });

    // =========================================================
    // SHOW POPUP
    // =========================================================

    function showPopup(type, title, message) {

        setPopup({
            show: true,
            type,
            title,
            message,
        });
    }

    // =========================================================
    // CLOSE POPUP
    // =========================================================

    function closePopup() {

        setPopup({
            show: false,
            type: "",
            title: "",
            message: "",
        });
    }

    // =========================================================
    // HANDLE FORM CHANGE
    // =========================================================

    function handleChange(e) {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // =========================================================
    // EXPERIENCE TYPE CHANGE
    // =========================================================

    function handleExperienceTypeChange(e) {

        const value = e.target.value;

        setFormData((previous) => ({
            ...previous,
            experienceType: value,

            ...(value === "fresher"
                ? {
                    minExperience: "",
                    maxExperience: "",
                }
                : {}),
        }));
    }

    // =========================================================
    // DISABILITY-ONLY JOB CHANGE
    // =========================================================

    function handleDisabilityJobChange(e) {

        const checked = e.target.checked;

        setFormData((previous) => ({
            ...previous,
            isDisabilityJob: checked,
        }));
    }

    // =========================================================
    // ADD SKILL
    // =========================================================

    function addSkill() {

        const skill = skillInput.trim();

        if (!skill) {
            return;
        }

        const alreadyExists = skills.some(
            (item) =>
                item.toLowerCase() ===
                skill.toLowerCase()
        );

        if (!alreadyExists) {

            setSkills((previous) => [
                ...previous,
                skill,
            ]);
        }

        setSkillInput("");
    }

    // =========================================================
    // REMOVE SKILL
    // =========================================================

    function removeSkill(skillToRemove) {

        setSkills((previous) =>
            previous.filter(
                (skill) =>
                    skill !== skillToRemove
            )
        );
    }

    // =========================================================
    // GET BACKEND EXPERIENCE CATEGORY
    // =========================================================
    //
    // Backend choices:
    //
    // fresher
    // 0-2
    // 2-5
    // 5+
    //
    // =========================================================

    function getBackendExperience() {

        // -----------------------------------------------------
        // FRESHER
        // -----------------------------------------------------

        if (
            formData.experienceType === "fresher"
        ) {

            return "fresher";
        }

        // -----------------------------------------------------
        // EXPERIENCED
        // -----------------------------------------------------

        if (
            formData.experienceType === "experienced"
        ) {

            const min =
                formData.minExperience === ""
                    ? null
                    : Number(
                        formData.minExperience
                    );

            const max =
                formData.maxExperience === ""
                    ? null
                    : Number(
                        formData.maxExperience
                    );

            // -------------------------------------------------
            // 0 - 2
            // -------------------------------------------------

            if (
                min !== null &&
                max !== null &&
                min >= 0 &&
                max <= 2
            ) {

                return "0-2";
            }

            // -------------------------------------------------
            // 2 - 5
            // -------------------------------------------------

            if (
                min !== null &&
                max !== null &&
                min >= 2 &&
                max <= 5
            ) {

                return "2-5";
            }

            // -------------------------------------------------
            // 5+
            // -------------------------------------------------

            if (
                min !== null &&
                min >= 5
            ) {

                return "5+";
            }
        }

        return "";
    }

    // =========================================================
    // FORMAT DJANGO VALIDATION ERRORS
    // =========================================================

    function formatValidationErrors(errors) {

        if (
            !errors ||
            typeof errors !== "object"
        ) {

            return "";
        }

        const messages = [];

        Object.entries(errors).forEach(
            ([field, fieldErrors]) => {

                let text = "";

                if (
                    Array.isArray(fieldErrors)
                ) {

                    text = fieldErrors
                        .map((item) => {

                            if (
                                typeof item === "object" &&
                                item !== null
                            ) {

                                return JSON.stringify(
                                    item
                                );
                            }

                            return String(item);
                        })
                        .join(", ");

                } else if (
                    typeof fieldErrors === "string"
                ) {

                    text = fieldErrors;

                } else {

                    text =
                        JSON.stringify(
                            fieldErrors
                        );
                }

                if (text) {

                    const fieldName =
                        field
                            .replaceAll("_", " ")
                            .replace(
                                /\b\w/g,
                                (letter) =>
                                    letter.toUpperCase()
                            );

                    messages.push(
                        `${fieldName}: ${text}`
                    );
                }
            }
        );

        return messages.join("\n");
    }

    // =========================================================
    // SAVE / POST JOB
    // =========================================================

    async function saveJob() {

        // =====================================================
        // JOB TITLE
        // =====================================================

        if (!formData.title.trim()) {

            showPopup(
                "error",
                "Job Title Required",
                "Please enter a job title before posting the job."
            );

            return;
        }

        // =====================================================
        // DESCRIPTION
        // =====================================================

        if (!formData.description.trim()) {

            showPopup(
                "error",
                "Description Required",
                "Please enter a job description before posting the job."
            );

            return;
        }

        // =====================================================
        // SKILLS
        // =====================================================

        if (skills.length === 0) {

            showPopup(
                "error",
                "Skills Required",
                "Please add at least one skill."
            );

            return;
        }

        // =====================================================
        // LOCATION
        // =====================================================

        if (!formData.location.trim()) {

            showPopup(
                "error",
                "Location Required",
                "Please enter the job location."
            );

            return;
        }

        // =====================================================
        // JOB TYPE
        // =====================================================

        if (!formData.jobType) {

            showPopup(
                "error",
                "Job Type Required",
                "Please select a job type."
            );

            return;
        }

        // =====================================================
        // WORK MODE
        // =====================================================

        if (!formData.workMode) {

            showPopup(
                "error",
                "Work Mode Required",
                "Please select a work mode."
            );

            return;
        }

        // =====================================================
        // EXPERIENCE TYPE
        // =====================================================

        if (!formData.experienceType) {

            showPopup(
                "error",
                "Experience Required",
                "Please select Fresher or Experienced."
            );

            return;
        }

        // =====================================================
        // TOKEN
        // =====================================================

        const token =
            localStorage.getItem("jc_token");

        if (!token) {

            showPopup(
                "error",
                "Login Required",
                "Please log in as an employer before posting a job."
            );

            return;
        }

        // =====================================================
        // EXPERIENCE
        // =====================================================

        let minimumExperience =
            formData.minExperience === ""
                ? null
                : Number(
                    formData.minExperience
                );

        let maximumExperience =
            formData.maxExperience === ""
                ? null
                : Number(
                    formData.maxExperience
                );

        // =====================================================
        // FRESHER
        // =====================================================

        if (
            formData.experienceType ===
            "fresher"
        ) {

            minimumExperience = 0;
            maximumExperience = 0;
        }

        // =====================================================
        // EXPERIENCED
        // =====================================================

        if (
            formData.experienceType ===
            "experienced"
        ) {

            if (
                minimumExperience === null
            ) {

                showPopup(
                    "error",
                    "Minimum Experience Required",
                    "Please enter the minimum years of experience."
                );

                return;
            }

            if (
                maximumExperience === null
            ) {

                showPopup(
                    "error",
                    "Maximum Experience Required",
                    "Please enter the maximum years of experience."
                );

                return;
            }

            if (
                minimumExperience < 0 ||
                maximumExperience < 0
            ) {

                showPopup(
                    "error",
                    "Invalid Experience",
                    "Experience cannot be negative."
                );

                return;
            }

            if (
                minimumExperience >
                maximumExperience
            ) {

                showPopup(
                    "error",
                    "Invalid Experience",
                    "Minimum experience cannot be greater than maximum experience."
                );

                return;
            }
        }

        // =====================================================
        // BACKEND EXPERIENCE CATEGORY
        // =====================================================

        const backendExperience =
            getBackendExperience();

        if (!backendExperience) {

            showPopup(
                "error",
                "Invalid Experience",
                "Please enter a valid experience range: 0-2, 2-5, or 5+ years."
            );

            return;
        }

        // =====================================================
        // SALARY
        // =====================================================

        const salaryMinimum =
            formData.salaryMin === ""
                ? null
                : Number(
                    formData.salaryMin
                );

        const salaryMaximum =
            formData.salaryMax === ""
                ? null
                : Number(
                    formData.salaryMax
                );

        // =====================================================
        // SALARY NEGATIVE CHECK
        // =====================================================

        if (
            salaryMinimum !== null &&
            salaryMinimum < 0
        ) {

            showPopup(
                "error",
                "Invalid Salary",
                "Minimum salary cannot be negative."
            );

            return;
        }

        if (
            salaryMaximum !== null &&
            salaryMaximum < 0
        ) {

            showPopup(
                "error",
                "Invalid Salary",
                "Maximum salary cannot be negative."
            );

            return;
        }

        // =====================================================
        // SALARY RANGE CHECK
        // =====================================================

        if (
            salaryMinimum !== null &&
            salaryMaximum !== null &&
            salaryMinimum >
            salaryMaximum
        ) {

            showPopup(
                "error",
                "Invalid Salary",
                "Minimum salary cannot be greater than maximum salary."
            );

            return;
        }

        // =====================================================
        // JOB DATA
        // =====================================================
        //
        // is_disability_job:
        //
        // true  -> Disability persons only
        // false -> Normal job, everyone can apply
        //
        // =====================================================

        const jobData = {

            title:
                formData.title.trim(),

            description:
                formData.description.trim(),

            skills:
                skills.join(", "),

            location:
                formData.location.trim(),

            job_type:
                formData.jobType,

            work_mode:
                formData.workMode,

            is_disability_job:
                formData.isDisabilityJob,

            experience:
                backendExperience,

            minimum_experience:
                minimumExperience,

            maximum_experience:
                maximumExperience,

            education_details:
                formData.education.trim(),

            roles_responsibilities:
                responsibilities
                    .split("\n")
                    .map((item) =>
                        item.trim()
                    )
                    .filter(Boolean)
                    .join("\n"),

            key_features:
                features
                    .split("\n")
                    .map((item) =>
                        item.trim()
                    )
                    .filter(Boolean)
                    .join("\n"),

            salary_min:
                salaryMinimum,

            salary_max:
                salaryMaximum,
        };

        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "POSTING JOB DATA:",
            jobData
        );

        console.log(
            "DISABILITY PERSONS ONLY:",
            formData.isDisabilityJob
        );

        // =====================================================
        // API REQUEST
        // =====================================================

        try {

            setLoading(true);

            const response =
                await fetch(
                    `${API_BASE}/auth/employer/jobs/`,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify(
                                jobData
                            ),
                    }
                );

            // =================================================
            // RESPONSE
            // =================================================

            const result =
                await response
                    .json()
                    .catch(() => ({}));

            console.log(
                "POST JOB RESPONSE:",
                result
            );

            // =================================================
            // ERROR
            // =================================================

            if (!response.ok) {

                let errorMessage = "";

                // ---------------------------------------------
                // 403
                // ---------------------------------------------

                if (
                    response.status === 403
                ) {

                    const approvalStatus =
                        (
                            result.approval_status ||
                            ""
                        )
                            .toLowerCase()
                            .trim();

                    if (
                        approvalStatus ===
                        "pending"
                    ) {

                        errorMessage =
                            "Your employer profile is currently pending admin verification. You can post jobs only after your profile is approved.";

                    } else if (
                        approvalStatus ===
                        "rejected"
                    ) {

                        errorMessage =
                            "Your employer profile was rejected. Please update your profile and submit it again for verification.";

                    } else if (
                        result.profile_completed ===
                        false
                    ) {

                        errorMessage =
                            "Please complete your employer profile before posting a job.";

                    } else {

                        errorMessage =
                            result.message ||
                            result.detail ||
                            "You are not allowed to post a job.";
                    }
                }

                // ---------------------------------------------
                // 400
                // ---------------------------------------------

                if (
                    response.status === 400
                ) {

                    if (result.errors) {

                        errorMessage =
                            formatValidationErrors(
                                result.errors
                            );

                    } else {

                        errorMessage =
                            formatValidationErrors(
                                result
                            );
                    }

                    if (!errorMessage) {

                        errorMessage =
                            result.message ||
                            "Please check the job details and try again.";
                    }
                }

                // ---------------------------------------------
                // OTHER ERRORS
                // ---------------------------------------------

                if (!errorMessage) {

                    errorMessage =
                        result.detail ||
                        result.message ||
                        "Unable to save the job. Please try again.";
                }

                showPopup(
                    "error",

                    response.status === 403
                        ? "Job Posting Not Allowed"
                        : "Unable to Save Job",

                    errorMessage
                );

                return;
            }

            // =================================================
            // SUCCESS
            // =================================================

            showPopup(
                "success",
                "Job Published",
                formData.isDisabilityJob
                    ? "Your job for disability persons only has been published successfully."
                    : "Your job has been published successfully."
            );

            // =================================================
            // GO TO MY JOBS
            // =================================================

            setTimeout(() => {

                navigate(
                    "/employer/jobs"
                );

            }, 1500);

        } catch (error) {

            console.error(
                "POST JOB ERROR:",
                error
            );

            showPopup(
                "error",
                "Something Went Wrong",
                error.message ||
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);
        }
    }

    // =========================================================
    // POPUP COMPONENT
    // =========================================================

    function Popup() {

        if (!popup.show) {
            return null;
        }

        return (

            <div
                className="job-popup-overlay"
                onClick={closePopup}
            >

                <div
                    className={`job-popup-card ${popup.type}`}
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                >

                    <div className="job-popup-icon">

                        {popup.type === "success"
                            ? "✓"
                            : "!"}

                    </div>

                    <h2>
                        {popup.title}
                    </h2>

                    <p
                        style={{
                            whiteSpace:
                                "pre-line",
                        }}
                    >
                        {popup.message}
                    </p>

                    <button
                        type="button"
                        className="job-popup-button"
                        onClick={closePopup}
                    >
                        OK
                    </button>

                </div>

            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="post-job-page">

            <Popup />

            <main className="post-job-main">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="post-job-header">

                    <h1>
                        Post a job
                    </h1>

                    <p>
                        Fill in each section — candidates
                        see this exactly as laid out below.
                    </p>

                </section>


                {/* =================================================
                    FORM CARD
                ================================================= */}

                <section className="post-job-card">


                    {/* =================================================
                        JOB TITLE
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Job title
                        </label>

                        <input
                            type="text"
                            name="title"
                            value={
                                formData.title
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g. Senior Frontend Engineer"
                        />

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={
                                formData.description
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Give candidates a short overview of the role, the team, and what success looks like in this position."
                            rows="5"
                        />

                    </div>


                    {/* =================================================
                        SKILLS
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Skills
                        </label>

                        <div className="skill-input-row">

                            <input
                                type="text"
                                value={
                                    skillInput
                                }
                                onChange={(e) =>
                                    setSkillInput(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {

                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {

                                        e.preventDefault();

                                        addSkill();
                                    }
                                }}
                                placeholder="e.g. React"
                            />

                            <button
                                type="button"
                                className="add-skill-button"
                                onClick={
                                    addSkill
                                }
                            >
                                + Add skill
                            </button>

                        </div>


                        {/* SELECTED SKILLS */}

                        <div className="selected-skills">

                            {skills.map(
                                (skill) => (

                                    <span
                                        key={
                                            skill
                                        }
                                        className="skill-chip"
                                    >

                                        {skill}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeSkill(
                                                    skill
                                                )
                                            }
                                        >
                                            ×
                                        </button>

                                    </span>

                                )
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        RESPONSIBILITIES
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Roles & responsibilities
                        </label>

                        <p className="field-help">
                            One responsibility per line.
                        </p>

                        <textarea
                            value={
                                responsibilities
                            }
                            onChange={(e) =>
                                setResponsibilities(
                                    e.target.value
                                )
                            }
                            placeholder={
                                "Own end-to-end delivery of new features\nReview pull requests and mentor junior engineers\nCollaborate with design and product on requirements"
                            }
                            rows="6"
                        />

                    </div>


                    {/* =================================================
                        KEY FEATURES
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Key features / what this role offers
                        </label>

                        <p className="field-help">
                            One feature/perk per line.
                        </p>

                        <textarea
                            value={
                                features
                            }
                            onChange={(e) =>
                                setFeatures(
                                    e.target.value
                                )
                            }
                            placeholder={
                                "Remote-friendly with quarterly team meetups\nLearning & development budget\nESOPs after one year"
                            }
                            rows="6"
                        />

                    </div>


                    {/* =================================================
                        LOCATION
                    ================================================= */}

                    <div className="post-job-section">

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
                            placeholder="e.g. Chennai, Tamil Nadu"
                        />

                    </div>


                    {/* =================================================
                        JOB TYPE
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Job type
                        </label>

                        <select
                            name="jobType"
                            value={
                                formData.jobType
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select job type
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


                    {/* =================================================
                        WORK MODE
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Work mode
                        </label>

                        <select
                            name="workMode"
                            value={
                                formData.workMode
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select work mode
                            </option>

                            <option value="onsite">
                                On-site
                            </option>

                            <option value="hybrid">
                                Hybrid
                            </option>

                            <option value="remote">
                                Remote
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        CANDIDATE ELIGIBILITY
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Candidate eligibility
                        </label>

                        <p className="field-help">
                            Choose whether this job is available
                            to everyone or only to disability persons.
                        </p>

                        <label
                            className="radio-option"
                            style={{
                                marginTop: "12px",
                            }}
                        >

                            <input
                                type="checkbox"
                                checked={
                                    formData.isDisabilityJob
                                }
                                onChange={
                                    handleDisabilityJobChange
                                }
                            />

                            <span>
                                Disability persons only
                            </span>

                        </label>

                        <p className="field-help">

                            When checked, only jobseekers whose
                            profile indicates a disability can apply.
                            Normal jobseekers will not be allowed to apply.

                        </p>

                    </div>


                    {/* =================================================
                        EXPERIENCE
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Experience
                        </label>

                        <div className="experience-options">

                            <label className="radio-option">

                                <input
                                    type="radio"
                                    name="experienceType"
                                    value="fresher"
                                    checked={
                                        formData.experienceType ===
                                        "fresher"
                                    }
                                    onChange={
                                        handleExperienceTypeChange
                                    }
                                />

                                <span>
                                    Fresher
                                </span>

                            </label>


                            <label className="radio-option">

                                <input
                                    type="radio"
                                    name="experienceType"
                                    value="experienced"
                                    checked={
                                        formData.experienceType ===
                                        "experienced"
                                    }
                                    onChange={
                                        handleExperienceTypeChange
                                    }
                                />

                                <span>
                                    Experienced
                                </span>

                            </label>

                        </div>


                        {/* EXPERIENCED INPUTS */}

                        {formData.experienceType ===
                            "experienced" && (

                                <div className="experience-inputs">

                                    <div>

                                        <label>
                                            Minimum years
                                        </label>

                                        <input
                                            type="number"
                                            name="minExperience"
                                            min="0"
                                            value={
                                                formData.minExperience
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. 2"
                                        />

                                    </div>


                                    <div>

                                        <label>
                                            Maximum years
                                        </label>

                                        <input
                                            type="number"
                                            name="maxExperience"
                                            min="0"
                                            value={
                                                formData.maxExperience
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. 5"
                                        />

                                    </div>

                                </div>

                            )}


                        <p className="field-help">

                            Backend experience categories:
                            0-2 years, 2-5 years, or 5+ years.

                        </p>

                    </div>


                    {/* =================================================
                        SALARY
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Salary details
                        </label>

                        <p className="field-help">

                            Enter the minimum and maximum
                            annual salary.

                        </p>

                        <div className="salary-inputs">


                            {/* MINIMUM */}

                            <div className="salary-input-group">

                                <label>
                                    Minimum salary (₹ per year)
                                </label>

                                <input
                                    type="number"
                                    name="salaryMin"
                                    min="0"
                                    value={
                                        formData.salaryMin
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 500000"
                                />

                            </div>


                            {/* MAXIMUM */}

                            <div className="salary-input-group">

                                <label>
                                    Maximum salary (₹ per year)
                                </label>

                                <input
                                    type="number"
                                    name="salaryMax"
                                    min="0"
                                    value={
                                        formData.salaryMax
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 1000000"
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        EDUCATION
                    ================================================= */}

                    <div className="post-job-section">

                        <label>
                            Education details
                        </label>

                        <input
                            type="text"
                            name="education"
                            value={
                                formData.education
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g. B.Tech / B.E. in Computer Science or related field"
                        />

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="post-job-actions">

                        <button
                            type="button"
                            className="cancel-job-button"
                            disabled={loading}
                            onClick={() =>
                                navigate(
                                    "/employer/jobs"
                                )
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            className="publish-job-button"
                            disabled={loading}
                            onClick={saveJob}
                        >

                            {loading
                                ? "Publishing..."
                                : "Publish job"}

                        </button>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default PostJob;