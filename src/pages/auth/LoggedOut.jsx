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

        <div className="logout-page">

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