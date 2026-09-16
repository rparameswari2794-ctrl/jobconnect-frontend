import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ReportsFlags() {

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =====================================================
    // LOAD REPORTS
    // =====================================================

    useEffect(() => {

        fetchReports();

    }, []);


    async function fetchReports() {

        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("jc_token");


        if (!token) {

            setError(
                "Admin login session not found."
            );

            setReports([]);
            setLoading(false);

            return;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE}/admin/reports/`,
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
                "REPORTS API STATUS:",
                response.status
            );

            console.log(
                "REPORTS API RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Failed to load reports."
                );
            }


            // =================================================
            // NORMALIZE RESPONSE
            // =================================================

            const normalizedReports =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.results)
                        ? data.results
                        : [];


            console.log(
                "NORMALIZED REPORTS:",
                normalizedReports
            );


            setReports(
                normalizedReports
            );


        } catch (err) {

            console.error(
                "REPORTS ERROR:",
                err
            );


            setError(
                err.message ||
                "Could not load reports right now."
            );


            setReports([]);


        } finally {

            setLoading(false);

        }
    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "";
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
    // RENDER
    // =====================================================

    return (

        <div className="admin-dashboard reports-page">

            <main className="admin-main reports-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="reports-header">

                    <div className="reports-title-area">

                        <div className="reports-title-icon">
                            ⚑
                        </div>

                        <div>

                            <h1>
                                Reports & Flags
                            </h1>

                            <p>
                                Review rejected accounts and
                                their rejection reasons.
                            </p>

                        </div>

                    </div>


                    <div className="reports-count-card">

                        <span>
                            Rejected Accounts
                        </span>

                        <strong>
                            {reports.length}
                        </strong>

                    </div>

                </section>


                {/* =================================================
                    REPORTS CARD
                ================================================= */}

                <section className="reports-card">

                    <div className="reports-card-top">

                        <div>

                            <h2>
                                Rejected Accounts
                            </h2>

                            <p>
                                Accounts that require review
                                or further attention.
                            </p>

                        </div>


                        <div className="reports-total-badge">

                            {reports.length}

                            {" "}

                            {reports.length === 1
                                ? "Account"
                                : "Accounts"
                            }

                        </div>

                    </div>


                    <div className="reports-table">


                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <div className="reports-table-row reports-table-header">

                            <div>
                                NAME
                            </div>

                            <div>
                                DETAILS
                            </div>

                            <div>
                                REASON FOR REJECTION
                            </div>

                        </div>


                        {/* =================================================
                            LOADING
                        ================================================= */}

                        {loading && (

                            <div className="reports-empty">

                                <div className="reports-loading-spinner">
                                </div>

                                <span>
                                    Loading reports...
                                </span>

                            </div>

                        )}


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {!loading &&
                            error && (

                                <div className="reports-empty reports-error">

                                    <div className="reports-message-icon">
                                        !
                                    </div>

                                    <div>

                                        <strong>
                                            Unable to load reports
                                        </strong>

                                        <p>
                                            {error}
                                        </p>

                                    </div>

                                </div>

                            )}


                        {/* =================================================
                            EMPTY
                        ================================================= */}

                        {!loading &&
                            !error &&
                            reports.length === 0 && (

                                <div className="reports-empty">

                                    <div className="reports-empty-icon">
                                        ✓
                                    </div>

                                    <strong>
                                        No rejected accounts
                                    </strong>

                                    <p>
                                        There are currently no
                                        rejected accounts to review.
                                    </p>

                                </div>

                            )}


                        {/* =================================================
                            REPORT DATA
                        ================================================= */}

                        {!loading &&
                            !error &&
                            reports.length > 0 &&
                            reports.map(
                                (report) => (

                                    <div
                                        className="reports-table-row reports-data-row"
                                        key={report.id}
                                    >


                                        {/* =================================================
                                            NAME
                                        ================================================= */}

                                        <div className="reports-name-cell">

                                            <div className="reports-avatar">

                                                {(report.name || "N")
                                                    .charAt(0)
                                                    .toUpperCase()}

                                            </div>

                                            <div className="reports-name">

                                                {report.name ||
                                                    "Not provided"}

                                            </div>

                                        </div>


                                        {/* =================================================
                                            DETAILS
                                        ================================================= */}

                                        <div className="reports-details">

                                            <div className="reports-type">

                                                <span className="reports-type-badge">

                                                    {report.type ||
                                                        "—"}

                                                </span>

                                            </div>


                                            {report.email && (

                                                <div className="reports-detail-line">

                                                    <span className="reports-detail-label">
                                                        Email
                                                    </span>

                                                    <span className="reports-detail-value">
                                                        {report.email}
                                                    </span>

                                                </div>

                                            )}


                                            {report.submitted && (

                                                <div className="reports-detail-line">

                                                    <span className="reports-detail-label">
                                                        Rejected
                                                    </span>

                                                    <span className="reports-detail-value">
                                                        {formatDate(
                                                            report.submitted
                                                        )}
                                                    </span>

                                                </div>

                                            )}

                                        </div>


                                        {/* =================================================
                                            REASON
                                        ================================================= */}

                                        <div className="reports-reason">

                                            <div className="reports-reason-box">

                                                <span className="reports-reason-icon">
                                                    !
                                                </span>

                                                <span className="reports-reason-text">

                                                    {report.reason ||
                                                        "No rejection reason provided."}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                    </div>

                </section>

            </main>


            {/* =====================================================
                PAGE STYLE
            ===================================================== */}

            <style>{`

                /* =====================================================
                   GLOBAL PAGE
                ===================================================== */

                .reports-page {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    overflow-x: hidden;
                    box-sizing: border-box;
                }


                .reports-main {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    overflow-x: hidden;
                    box-sizing: border-box;
                }


                .reports-main *,
                .reports-main *::before,
                .reports-main *::after {
                    box-sizing: border-box;
                }


                /* =====================================================
                   HEADER
                ===================================================== */

                .reports-header {
                    width: 100%;
                    max-width: 100%;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 20px;

                    margin-bottom: 22px;
                }


                .reports-title-area {
                    min-width: 0;

                    display: flex;
                    align-items: center;

                    gap: 14px;
                }


                .reports-title-icon {
                    width: 48px;
                    height: 48px;

                    flex: 0 0 48px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 14px;

                    background: #fff4e5;
                    color: #d97706;

                    font-size: 22px;
                    font-weight: 700;

                    border: 1px solid #fed7aa;
                }


                .reports-header h1 {
                    margin: 0;

                    font-size: 26px;
                    line-height: 1.25;

                    font-weight: 700;

                    color: #172033;

                    overflow-wrap: anywhere;
                }


                .reports-header p {
                    margin: 5px 0 0;

                    color: #697386;

                    font-size: 14px;

                    line-height: 1.5;
                }


                /* =====================================================
                   COUNT CARD
                ===================================================== */

                .reports-count-card {
                    flex: 0 0 auto;

                    min-width: 150px;

                    padding: 12px 18px;

                    display: flex;
                    flex-direction: column;

                    align-items: flex-end;

                    border: 1px solid #e7eaf0;

                    border-radius: 12px;

                    background: #ffffff;

                    box-shadow:
                        0 3px 12px rgba(
                            15,
                            23,
                            42,
                            0.05
                        );
                }


                .reports-count-card span {
                    color: #7b8496;

                    font-size: 11px;

                    font-weight: 600;

                    text-transform: uppercase;

                    letter-spacing: 0.5px;
                }


                .reports-count-card strong {
                    margin-top: 3px;

                    color: #172033;

                    font-size: 22px;

                    line-height: 1;
                }


                /* =====================================================
                   MAIN CARD
                ===================================================== */

                .reports-card {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;

                    background: #ffffff;

                    border: 1px solid #e7eaf0;

                    border-radius: 16px;

                    overflow: hidden;

                    box-shadow:
                        0 6px 24px rgba(
                            15,
                            23,
                            42,
                            0.06
                        );
                }


                /* =====================================================
                   CARD TOP
                ===================================================== */

                .reports-card-top {
                    width: 100%;
                    min-width: 0;

                    padding: 20px 22px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 15px;

                    border-bottom: 1px solid #edf0f4;

                    background: #ffffff;
                }


                .reports-card-top h2 {
                    margin: 0;

                    color: #172033;

                    font-size: 17px;

                    font-weight: 700;
                }


                .reports-card-top p {
                    margin: 5px 0 0;

                    color: #7b8496;

                    font-size: 13px;

                    line-height: 1.5;
                }


                .reports-total-badge {
                    flex: 0 0 auto;

                    padding: 7px 12px;

                    border-radius: 20px;

                    background: #f5f7fa;

                    border: 1px solid #e3e7ed;

                    color: #4b5565;

                    font-size: 12px;

                    font-weight: 600;
                }


                /* =====================================================
                   TABLE
                ===================================================== */

                .reports-table {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;

                    overflow: hidden;
                }


                .reports-table-row {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;

                    display: grid;

                    grid-template-columns:
                        minmax(180px, 0.9fr)
                        minmax(220px, 1fr)
                        minmax(260px, 1.3fr);

                    column-gap: 20px;

                    align-items: center;
                }


                /* =====================================================
                   TABLE HEADER
                ===================================================== */

                .reports-table-header {
                    min-height: 46px;

                    padding: 0 22px;

                    background: #f8fafc;

                    border-bottom: 1px solid #e7eaf0;

                    color: #7b8496;

                    font-size: 11px;

                    font-weight: 700;

                    letter-spacing: 0.6px;
                }


                /* =====================================================
                   DATA ROW
                ===================================================== */

                .reports-data-row {
                    padding: 18px 22px;

                    border-bottom: 1px solid #edf0f4;

                    transition:
                        background 0.2s ease;
                }


                .reports-data-row:last-child {
                    border-bottom: none;
                }


                .reports-data-row:hover {
                    background: #fafbfc;
                }


                .reports-table-row > div {
                    min-width: 0;
                    max-width: 100%;
                }


                /* =====================================================
                   NAME
                ===================================================== */

                .reports-name-cell {
                    min-width: 0;

                    display: flex;
                    align-items: center;

                    gap: 11px;
                }


                .reports-avatar {
                    width: 38px;
                    height: 38px;

                    flex: 0 0 38px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    background: #eef2ff;

                    color: #4f46e5;

                    font-size: 14px;

                    font-weight: 700;

                    border: 1px solid #e0e7ff;
                }


                .reports-name {
                    min-width: 0;
                    max-width: 100%;

                    color: #202938;

                    font-size: 14px;

                    font-weight: 600;

                    line-height: 1.45;

                    overflow-wrap: anywhere;
                    word-break: break-word;
                }


                /* =====================================================
                   DETAILS
                ===================================================== */

                .reports-details {
                    min-width: 0;
                    max-width: 100%;

                    display: flex;
                    flex-direction: column;

                    gap: 7px;
                }


                .reports-type {
                    min-width: 0;
                }


                .reports-type-badge {
                    display: inline-flex;

                    max-width: 100%;

                    padding: 4px 9px;

                    border-radius: 6px;

                    background: #f1f5f9;

                    color: #475569;

                    border: 1px solid #e2e8f0;

                    font-size: 11px;

                    font-weight: 600;

                    overflow-wrap: anywhere;
                }


                .reports-detail-line {
                    min-width: 0;
                    max-width: 100%;

                    display: flex;

                    align-items: flex-start;

                    gap: 7px;

                    font-size: 12px;

                    line-height: 1.45;
                }


                .reports-detail-label {
                    flex: 0 0 auto;

                    color: #8a94a6;

                    font-weight: 500;
                }


                .reports-detail-value {
                    min-width: 0;

                    color: #4b5565;

                    overflow-wrap: anywhere;
                    word-break: break-word;
                }


                /* =====================================================
                   REASON
                ===================================================== */

                .reports-reason {
                    min-width: 0;
                    max-width: 100%;
                }


                .reports-reason-box {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;

                    display: flex;
                    align-items: flex-start;

                    gap: 9px;

                    padding: 11px 12px;

                    border-radius: 9px;

                    background: #fff7ed;

                    border: 1px solid #fed7aa;
                }


                .reports-reason-icon {
                    width: 20px;
                    height: 20px;

                    flex: 0 0 20px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    background: #f97316;

                    color: #ffffff;

                    font-size: 11px;

                    font-weight: 700;
                }


                .reports-reason-text {
                    min-width: 0;
                    max-width: 100%;

                    color: #7c2d12;

                    font-size: 12px;

                    line-height: 1.55;

                    overflow-wrap: anywhere;
                    word-break: break-word;
                }


                /* =====================================================
                   EMPTY / LOADING
                ===================================================== */

                .reports-empty {
                    min-height: 220px;

                    padding: 35px 20px;

                    display: flex;
                    flex-direction: column;

                    align-items: center;
                    justify-content: center;

                    text-align: center;

                    color: #6b7280;
                }


                .reports-empty strong {
                    margin-top: 10px;

                    color: #374151;

                    font-size: 15px;
                }


                .reports-empty p {
                    margin: 5px 0 0;

                    color: #8a94a6;

                    font-size: 13px;

                    line-height: 1.5;
                }


                .reports-empty-icon {
                    width: 42px;
                    height: 42px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    background: #ecfdf5;

                    border: 1px solid #bbf7d0;

                    color: #16a34a;

                    font-size: 18px;

                    font-weight: 700;
                }


                .reports-message-icon {
                    width: 42px;
                    height: 42px;

                    flex: 0 0 42px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    background: #fef2f2;

                    border: 1px solid #fecaca;

                    color: #dc2626;

                    font-weight: 700;

                    font-size: 18px;

                    margin-bottom: 8px;
                }


                .reports-error {
                    color: #b91c1c;
                }


                .reports-error strong {
                    color: #991b1b;
                }


                .reports-loading-spinner {
                    width: 30px;
                    height: 30px;

                    border-radius: 50%;

                    border: 3px solid #e5e7eb;

                    border-top-color: #4f46e5;

                    animation:
                        reportsSpin
                        0.8s
                        linear
                        infinite;

                    margin-bottom: 10px;
                }


                @keyframes reportsSpin {

                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }

                }


                /* =====================================================
                   TABLET
                ===================================================== */

                @media (max-width: 950px) {

                    .reports-table-row {
                        grid-template-columns:
                            minmax(150px, 0.8fr)
                            minmax(180px, 1fr)
                            minmax(220px, 1.2fr);

                        column-gap: 14px;
                    }


                    .reports-table-header,
                    .reports-data-row {
                        padding-left: 16px;
                        padding-right: 16px;
                    }


                    .reports-card-top {
                        padding-left: 16px;
                        padding-right: 16px;
                    }

                }


                /* =====================================================
                   MOBILE
                ===================================================== */

                @media (max-width: 700px) {

                    .reports-header {
                        flex-direction: column;

                        align-items: stretch;

                        gap: 12px;
                    }


                    .reports-count-card {
                        width: 100%;

                        align-items: flex-start;
                    }


                    .reports-table-header {
                        display: none;
                    }


                    .reports-data-row {
                        display: flex;

                        flex-direction: column;

                        align-items: stretch;

                        gap: 14px;

                        padding: 16px;
                    }


                    .reports-name-cell {
                        width: 100%;
                    }


                    .reports-details {
                        width: 100%;

                        padding-left: 49px;
                    }


                    .reports-reason {
                        width: 100%;

                        padding-left: 49px;
                    }


                    .reports-reason-box {
                        width: 100%;
                    }


                    .reports-card-top {
                        align-items: flex-start;
                    }


                    .reports-total-badge {
                        display: none;
                    }

                }


                /* =====================================================
                   SMALL MOBILE
                ===================================================== */

                @media (max-width: 450px) {

                    .reports-header h1 {
                        font-size: 22px;
                    }


                    .reports-header p {
                        font-size: 13px;
                    }


                    .reports-title-icon {
                        width: 42px;
                        height: 42px;

                        flex-basis: 42px;
                    }


                    .reports-card {
                        border-radius: 12px;
                    }


                    .reports-card-top {
                        padding: 16px;
                    }


                    .reports-card-top h2 {
                        font-size: 15px;
                    }


                    .reports-data-row {
                        padding: 14px;
                    }


                    .reports-details,
                    .reports-reason {
                        padding-left: 0;
                    }


                    .reports-avatar {
                        width: 34px;
                        height: 34px;

                        flex-basis: 34px;
                    }


                    .reports-name {
                        font-size: 13px;
                    }

                }


                /* =====================================================
                   EXTRA WIDTH PROTECTION
                ===================================================== */

                html,
                body {
                    max-width: 100%;
                    overflow-x: hidden;
                }


                .admin-dashboard {
                    max-width: 100%;
                }


            `}</style>

        </div>
    );
}

export default ReportsFlags;