import { Navigate, Route, Routes } from "react-router-dom";

/* =========================================================
   AUTH
========================================================= */

import Login from "../pages/auth/LoginTemp";
import JobseekerSignup from "../pages/auth/JobseekerSignup";
import EmployerSignup from "../pages/auth/EmployerSignup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ResetPassword from "../pages/auth/ResetPassword";
import Chat from "../components/Chat";
import HelpSupport from "../components/HelpSupport";

/* =========================================================
   JOB SEEKER
========================================================= */

import JobseekerDashboard from "../pages/jobseeker/JobSeekerDashboard";
import FindJobs from "../pages/jobseeker/FindJobs";
import MyApplications from "../pages/jobseeker/MyApplications";
import ProfileDetails from "../pages/jobseeker/ProfileDetails";
import ProfileDocuments from "../pages/jobseeker/ProfileDocuments";
import ProfileReview from "../pages/jobseeker/ProfileReview";
import CompletedProfile from "../pages/jobseeker/CompletedProfile";
import JobseekerApplicationDetails from "../pages/jobseeker/JobSeekerApplicationDetails";
import JobDetails from "../pages/jobseeker/JobDetails";
import Notifications from "../pages/jobseeker/Notifications";

/* =========================================================
   EMPLOYER
========================================================= */

import EmployerDashboard from "../pages/employer/EmployerDashboard";
import MyJobs from "../pages/employer/MyJobs";
import PostJob from "../pages/employer/PostJob";
import Applicants from "../pages/employer/Applicants";
import CompanyVerification from "../pages/employer/CompanyVerification";
import EmployerProfile from "../pages/employer/EmployerProfile";
import ApplicantProfile from "../pages/employer/ApplicantProfile";

/* =========================================================
   ADMIN
========================================================= */

import AdminDashboard from "../pages/admin/AdminDashboard";
import VerificationQueue from "../pages/admin/VerificationQueue";
import ReportsFlags from "../pages/admin/ReportsFlags";
import Users from "../pages/admin/Users";
import AdminJobSeekerProfile from "../pages/admin/AdminJobSeekerProfile";
import AdminEmployerProfile from "../pages/admin/AdminEmployerProfile";

/* =========================================================
   LAYOUTS
========================================================= */

import JobseekerLayout from "../components/JobSeekerLayout";
import EmployerLayout from "../components/EmployerLayout";
import AdminLayout from "../components/AdminLayout";


function AppRoutes() {
    return (
        <Routes>

            {/* =====================================================
                AUTH ROUTES
                No sidebar
            ===================================================== */}

            <Route path="/" element={<Login />} />

            <Route path="/home" element={<Login />} />

            <Route path="/login" element={<Login />} />

            <Route
                path="/forgot-password"
                element={<ForgotPassword />}
            />

            <Route
                path="/verify-otp"
                element={<VerifyOTP />}
            />

            <Route
                path="/reset-password"
                element={<ResetPassword />}
            />

            <Route
                path="/jobseeker/signup"
                element={<JobseekerSignup />}
            />

            <Route
                path="/employer/signup"
                element={<EmployerSignup />}
            />
            <Route
                path="/help-support"
                element={<HelpSupport />}
            />
            

            {/* =====================================================
                JOB SEEKER
                JobseekerLayout provides the sidebar
                to every child route
            ===================================================== */}

            <Route
                path="/jobseeker"
                element={<JobseekerLayout />}
            >

                {/* /jobseeker -> /jobseeker/dashboard */}
                <Route
                    index
                    element={
                        <Navigate
                            to="dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="dashboard"
                    element={<JobseekerDashboard />}
                />

                <Route
                    path="jobs"
                    element={<FindJobs />}
                />

                <Route
                    path="applications"
                    element={<MyApplications />}
                />

                <Route
                    path="profile"
                    element={<ProfileDetails />}
                />

                <Route
                    path="profile/documents"
                    element={<ProfileDocuments />}
                />

                <Route
                    path="profile/review"
                    element={<ProfileReview />}
                />

                <Route
                    path="profile/completed"
                    element={<CompletedProfile />}
                />

                <Route
                    path="application/:applicationId"
                    element={<JobseekerApplicationDetails />}
                />

                <Route
                    path="jobs/:jobId"
                    element={<JobDetails />}
                />

                <Route
                    path="notifications"
                    element={<Notifications />}
                />
                <Route
                    path="messages"
                    element={<Chat />}
                />
                
            </Route>


            {/* =====================================================
                EMPLOYER
                EmployerLayout provides the sidebar
                to every child route
            ===================================================== */}

            <Route
                path="/employer"
                element={<EmployerLayout />}
            >

                {/* /employer -> /employer/dashboard */}
                <Route
                    index
                    element={
                        <Navigate
                            to="dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="dashboard"
                    element={<EmployerDashboard />}
                />

                <Route
                    path="jobs"
                    element={<MyJobs />}
                />

                <Route
                    path="jobs/post"
                    element={<PostJob />}
                />

                <Route
                    path="jobs/:jobId/applicants"
                    element={<Applicants />}
                />

                <Route
                    path="profile"
                    element={<EmployerProfile />}
                />

                <Route
                    path="verification"
                    element={<CompanyVerification />}
                />

                <Route
                    path="applicants/:applicationId"
                    element={<ApplicantProfile />}
                />
                <Route
                    path="messages"
                    element={<Chat />}
                />

            </Route>


            {/* =====================================================
                ADMIN
                AdminLayout provides the sidebar
                to every child route
            ===================================================== */}

            <Route
                path="/admin"
                element={<AdminLayout />}
            >

                {/* /admin -> /admin/dashboard */}
                <Route
                    index
                    element={
                        <Navigate
                            to="dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="dashboard"
                    element={<AdminDashboard />}
                />

                <Route
                    path="verifications"
                    element={<VerificationQueue />}
                />

                <Route
                    path="reports"
                    element={<ReportsFlags />}
                />

                <Route
                    path="users"
                    element={<Users />}
                />

                <Route
                    path="jobseekers/:id"
                    element={<AdminJobSeekerProfile />}
                />

                <Route
                    path="employers/:id"
                    element={<AdminEmployerProfile />}
                />
                

            </Route>


            {/* =====================================================
                OPTIONAL 404 FALLBACK
            ===================================================== */}

            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />

        </Routes>
    );
}

export default AppRoutes;