import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

/* =========================================================
   API
========================================================= */

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;


/* =========================================================
   MY APPLICATIONS
========================================================= */

function MyApplications() {

    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    const [user, setUser] = useState(null);
    const [mobileMenu, setMobileMenu] = useState(false);


    /* =====================================================
       LOAD USER
    ===================================================== */

    useEffect(() => {

        try {

            const storedUser =
                localStorage.getItem("jc_user") ||
                localStorage.getItem("user");

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

        } catch (err) {

            console.error(
                "Unable to load user:",
                err
            );

        }

    }, []);


    /* =====================================================
       FETCH APPLICATIONS
    ===================================================== */

    useEffect(() => {
        fetchApplications();
    }, []);


    async function fetchApplications() {

        setLoading(true);
        setError("");

        try {

            const token =
                localStorage.getItem("jc_token") ||
                localStorage.getItem("access_token");

            const res = await fetch(
                `${API_BASE}applications/`,
                {
                    headers: token
                        ? {
                            Authorization:
                                `Bearer ${token}`,
                        }
                        : {},
                }
            );

            if (!res.ok) {

                throw new Error(
                    `Failed to load applications: ${res.status}`
                );

            }

            const data = await res.json();

            const applicationData =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.results)
                        ? data.results
                        : Array.isArray(data.applications)
                            ? data.applications
                            : [];

            setApplications(applicationData);

        } catch (err) {

            console.error(
                "Applications error:",
                err
            );

            setError(
                "Could not load your applications right now."
            );

            setApplications([]);

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    function handleLogout() {

        localStorage.removeItem("jc_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("jc_user");
        localStorage.removeItem("user");

        navigate("/login");

    }


    /* =====================================================
       NORMALIZE STATUS
    ===================================================== */

    function normalizeStatus(status) {

        return String(status || "")
            .toLowerCase()
            .trim()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

    }


    /* =====================================================
       FILTER APPLICATIONS
    ===================================================== */

    const filteredApplications =
        activeFilter === "all"
            ? applications
            : applications.filter(
                (application) =>
                    normalizeStatus(
                        application.status
                    ) === activeFilter
            );


    /* =====================================================
       COUNTS
    ===================================================== */

    const allCount =
        applications.length;

    const appliedCount =
        applications.filter(
            (application) =>
                normalizeStatus(
                    application.status
                ) === "applied"
        ).length;

    const shortlistedCount =
        applications.filter(
            (application) =>
                normalizeStatus(
                    application.status
                ) === "shortlisted"
        ).length;

    const interviewScheduledCount =
        applications.filter(
            (application) =>
                normalizeStatus(
                    application.status
                ) === "interview_scheduled"
        ).length;

    const hiredCount =
        applications.filter(
            (application) =>
                normalizeStatus(
                    application.status
                ) === "hired"
        ).length;

    const rejectedCount =
        applications.filter(
            (application) =>
                normalizeStatus(
                    application.status
                ) === "rejected"
        ).length;


    /* =====================================================
       LINE CHART DATA
    ===================================================== */

    const chartData = (() => {

        const groupedApplications = {};

        applications.forEach(
            (application) => {

                if (!application.applied_at) {
                    return;
                }

                const date =
                    new Date(
                        application.applied_at
                    );

                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {
                    return;
                }

                const dateKey =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                        }
                    );

                groupedApplications[dateKey] =
                    (
                        groupedApplications[dateKey] ||
                        0
                    ) + 1;

            }
        );

        return Object.entries(
            groupedApplications
        ).map(
            ([date, count]) => ({
                date,
                applications: count,
            })
        );

    })();


    /* =====================================================
       FORMAT STATUS
    ===================================================== */

    function formatStatus(status) {

        switch (
            normalizeStatus(status)
        ) {

            case "applied":
                return "Applied";

            case "shortlisted":
                return "Shortlisted";

            case "interview_scheduled":
                return "Interview Scheduled";

            case "hired":
                return "Hired";

            case "rejected":
                return "Not selected";

            default:
                return status || "Unknown";

        }

    }


    /* =====================================================
       STATUS CLASS
    ===================================================== */

    function getStatusClass(status) {

        return normalizeStatus(status);

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "Recently";
        }

        const date =
            new Date(dateString);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Recently";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );

    }


    /* =====================================================
       VIEW APPLICATION
    ===================================================== */

    function handleViewApplication(
        applicationId
    ) {

        navigate(
            `/jobseeker/application/${applicationId}`
        );

    }


    /* =====================================================
       USER
    ===================================================== */

    const userName =
        user?.first_name ||
        user?.name ||
        user?.username ||
        "Job Seeker";

    const userInitial =
        String(userName)
            .charAt(0)
            .toUpperCase();


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="myapplications-page">

            <style>{`

                /* =================================================
                   ROOT
                ================================================= */

                .myapplications-page {
                    --paper: #fff8f2;
                    --white: #ffffff;
                    --ink: #1a1410;
                    --ink-soft: #70665d;

                    --coral: #ff5b3d;
                    --coral-deep: #e23f22;

                    --teal: #0b8f7a;
                    --gold: #ffc94d;

                    --line: #ebe0d4;
                    --soft: #f7efe7;

                    --sidebar: #17110d;

                    min-height: 100vh;
                    width: 100%;

                    display: flex;

                    background:
                        var(--paper);

                    color:
                        var(--ink);

                    font-family:
                        "Inter",
                        Arial,
                        sans-serif;

                    box-sizing:
                        border-box;
                }


                .myapplications-page *,
                .myapplications-page
                *::before,
                .myapplications-page
                *::after {
                    box-sizing:
                        border-box;
                }


                /* =================================================
                   SIDEBAR
                ================================================= */

                .myapplications-sidebar {

                    position: fixed;

                    left: 0;
                    top: 0;
                    bottom: 0;

                    width: 250px;

                    padding:
                        28px 16px;

                    background:
                        linear-gradient(
                            160deg,
                            #17110d 0%,
                            #241b14 50%,
                            #17110d 100%
                        );

                    color: #ffffff;

                    display: flex;

                    flex-direction:
                        column;

                    z-index: 100;

                    overflow-y: auto;

                    border-right:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.08
                        );

                    transition:
                        transform 0.25s ease;
                }


                /* =================================================
                   LOGO
                ================================================= */

                .myapplications-brand {

                    display: flex;

                    align-items: center;

                    gap: 0.7rem;

                    padding:
                        0 10px;

                    margin-bottom:
                        34px;
                }


                .myapplications-brand svg {

                    width: 38px;

                    height: 38px;

                    flex-shrink: 0;

                    filter:
                        drop-shadow(
                            0 0 10px
                            rgba(
                                255,
                                201,
                                77,
                                0.25
                            )
                        );
                }


                .myapplications-brand-name {

                    font-family:
                        "Bricolage Grotesque",
                        Arial,
                        sans-serif;

                    font-weight: 800;

                    font-size: 1.3rem;

                    letter-spacing:
                        0.01em;

                    color:
                        #fff8f2;
                }


                /* =================================================
                   USER
                ================================================= */

                .myapplications-user {

                    display: flex;

                    align-items: center;

                    gap: 11px;

                    padding: 12px;

                    margin:
                        0 0 25px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.1
                        );

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.045
                        );

                    border-radius:
                        14px;
                }


                .myapplications-avatar {

                    width: 38px;
                    height: 38px;

                    border-radius:
                        50%;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    flex-shrink: 0;

                    background:
                        linear-gradient(
                            135deg,
                            var(--coral),
                            var(--gold)
                        );

                    color: #ffffff;

                    font-weight: 800;
                }


                .myapplications-user-info {
                    min-width: 0;
                }


                .myapplications-user-name {

                    display: block;

                    color:
                        #ffffff;

                    font-size:
                        0.82rem;

                    font-weight:
                        700;

                    overflow:
                        hidden;

                    white-space:
                        nowrap;

                    text-overflow:
                        ellipsis;
                }


                .myapplications-user-role {

                    display: block;

                    margin-top: 2px;

                    color:
                        #a99c90;

                    font-size:
                        0.7rem;
                }


                /* =================================================
                   NAV TITLE
                ================================================= */

                .myapplications-nav-title {

                    padding:
                        0 12px;

                    margin:
                        0 0 10px;

                    color:
                        #897c70;

                    font-size:
                        0.67rem;

                    font-weight:
                        700;

                    letter-spacing:
                        0.13em;

                    text-transform:
                        uppercase;
                }


                /* =================================================
                   NAVIGATION
                ================================================= */

                .myapplications-nav {

                    display: flex;

                    flex-direction:
                        column;

                    gap: 5px;
                }


                .myapplications-nav a {

                    position: relative;

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    min-height: 46px;

                    padding:
                        0 13px;

                    border-radius:
                        11px;

                    color:
                        #cfc3b8;

                    text-decoration:
                        none;

                    font-size:
                        0.83rem;

                    font-weight:
                        600;

                    transition:
                        all 0.2s ease;
                }


                .myapplications-nav a i {

                    width: 20px;

                    text-align: center;

                    font-size: 15px;
                }


                .myapplications-nav a:hover {

                    color:
                        #ffffff;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.07
                        );

                    transform:
                        translateX(2px);
                }


                .myapplications-nav a.active {

                    color:
                        #ffffff;

                    background:
                        linear-gradient(
                            135deg,
                            var(--coral),
                            var(--coral-deep)
                        );

                    box-shadow:
                        0 8px 22px
                        rgba(
                            255,
                            91,
                            61,
                            0.24
                        );
                }


                .myapplications-nav a.active i {
                    color:
                        #ffffff;
                }


                /* =================================================
                   LOGOUT
                ================================================= */

                .myapplications-logout {

                    position: relative;

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    min-height: 46px;

                    padding:
                        0 13px;

                    margin-top: 5px;

                    width: 100%;

                    border: none;

                    border-radius: 11px;

                    background:
                        transparent;

                    color:
                        #cfc3b8;

                    font-family:
                        inherit;

                    font-size:
                        0.83rem;

                    font-weight:
                        600;

                    text-align:
                        left;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .myapplications-logout i {

                    width: 20px;

                    text-align:
                        center;

                    font-size:
                        15px;
                }


                .myapplications-logout:hover {

                    color:
                        #ffffff;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.07
                        );

                    transform:
                        translateX(2px);
                }


                .myapplications-logout:hover i {
                    color:
                        var(--coral);
                }


                /* =================================================
                   SIDEBAR BOTTOM
                ================================================= */

                .myapplications-sidebar-bottom {

                    margin-top:
                        auto;

                    padding-top:
                        25px;
                }


                .myapplications-tip {

                    padding: 14px;

                    border-radius:
                        14px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.08
                        );

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.04
                        );
                }


                .myapplications-tip-title {

                    color:
                        var(--gold);

                    font-size:
                        0.72rem;

                    font-weight:
                        700;

                    margin-bottom:
                        6px;
                }


                .myapplications-tip p {

                    margin: 0;

                    color:
                        #aaa096;

                    font-size:
                        0.68rem;

                    line-height:
                        1.55;
                }


                /* =================================================
                   MAIN
                ================================================= */

                .myapplications-main {

                    width:
                        100%;

                    margin-left:
                        0;

                    min-height:
                        100vh;

                    padding:
                        30px 34px 50px;
                }


                /* =================================================
                   TOP BAR
                ================================================= */

                .myapplications-topbar {

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 20px;

                    margin-bottom:
                        28px;
                }


                .myapplications-heading {

                    display: flex;

                    align-items: center;

                    gap: 12px;
                }


                .myapplications-heading h1 {

                    margin: 0;

                    font-family:
                        "Bricolage Grotesque",
                        Arial,
                        sans-serif;

                    font-size:
                        clamp(
                            1.8rem,
                            3vw,
                            2.5rem
                        );

                    line-height:
                        1.1;

                    letter-spacing:
                        -0.03em;
                }


                .myapplications-heading p {

                    margin:
                        7px 0 0;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.86rem;
                }


                .myapplications-mobile-menu {

                    display: none;

                    width: 42px;
                    height: 42px;

                    border:
                        1px solid
                        var(--line);

                    background:
                        #ffffff;

                    border-radius:
                        11px;

                    align-items: center;
                    justify-content: center;

                    cursor: pointer;

                    color:
                        var(--ink);
                }


                .myapplications-notification {

                    width: 42px;
                    height: 42px;

                    border:
                        1px solid
                        var(--line);

                    background:
                        var(--white);

                    border-radius:
                        12px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    color:
                        var(--ink-soft);

                    cursor: pointer;

                    transition:
                        all 0.2s ease;
                }


                .myapplications-notification:hover {

                    color:
                        var(--coral);

                    border-color:
                        var(--coral);
                }


                /* =================================================
                   STATISTICS
                ================================================= */

                .applications-statistics {

                    display: grid;

                    grid-template-columns:
                        repeat(
                            5,
                            minmax(0, 1fr)
                        );

                    gap: 14px;

                    margin-bottom:
                        22px;
                }


                .application-stat-card {

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    padding:
                        17px;

                    background:
                        #ffffff;

                    border:
                        1px solid
                        var(--line);

                    border-radius:
                        15px;

                    transition:
                        all 0.2s ease;
                }


                .application-stat-card:hover {

                    transform:
                        translateY(-2px);

                    box-shadow:
                        0 10px 25px
                        rgba(
                            45,
                            27,
                            13,
                            0.07
                        );
                }


                .application-stat-icon {

                    width: 42px;
                    height: 42px;

                    flex-shrink: 0;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    border-radius:
                        11px;

                    background:
                        #fff0e9;

                    font-size:
                        1.05rem;
                }


                .application-stat-card span {

                    display: block;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.65rem;

                    font-weight:
                        600;

                    line-height:
                        1.3;
                }


                .application-stat-card strong {

                    display: block;

                    margin-top: 3px;

                    color:
                        var(--ink);

                    font-family:
                        "Bricolage Grotesque",
                        Arial,
                        sans-serif;

                    font-size:
                        1.35rem;

                    line-height:
                        1;
                }


                /* =================================================
                   CHART
                ================================================= */

                .applications-chart-card {

                    background:
                        #ffffff;

                    border:
                        1px solid
                        var(--line);

                    border-radius:
                        18px;

                    padding:
                        22px;

                    margin-bottom:
                        22px;

                    box-shadow:
                        0 10px 35px
                        rgba(
                            49,
                            31,
                            17,
                            0.05
                        );
                }


                .applications-chart-header {

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 15px;

                    margin-bottom:
                        12px;
                }


                .applications-chart-header h2 {

                    margin: 0;

                    font-family:
                        "Bricolage Grotesque",
                        Arial,
                        sans-serif;

                    font-size:
                        1.05rem;
                }


                .applications-chart-header p {

                    margin:
                        5px 0 0;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.72rem;
                }


                .chart-total {

                    min-width: 75px;

                    text-align:
                        right;
                }


                .chart-total span {

                    display: block;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.65rem;
                }


                .chart-total strong {

                    display: block;

                    margin-top: 2px;

                    color:
                        var(--coral);

                    font-size:
                        1.35rem;

                    font-weight:
                        800;
                }


                .applications-line-chart {

                    width: 100%;

                    height: 320px;
                }


                .applications-chart-empty {

                    min-height:
                        280px;

                    display: flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    text-align:
                        center;
                }


                .chart-empty-icon {

                    width: 58px;
                    height: 58px;

                    border-radius:
                        50%;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    background:
                        #fff0e9;

                    color:
                        var(--coral);

                    font-size:
                        1.2rem;

                    margin-bottom:
                        12px;
                }


                .applications-chart-empty h3 {

                    margin:
                        0 0 6px;

                    font-family:
                        "Bricolage Grotesque",
                        Arial,
                        sans-serif;

                    font-size:
                        1rem;
                }


                .applications-chart-empty p {

                    max-width:
                        400px;

                    margin: 0;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.72rem;

                    line-height:
                        1.5;
                }


                /* =================================================
                   FILTERS
                ================================================= */

                .application-filters {

                    display: flex;

                    align-items: center;

                    flex-wrap: wrap;

                    gap: 8px;

                    margin-bottom:
                        16px;
                }


                .application-filter {

                    border:
                        1px solid
                        var(--line);

                    background:
                        #ffffff;

                    color:
                        var(--ink-soft);

                    border-radius:
                        9px;

                    padding:
                        9px 13px;

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


                .application-filter:hover {

                    color:
                        var(--coral);

                    border-color:
                        #f0b7aa;

                    background:
                        #fffaf7;
                }


                .application-filter.active {

                    color:
                        #ffffff;

                    border-color:
                        var(--coral);

                    background:
                        linear-gradient(
                            135deg,
                            var(--coral),
                            var(--coral-deep)
                        );

                    box-shadow:
                        0 6px 15px
                        rgba(
                            255,
                            91,
                            61,
                            0.18
                        );
                }


                /* =================================================
                   APPLICATION TABLE
                ================================================= */

                .applications-card {

                    background:
                        #ffffff;

                    border:
                        1px solid
                        var(--line);

                    border-radius:
                        17px;

                    overflow:
                        hidden;

                    box-shadow:
                        0 8px 28px
                        rgba(
                            49,
                            31,
                            17,
                            0.04
                        );
                }


                .applications-table-header,
                .application-row {

                    display: grid;

                    grid-template-columns:
                        1.5fr
                        1.15fr
                        0.85fr
                        1.05fr
                        0.55fr;

                    align-items:
                        center;

                    column-gap:
                        15px;
                }


                .applications-table-header {

                    min-height:
                        48px;

                    padding:
                        0 20px;

                    background:
                        #faf5f0;

                    border-bottom:
                        1px solid
                        var(--line);

                    color:
                        #8c7e71;

                    font-size:
                        0.63rem;

                    font-weight:
                        800;

                    letter-spacing:
                        0.08em;
                }


                .application-row {

                    min-height:
                        74px;

                    padding:
                        12px 20px;

                    border-bottom:
                        1px solid
                        #f0e8e0;

                    color:
                        #4d433b;

                    font-size:
                        0.75rem;

                    transition:
                        background 0.2s ease;
                }


                .application-row:last-child {
                    border-bottom:
                        none;
                }


                .application-row:hover {

                    background:
                        #fffaf6;
                }


                .application-role {

                    color:
                        var(--ink);

                    font-size:
                        0.78rem;

                    font-weight:
                        800;

                    line-height:
                        1.35;
                }


                .application-date {

                    color:
                        var(--ink-soft);

                    font-size:
                        0.7rem;
                }


                /* =================================================
                   STATUS
                ================================================= */

                .application-status {

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        6px 9px;

                    border-radius:
                        999px;

                    font-size:
                        0.61rem;

                    font-weight:
                        800;

                    white-space:
                        nowrap;
                }


                .application-status.applied {

                    color:
                        #a06400;

                    background:
                        #fff4d8;
                }


                .application-status.shortlisted {

                    color:
                        #087866;

                    background:
                        #e7f7f3;
                }


                .application-status.interview_scheduled {

                    color:
                        #5b45a5;

                    background:
                        #f0eaff;
                }


                .application-status.hired {

                    color:
                        #16703c;

                    background:
                        #e4f8eb;
                }


                .application-status.rejected {

                    color:
                        #b13b2b;

                    background:
                        #ffebe7;
                }


                /* =================================================
                   VIEW BUTTON
                ================================================= */

                .view-application-button {

                    border:
                        1px solid
                        #f1c7bb;

                    background:
                        #fff7f4;

                    color:
                        var(--coral);

                    border-radius:
                        8px;

                    padding:
                        7px 12px;

                    font-family:
                        inherit;

                    font-size:
                        0.67rem;

                    font-weight:
                        800;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .view-application-button:hover {

                    color:
                        #ffffff;

                    background:
                        var(--coral);

                    border-color:
                        var(--coral);

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 5px 13px
                        rgba(
                            255,
                            91,
                            61,
                            0.2
                        );
                }


                /* =================================================
                   MESSAGES
                ================================================= */

                .applications-message {

                    min-height:
                        180px;

                    display: flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        30px;

                    text-align:
                        center;

                    color:
                        var(--ink-soft);

                    font-size:
                        0.78rem;
                }


                .applications-message.error {

                    color:
                        #c74432;

                    background:
                        #fff5f2;
                }


                /* =================================================
                   MOBILE OVERLAY
                ================================================= */

                .myapplications-overlay {
                    display: none;
                }


                /* =================================================
                   RESPONSIVE
                ================================================= */

                @media (max-width: 1200px) {

                    .applications-statistics {

                        grid-template-columns:
                            repeat(
                                3,
                                minmax(0, 1fr)
                            );
                    }

                }


                @media (max-width: 1000px) {

                    .applications-table-header,
                    .application-row {

                        grid-template-columns:
                            1.4fr
                            1fr
                            0.8fr
                            1fr
                            0.55fr;
                    }

                    .application-status {

                        font-size:
                            0.58rem;
                    }

                }


                @media (max-width: 800px) {

                    .myapplications-sidebar {

                        transform:
                            translateX(-100%);
                    }


                    .myapplications-sidebar.mobile-open {

                        transform:
                            translateX(0);

                        box-shadow:
                            10px 0 40px
                            rgba(
                                0,
                                0,
                                0,
                                0.25
                            );
                    }


                    .myapplications-overlay {

                        position: fixed;

                        inset: 0;

                        background:
                            rgba(
                                0,
                                0,
                                0,
                                0.35
                            );

                        z-index: 90;

                        display: block;
                    }


                    .myapplications-main {

                        width: 100%;

                        margin-left: 0;

                        padding:
                            22px 18px 40px;
                    }


                    .myapplications-mobile-menu {

                        display: flex;
                    }


                    .myapplications-topbar {

                        align-items:
                            flex-start;
                    }


                    .myapplications-heading {

                        align-items:
                            flex-start;
                    }


                    .applications-statistics {

                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0, 1fr)
                            );
                    }


                    .applications-table-header {

                        display:
                            none;
                    }


                    .application-row {

                        grid-template-columns:
                            1fr 1fr;

                        row-gap:
                            10px;

                        padding:
                            17px;
                    }


                    .application-row > div:nth-child(1) {

                        grid-column:
                            1 / -1;
                    }


                    .application-row > div:nth-child(5) {

                        text-align:
                            right;
                    }

                }


                @media (max-width: 520px) {

                    .myapplications-main {

                        padding:
                            18px 12px 30px;
                    }


                    .myapplications-heading h1 {

                        font-size:
                            1.65rem;
                    }


                    .myapplications-heading p {

                        font-size:
                            0.74rem;
                    }


                    .myapplications-notification {

                        display:
                            none;
                    }


                    .applications-statistics {

                        grid-template-columns:
                            1fr;
                    }


                    .application-stat-card {

                        padding:
                            14px;
                    }


                    .applications-chart-card {

                        padding:
                            16px;
                    }


                    .applications-chart-header {

                        align-items:
                            flex-start;
                    }


                    .applications-line-chart {

                        height:
                            260px;
                    }


                    .application-filters {

                        overflow-x:
                            auto;

                        flex-wrap:
                            nowrap;

                        padding-bottom:
                            4px;
                    }


                    .application-filter {

                        flex-shrink:
                            0;
                    }


                    .application-row {

                        grid-template-columns:
                            1fr;

                        gap:
                            8px;
                    }


                    .application-row > div:nth-child(1),
                    .application-row > div:nth-child(5) {

                        grid-column:
                            auto;

                        text-align:
                            left;
                    }


                    .view-application-button {

                        width:
                            100%;
                    }

                }

            `}</style>


            {/* =====================================================
                MOBILE OVERLAY
            ===================================================== */}

            {mobileMenu && (
                <div
                    className="myapplications-overlay"
                    onClick={() =>
                        setMobileMenu(false)
                    }
                />
            )}


            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside
                className={`myapplications-sidebar ${
                    mobileMenu
                        ? "mobile-open"
                        : ""
                }`}
            >

                {/* LOGO */}

                <div className="myapplications-brand">

                    <svg
                        viewBox="0 0 40 40"
                        fill="none"
                        aria-hidden="true"
                    >

                        <circle
                            cx="8"
                            cy="28"
                            r="4"
                            fill="#0B8F7A"
                        />

                        <circle
                            cx="32"
                            cy="28"
                            r="4"
                            fill="#FF5B3D"
                        />

                        <path
                            d="M4 30 C 4 12, 36 12, 36 30"
                            stroke="#FFC94D"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />

                    </svg>

                    <span className="myapplications-brand-name">
                        Job Connect
                    </span>

                </div>


                {/* USER */}

                <div className="myapplications-user">

                    <div className="myapplications-avatar">
                        {userInitial}
                    </div>

                    <div className="myapplications-user-info">

                        <span className="myapplications-user-name">
                            {userName}
                        </span>

                        <span className="myapplications-user-role">
                            Job Seeker
                        </span>

                    </div>

                </div>


                <div className="myapplications-nav-title">
                    Main Menu
                </div>


                {/* NAVIGATION */}

                <nav className="myapplications-nav">

                    <Link
                        to="/jobseeker/dashboard"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <i className="fa-solid fa-grid-2"></i>

                        <span>
                            Dashboard
                        </span>
                    </Link>


                    <Link
                        to="/jobseeker/jobs"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <i className="fa-solid fa-briefcase"></i>

                        <span>
                            Find Jobs
                        </span>
                    </Link>


                    <Link
                        to="/jobseeker/applications"
                        className="active"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <i className="fa-solid fa-file-lines"></i>

                        <span>
                            My Applications
                        </span>
                    </Link>


                    <Link
                        to="/jobseeker/saved-jobs"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <i className="fa-solid fa-bookmark"></i>

                        <span>
                            Saved Jobs
                        </span>
                    </Link>


                    <Link
                        to="/jobseeker/profile"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <i className="fa-solid fa-user"></i>

                        <span>
                            My Profile
                        </span>
                    </Link>


                    {/* LOGOUT */}

                    <button
                        type="button"
                        className="myapplications-logout"
                        onClick={handleLogout}
                    >

                        <i className="fa-solid fa-right-from-bracket"></i>

                        <span>
                            Logout
                        </span>

                    </button>

                </nav>


                {/* SIDEBAR BOTTOM */}

                <div className="myapplications-sidebar-bottom">

                    <div className="myapplications-tip">

                        <div className="myapplications-tip-title">

                            <i className="fa-solid fa-lightbulb"></i>{" "}

                            Career tip

                        </div>

                        <p>
                            Keep your profile updated
                            to discover better job
                            opportunities.
                        </p>

                    </div>

                </div>

            </aside>


            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="myapplications-main">


                {/* TOP BAR */}

                <div className="myapplications-topbar">

                    <div className="myapplications-heading">

                        <button
                            className="myapplications-mobile-menu"
                            type="button"
                            onClick={() =>
                                setMobileMenu(
                                    (prev) => !prev
                                )
                            }
                            aria-label="Open menu"
                        >

                            <i className="fa-solid fa-bars"></i>

                        </button>


                        <div>

                            <h1>
                                My Applications
                            </h1>

                            <p>

                                {loading
                                    ? "Loading applications..."
                                    : `${allCount} application${
                                        allCount === 1
                                            ? ""
                                            : "s"
                                    } sent`
                                }

                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="myapplications-notification"
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


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="applications-statistics">


                    <div className="application-stat-card">

                        <div className="application-stat-icon">
                            📄
                        </div>

                        <div>

                            <span>
                                Total Applications
                            </span>

                            <strong>
                                {allCount}
                            </strong>

                        </div>

                    </div>


                    <div className="application-stat-card">

                        <div className="application-stat-icon">
                            ⏳
                        </div>

                        <div>

                            <span>
                                Applied
                            </span>

                            <strong>
                                {appliedCount}
                            </strong>

                        </div>

                    </div>


                    <div className="application-stat-card">

                        <div className="application-stat-icon">
                            ⭐
                        </div>

                        <div>

                            <span>
                                Shortlisted
                            </span>

                            <strong>
                                {shortlistedCount}
                            </strong>

                        </div>

                    </div>


                    <div className="application-stat-card">

                        <div className="application-stat-icon">
                            🎯
                        </div>

                        <div>

                            <span>
                                Interviews
                            </span>

                            <strong>
                                {interviewScheduledCount}
                            </strong>

                        </div>

                    </div>


                    <div className="application-stat-card">

                        <div className="application-stat-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Hired
                            </span>

                            <strong>
                                {hiredCount}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    APPLICATION ACTIVITY
                ================================================= */}

                <section className="applications-chart-card">

                    <div className="applications-chart-header">

                        <div>

                            <h2>
                                Application Activity
                            </h2>

                            <p>
                                Your application activity over time
                            </p>

                        </div>

                        <div className="chart-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                {allCount}
                            </strong>

                        </div>

                    </div>


                    {chartData.length > 0 ? (

                        <div className="applications-line-chart">

                            <ResponsiveContainer
                                width="100%"
                                height={320}
                            >

                                <LineChart
                                    data={chartData}
                                    margin={{
                                        top: 15,
                                        right: 20,
                                        left: 0,
                                        bottom: 10,
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />


                                    <XAxis
                                        dataKey="date"
                                        tick={{
                                            fontSize: 12,
                                            fill: "#64748b",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />


                                    <YAxis
                                        allowDecimals={false}
                                        tick={{
                                            fontSize: 12,
                                            fill: "#64748b",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />


                                    <Tooltip
                                        contentStyle={{
                                            borderRadius:
                                                "10px",
                                            border:
                                                "1px solid #e5e7eb",
                                            boxShadow:
                                                "0 8px 25px rgba(15, 23, 42, 0.10)",
                                        }}
                                        formatter={(
                                            value
                                        ) => [
                                            value,
                                            "Applications",
                                        ]}
                                    />


                                    <Line
                                        type="monotone"
                                        dataKey="applications"
                                        stroke="#ff5b3d"
                                        strokeWidth={3}
                                        dot={{
                                            r: 5,
                                            fill: "#ffffff",
                                            stroke: "#ff5b3d",
                                            strokeWidth: 3,
                                        }}
                                        activeDot={{
                                            r: 7,
                                        }}
                                    />

                                </LineChart>

                            </ResponsiveContainer>

                        </div>

                    ) : (

                        <div className="applications-chart-empty">

                            <div className="chart-empty-icon">
                                📊
                            </div>

                            <h3>
                                No application activity yet
                            </h3>

                            <p>
                                Your application activity
                                will appear here once you
                                apply for jobs.
                            </p>

                        </div>

                    )}

                </section>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="application-filters">


                    <button
                        type="button"
                        className={
                            activeFilter === "all"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("all")
                        }
                    >
                        All ({allCount})
                    </button>


                    <button
                        type="button"
                        className={
                            activeFilter === "applied"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("applied")
                        }
                    >
                        Applied ({appliedCount})
                    </button>


                    <button
                        type="button"
                        className={
                            activeFilter === "shortlisted"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("shortlisted")
                        }
                    >
                        Shortlisted ({shortlistedCount})
                    </button>


                    <button
                        type="button"
                        className={
                            activeFilter ===
                            "interview_scheduled"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter(
                                "interview_scheduled"
                            )
                        }
                    >
                        Interview Scheduled (
                        {interviewScheduledCount}
                        )
                    </button>


                    <button
                        type="button"
                        className={
                            activeFilter === "hired"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("hired")
                        }
                    >
                        Hired ({hiredCount})
                    </button>


                    <button
                        type="button"
                        className={
                            activeFilter === "rejected"
                                ? "application-filter active"
                                : "application-filter"
                        }
                        onClick={() =>
                            setActiveFilter("rejected")
                        }
                    >
                        Not selected ({rejectedCount})
                    </button>

                </div>


                {/* =================================================
                    APPLICATIONS
                ================================================= */}

                <section className="applications-card">


                    {/* TABLE HEADER */}

                    <div className="applications-table-header">

                        <div>
                            ROLE
                        </div>

                        <div>
                            COMPANY
                        </div>

                        <div>
                            APPLIED
                        </div>

                        <div>
                            STATUS
                        </div>

                        <div>
                        </div>

                    </div>


                    {/* LOADING */}

                    {loading && (

                        <div className="applications-message">

                            Loading applications...

                        </div>

                    )}


                    {/* ERROR */}

                    {!loading &&
                        error && (

                            <div className="applications-message error">

                                {error}

                            </div>

                        )
                    }


                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        filteredApplications.length === 0 && (

                            <div className="applications-message">

                                No applications found.

                            </div>

                        )
                    }


                    {/* APPLICATION LIST */}

                    {!loading &&
                        !error &&
                        filteredApplications.map(
                            (application) => (

                                <div
                                    className="application-row"
                                    key={
                                        application.id
                                    }
                                >

                                    {/* ROLE */}

                                    <div className="application-role">

                                        {
                                            application.job_title ||
                                            application.job?.title ||
                                            "Job"
                                        }

                                    </div>


                                    {/* COMPANY */}

                                    <div>

                                        {
                                            application.company_name ||
                                            application.company?.name ||
                                            application.employer_name ||
                                            "Company"
                                        }

                                    </div>


                                    {/* DATE */}

                                    <div className="application-date">

                                        {formatDate(
                                            application.applied_at ||
                                            application.created_at
                                        )}

                                    </div>


                                    {/* STATUS */}

                                    <div>

                                        <span
                                            className={
                                                `application-status ${
                                                    getStatusClass(
                                                        application.status
                                                    )
                                                }`
                                            }
                                        >

                                            {formatStatus(
                                                application.status
                                            )}

                                        </span>

                                    </div>


                                    {/* VIEW */}

                                    <div>

                                        <button
                                            type="button"
                                            className="view-application-button"
                                            onClick={() =>
                                                handleViewApplication(
                                                    application.id
                                                )
                                            }
                                        >
                                            View
                                        </button>

                                    </div>

                                </div>

                            )
                        )
                    }

                </section>

            </main>

        </div>
    );
}


export default MyApplications;

