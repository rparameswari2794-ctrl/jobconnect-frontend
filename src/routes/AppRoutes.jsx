import { Routes, Route } from "react-router-dom";

/* ================= AUTH ================= */

import Login from "@/pages/auth/Login";
import JobseekerSignup from "@/pages/auth/JobseekerSignup";
import EmployerSignup from "@/pages/auth/EmployerSignup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyOTP from "@/pages/auth/VerifyOTP";
import ResetPassword from "@/pages/auth/ResetPassword";


/* ================= JOB SEEKER ================= */

import JobseekerDashboard from "@/pages/jobseeker/JobSeekerDashboard";
import FindJobs from "@/pages/jobseeker/FindJobs";
import MyApplications from "@/pages/jobseeker/MyApplications";

import ProfileDetails from "@/pages/jobseeker/ProfileDetails";
import ProfileDocuments from "@/pages/jobseeker/ProfileDocuments";
import ProfileReview from "@/pages/jobseeker/ProfileReview";
import CompletedProfile from "@/pages/jobseeker/CompletedProfile";
import JobseekerApplicationDetails
    from "@/pages/jobseeker/JobSeekerApplicationDetails";
import JobDetails from "@/pages/jobseeker/JobDetails";


/* ================= EMPLOYER ================= */

import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import MyJobs from "@/pages/employer/MyJobs";
import PostJob from "@/pages/employer/PostJob";
import Applicants from "@/pages/employer/Applicants";
import CompanyVerification from "@/pages/employer/CompanyVerification";
import EmployerProfile from "@/pages/employer/EmployerProfile";
import ApplicantProfile from "@/pages/employer/ApplicantProfile";


/* ================= ADMIN ================= */

import AdminDashboard from "@/pages/admin/AdminDashboard";
import VerificationQueue from "@/pages/admin/VerificationQueue";
import ReportsFlags from "@/pages/admin/ReportsFlags";
import Users from "@/pages/admin/Users";
import AdminJobSeekerProfile from "@/pages/admin/AdminJobSeekerProfile";
import AdminEmployerProfile from "@/pages/admin/AdminEmployerProfile";


function AppRoutes() {

    return (

        <Routes>

            {/* =================================================
                AUTH
            ================================================= */}

            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/home"
                element={<Login />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

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


            {/* =================================================
                JOB SEEKER
            ================================================= */}

            <Route
                path="/jobseeker/dashboard"
                element={<JobseekerDashboard />}
            />

            <Route
                path="/jobseeker/jobs"
                element={<FindJobs />}
            />

            <Route
                path="/jobseeker/applications"
                element={<MyApplications />}
            />


            {/* =================================================
                PROFILE STEP 1
            ================================================= */}

            <Route
                path="/jobseeker/profile"
                element={<ProfileDetails />}
            />


            {/* =================================================
                PROFILE STEP 2
            ================================================= */}

            <Route
                path="/jobseeker/profile/documents"
                element={<ProfileDocuments />}
            />


            {/* =================================================
                PROFILE STEP 3
            ================================================= */}

            <Route
                path="/jobseeker/profile/review"
                element={<ProfileReview />}
            />
            <Route
                path="/jobseeker/profile/completed"
                element={<CompletedProfile />}
            />
            <Route
                path="/jobseeker/application/:applicationId"
                element={
                    <JobseekerApplicationDetails />
                }
            />
            <Route
                path="/jobseeker/jobs/:jobId"
                element={<JobDetails />}
            />


            {/* =================================================
                EMPLOYER
            ================================================= */}

            <Route
                path="/employer/dashboard"
                element={<EmployerDashboard />}
            />

            <Route
                path="/employer/jobs"
                element={<MyJobs />}
            />

            <Route
                path="/employer/jobs/post"
                element={<PostJob />}
            />

            <Route
                path="/employer/jobs/:jobId/applicants"
                element={<Applicants />}
            />

            <Route
                path="/employer/profile"
                element={<EmployerProfile />}
            />

            
            <Route
                path="/employer/verification"
                element={<CompanyVerification />}
            />
            <Route
                path="/employer/applicants/:applicationId"
                element={<ApplicantProfile />}
            />


            {/* =================================================
                ADMIN
            ================================================= */}

            <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
            />

            <Route
                path="/admin/verifications"
                element={<VerificationQueue />}
            />

            <Route
                path="/admin/reports"
                element={<ReportsFlags />}
            />

            <Route
                path="/admin/users"
                element={<Users />}
            />
            <Route
                path="/admin/jobseekers/:id"
                element={<AdminJobSeekerProfile />}
            />

            <Route
                path="/admin/employers/:id"
                element={<AdminEmployerProfile />}
            />

        </Routes>

    );

}

export default AppRoutes;