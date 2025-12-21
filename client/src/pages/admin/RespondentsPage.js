import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import AlertModal from "../../components/shared/AlertModal";
import { RiResetRightFill } from "react-icons/ri";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";

const RespondentsPage = () => {
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "", isOpen: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRespondents, setTotalRespondents] = useState(0);
  const limit = 25;

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetModalLoading, setResetModalLoading] = useState(false);

  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    ageMin: "",
    ageMax: "",
    visitFrequency: "",
    dateFrom: "",
    dateTo: "",
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [filterCount, setFilterCount] = useState(0);

  const showAlert = (type, message) => {
    setAlert({ type, message, isOpen: true });
  };

  const closeAlert = () => {
    setAlert({ type: "", message: "", isOpen: false });
  };

  const fetchRespondents = useCallback(async (page, appliedFilters = {}) => {
    try {
      setLoading(true);
      const data = await adminService.getRespondents(
        page,
        limit,
        appliedFilters
      );
      setRespondents(data.respondents || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalRespondents(data.totalRespondents || 0);
    } catch (err) {
      showAlert("error", err.message || "Gagal memuat data responden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRespondents(currentPage, activeFilters);
  }, [fetchRespondents, currentPage, activeFilters]);

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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilter = () => {
    // Validate age range
    if (filters.ageMin && filters.ageMax) {
      if (parseInt(filters.ageMin) > parseInt(filters.ageMax)) {
        showAlert(
          "error",
          "Usia minimal tidak boleh lebih besar dari usia maksimal"
        );
        return;
      }
    }

    // Validate date range
    if (filters.dateFrom && filters.dateTo) {
      if (new Date(filters.dateFrom) > new Date(filters.dateTo)) {
        showAlert(
          "error",
          "Tanggal mulai tidak boleh lebih besar dari tanggal akhir"
        );
        return;
      }
    }

    // Build active filters object (only non-empty values)
    const applied = {};
    let count = 0;

    if (filters.gender) {
      applied.gender = filters.gender;
      count++;
    }
    if (filters.ageMin) {
      applied.ageMin = filters.ageMin;
      count++;
    }
    if (filters.ageMax) {
      applied.ageMax = filters.ageMax;
      count++;
    }
    if (filters.visitFrequency) {
      applied.visitFrequency = filters.visitFrequency;
      count++;
    }
    if (filters.dateFrom) {
      applied.dateFrom = filters.dateFrom;
      count++;
    }
    if (filters.dateTo) {
      applied.dateTo = filters.dateTo;
      count++;
    }

    setActiveFilters(applied);
    setFilterCount(count);
    setCurrentPage(1); // Reset to page 1 when filtering
    setShowFilterPanel(false);

    if (count > 0) {
      showAlert("success", `Filter diterapkan (${count} filter aktif)`);
    }
  };

  const handleResetFilter = () => {
    setFilters({
      gender: "",
      ageMin: "",
      ageMax: "",
      visitFrequency: "",
      dateFrom: "",
      dateTo: "",
    });
    setActiveFilters({});
    setFilterCount(0);
    setCurrentPage(1);
    setShowFilterPanel(false);
    showAlert("success", "Filter direset");
  };

  const openResetConfirmation = () => {
    setShowResetConfirmModal(true);
  };

  const closeResetConfirmation = () => {
    setShowResetConfirmModal(false);
  };

  const handleResetAllDataConfirmed = async () => {
    setResetModalLoading(true);
    try {
      const result = await adminService.resetAllRespondents();
      showAlert(
        "success",
        result.message || "Semua data responden dan survei berhasil direset."
      );
      fetchRespondents(1, activeFilters);
      closeResetConfirmation();
    } catch (err) {
      showAlert("error", err.message || "Gagal mereset data.");
    } finally {
      setResetModalLoading(false);
    }
  };

  if (loading && respondents.length === 0 && !alert.message)
    return <div style={{ padding: "20px 0" }}>Memuat data responden...</div>;

  return (
    <div className="admin-respondents-page">
      <h1>Data Responden</h1>

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <p style={{ margin: 0 }}>
            Total Responden: <strong>{totalRespondents}</strong>
          </p>
          {filterCount > 0 && (
            <span
              style={{
                backgroundColor: "#3498db",
                color: "white",
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              {filterCount} Filter Aktif
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{
              ...filterStyles.filterButton,
              backgroundColor: showFilterPanel ? "#e67e22" : "#3498db",
            }}
          >
            <FaFilter style={{ fontSize: "0.9rem" }} />
            {showFilterPanel ? "Tutup Filter" : "Filter Data"}
            {filterCount > 0 && ` (${filterCount})`}
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
            disabled={loading || totalRespondents === 0}
          >
            <RiResetRightFill
              style={{ fontSize: "1rem", fontWeight: "bold" }}
            />
            Reset Data Responden & Survei
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div style={filterStyles.filterPanel}>
          <h3 style={filterStyles.filterTitle}>Filter Data Responden</h3>

          <div style={filterStyles.filterGrid}>
            {/* Gender Filter */}
            <div style={filterStyles.filterGroup}>
              <label style={filterStyles.filterLabel}>Jenis Kelamin</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                style={filterStyles.filterInput}
              >
                <option value="">Semua</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Age Range Filter */}
            <div style={filterStyles.filterGroup}>
              <label style={filterStyles.filterLabel}>Rentang Usia</label>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin}
                  onChange={(e) => handleFilterChange("ageMin", e.target.value)}
                  style={{ ...filterStyles.filterInput, width: "80px" }}
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.ageMax}
                  onChange={(e) => handleFilterChange("ageMax", e.target.value)}
                  style={{ ...filterStyles.filterInput, width: "80px" }}
                  min="0"
                />
              </div>
            </div>

            {/* Visit Frequency Filter */}
            <div style={filterStyles.filterGroup}>
              <label style={filterStyles.filterLabel}>
                Frekuensi Kunjungan
              </label>
              <select
                value={filters.visitFrequency}
                onChange={(e) =>
                  handleFilterChange("visitFrequency", e.target.value)
                }
                style={filterStyles.filterInput}
              >
                <option value="">Semua</option>
                <option value="Pertama kali">Pertama kali</option>
                <option value="Lebih dari satu kali">
                  Lebih dari satu kali
                </option>
                <option value="Sering">Sering</option>
              </select>
            </div>

            {/* Date From Filter */}
            <div style={filterStyles.filterGroup}>
              <label style={filterStyles.filterLabel}>Tanggal Mulai</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                style={filterStyles.filterInput}
              />
            </div>

            {/* Date To Filter */}
            <div style={filterStyles.filterGroup}>
              <label style={filterStyles.filterLabel}>Tanggal Akhir</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                style={filterStyles.filterInput}
              />
            </div>
          </div>

          <div style={filterStyles.filterActions}>
            <button
              onClick={handleApplyFilter}
              style={filterStyles.applyButton}
            >
              <FaSearch style={{ fontSize: "0.9rem" }} />
              Terapkan Filter
            </button>
            <button
              onClick={handleResetFilter}
              style={filterStyles.resetFilterButton}
            >
              <FaTimes style={{ fontSize: "0.9rem" }} />
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {filterCount > 0 && (
        <div style={filterStyles.activeFiltersDisplay}>
          <strong>Filter Aktif:</strong>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "5px",
            }}
          >
            {activeFilters.gender && (
              <span style={filterStyles.filterTag}>
                Jenis Kelamin: {activeFilters.gender}
              </span>
            )}
            {(activeFilters.ageMin || activeFilters.ageMax) && (
              <span style={filterStyles.filterTag}>
                Usia: {activeFilters.ageMin || "0"} -{" "}
                {activeFilters.ageMax || "∞"}
              </span>
            )}
            {activeFilters.visitFrequency && (
              <span style={filterStyles.filterTag}>
                Kunjungan: {activeFilters.visitFrequency}
              </span>
            )}
            {activeFilters.dateFrom && (
              <span style={filterStyles.filterTag}>
                Dari:{" "}
                {new Date(activeFilters.dateFrom).toLocaleDateString("id-ID")}
              </span>
            )}
            {activeFilters.dateTo && (
              <span style={filterStyles.filterTag}>
                Sampai:{" "}
                {new Date(activeFilters.dateTo).toLocaleDateString("id-ID")}
              </span>
            )}
          </div>
        </div>
      )}

      {respondents.length === 0 && !loading ? (
        <p>
          {filterCount > 0
            ? "Tidak ada data responden yang sesuai dengan filter."
            : "Belum ada data responden."}
        </p>
      ) : respondents.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>No.</th>
                  <th style={tableStyles.th}>Nama</th>
                  <th style={tableStyles.th}>Jenis Kelamin</th>
                  <th style={tableStyles.th}>Usia</th>
                  <th style={tableStyles.th}>Frekuensi Kunjungan</th>
                  <th style={tableStyles.th}>Tanggal Submit</th>
                </tr>
              </thead>
              <tbody>
                {respondents.map((respondent, index) => (
                  <tr key={respondent._id}>
                    <td style={tableStyles.td}>
                      <center>{(currentPage - 1) * limit + index + 1}</center>
                    </td>
                    <td style={tableStyles.td}>{respondent.name}</td>
                    <td style={tableStyles.td}>{respondent.gender}</td>
                    <td style={tableStyles.td}>{respondent.age}</td>
                    <td style={tableStyles.td}>{respondent.visitFrequency}</td>
                    <td style={tableStyles.td}>
                      {new Date(respondent.createdAt).toLocaleDateString(
                        "id-ID",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </td>
                  </tr>
                ))}
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
            <span>
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

      <ConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={closeResetConfirmation}
        onConfirm={handleResetAllDataConfirmed}
        title="Konfirmasi Reset Data Responden & Survei"
        message="ANDA YAKIN ingin menghapus SELURUH data responden DAN SEMUA data survei yang telah diisi? Tindakan ini akan menghapus data secara permanen dan TIDAK DAPAT DIURUNGKAN!"
        confirmText={resetModalLoading ? "Mereset..." : "Ya, Hapus Semua Data"}
        cancelText="Batal"
      />

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

const filterStyles = {
  filterButton: {
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    border: "none",
    padding: "9px 13px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
  },
  filterPanel: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  filterTitle: {
    margin: "0 0 20px 0",
    color: "#2c3e50",
    fontSize: "1.1rem",
    borderBottom: "2px solid #3498db",
    paddingBottom: "10px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  filterLabel: {
    marginBottom: "5px",
    color: "#555",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  filterInput: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  filterActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  applyButton: {
    backgroundColor: "#16C64F",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.95rem",
  },
  resetFilterButton: {
    backgroundColor: "#95a5a6",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.95rem",
  },
  activeFiltersDisplay: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #90caf9",
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "15px",
    color: "#1565c0",
  },
  filterTag: {
    backgroundColor: "#2196f3",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    display: "inline-block",
  },
};

export default RespondentsPage;
