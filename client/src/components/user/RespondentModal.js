import React, { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "axios";

const RespondentModal = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [visitFrequency, setVisitFrequency] = useState("Pertama kali");
  const [tokenCode, setTokenCode] = useState("");
  const [error, setError] = useState("");
  const [tokenValidating, setTokenValidating] = useState(false);

  const getApiEndpoint = (specificPath) => {
    if (process.env.NODE_ENV === "production") {
      if (!process.env.REACT_APP_API_URL) {
        return `/api${specificPath}`;
      }
      return `${process.env.REACT_APP_API_URL}${specificPath}`;
    } else {
      return `/api${specificPath}`;
    }
  };

  const validateToken = async (code) => {
    if (!code || code.length !== 5) {
      return false;
    }

    setTokenValidating(true);
    try {
      const response = await axios.post(getApiEndpoint("/tokens/validate"), {
        tokenCode: code,
      });
      setTokenValidating(false);
      return response.data.valid;
    } catch (err) {
      setTokenValidating(false);
      setError(err.response?.data?.message || "Token tidak valid");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !gender || !age || !visitFrequency) {
      setError("Semua field data responden harus diisi.");
      return;
    }

    const numericAge = parseInt(age);
    if (isNaN(numericAge) || numericAge <= 0) {
      setError("Usia harus berupa angka positif.");
      return;
    }
    if (numericAge < 18) {
      setError("Minimal usia adalah 18 tahun.");
      return;
    }

    // Validate token if provided
    if (tokenCode.trim()) {
      const isTokenValid = await validateToken(tokenCode.trim());
      if (!isTokenValid) {
        return; // Error already set in validateToken
      }
    }

    onSubmit({
      name,
      gender,
      age: numericAge,
      visitFrequency,
      tokenCode: tokenCode.trim() || null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Data Responden</h2>
          <Link
            to="/"
            onClick={onCancel}
            className="modal-close-button"
            aria-label="Tutup"
          >
            <MdOutlineCancel />
          </Link>
        </div>
        {error && <p className="notification error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tokenCode">Token Survey</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                id="tokenCode"
                value={tokenCode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 5) {
                    setTokenCode(value);
                    setError("");
                  }
                }}
                maxLength="5"
                style={{
                  fontSize: "1.1rem",
                  letterSpacing: "2px",
                  flex: 1,
                }}
              />
              <Link
                to="/ambiltoken"
                target="_blank"
                style={{
                  padding: "0.7rem 1rem",
                  backgroundColor: "#3498db",
                  color: "#FBFFFE",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#2980b9")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#3498db")
                }
              >
                Ambil Token
              </Link>
            </div>
            {tokenValidating && (
              <small
                style={{ color: "#3498db", marginTop: "5px", display: "block" }}
              >
                Memvalidasi token...
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Nama</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Jenis Kelamin</label>
            <div className="gender-buttons">
              <button
                type="button"
                className={gender === "Laki-laki" ? "selected" : ""}
                onClick={() => setGender("Laki-laki")}
              >
                Laki-laki
              </button>
              <button
                type="button"
                className={gender === "Perempuan" ? "selected" : ""}
                onClick={() => setGender("Perempuan")}
              >
                Perempuan
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="age">Usia</label>
            <input
              type="text"
              id="age"
              value={age}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,2}$/.test(value)) {
                  setAge(value);
                }
              }}
              required
              inputMode="numeric"
              pattern="\d*"
            />
          </div>
          <div className="form-group">
            <label htmlFor="visitFrequency">Frekuensi Kunjungan</label>
            <select
              id="visitFrequency"
              value={visitFrequency}
              onChange={(e) => setVisitFrequency(e.target.value)}
              required
            >
              <option value="Pertama kali">Pertama kali</option>
              <option value="Lebih dari satu kali">Lebih dari satu kali</option>
              <option value="Sering">Sering</option>
            </select>
          </div>
          <button
            type="submit"
            className="continue-btn"
            disabled={tokenValidating}
          >
            {tokenValidating ? "Memvalidasi..." : "Lanjutkan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RespondentModal;
