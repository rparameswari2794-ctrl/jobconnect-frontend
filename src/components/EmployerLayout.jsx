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
            user?.contact_name ||
            user?.company_name ||
            user?.email ||
            "Employer"
        );
    } catch {
        return "Employer";
    }
}

function getTitle(pathname) {
    if (pathname === "/employer/dashboard") return "Dashboard";
    if (pathname === "/employer/jobs") return "My Jobs";
    if (pathname === "/employer/jobs/post") return "Post a Job";
    if (pathname === "/employer/profile") return "Company Profile";
    if (pathname === "/employer/verification") return "Verification";
    if (pathname.includes("/jobs/")) return "Applicants";
    if (pathname.includes("/applicants/")) return "Applicant Profile";

    return "JobConnect";
}

function EmployerLayout() {
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
                role="employer"
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

export default EmployerLayout;