import React, { useState, useEffect, useCallback, useMemo } from "react";
import adminService from "../../services/adminService";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import AlertModal from "../../components/shared/AlertModal";
import TokenDetailModal from "../../components/admin/TokenDetailModal";
import { IoMdAddCircle } from "react-icons/io";
import { RiResetRightFill } from "react-icons/ri";
import {
  FaCopy,
  FaEye,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const TokensPage = () => {
  const [statusSort, setStatusSort] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "", isOpen: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTokens, setTotalTokens] = useState(0);
  const limit = 25;

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tokenQuantity, setTokenQuantity] = useState(1);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetModalLoading, setResetModalLoading] = useState(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const [countdowns, setCountdowns] = useState({});

  const showAlert = useCallback((type, message) => {
    setAlert({ type, message, isOpen: true });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert({ type: "", message: "", isOpen: false });
  }, []);

  const fetchTokens = useCallback(
    async (page) => {
      try {
        setLoading(true);
        const data = await adminService.getTokens(page, limit);
        setTokens(data.tokens || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalTokens(data.totalTokens || 0);
      } catch (err) {
        showAlert("error", err.message || "Gagal memuat data token.");
      } finally {
        setLoading(false);
      }
    },
    [showAlert, limit]
  );

  useEffect(() => {
    fetchTokens(currentPage);
  }, [fetchTokens, currentPage]);

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
          newCountdowns[token._id] = `${hours}j ${minutes}m`;
        } else {
          newCountdowns[token._id] = "Kadaluarsa";
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [tokens]);

  const toggleStatusSort = () => {
    // cycle: null -> true -> false -> null ...
    setStatusSort((prev) =>
      prev === null ? true : prev === true ? false : null
    );
  };

  const sortedTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return tokens;

    const getPriority = (token) => {
      const now = new Date();
      const expiresAt = new Date(token.expiresAt);
      // 0 = active, 1 = used, 2 = expired
      if (!token.usedBy && expiresAt > now) return 0;
      if (token.usedBy) return 1;
      return 2;
    };

    if (statusSort === null) return tokens;

    const multiplier = statusSort ? 1 : -1; // true => active first (asc), false => active last (desc)
    return [...tokens].sort(
      (a, b) => multiplier * (getPriority(a) - getPriority(b))
    );
  }, [tokens, statusSort]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    if (tokenQuantity < 1 || tokenQuantity > 10) {
      showAlert("error", "Jumlah token harus antara 1-10");
      return;
    }

    setGenerateLoading(true);
    try {
      const result = await adminService.generateTokens(tokenQuantity);
      showAlert(
        "success",
        result.message || `${tokenQuantity} token berhasil dibuat!`
      );
      fetchTokens(1);
      setShowGenerateModal(false);
      setTokenQuantity(1);
    } catch (err) {
      showAlert("error", err.message || "Gagal membuat token.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCopyToken = (tokenCode) => {
    navigator.clipboard.writeText(tokenCode);
    showAlert("success", `Token "${tokenCode}" berhasil disalin!`);
  };

  const openResetConfirmation = () => {
    setShowResetConfirmModal(true);
  };

  const closeResetConfirmation = () => {
    setShowResetConfirmModal(false);
  };

  const handleResetAllTokensConfirmed = async () => {
    setResetModalLoading(true);
    try {
      const result = await adminService.resetAllTokens();
      showAlert("success", result.message || "Semua token berhasil direset.");
      fetchTokens(1);
      closeResetConfirmation();
    } catch (err) {
      showAlert("error", err.message || "Gagal mereset token.");
    } finally {
      setResetModalLoading(false);
    }
  };

  const openDeleteConfirmation = (token) => {
    setTokenToDelete(token);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmation = () => {
    setTokenToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteConfirmed = async () => {
    if (!tokenToDelete) return;
    setDeleteModalLoading(true);
    try {
      await adminService.deleteToken(tokenToDelete._id);
      showAlert(
        "success",
        `Token "${tokenToDelete.tokenCode}" berhasil dihapus.`
      );
      fetchTokens(currentPage);
      closeDeleteConfirmation();
    } catch (err) {
      showAlert("error", err.message || "Gagal menghapus token.");
    } finally {
      setDeleteModalLoading(false);
    }
  };

  const openDetailModal = async (tokenId) => {
    try {
      const tokenDetail = await adminService.getTokenById(tokenId);
      setSelectedToken(tokenDetail);
      setShowDetailModal(true);
    } catch (err) {
      showAlert("error", err.message || "Gagal memuat detail token.");
    }
  };

  const closeDetailModal = () => {
    setSelectedToken(null);
    setShowDetailModal(false);
  };

  if (loading && tokens.length === 0 && !alert.message)
    return <div style={{ padding: "20px 0" }}>Memuat data token...</div>;

  return (
    <div className="admin-tokens-page">
      <h1>Kelola Token Survey</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Total Token: <strong>{totalTokens}</strong>
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="submit-btn"
            style={{
              backgroundColor: "#16C64F",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              border: "none",
              padding: "9px 13px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <IoMdAddCircle style={{ fontSize: "1.2rem" }} />
            Generate Token
          </button>
          <button
            onClick={openResetConfirmation}
            className="reset-btn"
            style={{
              backgroundColor: "#EB001B",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              border: "none",
              padding: "9px 13px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            disabled={loading || totalTokens === 0}
          >
            <RiResetRightFill
              style={{ fontSize: "1rem", fontWeight: "bold" }}
            />
            Reset Semua Token
          </button>
        </div>
      </div>

      {tokens.length === 0 && !loading ? (
        <p>Belum ada token yang dibuat.</p>
      ) : tokens.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>No.</th>
                  <th style={tableStyles.th}>Kode Token</th>
                  <th style={tableStyles.th}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Status
                      <button
                        onClick={toggleStatusSort}
                        title={
                          statusSort === null
                            ? "Urutkan status (aktif teratas)"
                            : statusSort === true
                            ? "Urutkan: aktif teratas (klik untuk aktif terbawah)"
                            : "Urutkan: aktif terbawah (klik untuk hilangkan urutan)"
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                        aria-pressed={statusSort !== null}
                      >
                        {statusSort === null ? (
                          <FaSort />
                        ) : statusSort === true ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        )}
                      </button>
                    </span>
                  </th>
                  <th style={tableStyles.th}>Kadaluarsa</th>
                  <th style={tableStyles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedTokens.map((token, index) => {
                  const now = new Date();
                  const expiresAt = new Date(token.expiresAt);
                  const isExpired = expiresAt < now;
                  const isUsed = token.usedBy !== null || token.usedAt !== null;

                  let status = "Aktif";
                  let statusStyle = tokenStyles.active;

                  if (isUsed) {
                    status = "Tidak Aktif (Digunakan)";
                    statusStyle = tokenStyles.used;
                  } else if (isExpired) {
                    status = "Tidak Aktif (Kadaluarsa)";
                    statusStyle = tokenStyles.expired;
                  }

                  return (
                    <tr key={token._id}>
                      <td style={tableStyles.td}>
                        <center>{(currentPage - 1) * limit + index + 1}</center>
                      </td>
                      <td style={tableStyles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <code
                            style={{
                              backgroundColor: "#f0f0f0",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                            }}
                          >
                            {token.tokenCode}
                          </code>
                          <button
                            onClick={() => handleCopyToken(token.tokenCode)}
                            style={tokenStyles.copyButton}
                            title="Copy token"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </td>
                      <td style={tableStyles.td}>
                        <span style={statusStyle}>{status}</span>
                      </td>
                      <td style={tableStyles.td}>
                        <span
                          style={{
                            fontWeight: "bold",
                            color: isExpired ? "#e74c3c" : "#2ecc71",
                          }}
                        >
                          {countdowns[token._id] || "Menghitung..."}
                        </span>
                      </td>
                      <td style={tableStyles.td_action}>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => openDetailModal(token._id)}
                            style={{
                              ...tokenStyles.actionButton,
                              ...tokenStyles.detailButton,
                            }}
                            title="Detail"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(token)}
                            style={{
                              ...tokenStyles.actionButton,
                              ...tokenStyles.deleteButton,
                            }}
                            title="Hapus"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className="pagination-controls"
            style={tableStyles.paginationControls}
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              style={{
                ...tableStyles.pageButton,
                opacity: currentPage === 1 || loading ? 0.5 : 1,
                cursor:
                  currentPage === 1 || loading ? "not-allowed" : "pointer",
              }}
            >
              Sebelumnya
            </button>
            <span style={{ margin: "0 10px" }}>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              style={{
                ...tableStyles.pageButton,
                opacity: currentPage === totalPages || loading ? 0.5 : 1,
                cursor:
                  currentPage === totalPages || loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Berikutnya
            </button>
          </div>
        </>
      ) : null}

      {/* Generate Token Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <h2>Generate Token Baru</h2>
            <p style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
              Token yang dibuat akan berlaku selama 24 jam sejak pembuatan.
            </p>
            <form onSubmit={handleGenerateTokens}>
              <div className="form-group">
                <label
                  htmlFor="tokenQuantity"
                  style={{ fontWeight: "initial" }}
                >
                  Jumlah Token (Maksimal 10)
                </label>
                <input
                  type="number"
                  id="tokenQuantity"
                  value={tokenQuantity}
                  onChange={(e) => setTokenQuantity(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div className="button-group" style={{ marginTop: "25px" }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={generateLoading}
                  style={{ backgroundColor: "#16C64F" }}
                >
                  {generateLoading ? "Membuat..." : "Generate Token"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setTokenQuantity(1);
                  }}
                  className="reset-btn"
                  disabled={generateLoading}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={closeResetConfirmation}
        onConfirm={handleResetAllTokensConfirmed}
        title="Konfirmasi Reset Semua Token"
        message="ANDA YAKIN ingin menghapus SELURUH token? Tindakan ini akan menghapus semua token secara permanen dan TIDAK DAPAT DIURUNGKAN!"
        confirmText={resetModalLoading ? "Mereset..." : "Ya, Hapus Semua Token"}
        cancelText="Batal"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteConfirmed}
        title="Konfirmasi Penghapusan Token"
        message={`Apakah Anda yakin ingin menghapus token "${tokenToDelete?.tokenCode}"?`}
        confirmText={deleteModalLoading ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
      />

      {/* Token Detail Modal */}
      {showDetailModal && selectedToken && (
        <TokenDetailModal token={selectedToken} onClose={closeDetailModal} />
      )}

      {/* Alert Modal */}
      <AlertModal
        type={alert.type}
        message={alert.message}
        isOpen={alert.isOpen}
        onClose={closeAlert}
      />
    </div>
  );
};

const tableStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  th: {
    backgroundColor: "#f2f2f2",
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#333",
  },
  td: { border: "1px solid #ddd", padding: "10px", color: "#555" },
  td_action: {
    border: "1px solid #ddd",
    padding: "10px",
    color: "#555",
    textAlign: "center",
  },
  paginationControls: { marginTop: "20px", textAlign: "center" },
  pageButton: {
    padding: "8px 16px",
    margin: "0 5px",
    backgroundColor: "#FAA916",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

const tokenStyles = {
  actionButton: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    fontSize: "0.9rem",
  },
  detailButton: { backgroundColor: "#3498db" },
  deleteButton: { backgroundColor: "#EB001B" },
  copyButton: {
    padding: "4px 8px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
  },
  active: {
    color: "#2ecc71",
    fontWeight: "bold",
    backgroundColor: "#e6f9f0",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  used: {
    color: "#95a5a6",
    fontWeight: "normal",
    backgroundColor: "#ecf0f1",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  expired: {
    color: "#e74c3c",
    fontWeight: "normal",
    backgroundColor: "#fadbd8",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
};

export default TokensPage;
