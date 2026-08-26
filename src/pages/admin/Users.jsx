import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Users() {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =====================================================
    // LOAD USERS
    // =====================================================

    useEffect(() => {

        fetchUsers();

    }, []);


    async function fetchUsers() {

        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("jc_token");


        // =================================================
        // TOKEN CHECK
        // =================================================

        if (!token) {

            setError(
                "Admin login session not found."
            );

            setUsers([]);

            setLoading(false);

            return;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE}/admin/users/`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );


            // =================================================
            // READ RESPONSE
            // =================================================

            const text =
                await response.text();


            let data = [];


            try {

                data =
                    text
                        ? JSON.parse(text)
                        : [];

            } catch {

                data = [];

            }


            console.log(
                "USERS API STATUS:",
                response.status
            );


            console.log(
                "USERS API RESPONSE:",
                data
            );


            // =================================================
            // ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    `Failed to load users. Status: ${response.status}`
                );
            }


            // =================================================
            // NORMALIZE RESPONSE
            // =================================================

            const normalizedUsers =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.results)
                        ? data.results
                        : [];


            console.log(
                "NORMALIZED USERS:",
                normalizedUsers
            );


            // =================================================
            // ONLY APPROVED USERS
            // =================================================

            const approvedUsers =
                normalizedUsers.filter(
                    (user) =>
                        user.approval_status ===
                        "approved"
                );


            console.log(
                "APPROVED USERS:",
                approvedUsers
            );


            setUsers(
                approvedUsers
            );


        } catch (err) {

            console.error(
                "USERS ERROR:",
                err
            );


            setError(
                err.message ||
                "Could not load users right now."
            );


            setUsers([]);


        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // FILTER
    // =====================================================

    const filteredUsers =
        filter === "all"
            ? users
            : users.filter(
                (user) =>
                    user.role
                        ?.toLowerCase()
                    === filter
            );


    // =====================================================
    // DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {

            return "—";

        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateValue;

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


    // =====================================================
    // INITIALS
    // =====================================================

    function getInitials(user) {

        if (user.initials) {

            return user.initials;

        }


        if (!user.name) {

            return "?";

        }


        const words =
            user.name
                .trim()
                .split(/\s+/);


        if (words.length >= 2) {

            return (
                words[0].charAt(0) +
                words[1].charAt(0)
            ).toUpperCase();

        }


        return user.name
            .substring(0, 2)
            .toUpperCase();
    }


    // =====================================================
    // VIEW USER PROFILE
    // =====================================================

    function handleViewUser(user) {

        const role =
            user.role?.toLowerCase();


        // =================================================
        // JOB SEEKER
        // =================================================

        if (
            role === "job seeker" ||
            role === "jobseeker"
        ) {

            navigate(
                `/admin/jobseekers/${user.id}`,
                {
                    state: {
                        from: "users"
                    }
                }
            );

            return;
        }


        // =================================================
        // EMPLOYER
        // =================================================

        if (
            role === "employer"
        ) {

            navigate(
                `/admin/employers/${user.id}`,
                {
                    state: {
                        from: "users"
                    }
                }
            );

            return;
        }


        console.error(
            "Unknown user role:",
            user.role
        );
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="admin-dashboard">

            <main className="admin-main users-modern-page">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="users-modern-header">

                    <div>

                        <div className="users-title-row">

                            <div className="users-title-icon">
                                👥
                            </div>

                            <div>

                                <h1>
                                    Users
                                </h1>

                                <p>
                                    Manage and view all verified accounts
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="users-total-card">

                        <span>
                            Verified Accounts
                        </span>

                        <strong>
                            {users.length.toLocaleString()}
                        </strong>

                    </div>

                </section>


                {/* =================================================
                    FILTER CARD
                ================================================= */}

                <section className="users-filter-card">

                    <div className="users-filter-heading">

                        <span className="users-filter-label">
                            Account type
                        </span>

                        <span className="users-filter-description">
                            Filter verified users by role
                        </span>

                    </div>


                    <div className="users-filters">

                        <button
                            type="button"
                            className={
                                filter === "all"
                                    ? "users-filter active"
                                    : "users-filter"
                            }
                            onClick={() =>
                                setFilter("all")
                            }
                        >

                            <span>
                                All
                            </span>

                            <b>
                                {users.length}
                            </b>

                        </button>


                        <button
                            type="button"
                            className={
                                filter === "employer"
                                    ? "users-filter active"
                                    : "users-filter"
                            }
                            onClick={() =>
                                setFilter("employer")
                            }
                        >

                            <span>
                                Employer
                            </span>

                            <b>
                                {
                                    users.filter(
                                        (user) =>
                                            user.role
                                                ?.toLowerCase() ===
                                            "employer"
                                    ).length
                                }
                            </b>

                        </button>


                        <button
                            type="button"
                            className={
                                filter === "job seeker"
                                    ? "users-filter active"
                                    : "users-filter"
                            }
                            onClick={() =>
                                setFilter("job seeker")
                            }
                        >

                            <span>
                                Job seeker
                            </span>

                            <b>
                                {
                                    users.filter(
                                        (user) =>
                                            user.role
                                                ?.toLowerCase() ===
                                            "job seeker"
                                    ).length
                                }
                            </b>

                        </button>

                    </div>

                </section>


                {/* =================================================
                    USERS TABLE CARD
                ================================================= */}

                <section className="users-modern-card">

                    <div className="users-card-top">

                        <div>

                            <h2>
                                Verified Users
                            </h2>

                            <p>
                                Accounts that have successfully completed verification.
                            </p>

                        </div>

                        <div className="users-result-count">

                            {filteredUsers.length}

                            {" "}

                            {filteredUsers.length === 1
                                ? "user"
                                : "users"
                            }

                        </div>

                    </div>


                    <div className="users-table-wrapper">

                        <div className="users-table">


                            {/* =================================================
                                TABLE HEADER
                            ================================================= */}

                            <div className="users-table-row users-table-header">

                                <div className="users-col-user">
                                    USER
                                </div>

                                <div className="users-col-role">
                                    ROLE
                                </div>

                                <div className="users-col-status">
                                    STATUS
                                </div>

                                <div className="users-col-joined">
                                    JOINED
                                </div>

                                <div className="users-col-action">
                                    ACTION
                                </div>

                            </div>


                            {/* =================================================
                                LOADING
                            ================================================= */}

                            {loading && (

                                <div className="users-empty">

                                    <div className="users-loading-icon">
                                        ⏳
                                    </div>

                                    <strong>
                                        Loading users...
                                    </strong>

                                    <span>
                                        Please wait while we fetch verified accounts.
                                    </span>

                                </div>

                            )}


                            {/* =================================================
                                ERROR
                            ================================================= */}

                            {!loading &&
                                error && (

                                    <div className="users-empty users-error">

                                        <div className="users-empty-icon">
                                            ⚠️
                                        </div>

                                        <strong>
                                            Unable to load users
                                        </strong>

                                        <span>
                                            {error}
                                        </span>

                                    </div>

                                )}


                            {/* =================================================
                                EMPTY
                            ================================================= */}

                            {!loading &&
                                !error &&
                                filteredUsers.length === 0 && (

                                    <div className="users-empty">

                                        <div className="users-empty-icon">
                                            👤
                                        </div>

                                        <strong>
                                            No verified users found
                                        </strong>

                                        <span>
                                            There are no users matching the selected filter.
                                        </span>

                                    </div>

                                )}


                            {/* =================================================
                                DATA
                            ================================================= */}

                            {!loading &&
                                !error &&
                                filteredUsers.length > 0 &&
                                filteredUsers.map(
                                    (user) => (

                                        <div
                                            className="users-table-row users-data-row"
                                            key={
                                                `${user.role}-${user.id}`
                                            }
                                        >


                                            {/* ==============================
                                                USER
                                            ============================== */}

                                            <div className="users-user users-col-user">

                                                <div className="users-avatar">

                                                    {getInitials(
                                                        user
                                                    )}

                                                </div>


                                                <div className="users-user-info">

                                                    <strong>

                                                        {user.name ||
                                                            "Not provided"}

                                                    </strong>

                                                    <span>
                                                        Verified account
                                                    </span>

                                                </div>

                                            </div>


                                            {/* ==============================
                                                ROLE
                                            ============================== */}

                                            <div className="users-role users-col-role">

                                                <span
                                                    className={
                                                        user.role
                                                            ?.toLowerCase()
                                                            .includes("employer")
                                                            ? "users-role-badge employer"
                                                            : "users-role-badge seeker"
                                                    }
                                                >

                                                    {user.role ||
                                                        "—"}

                                                </span>

                                            </div>


                                            {/* ==============================
                                                STATUS
                                            ============================== */}

                                            <div className="users-col-status">

                                                <span className="users-status">

                                                    <span className="users-status-dot"></span>

                                                    {user.status ||
                                                        "Verified"}

                                                </span>

                                            </div>


                                            {/* ==============================
                                                JOINED
                                            ============================== */}

                                            <div className="users-joined users-col-joined">

                                                {formatDate(
                                                    user.joined
                                                )}

                                            </div>


                                            {/* ==============================
                                                ACTION
                                            ============================== */}

                                            <div className="users-col-action">

                                                <button
                                                    type="button"
                                                    className="users-view-button"
                                                    onClick={() =>
                                                        handleViewUser(user)
                                                    }
                                                >

                                                    <span>
                                                        View
                                                    </span>

                                                    <span className="users-view-arrow">
                                                        →
                                                    </span>

                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                        </div>

                    </div>

                </section>

            </main>


            {/* =====================================================
                PAGE STYLE
            ===================================================== */}

            <style>{`

                /* =====================================================
                   PAGE
                ===================================================== */

                .users-modern-page {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }


                .users-modern-page *,
                .users-modern-page *::before,
                .users-modern-page *::after {
                    box-sizing: border-box;
                }


                /* =====================================================
                   HEADER
                ===================================================== */

                .users-modern-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 24px;
                }


                .users-title-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 0;
                }


                .users-title-icon {
                    width: 48px;
                    height: 48px;
                    min-width: 48px;
                    border-radius: 14px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    font-size: 22px;

                    background: #eef2ff;
                    border: 1px solid #e0e7ff;
                }


                .users-modern-header h1 {
                    margin: 0;
                    font-size: 28px;
                    line-height: 1.2;
                    font-weight: 700;
                    color: #172033;
                }


                .users-modern-header p {
                    margin: 6px 0 0;
                    color: #718096;
                    font-size: 14px;
                }


                /* =====================================================
                   TOTAL CARD
                ===================================================== */

                .users-total-card {
                    min-width: 180px;
                    padding: 14px 18px;

                    border: 1px solid #e5e7eb;
                    border-radius: 14px;

                    background: #ffffff;

                    display: flex;
                    flex-direction: column;
                    gap: 3px;

                    box-shadow:
                        0 4px 14px rgba(15, 23, 42, 0.04);
                }


                .users-total-card span {
                    color: #7b8494;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                }


                .users-total-card strong {
                    color: #111827;
                    font-size: 22px;
                    line-height: 1.2;
                }


                /* =====================================================
                   FILTER CARD
                ===================================================== */

                .users-filter-card {
                    width: 100%;
                    padding: 18px 20px;

                    background: #ffffff;

                    border: 1px solid #e5e7eb;
                    border-radius: 16px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 20px;

                    margin-bottom: 20px;

                    box-shadow:
                        0 4px 16px rgba(15, 23, 42, 0.04);
                }


                .users-filter-heading {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;

                    min-width: 0;
                }


                .users-filter-label {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1f2937;
                }


                .users-filter-description {
                    color: #8a94a6;
                    font-size: 12px;
                }


                /* =====================================================
                   FILTER BUTTONS
                ===================================================== */

                .users-filters {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }


                .users-filter {
                    min-height: 38px;

                    border: 1px solid #e1e5eb;
                    border-radius: 10px;

                    background: #ffffff;

                    color: #4b5563;

                    padding: 7px 12px;

                    font-size: 13px;
                    font-weight: 600;

                    cursor: pointer;

                    display: inline-flex;
                    align-items: center;
                    gap: 9px;

                    transition:
                        background .2s ease,
                        border-color .2s ease,
                        color .2s ease,
                        transform .2s ease;
                }


                .users-filter:hover {
                    border-color: #b9c2d0;
                    transform: translateY(-1px);
                }


                .users-filter b {
                    min-width: 22px;
                    height: 22px;

                    display: inline-flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 6px;

                    background: #f1f3f6;

                    color: #687386;

                    font-size: 11px;
                }


                .users-filter.active {
                    background: #111827;
                    border-color: #111827;
                    color: #ffffff;
                }


                .users-filter.active b {
                    background: rgba(255,255,255,.16);
                    color: #ffffff;
                }


                /* =====================================================
                   MAIN CARD
                ===================================================== */

                .users-modern-card {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;

                    background: #ffffff;

                    border: 1px solid #e5e7eb;
                    border-radius: 18px;

                    overflow: hidden;

                    box-shadow:
                        0 6px 20px rgba(15, 23, 42, 0.05);
                }


                /* =====================================================
                   CARD TOP
                ===================================================== */

                .users-card-top {
                    width: 100%;

                    padding: 20px 22px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 15px;

                    border-bottom: 1px solid #edf0f3;
                }


                .users-card-top h2 {
                    margin: 0;

                    font-size: 17px;
                    font-weight: 700;

                    color: #172033;
                }


                .users-card-top p {
                    margin: 5px 0 0;

                    color: #8a94a6;

                    font-size: 12px;
                }


                .users-result-count {
                    white-space: nowrap;

                    padding: 7px 11px;

                    border-radius: 8px;

                    background: #f5f7fa;

                    color: #5f6979;

                    font-size: 12px;
                    font-weight: 600;
                }


                /* =====================================================
                   TABLE WRAPPER
                ===================================================== */

                .users-table-wrapper {
                    width: 100%;
                    max-width: 100%;

                    overflow-x: auto;

                    -webkit-overflow-scrolling: touch;
                }


                .users-table {
                    width: 100%;
                    min-width: 780px;
                }


                /* =====================================================
                   TABLE ROW
                ===================================================== */

                .users-table-row {
                    display: grid;

                    grid-template-columns:
                        minmax(230px, 2.2fr)
                        minmax(130px, 1fr)
                        minmax(120px, .9fr)
                        minmax(120px, .9fr)
                        minmax(100px, .75fr);

                    align-items: center;

                    width: 100%;
                }


                /* =====================================================
                   HEADER
                ===================================================== */

                .users-table-header {
                    min-height: 48px;

                    background: #f8fafc;

                    border-bottom: 1px solid #e7ebf0;

                    color: #7a8494;

                    font-size: 10px;

                    font-weight: 700;

                    letter-spacing: .7px;
                }


                .users-table-header > div {
                    min-width: 0;
                    padding: 0 18px;
                }


                /* =====================================================
                   DATA ROW
                ===================================================== */

                .users-data-row {
                    min-height: 76px;

                    border-bottom: 1px solid #eef1f4;

                    color: #273142;

                    transition:
                        background .18s ease;
                }


                .users-data-row:last-child {
                    border-bottom: none;
                }


                .users-data-row:hover {
                    background: #fafbfc;
                }


                .users-data-row > div {
                    min-width: 0;
                    padding: 14px 18px;
                }


                /* =====================================================
                   USER
                ===================================================== */

                .users-user {
                    display: flex;
                    align-items: center;

                    gap: 12px;

                    min-width: 0;
                }


                .users-avatar {
                    width: 42px;
                    height: 42px;

                    min-width: 42px;

                    border-radius: 12px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    background: #eef2ff;

                    color: #4655b6;

                    border: 1px solid #dfe4ff;

                    font-size: 13px;

                    font-weight: 700;
                }


                .users-user-info {
                    min-width: 0;

                    display: flex;
                    flex-direction: column;

                    gap: 4px;
                }


                .users-user-info strong {
                    display: block;

                    color: #1f2937;

                    font-size: 13px;
                    font-weight: 650;

                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }


                .users-user-info span {
                    display: block;

                    color: #9aa3b2;

                    font-size: 11px;
                }


                /* =====================================================
                   ROLE
                ===================================================== */

                .users-role-badge {
                    display: inline-flex;
                    align-items: center;

                    max-width: 100%;

                    padding: 6px 9px;

                    border-radius: 7px;

                    font-size: 11px;
                    font-weight: 600;

                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }


                .users-role-badge.employer {
                    background: #f0fdf4;
                    color: #15803d;
                    border: 1px solid #dcfce7;
                }


                .users-role-badge.seeker {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                }


                /* =====================================================
                   STATUS
                ===================================================== */

                .users-status {
                    display: inline-flex;
                    align-items: center;

                    gap: 7px;

                    padding: 6px 9px;

                    border-radius: 7px;

                    background: #f0fdf4;

                    border: 1px solid #dcfce7;

                    color: #15803d;

                    font-size: 11px;
                    font-weight: 600;

                    white-space: nowrap;
                }


                .users-status-dot {
                    width: 6px;
                    height: 6px;

                    border-radius: 50%;

                    background: #22c55e;

                    flex: 0 0 auto;
                }


                /* =====================================================
                   JOINED
                ===================================================== */

                .users-joined {
                    color: #687386;

                    font-size: 12px;

                    white-space: nowrap;
                }


                /* =====================================================
                   VIEW BUTTON
                ===================================================== */

                .users-view-button {
                    min-width: 72px;

                    height: 34px;

                    padding: 0 10px;

                    border: 1px solid #dfe3e8;

                    border-radius: 8px;

                    background: #ffffff;

                    color: #374151;

                    font-size: 12px;

                    font-weight: 650;

                    cursor: pointer;

                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    gap: 7px;

                    transition:
                        background .2s ease,
                        border-color .2s ease,
                        color .2s ease,
                        transform .2s ease;
                }


                .users-view-button:hover {
                    background: #111827;

                    border-color: #111827;

                    color: #ffffff;

                    transform: translateY(-1px);
                }


                .users-view-arrow {
                    font-size: 14px;

                    line-height: 1;
                }


                /* =====================================================
                   EMPTY / LOADING / ERROR
                ===================================================== */

                .users-empty {
                    width: 100%;

                    min-height: 250px;

                    padding: 40px 20px;

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    justify-content: center;

                    text-align: center;

                    gap: 7px;

                    color: #7b8494;
                }


                .users-empty strong {
                    color: #374151;

                    font-size: 14px;
                }


                .users-empty span {
                    max-width: 420px;

                    color: #929baa;

                    font-size: 12px;

                    line-height: 1.5;
                }


                .users-empty-icon,
                .users-loading-icon {
                    width: 46px;
                    height: 46px;

                    margin-bottom: 5px;

                    border-radius: 13px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    background: #f5f7fa;

                    font-size: 20px;
                }


                .users-error .users-empty-icon {
                    background: #fff1f2;
                }


                /* =====================================================
                   RESPONSIVE - 900px
                ===================================================== */

                @media (max-width: 900px) {

                    .users-modern-header {
                        align-items: flex-start;
                    }


                    .users-filter-card {
                        align-items: flex-start;
                        flex-direction: column;
                    }


                    .users-filters {
                        width: 100%;
                    }

                }


                /* =====================================================
                   RESPONSIVE - 600px
                ===================================================== */

                @media (max-width: 600px) {

                    .users-modern-page {
                        padding-left: 12px;
                        padding-right: 12px;
                    }


                    .users-modern-header {
                        flex-direction: column;

                        gap: 14px;
                    }


                    .users-title-icon {
                        width: 42px;
                        height: 42px;
                        min-width: 42px;
                    }


                    .users-modern-header h1 {
                        font-size: 23px;
                    }


                    .users-total-card {
                        width: 100%;
                    }


                    .users-filter-card {
                        padding: 16px;
                    }


                    .users-filters {
                        display: grid;

                        grid-template-columns:
                            repeat(3, minmax(0, 1fr));

                        gap: 7px;
                    }


                    .users-filter {
                        justify-content: center;

                        padding-left: 7px;
                        padding-right: 7px;

                        font-size: 11px;
                    }


                    .users-filter b {
                        display: none;
                    }


                    .users-card-top {
                        padding: 16px;

                        align-items: flex-start;
                    }


                    .users-card-top h2 {
                        font-size: 15px;
                    }


                    .users-card-top p {
                        font-size: 11px;
                    }


                    .users-result-count {
                        font-size: 10px;
                    }


                    /*
                       Keep the table horizontally scrollable
                       instead of allowing columns to overlap.
                    */

                    .users-table {
                        min-width: 760px;
                    }

                }


                /* =====================================================
                   SMALL MOBILE - 400px
                ===================================================== */

                @media (max-width: 400px) {

                    .users-modern-page {
                        padding-left: 8px;
                        padding-right: 8px;
                    }


                    .users-title-row {
                        gap: 10px;
                    }


                    .users-title-icon {
                        width: 38px;
                        height: 38px;
                        min-width: 38px;

                        font-size: 18px;
                    }


                    .users-modern-header h1 {
                        font-size: 21px;
                    }


                    .users-modern-header p {
                        font-size: 12px;
                    }


                    .users-filters {
                        grid-template-columns: 1fr;
                    }


                    .users-filter {
                        width: 100%;
                    }


                    .users-card-top {
                        flex-direction: column;
                    }


                    .users-result-count {
                        align-self: flex-start;
                    }

                }

            `}</style>

        </div>
    );
}

export default Users;