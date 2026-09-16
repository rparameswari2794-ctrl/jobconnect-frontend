import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./DashboardLayout.css";

function getUserName() {
    try {
        const raw =
            localStorage.getItem("jc_user") ||
            localStorage.getItem("user");

        const user = raw ? JSON.parse(raw) : null;

        return (
            user?.name ||
            user?.full_name ||
            user?.username ||
            user?.first_name ||
            user?.email ||
            "Job Seeker"
        );
    } catch {
        return "Job Seeker";
    }
}

function getTitle(pathname) {
    if (pathname === "/jobseeker/dashboard") return "Dashboard";
    if (pathname === "/jobseeker/jobs") return "Find Jobs";
    if (pathname === "/jobseeker/applications") return "My Applications";
    if (pathname === "/jobseeker/profile") return "My Profile";
    if (pathname.includes("/application/")) return "Application Details";
    if (pathname.includes("/jobs/")) return "Job Details";
    if (pathname.includes("/profile/")) return "Profile";
    if (pathname.includes("/notifications")) return "Notifications";

    return "JobConnect";
}

function JobseekerLayout() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const title = getTitle(location.pathname);
    const userName = getUserName();

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.classList.add("jc-app-body");

        return () => {
            document.body.classList.remove("jc-app-body");
        };
    }, []);

    return (
        <div className="jc-layout">

            <Sidebar
                role="jobseeker"
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <div className="jc-content">

                <header className="jc-mobile-header">

                    <button
                        type="button"
                        className="jc-menu-button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className="jc-mobile-title">
                        <strong>{title}</strong>
                        <small>{userName}</small>
                    </div>

                </header>

                <main className="jc-page">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default JobseekerLayout;