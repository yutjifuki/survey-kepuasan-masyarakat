import React, { useState, useEffect } from "react";
import surveyService from "../../services/surveyService";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import { MdAccessTime } from "react-icons/md";

const AmbilTokenPage = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [countdowns, setCountdowns] = useState({});

  const fetchTokens = async () => {
    try {
      const data = await surveyService.getActiveTokensPublic();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();

    // Poll for new tokens every 5 seconds
    const intervalId = setInterval(() => {
      fetchTokens();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      tokens.forEach((token) => {
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        const diff = expiresAt - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          //   const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newCountdowns[token._id] = `${hours}j ${minutes}m`;
        } else {
          newCountdowns[token._id] = "Kadaluarsa";
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [tokens]);

  const handleCopyToken = (tokenCode, tokenId) => {
    navigator.clipboard.writeText(tokenCode);
    setCopiedToken(tokenId);
    setTimeout(() => {
      setCopiedToken(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Memuat token tersedia...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Token Survey Tersedia</h1>
        <p style={styles.subtitle}>
          Salin kode token di bawah untuk mengisi survey
        </p>
        <div style={styles.badge}>
          <span style={styles.badgeText}>{tokens.length} Token Aktif</span>
        </div>
      </div>

      {tokens.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎫</div>
          <p style={styles.emptyText}>Belum ada token yang tersedia saat ini</p>
          <p style={styles.emptySubtext}>
            Silakan periksa kembali nanti atau hubungi admin
          </p>
        </div>
      ) : (
        <div style={styles.gridContainer}>
          {tokens.map((token) => (
            <div key={token._id} style={styles.tokenCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Kode Token</span>
                <div style={styles.timerBadge}>
                  <MdAccessTime style={styles.timerIcon} />
                  <span style={styles.timerText}>
                    {countdowns[token._id] || "Menghitung..."}
                  </span>
                </div>
              </div>

              <div style={styles.tokenCodeContainer}>
                <code style={styles.tokenCode}>{token.tokenCode}</code>
              </div>

              <button
                onClick={() => handleCopyToken(token.tokenCode, token._id)}
                style={{
                  ...styles.copyButton,
                  ...(copiedToken === token._id ? styles.copiedButton : {}),
                }}
              >
                {copiedToken === token._id ? (
                  <>
                    <FaCheckCircle style={styles.buttonIcon} />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <FaCopy style={styles.buttonIcon} />
                    Salin Token
                  </>
                )}
              </button>

              <div style={styles.cardFooter}>
                <span style={styles.footerText}>
                  Dibuat:{" "}
                  {new Date(token.createdAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.infoBox}>
        <p style={styles.infoTitle}>ℹ️ Informasi Penting:</p>
        <ul style={styles.infoList}>
          <li>Token hanya dapat digunakan sekali</li>
          <li>Token berlaku selama 24 jam sejak dibuat</li>
          <li>Halaman ini akan diperbarui secara otomatis setiap 5 detik</li>
          <li>
            Token yang sudah digunakan atau kadaluarsa akan hilang otomatis
          </li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f7f6f6",
    padding: "2rem 1rem",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
  },
  loadingText: {
    fontSize: "1.2rem",
    color: "#555",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  title: {
    fontSize: "2rem",
    color: "#282D33",
    marginBottom: "0.5rem",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "1rem",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#FAA916",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    marginTop: "0.5rem",
  },
  badgeText: {
    color: "#FBFFFE",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    marginBottom: "2rem",
    backgroundColor: "#FBFFFE",
    borderRadius: "8px",
    maxWidth: "500px",
    margin: "0 auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  emptyText: {
    fontSize: "1.2rem",
    color: "#282D33",
    marginBottom: "0.5rem",
    fontWeight: "bold",
  },
  emptySubtext: {
    fontSize: "1rem",
    color: "#666",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    maxWidth: "1200px",
    margin: "0 auto 2rem auto",
  },
  tokenCard: {
    backgroundColor: "#FBFFFE",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "2px solid #FAA916",
    cursor: "default",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "0.85rem",
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  timerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: "#f0f0f0",
    padding: "0.3rem 0.6rem",
    borderRadius: "12px",
  },
  timerIcon: {
    fontSize: "0.9rem",
    color: "#FAA916",
  },
  timerText: {
    fontSize: "0.75rem",
    color: "#555",
    fontWeight: "bold",
  },
  tokenCodeContainer: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid #e0e0e0",
  },
  tokenCode: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#282D33",
    letterSpacing: "3px",
    display: "block",
    textAlign: "center",
    fontFamily: "monospace",
  },
  copyButton: {
    width: "100%",
    padding: "0.8rem",
    backgroundColor: "#FAA916",
    color: "#FBFFFE",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "background-color 0.2s, transform 0.1s",
  },
  copiedButton: {
    backgroundColor: "#16C64F",
  },
  buttonIcon: {
    fontSize: "1rem",
  },
  cardFooter: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #e0e0e0",
  },
  footerText: {
    fontSize: "0.8rem",
    color: "#999",
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    border: "1px solid #90CAF9",
    borderRadius: "8px",
    padding: "1.5rem",
    maxWidth: "800px",
    margin: "2rem auto 0",
  },
  infoTitle: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: "0.8rem",
  },
  infoList: {
    margin: 0,
    paddingLeft: "1.5rem",
    color: "#1976D2",
  },
};

export default AmbilTokenPage;
