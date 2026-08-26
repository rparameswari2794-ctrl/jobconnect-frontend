import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;

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
       JOB INSIGHTS CHART DATA
    ===================================================== */

    function getJobInsights() {
        const remote = allJobs.filter(
            (job) =>
                normalizeWorkMode(
                    job.work_mode
                ) === "remote"
        ).length;

        const hybrid = allJobs.filter(
            (job) =>
                normalizeWorkMode(
                    job.work_mode
                ) === "hybrid"
        ).length;

        const onSite = allJobs.filter(
            (job) => {
                const mode =
                    normalizeWorkMode(
                        job.work_mode
                    );

                return (
                    mode === "on site" ||
                    mode === "onsite"
                );
            }
        ).length;

        return [
            {
                mode: "Remote",
                jobs: remote,
            },
            {
                mode: "Hybrid",
                jobs: hybrid,
            },
            {
                mode: "On-site",
                jobs: onSite,
            },
        ];
    }


    /* =====================================================
       RETURN
    ===================================================== */

    return (
        <div className="find-jobs-page">

            {/* =================================================
                PAGE STYLES — Job Connect sage/forest theme.
                Fully self-contained; no external CSS file needed.
            ================================================= */}

            <style>{`

                /* =============================================
                   TOKENS + PAGE BASE
                ============================================= */

                .find-jobs-page {
                    --navy: #1F3326;
                    --navy3: #2F5233;
                    --cream: #F2F5EF;
                    --lime: #C7E36B;
                    --green: #2F6B45;
                    --green-bg: #E7F2E0;
                    --amber: #a9700f;
                    --amber-bg: #fbf0da;
                    --ink: #16241C;
                    --muted: #66786C;
                    --line: #E4E9DF;
                    --red: #a8402a;
                    --red-bg: #fbe9e4;

                    font-family: 'Inter', sans-serif;
                    background: var(--cream);
                    color: var(--ink);
                    min-height: 100vh;
                    box-sizing: border-box;
                }

                .find-jobs-page * {
                    box-sizing: border-box;
                }

                .find-jobs-main {
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: 32px 24px 60px;
                }


                /* =============================================
                   HEADER
                ============================================= */

                .find-jobs-header h1 {
                    font-size: 27px;
                    font-weight: 700;
                    margin: 0 0 4px;
                    color: var(--ink);
                }

                .find-jobs-header p {
                    font-size: 13.5px;
                    color: var(--muted);
                    margin: 0 0 22px;
                }


                /* =============================================
                   SEARCH
                ============================================= */

                .job-search-section {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .job-search-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid var(--line);
                    border-radius: 10px;
                    font-size: 13.5px;
                    font-family: inherit;
                    background: #fff;
                    color: var(--ink);
                    outline: none;
                }

                .job-search-input:focus {
                    border-color: var(--navy3);
                }

                .job-search-button {
                    padding: 12px 24px;
                    background: var(--navy3);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 13.5px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                }

                .job-search-button:hover {
                    background: var(--navy);
                }


                /* =============================================
                   FILTERS
                ============================================= */

                .job-filter-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 26px;
                }

                .verified-filter {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #fff;
                    border: 1px solid var(--line);
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: var(--ink);
                }

                .switch {
                    position: relative;
                    display: inline-block;
                    width: 36px;
                    height: 20px;
                    flex-shrink: 0;
                }

                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    inset: 0;
                    cursor: pointer;
                    background: #d8e0d2;
                    border-radius: 20px;
                    transition: background .15s ease;
                }

                .slider::before {
                    content: "";
                    position: absolute;
                    height: 14px;
                    width: 14px;
                    left: 3px;
                    bottom: 3px;
                    background: #fff;
                    border-radius: 50%;
                    transition: transform .15s ease;
                }

                .switch input:checked + .slider {
                    background: var(--navy3);
                }

                .switch input:checked + .slider::before {
                    transform: translateX(16px);
                }

                .filter-button {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--line);
                    background: #fff;
                    color: var(--muted);
                    font-size: 12.5px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                }

                .filter-button:hover {
                    border-color: var(--navy3);
                    color: var(--ink);
                }

                .filter-button.active {
                    background: var(--navy);
                    border-color: var(--navy);
                    color: #fff;
                }


                /* =============================================
                   JOB INSIGHTS
                ============================================= */

                .job-insights-section {
                    background: #fff;
                    border: 1px solid var(--line);
                    border-radius: 16px;
                    padding: 22px 24px 12px;
                    margin-bottom: 28px;
                }

                .job-insights-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .job-insights-header h2 {
                    font-size: 16.5px;
                    margin: 0 0 2px;
                    color: var(--ink);
                    font-weight: 700;
                }

                .job-insights-header p {
                    font-size: 12px;
                    color: var(--muted);
                    margin: 0;
                }

                .job-insights-total {
                    text-align: right;
                }

                .job-insights-total span {
                    display: block;
                    font-size: 10.5px;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    color: var(--muted);
                    margin-bottom: 2px;
                }

                .job-insights-total strong {
                    font-size: 22px;
                    color: var(--navy3);
                    font-weight: 700;
                }

                .job-insights-chart {
                    margin-top: 4px;
                }

                /* Recharts elements — same 'sage' palette, purely visual */

                .find-jobs-page .recharts-cartesian-grid-horizontal line,
                .find-jobs-page .recharts-cartesian-grid-vertical line {
                    stroke: var(--line);
                }

                .find-jobs-page .recharts-rectangle,
                .find-jobs-page .recharts-bar-rectangle path {
                    fill: var(--navy3) !important;
                }

                .find-jobs-page .recharts-text,
                .find-jobs-page .recharts-cartesian-axis-tick-value tspan {
                    fill: var(--muted);
                }


                /* =============================================
                   JOB LIST
                ============================================= */

                .job-list {
                    width: 100%;
                    max-width: 100%;
                    margin: 18px auto 0;
                }

                .job-list-status {
                    text-align: center;
                    color: var(--muted);
                    font-size: 13.5px;
                    padding: 44px 0;
                }

                .job-list-status.job-list-error {
                    color: var(--red);
                }

                .job-card {
                    width: 100%;
                    max-width: 100%;
                    min-height: auto;
                    padding: 14px 18px;
                    margin-bottom: 10px;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    border-radius: 10px;
                    background: #fff;
                    border: 1px solid var(--line);
                    transition: border-color .15s ease, box-shadow .15s ease;
                }

                .job-card:hover {
                    border-color: var(--navy3);
                    box-shadow: 0 8px 22px -8px rgba(22, 36, 28, 0.18);
                }


                /* =============================================
                   JOB CONTENT
                ============================================= */

                .job-card-content {
                    flex: 1;
                    min-width: 0;
                }

                .job-card-content h2 {
                    margin: 0 0 4px;
                    font-size: 17px;
                    line-height: 1.3;
                    color: var(--ink);
                    font-weight: 700;
                }

                .job-company {
                    margin: 0 0 6px;
                    font-size: 12px;
                    line-height: 1.35;
                    color: var(--muted);
                }


                /* =============================================
                   WORK MODE
                ============================================= */

                .job-work-mode {
                    display: inline-block;
                    padding: 3px 8px;
                    margin-bottom: 6px;
                    font-size: 10px;
                    line-height: 1.3;
                    border-radius: 5px;
                    background: var(--green-bg);
                    color: var(--green);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .02em;
                }


                /* =============================================
                   SKILLS
                ============================================= */

                .job-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }

                .job-tags span {
                    padding: 3px 7px;
                    font-size: 10px;
                    line-height: 1.3;
                    border-radius: 5px;
                    background: var(--cream);
                    border: 1px solid var(--line);
                    color: var(--ink);
                }


                /* =============================================
                   JOB ACTION
                ============================================= */

                .job-card-action {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    white-space: nowrap;
                }


                /* =============================================
                   VERIFIED / PENDING
                ============================================= */

                .verified-badge,
                .pending-badge {
                    padding: 4px 6px;
                    font-size: 9px;
                    line-height: 1.2;
                    border-radius: 5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .02em;
                }

                .verified-badge {
                    background: var(--green-bg);
                    color: var(--green);
                }

                .pending-badge {
                    background: var(--amber-bg);
                    color: var(--amber);
                }


                /* =============================================
                   VIEW / APPLY BUTTONS
                ============================================= */

                .job-view-button,
                .job-apply-button {
                    padding: 6px 11px;
                    font-size: 11px;
                    line-height: 1.2;
                    border-radius: 6px;
                    border: none;
                    font-family: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                .job-view-button {
                    background: var(--cream);
                    color: var(--ink);
                    border: 1px solid var(--line);
                }

                .job-view-button:hover {
                    border-color: var(--navy3);
                }

                .job-apply-button {
                    background: var(--navy3);
                    color: #fff;
                }

                .job-apply-button:hover:not(:disabled) {
                    background: var(--navy);
                }

                .job-apply-button:disabled {
                    background: var(--line);
                    color: var(--muted);
                    cursor: not-allowed;
                }


                /* =============================================
                   APPLY POPUP
                ============================================= */

                .apply-popup {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 80;
                }

                .apply-popup-content {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: var(--navy);
                    color: #fff;
                    padding: 12px 16px;
                    border-radius: 10px;
                    font-size: 13px;
                    box-shadow: 0 16px 34px -10px rgba(22, 36, 28, 0.4);
                }

                .apply-popup-content button {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 17px;
                    line-height: 1;
                    cursor: pointer;
                    opacity: .75;
                    padding: 0;
                }

                .apply-popup-content button:hover {
                    opacity: 1;
                }


                /* =============================================
                   JOB DETAILS MODAL
                ============================================= */

                .job-details-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(22, 36, 28, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 90;
                    padding: 15px;
                    box-sizing: border-box;
                }

                .job-details-modal {
                    width: min(850px, 100%);
                    max-width: 850px;
                    max-height: 88vh;
                    overflow-y: auto;
                    padding: 22px;
                    box-sizing: border-box;
                    border-radius: 14px;
                    background: #fff;
                }

                .job-details-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                    margin-bottom: 18px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--line);
                }

                .job-details-header h2 {
                    margin: 0 0 4px;
                    font-size: 20px;
                    color: var(--ink);
                    font-weight: 700;
                }

                .job-details-company {
                    margin: 0;
                    font-size: 13px;
                    color: var(--muted);
                }

                .job-details-close {
                    background: var(--cream);
                    border: none;
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;
                    border-radius: 8px;
                    font-size: 18px;
                    line-height: 1;
                    color: var(--muted);
                    cursor: pointer;
                }

                .job-details-close:hover {
                    background: var(--line);
                    color: var(--ink);
                }

                .job-details-basic {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 14px;
                    margin-bottom: 22px;
                }

                .job-detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .job-detail-item strong {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    color: var(--muted);
                    font-weight: 700;
                }

                .job-detail-item span {
                    font-size: 13.5px;
                    color: var(--ink);
                    font-weight: 600;
                }

                .job-details-section {
                    margin-bottom: 20px;
                }

                .job-details-section h3 {
                    font-size: 13.5px;
                    margin: 0 0 8px;
                    color: var(--ink);
                    font-weight: 700;
                }

                .job-description-full {
                    font-size: 13px;
                    line-height: 1.65;
                    color: var(--muted);
                    margin: 0;
                    white-space: pre-line;
                }

                .job-details-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .job-details-tags span {
                    padding: 5px 10px;
                    font-size: 11.5px;
                    border-radius: 6px;
                    background: var(--cream);
                    border: 1px solid var(--line);
                    color: var(--ink);
                }

                .job-details-list {
                    margin: 0;
                    padding-left: 18px;
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.7;
                }

                .job-details-empty {
                    font-size: 12.5px;
                    color: var(--muted);
                    font-style: italic;
                    margin: 0;
                }

                .job-details-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 22px;
                    padding-top: 18px;
                    border-top: 1px solid var(--line);
                }

                .job-details-close-button,
                .job-details-apply-button {
                    flex: 1;
                    padding: 12px;
                    border-radius: 9px;
                    font-size: 13.5px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    border: none;
                }

                .job-details-close-button {
                    background: var(--cream);
                    color: var(--ink);
                    border: 1px solid var(--line);
                }

                .job-details-close-button:hover {
                    background: var(--line);
                }

                .job-details-apply-button {
                    background: var(--navy3);
                    color: #fff;
                }

                .job-details-apply-button:hover:not(:disabled) {
                    background: var(--navy);
                }

                .job-details-apply-button:disabled {
                    background: var(--line);
                    color: var(--muted);
                    cursor: not-allowed;
                }


                /* =============================================
                   MOBILE
                ============================================= */

                @media (max-width: 768px) {

                    .job-card {
                        padding: 12px 14px;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }

                    .job-card-content h2 {
                        font-size: 16px;
                    }

                    .job-company {
                        font-size: 11px;
                    }

                    .job-card-action {
                        width: 100%;
                        justify-content: flex-start;
                        flex-wrap: wrap;
                    }

                    .job-view-button,
                    .job-apply-button {
                        padding: 6px 10px;
                        font-size: 10px;
                    }

                    .job-details-modal {
                        width: 100%;
                        max-height: 90vh;
                        padding: 16px;
                    }
                }

            `}</style>


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


                {/* =================================================
                    VISIBLE JOB INSIGHTS
                ================================================= */}

                <section className="job-insights-section">

                    <div className="job-insights-header">

                        <div>

                            <h2>
                                Job Insights
                            </h2>

                            <p>
                                Available jobs by work mode
                            </p>

                        </div>


                        <div className="job-insights-total">

                            <span>
                                Total Jobs
                            </span>

                            <strong>
                                {allJobs.length}
                            </strong>

                        </div>

                    </div>


                    <div className="job-insights-chart">

                        <ResponsiveContainer
                            width="100%"
                            height={260}
                        >

                            <BarChart
                                data={getJobInsights()}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 0,
                                    bottom: 10,
                                }}
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="mode"
                                    tick={{
                                        fontSize: 13,
                                    }}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 13,
                                    }}
                                />

                                <Tooltip
                                    formatter={(value) => [
                                        value,
                                        "Jobs",
                                    ]}
                                    contentStyle={{
                                        borderRadius: "10px",
                                        border: "1px solid #e5e7eb",
                                        boxShadow:
                                            "0 8px 25px rgba(0,0,0,0.08)",
                                    }}
                                />

                                <Bar
                                    dataKey="jobs"
                                    name="Jobs"
                                    radius={[
                                        8,
                                        8,
                                        0,
                                        0,
                                    ]}
                                    barSize={55}
                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                </section>


                {/* =================================================
                    JOB LIST
                ================================================= */}

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