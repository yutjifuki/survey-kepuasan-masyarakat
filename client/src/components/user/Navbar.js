import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo-pemkab-rembang.png";
import { PiNotePencilBold } from "react-icons/pi";

const Navbar = ({ onNavigate, isSurveyPage, hasSubmitted }) => {
  // const Location = useLocation();

  const handleIsiSurveyClick = () => {
    if (!isSurveyPage) {
      onNavigate("/isi-survey");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => onNavigate("/")}>
        <img
          src={logo}
          alt="Logo"
          className="navbar-logo"
          style={{
            height: "35px",
            objectFit: "contain",
          }}
        />
        <div className="tittle-container">
          <span>DINPERINNAKER</span>
          <span>KABUPATEN REMBANG</span>
        </div>
      </Link>
      <div className="navbar-links">
        <Link to="/" onClick={() => onNavigate("/")}>
          Beranda
        </Link>
        <button
          onClick={handleIsiSurveyClick}
          disabled={isSurveyPage && !hasSubmitted}
          className="primary-btn"
        >
          <PiNotePencilBold
            className="survey-pen"
            style={{ transform: "rotateY(180deg)" }}
          />
          Isi Survei
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
