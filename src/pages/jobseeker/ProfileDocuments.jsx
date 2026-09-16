
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   HELPERS
========================================================= */

const getFileNameFromUrl = (url) => {
    if (!url) return "";

    const cleanUrl = String(url).split("?")[0];
    const parts = cleanUrl.split("/");

    return parts[parts.length - 1] || "Uploaded File";
};

const getAuthToken = () => {
    return (
        localStorage.getItem("jc_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
    );
};

const isTrue = (value) => {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) {
        return false;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        return [
            "true",
            "1",
            "yes",
            "y",
        ].includes(value.trim().toLowerCase());
    }

    return Boolean(value);
};

const getErrorMessage = async (response, fallback) => {
    try {
        const data = await response.json();

        if (data?.detail) {
            return data.detail;
        }

        if (data?.message) {
            return data.message;
        }

        if (data?.error) {
            return data.error;
        }

        if (data && typeof data === "object") {
            const firstKey = Object.keys(data)[0];

            if (firstKey) {
                const value = data[firstKey];

                if (Array.isArray(value)) {
                    return `${firstKey}: ${value.join(", ")}`;
                }

                if (typeof value === "string") {
                    return `${firstKey}: ${value}`;
                }
            }
        }
    } catch {
        // Response was not JSON.
    }

    return fallback;
};

/* =========================================================
   FILE VALIDATION
========================================================= */

const validateFile = (
    file,
    allowedTypes,
    maxSizeMB,
    label
) => {
    if (!file) {
        return true;
    }

    const maxSize =
        maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
        return `${label} must be less than ${maxSizeMB}MB.`;
    }

    const fileType = String(file.type || "").toLowerCase();

    if (
        fileType &&
        !allowedTypes.includes(fileType)
    ) {
        return `${label} has an unsupported file format.`;
    }

    return true;
};

/* =========================================================
   DOCUMENT ROW
========================================================= */

const DocumentRow = ({
    icon,
    title,
    description,
    required,
    existingFile,
    selectedFile,
    accept,
    onChange,
    formats,
}) => {
    return (
        <div className="pd-document">
            <div className="pd-document-icon">
                {icon}
            </div>

            <div className="pd-document-content">

                <div className="pd-document-title">
                    <h3>{title}</h3>

                    {required ? (
                        <span className="required">
                            REQUIRED
                        </span>
                    ) : (
                        <span className="optional">
                            OPTIONAL
                        </span>
                    )}
                </div>

                <p>{description}</p>

                {existingFile && !selectedFile && (
                    <div className="pd-file">
                        <span className="pd-file-check">
                            ✓
                        </span>

                        <span>
                            Existing:{" "}
                            {existingFile.name ||
                                "Uploaded File"}
                        </span>
                    </div>
                )}

                {selectedFile && (
                    <div className="pd-file pd-new-file">
                        <span className="pd-file-check">
                            ✓
                        </span>

                        <span>
                            Selected:{" "}
                            {selectedFile.name}
                        </span>
                    </div>
                )}

                <label className="pd-upload-button">
                    <span>
                        {selectedFile || existingFile
                            ? "Change File"
                            : "Upload File"}
                    </span>

                    <input
                        type="file"
                        accept={accept}
                        onChange={onChange}
                    />
                </label>

                <small>
                    Accepted formats: {formats}
                </small>
            </div>
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function ProfileDocuments() {
    const navigate = useNavigate();

    /* =====================================================
       SELECTED FILES
    ===================================================== */

    const [photo, setPhoto] = useState(null);
    const [resume, setResume] = useState(null);
    const [idProof, setIdProof] = useState(null);

    const [
        disabilityCertificate,
        setDisabilityCertificate,
    ] = useState(null);

    const [disabilityId, setDisabilityId] =
        useState(null);

    /* =====================================================
       EXISTING FILES
    ===================================================== */

    const [existingPhoto, setExistingPhoto] =
        useState(null);

    const [existingResume, setExistingResume] =
        useState(null);

    const [existingIdProof, setExistingIdProof] =
        useState(null);

    const [
        existingDisabilityCertificate,
        setExistingDisabilityCertificate,
    ] = useState(null);

    const [
        existingDisabilityId,
        setExistingDisabilityId,
    ] = useState(null);

    /* =====================================================
       PROFILE STATE
    ===================================================== */

    const [isDisabledPerson, setIsDisabledPerson] =
        useState(false);

    const [approvalStatus, setApprovalStatus] =
        useState("PENDING");

    const [profileCompleted, setProfileCompleted] =
        useState(false);

    /* =====================================================
       UI STATE
    ===================================================== */

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] =
        useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] =
        useState(null);

    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const token = getAuthToken();

        if (!token) {
            setError(
                "Authentication token missing. Please login again."
            );
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                "/api/auth/jobseeker/profile/",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            if (response.status === 401) {
                throw new Error(
                    "Your session has expired. Please login again."
                );
            }

            if (!response.ok) {
                const message =
                    await getErrorMessage(
                        response,
                        "Failed to load profile."
                    );

                throw new Error(message);
            }

            const data =
                await response.json();

            /* -----------------------------------------
               DISABILITY
            ----------------------------------------- */

            const disabled =
                isTrue(data?.disability) ||
                isTrue(data?.is_disabled) ||
                isTrue(data?.disabled) ||
                isTrue(
                    data?.isDisabledPerson
                );

            setIsDisabledPerson(disabled);

            /* -----------------------------------------
               APPROVAL STATUS
            ----------------------------------------- */

            const status = String(
                data?.approval_status ??
                    data?.approvalStatus ??
                    "pending"
            )
                .trim()
                .toUpperCase();

            setApprovalStatus(status);

            /* -----------------------------------------
               PROFILE COMPLETED
            ----------------------------------------- */

            setProfileCompleted(
                data?.profile_completed === true ||
                    data?.profileCompleted === true
            );

            /* -----------------------------------------
               PROFILE PHOTO
            ----------------------------------------- */

            if (data?.profile_photo) {
                setExistingPhoto({
                    url: data.profile_photo,
                    name: getFileNameFromUrl(
                        data.profile_photo
                    ),
                });
            } else {
                setExistingPhoto(null);
            }

            /* -----------------------------------------
               RESUME
            ----------------------------------------- */

            if (data?.resume) {
                setExistingResume({
                    url: data.resume,
                    name: getFileNameFromUrl(
                        data.resume
                    ),
                });
            } else {
                setExistingResume(null);
            }

            /* -----------------------------------------
               ID PROOF
            ----------------------------------------- */

            const idFile =
                data?.aadhaar ||
                data?.aadhaar_card ||
                data?.id_proof;

            if (idFile) {
                setExistingIdProof({
                    url: idFile,
                    name: getFileNameFromUrl(
                        idFile
                    ),
                });
            } else {
                setExistingIdProof(null);
            }

            /* -----------------------------------------
               DISABILITY CERTIFICATE
            ----------------------------------------- */

            if (
                data?.disability_certificate
            ) {
                setExistingDisabilityCertificate({
                    url:
                        data.disability_certificate,
                    name: getFileNameFromUrl(
                        data.disability_certificate
                    ),
                });
            } else {
                setExistingDisabilityCertificate(
                    null
                );
            }

            /* -----------------------------------------
               DISABILITY ID
            ----------------------------------------- */

            if (data?.disability_id) {
                setExistingDisabilityId({
                    url: data.disability_id,
                    name: getFileNameFromUrl(
                        data.disability_id
                    ),
                });
            } else {
                setExistingDisabilityId(null);
            }
        } catch (err) {
            console.error(
                "Load profile error:",
                err
            );

            setError(
                err?.message ||
                    "Failed to load your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       FILE CHANGE HANDLERS
    ===================================================== */

    const handlePhotoChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const validation =
            validateFile(
                file,
                [
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                ],
                5,
                "Profile Photo"
            );

        if (validation !== true) {
            setError(validation);
            event.target.value = "";
            return;
        }

        setError(null);
        setPhoto(file);
    };

    const handleResumeChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const validation =
            validateFile(
                file,
                [
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ],
                10,
                "Resume"
            );

        if (validation !== true) {
            setError(validation);
            event.target.value = "";
            return;
        }

        setError(null);
        setResume(file);
    };

    const handleIdProofChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const validation =
            validateFile(
                file,
                [
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                ],
                5,
                "ID Proof"
            );

        if (validation !== true) {
            setError(validation);
            event.target.value = "";
            return;
        }

        setError(null);
        setIdProof(file);
    };

    const handleDisabilityCertificateChange = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const validation =
            validateFile(
                file,
                [
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                ],
                5,
                "Disability Certificate"
            );

        if (validation !== true) {
            setError(validation);
            event.target.value = "";
            return;
        }

        setError(null);
        setDisabilityCertificate(file);
    };

    const handleDisabilityIdChange = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const validation =
            validateFile(
                file,
                [
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                ],
                5,
                "Disability ID"
            );

        if (validation !== true) {
            setError(validation);
            event.target.value = "";
            return;
        }

        setError(null);
        setDisabilityId(file);
    };

    /* =====================================================
       SUBMIT FOR APPROVAL
    ===================================================== */

    const handleContinue = async () => {
        if (uploading) return;

        setError(null);
        setSuccess(null);

        /* -----------------------------------------
           REQUIRED DOCUMENT VALIDATION
        ----------------------------------------- */

        if (!photo && !existingPhoto) {
            setError(
                "Please upload a Profile Photo."
            );
            return;
        }

        if (!resume && !existingResume) {
            setError(
                "Please upload your Resume / CV."
            );
            return;
        }

        if (
            !idProof &&
            !existingIdProof
        ) {
            setError(
                "Please upload your ID proof document."
            );
            return;
        }

        if (
            isDisabledPerson &&
            !disabilityCertificate &&
            !existingDisabilityCertificate
        ) {
            setError(
                "Please upload your Disability Certificate."
            );
            return;
        }

        const token = getAuthToken();

        if (!token) {
            setError(
                "Authentication token missing. Please login again."
            );
            return;
        }

        setUploading(true);

        try {
            /* =========================================
               STEP 1
               UPLOAD NEW DOCUMENTS
            ========================================= */

            const hasNewFiles =
                Boolean(photo) ||
                Boolean(resume) ||
                Boolean(idProof) ||
                Boolean(
                    disabilityCertificate
                ) ||
                Boolean(disabilityId);

            if (hasNewFiles) {
                const formData =
                    new FormData();

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

                if (idProof) {
                    formData.append(
                        "aadhaar",
                        idProof
                    );
                }

                if (
                    disabilityCertificate
                ) {
                    formData.append(
                        "disability_certificate",
                        disabilityCertificate
                    );
                }

                if (disabilityId) {
                    formData.append(
                        "disability_id",
                        disabilityId
                    );
                }

                const uploadResponse =
                    await fetch(
                        "/api/auth/jobseeker/profile/",
                        {
                            method: "PATCH",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            body: formData,
                        }
                    );

                if (
                    uploadResponse.status ===
                    401
                ) {
                    throw new Error(
                        "Your session is not authorized. Please login again."
                    );
                }

                if (!uploadResponse.ok) {
                    const message =
                        await getErrorMessage(
                            uploadResponse,
                            "Failed to upload documents."
                        );

                    throw new Error(
                        message
                    );
                }

                await uploadResponse
                    .json()
                    .catch(() => null);
            }

            /* =========================================
               STEP 2
               SUBMIT PROFILE FOR APPROVAL
            ========================================= */

            const submitResponse =
                await fetch(
                    "/api/auth/jobseeker/profile/submit/",
                    {
                        method: "POST",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            if (
                submitResponse.status ===
                401
            ) {
                throw new Error(
                    "Your session is not authorized. Please login again."
                );
            }

            if (!submitResponse.ok) {
                const message =
                    await getErrorMessage(
                        submitResponse,
                        "Failed to submit profile for approval."
                    );

                throw new Error(
                    message
                );
            }

            const submitData =
                await submitResponse
                    .json()
                    .catch(() => null);

            /* =========================================
               STEP 3
               UPDATE LOCAL STORAGE
            ========================================= */

            let currentUser = {};

            try {
                currentUser =
                    JSON.parse(
                        localStorage.getItem(
                            "jc_user"
                        ) ||
                            localStorage.getItem(
                                "user"
                            ) ||
                            "{}"
                    );
            } catch {
                currentUser = {};
            }

            const updatedUser = {
                ...currentUser,

                profile_completed:
                    submitData?.profile_completed ??
                    true,

                approval_status:
                    submitData?.approval_status ??
                    "pending",
            };

            localStorage.setItem(
                "jc_user",
                JSON.stringify(
                    updatedUser
                )
            );

            if (
                localStorage.getItem(
                    "user"
                )
            ) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        updatedUser
                    )
                );
            }

            /* =========================================
               UPDATE COMPONENT STATE
            ========================================= */

            setProfileCompleted(true);
            setApprovalStatus("PENDING");

            setPhoto(null);
            setResume(null);
            setIdProof(null);
            setDisabilityCertificate(null);
            setDisabilityId(null);

            setSuccess(
                "Profile submitted successfully for approval."
            );

            /* =========================================
               STEP 4
               GO TO REVIEW PAGE
            ========================================= */

            navigate(
                "/jobseeker/profile/review",
                {
                    replace: true,
                }
            );
        } catch (err) {
            console.error(
                "Profile submission error:",
                err
            );

            setError(
                err?.message ||
                    "An error occurred while submitting your profile."
            );
        } finally {
            setUploading(false);
        }
    };

    /* =====================================================
       BACK TO PROFILE
    ===================================================== */

    const handleBackToProfile = () => {
        if (uploading) return;

        navigate(
            "/jobseeker/profile"
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <style>
                    {styles}
                </style>

                <div className="pd-wrapper">
                    <div className="pd-loading">
                        <div className="pd-spinner"></div>
                        <p>
                            Loading your documents...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <style>
                {styles}
            </style>

            <div className="pd-wrapper">

                <div className="pd-container">

                    {/* =====================================
                        HEADER
                    ===================================== */}

                    <div className="pd-heading">

                        <div className="pd-heading-top">
                            <span className="pd-eyebrow">
                                JOBSEEKER PROFILE
                            </span>

                            <span className="pd-status">
                                {approvalStatus}
                            </span>
                        </div>

                        <h1>
                            Profile Documents
                        </h1>

                        <p>
                            Upload the required
                            documents to complete
                            your profile and submit
                            it for approval.
                        </p>

                    </div>

                    {/* =====================================
                        ERROR
                    ===================================== */}

                    {error && (
                        <div className="pd-alert pd-alert-error">
                            <span>
                                ⚠
                            </span>

                            <p>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* =====================================
                        SUCCESS
                    ===================================== */}

                    {success && (
                        <div className="pd-alert pd-alert-success">
                            <span>
                                ✓
                            </span>

                            <p>
                                {success}
                            </p>
                        </div>
                    )}

                    {/* =====================================
                        PENDING MESSAGE
                    ===================================== */}

                    {profileCompleted &&
                        approvalStatus ===
                            "PENDING" && (
                            <div className="pd-alert pd-alert-info">

                                <span>
                                    ℹ
                                </span>

                                <div>
                                    <strong>
                                        Profile submitted
                                    </strong>

                                    <p>
                                        Your profile is
                                        currently waiting
                                        for admin approval.
                                    </p>
                                </div>

                            </div>
                        )}

                    {/* =====================================
                        DOCUMENT CARD
                    ===================================== */}

                    <div className="pd-card">

                        <div className="pd-card-header">

                            <div>
                                <h2>
                                    Required Documents
                                </h2>

                                <p>
                                    Please make sure
                                    all required
                                    documents are
                                    uploaded.
                                </p>
                            </div>

                        </div>

                        <div className="pd-document-list">

                            {/* PROFILE PHOTO */}

                            <DocumentRow
                                icon="👤"
                                title="Profile Photo"
                                description="Upload a clear recent photograph."
                                required={true}
                                existingFile={
                                    existingPhoto
                                }
                                selectedFile={
                                    photo
                                }
                                accept=".jpg,.jpeg,.png"
                                onChange={
                                    handlePhotoChange
                                }
                                formats="JPG, JPEG, PNG — Max 5MB"
                            />

                            {/* RESUME */}

                            <DocumentRow
                                icon="📄"
                                title="Resume / CV"
                                description="Upload your latest resume or CV."
                                required={true}
                                existingFile={
                                    existingResume
                                }
                                selectedFile={
                                    resume
                                }
                                accept=".pdf,.doc,.docx"
                                onChange={
                                    handleResumeChange
                                }
                                formats="PDF, DOC, DOCX — Max 10MB"
                            />

                            {/* ID PROOF */}

                            <DocumentRow
                                icon="🪪"
                                title="ID Proof"
                                description="Upload your government-issued identification document."
                                required={true}
                                existingFile={
                                    existingIdProof
                                }
                                selectedFile={
                                    idProof
                                }
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={
                                    handleIdProofChange
                                }
                                formats="PDF, JPG, JPEG, PNG — Max 5MB"
                            />

                            {/* DISABILITY CERTIFICATE */}

                            {isDisabledPerson && (
                                <DocumentRow
                                    icon="♿"
                                    title="Disability Certificate"
                                    description="Upload your valid disability certificate."
                                    required={true}
                                    existingFile={
                                        existingDisabilityCertificate
                                    }
                                    selectedFile={
                                        disabilityCertificate
                                    }
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={
                                        handleDisabilityCertificateChange
                                    }
                                    formats="PDF, JPG, JPEG, PNG — Max 5MB"
                                />
                            )}

                            {/* DISABILITY ID */}

                            {isDisabledPerson && (
                                <DocumentRow
                                    icon="🪪"
                                    title="Disability ID"
                                    description="Upload your disability identification card."
                                    required={false}
                                    existingFile={
                                        existingDisabilityId
                                    }
                                    selectedFile={
                                        disabilityId
                                    }
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={
                                        handleDisabilityIdChange
                                    }
                                    formats="PDF, JPG, JPEG, PNG — Max 5MB"
                                />
                            )}

                        </div>
                    </div>

                    {/* =====================================
                        SUBMISSION INFORMATION
                    ===================================== */}

                    <div className="pd-card pd-card-secondary">

                        <div className="pd-card-header">
                            <h2>
                                Before submitting
                            </h2>

                            <p>
                                Make sure all required
                                documents are correct.
                            </p>
                        </div>

                        <div className="pd-info-list">

                            <div className="pd-info-item">
                                <span>01</span>
                                <p>
                                    Upload all required
                                    documents.
                                </p>
                            </div>

                            <div className="pd-info-item">
                                <span>02</span>
                                <p>
                                    Click{" "}
                                    <strong>
                                        Submit for Approval
                                    </strong>.
                                </p>
                            </div>

                            <div className="pd-info-item">
                                <span>03</span>
                                <p>
                                    Your profile will be
                                    marked as completed.
                                </p>
                            </div>

                            <div className="pd-info-item">
                                <span>04</span>
                                <p>
                                    Your profile will
                                    enter the admin
                                    approval queue.
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* =====================================
                        ACTION BUTTONS
                    ===================================== */}

                    <div className="pd-actions">

                        <button
                            type="button"
                            className="pd-btn pd-btn-secondary"
                            onClick={
                                handleBackToProfile
                            }
                            disabled={
                                uploading
                            }
                        >
                            ← Back to Profile
                        </button>

                        <button
                            type="button"
                            className="pd-btn pd-btn-primary"
                            onClick={
                                handleContinue
                            }
                            disabled={
                                uploading ||
                                (
                                    profileCompleted &&
                                    approvalStatus ===
                                        "PENDING"
                                )
                            }
                        >
                            {uploading
                                ? "Submitting..."
                                : profileCompleted &&
                                  approvalStatus ===
                                      "PENDING"
                                ? "Submitted for Approval"
                                : "Submit for Approval →"}
                        </button>

                    </div>

                </div>
            </div>
        </>
    );
}

/* =========================================================
   BLACK & WHITE STYLES
========================================================= */

const styles = `
* {
    box-sizing: border-box;
}

.pd-wrapper {
    width: 100%;
    min-height: 100vh;
    background: #ffffff;
    color: #000000;
    font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

.pd-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 24px 60px;
}

/* =========================================
   HEADER
========================================= */

.pd-heading {
    margin-bottom: 30px;
}

.pd-heading-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 10px;
}

.pd-eyebrow {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #000000;
}

.pd-heading h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.2;
    font-weight: 800;
    color: #000000;
}

.pd-heading p {
    margin: 10px 0 0;
    color: #555555;
    font-size: 15px;
    line-height: 1.6;
}

/* =========================================
   STATUS
========================================= */

.pd-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border: 1px solid #000000;
    border-radius: 999px;
    background: #ffffff;
    color: #000000;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
}

/* =========================================
   ALERT
========================================= */

.pd-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    margin-bottom: 20px;
    border: 1px solid #000000;
    border-radius: 8px;
    background: #f5f5f5;
    color: #000000;
}

.pd-alert > span {
    font-weight: 800;
    font-size: 18px;
}

.pd-alert p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
}

.pd-alert strong {
    display: block;
    margin-bottom: 3px;
}

/* =========================================
   CARD
========================================= */

.pd-card {
    background: #ffffff;
    border: 1px solid #000000;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
}

.pd-card-secondary {
    background: #fafafa;
}

.pd-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px;
    border-bottom: 1px solid #000000;
}

.pd-card-header h2 {
    margin: 0;
    color: #000000;
    font-size: 18px;
    font-weight: 750;
}

.pd-card-header p {
    margin: 5px 0 0;
    color: #666666;
    font-size: 13px;
}

/* =========================================
   DOCUMENT LIST
========================================= */

.pd-document-list {
    width: 100%;
}

.pd-document {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding: 22px;
    border-bottom: 1px solid #dddddd;
    background: #ffffff;
}

.pd-document:last-child {
    border-bottom: none;
}

/* =========================================
   DOCUMENT ICON
========================================= */

.pd-document-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #000000;
    border-radius: 10px;
    background: #eeeeee;
    color: #000000;
    font-size: 21px;
}

/* =========================================
   DOCUMENT CONTENT
========================================= */

.pd-document-content {
    flex: 1;
    min-width: 0;
}

.pd-document-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.pd-document-title h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #000000;
}

.pd-document-content > p {
    margin: 5px 0 10px;
    color: #666666;
    font-size: 13px;
    line-height: 1.5;
}

/* =========================================
   REQUIRED
========================================= */

.required {
    display: inline-flex;
    align-items: center;
    padding: 3px 7px;
    border-radius: 4px;
    background: #000000;
    color: #ffffff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.4px;
}

.optional {
    display: inline-flex;
    align-items: center;
    padding: 3px 7px;
    border-radius: 4px;
    border: 1px solid #000000;
    background: #ffffff;
    color: #000000;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.4px;
}

/* =========================================
   FILE
========================================= */

.pd-file {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    max-width: 100%;
    padding: 7px 10px;
    margin-bottom: 10px;
    border: 1px solid #cccccc;
    border-radius: 6px;
    background: #f2f2f2;
    color: #000000;
    font-size: 12px;
}

.pd-file span:last-child {
    max-width: 400px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.pd-file-check {
    font-weight: 900;
}

.pd-new-file {
    border-color: #000000;
    background: #000000;
    color: #ffffff;
}

/* =========================================
   UPLOAD BUTTON
========================================= */

.pd-upload-button {
    display: inline-block;
    cursor: pointer;
}

.pd-upload-button span {
    display: inline-block;
    padding: 8px 14px;
    border: 1px solid #000000;
    border-radius: 6px;
    background: #ffffff;
    color: #000000;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.2s ease;
}

.pd-upload-button span:hover {
    background: #000000;
    color: #ffffff;
}

.pd-upload-button input {
    display: none;
}

.pd-document-content small {
    display: block;
    margin-top: 7px;
    color: #777777;
    font-size: 11px;
}

/* =========================================
   INFORMATION LIST
========================================= */

.pd-info-list {
    padding: 8px 22px 20px;
}

.pd-info-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 13px 0;
    border-bottom: 1px solid #dddddd;
}

.pd-info-item:last-child {
    border-bottom: none;
}

.pd-info-item > span {
    width: 28px;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #000000;
    border-radius: 50%;
    background: #000000;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
}

.pd-info-item p {
    margin: 3px 0 0;
    color: #444444;
    font-size: 13px;
    line-height: 1.5;
}

.pd-info-item strong {
    color: #000000;
}

/* =========================================
   ACTIONS
========================================= */

.pd-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-top: 25px;
}

.pd-btn {
    min-height: 44px;
    padding: 10px 18px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* =========================================
   SECONDARY BUTTON
========================================= */

.pd-btn-secondary {
    border: 1px solid #000000;
    background: #ffffff;
    color: #000000;
}

.pd-btn-secondary:hover:not(:disabled) {
    background: #000000;
    color: #ffffff;
}

/* =========================================
   PRIMARY BUTTON
========================================= */

.pd-btn-primary {
    border: 1px solid #000000;
    background: #000000;
    color: #ffffff;
}

.pd-btn-primary:hover:not(:disabled) {
    background: #333333;
    border-color: #333333;
}

/* =========================================
   DISABLED
========================================= */

.pd-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =========================================
   LOADING
========================================= */

.pd-loading {
    width: 100%;
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
}

.pd-loading p {
    margin: 0;
    color: #555555;
    font-size: 14px;
}

.pd-spinner {
    width: 38px;
    height: 38px;
    border: 3px solid #dddddd;
    border-top-color: #000000;
    border-radius: 50%;
    animation: pd-spin 0.8s linear infinite;
}

@keyframes pd-spin {
    to {
        transform: rotate(360deg);
    }
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 700px) {

    .pd-container {
        padding: 25px 15px 45px;
    }

    .pd-heading h1 {
        font-size: 27px;
    }

    .pd-heading-top {
        align-items: flex-start;
        flex-direction: column;
    }

    .pd-document {
        padding: 18px 15px;
        gap: 13px;
    }

    .pd-document-icon {
        width: 42px;
        min-width: 42px;
        height: 42px;
        font-size: 18px;
    }

    .pd-actions {
        flex-direction: column-reverse;
        align-items: stretch;
    }

    .pd-btn {
        width: 100%;
    }

    .pd-file {
        max-width: 100%;
    }

    .pd-file span:last-child {
        max-width: 220px;
    }
}

@media (max-width: 450px) {

    .pd-container {
        padding-left: 10px;
        padding-right: 10px;
    }

    .pd-card-header {
        padding: 16px;
    }

    .pd-document {
        padding: 16px 12px;
    }

    .pd-document-title h3 {
        font-size: 14px;
    }

    .pd-document-content > p {
        font-size: 12px;
    }
}
`;

export default ProfileDocuments;

