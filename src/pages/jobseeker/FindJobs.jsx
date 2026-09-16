import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

/*
 * Django jobseeker/urls.py is mounted under:
 *
 * /api/auth/jobseeker/
 *
 * Therefore:
 *
 * GET  /api/auth/jobseeker/jobs/
 * POST /api/auth/jobseeker/jobs/<job_id>/apply/
 */
const JOBSEEKER_API = `${API_BASE}/auth/jobseeker`;

const AI_MATCH_THRESHOLD = 50;

/* =========================================================
   FIND JOBS
========================================================= */

function FindJobs() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [jobType, setJobType] = useState("");
    const [salary, setSalary] = useState("");

    const [savedJobs, setSavedJobs] = useState([]);

    const [profileStatus, setProfileStatus] = useState({
        approval_status: "pending",
        profile_completed: false,
    });

    const [profileStatusLoading, setProfileStatusLoading] =
        useState(true);

    const [isDisabledPerson, setIsDisabledPerson] =
        useState(false);

    /* =====================================================
       LOAD SAVED JOBS
    ===================================================== */

    useEffect(() => {
        try {
            const storedSaved =
                localStorage.getItem("jc_saved_jobs");

            if (!storedSaved) {
                setSavedJobs([]);
                return;
            }

            const parsed = JSON.parse(storedSaved);

            if (Array.isArray(parsed)) {
                setSavedJobs(parsed);
            } else {
                setSavedJobs([]);
            }
        } catch (err) {
            console.error(
                "Unable to load saved jobs:",
                err
            );

            setSavedJobs([]);
        }
    }, []);

    /* =====================================================
       LOAD PROFILE APPROVAL STATUS
    ===================================================== */

    useEffect(() => {
        fetchProfileStatus();
    }, []);

    async function fetchProfileStatus() {
        const token = localStorage.getItem("jc_token");

        if (!token) {
            setProfileStatusLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${JOBSEEKER_API}/profile/`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            console.log("PROFILE API RESPONSE:", data);

            if (response.ok) {
                setProfileStatus({
                    approval_status:
                        data?.approval_status || "pending",
                    profile_completed:
                        Boolean(data?.profile_completed),
                });

                setIsDisabledPerson(
                    Boolean(
                        data?.disability ??
                        data?.disability_details?.has_disability
                    )
                );
            }
        } catch (err) {
            console.error("PROFILE STATUS ERROR:", err);
            setIsDisabledPerson(false);
        } finally {
            setProfileStatusLoading(false);
        }
    }

    /* =====================================================
       FETCH JOBS
    ===================================================== */

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        const url = `${JOBSEEKER_API}/jobs/`;

        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("jc_token");

            console.log(
                "===================================="
            );

            console.log(
                "FETCHING JOBS FROM:",
                url
            );

            console.log(
                "TOKEN EXISTS:",
                Boolean(token)
            );

            console.log(
                "===================================="
            );

            const response = await fetch(url, {
                method: "GET",

                headers: {
                    Accept: "application/json",

                    ...(token
                        ? {
                              Authorization:
                                  `Bearer ${token}`,
                          }
                        : {}),
                },
            });

            let data = null;

            const contentType =
                response.headers.get(
                    "content-type"
                );

            if (
                contentType &&
                contentType.includes(
                    "application/json"
                )
            ) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error(
                        "Unable to parse JSON response:",
                        jsonError
                    );
                }
            }

            console.log(
                "JOBS API STATUS:",
                response.status
            );

            console.log(
                "JOBS API RESPONSE:",
                data
            );

            /* =================================================
               ERROR RESPONSE
            ================================================= */

            if (!response.ok) {
                const backendMessage =
                    data?.detail ||
                    data?.message ||
                    data?.error ||
                    "";

                if (response.status === 401) {
                    throw new Error(
                        backendMessage ||
                            "Your login session has expired. Please login again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        backendMessage ||
                            "You do not have permission to view jobs."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        `Jobs API was not found at ${url}`
                    );
                }

                throw new Error(
                    backendMessage ||
                        `Unable to load jobs. Server returned ${response.status}.`
                );
            }

            /* =================================================
               SUPPORT COMMON DRF RESPONSE FORMATS

               1. [...]
               2. { results: [...] }
               3. { jobs: [...] }
            ================================================= */

            let jobList = [];

            if (Array.isArray(data)) {
                jobList = data;
            } else if (
                Array.isArray(data?.results)
            ) {
                jobList = data.results;
            } else if (
                Array.isArray(data?.jobs)
            ) {
                jobList = data.jobs;
            }

            console.log(
                "NORMALIZED JOB LIST:",
                jobList
            );

            setJobs(jobList);

            if (jobList.length === 0) {
                console.log(
                    "Jobs API returned zero jobs."
                );
            }
        } catch (err) {
            console.error(
                "FETCH JOBS ERROR:",
                err
            );

            setJobs([]);

            setError(
                err?.message ||
                    "Unable to load jobs. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       FILTER JOBS
    ===================================================== */

    /* =====================================================
       FILTER JOBS

       IMPORTANT:
       - Job type may be stored in job_type OR employment_type.
       - Remote is commonly stored in work_mode, so it is included.
       - Salary may be returned as salary_min/salary_max or as
         a formatted string such as "5 - 8 LPA".
    ===================================================== */

    const filteredJobs = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        const locationValue =
            location.trim().toLowerCase();

        const typeValue =
            jobType.trim().toLowerCase();

        const salaryValue = Number(
            salary.trim()
        );

        function normalizeFilterText(value) {
            return String(value ?? "")
                .trim()
                .toLowerCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+/g, " ");
        }

        function getJobTypeText(job) {
            return [
                job?.job_type,
                job?.employment_type,
                job?.type,
                job?.work_mode,
                job?.mode,
            ]
                .filter(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== ""
                )
                .map(normalizeFilterText)
                .join(" ");
        }

        function toLpa(value) {
            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return null;
            }

            if (typeof value === "number") {
                /*
                 * Most project values are LPA. If a very large
                 * number is received, treat it as rupees/annual.
                 */
                return value > 1000
                    ? value / 100000
                    : value;
            }

            const text = String(value)
                .toLowerCase()
                .replace(/,/g, "")
                .trim();

            const match = text.match(
                /(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|l)/i
            );

            if (match) {
                return Number(match[1]);
            }

            const numberMatch = text.match(
                /\d+(?:\.\d+)?/g
            );

            if (
                !numberMatch ||
                numberMatch.length === 0
            ) {
                return null;
            }

            const numbers = numberMatch.map(Number);

            const largest = Math.max(...numbers);

            /*
             * If salary text is plain rupees, convert to LPA.
             * Example: 500000 -> 5 LPA.
             */
            if (
                /(?:₹|rs\.?|inr)/i.test(text) ||
                largest >= 100000
            ) {
                return largest / 100000;
            }

            return largest;
        }

        return jobs.filter((job) => {
            /* =============================================
               ONLY SHOW LIVE + ACTIVE JOBS
            ============================================= */

            const normalizedStatus = String(
                job?.status || "live"
            )
                .trim()
                .toLowerCase();

            const isLiveJob =
                normalizedStatus === "live";

            const isActiveJob =
                job?.is_active === undefined ||
                job?.is_active === null
                    ? true
                    : Boolean(job?.is_active);

            if (!isLiveJob || !isActiveJob) {
                return false;
            }

            /* =============================================
               TITLE
            ============================================= */

            const title = String(
                job?.title ||
                    job?.job_title ||
                    job?.position ||
                    job?.role ||
                    ""
            ).toLowerCase();

            /* =============================================
               COMPANY
            ============================================= */

            const company = String(
                job?.company ||
                    job?.company_name ||
                    job?.employer_name ||
                    job?.employer?.company_name ||
                    job?.employer?.name ||
                    ""
            ).toLowerCase();

            /* =============================================
               LOCATION
            ============================================= */

            const jobLocation = String(
                job?.location ||
                    job?.job_location ||
                    job?.city ||
                    job?.work_location ||
                    ""
            ).toLowerCase();

            /* =============================================
               JOB TYPE + WORK MODE

               We combine both because the backend may store:
               job_type = "Full Time"
               work_mode = "Remote"
            ============================================= */

            const normalizedType =
                getJobTypeText(job);

            /* =============================================
               SALARY
            ============================================= */

            const salaryText = String(
                job?.salary ||
                    job?.salary_range ||
                    job?.package ||
                    job?.ctc ||
                    ""
            ).toLowerCase();

            const salaryMinRaw =
                job?.salary_min ??
                job?.min_salary ??
                job?.minimum_salary ??
                null;

            const salaryMaxRaw =
                job?.salary_max ??
                job?.max_salary ??
                job?.maximum_salary ??
                null;

            const salaryMinLpa =
                toLpa(salaryMinRaw);

            const salaryMaxLpa =
                toLpa(salaryMaxRaw);

            const salaryTextLpa =
                toLpa(salaryText);

            /* =============================================
               SKILLS
            ============================================= */

            let skills = "";

            if (Array.isArray(job?.skills)) {
                skills = job.skills
                    .map((skill) => {
                        if (
                            typeof skill ===
                                "object" &&
                            skill !== null
                        ) {
                            return (
                                skill.name ||
                                skill.skill_name ||
                                ""
                            );
                        }

                        return String(skill);
                    })
                    .join(" ")
                    .toLowerCase();
            } else {
                skills = String(
                    job?.skills || ""
                ).toLowerCase();
            }

            /* =============================================
               SEARCH FILTER
            ============================================= */

            const matchesSearch =
                !searchValue ||
                title.includes(searchValue) ||
                company.includes(searchValue) ||
                skills.includes(searchValue);

            /* =============================================
               LOCATION FILTER
            ============================================= */

            const matchesLocation =
                !locationValue ||
                jobLocation.includes(locationValue);

            /* =============================================
               JOB TYPE FILTER

               Normalization makes these equivalent:
               "Full-Time" -> "full time"
               "full_time" -> "full time"
               "REMOTE"    -> "remote"
            ============================================= */

            let matchesType = true;

            if (typeValue) {
                const normalizedRequestedType =
                    normalizeFilterText(typeValue);

                matchesType = normalizedType.includes(
                    normalizedRequestedType
                );

                /*
                 * Some systems store remote as a work mode
                 * while others store it in job_type.
                 */
                if (
                    normalizedRequestedType ===
                    "remote"
                ) {
                    matchesType =
                        normalizeFilterText(
                            job?.work_mode
                        ) === "remote" ||
                        normalizeFilterText(
                            job?.mode
                        ) === "remote" ||
                        normalizedType.includes("remote");
                }
            }

            /* =============================================
               SALARY FILTER

               User selects a minimum salary:
               3 -> 3 LPA+
               5 -> 5 LPA+
               8 -> 8 LPA+
               10 -> 10 LPA+

               A job passes when its MAX salary reaches the
               selected amount. If max is unavailable, min is
               checked. If only formatted salary exists, that
               value is checked.
            ============================================= */

            let matchesSalary = true;

            if (
                Number.isFinite(salaryValue) &&
                salaryValue > 0
            ) {
                const effectiveSalary =
                    salaryMaxLpa ??
                    salaryMinLpa ??
                    salaryTextLpa;

                matchesSalary =
                    effectiveSalary !== null &&
                    effectiveSalary >= salaryValue;
            }

            return (
                matchesSearch &&
                matchesLocation &&
                matchesType &&
                matchesSalary
            );
        });
    }, [
        jobs,
        search,
        location,
        jobType,
        salary,
    ]);

    /* =====================================================
       GET JOB ID
    ===================================================== */

    function getJobId(job) {
        return (
            job?.id ??
            job?.job_id ??
            job?.pk ??
            null
        );
    }

    /* =====================================================
       SAVE / UNSAVE JOB
    ===================================================== */

    function toggleSaveJob(job) {
        const jobId = getJobId(job);

        if (
            jobId === null ||
            jobId === undefined
        ) {
            console.error(
                "Cannot save job. Job ID is missing:",
                job
            );

            return;
        }

        const normalizedId = String(jobId);

        setSavedJobs((previous) => {
            const normalizedPrevious =
                previous.map((id) =>
                    String(id)
                );

            const alreadySaved =
                normalizedPrevious.includes(
                    normalizedId
                );

            let updated;

            if (alreadySaved) {
                updated = previous.filter(
                    (id) =>
                        String(id) !==
                        normalizedId
                );
            } else {
                updated = [
                    ...previous,
                    jobId,
                ];
            }

            localStorage.setItem(
                "jc_saved_jobs",
                JSON.stringify(updated)
            );

            return updated;
        });
    }

    /* =====================================================
       VIEW JOB DETAILS
    ===================================================== */

    function handleApply(job) {
        const jobId = getJobId(job);

        if (
            jobId === null ||
            jobId === undefined
        ) {
            console.error(
                "Cannot open job. Job ID is missing:",
                job
            );

            return;
        }

        /*
         * Current frontend route:
         *
         * /jobseeker/jobs/:jobId
         *
         * Therefore navigate to JobDetails.
         */

        navigate(
            `/jobseeker/jobs/${jobId}`
        );
    }

    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {
        setSearch("");
        setLocation("");
        setJobType("");
        setSalary("");
    }

    /* =====================================================
       FORMAT POSTED DATE
    ===================================================== */

    function formatPostedDate(job) {
        const dateValue =
            job?.created_at ||
            job?.posted_at ||
            job?.created_date ||
            job?.date_posted;

        if (!dateValue) {
            return "New opportunity";
        }

        const date = new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Recently posted";
        }

        const now = new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const days = Math.floor(
            difference /
                (1000 *
                    60 *
                    60 *
                    24)
        );

        if (days <= 0) {
            return "Posted today";
        }

        if (days === 1) {
            return "Posted yesterday";
        }

        if (days < 30) {
            return `Posted ${days} days ago`;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="findjobs-page">
            <style>{`

                /* =================================================
                   ROOT
                ================================================= */

                .findjobs-page {
                    --blue: #2563eb;
                    --blue-light: #3b82f6;
                    --blue-soft: #eff6ff;

                    --white: #ffffff;
                    --text: #111827;
                    --text-soft: #64748b;
                    --line: #e2e8f0;
                    --light: #f8fafc;

                    min-height: 100vh;
                    width: 100%;

                    background: #f5f7fb;

                    color: var(--text);

                    font-family:
                        "Inter",
                        Arial,
                        sans-serif;
                }

                .findjobs-page *,
                .findjobs-page *::before,
                .findjobs-page *::after {
                    box-sizing: border-box;
                }

                /* =================================================
                   MAIN
                ================================================= */

                .findjobs-main {
                    width: 100%;
                    min-height: 100vh;

                    padding:
                        30px
                        34px
                        50px;
                }

                /* =================================================
                   TOP BAR
                ================================================= */

                .findjobs-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 20px;

                    margin-bottom: 28px;
                }

                .findjobs-heading h1 {
                    margin: 0;

                    font-size:
                        clamp(
                            1.8rem,
                            3vw,
                            2.5rem
                        );

                    line-height: 1.1;

                    letter-spacing: -0.03em;

                    color: #0f172a;
                }

                .findjobs-heading p {
                    margin:
                        7px 0 0;

                    color:
                        var(--text-soft);

                    font-size:
                        0.86rem;
                }

                .findjobs-top-actions {
                    display: flex;

                    align-items: center;

                    gap: 10px;
                }

                .findjobs-notification {
                    width: 42px;
                    height: 42px;

                    border:
                        1px solid
                        var(--line);

                    background:
                        #ffffff;

                    border-radius: 12px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    color:
                        var(--text-soft);

                    cursor: pointer;

                    transition:
                        all 0.2s ease;
                }

                .findjobs-notification:hover {
                    color: var(--blue);

                    border-color:
                        var(--blue);

                    transform:
                        translateY(-1px);
                }

                /* =================================================
                   SEARCH PANEL
                ================================================= */

                .findjobs-search-panel {
                    position: relative;

                    padding: 20px;

                    border-radius: 18px;

                    background:
                        linear-gradient(
                            135deg,
                            #05070b 0%,
                            #0b0f17 55%,
                            #05070b 100%
                        );

                    border:
                        1px solid
                        #1e293b;

                    box-shadow:
                        0 14px 40px
                        rgba(
                            0,
                            0,
                            0,
                            0.18
                        );

                    margin-bottom: 26px;
                }

                .findjobs-search-row {
                    display: grid;

                    grid-template-columns:
                        1.5fr
                        1fr
                        0.85fr
                        0.85fr
                        auto;

                    gap: 10px;

                    align-items: center;
                }

                .findjobs-search-box {
                    position: relative;
                }

                .findjobs-search-box i {
                    position: absolute;

                    left: 14px;
                    top: 50%;

                    transform:
                        translateY(-50%);

                    color:
                        #64748b;

                    font-size: 14px;

                    pointer-events: none;
                }

                /* =================================================
                   INPUTS
                ================================================= */

                .findjobs-search-box input,
                .findjobs-filter {
                    width: 100%;
                    height: 46px;

                    border:
                        1px solid
                        #334155;

                    border-radius: 10px;

                    outline: none;

                    background:
                        #111827;

                    color:
                        #ffffff;

                    font-size:
                        0.8rem;

                    font-family:
                        inherit;

                    transition:
                        all 0.2s ease;
                }

                .findjobs-search-box input {
                    padding:
                        0
                        14px
                        0
                        40px;
                }

                .findjobs-filter {
                    padding:
                        0 12px;
                }

                .findjobs-search-box input::placeholder,
                .findjobs-filter::placeholder {
                    color:
                        #94a3b8;
                }

                .findjobs-search-box input:focus,
                .findjobs-filter:focus {
                    border-color:
                        var(--blue);

                    box-shadow:
                        0 0 0 3px
                        rgba(
                            37,
                            99,
                            235,
                            0.18
                        );
                }

                .findjobs-filter option {
                    background:
                        #111827;

                    color:
                        #ffffff;
                }

                /* =================================================
                   SEARCH BUTTON
                ================================================= */

                .findjobs-search-btn {
                    height: 46px;

                    border: none;

                    border-radius: 10px;

                    padding:
                        0 20px;

                    background:
                        var(--blue);

                    color:
                        #ffffff;

                    font-family:
                        inherit;

                    font-size:
                        0.8rem;

                    font-weight:
                        700;

                    cursor: pointer;

                    transition:
                        all 0.2s ease;
                }

                .findjobs-search-btn:hover {
                    background:
                        var(--blue-light);

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 7px 18px
                        rgba(
                            37,
                            99,
                            235,
                            0.3
                        );
                }

                /* =================================================
                   RESULTS HEADER
                ================================================= */

                .findjobs-results-header {
                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 15px;

                    margin-bottom: 15px;
                }

                .findjobs-results-count {
                    font-size:
                        0.8rem;

                    color:
                        var(--text-soft);
                }

                .findjobs-results-count strong {
                    color:
                        var(--text);

                    font-size:
                        0.9rem;
                }

                .findjobs-clear {
                    border: none;

                    background: none;

                    color:
                        var(--blue);

                    font-size:
                        0.76rem;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }

                .findjobs-clear:hover {
                    color:
                        var(--blue-light);
                }

                /* =================================================
                   JOB GRID
                ================================================= */

                .findjobs-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap: 16px;
                }

                /* =================================================
                   JOB CARD
                ================================================= */

                .findjobs-card {
                    position: relative;

                    padding: 20px;

                    border:
                        1px solid
                        var(--line);

                    border-radius: 17px;

                    background:
                        #ffffff;

                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        border-color 0.2s ease;

                    overflow: hidden;
                }

                .findjobs-card::before {
                    content: "";

                    position: absolute;

                    top: 0;
                    left: 0;

                    width: 100%;
                    height: 3px;

                    background:
                        linear-gradient(
                            90deg,
                            var(--blue),
                            var(--blue-light)
                        );

                    opacity: 0;

                    transition:
                        opacity 0.2s ease;
                }

                .findjobs-card:hover {
                    transform:
                        translateY(-3px);

                    border-color:
                        #bfdbfe;

                    box-shadow:
                        0 15px 35px
                        rgba(
                            15,
                            23,
                            42,
                            0.09
                        );
                }

                .findjobs-card:hover::before {
                    opacity: 1;
                }

                /* =================================================
                   CARD TOP
                ================================================= */

                .findjobs-card-top {
                    display: flex;

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

                    gap: 15px;
                }

                .findjobs-company-logo {
                    width: 48px;
                    height: 48px;

                    flex-shrink: 0;

                    border-radius: 13px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background:
                        var(--blue-soft);

                    color:
                        var(--blue);

                    font-size:
                        1.1rem;

                    font-weight:
                        800;
                }

                .findjobs-card-main {
                    flex: 1;

                    min-width: 0;
                }

                .findjobs-job-title {
                    margin: 0;

                    color:
                        var(--text);

                    font-size:
                        1rem;

                    font-weight:
                        800;

                    line-height:
                        1.3;
                }

                .findjobs-company {
                    margin:
                        5px 0 0;

                    color:
                        var(--text-soft);

                    font-size:
                        0.74rem;
                }

                /* =================================================
                   SAVE
                ================================================= */

                .findjobs-save {
                    width: 36px;
                    height: 36px;

                    flex-shrink: 0;

                    border:
                        1px solid
                        var(--line);

                    border-radius: 9px;

                    background:
                        #ffffff;

                    color:
                        #94a3b8;

                    cursor:
                        pointer;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    transition:
                        all 0.2s ease;
                }

                .findjobs-save:hover {
                    color:
                        var(--blue);

                    border-color:
                        var(--blue);
                }

                .findjobs-save.saved {
                    color:
                        var(--blue);

                    background:
                        var(--blue-soft);

                    border-color:
                        #bfdbfe;
                }

                /* =================================================
                   META
                ================================================= */

                .findjobs-meta {
                    display: flex;

                    flex-wrap: wrap;

                    gap: 7px;

                    margin:
                        17px
                        0
                        13px;
                }

                .findjobs-meta-item {
                    display: inline-flex;

                    align-items: center;

                    gap: 5px;

                    padding:
                        6px
                        8px;

                    border-radius: 7px;

                    background:
                        #f1f5f9;

                    color:
                        var(--text-soft);

                    font-size:
                        0.67rem;

                    font-weight:
                        600;
                }

                .findjobs-meta-item i {
                    color:
                        var(--blue);
                }

                /* =================================================
                   AI MATCH
                ================================================= */

                .findjobs-match {
                    margin-top: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    min-width: 122px;
                    padding: 6px 9px;
                    border-radius: 8px;
                    font-size: 0.68rem;
                    font-weight: 700;
                    border: 1px solid #e2e8f0;
                }

                .findjobs-match span {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .findjobs-match.eligible {
                    color: #166534;
                    background: #f0fdf4;
                    border-color: #bbf7d0;
                }

                .findjobs-match.not-eligible {
                    color: #b45309;
                    background: #fffbeb;
                    border-color: #fde68a;
                }

                /* =================================================
                   DISABILITY AI HINT
                ================================================= */

                .findjobs-disability-ai-hint {
                    margin-top: 12px;
                    padding: 10px 12px;

                    display: flex;
                    align-items: flex-start;
                    gap: 9px;

                    border: 1px solid #bfdbfe;
                    border-radius: 10px;

                    background: #eff6ff;
                    color: #1e40af;

                    font-size: 0.7rem;
                    line-height: 1.5;
                    font-weight: 600;
                }

                .findjobs-disability-ai-hint i {
                    margin-top: 2px;
                    color: #2563eb;
                    flex-shrink: 0;
                }

                /* =================================================
                   DESCRIPTION
                ================================================= */

                .findjobs-description {
                    margin: 0;

                    color:
                        #64748b;

                    font-size:
                        0.75rem;

                    line-height:
                        1.6;

                    display:
                        -webkit-box;

                    -webkit-line-clamp: 2;

                    -webkit-box-orient:
                        vertical;

                    overflow: hidden;
                }

                /* =================================================
                   SKILLS
                ================================================= */

                .findjobs-skills {
                    display: flex;

                    flex-wrap: wrap;

                    gap: 6px;

                    margin-top: 14px;
                }

                .findjobs-skill {
                    padding:
                        5px
                        8px;

                    border-radius: 6px;

                    background:
                        var(--blue-soft);

                    color:
                        var(--blue);

                    font-size:
                        0.64rem;

                    font-weight:
                        700;
                }

                /* =================================================
                   CARD FOOTER
                ================================================= */

                .findjobs-card-footer {
                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 12px;

                    margin-top: 18px;

                    padding-top: 15px;

                    border-top:
                        1px solid
                        #e2e8f0;
                }

                .findjobs-posted {
                    color:
                        #94a3b8;

                    font-size:
                        0.65rem;
                }

                .findjobs-apply {
                    border: none;

                    border-radius: 8px;

                    padding:
                        9px
                        15px;

                    background:
                        var(--blue);

                    color:
                        #ffffff;

                    font-family:
                        inherit;

                    font-size:
                        0.7rem;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }

                .findjobs-apply:hover:not(:disabled) {
                    background:
                        var(--blue-light);

                    transform:
                        translateY(-1px);
                }

                .findjobs-apply:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .findjobs-apply.blocked {
                    background: #94a3b8;
                }

                /* =================================================
                   LOADING
                ================================================= */

                .findjobs-loading {
                    min-height: 320px;

                    display: flex;

                    flex-direction:
                        column;

                    align-items: center;

                    justify-content:
                        center;

                    color:
                        var(--text-soft);
                }

                .findjobs-spinner {
                    width: 35px;
                    height: 35px;

                    border:
                        3px solid
                        #dbeafe;

                    border-top-color:
                        var(--blue);

                    border-radius: 50%;

                    animation:
                        findjobsSpin
                        0.8s
                        linear
                        infinite;

                    margin-bottom: 12px;
                }

                @keyframes findjobsSpin {
                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                /* =================================================
                   EMPTY
                ================================================= */

                .findjobs-empty {
                    grid-column:
                        1 / -1;

                    padding:
                        60px 25px;

                    text-align:
                        center;

                    border:
                        1px dashed
                        #cbd5e1;

                    border-radius: 17px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.65
                        );
                }

                .findjobs-empty-icon {
                    width: 60px;
                    height: 60px;

                    margin:
                        0
                        auto
                        14px;

                    border-radius: 50%;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background:
                        var(--blue-soft);

                    color:
                        var(--blue);

                    font-size:
                        1.25rem;
                }

                .findjobs-empty h3 {
                    margin:
                        0
                        0
                        7px;

                    font-size:
                        1.1rem;
                }

                .findjobs-empty p {
                    margin: 0;

                    color:
                        var(--text-soft);

                    font-size:
                        0.77rem;
                }

.findjobs-profile-warning {
                    margin-bottom: 16px;
                    padding: 11px 13px;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    border: 1px solid #fde68a;
                    border-radius: 10px;
                    background: #fffbeb;
                    color: #92400e;
                    font-size: 0.72rem;
                    line-height: 1.5;
                }

                .findjobs-profile-warning i {
                    margin-top: 2px;
                }

                /* =================================================
                   ERROR
                ================================================= */

                .findjobs-api-error {
                    margin-bottom: 16px;

                    padding:
                        12px
                        14px;

                    border:
                        1px solid
                        #fecaca;

                    border-radius: 10px;

                    background:
                        #fef2f2;

                    color:
                        #dc2626;

                    font-size:
                        0.72rem;

                    display: flex;

                    align-items:
                        flex-start;

                    gap: 8px;

                    line-height:
                        1.5;
                }

                .findjobs-retry {
                    margin-left: 8px;

                    padding:
                        5px
                        10px;

                    border: none;

                    border-radius: 6px;

                    background:
                        #dc2626;

                    color:
                        #ffffff;

                    font-size:
                        0.68rem;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }

                .findjobs-retry:hover {
                    background:
                        #b91c1c;
                }

                /* =================================================
                   RESPONSIVE
                ================================================= */

                @media (max-width: 1100px) {
                    .findjobs-search-row {
                        grid-template-columns:
                            1fr
                            1fr;
                    }

                    .findjobs-search-box {
                        grid-column:
                            1 / -1;
                    }

                    .findjobs-search-btn {
                        width: 100%;
                    }

                    .findjobs-grid {
                        grid-template-columns:
                            1fr;
                    }
                }

                @media (max-width: 900px) {
                    .findjobs-main {
                        width: 100%;

                        margin-left: 0;

                        padding:
                            24px
                            20px
                            40px;
                    }
                }

                @media (max-width: 800px) {
                    .findjobs-topbar {
                        align-items:
                            flex-start;
                    }

                    .findjobs-search-row {
                        grid-template-columns:
                            1fr;
                    }

                    .findjobs-search-box {
                        grid-column:
                            auto;
                    }
                }

                @media (max-width: 520px) {
                    .findjobs-main {
                        padding:
                            18px
                            12px
                            30px;
                    }

                    .findjobs-heading h1 {
                        font-size:
                            1.65rem;
                    }

                    .findjobs-heading p {
                        font-size:
                            0.74rem;
                    }

                    .findjobs-notification {
                        display: none;
                    }

                    .findjobs-search-panel {
                        padding: 13px;
                    }

                    .findjobs-card {
                        padding: 16px;
                    }

                    .findjobs-card-footer {
                        align-items:
                            flex-end;
                    }
                }

            `}</style>

            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <main className="findjobs-main">

                {/* =================================================
                    TOP BAR
                ================================================= */}

                <div className="findjobs-topbar">

                    <div className="findjobs-heading">

                        <h1>
                            Find Jobs
                        </h1>

                        <p>
                            Discover your next
                            opportunity.
                        </p>

                    </div>

                    <div className="findjobs-top-actions">

                        <button
                            type="button"
                            className="findjobs-notification"
                            onClick={() =>
                                navigate(
                                    "/jobseeker/notifications"
                                )
                            }
                            aria-label="Notifications"
                        >
                            <i className="fa-regular fa-bell"></i>
                        </button>

                    </div>

                </div>

                {/* =================================================
                    API ERROR
                ================================================= */}

                {error && (
                    <div className="findjobs-api-error">

                        <i className="fa-solid fa-circle-info"></i>

                        <span>
                            {error}

                            <button
                                type="button"
                                className="findjobs-retry"
                                onClick={fetchJobs}
                            >
                                Retry
                            </button>
                        </span>

                    </div>
                )}

                {/* =================================================
                    SEARCH SECTION
                ================================================= */}

                <section className="findjobs-search-panel">

                    <div className="findjobs-search-row">

                        {/* SEARCH */}

                        <div className="findjobs-search-box">

                            <i className="fa-solid fa-magnifying-glass"></i>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Job title, skills or company"
                            />

                        </div>

                        {/* LOCATION */}

                        <input
                            type="text"
                            className="findjobs-filter"
                            value={location}
                            onChange={(e) =>
                                setLocation(
                                    e.target.value
                                )
                            }
                            placeholder="📍 Location"
                        />

                        {/* JOB TYPE */}

                        <select
                            className="findjobs-filter"
                            value={jobType}
                            onChange={(e) =>
                                setJobType(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                All Job Types
                            </option>

                            <option value="full time">
                                Full Time
                            </option>

                            <option value="part time">
                                Part Time
                            </option>

                            <option value="remote">
                                Remote
                            </option>

                            <option value="internship">
                                Internship
                            </option>

                            <option value="contract">
                                Contract
                            </option>

                        </select>

                        {/* SALARY */}

                        <select
                            className="findjobs-filter"
                            value={salary}
                            onChange={(e) =>
                                setSalary(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Salary
                            </option>

                            <option value="3">
                                ₹3 LPA+
                            </option>

                            <option value="5">
                                ₹5 LPA+
                            </option>

                            <option value="8">
                                ₹8 LPA+
                            </option>

                            <option value="10">
                                ₹10 LPA+
                            </option>

                        </select>

                        {/* SEARCH BUTTON */}

                        <button
                            type="button"
                            className="findjobs-search-btn"
                            onClick={() => {
                                /*
                                 * Filtering is already live
                                 * through useMemo().
                                 */
                            }}
                        >
                            Search
                        </button>

                    </div>

                </section>

                {!profileStatusLoading &&
                    String(profileStatus.approval_status || "").toLowerCase() !==
                        "approved" && (
                        <div className="findjobs-profile-warning">
                            <i className="fa-solid fa-shield-halved"></i>
                            <span>
                                Your profile is not approved yet. You can view jobs,
                                but you must complete admin approval before applying.
                            </span>
                        </div>
                    )}

                {/* =================================================
                    RESULTS HEADER
                ================================================= */}

                <div className="findjobs-results-header">

                    <div className="findjobs-results-count">

                        <strong>
                            {filteredJobs.length}
                        </strong>{" "}

                        jobs found

                    </div>

                    {(search ||
                        location ||
                        jobType ||
                        salary) && (

                        <button
                            type="button"
                            className="findjobs-clear"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear filters
                        </button>

                    )}

                </div>

                {/* =================================================
                    JOB RESULTS
                ================================================= */}

                {loading ? (

                    <div className="findjobs-loading">

                        <div className="findjobs-spinner"></div>

                        <span>
                            Finding the best jobs
                            for you...
                        </span>

                    </div>

                ) : (

                    <div className="findjobs-grid">

                        {filteredJobs.length === 0 ? (

                            <div className="findjobs-empty">

                                <div className="findjobs-empty-icon">

                                    <i className="fa-solid fa-magnifying-glass"></i>

                                </div>

                                <h3>
                                    {jobs.length === 0
                                        ? "No jobs available"
                                        : "No jobs found"}
                                </h3>

                                <p>
                                    {jobs.length === 0
                                        ? "There are currently no job opportunities available."
                                        : "Try changing your search or filters to find more opportunities."}
                                </p>

                                {jobs.length === 0 &&
                                    error && (

                                        <button
                                            type="button"
                                            className="findjobs-search-btn"
                                            style={{
                                                marginTop:
                                                    "16px",
                                            }}
                                            onClick={
                                                fetchJobs
                                            }
                                        >
                                            Try Again
                                        </button>

                                    )}

                            </div>

                        ) : (

                            filteredJobs.map(
                                (job, index) => {

                                    const jobId =
                                        getJobId(
                                            job
                                        );

                                    const reactKey =
                                        jobId !== null
                                            ? String(
                                                  jobId
                                              )
                                            : `job-${index}`;

                                    /* =================================
                                       JOB DATA
                                    ================================= */

                                    const title =
                                        job?.title ||
                                        job?.job_title ||
                                        job?.position ||
                                        job?.role ||
                                        "Job Opportunity";

                                    const company =
                                        job?.company ||
                                        job?.company_name ||
                                        job?.employer_name ||
                                        job?.employer
                                            ?.company_name ||
                                        job?.employer
                                            ?.name ||
                                        "Company";

                                    const jobLocation =
                                        job?.location ||
                                        job?.job_location ||
                                        job?.city ||
                                        job?.work_location ||
                                        "Location not specified";

                                    const type =
                                        job?.job_type ||
                                        job?.employment_type ||
                                        job?.type ||
                                        "Full Time";

                                    const salaryText =
                                        job?.salary ||
                                        job?.salary_range ||
                                        job?.package ||
                                        job?.ctc ||
                                        "Salary not specified";

                                    const experience =
                                        job?.experience ||
                                        job?.experience_required ||
                                        job?.years_of_experience ||
                                        "Experience not specified";

                                    const description =
                                        job?.description ||
                                        job?.job_description ||
                                        job?.details ||
                                        "Explore this opportunity and learn more about the role, requirements and career benefits.";

                                    /* =================================
                                       SKILLS
                                    ================================= */

                                    let skills = [];

                                    if (
                                        Array.isArray(
                                            job?.skills
                                        )
                                    ) {
                                        skills =
                                            job.skills
                                                .map(
                                                    (
                                                        skill
                                                    ) => {

                                                        if (
                                                            typeof skill ===
                                                                "object" &&
                                                            skill !==
                                                                null
                                                        ) {
                                                            return (
                                                                skill.name ||
                                                                skill.skill_name ||
                                                                ""
                                                            );
                                                        }

                                                        return String(
                                                            skill
                                                        );
                                                    }
                                                )
                                                .filter(
                                                    Boolean
                                                );
                                    } else if (
                                        typeof job?.skills ===
                                        "string"
                                    ) {
                                        skills =
                                            job.skills
                                                .split(",")
                                                .map(
                                                    (
                                                        skill
                                                    ) =>
                                                        skill.trim()
                                                )
                                                .filter(
                                                    Boolean
                                                );
                                    }

                                    /* =================================
                                       SAVED STATUS
                                    ================================= */

                                    const isSaved =
                                        jobId !==
                                            null &&
                                        savedJobs.some(
                                            (id) =>
                                                String(
                                                    id
                                                ) ===
                                                String(
                                                    jobId
                                                )
                                        );

                                    const matchScore = Number(
                                        job?.ai_match_score ??
                                            job?.match_score ??
                                            0
                                    );

                                    const matchAllowed =
                                        matchScore >= AI_MATCH_THRESHOLD;

                                    const profileApproved =
                                        String(
                                            profileStatus.approval_status || ""
                                        ).toLowerCase() === "approved";

                                    const profileCompleted =
                                        profileStatus.profile_completed === true;

                                    const normalizedJobStatus = String(
                                        job?.status || "live"
                                    ).trim().toLowerCase();

                                    const jobIsLive =
                                        normalizedJobStatus === "live";

                                    const jobIsActive =
                                        job?.is_active === undefined ||
                                        job?.is_active === null
                                            ? true
                                            : Boolean(job?.is_active);

                                    const canApply =
                                        !profileStatusLoading &&
                                        profileApproved &&
                                        profileCompleted &&
                                        matchAllowed &&
                                        jobIsLive &&
                                        jobIsActive;

                                    /* =================================
                                       COMPANY INITIAL
                                    ================================= */

                                    const companyInitial =
                                        String(
                                            company
                                        )
                                            .charAt(0)
                                            .toUpperCase();

                                    return (

                                        <article
                                            className="findjobs-card"
                                            key={
                                                reactKey
                                            }
                                        >

                                            {/* CARD TOP */}

                                            <div className="findjobs-card-top">

                                                <div className="findjobs-company-logo">

                                                    {companyInitial}

                                                </div>

                                                <div className="findjobs-card-main">

                                                    <h2 className="findjobs-job-title">

                                                        {title}

                                                    </h2>

                                                    <p className="findjobs-company">

                                                        {company}

                                                    </p>

                                                </div>

                                                {/* SAVE */}

                                                <button
                                                    type="button"
                                                    className={`findjobs-save ${
                                                        isSaved
                                                            ? "saved"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        toggleSaveJob(
                                                            job
                                                        )
                                                    }
                                                    aria-label={
                                                        isSaved
                                                            ? "Remove saved job"
                                                            : "Save job"
                                                    }
                                                >

                                                    <i
                                                        className={
                                                            isSaved
                                                                ? "fa-solid fa-bookmark"
                                                                : "fa-regular fa-bookmark"
                                                        }
                                                    ></i>

                                                </button>

                                            </div>

                                            {/* META */}

                                            <div className="findjobs-meta">

                                                <span className="findjobs-meta-item">

                                                    <i className="fa-solid fa-location-dot"></i>

                                                    {jobLocation}

                                                </span>

                                                <span className="findjobs-meta-item">

                                                    <i className="fa-solid fa-clock"></i>

                                                    {type}

                                                </span>

                                                <span className="findjobs-meta-item">

                                                    <i className="fa-solid fa-indian-rupee-sign"></i>

                                                    {salaryText}

                                                </span>

                                                <span className="findjobs-meta-item">

                                                    <i className="fa-solid fa-user-tie"></i>

                                                    {experience}

                                                </span>

                                            </div>

                                            {/* AI MATCH */}

                                            <div
                                                className={`findjobs-match ${
                                                    matchAllowed
                                                        ? "eligible"
                                                        : "not-eligible"
                                                }`}
                                            >
                                                <span>
                                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                                    AI Match
                                                </span>
                                                <strong>{matchScore}%</strong>
                                            </div>

                                            {/* =================================================
                                                DISABILITY-ONLY AI HINT
                                            ================================================= */}

                                            {isDisabledPerson &&
                                                Boolean(job?.is_disability_job) && (
                                                <div className="findjobs-disability-ai-hint">
                                                    <i className="fa-solid fa-wand-magic-sparkles"></i>

                                                    <span>
                                                        AI Hint: This job is specifically for persons with disabilities. You should apply for this opportunity.
                                                    </span>
                                                </div>
                                            )}

                                            {/* DESCRIPTION */}

                                            <p className="findjobs-description">

                                                {description}

                                            </p>

                                            {/* SKILLS */}

                                            {skills.length >
                                                0 && (

                                                <div className="findjobs-skills">

                                                    {skills
                                                        .slice(
                                                            0,
                                                            5
                                                        )
                                                        .map(
                                                            (
                                                                skill,
                                                                skillIndex
                                                            ) => (

                                                                <span
                                                                    className="findjobs-skill"
                                                                    key={`${reactKey}-skill-${skillIndex}`}
                                                                >
                                                                    {
                                                                        skill
                                                                    }
                                                                </span>

                                                            )
                                                        )}

                                                </div>

                                            )}

                                            {/* FOOTER */}

                                            <div className="findjobs-card-footer">

                                                <span className="findjobs-posted">

                                                    <i className="fa-regular fa-clock"></i>{" "}

                                                    {formatPostedDate(
                                                        job
                                                    )}

                                                </span>

                                                <button
                                                    type="button"
                                                    className={`findjobs-apply ${
                                                        !canApply ? "blocked" : ""
                                                    }`}
                                                    disabled={!canApply}
                                                    onClick={() =>
                                                        handleApply(job)
                                                    }
                                                    title={
                                                        !profileApproved
                                                            ? "Admin approval is required before applying."
                                                            : !profileCompleted
                                                              ? "Complete your profile before applying."
                                                              : !matchAllowed
                                                                ? `Your AI match is ${matchScore}%. Minimum required is ${AI_MATCH_THRESHOLD}%.`
                                                                : "View and apply for this job"
                                                    }
                                                >
                                                    {canApply
                                                        ? "View & Apply"
                                                        : !profileApproved
                                                          ? "Approval Required"
                                                          : !profileCompleted
                                                            ? "Complete Profile"
                                                            : `Match ${matchScore}%`}
                                                </button>

                                            </div>

                                        </article>

                                    );
                                }
                            )

                        )}

                    </div>

                )}

            </main>

        </div>
    );
}

export default FindJobs;

