import { Link } from "react-router-dom";
import { useEffect } from "react";

function LoggedOut() {

    useEffect(() => {

        // Remove JWT token
        localStorage.removeItem("jc_token");

        // Remove logged-in user information
        localStorage.removeItem("jc_user");

        // Remove temporary reset information
        sessionStorage.removeItem("jc_reset_email");

    }, []);


    return (

        <div className="jc-logout">

            {/* =================================================
                STYLES — embedded directly so no separate .css
                file is needed anywhere in the project.
            ================================================= */}

            <style>{`
                .jc-logout {
                  --navy: #1F3326;
                  --navy3: #2F5233;
                  --cream: #F2F5EF;
                  --lime: #C7E36B;
                  --green: #2F6B45;
                  --ink: #16241C;
                  --muted: #66786C;
                  --line: #E4E9DF;

                  font-family: 'Inter', sans-serif;
                  color: var(--ink);
                  background: var(--cream);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 40px 20px;
                  box-sizing: border-box;
                }

                .jc-logout * {
                  box-sizing: border-box;
                }

                .logout-card {
                  width: 100%;
                  max-width: 380px;
                  background: #fff;
                  border: 1px solid var(--line);
                  border-radius: 18px;
                  padding: 42px 36px 36px;
                  text-align: center;
                  box-shadow: 0 24px 50px -18px rgba(22, 36, 28, 0.20),
                              0 2px 8px rgba(22, 36, 28, 0.06);
                }

                .logout-icon {
                  width: 56px;
                  height: 56px;
                  border-radius: 16px;
                  background: rgba(199, 227, 107, 0.18);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 26px;
                  margin: 0 auto 20px;
                }

                .logout-title {
                  font-size: 21px;
                  font-weight: 700;
                  margin: 0 0 8px;
                  color: var(--ink);
                }

                .logout-subtitle {
                  font-size: 13.5px;
                  line-height: 1.6;
                  color: var(--muted);
                  margin: 0 0 28px;
                }

                .logout-button {
                  display: block;
                  width: 100%;
                  background: var(--navy3);
                  color: #fff;
                  border: none;
                  padding: 13px;
                  border-radius: 9px;
                  font-size: 14px;
                  font-weight: 700;
                  text-decoration: none;
                  cursor: pointer;
                  margin-bottom: 16px;
                  transition: background .15s ease;
                }

                .logout-button:hover {
                  background: var(--navy);
                }

                .homepage-link {
                  display: inline-block;
                  font-size: 13px;
                  font-weight: 600;
                  color: var(--green);
                  text-decoration: none;
                }

                .homepage-link:hover {
                  text-decoration: underline;
                }
            `}</style>

            <div className="logout-card">

                <div className="logout-icon">
                    👋
                </div>


                <h1 className="logout-title">
                    You've been logged out
                </h1>


                <p className="logout-subtitle">
                    Your session ended securely.
                    Come back any time.
                </p>


                <Link
                    to="/login"
                    className="logout-button"
                >
                    Log back in
                </Link>


                <Link
                    to="/"
                    className="homepage-link"
                >
                    Return to homepage
                </Link>

            </div>

        </div>

    );
}

export default LoggedOut;