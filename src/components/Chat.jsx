import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const EMPLOYER_API = `${API_BASE}/auth/employer`;

/*
 * Employer and jobseeker use the same chat backend.
 * JWT determines the logged-in user.
 */
const CHAT_API = `${API_BASE}/auth/jobseeker/chat`;


/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}


/* =========================================================
   CLEAR AUTH
========================================================= */

function clearAuth() {
    const keys = [
        "jc_token",
        "refresh_token",
        "jc_user",
        "user",
        "access_token",
        "accessToken",
        "access",
        "token",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


/* =========================================================
   AUTH HEADERS
========================================================= */

function getHeaders() {
    const token = getToken();

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };
}


/* =========================================================
   JSON FETCH HELPER
========================================================= */

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {}),
        },
    });

    let data = {};

    try {
        const text = await response.text();

        if (text) {
            data = JSON.parse(text);
        }
    } catch {
        data = {};
    }

    if (response.status === 401) {
        const error = new Error("UNAUTHORIZED");
        error.status = 401;
        error.data = data;
        throw error;
    }

    if (!response.ok) {
        const message =
            data?.detail ||
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;

        const error = new Error(message);
        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


/* =========================================================
   ARRAY NORMALIZER
========================================================= */

function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    if (Array.isArray(value?.data)) {
        return value.data;
    }

    if (Array.isArray(value?.items)) {
        return value.items;
    }

    if (Array.isArray(value?.conversations)) {
        return value.conversations;
    }

    if (Array.isArray(value?.messages)) {
        return value.messages;
    }

    if (Array.isArray(value?.applicants)) {
        return value.applicants;
    }

    if (Array.isArray(value?.jobs)) {
        return value.jobs;
    }

    return [];
}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(status) {
    return String(status || "APPLIED")
        .trim()
        .toUpperCase();
}


function getStatusClass(status) {
    switch (normalizeStatus(status)) {
        case "APPLIED":
            return "status-applied";

        case "UNDER REVIEW":
        case "UNDER_REVIEW":
            return "status-review";

        case "SHORTLISTED":
            return "status-shortlisted";

        case "INTERVIEW SCHEDULED":
        case "INTERVIEW_SCHEDULED":
            return "status-interview";

        case "REJECTED":
            return "status-rejected";

        case "HIRED":
            return "status-hired";

        default:
            return "status-default";
    }
}


function getStatusLabel(status) {
    switch (normalizeStatus(status)) {
        case "APPLIED":
            return "Applied";

        case "UNDER REVIEW":
        case "UNDER_REVIEW":
            return "Under Review";

        case "SHORTLISTED":
            return "Shortlisted";

        case "INTERVIEW SCHEDULED":
        case "INTERVIEW_SCHEDULED":
            return "Interview Scheduled";

        case "REJECTED":
            return "Rejected";

        case "HIRED":
            return "Hired";

        default:
            return status || "Applied";
    }
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
    if (!value) {
        return "";
    }

    try {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "";
    }
}


/* =========================================================
   CANDIDATE NORMALIZATION
========================================================= */

function getJobseekerFromApplicant(applicant) {
    if (!applicant) {
        return null;
    }

    return (
        applicant.jobseeker ||
        applicant.jobseeker_profile ||
        applicant.jobseekerProfile ||
        applicant.candidate ||
        applicant.profile ||
        applicant.user?.jobseeker_profile ||
        applicant.user?.jobseeker ||
        null
    );
}


function getJobseekerId(applicant) {
    const jobseeker = getJobseekerFromApplicant(applicant);

    /*
     * IMPORTANT:
     *
     * For grouping and chat:
     * use JOBSEEKER PROFILE ID.
     *
     * Do NOT use applicant.id here.
     */
    const id =
        jobseeker?.id ??
        jobseeker?.profile_id ??
        applicant?.jobseeker_id ??
        applicant?.jobseeker_profile_id ??
        applicant?.candidate_id;

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {
        return null;
    }

    return Number(id);
}


function getCandidateName(applicant) {
    const jobseeker = getJobseekerFromApplicant(applicant);

    return (
        applicant?.jobseeker_name ||
        jobseeker?.full_name ||
        jobseeker?.name ||
        jobseeker?.display_name ||
        applicant?.name ||
        applicant?.user?.full_name ||
        applicant?.user?.name ||
        "Applicant"
    );
}


function getStringValue(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);

    if (value && typeof value === "object") {
        return (
            value.company_name ||
            value.name ||
            value.title ||
            value.full_name ||
            ""
        );
    }

    return "";
}

function getCompanyName(conversation) {
    if (!conversation) return "";

    const values = [
        conversation.company_name,
        conversation.company,
        conversation.employer_company_name,
        conversation.employer?.company_name,
        conversation.employer?.company,
        conversation.employer_profile?.company_name,
        conversation.employer_profile?.company,
        conversation.participant?.company_name,
        conversation.participant?.company,
        conversation.participant_profile?.company_name,
        conversation.participant_profile?.company,
        conversation.other_user?.company_name,
        conversation.other_user?.company,
        conversation.company_profile?.company_name,
        conversation.company_profile?.name,
    ];

    for (const value of values) {
        const result = getStringValue(value);
        if (result) return result;
    }

    return "";
}

function getCurrentUserId() {
    const keys = ["jc_user", "user"];

    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const user = JSON.parse(raw);
            const id =
                user?.id ??
                user?.user_id ??
                user?.profile_id ??
                user?.jobseeker?.id ??
                user?.employer?.id;

            if (id !== null && id !== undefined && id !== "") {
                return Number(id);
            }
        } catch {
            // Ignore invalid local storage values.
        }
    }

    return null;
}

/* =========================================================
   COMPONENT
========================================================= */

function Chat() {
    const location = useLocation();
    const navigate = useNavigate();

    const isEmployer = location.pathname.startsWith("/employer");

    const [activeTab, setActiveTab] = useState(
        isEmployer ? "applicants" : "messages"
    );

    const [applicants, setApplicants] = useState([]);

    const [conversations, setConversations] = useState([]);

    const [selectedConversationId, setSelectedConversationId] =
        useState(null);

    const [messages, setMessages] = useState([]);

    const [messageText, setMessageText] = useState("");

    const [loadingApplicants, setLoadingApplicants] =
        useState(false);

    const [loadingConversations, setLoadingConversations] =
        useState(false);

    const [loadingMessages, setLoadingMessages] =
        useState(false);

    const [sending, setSending] = useState(false);

    const [openingConversation, setOpeningConversation] =
        useState(false);

    const [error, setError] = useState("");

    const [mobileChatOpen, setMobileChatOpen] =
        useState(false);

    const [messageNotification, setMessageNotification] =
        useState(null);

    const messagesEndRef = useRef(null);
    const previousConversationsRef = useRef([]);
    const conversationsInitializedRef = useRef(false);
    const notificationTimerRef = useRef(null);

    const conversationRequestRef = useRef(false);
    const applicantRequestRef = useRef(false);

    const queryParams = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const requestedJobseekerId = queryParams.get(
        "jobseeker"
    );

    const requestedEmployerId = queryParams.get(
        "employer"
    );


    /* =====================================================
       REDIRECT UNAUTHENTICATED
    ===================================================== */

    useEffect(() => {
        if (!getToken()) {
            clearAuth();

            navigate("/login", {
                replace: true,
            });
        }
    }, [navigate]);


    /* =====================================================
       GROUP APPLICANTS BY JOBSEEKER
    ===================================================== */

    const groupedApplicants = useMemo(() => {
        const groups = new Map();

        applicants.forEach((item) => {
            const applicant = item.applicant || item;
            const job = item.job || {};

            const personId = getJobseekerId(applicant);

            /*
             * If the API somehow doesn't provide the nested
             * jobseeker ID, don't group using application.id.
             *
             * That would incorrectly create one person per
             * application.
             */
            if (!personId) {
                console.warn(
                    "Applicant does not contain jobseeker profile ID:",
                    applicant
                );

                return;
            }

            const name = getCandidateName(applicant);

            const applicationId =
                applicant?.id ??
                applicant?.application_id ??
                null;

            const jobId =
                job?.id ??
                applicant?.job_id ??
                null;

            const jobTitle =
                job?.title ||
                applicant?.job_title ||
                applicant?.position ||
                "Job";

            const status =
                applicant?.status ||
                "APPLIED";

            const appliedAt =
                applicant?.created_at ||
                applicant?.applied_at ||
                applicant?.application_date ||
                applicant?.date_applied ||
                null;

            const disabilityType =
                applicant?.disability_type ||
                getJobseekerFromApplicant(applicant)
                    ?.disability_type ||
                "";

            if (!groups.has(String(personId))) {
                groups.set(String(personId), {
                    personId,
                    name,
                    disabilityType,
                    applications: [],
                });
            }

            const person = groups.get(
                String(personId)
            );

            /*
             * Avoid accidentally inserting the same application
             * twice if polling/data contains duplicates.
             */
            const alreadyExists =
                person.applications.some(
                    (application) =>
                        String(application.applicationId) ===
                        String(applicationId)
                );

            if (!alreadyExists) {
                person.applications.push({
                    applicationId,
                    jobId,
                    jobTitle,
                    status,
                    appliedAt,
                    disabilityType,
                });
            }
        });

        const result = Array.from(groups.values());

        result.forEach((person) => {
            person.applications.sort((a, b) => {
                const dateA = a.appliedAt
                    ? new Date(a.appliedAt).getTime()
                    : 0;

                const dateB = b.appliedAt
                    ? new Date(b.appliedAt).getTime()
                    : 0;

                return dateB - dateA;
            });
        });

        result.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                undefined,
                {
                    sensitivity: "base",
                }
            )
        );

        return result;
    }, [applicants]);


    /* =====================================================
       TOTAL APPLICATIONS
    ===================================================== */

    const totalApplications = applicants.length;


    /* =====================================================
       TOTAL PEOPLE
    ===================================================== */

    const totalCandidates = groupedApplicants.length;


    /* =====================================================
       UNREAD CONVERSATIONS
    ===================================================== */

    const totalUnread = useMemo(() => {
        return conversations.reduce(
            (total, conversation) => {
                const unread =
                    Number(
                        conversation?.unread_count ??
                        conversation?.unreadCount ??
                        conversation?.unread ??
                        0
                    ) || 0;

                return total + unread;
            },
            0
        );
    }, [conversations]);


    /* =====================================================
       LOAD EMPLOYER APPLICANTS
    ===================================================== */

    const loadApplicants = useCallback(
        async (silent = false) => {
            if (!isEmployer) {
                return;
            }

            if (applicantRequestRef.current) {
                return;
            }

            const token = getToken();

            if (!token) {
                return;
            }

            applicantRequestRef.current = true;

            try {
                if (!silent) {
                    setLoadingApplicants(true);
                }

                setError("");

                /*
                 * First get employer dashboard so we know all
                 * employer jobs.
                 */
                const dashboard =
                    await fetchJSON(
                        `${EMPLOYER_API}/dashboard/`
                    );

                const jobs = toArray(
                    dashboard?.jobs
                );

                console.log(
                    "CHAT EMPLOYER JOBS:",
                    jobs
                );

                /*
                 * Get applicants for every job.
                 *
                 * Your actual endpoint is:
                 *
                 * /api/auth/employer/jobs/<jobId>/applicants/
                 */
                const responses =
                    await Promise.all(
                        jobs.map(async (job) => {
                            try {
                                const data =
                                    await fetchJSON(
                                        `${EMPLOYER_API}/jobs/${job.id}/applicants/`
                                    );

                                console.log(
                                    `CHAT APPLICANTS JOB ${job.id}:`,
                                    data
                                );

                                const jobApplicants =
                                    Array.isArray(
                                        data?.applicants
                                    )
                                        ? data.applicants
                                        : [];

                                /*
                                 * Add job information to each
                                 * applicant because the applicants
                                 * endpoint returns applicants for
                                 * one particular job.
                                 */
                                return jobApplicants.map(
                                    (applicant) => ({
                                        applicant,
                                        job:
                                            data?.job ||
                                            job,
                                    })
                                );
                            } catch (err) {
                                console.error(
                                    `Unable to load applicants for job ${job.id}:`,
                                    err
                                );

                                /*
                                 * Don't make the entire Chat page
                                 * fail because one job endpoint
                                 * failed.
                                 */
                                return [];
                            }
                        })
                    );

                const combined =
                    responses.flat();

                console.log(
                    "CHAT ALL APPLICATIONS:",
                    combined
                );

                setApplicants(combined);

            } catch (err) {
                console.error(
                    "CHAT APPLICANTS ERROR:",
                    err
                );

                if (err.status === 401) {
                    clearAuth();

                    navigate("/login", {
                        replace: true,
                    });

                    return;
                }

                if (!silent) {
                    setError(
                        err.message ||
                        "Unable to load applicants."
                    );
                }
            } finally {
                applicantRequestRef.current = false;

                if (!silent) {
                    setLoadingApplicants(false);
                }
            }
        },
        [isEmployer, navigate]
    );


    /* =====================================================
       LOAD CONVERSATIONS
    ===================================================== */

    const loadConversations = useCallback(
        async (silent = false) => {
            if (conversationRequestRef.current) {
                return;
            }

            const token = getToken();

            if (!token) {
                return;
            }

            conversationRequestRef.current = true;

            try {
                if (!silent) {
                    setLoadingConversations(true);
                }

                const data =
                    await fetchJSON(
                        `${CHAT_API}/conversations/`
                    );

                console.log(
                    "CHAT CONVERSATIONS:",
                    data
                );

                const list = toArray(data);

                setConversations((previous) => {
                    const oldList = previousConversationsRef.current.length
                        ? previousConversationsRef.current
                        : previous;

                    if (conversationsInitializedRef.current) {
                        const increased = list.find((nextConversation) => {
                            const nextId =
                                nextConversation?.id ??
                                nextConversation?.conversation_id;

                            const previousConversation = oldList.find((item) => {
                                const oldId =
                                    item?.id ??
                                    item?.conversation_id;
                                return String(oldId) === String(nextId);
                            });

                            const nextUnread =
                                Number(
                                    nextConversation?.unread_count ??
                                    nextConversation?.unreadCount ??
                                    nextConversation?.unread ??
                                    0
                                ) || 0;

                            const oldUnread =
                                Number(
                                    previousConversation?.unread_count ??
                                    previousConversation?.unreadCount ??
                                    previousConversation?.unread ??
                                    0
                                ) || 0;

                            return nextUnread > oldUnread;
                        });

                        if (increased) {
                            const senderName =
                                getConversationPerson(increased);

                            setMessageNotification({
                                id: Date.now(),
                                name: senderName || "New message",
                                company: !isEmployer
                                    ? getCompanyName(increased)
                                    : "",
                            });
                        }
                    }

                    previousConversationsRef.current = list;
                    conversationsInitializedRef.current = true;

                    return list;
                });

            } catch (err) {
                console.error(
                    "CHAT CONVERSATIONS ERROR:",
                    err
                );

                if (err.status === 401) {
                    clearAuth();

                    navigate("/login", {
                        replace: true,
                    });

                    return;
                }

                if (!silent) {
                    setError(
                        err.message ||
                        "Unable to load conversations."
                    );
                }
            } finally {
                conversationRequestRef.current = false;

                if (!silent) {
                    setLoadingConversations(false);
                }
            }
        },
        [navigate]
    );


    /* =====================================================
       LOAD MESSAGES
    ===================================================== */

    const loadMessages = useCallback(
        async (
            conversationId,
            silent = false
        ) => {
            if (!conversationId) {
                return;
            }

            try {
                if (!silent) {
                    setLoadingMessages(true);
                }

                const data =
                    await fetchJSON(
                        `${CHAT_API}/conversations/${conversationId}/messages/`
                    );

                console.log(
                    "CHAT MESSAGES:",
                    data
                );

                setMessages(
                    toArray(data)
                );

            } catch (err) {
                console.error(
                    "CHAT MESSAGES ERROR:",
                    err
                );

                if (err.status === 401) {
                    clearAuth();

                    navigate("/login", {
                        replace: true,
                    });

                    return;
                }

                if (!silent) {
                    setError(
                        err.message ||
                        "Unable to load messages."
                    );
                }
            } finally {
                if (!silent) {
                    setLoadingMessages(false);
                }
            }
        },
        [navigate]
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        if (!getToken()) {
            return;
        }

        if (isEmployer) {
            loadApplicants(false);
        }

        loadConversations(false);
    }, [
        isEmployer,
        loadApplicants,
        loadConversations,
    ]);


    /* =====================================================
       POLLING
    ===================================================== */

    useEffect(() => {
        if (!getToken()) {
            return undefined;
        }

        const interval = setInterval(() => {
            if (isEmployer) {
                loadApplicants(true);
            }

            loadConversations(true);

            if (selectedConversationId) {
                loadMessages(
                    selectedConversationId,
                    true
                );
            }
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [
        isEmployer,
        loadApplicants,
        loadConversations,
        loadMessages,
        selectedConversationId,
    ]);


    /* =====================================================
       AUTO SELECT CONVERSATION
    ===================================================== */

    useEffect(() => {
        if (
            !selectedConversationId &&
            conversations.length > 0
        ) {
            const first =
                conversations[0];

            const id =
                first?.id ??
                first?.conversation_id;

            if (id) {
                setSelectedConversationId(
                    id
                );
            }
        }
    }, [
        conversations,
        selectedConversationId,
    ]);


    /* =====================================================
       QUERY PARAMETER - JOBSEEKER
    ===================================================== */

    useEffect(() => {
        if (!isEmployer) {
            return;
        }

        if (!requestedJobseekerId) {
            return;
        }

        const numericId =
            Number(requestedJobseekerId);

        if (!numericId) {
            return;
        }

        const existing =
            conversations.find(
                (conversation) => {
                    const participantId =
                        conversation?.participant?.id ??
                        conversation?.jobseeker?.id ??
                        conversation?.jobseeker_id ??
                        conversation?.participant_id ??
                        null;

                    return (
                        Number(participantId) ===
                        numericId
                    );
                }
            );

        if (existing) {
            const id =
                existing.id ??
                existing.conversation_id;

            if (id) {
                setSelectedConversationId(
                    id
                );

                setActiveTab("messages");
                setMobileChatOpen(true);
            }
        }
    }, [
        conversations,
        isEmployer,
        requestedJobseekerId,
    ]);


    /* =====================================================
       QUERY PARAMETER - EMPLOYER
    ===================================================== */

    useEffect(() => {
        if (isEmployer) {
            return;
        }

        if (!requestedEmployerId) {
            return;
        }

        const numericId =
            Number(requestedEmployerId);

        if (!numericId) {
            return;
        }

        const existing =
            conversations.find(
                (conversation) => {
                    const participantId =
                        conversation?.participant?.id ??
                        conversation?.employer?.id ??
                        conversation?.employer_id ??
                        conversation?.participant_id ??
                        null;

                    return (
                        Number(participantId) ===
                        numericId
                    );
                }
            );

        if (existing) {
            const id =
                existing.id ??
                existing.conversation_id;

            if (id) {
                setSelectedConversationId(
                    id
                );

                setActiveTab("messages");
                setMobileChatOpen(true);
            }
        }
    }, [
        conversations,
        isEmployer,
        requestedEmployerId,
    ]);


    /* =====================================================
       LOAD SELECTED MESSAGES
    ===================================================== */

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        loadMessages(
            selectedConversationId,
            false
        );
    }, [
        selectedConversationId,
        loadMessages,
    ]);


    /* =====================================================
       SCROLL TO BOTTOM
    ===================================================== */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);


    /* =====================================================
       MESSAGE NOTIFICATION AUTO HIDE
    ===================================================== */

    useEffect(() => {
        if (!messageNotification) {
            return undefined;
        }

        if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
        }

        notificationTimerRef.current = setTimeout(() => {
            setMessageNotification(null);
        }, 4500);

        return () => {
            if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
            }
        };
    }, [messageNotification]);


    /* =====================================================
       MARK READ
    ===================================================== */

    const markConversationRead =
        useCallback(
            async (conversationId) => {
                if (!conversationId) {
                    return;
                }

                try {
                    await fetchJSON(
                        `${CHAT_API}/conversations/${conversationId}/read/`,
                        {
                            method: "PATCH",
                        }
                    );

                    setConversations(
                        (previous) =>
                            previous.map(
                                (conversation) => {
                                    const id =
                                        conversation?.id ??
                                        conversation?.conversation_id;

                                    if (
                                        String(id) !==
                                        String(
                                            conversationId
                                        )
                                    ) {
                                        return conversation;
                                    }

                                    return {
                                        ...conversation,
                                        unread_count: 0,
                                        unread: 0,
                                    };
                                }
                            )
                    );
                } catch (err) {
                    console.error(
                        "MARK READ ERROR:",
                        err
                    );
                }
            },
            []
        );


    /* =====================================================
       SELECT CONVERSATION
    ===================================================== */

    function selectConversation(
        conversation
    ) {
        const id =
            conversation?.id ??
            conversation?.conversation_id;

        if (!id) {
            return;
        }

        setSelectedConversationId(id);
        setActiveTab("messages");
        setMobileChatOpen(true);

        markConversationRead(id);
    }


    /* =====================================================
       GET CONVERSATION PERSON
    ===================================================== */

    function getConversationPerson(
        conversation
    ) {
        if (isEmployer) {
            return (
                conversation?.participant?.full_name ||
                conversation?.participant?.name ||
                conversation?.jobseeker?.full_name ||
                conversation?.jobseeker?.name ||
                conversation?.jobseeker_name ||
                conversation?.other_user?.full_name ||
                conversation?.other_user?.name ||
                "Jobseeker"
            );
        }

        return (
            conversation?.participant?.full_name ||
            conversation?.participant?.name ||
            conversation?.employer?.company_name ||
            conversation?.employer?.company ||
            conversation?.employer_name ||
            conversation?.other_user?.full_name ||
            conversation?.other_user?.name ||
            "Employer"
        );
    }


    /* =====================================================
       GET LAST MESSAGE
    ===================================================== */

    function getLastMessage(
        conversation
    ) {
        const last = conversation?.last_message;

        if (typeof last === "string") {
            return last || "No messages yet";
        }

        if (last && typeof last === "object") {
            return (
                getMessageText(last) ||
                "No messages yet"
            );
        }

        return (
            getStringValue(
                conversation?.last_message_text
            ) ||
            "No messages yet"
        );
    }


    /* =====================================================
       CREATE / OPEN CONVERSATION
    ===================================================== */

    async function createOrOpenConversation(
        profileId
    ) {
        const numericProfileId =
            Number(profileId);

        if (!numericProfileId) {
            alert(
                "Jobseeker profile ID is not available."
            );

            return;
        }

        try {
            setOpeningConversation(true);
            setError("");

            console.log(
                "OPEN CHAT WITH JOBSEEKER:",
                numericProfileId
            );

            /*
             * IMPORTANT:
             *
             * participant_id = JOBSEEKER PROFILE ID
             *
             * NOT application.id
             */
            const data =
                await fetchJSON(
                    `${CHAT_API}/conversations/`,
                    {
                        method: "POST",

                        body: JSON.stringify({
                            participant_type:
                                isEmployer
                                    ? "jobseeker"
                                    : "employer",

                            participant_id:
                                numericProfileId,
                        }),
                    }
                );

            console.log(
                "CHAT CONVERSATION CREATED/OPENED:",
                data
            );

            const conversation =
                data?.conversation ||
                data?.data ||
                data;

            const conversationId =
                conversation?.id ??
                conversation?.conversation_id;

            if (!conversationId) {
                throw new Error(
                    "Conversation ID was not returned by the server."
                );
            }

            /*
             * Add/update conversation in sidebar.
             */
            setConversations(
                (previous) => {
                    const exists =
                        previous.some(
                            (item) =>
                                String(
                                    item?.id ??
                                    item?.conversation_id
                                ) ===
                                String(
                                    conversationId
                                )
                        );

                    if (exists) {
                        return previous.map(
                            (item) => {
                                const itemId =
                                    item?.id ??
                                    item?.conversation_id;

                                return String(
                                    itemId
                                ) ===
                                    String(
                                        conversationId
                                    )
                                    ? {
                                        ...item,
                                        ...conversation,
                                    }
                                    : item;
                            }
                        );
                    }

                    return [
                        conversation,
                        ...previous,
                    ];
                }
            );

            setSelectedConversationId(
                conversationId
            );

            setActiveTab("messages");
            setMobileChatOpen(true);

            await loadMessages(
                conversationId,
                false
            );

            await markConversationRead(
                conversationId
            );

        } catch (err) {
            console.error(
                "CREATE CONVERSATION ERROR:",
                err
            );

            if (err.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            setError(
                err.message ||
                "Unable to start conversation."
            );
        } finally {
            setOpeningConversation(false);
        }
    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendMessage(event) {
        event?.preventDefault();

        const text =
            messageText.trim();

        if (!text) {
            return;
        }

        if (!selectedConversationId) {
            return;
        }

        try {
            setSending(true);
            setError("");

            const data =
                await fetchJSON(
                    `${CHAT_API}/conversations/${selectedConversationId}/messages/`,
                    {
                        method: "POST",

                        body: JSON.stringify({
                            text,
                        }),
                    }
                );

            console.log(
                "MESSAGE SENT:",
                data
            );

            const newMessage =
                data?.message ||
                data?.data ||
                data;

            /*
             * If API returns the newly created message,
             * immediately show it.
             */
            if (
                newMessage &&
                typeof newMessage === "object" &&
                !Array.isArray(newMessage)
            ) {
                setMessages(
                    (previous) => [
                        ...previous,
                        newMessage,
                    ]
                );
            }

            setMessageText("");

            /*
             * Refresh messages to ensure exact backend
             * representation is shown.
             */
            await loadMessages(
                selectedConversationId,
                true
            );

            await loadConversations(true);

        } catch (err) {
            console.error(
                "SEND MESSAGE ERROR:",
                err
            );

            if (err.status === 401) {
                clearAuth();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            setError(
                err.message ||
                "Unable to send message."
            );
        } finally {
            setSending(false);
        }
    }


    /* =====================================================
       DELETE CONVERSATION
    ===================================================== */

    async function deleteConversation(
        conversationId
    ) {
        if (!conversationId) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this conversation?"
            );

        if (!confirmed) {
            return;
        }

        try {
            await fetchJSON(
                `${CHAT_API}/conversations/${conversationId}/`,
                {
                    method: "DELETE",
                }
            );

            setConversations(
                (previous) =>
                    previous.filter(
                        (conversation) => {
                            const id =
                                conversation?.id ??
                                conversation?.conversation_id;

                            return (
                                String(id) !==
                                String(
                                    conversationId
                                )
                            );
                        }
                    )
            );

            if (
                String(
                    selectedConversationId
                ) ===
                String(conversationId)
            ) {
                setSelectedConversationId(
                    null
                );

                setMessages([]);
                setMobileChatOpen(false);
            }

        } catch (err) {
            console.error(
                "DELETE CONVERSATION ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to delete conversation."
            );
        }
    }


    /* =====================================================
       APPLICATION CARD
    ===================================================== */

    function renderApplication(
        application,
        index
    ) {
        const status =
            application.status ||
            "APPLIED";

        return (
            <div
                key={
                    application.applicationId ??
                    `${application.jobId}-${index}`
                }
                className="application-row"
            >
                <div className="application-main">
                    <span className="job-icon">💼</span>
                    <span className="application-job-title">
                        {application.jobTitle}
                    </span>
                </div>

                <span
                    className={`status-badge ${getStatusClass(
                        status
                    )}`}
                >
                    {getStatusLabel(status)}
                </span>
            </div>
        );
    }


    /* =====================================================
       APPLICANT CARD
    ===================================================== */

    function renderApplicant(
        person
    ) {
        const initial =
            person.name
                ?.charAt(0)
                ?.toUpperCase() || "A";

        return (
            <div
                key={person.personId}
                className="candidate-card"
            >
                <div className="candidate-header">
                    <div className="candidate-details">
                        <div className="candidate-left">
                            <div className="candidate-avatar">
                                {initial}
                            </div>

                            <div className="candidate-info">
                                <h3 className="candidate-name">
                                    {person.name}
                                </h3>

                                <div className="candidate-application-count">
                                    {person.applications.length}{" "}
                                    application
                                    {person.applications.length !==
                                        1
                                        ? "s"
                                        : ""}
                                </div>

                                {person.disabilityType && (
                                    <div className="candidate-disability">
                                        Disability:{" "}
                                        {person.disabilityType}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="applications-list header-applications">
                            {person.applications.map(
                                renderApplication
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="message-candidate-button"
                        disabled={
                            openingConversation
                        }
                        onClick={() =>
                            createOrOpenConversation(
                                person.personId
                            )
                        }
                    >
                        <span className="message-button-icon">
                            💬
                        </span>

                        Message
                    </button>
                </div>
            </div>
        );
    }


    /* =====================================================
       MESSAGE BUBBLE
    ===================================================== */

    function getMessageText(message) {
        if (typeof message === "string") {
            return message;
        }

        if (!message || typeof message !== "object") {
            return "";
        }

        const value =
            message?.text ??
            message?.content ??
            message?.message ??
            "";

        return typeof value === "string"
            ? value
            : String(value ?? "");
    }


    function isOwnMessage(message) {
        if (
            message?.is_sender !== undefined
        ) {
            return Boolean(
                message.is_sender
            );
        }

        if (
            message?.is_mine !== undefined
        ) {
            return Boolean(
                message.is_mine
            );
        }

        if (
            message?.from_me !== undefined
        ) {
            return Boolean(
                message.from_me
            );
        }

        if (
            message?.sender_is_me !== undefined
        ) {
            return Boolean(
                message.sender_is_me
            );
        }

        const senderId =
            message?.sender_id ??
            message?.sender?.id ??
            message?.user_id ??
            message?.author_id ??
            null;

        const currentUserId = getCurrentUserId();

        return (
            senderId !== null &&
            senderId !== undefined &&
            currentUserId !== null &&
            Number(senderId) === Number(currentUserId)
        );
    }


    /* =====================================================
       SELECTED CONVERSATION
    ===================================================== */

    const selectedConversation =
        conversations.find(
            (conversation) => {
                const id =
                    conversation?.id ??
                    conversation?.conversation_id;

                return (
                    String(id) ===
                    String(
                        selectedConversationId
                    )
                );
            }
        ) || null;


    const selectedPersonName =
        selectedConversation
            ? getConversationPerson(
                selectedConversation
            )
            : "";


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div
            className={`chat-page ${mobileChatOpen
                ? "mobile-chat-open"
                : ""
                }`}
        >
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <header className="chat-header">
                <div>
                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ← Back
                    </button>

                    <h1>
                        {isEmployer
                            ? "Messages"
                            : "Chat"}
                    </h1>

                    <p>
                        {isEmployer
                            ? "Connect with candidates and manage your conversations."
                            : "Manage your conversations and messages."}
                    </p>
                </div>

                <div className="chat-header-stats">
                    {isEmployer && (
                        <div className="header-stat">
                            <strong>
                                {totalCandidates}
                            </strong>

                            <span>
                                Candidates
                            </span>
                        </div>
                    )}

                    {isEmployer && (
                        <div className="header-stat">
                            <strong>
                                {totalApplications}
                            </strong>

                            <span>
                                Applications
                            </span>
                        </div>
                    )}

                    <div className="header-stat">
                        <strong>
                            {conversations.length}
                        </strong>

                        <span>
                            Conversations
                        </span>
                    </div>

                </div>
            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="error-banner">
                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {messageNotification && (
                <button
                    type="button"
                    className="message-notification-popup"
                    onClick={() => {
                        const notificationId = messageNotification.id;
                        const conversation = conversations.find((item) => {
                            const unread =
                                Number(
                                    item?.unread_count ??
                                    item?.unreadCount ??
                                    item?.unread ??
                                    0
                                ) || 0;
                            return unread > 0 &&
                                getConversationPerson(item) === messageNotification.name;
                        });

                        if (conversation) {
                            selectConversation(conversation);
                        }

                        if (notificationTimerRef.current) {
                            clearTimeout(notificationTimerRef.current);
                        }

                        setMessageNotification(null);
                    }}
                    aria-label={`New message from ${messageNotification.name}`}
                >
                    <span className="notification-red-dot" />
                    <span className="notification-popup-text">
                        <strong>New message</strong>
                        <span>
                            {messageNotification.name}
                            {messageNotification.company
                                ? ` • ${messageNotification.company}`
                                : ""}
                        </span>
                    </span>
                    <span className="notification-popup-close">×</span>
                </button>
            )}


            {/* =================================================
                EMPLOYER TABS
            ================================================= */}

            {isEmployer && (
                <div className="chat-tabs">
                    <button
                        type="button"
                        className={
                            activeTab ===
                                "applicants"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            setActiveTab(
                                "applicants"
                            );

                            setMobileChatOpen(
                                false
                            );
                        }}
                    >
                        Candidates

                        <span className="tab-count">
                            {totalCandidates}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab ===
                                "messages"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab(
                                "messages"
                            )
                        }
                    >
                        Messages

                        {totalUnread > 0 && (
                            <span className="tab-unread-dot" />
                        )}
                    </button>
                </div>
            )}


            {/* =================================================
                CANDIDATES
            ================================================= */}

            {isEmployer &&
                activeTab ===
                "applicants" && (
                    <main className="applicants-container">
                        <div className="section-heading">
                            <div>
                                <h2>
                                    Candidates
                                </h2>

                                <p>
                                    Each candidate appears once with all of their applications.
                                </p>
                            </div>

                            <div className="application-summary">
                                {totalApplications}{" "}
                                total application
                                {totalApplications !==
                                    1
                                    ? "s"
                                    : ""}
                            </div>
                        </div>

                        {loadingApplicants ? (
                            <div className="loading-card">
                                <div className="spinner" />

                                <p>
                                    Loading candidates...
                                </p>
                            </div>
                        ) : groupedApplicants.length ===
                            0 ? (
                            <div className="empty-card">
                                <div className="empty-icon">
                                    👥
                                </div>

                                <h2>
                                    No applicants yet
                                </h2>

                                <p>
                                    Candidates who apply to your jobs will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="candidate-list">
                                {groupedApplicants.map(
                                    renderApplicant
                                )}
                            </div>
                        )}
                    </main>
                )}


            {/* =================================================
                MESSAGES
            ================================================= */}

            {(!isEmployer ||
                activeTab ===
                "messages") && (
                    <main className="messages-container">
                        <div className="chat-layout">

                            {/* =====================================
                            SIDEBAR
                        ===================================== */}

                            <aside className="conversation-sidebar">
                                <div className="sidebar-header">
                                    <div>
                                        <h2>
                                            Messages
                                        </h2>

                                        <p>
                                            Your conversations
                                        </p>
                                    </div>


                                </div>

                                <div className="conversation-list">
                                    {loadingConversations &&
                                        conversations.length ===
                                        0 ? (
                                        <div className="sidebar-loading">
                                            <div className="small-spinner" />

                                            <span>
                                                Loading...
                                            </span>
                                        </div>
                                    ) : conversations.length ===
                                        0 ? (
                                        <div className="conversation-empty">
                                            <div className="empty-chat-icon">
                                                💬
                                            </div>

                                            <h3>
                                                No conversations
                                            </h3>

                                            <p>
                                                {isEmployer
                                                    ? "Click Message on a candidate to start a conversation."
                                                    : "Your conversations will appear here."}
                                            </p>
                                        </div>
                                    ) : (
                                        conversations.map(
                                            (
                                                conversation
                                            ) => {
                                                const id =
                                                    conversation?.id ??
                                                    conversation?.conversation_id;

                                                const unread =
                                                    Number(
                                                        conversation?.unread_count ??
                                                        conversation?.unread ??
                                                        0
                                                    ) || 0;

                                                const active =
                                                    String(
                                                        id
                                                    ) ===
                                                    String(
                                                        selectedConversationId
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            id
                                                        }
                                                        className={`conversation-item ${active
                                                            ? "active"
                                                            : ""
                                                            }`}
                                                        onClick={() =>
                                                            selectConversation(
                                                                conversation
                                                            )
                                                        }
                                                    >
                                                        <div className="conversation-avatar">
                                                            {getConversationPerson(
                                                                conversation
                                                            )
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase() ||
                                                                "U"}
                                                        </div>

                                                        <div className="conversation-content">
                                                            <div className="conversation-top">
                                                                <div className="conversation-person-info">
                                                                    <strong>
                                                                        {getConversationPerson(
                                                                            conversation
                                                                        )}
                                                                    </strong>

                                                                    {!isEmployer &&
                                                                        getCompanyName(conversation) && (
                                                                            <span className="conversation-company">
                                                                                {getCompanyName(
                                                                                    conversation
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                </div>

                                                                {unread > 0 && (
                                                                    <span
                                                                        className="conversation-unread-dot"
                                                                        title={`${unread} unread message${unread > 1 ? "s" : ""}`}
                                                                        aria-label={`${unread} unread message${unread > 1 ? "s" : ""}`}
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="conversation-preview">
                                                                {getLastMessage(
                                                                    conversation
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )
                                    )}
                                </div>
                            </aside>


                            {/* =====================================
                            CHAT WINDOW
                        ===================================== */}

                            <section className="chat-window">
                                {!selectedConversationId ? (
                                    <div className="chat-empty">
                                        <div className="chat-empty-icon">
                                            💬
                                        </div>

                                        <h2>
                                            Select a conversation
                                        </h2>

                                        <p>
                                            {isEmployer
                                                ? "Choose a conversation or go to Candidates and click Message."
                                                : "Choose a conversation to start chatting."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="chat-window-header">
                                            <button
                                                type="button"
                                                className="mobile-back"
                                                onClick={() =>
                                                    setMobileChatOpen(
                                                        false
                                                    )
                                                }
                                            >
                                                ←
                                            </button>

                                            <div className="chat-window-avatar">
                                                {selectedPersonName
                                                    ?.charAt(
                                                        0
                                                    )
                                                    ?.toUpperCase() ||
                                                    "U"}
                                            </div>

                                            <div className="chat-window-person">
                                                <h3>
                                                    {
                                                        selectedPersonName
                                                    }
                                                </h3>

                                                {!isEmployer &&
                                                    selectedConversation &&
                                                    getCompanyName(selectedConversation) && (
                                                        <strong className="selected-company-name">
                                                            {getCompanyName(
                                                                selectedConversation
                                                            )}
                                                        </strong>
                                                    )}

                                                <span>
                                                    {isEmployer
                                                        ? "Jobseeker"
                                                        : "Employer"}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="delete-chat-button"
                                                onClick={() =>
                                                    deleteConversation(
                                                        selectedConversationId
                                                    )
                                                }
                                                title="Delete conversation"
                                            >
                                                🗑
                                            </button>
                                        </div>


                                        <div className="messages-area">
                                            {loadingMessages &&
                                                messages.length ===
                                                0 ? (
                                                <div className="messages-loading">
                                                    <div className="spinner" />

                                                    <p>
                                                        Loading messages...
                                                    </p>
                                                </div>
                                            ) : messages.length ===
                                                0 ? (
                                                <div className="no-messages">
                                                    <div>
                                                        💬
                                                    </div>

                                                    <p>
                                                        No messages yet.
                                                    </p>

                                                    <span>
                                                        Send a message to start the conversation.
                                                    </span>
                                                </div>
                                            ) : (
                                                messages.map(
                                                    (
                                                        message,
                                                        index
                                                    ) => {
                                                        const own =
                                                            isOwnMessage(
                                                                message
                                                            );

                                                        const text =
                                                            getMessageText(
                                                                message
                                                            );

                                                        const messageId =
                                                            message?.id ??
                                                            message?.message_id ??
                                                            index;

                                                        const timestamp =
                                                            message?.created_at ??
                                                            message?.sent_at ??
                                                            message?.timestamp ??
                                                            null;

                                                        return (
                                                            <div
                                                                key={
                                                                    messageId
                                                                }
                                                                className={`message-row ${own
                                                                    ? "own"
                                                                    : "other"
                                                                    }`}
                                                            >
                                                                <div className="message-bubble">
                                                                    <div>
                                                                        {
                                                                            text
                                                                        }
                                                                    </div>

                                                                    {timestamp && (
                                                                        <span className="message-time">
                                                                            {new Date(
                                                                                timestamp
                                                                            ).toLocaleTimeString(
                                                                                "en-IN",
                                                                                {
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit",
                                                                                }
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )
                                            )}

                                            <div
                                                ref={
                                                    messagesEndRef
                                                }
                                            />
                                        </div>


                                        <form
                                            className="message-input-area"
                                            onSubmit={
                                                sendMessage
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    messageText
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setMessageText(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="Type a message..."
                                                disabled={
                                                    sending
                                                }
                                            />

                                            <button
                                                type="submit"
                                                disabled={
                                                    sending ||
                                                    !messageText.trim()
                                                }
                                            >
                                                {sending
                                                    ? "Sending..."
                                                    : "Send"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </section>
                        </div>
                    </main>
                )}


           {/* =================================================
    STYLES
================================================= */}

<style>{`

/* =========================================================
   GLOBAL
========================================================= */

* {
    box-sizing: border-box;
}


/* =========================================================
   MAIN PAGE
   ========================================================= */

.chat-page {
    width: 100%;

    /*
     * IMPORTANT:
     * Do NOT use height: 100vh here.
     * The page needs to be able to become taller than
     * the viewport so the FULL PAGE scrollbar can appear.
     */
    min-height: 100vh;
    height: auto;

    background: #f6f8fc;
    color: #172033;

    padding: 30px;

    box-sizing: border-box;

    /*
     * FULL PAGE SCROLLBAR
     */
    overflow-x: hidden !important;
    overflow-y: auto !important;

    scrollbar-width: auto;
    scrollbar-color:
        #94a3b8
        #f1f5f9;
}


/* =========================================================
   FULL PAGE SCROLLBAR - CHROME / EDGE
========================================================= */

.chat-page::-webkit-scrollbar {
    width: 12px;
}

.chat-page::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.chat-page::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 8px;
    border: 2px solid #f1f5f9;
}

.chat-page::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}


/* =========================================================
   PAGE HEADER
========================================================= */

.chat-header {
    display: flex;

    justify-content: space-between;
    align-items: flex-start;

    gap: 25px;

    margin-bottom: 24px;
}

.back-button {
    border: none;

    background: transparent;

    padding: 0;
    margin-bottom: 12px;

    cursor: pointer;

    color: #4b5563;

    font-size: 14px;
}

.back-button:hover {
    color: #2563eb;
}

.chat-header h1 {
    margin: 0 0 7px;

    font-size: 31px;
    font-weight: 750;

    color: #111827;
}

.chat-header p {
    margin: 0;

    color: #6b7280;

    font-size: 14px;
}


/* =========================================================
   HEADER STATS
========================================================= */

.chat-header-stats {
    display: flex;

    align-items: stretch;

    gap: 10px;

    flex-wrap: wrap;
}

.header-stat {
    min-width: 105px;

    background: #fff;

    border: 1px solid #e8ebf2;

    border-radius: 12px;

    padding: 12px 15px;

    text-align: center;

    box-shadow:
        0 2px 8px
        rgba(0, 0, 0, .03);
}

.header-stat strong {
    display: block;

    font-size: 20px;

    color: #111827;
}

.header-stat span {
    display: block;

    margin-top: 2px;

    color: #6b7280;

    font-size: 11px;
}


/* =========================================================
   ERROR
========================================================= */

.error-banner {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 15px;

    background: #fef2f2;

    color: #b91c1c;

    border: 1px solid #fecaca;

    padding: 12px 15px;

    border-radius: 10px;

    margin-bottom: 18px;
}

.error-banner button {
    border: none;

    background: transparent;

    color: inherit;

    cursor: pointer;

    font-size: 20px;
}


/* =========================================================
   TABS
========================================================= */

.chat-tabs {
    display: flex;

    gap: 4px;

    background: #fff;

    border: 1px solid #e5e7eb;

    padding: 5px;

    border-radius: 12px;

    width: fit-content;

    margin-bottom: 20px;
}

.chat-tabs button {
    border: none;

    background: transparent;

    padding: 10px 18px;

    border-radius: 8px;

    cursor: pointer;

    color: #6b7280;

    font-weight: 650;

    display: flex;

    align-items: center;

    gap: 8px;
}

.chat-tabs button.active {
    background: #2563eb;

    color: white;
}

.tab-count {
    min-width: 22px;

    height: 22px;

    border-radius: 11px;

    background: rgba(255, 255, 255, .2);

    display: inline-flex;

    align-items: center;
    justify-content: center;

    font-size: 11px;
}

.chat-tabs button:not(.active) .tab-count {
    background: #eef2ff;

    color: #2563eb;
}

.tab-unread-dot {
    width: 8px;
    height: 8px;

    border-radius: 50%;

    background: #ef4444;
}


/* =========================================================
   APPLICANTS
========================================================= */

.applicants-container {
    width: 100%;

    max-width: 1150px;

    margin: 0 auto;
}

.section-heading {
    display: flex;

    justify-content: space-between;
    align-items: center;

    gap: 20px;

    margin-bottom: 18px;
}

.section-heading h2 {
    margin: 0 0 5px;

    font-size: 21px;
}

.section-heading p {
    margin: 0;

    color: #6b7280;

    font-size: 13px;
}

.application-summary {
    background: #fff;

    border: 1px solid #e5e7eb;

    padding: 9px 13px;

    border-radius: 9px;

    font-size: 12px;

    font-weight: 700;

    color: #4b5563;
}


/* =========================================================
   CANDIDATE LIST
========================================================= */

.candidate-list {
    display: flex;

    flex-direction: column;

    gap: 16px;
}

.candidate-card {
    background: #fff;

    border: 1px solid #e5e7eb;

    border-radius: 15px;

    overflow: hidden;

    box-shadow:
        0 3px 12px
        rgba(0, 0, 0, .035);
}

.candidate-header {
    display: flex;

    justify-content: space-between;
    align-items: flex-start;

    gap: 18px;

    padding: 14px 16px;
}

.candidate-details {
    display: flex;

    flex-direction: column;

    gap: 9px;

    min-width: 0;

    flex: 1;
}

.candidate-left {
    display: flex;

    align-items: center;

    gap: 11px;

    min-width: 0;
}

.candidate-avatar {
    width: 44px;
    height: 44px;

    flex: 0 0 44px;

    border-radius: 50%;

    background: #e8f0ff;

    color: #2563eb;

    display: flex;

    align-items: center;
    justify-content: center;

    font-size: 17px;

    font-weight: 800;
}

.candidate-info {
    min-width: 0;
}

.candidate-name {
    margin: 0 0 2px;

    font-size: 15px;

    line-height: 1.2;

    color: #111827;
}

.candidate-application-count {
    color: #2563eb;

    font-size: 10px;

    line-height: 1.3;

    font-weight: 700;
}

.candidate-disability {
    color: #6b7280;

    font-size: 10px;

    line-height: 1.3;

    margin-top: 2px;
}


/* =========================================================
   MESSAGE CANDIDATE BUTTON
========================================================= */

.message-candidate-button {
    border: none;

    background: #2563eb;

    color: #fff;

    padding: 8px 12px;

    border-radius: 8px;

    cursor: pointer;

    font-size: 12px;

    font-weight: 700;

    display: inline-flex;

    align-items: center;

    gap: 5px;

    white-space: nowrap;

    flex: 0 0 auto;
}

.message-candidate-button:hover {
    background: #1d4ed8;
}

.message-candidate-button:disabled {
    opacity: .6;

    cursor: not-allowed;
}


/* =========================================================
   APPLICATIONS
========================================================= */

.header-applications {
    gap: 5px;

    width: 100%;

    max-width: 620px;
}

.application-row {
    display: flex;

    justify-content: space-between;

    align-items: center;

    gap: 10px;

    padding: 6px 8px;

    background: #f8fafc;

    border: 1px solid #eef1f5;

    border-radius: 7px;

    min-height: 30px;
}

.application-main {
    display: flex;

    align-items: center;

    gap: 7px;

    min-width: 0;
}

.job-icon {
    width: 22px;
    height: 22px;

    flex: 0 0 22px;

    display: flex;

    align-items: center;
    justify-content: center;

    background: #fff;

    border: 1px solid #e5e7eb;

    border-radius: 5px;

    font-size: 11px;
}

.application-job-title {
    font-size: 10px;

    line-height: 1.25;

    font-weight: 700;

    color: #1f2937;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}


/* =========================================================
   STATUS
========================================================= */

.status-badge {
    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 3px 7px;

    border-radius: 999px;

    font-size: 9px;

    font-weight: 800;

    white-space: nowrap;
}

.status-applied {
    background: #eff6ff;
    color: #2563eb;
}

.status-review {
    background: #fff7ed;
    color: #c2410c;
}

.status-shortlisted {
    background: #f0fdf4;
    color: #15803d;
}

.status-interview {
    background: #f5f3ff;
    color: #7c3aed;
}

.status-rejected {
    background: #fef2f2;
    color: #dc2626;
}

.status-hired {
    background: #ecfdf5;
    color: #047857;
}

.status-default {
    background: #f3f4f6;
    color: #4b5563;
}


/* =========================================================
   LOADING / EMPTY
========================================================= */

.loading-card,
.empty-card {
    background: #fff;

    border: 1px solid #e5e7eb;

    border-radius: 15px;

    min-height: 300px;

    display: flex;

    flex-direction: column;

    align-items: center;
    justify-content: center;

    text-align: center;

    padding: 30px;
}

.empty-icon {
    font-size: 42px;

    margin-bottom: 10px;
}

.empty-card h2 {
    margin: 5px 0;

    font-size: 19px;
}

.empty-card p {
    margin: 5px 0;

    color: #6b7280;

    font-size: 13px;
}


/* =========================================================
   SPINNERS
========================================================= */

.spinner,
.small-spinner {
    border-radius: 50%;

    border: 4px solid #e5e7eb;

    border-top-color: #2563eb;

    animation:
        spin
        .8s
        linear
        infinite;
}

.spinner {
    width: 36px;
    height: 36px;
}

.small-spinner {
    width: 22px;
    height: 22px;

    border-width: 3px;
}

@keyframes spin {

    to {
        transform: rotate(360deg);
    }
}


/* =========================================================
   CHAT CONTAINER
========================================================= */

.messages-container {
    width: 100%;

    /*
     * Keep this tall enough for the internal chat
     * scrollbars.
     *
     * Because .chat-page is now auto-height,
     * this also contributes to the outer page height.
     */
    height: 650px;

    min-height: 650px;

    min-width: 0;

    /*
     * IMPORTANT:
     * The container itself does NOT scroll.
     */
    overflow: visible !important;
}


/* =========================================================
   MAIN TWO-COLUMN CHAT
========================================================= */

.chat-layout {
    width: 100%;

    height: 650px;

    min-height: 650px;

    min-width: 0;

    display: grid;

    grid-template-columns:
        330px
        minmax(0, 1fr);

    background: #fff;

    border: 1px solid #e3e7ee;

    border-radius: 15px;

    /*
     * The chat box itself does NOT scroll.
     */
    overflow: hidden !important;

    box-shadow:
        0 4px 18px
        rgba(0, 0, 0, .04);
}


/* =========================================================
   GRID CHILDREN
========================================================= */

.chat-layout > * {
    min-width: 0;

    min-height: 0;
}


/* =========================================================
   LEFT SIDEBAR
========================================================= */

.conversation-sidebar {
    width: 100%;

    height: 100%;

    min-width: 0;

    min-height: 0;

    display: flex;

    flex-direction: column;

    border-right: 1px solid #e5e7eb;

    background: #fff;

    /*
     * Sidebar itself does NOT scroll.
     *
     * Only .conversation-list scrolls.
     */
    overflow: hidden !important;
}


/* =========================================================
   LEFT SIDEBAR HEADER - FIXED
========================================================= */

.sidebar-header {
    width: 100%;

    height: 72px;

    min-height: 72px;

    flex: 0 0 72px;

    padding: 15px 17px;

    border-bottom: 1px solid #edf0f4;

    display: flex;

    align-items: center;

    justify-content: space-between;

    background: #fff;

    overflow: hidden;
}

.sidebar-header h2 {
    margin: 0 0 3px;

    font-size: 17px;
}

.sidebar-header p {
    margin: 0;

    color: #9ca3af;

    font-size: 11px;
}


/* =========================================================
   LEFT CONVERSATION SCROLLBAR
========================================================= */

.conversation-list {
    width: 100%;

    flex: 1 1 0;

    min-width: 0;

    min-height: 0;

    /*
     * LEFT INTERNAL SCROLLBAR
     */
    overflow-y: auto !important;

    overflow-x: hidden !important;

    scrollbar-width: auto;

    scrollbar-color:
        #94a3b8
        #f1f5f9;
}


/* =========================================================
   LEFT SCROLLBAR - CHROME / EDGE
========================================================= */

.conversation-list::-webkit-scrollbar {
    width: 10px;
}

.conversation-list::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.conversation-list::-webkit-scrollbar-thumb {
    background: #94a3b8;

    border-radius: 8px;

    border: 2px solid #f1f5f9;
}

.conversation-list::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}


/* =========================================================
   CONVERSATION ITEM
========================================================= */

.conversation-item {
    width: 100%;

    display: flex;

    align-items: center;

    gap: 11px;

    padding: 13px 14px;

    border-bottom: 1px solid #f1f3f6;

    cursor: pointer;

    transition:
        background
        .15s
        ease;

    box-sizing: border-box;
}

.conversation-item:hover {
    background: #f8fafc;
}

.conversation-item.active {
    background: #eff6ff;
}

.conversation-avatar {
    width: 43px;
    height: 43px;

    flex: 0 0 43px;

    border-radius: 50%;

    display: flex;

    align-items: center;
    justify-content: center;

    background: #e8f0ff;

    color: #2563eb;

    font-weight: 800;
}

.conversation-content {
    min-width: 0;

    flex: 1;
}

.conversation-top {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 7px;
}

.conversation-top strong {
    font-size: 13px;

    color: #1f2937;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.conversation-preview {
    color: #9ca3af;

    font-size: 11px;

    margin-top: 4px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}


/* =========================================================
   CONVERSATION PERSON
========================================================= */

.conversation-person-info {
    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 2px;

    flex: 1;
}

.conversation-person-info strong {
    font-size: 13px;

    color: #1f2937;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.conversation-company {
    color: #2563eb;

    font-size: 10px;

    font-weight: 600;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.conversation-unread-dot {
    width: 9px;
    height: 9px;

    min-width: 9px;

    flex: 0 0 9px;

    border-radius: 50%;

    background: #ef4444;

    display: inline-block;

    box-shadow:
        0 0 0 2px #fff;

    animation:
        unreadPulse
        1.8s
        ease-in-out
        infinite;
}

@keyframes unreadPulse {

    0%,
    100% {
        transform: scale(1);

        opacity: 1;
    }

    50% {
        transform: scale(1.2);

        opacity: .75;
    }
}

.selected-company-name {
    display: block;

    margin: 1px 0 2px;

    color: #2563eb;

    font-size: 11px;

    font-weight: 700;
}


/* =========================================================
   SIDEBAR EMPTY / LOADING
========================================================= */

.sidebar-loading,
.conversation-empty {
    padding: 35px 20px;

    text-align: center;

    color: #6b7280;
}

.sidebar-loading {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    font-size: 12px;
}

.empty-chat-icon {
    font-size: 32px;

    margin-bottom: 8px;
}

.conversation-empty h3 {
    margin: 4px 0;

    color: #374151;

    font-size: 14px;
}

.conversation-empty p {
    margin: 5px 0;

    line-height: 1.5;

    font-size: 11px;
}


/* =========================================================
   RIGHT CHAT WINDOW
========================================================= */

.chat-window {
    width: 100%;

    height: 100%;

    min-width: 0;

    min-height: 0;

    display: grid;

    /*
     * HEADER
     * MESSAGES
     * INPUT
     */
    grid-template-rows:
        72px
        minmax(0, 1fr)
        64px;

    background: #fbfcfe;

    /*
     * RIGHT CHAT WINDOW ITSELF DOES NOT SCROLL.
     */
    overflow: hidden !important;
}


/* =========================================================
   RIGHT HEADER - FIXED
========================================================= */

.chat-window-header {
    width: 100%;

    height: 72px;

    min-width: 0;

    min-height: 72px;

    padding: 12px 17px;

    background: #fff;

    border-bottom: 1px solid #e5e7eb;

    display: flex;

    align-items: center;

    gap: 11px;

    overflow: hidden;
}

.chat-window-avatar {
    width: 42px;
    height: 42px;

    flex: 0 0 42px;

    border-radius: 50%;

    background: #e8f0ff;

    color: #2563eb;

    display: flex;

    align-items: center;
    justify-content: center;

    font-weight: 800;
}

.chat-window-person {
    flex: 1;

    min-width: 0;

    overflow: hidden;
}

.chat-window-person h3 {
    margin: 0 0 3px;

    font-size: 14px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.chat-window-person span {
    color: #9ca3af;

    font-size: 11px;
}


/* =========================================================
   DELETE
========================================================= */

.delete-chat-button {
    border: none;

    background: transparent;

    cursor: pointer;

    padding: 8px;

    border-radius: 8px;

    opacity: .65;

    flex: 0 0 auto;
}

.delete-chat-button:hover {
    background: #fef2f2;

    opacity: 1;
}


/* =========================================================
   MOBILE BACK
========================================================= */

.mobile-back {
    display: none;

    border: none;

    background: transparent;

    cursor: pointer;

    font-size: 22px;

    flex: 0 0 auto;
}


/* =========================================================
   RIGHT MESSAGE HISTORY
========================================================= */

.messages-area {
    width: 100%;

    height: 100%;

    min-width: 0;

    min-height: 0;

    /*
     * RIGHT INTERNAL SCROLLBAR
     */
    overflow-y: auto !important;

    overflow-x: hidden !important;

    padding: 22px;

    box-sizing: border-box;

    /*
     * Prevent the right scrollbar from pushing
     * the outer page.
     */
    overscroll-behavior: contain;

    scrollbar-width: auto;

    scrollbar-color:
        #94a3b8
        #f1f5f9;
}


/* =========================================================
   RIGHT SCROLLBAR - CHROME / EDGE
========================================================= */

.messages-area::-webkit-scrollbar {
    width: 12px;
}

.messages-area::-webkit-scrollbar-track {
    background: #f1f5f9;

    border-radius: 10px;
}

.messages-area::-webkit-scrollbar-thumb {
    background: #94a3b8;

    border-radius: 10px;

    border: 3px solid #f1f5f9;
}

.messages-area::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}


/* =========================================================
   MESSAGES
========================================================= */

.messages-loading {
    min-height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    flex-direction: column;

    gap: 10px;

    color: #6b7280;

    font-size: 12px;
}

.no-messages {
    min-height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    flex-direction: column;

    color: #9ca3af;

    text-align: center;
}

.no-messages > div {
    font-size: 36px;

    margin-bottom: 8px;
}

.no-messages p {
    margin: 3px 0;

    color: #4b5563;

    font-weight: 700;

    font-size: 14px;
}

.no-messages span {
    font-size: 11px;
}


/* =========================================================
   MESSAGE ROW
========================================================= */

.message-row {
    width: 100%;

    display: flex;

    margin-bottom: 10px;
}

.message-row.own {
    justify-content: flex-end;
}

.message-row.other {
    justify-content: flex-start;
}


/* =========================================================
   MESSAGE BUBBLE
========================================================= */

.message-bubble {
    max-width:
        min(70%, 560px);

    padding: 10px 13px;

    border-radius: 13px;

    background: #fff;

    border: 1px solid #e5e7eb;

    color: #374151;

    font-size: 13px;

    line-height: 1.5;

    box-shadow:
        0 1px 3px
        rgba(0, 0, 0, .025);

    word-break: break-word;

    overflow-wrap: anywhere;
}

.message-row.own .message-bubble {
    background: #2563eb;

    color: #fff;

    border-color: #2563eb;

    border-bottom-right-radius: 4px;
}

.message-row.other .message-bubble {
    border-bottom-left-radius: 4px;
}


/* =========================================================
   MESSAGE TIME
========================================================= */

.message-time {
    display: block;

    margin-top: 4px;

    font-size: 9px;

    opacity: .65;

    text-align: right;
}


/* =========================================================
   INPUT - FIXED
========================================================= */

.message-input-area {
    width: 100%;

    height: 64px;

    min-width: 0;

    min-height: 64px;

    padding: 12px;

    background: #fff;

    border-top: 1px solid #e5e7eb;

    display: flex;

    align-items: center;

    gap: 8px;

    /*
     * Input never scrolls.
     */
    overflow: hidden !important;
}

.message-input-area input {
    flex: 1 1 auto;

    min-width: 0;

    height: 40px;

    border: 1px solid #dfe3ea;

    border-radius: 9px;

    padding: 11px 13px;

    outline: none;

    font-size: 13px;
}

.message-input-area input:focus {
    border-color: #93c5fd;

    box-shadow:
        0 0 0 3px
        rgba(37, 99, 235, .08);
}

.message-input-area button {
    height: 40px;

    min-height: 40px;

    flex: 0 0 auto;

    border: none;

    background: #2563eb;

    color: white;

    padding: 0 19px;

    border-radius: 9px;

    cursor: pointer;

    font-weight: 700;
}

.message-input-area button:hover {
    background: #1d4ed8;
}

.message-input-area button:disabled {
    opacity: .5;

    cursor: not-allowed;
}


/* =========================================================
   EMPTY CHAT
========================================================= */

.chat-empty {
    width: 100%;

    height: 100%;

    min-width: 0;

    min-height: 0;

    display: flex;

    align-items: center;

    justify-content: center;

    flex-direction: column;

    text-align: center;

    color: #6b7280;

    padding: 30px;

    overflow: hidden;
}

.chat-empty-icon {
    font-size: 48px;

    margin-bottom: 10px;
}

.chat-empty h2 {
    margin: 4px 0;

    font-size: 18px;

    color: #374151;
}

.chat-empty p {
    margin: 5px 0;

    font-size: 12px;
}


/* =========================================================
   NOTIFICATION
========================================================= */

.message-notification-popup {
    position: fixed;

    top: 24px;

    right: 24px;

    z-index: 1000;

    display: flex;

    align-items: center;

    gap: 10px;

    min-width: 260px;

    max-width: 360px;

    padding: 12px 14px;

    border: 1px solid #fecaca;

    border-radius: 12px;

    background: #fff;

    box-shadow:
        0 12px 30px
        rgba(15, 23, 42, .15);

    color: #1f2937;

    cursor: pointer;

    text-align: left;

    animation:
        notificationSlideIn
        .25s
        ease-out;
}

.message-notification-popup:hover {
    box-shadow:
        0 15px 34px
        rgba(15, 23, 42, .19);
}

.notification-red-dot {
    width: 11px;
    height: 11px;

    min-width: 11px;

    border-radius: 50%;

    background: #ef4444;

    box-shadow:
        0 0 0 4px
        #fee2e2;
}

.notification-popup-text {
    min-width: 0;

    flex: 1;

    display: flex;

    flex-direction: column;

    gap: 2px;
}

.notification-popup-text strong {
    font-size: 12px;
}

.notification-popup-text span {
    color: #6b7280;

    font-size: 11px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.notification-popup-close {
    color: #9ca3af;

    font-size: 18px;

    line-height: 1;
}

@keyframes notificationSlideIn {

    from {
        opacity: 0;

        transform:
            translateY(-8px);
    }

    to {
        opacity: 1;

        transform:
            translateY(0);
    }
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 900px) {

    .chat-page {
        padding: 20px;

        /*
         * KEEP FULL PAGE SCROLL
         */
        min-height: 100vh;

        height: auto;

        overflow-x: hidden !important;

        overflow-y: auto !important;
    }

    .chat-header {
        flex-direction: column;
    }

    .chat-header-stats {
        width: 100%;
    }

    .chat-layout {
        grid-template-columns:
            280px
            minmax(0, 1fr);
    }

    .candidate-header {
        align-items: flex-start;
    }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

    .chat-page {
        width: 100%;

        min-height: 100vh;

        /*
         * IMPORTANT:
         * Do NOT use overflow:hidden here.
         */
        height: auto;

        padding: 14px;

        overflow-x: hidden !important;

        overflow-y: auto !important;
    }

    .message-notification-popup {
        top: 12px;

        left: 12px;

        right: 12px;

        min-width: 0;

        max-width: none;
    }

    .chat-header h1 {
        font-size: 25px;
    }

    .chat-header-stats {
        display: grid;

        grid-template-columns:
            repeat(2, 1fr);

        width: 100%;
    }

    .header-stat {
        min-width: 0;
    }

    .chat-tabs {
        width: 100%;
    }

    .chat-tabs button {
        flex: 1;

        justify-content: center;
    }

    .section-heading {
        align-items: flex-start;

        flex-direction: column;
    }

    .candidate-header {
        flex-direction: column;

        align-items: stretch;
    }

    .message-candidate-button {
        width: 100%;

        justify-content: center;
    }

    .application-row {
        align-items: flex-start;

        flex-direction: column;
    }


    /* =====================================================
       MOBILE CHAT CONTAINER
    ===================================================== */

    .messages-container {
        width: 100%;

        /*
         * Fixed chat height so both internal
         * scrollbars continue to work.
         */
        height: 600px;

        min-height: 600px;

        overflow: visible !important;
    }


    /* =====================================================
       MOBILE CHAT LAYOUT
    ===================================================== */

    .chat-layout {
        width: 100%;

        height: 600px;

        min-height: 600px;

        min-width: 0;

        display: block;

        position: relative;

        overflow: hidden !important;
    }


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    .conversation-sidebar {
        width: 100%;

        height: 100%;

        min-width: 0;

        min-height: 0;

        border-right: none;

        overflow: hidden !important;
    }


    /* =====================================================
       MOBILE CHAT WINDOW
    ===================================================== */

    .chat-window {
        width: 100%;

        height: 100%;

        min-width: 0;

        min-height: 0;

        display: grid;

        grid-template-rows:
            60px
            minmax(0, 1fr)
            60px;

        background: #fbfcfe;

        overflow: hidden !important;
    }


    /* =====================================================
       MOBILE OPEN CHAT
    ===================================================== */

    .chat-page.mobile-chat-open
        .conversation-sidebar {
        display: none;
    }

    .chat-page.mobile-chat-open
        .chat-window {
        display: grid;
    }


    /* =====================================================
       MOBILE BACK
    ===================================================== */

    .mobile-back {
        display: block;
    }


    /* =====================================================
       MOBILE HEADER
    ===================================================== */

    .chat-window-header {
        width: 100%;

        height: 60px;

        min-height: 60px;

        padding: 10px 12px;

        overflow: hidden;
    }


    /* =====================================================
       MOBILE MESSAGE SCROLLBAR
    ===================================================== */

    .messages-area {
        width: 100%;

        height: 100%;

        min-width: 0;

        min-height: 0;

        overflow-y: auto !important;

        overflow-x: hidden !important;

        padding: 15px 12px;

        overscroll-behavior: contain;

        scrollbar-width: auto;

        scrollbar-color:
            #94a3b8
            #f1f5f9;
    }

    .messages-area::-webkit-scrollbar {
        width: 10px;
    }

    .messages-area::-webkit-scrollbar-track {
        background: #f1f5f9;
    }

    .messages-area::-webkit-scrollbar-thumb {
        background: #94a3b8;

        border-radius: 8px;

        border: 2px solid #f1f5f9;
    }


    /* =====================================================
       MOBILE LEFT CONVERSATION SCROLLBAR
    ===================================================== */

    .conversation-list {
        width: 100%;

        flex: 1 1 0;

        min-height: 0;

        overflow-y: auto !important;

        overflow-x: hidden !important;

        scrollbar-width: auto;

        scrollbar-color:
            #94a3b8
            #f1f5f9;
    }

    .conversation-list::-webkit-scrollbar {
        width: 10px;
    }

    .conversation-list::-webkit-scrollbar-track {
        background: #f1f5f9;
    }

    .conversation-list::-webkit-scrollbar-thumb {
        background: #94a3b8;

        border-radius: 8px;

        border: 2px solid #f1f5f9;
    }


    /* =====================================================
       MOBILE MESSAGE BUBBLE
    ===================================================== */

    .message-bubble {
        max-width: 84%;
    }


    /* =====================================================
       MOBILE INPUT
    ===================================================== */

    .message-input-area {
        width: 100%;

        height: 60px;

        min-height: 60px;

        padding: 10px;

        overflow: hidden !important;
    }

    .message-input-area input {
        height: 38px;

        font-size: 13px;

        padding: 10px 11px;
    }

    .message-input-area button {
        height: 38px;

        min-height: 38px;

        padding: 0 15px;
    }
}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 480px) {

    .chat-page {
        width: 100%;

        min-height: 100vh;

        height: auto;

        padding: 10px;

        /*
         * FULL PAGE SCROLL
         */
        overflow-x: hidden !important;

        overflow-y: auto !important;
    }

    .chat-header-stats {
        grid-template-columns:
            1fr 1fr;
    }

    .candidate-card {
        border-radius: 12px;
    }

    .candidate-header {
        padding: 12px;

        gap: 12px;
    }

    .candidate-details {
        width: 100%;
    }

    .header-applications {
        max-width: none;
    }

    .candidate-name {
        font-size: 14px;
    }

    .candidate-application-count,
    .candidate-disability {
        font-size: 9px;
    }

    .applications-section {
        padding: 0 15px 15px;
    }

    .candidate-avatar {
        width: 45px;

        height: 45px;

        flex-basis: 45px;
    }

    .candidate-name {
        font-size: 15px;
    }


    /* =====================================================
       SMALL MOBILE RIGHT MESSAGE SCROLL
    ===================================================== */

    .messages-area {
        padding: 15px 12px;

        overflow-y: auto !important;

        overflow-x: hidden !important;
    }

    .message-bubble {
        max-width: 90%;
    }
}

`}</style>
        </div>
    );
}

export default Chat;