import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE =
    `${import.meta.env.VITE_API_BASE_URL}/auth/jobseeker/`;
    
const PROFILE_API = `${API_BASE}profile/`;
const SUBMIT_PROFILE_API = `${API_BASE}submit-profile/`;

const REVIEW_ROUTE = "/jobseeker/profile/review";


function ProfileDocuments() {

    const navigate = useNavigate();

    // =========================================================
    // FILE STATES
    // =========================================================

    const [photo, setPhoto] = useState(null);
    const [resume, setResume] = useState(null);
    const [aadhaar, setAadhaar] = useState(null);


    // =========================================================
    // EXISTING FILES
    // =========================================================

    const [existingPhoto, setExistingPhoto] = useState(null);
    const [existingResume, setExistingResume] = useState(null);
    const [existingAadhaar, setExistingAadhaar] = useState(null);


    // =========================================================
    // PROFILE STATUS
    // =========================================================

    const [profileCompleted, setProfileCompleted] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState("pending");


    // =========================================================
    // PAGE STATES
    // =========================================================

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // LOAD PROFILE
    // =========================================================

    useEffect(() => {

        loadProfile();

    }, []);


    async function loadProfile() {

        setLoading(true);
        setError("");

        const token = localStorage.getItem("jc_token");

        if (!token) {

            setError(
                "Please log in to continue."
            );

            setLoading(false);

            return;
        }


        try {

            const response = await fetch(
                PROFILE_API,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to load your profile."
                );
            }


            // =================================================
            // PROFILE STATUS
            // =================================================

            setProfileCompleted(
                Boolean(data.profile_completed)
            );

            setApprovalStatus(
                data.approval_status || "pending"
            );


            // =================================================
            // EXISTING PHOTO
            // =================================================

            if (data.profile_photo) {

                setExistingPhoto({
                    url: data.profile_photo,
                    name: getFileName(
                        data.profile_photo
                    ),
                });

            } else {

                setExistingPhoto(null);

            }


            // =================================================
            // EXISTING RESUME
            // =================================================

            if (data.resume) {

                setExistingResume({
                    url: data.resume,
                    name: getFileName(
                        data.resume
                    ),
                });

            } else {

                setExistingResume(null);

            }


            // =================================================
            // EXISTING AADHAAR
            // =================================================

            if (data.aadhaar) {

                setExistingAadhaar({
                    url: data.aadhaar,
                    name: getFileName(
                        data.aadhaar
                    ),
                });

            } else {

                setExistingAadhaar(null);

            }

        }

        catch (err) {

            console.error(
                "Profile loading error:",
                err
            );

            setError(
                err.message ||
                "Unable to load your profile."
            );

        }

        finally {

            setLoading(false);

        }
    }


    // =========================================================
    // FILE NAME
    // =========================================================

    function getFileName(url) {

        if (!url) {
            return "";
        }

        try {

            return decodeURIComponent(
                url.split("/").pop()
            );

        }

        catch {

            return url.split("/").pop();

        }
    }


    // =========================================================
    // PHOTO CHANGE
    // =========================================================

    function handlePhotoChange(event) {

        if (profileCompleted) {
            return;
        }

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
        ];


        if (!allowedTypes.includes(file.type)) {

            setError(
                "Please upload a JPG or PNG photo."
            );

            event.target.value = "";

            return;
        }


        setPhoto(file);
        setError("");
        setSuccess("");
    }


    // =========================================================
    // RESUME CHANGE
    // =========================================================

    function handleResumeChange(event) {

        if (profileCompleted) {
            return;
        }

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }


        const allowedTypes = [

            "application/pdf",

            "application/msword",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        ];


        if (!allowedTypes.includes(file.type)) {

            setError(
                "Please upload a PDF, DOC, or DOCX resume."
            );

            event.target.value = "";

            return;
        }


        setResume(file);
        setError("");
        setSuccess("");
    }


    // =========================================================
    // AADHAAR CHANGE
    // =========================================================

    function handleAadhaarChange(event) {

        if (profileCompleted) {
            return;
        }

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }


        const allowedTypes = [

            "application/pdf",

            "image/jpeg",

            "image/png",

        ];


        if (!allowedTypes.includes(file.type)) {

            setError(
                "Please upload a PDF, JPG, JPEG, or PNG Aadhaar card."
            );

            event.target.value = "";

            return;
        }


        setAadhaar(file);
        setError("");
        setSuccess("");
    }


    // =========================================================
    // UPLOAD DOCUMENTS
    // =========================================================

    async function uploadDocuments() {

        setError("");
        setSuccess("");


        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Your session has expired. Please log in again."
            );

            return false;
        }


        // =====================================================
        // PROFILE ALREADY LOCKED
        // =====================================================

        if (profileCompleted) {

            setError(
                "Your profile has already been submitted and is locked."
            );

            return false;
        }


        // =====================================================
        // REQUIRED DOCUMENT VALIDATION
        // =====================================================

        if (!photo && !existingPhoto) {

            setError(
                "Please upload your profile photo."
            );

            return false;
        }


        if (!resume && !existingResume) {

            setError(
                "Please upload your resume."
            );

            return false;
        }


        if (!aadhaar && !existingAadhaar) {

            setError(
                "Please upload your Aadhaar card."
            );

            return false;
        }


        // =====================================================
        // NOTHING NEW TO UPLOAD
        // =====================================================

        if (
            !photo &&
            !resume &&
            !aadhaar
        ) {

            return true;
        }


        const formData = new FormData();


        if (photo) {

            formData.append(
                "profile_photo",
                photo
            );
        }


        if (resume) {

            formData.append(
                "resume",
                resume
            );
        }


        if (aadhaar) {

            formData.append(
                "aadhaar",
                aadhaar
            );
        }


        try {

            setUploading(true);


            const response = await fetch(
                PROFILE_API,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            if (!response.ok) {

                throw new Error(

                    data.detail ||

                    data.message ||

                    "Document upload failed."

                );
            }


            const updatedProfile =
                data.profile || data;


            // =================================================
            // UPDATE PHOTO
            // =================================================

            if (
                updatedProfile.profile_photo
            ) {

                setExistingPhoto({

                    url:
                        updatedProfile.profile_photo,

                    name:
                        photo?.name ||
                        getFileName(
                            updatedProfile.profile_photo
                        ),

                });
            }


            // =================================================
            // UPDATE RESUME
            // =================================================

            if (
                updatedProfile.resume
            ) {

                setExistingResume({

                    url:
                        updatedProfile.resume,

                    name:
                        resume?.name ||
                        getFileName(
                            updatedProfile.resume
                        ),

                });
            }


            // =================================================
            // UPDATE AADHAAR
            // =================================================

            if (
                updatedProfile.aadhaar
            ) {

                setExistingAadhaar({

                    url:
                        updatedProfile.aadhaar,

                    name:
                        aadhaar?.name ||
                        getFileName(
                            updatedProfile.aadhaar
                        ),

                });
            }


            // =================================================
            // CLEAR NEW FILE STATES
            // =================================================

            setPhoto(null);
            setResume(null);
            setAadhaar(null);


            setSuccess(
                "Documents uploaded successfully."
            );


            return true;

        }

        catch (err) {

            console.error(
                "Document upload error:",
                err
            );

            setError(
                err.message ||
                "Unable to upload documents."
            );

            return false;

        }

        finally {

            setUploading(false);

        }
    }


    // =========================================================
    // SUBMIT PROFILE FOR REVIEW
    // =========================================================

    async function submitProfileForReview() {

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Your session has expired. Please log in again."
            );

            return false;
        }


        try {

            setSubmitting(true);
            setError("");


            const response = await fetch(
                SUBMIT_PROFILE_API,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({}),
                }
            );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            if (!response.ok) {

                throw new Error(

                    data.detail ||

                    data.message ||

                    "Unable to submit your profile."

                );
            }


            // =================================================
            // IMPORTANT
            // =================================================
            // Django has now set:
            //
            // profile_completed = True
            // approval_status = pending
            //
            // Lock frontend
            // =================================================

            setProfileCompleted(true);

            setApprovalStatus(
                data.approval_status || "pending"
            );


            setSuccess(
                "Your profile has been submitted successfully for review."
            );


            return true;

        }

        catch (err) {

            console.error(
                "Profile submission error:",
                err
            );

            setError(
                err.message ||
                "Unable to submit your profile."
            );

            return false;

        }

        finally {

            setSubmitting(false);

        }
    }


    // =========================================================
    // CONTINUE TO REVIEW
    // =========================================================

    async function handleContinue() {

        setError("");
        setSuccess("");


        // =====================================================
        // IF ALREADY COMPLETED
        // =====================================================

        if (profileCompleted) {

            navigate(
                REVIEW_ROUTE
            );

            return;
        }


        // =====================================================
        // STEP 1
        // UPLOAD DOCUMENTS
        // =====================================================

        const uploaded =
            await uploadDocuments();


        if (!uploaded) {

            return;
        }


        // =====================================================
        // STEP 2
        // LOCK PROFILE / SUBMIT FOR REVIEW
        // =====================================================

        const submitted =
            await submitProfileForReview();


        if (!submitted) {

            return;
        }


        // =====================================================
        // STEP 3
        // GO TO REVIEW PAGE
        // =====================================================

        navigate(
            REVIEW_ROUTE
        );
    }


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="profile-details-page">

                <main className="profile-details-main">

                    <div className="profile-loading">

                        Loading documents...

                    </div>

                </main>

            </div>

        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="profile-details-page">


            {/* =================================================
                STEP INDICATOR
            ================================================= */}

            <div className="profile-steps">


                {/* STEP 1 */}

                <div className="profile-step completed">

                    <span>
                        ✓
                    </span>

                    Details

                </div>


                <div className="profile-step-line"></div>


                {/* STEP 2 */}

                <div
                    className={
                        profileCompleted
                            ? "profile-step completed"
                            : "profile-step active"
                    }
                >

                    <span>

                        {profileCompleted
                            ? "✓"
                            : "2"
                        }

                    </span>

                    Documents

                </div>


                <div className="profile-step-line"></div>


                {/* STEP 3 */}

                <div
                    className={
                        profileCompleted
                            ? "profile-step active"
                            : "profile-step"
                    }
                >

                    <span>
                        3
                    </span>

                    Review

                </div>

            </div>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="profile-details-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="profile-details-header">

                    <h1>
                        Profile & verification
                    </h1>

                    <p>

                        Upload your documents to complete
                        profile verification.

                    </p>

                </section>


                {/* =================================================
                    LOCKED MESSAGE
                ================================================= */}

                {profileCompleted && (

                    <div className="documents-success">

                        ✓ Your profile has been submitted
                        successfully and is now locked.

                        <br />

                        Approval status:
                        {" "}
                        <strong>
                            {approvalStatus}
                        </strong>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="documents-error">

                        {error}

                    </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && !profileCompleted && (

                    <div className="documents-success">

                        {success}

                    </div>

                )}


                {/* =================================================
                    DOCUMENTS
                ================================================= */}

                <section className="profile-section">


                    <div className="section-title-row">

                        <div>

                            <h2>
                                Verification documents
                            </h2>

                            <p className="section-description">

                                Please upload clear and valid
                                documents for verification.

                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        PROFILE PHOTO
                    ================================================= */}

                    <div className="document-item">


                        <div className="document-info">


                            <div className="document-title-row">

                                <h3>
                                    Profile photo
                                </h3>

                                <span className="required-badge">
                                    REQUIRED
                                </span>

                            </div>


                            <p>
                                Upload a clear photo of yourself.
                            </p>


                            {existingPhoto && !photo && (

                                <div className="existing-file">

                                    <span className="selected-file">

                                        ✓ {existingPhoto.name}

                                    </span>

                                </div>

                            )}


                            {photo && (

                                <span className="selected-file">

                                    ✓ {photo.name}

                                </span>

                            )}

                        </div>


                        {!profileCompleted && (

                            <label className="upload-button">

                                {photo || existingPhoto
                                    ? "Change"
                                    : "Upload"
                                }

                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    hidden
                                    onChange={
                                        handlePhotoChange
                                    }
                                />

                            </label>

                        )}

                    </div>


                    {/* =================================================
                        RESUME
                    ================================================= */}

                    <div className="document-item">


                        <div className="document-info">


                            <div className="document-title-row">

                                <h3>
                                    Resume
                                </h3>

                                <span className="required-badge">
                                    REQUIRED
                                </span>

                            </div>


                            <p>
                                Upload your latest resume.
                            </p>


                            {existingResume && !resume && (

                                <div className="existing-file">

                                    <span className="selected-file">

                                        ✓ {existingResume.name}

                                    </span>

                                </div>

                            )}


                            {resume && (

                                <span className="selected-file">

                                    ✓ {resume.name}

                                </span>

                            )}

                        </div>


                        {!profileCompleted && (

                            <label className="upload-button">

                                {resume || existingResume
                                    ? "Change"
                                    : "Upload"
                                }

                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    hidden
                                    onChange={
                                        handleResumeChange
                                    }
                                />

                            </label>

                        )}

                    </div>


                    {/* =================================================
                        AADHAAR
                    ================================================= */}

                    <div className="document-item">


                        <div className="document-info">


                            <div className="document-title-row">

                                <h3>
                                    Aadhaar card
                                </h3>

                                <span className="required-badge">
                                    REQUIRED
                                </span>

                            </div>


                            <p>

                                Upload your Aadhaar card
                                for verification.

                            </p>


                            {existingAadhaar && !aadhaar && (

                                <div className="existing-file">

                                    <span className="selected-file">

                                        ✓ {existingAadhaar.name}

                                    </span>

                                </div>

                            )}


                            {aadhaar && (

                                <span className="selected-file">

                                    ✓ {aadhaar.name}

                                </span>

                            )}

                        </div>


                        {!profileCompleted && (

                            <label className="upload-button">

                                {aadhaar || existingAadhaar
                                    ? "Change"
                                    : "Upload"
                                }

                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    hidden
                                    onChange={
                                        handleAadhaarChange
                                    }
                                />

                            </label>

                        )}

                    </div>


                    {/* =================================================
                        NOTE
                    ================================================= */}

                    <div className="documents-note">

                        <strong>
                            Note:
                        </strong>{" "}

                        Please make sure that all uploaded
                        documents are clear and readable.

                    </div>


                </section>


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="profile-save-area">


                    <div className="documents-actions">


                        {!profileCompleted && (

                            <Link
                                to="/jobseeker/profile"
                                className="back-button"
                            >

                                Back

                            </Link>

                        )}


                        {profileCompleted ? (

                            <button
                                type="button"
                                className="save-profile-button"
                                onClick={() =>
                                    navigate(REVIEW_ROUTE)
                                }
                            >

                                View Review

                            </button>

                        ) : (

                            <button
                                type="button"
                                className="save-profile-button"
                                onClick={
                                    handleContinue
                                }
                                disabled={
                                    uploading ||
                                    submitting
                                }
                            >

                                {uploading
                                    ? "Uploading..."
                                    : submitting
                                        ? "Submitting..."
                                        : "Continue to review"
                                }

                            </button>

                        )}

                    </div>

                </div>


            </main>

        </div>

    );
}


export default ProfileDocuments;