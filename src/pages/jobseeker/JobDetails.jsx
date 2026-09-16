import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const JOBSEEKER_API = `${API_BASE}/auth/jobseeker`;

/* =========================================================
   TOKEN HELPERS
========================================================= */

function getToken() {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        ""
    );
}

function clearTokens() {
    [
        "jc_token",
        "access_token",
        "accessToken",
        "token",
        "refresh_token",
        "refreshToken",
    ].forEach((key) => {
        localStorage.removeItem(key);
    });
}

/* =========================================================
   RESPONSE HELPER
========================================================= */

async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    try {
        const text = await response.text();
        return text || null;
    } catch {
        return null;
    }
}

/* =========================================================
   AUTH HEADERS
========================================================= */

function getAuthHeaders() {
    const token = getToken();

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
}

/* =========================================================
   NORMALIZE API LIST
========================================================= */

function normalizeList(data, possibleKeys = []) {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of possibleKeys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

/* =========================================================
   OBJECT ID
========================================================= */

function getObjectId(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    if (
        typeof value === "object"
    ) {
        return (
            value.id ??
            value.pk ??
            value.job_id ??
            value.jobId ??
            value.application_id ??
            null
        );
    }

    return null;
}

/* =========================================================
   TEXT HELPERS
========================================================= */

function normalizeText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

function firstValue(...values) {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}

function formatLabel(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    return String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

/* =========================================================
   JOB TYPE
========================================================= */

function formatJobType(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    const map = {
        full_time: "Full Time",
        "full-time": "Full Time",
        "full time": "Full Time",

        part_time: "Part Time",
        "part-time": "Part Time",
        "part time": "Part Time",

        contract: "Contract",

        internship: "Internship",

        temporary: "Temporary",

        permanent: "Permanent",
    };

    return (
        map[normalized] ||
        formatLabel(value) ||
        "Not specified"
    );
}

/* =========================================================
   WORK MODE
========================================================= */

function formatWorkMode(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    const map = {
        remote: "Remote",

        hybrid: "Hybrid",

        onsite: "On-site",
        on_site: "On-site",
        "on-site": "On-site",

        office: "On-site",

        work_from_home: "Remote",
        "work from home": "Remote",
    };

    return (
        map[normalized] ||
        formatLabel(value) ||
        "Not specified"
    );
}

/* =========================================================
   EXPERIENCE
========================================================= */

function formatExperience(job) {
    const directExperience = firstValue(
        job?.experience,
        job?.experience_display,
        job?.experience_level
    );

    if (
        directExperience !== null &&
        directExperience !== undefined &&
        String(directExperience).trim() !== ""
    ) {
        return formatLabel(directExperience);
    }

    const minimum = firstValue(
        job?.minimum_experience,
        job?.min_experience,
        job?.experience_min
    );

    const maximum = firstValue(
        job?.maximum_experience,
        job?.max_experience,
        job?.experience_max
    );

    const hasMinimum =
        minimum !== null &&
        minimum !== undefined &&
        String(minimum).trim() !== "";

    const hasMaximum =
        maximum !== null &&
        maximum !== undefined &&
        String(maximum).trim() !== "";

    if (hasMinimum && hasMaximum) {
        if (
            String(minimum) ===
            String(maximum)
        ) {
            return `${minimum} years`;
        }

        return `${minimum} - ${maximum} years`;
    }

    if (hasMinimum) {
        return `${minimum}+ years`;
    }

    if (hasMaximum) {
        return `Up to ${maximum} years`;
    }

    return "Not specified";
}

/* =========================================================
   SALARY
========================================================= */

function formatSalary(job) {
    const minimum = firstValue(
        job?.salary_min,
        job?.min_salary,
        job?.salary_from
    );

    const maximum = firstValue(
        job?.salary_max,
        job?.max_salary,
        job?.salary_to
    );

    const hasMinimum =
        minimum !== null &&
        minimum !== undefined &&
        String(minimum).trim() !== "";

    const hasMaximum =
        maximum !== null &&
        maximum !== undefined &&
        String(maximum).trim() !== "";

    function formatAmount(amount) {
        const number = Number(amount);

        if (Number.isNaN(number)) {
            return String(amount);
        }

        if (number >= 10000000) {
            return `₹${(
                number / 10000000
            ).toFixed(2)} Cr`;
        }

        if (number >= 100000) {
            return `₹${(
                number / 100000
            ).toFixed(2)} L`;
        }

        return `₹${number.toLocaleString(
            "en-IN"
        )}`;
    }

    if (
        hasMinimum &&
        hasMaximum
    ) {
        return `${formatAmount(
            minimum
        )} - ${formatAmount(maximum)}`;
    }

    if (hasMinimum) {
        return `${formatAmount(minimum)}+`;
    }

    if (hasMaximum) {
        return `Up to ${formatAmount(maximum)}`;
    }

    return "Salary not specified";
}

/* =========================================================
   SKILLS
========================================================= */

function normalizeSkills(value) {
    if (Array.isArray(value)) {
        return value
            .map((skill) => {
                if (
                    typeof skill === "object" &&
                    skill !== null
                ) {
                    return (
                        skill.name ||
                        skill.skill_name ||
                        skill.title ||
                        skill.label ||
                        ""
                    );
                }

                return String(skill);
            })
            .map((skill) =>
                String(skill).trim()
            )
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/[,;\n|]+/)
            .map((skill) =>
                skill.trim()
            )
            .filter(Boolean);
    }

    return [];
}

/* =========================================================
   TEXT LIST
========================================================= */

function normalizeTextList(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (
                    typeof item === "object" &&
                    item !== null
                ) {
                    return (
                        item.title ||
                        item.name ||
                        item.description ||
                        item.text ||
                        ""
                    );
                }

                return String(item);
            })
            .map((item) =>
                String(item).trim()
            )
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/\r?\n|•|;/)
            .map((item) =>
                item
                    .replace(/^[-*]\s*/, "")
                    .trim()
            )
            .filter(Boolean);
    }

    return [];
}

/* =========================================================
   COMPANY NAME
========================================================= */

function getCompanyName(job) {
    const employer =
        job?.employer || {};

    const employerProfile =
        job?.employer_profile || {};

    const employerDetails =
        job?.employer_details || {};

    const companyDetails =
        job?.company_details || {};

    const candidates = [
        job?.company_name,
        job?.employer_name,
        job?.company,
        job?.companyName,

        employer?.company_name,
        employer?.companyName,
        employer?.name,
        employer?.company,

        employerProfile?.company_name,
        employerProfile?.companyName,
        employerProfile?.name,
        employerProfile?.company,

        employerDetails?.company_name,
        employerDetails?.companyName,
        employerDetails?.name,
        employerDetails?.company,

        companyDetails?.company_name,
        companyDetails?.companyName,
        companyDetails?.name,
        companyDetails?.company,
    ];

    for (const value of candidates) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return String(value).trim();
        }
    }

    return "Company";
}

/* =========================================================
   POSTED DATE
========================================================= */

function formatPostedDate(value) {
    if (!value) {
        return "Recently posted";
    }

    const date = new Date(value);

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
            (1000 * 60 * 60 * 24)
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

/* =========================================================
   COMPONENT
========================================================= */

function JobDetails() {
    const navigate = useNavigate();
    const { jobId } = useParams();

    const [job, setJob] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [alreadyApplied, setAlreadyApplied] =
        useState(false);

    const [applicationId, setApplicationId] =
        useState(null);

    const [applying, setApplying] =
        useState(false);

    const [showApplyModal, setShowApplyModal] =
        useState(false);

    const [modal, setModal] = useState({
        type: "",
        title: "",
        message: "",
    });

    const requestedJobId =
        String(jobId || "").trim();

    /* =====================================================
       LOAD JOB + APPLICATION
    ===================================================== */

    async function loadData() {
        if (!requestedJobId) {
            setError("Invalid job.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            await Promise.all([
                fetchJob(),
                fetchApplications(),
            ]);
        } catch (err) {
            console.error(
                "LOAD JOB DATA ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load job details."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function initialLoad() {
            if (!requestedJobId) {
                setError("Invalid job.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                await Promise.all([
                    fetchJob(cancelled),
                    fetchApplications(cancelled),
                ]);
            } catch (err) {
                console.error(
                    "INITIAL LOAD ERROR:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err?.message ||
                            "Unable to load job details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        initialLoad();

        return () => {
            cancelled = true;
        };
    }, [requestedJobId]);

    /* =====================================================
       FETCH JOB
    ===================================================== */

    async function fetchJob(
        cancelled = false
    ) {
        const token = getToken();

        if (!token) {
            if (!cancelled) {
                setError(
                    "Please login again to view this job."
                );
            }

            return;
        }

        try {
            const response =
                await fetch(
                    `${JOBSEEKER_API}/jobs/`,
                    {
                        method: "GET",
                        headers:
                            getAuthHeaders(),
                    }
                );

            const data =
                await parseResponse(
                    response
                );

            console.log(
                "JOB LIST RESPONSE:",
                data
            );

            if (
                response.status === 401
            ) {
                clearTokens();

                if (!cancelled) {
                    setError(
                        "Your login session has expired. Please login again."
                    );
                }

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                        data?.message ||
                        data?.error ||
                        `Unable to load job. Server returned ${response.status}.`
                );
            }

            const jobs =
                normalizeList(data, [
                    "jobs",
                    "data",
                    "results",
                ]);

            console.log(
                "NORMALIZED JOBS:",
                jobs
            );

            const foundJob =
                jobs.find((item) => {
                    const id =
                        item?.id ??
                        item?.job_id ??
                        item?.jobId ??
                        item?.pk;

                    return (
                        String(id) ===
                        requestedJobId
                    );
                });

            console.log(
                "FOUND JOB:",
                foundJob
            );

            if (!foundJob) {
                throw new Error(
                    "Job not found or it is no longer available."
                );
            }

            if (!cancelled) {
                setJob(foundJob);
            }
        } catch (err) {
            console.error(
                "JOB DETAILS ERROR:",
                err
            );

            if (!cancelled) {
                setJob(null);
                setError(
                    err?.message ||
                        "Unable to load job details."
                );
            }
        }
    }

    /* =====================================================
       FETCH APPLICATIONS
    ===================================================== */

    async function fetchApplications(
        cancelled = false
    ) {
        const token = getToken();

        if (
            !token ||
            !requestedJobId
        ) {
            return;
        }

        try {
            const response =
                await fetch(
                    `${JOBSEEKER_API}/applications/`,
                    {
                        method: "GET",
                        headers:
                            getAuthHeaders(),
                    }
                );

            const data =
                await parseResponse(
                    response
                );

            if (
                response.status === 401
            ) {
                return;
            }

            if (!response.ok) {
                console.error(
                    "APPLICATIONS API ERROR:",
                    response.status,
                    data
                );

                return;
            }

            const applications =
                normalizeList(data, [
                    "applications",
                    "data",
                    "results",
                ]);

            console.log(
                "APPLICATIONS:",
                applications
            );

            const foundApplication =
                applications.find(
                    (application) => {
                        const applicationJobId =
                            getObjectId(
                                application?.job
                            ) ??
                            application?.job_id ??
                            application?.jobId;

                        return (
                            applicationJobId !==
                                null &&
                            String(
                                applicationJobId
                            ) ===
                                requestedJobId
                        );
                    }
                );

            if (
                foundApplication &&
                !cancelled
            ) {
                setAlreadyApplied(true);

                setApplicationId(
                    foundApplication?.id ??
                        foundApplication?.application_id ??
                        null
                );
            }

            if (
                !foundApplication &&
                !cancelled
            ) {
                setAlreadyApplied(false);
                setApplicationId(null);
            }
        } catch (err) {
            console.error(
                "FETCH APPLICATIONS ERROR:",
                err
            );
        }
    }

    /* =====================================================
       NORMALIZED JOB
    ===================================================== */

    const jobData = useMemo(() => {
        if (!job) {
            return null;
        }

        /*
         * Some serializers return:
         *
         * job: {
         *     ...
         * }
         *
         * Others may return:
         *
         * job_details: {
         *     ...
         * }
         *
         * Support both.
         */

        const nestedJob =
            job?.job_details &&
            typeof job.job_details ===
                "object"
                ? job.job_details
                : job;

        const title =
            normalizeText(
                firstValue(
                    nestedJob?.title,
                    job?.title,
                    job?.job_title
                )
            ) ||
            "Job Opportunity";

        const company =
            getCompanyName(
                nestedJob
            ) !== "Company"
                ? getCompanyName(
                      nestedJob
                  )
                : firstValue(
                      job?.company_name,
                      job?.company,
                      job?.employer_name
                  ) ||
                  "Company";

        const location =
            normalizeText(
                firstValue(
                    nestedJob?.location,
                    nestedJob?.job_location,
                    job?.location,
                    job?.job_location
                )
            ) ||
            "Location not specified";

        const jobType =
            formatJobType(
                firstValue(
                    nestedJob?.job_type,
                    nestedJob?.jobType,
                    nestedJob?.job_type_display,
                    job?.job_type,
                    job?.jobType,
                    job?.job_type_display
                )
            );

        const workMode =
            formatWorkMode(
                firstValue(
                    nestedJob?.work_mode,
                    nestedJob?.workMode,
                    nestedJob?.work_mode_display,
                    job?.work_mode,
                    job?.workMode,
                    job?.work_mode_display
                )
            );

        const experience =
            formatExperience(
                nestedJob
            );

        const salary =
            formatSalary(
                nestedJob
            );

        const skills =
            normalizeSkills(
                firstValue(
                    nestedJob?.skills,
                    nestedJob?.required_skills,
                    job?.skills,
                    job?.required_skills
                )
            );

        const education =
            normalizeText(
                firstValue(
                    nestedJob?.education_details,
                    nestedJob?.education,
                    job?.education_details,
                    job?.education
                )
            );

        const description =
            normalizeText(
                firstValue(
                    nestedJob?.description,
                    job?.description
                )
            ) ||
            "No job description provided.";

        const responsibilities =
            normalizeTextList(
                firstValue(
                    nestedJob?.roles_responsibilities,
                    nestedJob?.responsibilities,
                    nestedJob?.roles,
                    job?.roles_responsibilities,
                    job?.responsibilities,
                    job?.roles
                )
            );

        const features =
            normalizeTextList(
                firstValue(
                    nestedJob?.key_features,
                    nestedJob?.features,
                    job?.key_features,
                    job?.features
                )
            );

        const isActive =
            nestedJob?.is_active !==
                undefined
                ? Boolean(
                      nestedJob.is_active
                  )
                : job?.is_active !==
                  undefined
                ? Boolean(
                      job.is_active
                  )
                : true;

        const status =
            firstValue(
                nestedJob?.status,
                job?.status
            );

        const createdAt =
            firstValue(
                nestedJob?.created_at,
                job?.created_at
            );

        const updatedAt =
            firstValue(
                nestedJob?.updated_at,
                job?.updated_at
            );

        const disabilityJob =
            Boolean(
                firstValue(
                    nestedJob?.is_disability_job,
                    nestedJob?.disability_job,
                    job?.is_disability_job
                )
            );

        return {
            ...job,
            ...nestedJob,

            title,
            company,
            location,
            jobType,
            workMode,
            experience,
            salary,
            skills,
            education,
            description,
            responsibilities,
            features,

            isActive,
            status,
            createdAt,
            updatedAt,
            disabilityJob,
        };
    }, [job]);

    /* =====================================================
       APPLY
    ===================================================== */

    async function submitApplication() {
        if (!jobData) {
            return;
        }

        if (alreadyApplied) {
            setModal({
                type: "warning",
                title: "Already Applied",
                message:
                    "You have already applied for this job.",
            });

            setShowApplyModal(false);

            return;
        }

        const token = getToken();

        if (!token) {
            setModal({
                type: "error",
                title: "Login Required",
                message:
                    "Your session has expired. Please login again.",
            });

            setShowApplyModal(false);

            return;
        }

        setApplying(true);

        try {
            const response =
                await fetch(
                    `${JOBSEEKER_API}/jobs/${requestedJobId}/apply/`,
                    {
                        method: "POST",
                        headers:
                            getAuthHeaders(),
                        body: JSON.stringify({}),
                    }
                );

            const data =
                await parseResponse(
                    response
                );

            console.log(
                "APPLICATION STATUS:",
                response.status
            );

            console.log(
                "APPLICATION RESPONSE:",
                data
            );

            if (
                response.status === 401
            ) {
                clearTokens();

                setShowApplyModal(false);

                setModal({
                    type: "error",
                    title: "Session Expired",
                    message:
                        "Your login session has expired. Please login again.",
                });

                return;
            }

            if (response.ok) {
                const newApplicationId =
                    data?.id ??
                    data?.application_id ??
                    data?.application?.id ??
                    null;

                setAlreadyApplied(true);

                setApplicationId(
                    newApplicationId
                );

                setShowApplyModal(false);

                setModal({
                    type: "success",
                    title:
                        "Application Submitted",
                    message:
                        data?.message ||
                        "Your application has been submitted successfully.",
                });

                return;
            }

            if (
                response.status === 400
            ) {
                const validationValues =
                    typeof data === "object" &&
                    data !== null
                        ? Object.values(data)
                              .flat()
                              .filter(Boolean)
                        : [];

                const errorMessage =
                    data?.message ||
                    data?.detail ||
                    data?.error ||
                    validationValues.join(
                        " "
                    ) ||
                    "Your application could not be submitted.";

                setShowApplyModal(false);

                setModal({
                    type: "warning",
                    title:
                        "Application Not Submitted",
                    message:
                        errorMessage,
                });

                const lowerMessage =
                    String(
                        errorMessage
                    ).toLowerCase();

                if (
                    lowerMessage.includes(
                        "already"
                    ) ||
                    lowerMessage.includes(
                        "applied"
                    )
                ) {
                    setAlreadyApplied(
                        true
                    );
                }

                return;
            }

            if (
                response.status === 403
            ) {
                setShowApplyModal(false);

                setModal({
                    type: "warning",
                    title:
                        "Application Not Allowed",
                    message:
                        data?.detail ||
                        data?.message ||
                        "You are not allowed to apply for this job.",
                });

                return;
            }

            if (
                response.status === 404
            ) {
                setShowApplyModal(false);

                setModal({
                    type: "error",
                    title: "Job Not Found",
                    message:
                        data?.detail ||
                        data?.message ||
                        "This job is no longer available.",
                });

                return;
            }

            setShowApplyModal(false);

            setModal({
                type: "error",
                title: "Application Failed",
                message:
                    data?.message ||
                    data?.detail ||
                    data?.error ||
                    "Unable to submit your application.",
            });
        } catch (err) {
            console.error(
                "APPLICATION SUBMIT ERROR:",
                err
            );

            setShowApplyModal(false);

            setModal({
                type: "error",
                title: "Application Failed",
                message:
                    err?.message ||
                    "Unable to submit your application. Please try again.",
            });
        } finally {
            setApplying(false);
        }
    }

    /* =====================================================
       APPLY BUTTON
    ===================================================== */

    function handleApply() {
        if (!jobData) {
            return;
        }

        if (alreadyApplied) {
            setModal({
                type: "warning",
                title: "Already Applied",
                message:
                    "You have already applied for this job.",
            });

            return;
        }

        if (!jobData.isActive) {
            setModal({
                type: "warning",
                title: "Job Closed",
                message:
                    "This job is no longer accepting applications.",
            });

            return;
        }

        setShowApplyModal(true);
    }

    /* =====================================================
       BACK
    ===================================================== */

    function goBack() {
        navigate("/jobseeker/jobs");
    }

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {
        setModal({
            type: "",
            title: "",
            message: "",
        });
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="jobdetails-page">
                <style>
                    {JOB_DETAILS_STYLES}
                </style>

                <main className="jobdetails-main">
                    <div className="jobdetails-loading">
                        <div className="jobdetails-spinner"></div>

                        <h2>
                            Loading job details...
                        </h2>

                        <p>
                            Please wait while we
                            fetch the opportunity.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error || !jobData) {
        return (
            <div className="jobdetails-page">
                <style>
                    {JOB_DETAILS_STYLES}
                </style>

                <main className="jobdetails-main">
                    <button
                        type="button"
                        className="jobdetails-back"
                        onClick={goBack}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Jobs
                    </button>

                    <div className="jobdetails-error-card">
                        <div className="jobdetails-error-icon">
                            <i className="fa-solid fa-circle-exclamation"></i>
                        </div>

                        <h2>
                            Unable to Load Job
                        </h2>

                        <p>
                            {error ||
                                "This job could not be found."}
                        </p>

                        <div className="jobdetails-error-actions">
                            <button
                                type="button"
                                className="jobdetails-secondary-btn"
                                onClick={goBack}
                            >
                                Back to Jobs
                            </button>

                            <button
                                type="button"
                                className="jobdetails-primary-btn"
                                onClick={loadData}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const companyInitial =
        String(
            jobData.company ||
                "C"
        )
            .charAt(0)
            .toUpperCase();

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="jobdetails-page">
            <style>
                {JOB_DETAILS_STYLES}
            </style>

            <main className="jobdetails-main">

                {/* BACK */}

                <button
                    type="button"
                    className="jobdetails-back"
                    onClick={goBack}
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Jobs
                </button>

                {/* HERO */}

                <section className="jobdetails-hero">

                    <div className="jobdetails-hero-left">

                        <div className="jobdetails-company-logo">
                            {companyInitial}
                        </div>

                        <div className="jobdetails-hero-content">

                            <div className="jobdetails-status-row">

                                {jobData.isActive && (
                                    <span className="jobdetails-active">
                                        <span className="jobdetails-active-dot"></span>
                                        Active
                                    </span>
                                )}

                                {jobData.status && (
                                    <span className="jobdetails-status">
                                        {formatLabel(
                                            jobData.status
                                        )}
                                    </span>
                                )}

                            </div>

                            <h1>
                                {jobData.title}
                            </h1>

                            <p className="jobdetails-company-name">
                                {jobData.company}
                            </p>

                            <div className="jobdetails-hero-meta">

                                <span>
                                    <i className="fa-solid fa-location-dot"></i>
                                    {jobData.location}
                                </span>

                                <span>
                                    <i className="fa-solid fa-briefcase"></i>
                                    {jobData.jobType}
                                </span>

                                <span>
                                    <i className="fa-solid fa-house"></i>
                                    {jobData.workMode}
                                </span>

                                <span>
                                    <i className="fa-solid fa-clock"></i>
                                    {jobData.experience}
                                </span>

                            </div>

                        </div>

                    </div>

                    <div className="jobdetails-hero-action">

                        <button
                            type="button"
                            className={`jobdetails-apply-btn ${
                                alreadyApplied
                                    ? "applied"
                                    : ""
                            }`}
                            onClick={handleApply}
                            disabled={
                                applying ||
                                !jobData.isActive
                            }
                        >
                            <i
                                className={
                                    alreadyApplied
                                        ? "fa-solid fa-check"
                                        : "fa-solid fa-paper-plane"
                                }
                            ></i>

                            {alreadyApplied
                                ? "Already Applied"
                                : "Apply Now"}
                        </button>

                        {alreadyApplied &&
                            applicationId && (
                                <button
                                    type="button"
                                    className="jobdetails-view-application"
                                    onClick={() =>
                                        navigate(
                                            `/jobseeker/applications/${applicationId}`
                                        )
                                    }
                                >
                                    View Application
                                </button>
                            )}

                    </div>

                </section>

                {/* SUMMARY */}

                <section className="jobdetails-summary">

                    <div className="jobdetails-summary-card">

                        <div className="jobdetails-summary-icon">
                            <i className="fa-solid fa-indian-rupee-sign"></i>
                        </div>

                        <div>
                            <span>
                                Salary
                            </span>

                            <strong>
                                {jobData.salary}
                            </strong>
                        </div>

                    </div>

                    <div className="jobdetails-summary-card">

                        <div className="jobdetails-summary-icon">
                            <i className="fa-solid fa-user-tie"></i>
                        </div>

                        <div>
                            <span>
                                Experience
                            </span>

                            <strong>
                                {jobData.experience}
                            </strong>
                        </div>

                    </div>

                    <div className="jobdetails-summary-card">

                        <div className="jobdetails-summary-icon">
                            <i className="fa-solid fa-building"></i>
                        </div>

                        <div>
                            <span>
                                Work Mode
                            </span>

                            <strong>
                                {jobData.workMode}
                            </strong>
                        </div>

                    </div>

                    <div className="jobdetails-summary-card">

                        <div className="jobdetails-summary-icon">
                            <i className="fa-regular fa-clock"></i>
                        </div>

                        <div>
                            <span>
                                Posted
                            </span>

                            <strong>
                                {formatPostedDate(
                                    jobData.createdAt
                                )}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* CONTENT */}

                <div className="jobdetails-grid">

                    {/* LEFT */}

                    <div className="jobdetails-content">

                        {/* DESCRIPTION */}

                        <section className="jobdetails-section">

                            <h2>
                                <span>
                                    <i className="fa-solid fa-file-lines"></i>
                                </span>

                                Job Description
                            </h2>

                            <div className="jobdetails-text">
                                {jobData.description}
                            </div>

                        </section>

                        {/* RESPONSIBILITIES */}

                        {jobData.responsibilities.length >
                            0 && (
                            <section className="jobdetails-section">

                                <h2>
                                    <span>
                                        <i className="fa-solid fa-list-check"></i>
                                    </span>

                                    Roles & Responsibilities
                                </h2>

                                <ul className="jobdetails-list">

                                    {jobData.responsibilities.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <li
                                                key={`responsibility-${index}`}
                                            >
                                                <i className="fa-solid fa-check"></i>

                                                <span>
                                                    {item}
                                                </span>
                                            </li>
                                        )
                                    )}

                                </ul>

                            </section>
                        )}

                        {/* KEY FEATURES */}

                        {jobData.features.length >
                            0 && (
                            <section className="jobdetails-section">

                                <h2>
                                    <span>
                                        <i className="fa-solid fa-star"></i>
                                    </span>

                                    Key Features
                                </h2>

                                <ul className="jobdetails-list">

                                    {jobData.features.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <li
                                                key={`feature-${index}`}
                                            >
                                                <i className="fa-solid fa-circle-check"></i>

                                                <span>
                                                    {item}
                                                </span>
                                            </li>
                                        )
                                    )}

                                </ul>

                            </section>
                        )}

                        {/* EDUCATION */}

                        {jobData.education && (
                            <section className="jobdetails-section">

                                <h2>
                                    <span>
                                        <i className="fa-solid fa-graduation-cap"></i>
                                    </span>

                                    Education
                                </h2>

                                <div className="jobdetails-text">
                                    {jobData.education}
                                </div>

                            </section>
                        )}

                        {/* SKILLS */}

                        {jobData.skills.length >
                            0 && (
                            <section className="jobdetails-section">

                                <h2>
                                    <span>
                                        <i className="fa-solid fa-code"></i>
                                    </span>

                                    Skills Required
                                </h2>

                                <div className="jobdetails-skills">

                                    {jobData.skills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={`skill-${index}`}
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}

                                </div>

                            </section>
                        )}

                        {/* DISABILITY JOB */}

                        <section className="jobdetails-section">

                            <h2>
                                <span>
                                    <i className="fa-solid fa-universal-access"></i>
                                </span>

                                Accessibility
                            </h2>

                            <div className="jobdetails-accessibility">

                                <div>
                                    <strong>
                                        Disability-Friendly Job
                                    </strong>

                                    <span>
                                        {jobData.disabilityJob
                                            ? "Yes"
                                            : "No"}
                                    </span>
                                </div>

                            </div>

                        </section>

                    </div>

                    {/* RIGHT */}

                    <aside className="jobdetails-sidebar">

                        {/* APPLY CARD */}

                        <div className="jobdetails-apply-card">

                            <h3>
                                Interested in this role?
                            </h3>

                            <p>
                                Take the next step
                                and submit your
                                application.
                            </p>

                            <button
                                type="button"
                                className={`jobdetails-sidebar-apply ${
                                    alreadyApplied
                                        ? "applied"
                                        : ""
                                }`}
                                onClick={handleApply}
                                disabled={
                                    applying ||
                                    !jobData.isActive
                                }
                            >
                                <i
                                    className={
                                        alreadyApplied
                                            ? "fa-solid fa-check"
                                            : "fa-solid fa-paper-plane"
                                    }
                                ></i>

                                {alreadyApplied
                                    ? "Already Applied"
                                    : "Apply Now"}
                            </button>

                            {alreadyApplied &&
                                applicationId && (
                                    <button
                                        type="button"
                                        className="jobdetails-sidebar-view"
                                        onClick={() =>
                                            navigate(
                                                `/jobseeker/applications/${applicationId}`
                                            )
                                        }
                                    >
                                        View Application
                                    </button>
                                )}

                        </div>

                        {/* JOB INFORMATION */}

                        <div className="jobdetails-info-card">

                            <h3>
                                Job Information
                            </h3>

                            <div className="jobdetails-info-row">
                                <span>
                                    Job Type
                                </span>

                                <strong>
                                    {jobData.jobType}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Work Mode
                                </span>

                                <strong>
                                    {jobData.workMode}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Experience
                                </span>

                                <strong>
                                    {jobData.experience}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Location
                                </span>

                                <strong>
                                    {jobData.location}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Salary
                                </span>

                                <strong>
                                    {jobData.salary}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Education
                                </span>

                                <strong>
                                    {jobData.education ||
                                        "Not specified"}
                                </strong>
                            </div>

                            <div className="jobdetails-info-row">
                                <span>
                                    Disability Job
                                </span>

                                <strong>
                                    {jobData.disabilityJob
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                        </div>

                        {/* POSTED */}

                        <div className="jobdetails-posted-card">

                            <i className="fa-regular fa-clock"></i>

                            <div>

                                <strong>
                                    {formatPostedDate(
                                        jobData.createdAt
                                    )}
                                </strong>

                                <span>
                                    Last updated{" "}
                                    {jobData.updatedAt
                                        ? new Date(
                                              jobData.updatedAt
                                          ).toLocaleDateString(
                                              "en-IN",
                                              {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric",
                                              }
                                          )
                                        : "recently"}
                                </span>

                            </div>

                        </div>

                    </aside>

                </div>

            </main>

            {/* =================================================
                APPLY CONFIRMATION MODAL
            ================================================= */}

            {showApplyModal && (
                <div
                    className="jobdetails-modal-overlay"
                    onClick={() => {
                        if (!applying) {
                            setShowApplyModal(
                                false
                            );
                        }
                    }}
                >
                    <div
                        className="jobdetails-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="jobdetails-modal-icon">
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>

                        <h2>
                            Apply for this job?
                        </h2>

                        <p>
                            You are applying for{" "}
                            <strong>
                                {jobData.title}
                            </strong>
                            .
                        </p>

                        <p className="jobdetails-modal-note">
                            Make sure your profile and
                            resume are up to date before
                            submitting your application.
                        </p>

                        <div className="jobdetails-modal-actions">

                            <button
                                type="button"
                                className="jobdetails-modal-cancel"
                                disabled={applying}
                                onClick={() =>
                                    setShowApplyModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="jobdetails-modal-confirm"
                                disabled={applying}
                                onClick={
                                    submitApplication
                                }
                            >
                                {applying ? (
                                    <>
                                        <span className="jobdetails-button-spinner"></span>
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane"></i>
                                        Confirm Apply
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* =================================================
                RESULT MODAL
            ================================================= */}

            {modal.title && (
                <div
                    className="jobdetails-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="jobdetails-result-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div
                            className={`jobdetails-result-icon ${modal.type}`}
                        >
                            <i
                                className={
                                    modal.type ===
                                    "success"
                                        ? "fa-solid fa-check"
                                        : modal.type ===
                                          "warning"
                                        ? "fa-solid fa-triangle-exclamation"
                                        : "fa-solid fa-circle-exclamation"
                                }
                            ></i>
                        </div>

                        <h2>
                            {modal.title}
                        </h2>

                        <p>
                            {modal.message}
                        </p>

                        <button
                            type="button"
                            className="jobdetails-result-btn"
                            onClick={closeModal}
                        >
                            OK
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}

/* =========================================================
   STYLES
========================================================= */

const JOB_DETAILS_STYLES = `

.jobdetails-page {
    --blue: #2563eb;
    --blue-light: #3b82f6;
    --blue-soft: #eff6ff;

    --green: #16a34a;
    --red: #dc2626;

    --white: #ffffff;
    --text: #0f172a;
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

.jobdetails-page *,
.jobdetails-page *::before,
.jobdetails-page *::after {
    box-sizing: border-box;
}

/* =========================================================
   MAIN
========================================================= */

.jobdetails-main {
    width: 100%;
    max-width: 1380px;

    margin: 0 auto;

    padding:
        28px
        34px
        60px;
}

/* =========================================================
   BACK
========================================================= */

.jobdetails-back {
    display: inline-flex;
    align-items: center;

    gap: 8px;

    border: none;
    background: transparent;

    color: var(--text-soft);

    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;

    cursor: pointer;

    padding: 6px 0;
    margin-bottom: 18px;

    transition:
        color 0.2s ease,
        transform 0.2s ease;
}

.jobdetails-back:hover {
    color: var(--blue);

    transform:
        translateX(-2px);
}

/* =========================================================
   HERO
========================================================= */

.jobdetails-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 25px;

    padding: 28px;

    background:
        linear-gradient(
            135deg,
            #05070b 0%,
            #0f172a 60%,
            #111827 100%
        );

    border-radius: 20px;

    border:
        1px solid
        #1e293b;

    box-shadow:
        0 18px 45px
        rgba(
            15,
            23,
            42,
            0.18
        );
}

.jobdetails-hero-left {
    display: flex;
    align-items: flex-start;

    gap: 18px;

    min-width: 0;
}

.jobdetails-company-logo {
    width: 70px;
    height: 70px;

    flex-shrink: 0;

    border-radius: 18px;

    display: flex;
    align-items: center;
    justify-content: center;

    background:
        linear-gradient(
            135deg,
            #dbeafe,
            #eff6ff
        );

    color: var(--blue);

    font-size: 1.65rem;
    font-weight: 900;
}

.jobdetails-hero-content {
    min-width: 0;
}

.jobdetails-status-row {
    display: flex;
    flex-wrap: wrap;

    gap: 7px;

    margin-bottom: 9px;
}

.jobdetails-active,
.jobdetails-status {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    padding:
        5px
        9px;

    border-radius: 999px;

    font-size: 0.64rem;
    font-weight: 800;
}

.jobdetails-active {
    background:
        rgba(
            34,
            197,
            94,
            0.12
        );

    color:
        #86efac;

    border:
        1px solid
        rgba(
            34,
            197,
            94,
            0.22
        );
}

.jobdetails-status {
    background:
        rgba(
            255,
            255,
            255,
            0.08
        );

    color:
        #cbd5e1;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            0.1
        );
}

.jobdetails-active-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background: #4ade80;
}

.jobdetails-hero h1 {
    margin: 0;

    color: #ffffff;

    font-size:
        clamp(
            1.45rem,
            3vw,
            2.25rem
        );

    line-height: 1.2;

    letter-spacing: -0.035em;
}

.jobdetails-company-name {
    margin:
        7px
        0
        0;

    color: #cbd5e1;

    font-size: 0.82rem;
    font-weight: 600;
}

.jobdetails-hero-meta {
    display: flex;
    flex-wrap: wrap;

    gap: 12px 18px;

    margin-top: 16px;
}

.jobdetails-hero-meta span {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    color: #94a3b8;

    font-size: 0.68rem;
    font-weight: 600;
}

.jobdetails-hero-meta i {
    color: #60a5fa;
}

/* =========================================================
   HERO ACTION
========================================================= */

.jobdetails-hero-action {
    flex-shrink: 0;

    min-width: 180px;
}

.jobdetails-apply-btn {
    width: 100%;

    min-height: 48px;

    border: none;

    border-radius: 10px;

    background: var(--blue);
    color: #ffffff;

    font-family: inherit;

    font-size: 0.8rem;
    font-weight: 800;

    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.jobdetails-apply-btn:hover:not(:disabled) {
    background: var(--blue-light);

    transform:
        translateY(-1px);

    box-shadow:
        0 8px 22px
        rgba(
            37,
            99,
            235,
            0.35
        );
}

.jobdetails-apply-btn.applied {
    background: #166534;
    cursor: default;
}

.jobdetails-apply-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.jobdetails-view-application {
    width: 100%;

    margin-top: 8px;

    border:
        1px solid
        #334155;

    background:
        rgba(
            255,
            255,
            255,
            0.05
        );

    color: #cbd5e1;

    border-radius: 9px;

    min-height: 40px;

    font-family: inherit;

    font-size: 0.68rem;
    font-weight: 700;

    cursor: pointer;
}

/* =========================================================
   SUMMARY
========================================================= */

.jobdetails-summary {
    display: grid;

    grid-template-columns:
        repeat(
            4,
            minmax(
                0,
                1fr
            )
        );

    gap: 13px;

    margin-top: 16px;
}

.jobdetails-summary-card {
    display: flex;
    align-items: center;

    gap: 11px;

    padding: 15px;

    background: #ffffff;

    border:
        1px solid
        var(--line);

    border-radius: 13px;
}

.jobdetails-summary-icon {
    width: 38px;
    height: 38px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    background: var(--blue-soft);
    color: var(--blue);

    font-size: 0.8rem;
}

.jobdetails-summary-card span {
    display: block;

    color: #94a3b8;

    font-size: 0.62rem;

    margin-bottom: 4px;
}

.jobdetails-summary-card strong {
    display: block;

    color: var(--text);

    font-size: 0.74rem;

    line-height: 1.35;
}

/* =========================================================
   GRID
========================================================= */

.jobdetails-grid {
    display: grid;

    grid-template-columns:
        minmax(
            0,
            1fr
        )
        310px;

    gap: 18px;

    margin-top: 18px;

    align-items: start;
}

.jobdetails-content {
    min-width: 0;
}

/* =========================================================
   SECTION
========================================================= */

.jobdetails-section {
    padding: 23px;

    background: #ffffff;

    border:
        1px solid
        var(--line);

    border-radius: 15px;

    margin-bottom: 15px;
}

.jobdetails-section h2 {
    display: flex;
    align-items: center;

    gap: 9px;

    margin:
        0
        0
        16px;

    color: var(--text);

    font-size: 0.98rem;

    letter-spacing: -0.015em;
}

.jobdetails-section h2 span {
    width: 31px;
    height: 31px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 8px;

    background: var(--blue-soft);
    color: var(--blue);

    font-size: 0.72rem;
}

.jobdetails-text {
    color: #475569;

    font-size: 0.78rem;

    line-height: 1.75;

    white-space: pre-line;
}

/* =========================================================
   LIST
========================================================= */

.jobdetails-list {
    list-style: none;

    margin: 0;
    padding: 0;

    display: flex;

    flex-direction: column;

    gap: 11px;
}

.jobdetails-list li {
    display: flex;

    align-items: flex-start;

    gap: 9px;

    color: #475569;

    font-size: 0.77rem;

    line-height: 1.65;
}

.jobdetails-list li i {
    flex-shrink: 0;

    margin-top: 4px;

    color: var(--blue);

    font-size: 0.65rem;
}

/* =========================================================
   SKILLS
========================================================= */

.jobdetails-skills {
    display: flex;

    flex-wrap: wrap;

    gap: 7px;
}

.jobdetails-skills span {
    padding:
        7px
        10px;

    border-radius: 7px;

    background: var(--blue-soft);

    color: var(--blue);

    font-size: 0.68rem;

    font-weight: 700;

    border:
        1px solid
        #dbeafe;
}

/* =========================================================
   ACCESSIBILITY
========================================================= */

.jobdetails-accessibility {
    display: flex;
}

.jobdetails-accessibility > div {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    padding: 13px 15px;

    background: #f8fafc;

    border:
        1px solid
        #e2e8f0;

    border-radius: 10px;
}

.jobdetails-accessibility strong {
    color: #334155;

    font-size: 0.74rem;
}

.jobdetails-accessibility span {
    padding:
        5px
        10px;

    border-radius: 999px;

    background: #eff6ff;

    color: var(--blue);

    font-size: 0.66rem;

    font-weight: 800;
}

/* =========================================================
   SIDEBAR
========================================================= */

.jobdetails-sidebar {
    position: sticky;

    top: 20px;

    display: flex;

    flex-direction: column;

    gap: 13px;
}

.jobdetails-apply-card {
    padding: 21px;

    background:
        linear-gradient(
            135deg,
            #eff6ff,
            #ffffff
        );

    border:
        1px solid
        #bfdbfe;

    border-radius: 15px;
}

.jobdetails-apply-card h3 {
    margin: 0;

    font-size: 0.95rem;
}

.jobdetails-apply-card p {
    margin:
        8px
        0
        15px;

    color: var(--text-soft);

    font-size: 0.72rem;

    line-height: 1.55;
}

.jobdetails-sidebar-apply {
    width: 100%;

    min-height: 44px;

    border: none;

    border-radius: 9px;

    background: var(--blue);
    color: #ffffff;

    font-family: inherit;

    font-size: 0.74rem;
    font-weight: 800;

    cursor: pointer;
}

.jobdetails-sidebar-apply:hover:not(:disabled) {
    background: var(--blue-light);
}

.jobdetails-sidebar-apply.applied {
    background: #166534;
}

.jobdetails-sidebar-apply:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.jobdetails-sidebar-view {
    width: 100%;

    margin-top: 8px;

    min-height: 39px;

    border:
        1px solid
        #bfdbfe;

    border-radius: 8px;

    background: #ffffff;

    color: var(--blue);

    font-family: inherit;

    font-size: 0.68rem;
    font-weight: 700;

    cursor: pointer;
}

/* =========================================================
   INFO
========================================================= */

.jobdetails-info-card {
    padding: 20px;

    background: #ffffff;

    border:
        1px solid
        var(--line);

    border-radius: 15px;
}

.jobdetails-info-card h3 {
    margin:
        0
        0
        13px;

    font-size: 0.9rem;
}

.jobdetails-info-row {
    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 12px;

    padding:
        11px
        0;

    border-top:
        1px solid
        #f1f5f9;
}

.jobdetails-info-row:first-of-type {
    border-top: none;
}

.jobdetails-info-row span {
    color: #94a3b8;

    font-size: 0.67rem;
}

.jobdetails-info-row strong {
    color: #334155;

    font-size: 0.68rem;

    text-align: right;

    max-width: 65%;

    word-break: break-word;
}

/* =========================================================
   POSTED
========================================================= */

.jobdetails-posted-card {
    display: flex;

    align-items: center;

    gap: 11px;

    padding: 15px;

    background: #ffffff;

    border:
        1px solid
        var(--line);

    border-radius: 13px;
}

.jobdetails-posted-card > i {
    width: 35px;
    height: 35px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 9px;

    background: #f8fafc;

    color: var(--blue);

    font-size: 0.76rem;
}

.jobdetails-posted-card strong {
    display: block;

    font-size: 0.69rem;

    margin-bottom: 3px;
}

.jobdetails-posted-card span {
    display: block;

    color: #94a3b8;

    font-size: 0.6rem;
}

/* =========================================================
   LOADING
========================================================= */

.jobdetails-loading {
    min-height: 70vh;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;
}

.jobdetails-spinner {
    width: 38px;
    height: 38px;

    border:
        3px solid
        #dbeafe;

    border-top-color:
        var(--blue);

    border-radius: 50%;

    animation:
        jobdetailsSpin
        0.8s
        linear
        infinite;

    margin-bottom: 14px;
}

@keyframes jobdetailsSpin {
    to {
        transform:
            rotate(360deg);
    }
}

.jobdetails-loading h2 {
    margin:
        0
        0
        6px;

    font-size: 1rem;
}

.jobdetails-loading p {
    margin: 0;

    color: var(--text-soft);

    font-size: 0.74rem;
}

/* =========================================================
   ERROR
========================================================= */

.jobdetails-error-card {
    max-width: 600px;

    margin:
        80px
        auto;

    padding: 35px;

    text-align: center;

    background: #ffffff;

    border:
        1px solid
        var(--line);

    border-radius: 17px;

    box-shadow:
        0 12px 35px
        rgba(
            15,
            23,
            42,
            0.07
        );
}

.jobdetails-error-icon {
    width: 55px;
    height: 55px;

    margin:
        0
        auto
        15px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #fef2f2;

    color: var(--red);

    font-size: 1.1rem;
}

.jobdetails-error-card h2 {
    margin:
        0
        0
        8px;

    font-size: 1.15rem;
}

.jobdetails-error-card p {
    margin:
        0
        0
        20px;

    color: var(--text-soft);

    font-size: 0.76rem;

    line-height: 1.6;
}

.jobdetails-error-actions {
    display: flex;

    justify-content: center;

    gap: 9px;
}

.jobdetails-secondary-btn,
.jobdetails-primary-btn {
    min-height: 40px;

    padding:
        0
        15px;

    border-radius: 8px;

    font-family: inherit;

    font-size: 0.7rem;
    font-weight: 700;

    cursor: pointer;
}

.jobdetails-secondary-btn {
    border:
        1px solid
        var(--line);

    background: #ffffff;

    color: var(--text-soft);
}

.jobdetails-primary-btn {
    border: none;

    background: var(--blue);

    color: #ffffff;
}

/* =========================================================
   MODAL
========================================================= */

.jobdetails-modal-overlay {
    position: fixed;

    inset: 0;

    z-index: 9999;

    display: flex;

    align-items: center;
    justify-content: center;

    padding: 20px;

    background:
        rgba(
            15,
            23,
            42,
            0.55
        );

    backdrop-filter:
        blur(4px);
}

.jobdetails-modal,
.jobdetails-result-modal {
    width: 100%;

    max-width: 440px;

    padding: 27px;

    border-radius: 17px;

    background: #ffffff;

    box-shadow:
        0 25px 70px
        rgba(
            15,
            23,
            42,
            0.25
        );

    text-align: center;
}

.jobdetails-modal-icon,
.jobdetails-result-icon {
    width: 52px;
    height: 52px;

    margin:
        0
        auto
        14px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: var(--blue-soft);

    color: var(--blue);

    font-size: 1rem;
}

.jobdetails-result-icon.success {
    background: #f0fdf4;
    color: #16a34a;
}

.jobdetails-result-icon.warning {
    background: #fffbeb;
    color: #d97706;
}

.jobdetails-result-icon.error {
    background: #fef2f2;
    color: #dc2626;
}

.jobdetails-modal h2,
.jobdetails-result-modal h2 {
    margin:
        0
        0
        9px;

    font-size: 1.05rem;
}

.jobdetails-modal p,
.jobdetails-result-modal p {
    margin:
        0
        auto;

    color: var(--text-soft);

    font-size: 0.75rem;

    line-height: 1.6;
}

.jobdetails-modal-note {
    margin-top: 8px !important;

    font-size: 0.68rem !important;

    color: #94a3b8 !important;
}

.jobdetails-modal-actions {
    display: flex;

    gap: 9px;

    margin-top: 21px;
}

.jobdetails-modal-cancel,
.jobdetails-modal-confirm,
.jobdetails-result-btn {
    flex: 1;

    min-height: 42px;

    border-radius: 8px;

    font-family: inherit;

    font-size: 0.7rem;
    font-weight: 800;

    cursor: pointer;
}

.jobdetails-modal-cancel {
    border:
        1px solid
        var(--line);

    background: #ffffff;

    color: var(--text-soft);
}

.jobdetails-modal-confirm,
.jobdetails-result-btn {
    border: none;

    background: var(--blue);

    color: #ffffff;
}

.jobdetails-modal-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.jobdetails-button-spinner {
    width: 13px;
    height: 13px;

    display: inline-block;

    margin-right: 6px;

    vertical-align: -2px;

    border:
        2px solid
        rgba(
            255,
            255,
            255,
            0.35
        );

    border-top-color:
        #ffffff;

    border-radius: 50%;

    animation:
        jobdetailsSpin
        0.7s
        linear
        infinite;
}

.jobdetails-result-btn {
    width: 100%;

    margin-top: 20px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1050px) {

    .jobdetails-summary {
        grid-template-columns:
            repeat(
                2,
                minmax(
                    0,
                    1fr
                )
            );
    }

    .jobdetails-grid {
        grid-template-columns:
            minmax(
                0,
                1fr
            );
    }

    .jobdetails-sidebar {
        position: static;

        display: grid;

        grid-template-columns:
            repeat(
                2,
                minmax(
                    0,
                    1fr
                )
            );
    }

    .jobdetails-apply-card {
        grid-column: 1 / -1;
    }
}

@media (max-width: 750px) {

    .jobdetails-main {
        padding:
            20px
            16px
            45px;
    }

    .jobdetails-hero {
        flex-direction: column;

        align-items: stretch;

        padding: 21px;
    }

    .jobdetails-hero-action {
        width: 100%;
    }

    .jobdetails-hero-left {
        width: 100%;
    }

    .jobdetails-summary {
        grid-template-columns:
            1fr
            1fr;
    }

    .jobdetails-sidebar {
        grid-template-columns: 1fr;
    }

    .jobdetails-apply-card {
        grid-column: auto;
    }
}

@media (max-width: 520px) {

    .jobdetails-main {
        padding:
            16px
            12px
            35px;
    }

    .jobdetails-hero {
        border-radius: 15px;

        padding: 17px;
    }

    .jobdetails-hero-left {
        gap: 12px;
    }

    .jobdetails-company-logo {
        width: 52px;
        height: 52px;

        border-radius: 13px;

        font-size: 1.2rem;
    }

    .jobdetails-hero h1 {
        font-size: 1.3rem;
    }

    .jobdetails-hero-meta {
        flex-direction: column;

        gap: 7px;
    }

    .jobdetails-summary {
        grid-template-columns: 1fr;
    }

    .jobdetails-section {
        padding: 17px;
    }

    .jobdetails-error-actions {
        flex-direction: column;
    }

    .jobdetails-modal {
        padding: 22px;
    }

    .jobdetails-accessibility > div {
        flex-direction: column;
        align-items: flex-start;
    }
}

`;

export default JobDetails;