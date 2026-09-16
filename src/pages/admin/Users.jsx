import { useEffect, useMemo, useState } from "react";

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

/* ============================================================
   HELPERS
============================================================ */

const normalizeText = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");

const getToken = () =>
    localStorage.getItem("jc_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    "";

const getHeaders = () => {
    const token = getToken();

    return {
        Accept: "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
};

/* ============================================================
   ROLE
============================================================ */

const getRoleValue = (user) => {
    const rawRole =
        user?.role ??
        user?.user_role ??
        user?.userType ??
        user?.user_type ??
        user?.profile_type ??
        user?.account_type ??
        user?.user?.role ??
        user?.user?.user_role ??
        user?.user?.user_type ??
        user?.user?.profile_type ??
        "";

    const role = normalizeText(rawRole);

    if (
        role === "jobseeker" ||
        role === "job seeker" ||
        role === "job seeker profile" ||
        role === "candidate" ||
        role === "seeker"
    ) {
        return "job seeker";
    }

    if (
        role === "employer" ||
        role === "employer profile" ||
        role === "company"
    ) {
        return "employer";
    }

    return role;
};

const isJobSeeker = (user) =>
    getRoleValue(user) === "job seeker";

const isEmployer = (user) =>
    getRoleValue(user) === "employer";

/* ============================================================
   APPROVAL STATUS
============================================================ */

const isApprovedUser = (user) => {
    const approvalValue =
        user?.approval_status ??
        user?.approvalStatus ??
        user?.verification_status ??
        user?.verificationStatus ??
        "";

    const statusValue =
        user?.status ??
        "";

    const approval =
        normalizeText(approvalValue);

    const status =
        normalizeText(statusValue);

    /*
     * AdminUsersView should return approval_status="approved"
     * for users in this directory.
     *
     * "Verified" is also accepted for compatibility with the
     * existing API response.
     */
    if (approval) {
        return [
            "approved",
            "approve",
            "verified",
            "accepted",
        ].includes(approval);
    }

    if (status) {
        return [
            "approved",
            "approve",
            "verified",
            "accepted",
        ].includes(status);
    }

    /*
     * If no approval information is returned, do not silently
     * remove the record. The backend endpoint is expected to
     * return only approved directory users.
     */
    return true;
};

/* ============================================================
   DISABILITY FLAG
============================================================ */

const getDisabilityFlag = (user) => {
    return (
        user?.disability ??
        user?.has_disability ??
        user?.hasDisability ??
        user?.is_disabled ??
        user?.isDisabled ??
        user?.disability_details?.has_disability ??
        user?.disability_details?.disability ??
        user?.profile?.disability ??
        user?.jobseeker_profile?.disability ??
        user?.jobseekerProfile?.disability ??
        user?.user?.disability ??
        user?.user?.has_disability ??
        user?.user?.hasDisability ??
        user?.user?.is_disabled ??
        user?.user?.isDisabled ??
        user?.user?.disability_details?.has_disability ??
        user?.user?.profile?.disability ??
        user?.user?.jobseeker_profile?.disability ??
        user?.user?.jobseekerProfile?.disability ??
        null
    );
};

/* ============================================================
   DISABILITY CATEGORY
============================================================ */

const getDisabilityCategory = (user) => {
    return (
        user?.disability_category ??
        user?.disabilityCategory ??
        user?.disability_details?.category ??
        user?.profile?.disability_category ??
        user?.jobseeker_profile?.disability_category ??
        user?.jobseekerProfile?.disability_category ??
        user?.user?.disability_category ??
        user?.user?.disabilityCategory ??
        user?.user?.disability_details?.category ??
        user?.user?.profile?.disability_category ??
        user?.user?.jobseeker_profile?.disability_category ??
        user?.user?.jobseekerProfile?.disability_category ??
        ""
    );
};

/* ============================================================
   DISABILITY TYPE
============================================================ */

const getDisabilityType = (user) => {
    return (
        user?.disability_type ??
        user?.disabilityType ??
        user?.disability_details?.type ??
        user?.profile?.disability_type ??
        user?.jobseeker_profile?.disability_type ??
        user?.jobseekerProfile?.disability_type ??
        user?.user?.disability_type ??
        user?.user?.disabilityType ??
        user?.user?.disability_details?.type ??
        user?.user?.profile?.disability_type ??
        user?.user?.jobseeker_profile?.disability_type ??
        user?.user?.jobseekerProfile?.disability_type ??
        ""
    );
};

/* ============================================================
   CANONICAL DISABILITY CATEGORY
============================================================ */

const getCanonicalDisabilityCategory = (user) => {
    const category =
        normalizeText(
            getDisabilityCategory(user)
        );

    const type =
        normalizeText(
            getDisabilityType(user)
        );

    /*
     * Exact backend category always gets priority.
     */

    if (
        category.includes("locomotor") ||
        category.includes("physical") ||
        category.includes("mobility") ||
        category.includes("orthopedic") ||
        category.includes("orthopaedic")
    ) {
        return "locomotor";
    }

    if (
        category.includes("visual") ||
        category.includes("vision")
    ) {
        return "visual";
    }

    if (
        category.includes("hearing") ||
        category.includes("auditory")
    ) {
        return "hearing";
    }

    /*
     * Type fallback.
     *
     * Cerebral Palsy MUST be Locomotor.
     */

    if (
        type.includes("cerebral palsy") ||
        type.includes("locomotor") ||
        type.includes("physical") ||
        type.includes("mobility") ||
        type.includes("movement") ||
        type.includes("orthopedic") ||
        type.includes("orthopaedic")
    ) {
        return "locomotor";
    }

    if (
        type.includes("visual") ||
        type.includes("vision") ||
        type.includes("visually") ||
        type.includes("blind") ||
        type.includes("low vision")
    ) {
        return "visual";
    }

    if (
        type.includes("hearing") ||
        type.includes("auditory") ||
        type.includes("deaf") ||
        type.includes("hard of hearing")
    ) {
        return "hearing";
    }

    return "";
};

/* ============================================================
   DISABILITY SEARCH TEXT
============================================================ */

const getDisabilitySearchText = (user) =>
    [
        getDisabilityCategory(user),
        getDisabilityType(user),
        getCanonicalDisabilityCategory(user),
    ]
        .filter(
            (value) =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
        )
        .join(" ")
        .toLowerCase();

/* ============================================================
   IS DISABLED
============================================================ */

const isDisabledPerson = (user) => {
    if (!isJobSeeker(user)) {
        return false;
    }

    const flag =
        getDisabilityFlag(user);

    if (
        flag === true ||
        flag === 1 ||
        flag === "1"
    ) {
        return true;
    }

    const normalizedFlag =
        normalizeText(flag);

    if (
        [
            "true",
            "yes",
            "y",
            "disabled",
        ].includes(normalizedFlag)
    ) {
        return true;
    }

    /*
     * A valid disability category/type is also enough to identify
     * a disabled user when the boolean field is missing.
     */
    return Boolean(
        getCanonicalDisabilityCategory(
            user
        )
    );
};

/* ============================================================
   DISABILITY CATEGORY MATCH
============================================================ */

const hasDisabilityType = (
    user,
    targetType
) => {
    if (
        !isJobSeeker(user) ||
        !isDisabledPerson(user)
    ) {
        return false;
    }

    const target =
        normalizeText(targetType);

    const canonicalCategory =
        getCanonicalDisabilityCategory(
            user
        );

    return (
        canonicalCategory === target
    );
};

/* ============================================================
   NAME / EMAIL / DATE
============================================================ */

const getName = (user) =>
    user?.name ??
    user?.full_name ??
    user?.fullName ??
    user?.contact_name ??
    user?.contactName ??
    user?.company_name ??
    user?.companyName ??
    user?.user?.name ??
    user?.user?.full_name ??
    user?.user?.username ??
    user?.email ??
    "Unknown";

const getEmail = (user) =>
    user?.email ??
    user?.company_email ??
    user?.companyEmail ??
    user?.user?.email ??
    "";

const getJoinedDate = (user) =>
    user?.joined ??
    user?.created_at ??
    user?.createdAt ??
    user?.date_joined ??
    user?.dateJoined ??
    user?.user?.date_joined ??
    null;

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

/* ============================================================
   NORMALIZE USER
============================================================ */

const normalizeUser = (
    user,
    index
) => {
    const role =
        getRoleValue(user);

    const rawId =
        user?.id ??
        user?.profile_id ??
        user?.user_id ??
        user?.user?.id ??
        index;

    const disabled =
        isDisabledPerson(user);

    const category =
        getDisabilityCategory(user);

    const type =
        getDisabilityType(user);

    const canonicalCategory =
        getCanonicalDisabilityCategory(
            user
        );

    return {
        ...user,

        _key:
            `${role || "unknown"}-${rawId}-${index}`,

        _rawId:
            rawId,

        normalizedRole:
            role,

        normalizedName:
            String(
                getName(user)
            ).trim(),

        normalizedEmail:
            String(
                getEmail(user)
            ).trim(),

        normalizedDisability:
            disabled,

        normalizedDisabilityCategory:
            category,

        normalizedDisabilityType:
            type,

        canonicalDisabilityCategory:
            canonicalCategory,

        normalizedApproval:
            isApprovedUser(user),
    };
};

/* ============================================================
   EXTRACT USERS
============================================================ */

const extractUsers = (
    payload
) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (
        !payload ||
        typeof payload !== "object"
    ) {
        return [];
    }

    const possibleLists = [
        payload.users,
        payload.results,
        payload.data,
        payload.items,
        payload.user_list,
        payload.userList,
    ];

    for (
        const list of possibleLists
    ) {
        if (
            Array.isArray(list)
        ) {
            return list;
        }
    }

    return [];
};

/* ============================================================
   PAGE
============================================================ */

function Users() {
    const [users, setUsers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState("all");

    /* ========================================================
       LOAD USERS
    ======================================================== */

    const loadUsers = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token =
                getToken();

            if (!token) {
                setError(
                    "Authentication token is missing. Please login again."
                );
                return;
            }

            const response =
                await fetch(
                    `${API_BASE}/admin/users/`,
                    {
                        method: "GET",
                        headers:
                            getHeaders(),
                    }
                );

            let data = null;

            try {
                data =
                    await response.json();
            } catch {
                data = null;
            }

            if (
                response.status ===
                401
            ) {
                localStorage.removeItem(
                    "jc_token"
                );
                localStorage.removeItem(
                    "access_token"
                );
                localStorage.removeItem(
                    "accessToken"
                );
                localStorage.removeItem(
                    "token"
                );

                setError(
                    "Your session has expired. Please login again."
                );

                return;
            }

            if (
                !response.ok
            ) {
                throw new Error(
                    data?.message ||
                        data?.detail ||
                        "Failed to load users."
                );
            }

            const extracted =
                extractUsers(data);

            /*
             * IMPORTANT:
             *
             * The backend /admin/users/ endpoint should already
             * return approved users only.
             *
             * We still protect the UI from accidentally showing
             * pending/rejected users.
             */
            const normalized =
                extracted
                    .map(
                        (
                            user,
                            index
                        ) =>
                            normalizeUser(
                                user,
                                index
                            )
                    )
                    .filter(
                        (user) =>
                            user.normalizedApproval
                    );

            /*
             * Do not calculate counts from:
             * - Django total_users
             * - dashboard totals
             * - verification queue totals
             *
             * Every visible count is derived from this list.
             */
            setUsers(
                normalized
            );
        } catch (err) {
            console.error(
                "Admin users error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load users."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    /* ========================================================
       COUNTS
    ======================================================== */

    const counts =
        useMemo(() => {
            const jobSeekers =
                users.filter(
                    (user) =>
                        user.normalizedRole ===
                        "job seeker"
                );

            const employers =
                users.filter(
                    (user) =>
                        user.normalizedRole ===
                        "employer"
                );

            const disabled =
                jobSeekers.filter(
                    (user) =>
                        user.normalizedDisability
                );

            const locomotor =
                jobSeekers.filter(
                    (user) =>
                        hasDisabilityType(
                            user,
                            "locomotor"
                        )
                );

            const visual =
                jobSeekers.filter(
                    (user) =>
                        hasDisabilityType(
                            user,
                            "visual"
                        )
                );

            const hearing =
                jobSeekers.filter(
                    (user) =>
                        hasDisabilityType(
                            user,
                            "hearing"
                        )
                );

            return {
                all:
                    users.length,

                jobSeekers:
                    jobSeekers.length,

                employers:
                    employers.length,

                disabled:
                    disabled.length,

                locomotor:
                    locomotor.length,

                visual:
                    visual.length,

                hearing:
                    hearing.length,
            };
        }, [users]);

    /* ========================================================
       FILTER + SEARCH
    ======================================================== */

    const filteredUsers =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return users.filter(
                (user) => {
                    let matchesFilter =
                        true;

                    switch (
                        filter
                    ) {
                        case "job seeker":
                            matchesFilter =
                                user.normalizedRole ===
                                "job seeker";
                            break;

                        case "employer":
                            matchesFilter =
                                user.normalizedRole ===
                                "employer";
                            break;

                        case "disabled":
                            matchesFilter =
                                isDisabledPerson(
                                    user
                                );
                            break;

                        case "locomotor":
                            matchesFilter =
                                hasDisabilityType(
                                    user,
                                    "locomotor"
                                );
                            break;

                        case "visual":
                            matchesFilter =
                                hasDisabilityType(
                                    user,
                                    "visual"
                                );
                            break;

                        case "hearing":
                            matchesFilter =
                                hasDisabilityType(
                                    user,
                                    "hearing"
                                );
                            break;

                        case "all":
                        default:
                            matchesFilter =
                                true;
                    }

                    if (
                        !matchesFilter
                    ) {
                        return false;
                    }

                    if (!query) {
                        return true;
                    }

                    const searchText = [
                        user.normalizedName,
                        user.normalizedEmail,
                        user.normalizedRole,
                        user.normalizedDisabilityCategory,
                        user.normalizedDisabilityType,
                        user.canonicalDisabilityCategory,
                        user?.disability_percentage,
                        user?.status,
                        user?.approval_status,
                    ]
                        .filter(
                            (
                                value
                            ) =>
                                value !==
                                    undefined &&
                                value !==
                                    null
                        )
                        .join(" ")
                        .toLowerCase();

                    return searchText.includes(
                        query
                    );
                }
            );
        }, [
            users,
            filter,
            search,
        ]);

    /* ========================================================
       LABEL
    ======================================================== */

    const filterLabel =
        {
            all: "All Users",
            "job seeker":
                "Job Seekers",
            employer:
                "Employers",
            disabled:
                "Disabled",
            locomotor:
                "Locomotor",
            visual:
                "Visual",
            hearing:
                "Hearing",
        }[filter] ||
        "All Users";

    /* ========================================================
       DISABILITY DISPLAY
    ======================================================== */

    const getDisabilityLabel =
        (user) => {
            if (
                !user.normalizedDisability
            ) {
                return (
                    <span className="users-no-disability">
                        No
                    </span>
                );
            }

            const category =
                user.normalizedDisabilityCategory;

            const type =
                user.normalizedDisabilityType;

            const canonical =
                user.canonicalDisabilityCategory;

            /*
             * Display the real stored category.
             * If category is empty, display the canonical category.
             *
             * Example:
             * Category = Locomotor
             * Type     = Cerebral Palsy
             */

            let displayCategory =
                category;

            if (
                !displayCategory
            ) {
                if (
                    canonical ===
                    "locomotor"
                ) {
                    displayCategory =
                        "Locomotor";
                } else if (
                    canonical ===
                    "visual"
                ) {
                    displayCategory =
                        "Visual";
                } else if (
                    canonical ===
                    "hearing"
                ) {
                    displayCategory =
                        "Hearing";
                }
            }

            return (
                <div className="users-disability">
                    <strong>
                        ♿ Disabled
                    </strong>

                    <span>
                        {displayCategory ||
                            "Disability"}

                        {type
                            ? ` · ${type}`
                            : ""}
                    </span>
                </div>
            );
        };

    /* ========================================================
       STATUS DISPLAY
    ======================================================== */

    const getStatusLabel =
        (user) => {
            const approval =
                normalizeText(
                    user?.approval_status ||
                        ""
                );

            const status =
                normalizeText(
                    user?.status ||
                        ""
                );

            if (
                approval ===
                    "approved" ||
                approval ===
                    "verified" ||
                status ===
                    "approved" ||
                status ===
                    "verified"
            ) {
                return "Approved";
            }

            return (
                user?.status ||
                user?.approval_status ||
                "Approved"
            );
        };

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="users-page">

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .users-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding: 28px;
                }

                .users-container {
                    max-width: 1500px;
                    margin: 0 auto;
                }

                .users-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 22px;
                }

                .users-header h1 {
                    margin: 0;
                    color: #111827;
                    font-size: 30px;
                    line-height: 1.2;
                    font-weight: 750;
                }

                .users-header p {
                    margin: 7px 0 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .users-refresh {
                    border: 1px solid #d1d5db;
                    background: #fff;
                    color: #111827;
                    border-radius: 8px;
                    padding: 10px 15px;
                    font-size: 13px;
                    font-weight: 650;
                    cursor: pointer;
                }

                .users-refresh:hover {
                    background: #f9fafb;
                }

                .users-refresh:disabled {
                    opacity: .55;
                    cursor: not-allowed;
                }

                .users-alert {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 13px 15px;
                    margin-bottom: 18px;
                    border-radius: 9px;
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    font-size: 13px;
                }

                .users-stats {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .users-stat {
                    min-width: 0;
                    padding: 16px;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 11px;
                    box-shadow: 0 2px 7px rgba(0,0,0,.025);
                    cursor: pointer;
                    text-align: left;
                }

                .users-stat.active {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 2px rgba(99,102,241,.10);
                }

                .users-stat-label {
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 650;
                    margin-bottom: 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .users-stat-value {
                    color: #111827;
                    font-size: 23px;
                    font-weight: 750;
                }

                .users-filter-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 11px;
                    margin-bottom: 18px;
                }

                .users-search {
                    flex: 1;
                    min-width: 240px;
                    height: 42px;
                    padding: 0 13px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    outline: none;
                    color: #111827;
                    font-size: 13px;
                }

                .users-search:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99,102,241,.10);
                }

                .users-filter-info {
                    color: #6b7280;
                    font-size: 12px;
                    white-space: nowrap;
                }

                .users-table-card {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 11px;
                    overflow: hidden;
                }

                .users-table-scroll {
                    width: 100%;
                    overflow-x: auto;
                }

                .users-table {
                    width: 100%;
                    min-width: 1000px;
                    border-collapse: collapse;
                }

                .users-table th {
                    padding: 14px 16px;
                    text-align: left;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    color: #4b5563;
                    font-size: 11px;
                    font-weight: 750;
                    text-transform: uppercase;
                    letter-spacing: .035em;
                }

                .users-table td {
                    padding: 15px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #374151;
                    font-size: 13px;
                    vertical-align: middle;
                }

                .users-table tr:last-child td {
                    border-bottom: 0;
                }

                .users-table tbody tr:hover {
                    background: #fafafa;
                }

                .users-user {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                }

                .users-avatar {
                    width: 39px;
                    height: 39px;
                    flex: 0 0 39px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #eef2ff;
                    color: #4338ca;
                    font-size: 13px;
                    font-weight: 750;
                }

                .users-name {
                    color: #111827;
                    font-weight: 680;
                    margin-bottom: 3px;
                }

                .users-email {
                    color: #6b7280;
                    font-size: 11px;
                }

                .users-role {
                    display: inline-flex;
                    padding: 5px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .users-role.jobseeker {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .users-role.employer {
                    background: #ede9fe;
                    color: #6d28d9;
                }

                .users-disability {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .users-disability strong {
                    color: #b91c1c;
                    font-size: 12px;
                }

                .users-disability span {
                    color: #6b7280;
                    font-size: 11px;
                }

                .users-no-disability {
                    color: #6b7280;
                }

                .users-status {
                    display: inline-flex;
                    padding: 5px 9px;
                    border-radius: 999px;
                    background: #dcfce7;
                    color: #166534;
                    font-size: 11px;
                    font-weight: 700;
                }

                .users-view {
                    border: 0;
                    background: transparent;
                    padding: 0;
                    color: #4f46e5;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .users-view:hover {
                    text-decoration: underline;
                }

                .users-empty {
                    padding: 65px 20px;
                    text-align: center;
                }

                .users-empty h3 {
                    margin: 0 0 6px;
                    color: #111827;
                    font-size: 17px;
                }

                .users-empty p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 13px;
                }

                .users-loading {
                    padding: 65px 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }

                @media (max-width: 1200px) {
                    .users-stats {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                @media (max-width: 760px) {
                    .users-page {
                        padding: 15px;
                    }

                    .users-header {
                        flex-direction: column;
                    }

                    .users-refresh {
                        width: 100%;
                    }

                    .users-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .users-filter-card {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .users-search {
                        min-width: 100%;
                    }

                    .users-filter-info {
                        white-space: normal;
                    }
                }
            `}</style>

            <div className="users-container">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="users-header">
                    <div>
                        <h1>
                            User Directory
                        </h1>

                        <p>
                            Manage approved job
                            seekers and employers.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="users-refresh"
                        onClick={() =>
                            loadUsers(true)
                        }
                        disabled={
                            refreshing
                        }
                    >
                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }
                    </button>
                </div>

                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (
                    <div className="users-alert">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    STATS
                ===================================================== */}

                <div className="users-stats">

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "all"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "all"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            All
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.all
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "job seeker"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "job seeker"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Job Seekers
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.jobSeekers
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "employer"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "employer"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Employers
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.employers
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "disabled"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "disabled"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Disabled
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.disabled
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "locomotor"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "locomotor"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Locomotor
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.locomotor
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "visual"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "visual"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Visual
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.visual
                            }
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`users-stat ${
                            filter ===
                            "hearing"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setFilter(
                                "hearing"
                            )
                        }
                    >
                        <div className="users-stat-label">
                            Hearing
                        </div>

                        <div className="users-stat-value">
                            {
                                counts.hearing
                            }
                        </div>
                    </button>

                </div>

                {/* =====================================================
                    SEARCH
                ===================================================== */}

                <div className="users-filter-card">

                    <input
                        type="text"
                        className="users-search"
                        placeholder="Search by name, email, role, or disability..."
                        value={
                            search
                        }
                        onChange={(
                            event
                        ) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    <div className="users-filter-info">
                        {filterLabel} ·{" "}
                        {
                            filteredUsers.length
                        }{" "}
                        users
                    </div>

                </div>

                {/* =====================================================
                    TABLE
                ===================================================== */}

                <div className="users-table-card">

                    {loading ? (
                        <div className="users-loading">
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="users-empty">
                            <h3>
                                No users found
                            </h3>

                            <p>
                                No approved users
                                match your current
                                filter/search.
                            </p>
                        </div>
                    ) : (
                        <div className="users-table-scroll">

                            <table className="users-table">

                                <thead>
                                    <tr>
                                        <th>
                                            User
                                        </th>

                                        <th>
                                            Role
                                        </th>

                                        <th>
                                            Disability
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Joined
                                        </th>

                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredUsers.map(
                                        (user) => {

                                            const role =
                                                user.normalizedRole;

                                            return (
                                                <tr
                                                    key={
                                                        user._key
                                                    }
                                                >

                                                    <td>
                                                        <div className="users-user">

                                                            <div className="users-avatar">
                                                                {
                                                                    user.normalizedName
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                }
                                                            </div>

                                                            <div>
                                                                <div className="users-name">
                                                                    {
                                                                        user.normalizedName
                                                                    }
                                                                </div>

                                                                <div className="users-email">
                                                                    {
                                                                        user.normalizedEmail ||
                                                                        "No email"
                                                                    }
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`users-role ${
                                                                role ===
                                                                "employer"
                                                                    ? "employer"
                                                                    : "jobseeker"
                                                            }`}
                                                        >
                                                            {
                                                                role ===
                                                                "employer"
                                                                    ? "Employer"
                                                                    : "Job Seeker"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            getDisabilityLabel(
                                                                user
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        <span className="users-status">
                                                            {
                                                                getStatusLabel(
                                                                    user
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            formatDate(
                                                                getJoinedDate(
                                                                    user
                                                                )
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="users-view"
                                                            onClick={() => {
                                                                const id =
                                                                    user._rawId;

                                                                if (
                                                                    role ===
                                                                    "job seeker"
                                                                ) {
                                                                    window.location.href =
                                                                        `/admin/jobseekers/${id}`;
                                                                } else if (
                                                                    role ===
                                                                    "employer"
                                                                ) {
                                                                    window.location.href =
                                                                        `/admin/employers/${id}`;
                                                                }
                                                            }}
                                                        >
                                                            View →
                                                        </button>
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

export default Users;
