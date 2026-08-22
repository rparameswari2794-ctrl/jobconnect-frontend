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

        <div className="admin-dashboard">

            <main className="admin-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="reports-header">

                    <h1>
                        Reports & flags
                    </h1>


                    <p>

                        {reports.length}

                        {" "}

                        rejected account
                        {reports.length === 1
                            ? ""
                            : "s"
                        }

                    </p>

                </section>


                {/* =================================================
                    REPORTS CARD
                ================================================= */}

                <section className="reports-card">

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

                                Loading reports...

                            </div>

                        )}


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {!loading &&
                            error && (

                                <div className="reports-empty reports-error">

                                    {error}

                                </div>

                            )}


                        {/* =================================================
                            EMPTY
                        ================================================= */}

                        {!loading &&
                            !error &&
                            reports.length === 0 && (

                                <div className="reports-empty">

                                    No rejected accounts.

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


                                        {/* NAME */}

                                        <div className="reports-name">

                                            {report.name ||
                                                "Not provided"}

                                        </div>


                                        {/* DETAILS */}

                                        <div className="reports-details">

                                            {report.type ||
                                                "—"}


                                            {report.email && (

                                                <>
                                                    {" · "}
                                                    {report.email}
                                                </>

                                            )}


                                            {report.submitted && (

                                                <>
                                                    {" · "}
                                                    Rejected{" "}
                                                    {formatDate(
                                                        report.submitted
                                                    )}
                                                </>

                                            )}

                                        </div>


                                        {/* REASON */}

                                        <div className="reports-reason">

                                            {report.reason ||
                                                "No rejection reason provided."}

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

export default ReportsFlags;