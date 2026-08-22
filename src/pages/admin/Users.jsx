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

            <main className="admin-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="users-header">

                    <h1>
                        Users
                    </h1>


                    <p>

                        {users.length.toLocaleString()}

                        {" "}

                        verified account
                        {users.length === 1
                            ? ""
                            : "s"
                        }

                    </p>

                </section>


                {/* =================================================
                    FILTERS
                ================================================= */}

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
                        All
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
                        Employer
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
                        Job seeker
                    </button>

                </div>


                {/* =================================================
                    USERS CARD
                ================================================= */}

                <section className="users-card">

                    <div className="users-table">


                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <div className="users-table-row users-table-header">

                            <div>
                                USER
                            </div>

                            <div>
                                ROLE
                            </div>

                            <div>
                                STATUS
                            </div>

                            <div>
                                JOINED
                            </div>

                            <div>
                                ACTION
                            </div>

                        </div>


                        {/* =================================================
                            LOADING
                        ================================================= */}

                        {loading && (

                            <div className="users-empty">

                                Loading users...

                            </div>

                        )}


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {!loading &&
                            error && (

                                <div className="users-empty users-error">

                                    {error}

                                </div>

                            )}


                        {/* =================================================
                            EMPTY
                        ================================================= */}

                        {!loading &&
                            !error &&
                            filteredUsers.length === 0 && (

                                <div className="users-empty">

                                    No verified users found.

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

                                        <div className="users-user">

                                            <div className="users-avatar">

                                                {getInitials(
                                                    user
                                                )}

                                            </div>


                                            <span>

                                                {user.name ||
                                                    "Not provided"}

                                            </span>

                                        </div>


                                        {/* ==============================
                                            ROLE
                                        ============================== */}

                                        <div className="users-role">

                                            {user.role ||
                                                "—"}

                                        </div>


                                        {/* ==============================
                                            STATUS
                                        ============================== */}

                                        <div>

                                            <span className="users-status">

                                                {user.status ||
                                                    "Verified"}

                                            </span>

                                        </div>


                                        {/* ==============================
                                            JOINED
                                        ============================== */}

                                        <div className="users-joined">

                                            {formatDate(
                                                user.joined
                                            )}

                                        </div>


                                        {/* ==============================
                                            ACTION
                                        ============================== */}

                                        <div>

                                            <button
                                                type="button"
                                                className="users-view-button"
                                                onClick={() =>
                                                    handleViewUser(user)
                                                }
                                            >

                                                View

                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                    </div>

                </section>

            </main>

        </div>

    );
}

export default Users;