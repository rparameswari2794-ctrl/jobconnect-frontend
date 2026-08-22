import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000/api/auth/jobseeker/";

function FindJobs() {
    const [jobs, setJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    // Verified ON by default
    const [verifiedOnly, setVerifiedOnly] = useState(true);

    // ONLY WORK MODE FILTER
    const [workMode, setWorkMode] = useState("");

    // Applied job IDs
    const [appliedJobIds, setAppliedJobIds] = useState([]);

    // Popup message
    const [popupMessage, setPopupMessage] = useState("");

    // Selected job
    const [selectedJob, setSelectedJob] = useState(null);


    /* =====================================================
       LOAD DATA
    ===================================================== */

    useEffect(() => {
        fetchJobs();
        fetchMyApplications();
    }, []);


    /* =====================================================
       AUTH
    ===================================================== */

    function getAuthHeaders() {
        const token = localStorage.getItem("jc_token");

        return token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {};
    }


    /* =====================================================
       LOAD JOBS
    ===================================================== */

    async function fetchJobs() {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            /*
             * VERIFIED FILTER
             *
             * Backend receives:
             *
             * ?verified=true
             */

            if (verifiedOnly) {
                params.set("verified", "true");
            }

            const res = await fetch(
                `${API_BASE}jobs/?${params.toString()}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to load jobs");
            }

            const data = await res.json();

            let jobData = [];

            if (Array.isArray(data)) {
                jobData = data;
            } else if (Array.isArray(data.results)) {
                jobData = data.results;
            }

            console.log("Jobs from API:", jobData);

            setAllJobs(jobData);
            setJobs(jobData);
        } catch (err) {
            console.error("Fetch jobs error:", err);

            setError(
                "Could not load jobs right now. Please try again."
            );

            setJobs([]);
            setAllJobs([]);
        } finally {
            setLoading(false);
        }
    }


    /* =====================================================
       LOAD MY APPLICATIONS
    ===================================================== */

    async function fetchMyApplications() {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}applications/`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
            );

            if (!res.ok) {
                return;
            }

            const data = await res.json();

            const applications = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                ? data.results
                : [];

            const ids = applications
                .map((application) => application.job)
                .filter(Boolean);

            setAppliedJobIds(ids);
        } catch (err) {
            console.error(
                "Could not load applications:",
                err
            );
        }
    }


    /* =====================================================
       POPUP MESSAGE
    ===================================================== */

    function showPopup(message) {
        setPopupMessage(message);

        setTimeout(() => {
            setPopupMessage("");
        }, 3000);
    }


    /* =====================================================
       VIEW JOB DETAILS
    ===================================================== */

    function handleViewJob(job) {
        setSelectedJob(job);
    }


    /* =====================================================
       CLOSE JOB DETAILS
    ===================================================== */

    function closeJobDetails() {
        setSelectedJob(null);
    }


    /* =====================================================
       APPLY JOB
    ===================================================== */

    async function handleApply(jobId) {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            showPopup(
                "Please log in as a job seeker to apply."
            );

            return;
        }

        if (appliedJobIds.includes(jobId)) {
            showPopup(
                "You have already applied for this job."
            );

            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}jobs/${jobId}/apply/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                }
            );

            const data =
                await res.json().catch(() => ({}));

            if (!res.ok) {
                showPopup(
                    data.message ||
                        data.detail ||
                        "Could not submit application."
                );

                return;
            }

            setAppliedJobIds((previousIds) => [
                ...previousIds,
                jobId,
            ]);

            showPopup(
                data.message ||
                    "Job application submitted successfully."
            );
        } catch (err) {
            console.error(err);

            showPopup(
                "Could not submit application. Please try again."
            );
        }
    }


    /* =====================================================
       WORK MODE NORMALIZATION
    ===================================================== */

    function normalizeWorkMode(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[-_]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    /* =====================================================
       CHECK WORK MODE
    ===================================================== */

    function matchesWorkMode(job, selectedMode) {
        if (!selectedMode) {
            return true;
        }

        /*
         * IMPORTANT:
         *
         * Work mode comes from:
         *
         * job.work_mode
         */

        const mode = normalizeWorkMode(
            job.work_mode
        );

        console.log(
            "Job:",
            job.title,
            "work_mode:",
            job.work_mode,
            "normalized:",
            mode
        );

        /* REMOTE */

        if (selectedMode === "remote") {
            return mode === "remote";
        }

        /* HYBRID */

        if (selectedMode === "hybrid") {
            return mode === "hybrid";
        }

        /* ON-SITE */

        if (selectedMode === "on-site") {
            return (
                mode === "on site" ||
                mode === "onsite"
            );
        }

        return false;
    }


    /* =====================================================
       SEARCH + WORK MODE FILTER
    ===================================================== */

    function applyFilters(
        searchText = search,
        selectedMode = workMode
    ) {
        let filteredJobs = [...allJobs];

        /* =================================================
           SEARCH
        ================================================= */

        const searchValue = searchText
            .trim()
            .toLowerCase();

        if (searchValue) {
            filteredJobs = filteredJobs.filter(
                (job) => {
                    const title =
                        job.title || "";

                    const company =
                        job.employer_name ||
                        job.company ||
                        "";

                    const skills =
                        job.skills || "";

                    const description =
                        job.description || "";

                    const location =
                        job.location || "";

                    const workModeValue =
                        job.work_mode || "";

                    const features =
                        job.key_features ||
                        job.features ||
                        "";

                    const education =
                        job.education_details ||
                        job.education ||
                        "";

                    const responsibilities =
                        job.roles_responsibilities ||
                        job.responsibilities ||
                        "";

                    const combinedText = `
                        ${title}
                        ${company}
                        ${skills}
                        ${description}
                        ${location}
                        ${workModeValue}
                        ${features}
                        ${education}
                        ${responsibilities}
                    `.toLowerCase();

                    return combinedText.includes(
                        searchValue
                    );
                }
            );
        }


        /* =================================================
           WORK MODE
        ================================================= */

        if (selectedMode) {
            filteredJobs =
                filteredJobs.filter(
                    (job) =>
                        matchesWorkMode(
                            job,
                            selectedMode
                        )
                );
        }


        setJobs(filteredJobs);
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function handleSearch(e) {
        e.preventDefault();

        applyFilters(
            search,
            workMode
        );
    }


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    function handleSearchChange(e) {
        const value = e.target.value;

        setSearch(value);

        /*
         * When search is cleared,
         * immediately apply work-mode filter.
         */

        if (value.trim() === "") {
            applyFilters(
                "",
                workMode
            );
        }
    }


    /* =====================================================
       ALL ROLES
    ===================================================== */

    function handleAllRoles() {
        setWorkMode("");

        /*
         * Keep search active.
         */

        applyFilters(
            search,
            ""
        );
    }


    /* =====================================================
       REMOTE
    ===================================================== */

    function handleRemote() {
        const newMode =
            workMode === "remote"
                ? ""
                : "remote";

        setWorkMode(newMode);

        applyFilters(
            search,
            newMode
        );
    }


    /* =====================================================
       HYBRID
    ===================================================== */

    function handleHybrid() {
        const newMode =
            workMode === "hybrid"
                ? ""
                : "hybrid";

        setWorkMode(newMode);

        applyFilters(
            search,
            newMode
        );
    }


    /* =====================================================
       ON-SITE
    ===================================================== */

    function handleOnSite() {
        const newMode =
            workMode === "on-site"
                ? ""
                : "on-site";

        setWorkMode(newMode);

        applyFilters(
            search,
            newMode
        );
    }


    /* =====================================================
       VERIFIED FILTER
    ===================================================== */

    function handleVerifiedChange(
        checked
    ) {
        setVerifiedOnly(checked);

        /*
         * Reload jobs from backend.
         */

        setTimeout(() => {
            fetchJobs();
        }, 0);
    }


    /* =====================================================
       FORMAT JOB TYPE
    ===================================================== */

    function getJobType(job) {
        if (job.job_type_display) {
            return job.job_type_display;
        }

        const types = {
            full_time: "Full Time",
            part_time: "Part Time",
            contract: "Contract",
            internship: "Internship",
        };

        return (
            types[job.job_type] ||
            job.job_type ||
            "Not specified"
        );
    }


    /* =====================================================
       FORMAT EXPERIENCE
    ===================================================== */

    function getExperience(job) {
        if (job.experience_display) {
            return job.experience_display;
        }

        const experiences = {
            fresher: "Fresher",
            "0-2": "0-2 Years",
            "2-5": "2-5 Years",
            "5+": "5+ Years",
        };

        return (
            experiences[job.experience] ||
            job.experience ||
            "Not specified"
        );
    }


    /* =====================================================
       FORMAT SALARY
    ===================================================== */

    function getSalary(job) {
        const min = job.salary_min;
        const max = job.salary_max;

        if (min && max) {
            return `₹${Number(
                min
            ).toLocaleString(
                "en-IN"
            )} - ₹${Number(
                max
            ).toLocaleString(
                "en-IN"
            )}`;
        }

        if (min) {
            return `₹${Number(
                min
            ).toLocaleString(
                "en-IN"
            )}+`;
        }

        if (max) {
            return `Up to ₹${Number(
                max
            ).toLocaleString(
                "en-IN"
            )}`;
        }

        return "Not specified";
    }


    /* =====================================================
       FORMAT LIST
    ===================================================== */

    function formatList(value) {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value
                .map((item) =>
                    String(item).trim()
                )
                .filter(Boolean);
        }

        if (typeof value === "string") {
            return value
                .split(/\r?\n|,/)
                .map((item) =>
                    item.trim()
                )
                .filter(Boolean);
        }

        return [];
    }


    /* =====================================================
       SKILLS
    ===================================================== */

    function getSkills(job) {
        return formatList(
            job.skills
        );
    }


    /* =====================================================
       RESPONSIBILITIES
    ===================================================== */

    function getResponsibilities(job) {
        return formatList(
            job.roles_responsibilities ||
                job.responsibilities
        );
    }


    /* =====================================================
       KEY FEATURES
    ===================================================== */

    function getKeyFeatures(job) {
        return formatList(
            job.key_features ||
                job.features
        );
    }


    /* =====================================================
       EDUCATION
    ===================================================== */

    function getEducationDetails(job) {
        return formatList(
            job.education_details ||
                job.education
        );
    }


    /* =====================================================
       RETURN
    ===================================================== */

    return (
        <div className="find-jobs-page">

            {/* =================================================
                POPUP MESSAGE
            ================================================= */}

            {popupMessage && (
                <div className="apply-popup">

                    <div className="apply-popup-content">

                        <span>
                            {popupMessage}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPopupMessage("")
                            }
                        >
                            ×
                        </button>

                    </div>

                </div>
            )}


            {/* =================================================
                JOB DETAILS MODAL
            ================================================= */}

            {selectedJob && (
                <div
                    className="job-details-overlay"
                    onClick={
                        closeJobDetails
                    }
                >

                    <div
                        className="job-details-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="job-details-header">

                            <div>

                                <h2>
                                    {
                                        selectedJob.title
                                    }
                                </h2>

                                <p className="job-details-company">
                                    {
                                        selectedJob.employer_name ||
                                        selectedJob.company ||
                                        "Company not specified"
                                    }
                                </p>

                            </div>

                            <button
                                type="button"
                                className="job-details-close"
                                onClick={
                                    closeJobDetails
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* BASIC INFORMATION */}

                        <div className="job-details-basic">

                            <div className="job-detail-item">

                                <strong>
                                    Location
                                </strong>

                                <span>
                                    {
                                        selectedJob.location ||
                                        "Not specified"
                                    }
                                </span>

                            </div>


                            <div className="job-detail-item">

                                <strong>
                                    Work Mode
                                </strong>

                                <span>
                                    {
                                        selectedJob.work_mode ||
                                        "Not specified"
                                    }
                                </span>

                            </div>


                            <div className="job-detail-item">

                                <strong>
                                    Job Type
                                </strong>

                                <span>
                                    {
                                        getJobType(
                                            selectedJob
                                        )
                                    }
                                </span>

                            </div>


                            <div className="job-detail-item">

                                <strong>
                                    Experience
                                </strong>

                                <span>
                                    {
                                        getExperience(
                                            selectedJob
                                        )
                                    }
                                </span>

                            </div>


                            <div className="job-detail-item">

                                <strong>
                                    Salary
                                </strong>

                                <span>
                                    {
                                        getSalary(
                                            selectedJob
                                        )
                                    }
                                </span>

                            </div>

                        </div>


                        {/* DESCRIPTION */}

                        <section className="job-details-section">

                            <h3>
                                Description
                            </h3>

                            <p className="job-description-full">
                                {
                                    selectedJob.description ||
                                    "No description provided."
                                }
                            </p>

                        </section>


                        {/* SKILLS */}

                        <section className="job-details-section">

                            <h3>
                                Skills
                            </h3>

                            {getSkills(
                                selectedJob
                            ).length > 0 ? (

                                <div className="job-details-tags">

                                    {getSkills(
                                        selectedJob
                                    ).map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={`${skill}-${index}`}
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="job-details-empty">
                                    No skills specified.
                                </p>

                            )}

                        </section>


                        {/* RESPONSIBILITIES */}

                        <section className="job-details-section">

                            <h3>
                                Roles &
                                Responsibilities
                            </h3>

                            {getResponsibilities(
                                selectedJob
                            ).length > 0 ? (

                                <ul className="job-details-list">

                                    {getResponsibilities(
                                        selectedJob
                                    ).map(
                                        (
                                            responsibility,
                                            index
                                        ) => (
                                            <li
                                                key={`responsibility-${index}`}
                                            >
                                                {
                                                    responsibility
                                                }
                                            </li>
                                        )
                                    )}

                                </ul>

                            ) : (

                                <p className="job-details-empty">
                                    No roles &
                                    responsibilities
                                    specified.
                                </p>

                            )}

                        </section>


                        {/* KEY FEATURES */}

                        <section className="job-details-section">

                            <h3>
                                Key Features /
                                What This Role Offers
                            </h3>

                            {getKeyFeatures(
                                selectedJob
                            ).length > 0 ? (

                                <ul className="job-details-list">

                                    {getKeyFeatures(
                                        selectedJob
                                    ).map(
                                        (
                                            feature,
                                            index
                                        ) => (
                                            <li
                                                key={`feature-${index}`}
                                            >
                                                {
                                                    feature
                                                }
                                            </li>
                                        )
                                    )}

                                </ul>

                            ) : (

                                <p className="job-details-empty">
                                    No key features
                                    specified.
                                </p>

                            )}

                        </section>


                        {/* EDUCATION */}

                        <section className="job-details-section">

                            <h3>
                                Education Details
                            </h3>

                            {getEducationDetails(
                                selectedJob
                            ).length > 0 ? (

                                <ul className="job-details-list">

                                    {getEducationDetails(
                                        selectedJob
                                    ).map(
                                        (
                                            education,
                                            index
                                        ) => (
                                            <li
                                                key={`education-${index}`}
                                            >
                                                {
                                                    education
                                                }
                                            </li>
                                        )
                                    )}

                                </ul>

                            ) : (

                                <p className="job-details-empty">
                                    No education
                                    details specified.
                                </p>

                            )}

                        </section>


                        {/* ACTIONS */}

                        <div className="job-details-actions">

                            <button
                                type="button"
                                className="job-details-close-button"
                                onClick={
                                    closeJobDetails
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="job-details-apply-button"
                                disabled={appliedJobIds.includes(
                                    selectedJob.id
                                )}
                                onClick={() =>
                                    handleApply(
                                        selectedJob.id
                                    )
                                }
                            >
                                {appliedJobIds.includes(
                                    selectedJob.id
                                )
                                    ? "Applied ✓"
                                    : "Apply Now"}
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="find-jobs-main">


                {/* HEADER */}

                <section className="find-jobs-header">

                    <h1>
                        Find jobs
                    </h1>

                    <p>
                        {loading
                            ? "Loading roles..."
                            : `${jobs.length} open role${
                                  jobs.length === 1
                                      ? ""
                                      : "s"
                              } match your profile`}
                    </p>

                </section>


                {/* SEARCH */}

                <form
                    className="job-search-section"
                    onSubmit={
                        handleSearch
                    }
                >

                    <input
                        type="text"
                        className="job-search-input"
                        placeholder="Search by title, company, or skill"
                        value={search}
                        onChange={
                            handleSearchChange
                        }
                    />

                    <button
                        type="submit"
                        className="job-search-button"
                    >
                        Search
                    </button>

                </form>


                {/* FILTERS */}

                <section className="job-filter-section">


                    {/* VERIFIED */}

                    <div className="verified-filter">

                        <span>
                            Verified employers only
                        </span>

                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={
                                    verifiedOnly
                                }
                                onChange={(e) =>
                                    handleVerifiedChange(
                                        e.target.checked
                                    )
                                }
                            />

                            <span className="slider"></span>

                        </label>

                    </div>


                    {/* ALL ROLES */}

                    <button
                        type="button"
                        className={
                            workMode === ""
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={
                            handleAllRoles
                        }
                    >
                        All roles
                    </button>


                    {/* REMOTE */}

                    <button
                        type="button"
                        className={
                            workMode === "remote"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={
                            handleRemote
                        }
                    >
                        Remote
                    </button>


                    {/* HYBRID */}

                    <button
                        type="button"
                        className={
                            workMode === "hybrid"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={
                            handleHybrid
                        }
                    >
                        Hybrid
                    </button>


                    {/* ON-SITE */}

                    <button
                        type="button"
                        className={
                            workMode === "on-site"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={
                            handleOnSite
                        }
                    >
                        On-site
                    </button>

                </section>


                {/* JOB LIST */}

                <section className="job-list">

                    {loading && (
                        <p className="job-list-status">
                            Loading jobs...
                        </p>
                    )}


                    {!loading && error && (
                        <p className="job-list-status job-list-error">
                            {error}
                        </p>
                    )}


                    {!loading &&
                        !error &&
                        jobs.length === 0 && (
                            <p className="job-list-status">
                                No jobs found matching
                                your search or
                                filters.
                            </p>
                        )}


                    {!loading &&
                        !error &&
                        jobs.map((job) => {

                            const alreadyApplied =
                                appliedJobIds.includes(
                                    job.id
                                );

                            return (
                                <article
                                    key={job.id}
                                    className="job-card"
                                >

                                    {/* JOB CONTENT */}

                                    <div className="job-card-content">

                                        <h2>
                                            {
                                                job.title
                                            }
                                        </h2>


                                        <p className="job-company">

                                            {
                                                job.employer_name ||
                                                job.company ||
                                                "Company not specified"
                                            }

                                            {" · "}

                                            {
                                                job.location ||
                                                "Location not specified"
                                            }

                                            {" · "}

                                            {
                                                job.work_mode ||
                                                "Work mode not specified"
                                            }

                                        </p>


                                        {/* WORK MODE */}

                                        <div className="job-work-mode">

                                            {
                                                job.work_mode ||
                                                "Not specified"
                                            }

                                        </div>


                                        {/* SKILLS */}

                                        <div className="job-tags">

                                            {getSkills(
                                                job
                                            ).map(
                                                (
                                                    skill,
                                                    index
                                                ) => (
                                                    <span
                                                        key={`${skill}-${index}`}
                                                    >
                                                        {
                                                            skill
                                                        }
                                                    </span>
                                                )
                                            )}

                                        </div>

                                    </div>


                                    {/* JOB ACTION */}

                                    <div className="job-card-action">

                                        {job.employer_verified ? (

                                            <>

                                                <span className="verified-badge">
                                                    ✓ VERIFIED
                                                </span>


                                                <button
                                                    type="button"
                                                    className="job-view-button"
                                                    onClick={() =>
                                                        handleViewJob(
                                                            job
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>


                                                <button
                                                    type="button"
                                                    className="job-apply-button"
                                                    onClick={() =>
                                                        handleApply(
                                                            job.id
                                                        )
                                                    }
                                                    disabled={
                                                        alreadyApplied
                                                    }
                                                >
                                                    {alreadyApplied
                                                        ? "Applied ✓"
                                                        : "Apply"}
                                                </button>

                                            </>

                                        ) : (

                                            <span className="pending-badge">
                                                PENDING
                                            </span>

                                        )}

                                    </div>

                                </article>
                            );
                        })}

                </section>

            </main>

        </div>
    );
}

export default FindJobs;