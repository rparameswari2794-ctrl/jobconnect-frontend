import { Link } from "react-router-dom";

function JobConnectLogo({
    to = "/",
    dark = true,
    compact = false,
}) {
    return (
        <>
            <style>{`
                /* =========================================================
                   JOB CONNECT LOGO
                ========================================================= */

                .jobconnect-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;

                    text-decoration: none;
                    flex-shrink: 0;
                }

                /* =========================================================
                   LOGO ICON
                ========================================================= */

                .jobconnect-logo svg {
                    width: 38px;
                    height: 38px;

                    flex-shrink: 0;

                    filter:
                        drop-shadow(
                            0 0 10px
                            rgba(255, 201, 77, 0.25)
                        );
                }

                /* =========================================================
                   LOGO NAME
                ========================================================= */

                .jobconnect-logo-name {
                    font-family:
                        "Bricolage Grotesque",
                        "Inter",
                        sans-serif;

                    font-size: 1.3rem;

                    font-weight: 800;

                    letter-spacing: 0.01em;

                    white-space: nowrap;
                }

                /* =========================================================
                   DARK VERSION
                ========================================================= */

                .jobconnect-logo-name-dark {
                    color: #fff8f2;
                }

                /* =========================================================
                   LIGHT VERSION
                ========================================================= */

                .jobconnect-logo-name-light {
                    color: #1a1410;
                }

                /* =========================================================
                   COMPACT VERSION
                ========================================================= */

                .jobconnect-logo-compact svg {
                    width: 32px;
                    height: 32px;
                }

                .jobconnect-logo-compact
                .jobconnect-logo-name {
                    font-size: 1.1rem;
                }

                /* =========================================================
                   HOVER
                ========================================================= */

                .jobconnect-logo:hover {
                    text-decoration: none;
                }

                .jobconnect-logo:hover svg {
                    filter:
                        drop-shadow(
                            0 0 14px
                            rgba(255, 201, 77, 0.45)
                        );
                }

                /* =========================================================
                   MOBILE
                ========================================================= */

                @media (max-width: 520px) {

                    .jobconnect-logo {
                        gap: 0.5rem;
                    }

                    .jobconnect-logo svg {
                        width: 34px;
                        height: 34px;
                    }

                    .jobconnect-logo-name {
                        font-size: 1.15rem;
                    }

                    .jobconnect-logo-compact svg {
                        width: 30px;
                        height: 30px;
                    }

                    .jobconnect-logo-compact
                    .jobconnect-logo-name {
                        font-size: 1rem;
                    }
                }
            `}</style>

            <Link
                to={to}
                className={`jobconnect-logo ${
                    compact
                        ? "jobconnect-logo-compact"
                        : ""
                }`}
            >

                {/* =====================================================
                    SAME LOGO AS LOGIN PAGE
                ===================================================== */}

                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    aria-hidden="true"
                >

                    {/* LEFT GREEN DOT */}

                    <circle
                        cx="8"
                        cy="28"
                        r="4"
                        fill="#0B8F7A"
                    />

                    {/* RIGHT CORAL DOT */}

                    <circle
                        cx="32"
                        cy="28"
                        r="4"
                        fill="#FF5B3D"
                    />

                    {/* CONNECTION ARC */}

                    <path
                        d="M4 30 C 4 12, 36 12, 36 30"
                        stroke="#FFC94D"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />

                </svg>

                {/* =====================================================
                    JOB CONNECT
                ===================================================== */}

                <span
                    className={`jobconnect-logo-name ${
                        dark
                            ? "jobconnect-logo-name-dark"
                            : "jobconnect-logo-name-light"
                    }`}
                >
                    Job Connect
                </span>

            </Link>
        </>
    );
}

export default JobConnectLogo;

