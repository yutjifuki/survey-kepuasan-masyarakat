import React from "react";
import { MdOutlineCancel } from "react-icons/md";

const TokenDetailModal = ({ token, onClose }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();
  const expiresAt = new Date(token.expiresAt);
  const isExpired = expiresAt < now;
  const isUsed = token.usedBy !== null || token.usedAt !== null;

  let status = "Aktif";
  let statusColor = "#2ecc71";
  let statusBg = "#e6f9f0";

  if (isUsed) {
    status = "Tidak Aktif (Digunakan)";
    statusColor = "#95a5a6";
    statusBg = "#ecf0f1";
  } else if (isExpired) {
    status = "Tidak Aktif (Kadaluarsa)";
    statusColor = "#e74c3c";
    statusBg = "#fadbd8";
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h2>Detail Token</h2>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Tutup"
          >
            <MdOutlineCancel />
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          {/* Token Code */}
          <div style={detailStyles.detailRow}>
            <strong>Kode Token:</strong>
            <code style={detailStyles.tokenCode}>{token.tokenCode}</code>
          </div>

          {/* Status */}
          <div style={detailStyles.detailRow}>
            <strong>Status:</strong>
            <span
              style={{
                ...detailStyles.status,
                color: statusColor,
                backgroundColor: statusBg,
              }}
            >
              {status}
            </span>
          </div>

          {/* Created Date */}
          <div style={detailStyles.detailRow}>
            <strong>Tanggal Dibuat:</strong>
            <span>{formatDate(token.createdAt)}</span>
          </div>

          {/* Expiry Date */}
          <div style={detailStyles.detailRow}>
            <strong>Tanggal Kadaluarsa:</strong>
            <span style={{ color: isExpired ? "#e74c3c" : "#333" }}>
              {formatDate(token.expiresAt)}
            </span>
          </div>

          {/* Used By Section */}
          {isUsed ? (
            token.usedBy ? (
              <div style={detailStyles.usedSection}>
                <h3 style={detailStyles.sectionTitle}>
                  Informasi Pengguna Token
                </h3>

                <div style={detailStyles.detailRow}>
                  <strong>Nama Responden:</strong>
                  <span>{token.usedBy.name}</span>
                </div>

                {token.usedAt && (
                  <div style={detailStyles.detailRow}>
                    <strong>Tanggal Digunakan:</strong>
                    <span>{formatDate(token.usedAt)}</span>
                  </div>
                )}

                {token.usedBy.gender && (
                  <div style={detailStyles.detailRow}>
                    <strong>Jenis Kelamin:</strong>
                    <span>{token.usedBy.gender}</span>
                  </div>
                )}

                {token.usedBy.age && (
                  <div style={detailStyles.detailRow}>
                    <strong>Usia:</strong>
                    <span>{token.usedBy.age} tahun</span>
                  </div>
                )}

                {token.usedBy.visitFrequency && (
                  <div style={detailStyles.detailRow}>
                    <strong>Frekuensi Kunjungan:</strong>
                    <span>{token.usedBy.visitFrequency}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={detailStyles.notUsedBox}>
                <p style={detailStyles.notUsedText}>
                  Token telah digunakan, namun data responden telah dihapus.
                </p>
              </div>
            )
          ) : (
            <div style={detailStyles.notUsedBox}>
              <p style={detailStyles.notUsedText}>
                {isExpired
                  ? "Token sudah kadaluarsa dan belum pernah digunakan"
                  : "Token belum digunakan"}
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button onClick={onClose} style={detailStyles.closeButton}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const detailStyles = {
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #ecf0f1",
    flexWrap: "wrap",
    gap: "8px",
  },
  tokenCode: {
    backgroundColor: "#f0f0f0",
    padding: "8px 14px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "1.2rem",
    color: "#2c3e50",
    letterSpacing: "2px",
  },
  status: {
    fontWeight: "bold",
    fontSize: "0.95rem",
    padding: "5px 10px",
    borderRadius: "4px",
  },
  usedSection: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    color: "#2c3e50",
    marginTop: "0",
    marginBottom: "15px",
    paddingBottom: "10px",
    borderBottom: "2px solid #3498db",
  },
  notUsedBox: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    border: "1px dashed #bdc3c7",
    textAlign: "center",
  },
  notUsedText: {
    margin: 0,
    color: "#7f8c8d",
    fontStyle: "italic",
    fontSize: "0.95rem",
  },
  closeButton: {
    padding: "10px 35px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
};

export default TokenDetailModal;
