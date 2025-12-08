import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import surveyService from "../../services/surveyService";

const HomePage = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observerInstance.unobserve(entry.target);
          }
        });
      },
      options
    );

    const elementsToAnimate = document.querySelectorAll(".animate-on-visible");
    elementsToAnimate.forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const [stats, setStats] = useState({
    "Sangat Puas": "0%",
    Puas: "0%",
    "Kurang Puas": "0%",
    "Tidak Puas": "0%",
    totalRespondents: 0,
    overallIKM: "0.00",
  });

  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const data = await surveyService.getHomepageStatistics();
      setStats(data);
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  const getIKMData = () => {
    if (loadingStats)
      return {
        score: "0.00",
        category: "Memuat...",
        color: "#94a3b8",
        gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
      };

    const ikm = parseFloat(stats.overallIKM) || 0;

    let category = "";
    let color = "";
    let gradient = "";

    if (ikm >= 88.31) {
      category = "Sangat Baik";
      color = "#10b981";
      gradient = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    } else if (ikm >= 76.61) {
      category = "Baik";
      color = "#3b82f6";
      gradient = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
    } else if (ikm >= 65.0) {
      category = "Kurang Baik";
      color = "#f59e0b";
      gradient = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    } else {
      category = "Tidak Baik";
      color = "#ef4444";
      gradient = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    }

    return {
      score: ikm.toFixed(2),
      category,
      color,
      gradient,
    };
  };

  const ikmData = getIKMData();

  return (
    <div>
      <section className="homepage-banner">
        <h1 className="animate-on-visible">
          Survei Kepuasan Pelayanan Dinas Perindustrian dan Tenaga Kerja
          Kabupaten Rembang
        </h1>
        <p className="animate-on-visible">
          Partisipasi Anda sangat berarti untuk peningkatan kualitas layanan
          kami.
        </p>
        <Link to="/isi-survey" className="cta-button animate-on-visible">
          Isi Survei Sekarang
        </Link>
      </section>

      <section className="ikm-showcase-section">
        <div className="container">
          <div
            className="ikm-showcase-card animate-on-visible"
            style={{ background: ikmData.gradient }}
          >
            <div className="ikm-badge">
              <span className="ikm-badge-text">Indeks Kepuasan Masyarakat</span>
            </div>
            <div className="ikm-score-display">
              <div className="ikm-score-number">{ikmData.score}</div>
              <div className="ikm-score-label">dari 100</div>
            </div>
            <div className="ikm-category-badge">
              <span className="ikm-category-text">{ikmData.category}</span>
            </div>
            <div className="ikm-description">
              <p>
                Berdasarkan {stats.totalRespondents} responden yang telah
                berpartisipasi
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section container">
        <div className="stats-header animate-on-visible">
          <h2>Distribusi Tingkat Kepuasan</h2>
          <p className="stats-subtitle">
            Hasil survei kepuasan masyarakat saat ini
          </p>
        </div>
        {loadingStats ? (
          <p className="loading-text">Memuat statistik...</p>
        ) : (
          <div className="stats-container">
            <div className="stat-item stat-item-sangat-puas ">
              <div className="stat-icon">😄</div>
              <h3>Sangat Puas</h3>
              <p>{stats["Sangat Puas"]}</p>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: stats["Sangat Puas"],
                    backgroundColor: "#2ecc70",
                  }}
                ></div>
              </div>
            </div>
            <div className="stat-item stat-item-puas ">
              <div className="stat-icon">🙂</div>
              <h3>Puas</h3>
              <p>{stats["Puas"]}</p>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: stats["Puas"], backgroundColor: "#42adf4" }}
                ></div>
              </div>
            </div>
            <div className="stat-item stat-item-kurang-puas ">
              <div className="stat-icon">😐</div>
              <h3>Kurang Puas</h3>
              <p>{stats["Kurang Puas"]}</p>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: stats["Kurang Puas"],
                    backgroundColor: "#f0cc3a",
                  }}
                ></div>
              </div>
            </div>
            <div className="stat-item stat-item-tidak-puas ">
              <div className="stat-icon">☹️</div>
              <h3>Tidak Puas</h3>
              <p>{stats["Tidak Puas"]}</p>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: stats["Tidak Puas"],
                    backgroundColor: "#ed5443",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
