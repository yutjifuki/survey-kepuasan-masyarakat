import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import AlertModal from "../../components/shared/AlertModal";
import { IoMdAddCircle } from "react-icons/io";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "", isOpen: false });

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionIsActive, setNewQuestionIsActive] = useState(true);
  const [formModalError, setFormModalError] = useState("");
  const [formModalLoading, setFormModalLoading] = useState(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message, isOpen: true });
  };

  const closeAlert = () => {
    setAlert({ type: "", message: "", isOpen: false });
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getQuestions();
      setQuestions(data || []);
    } catch (err) {
      showAlert("error", err.message || "Gagal memuat kuesioner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleOpenModalForCreate = () => {
    setCurrentQuestion(null);
    setNewQuestionText("");
    setNewQuestionIsActive(true);
    setFormModalError("");
    setShowFormModal(true);
  };

  const handleOpenModalForEdit = (question) => {
    setCurrentQuestion(question);
    setNewQuestionText(question.questionText);
    setNewQuestionIsActive(question.isActive);
    setFormModalError("");
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setCurrentQuestion(null);
    setNewQuestionText("");
    setFormModalError("");
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      setFormModalError("Teks pertanyaan tidak boleh kosong.");
      return;
    }
    setFormModalError("");
    setFormModalLoading(true);

    try {
      if (currentQuestion) {
        await adminService.updateQuestion(currentQuestion._id, {
          questionText: newQuestionText,
          isActive: newQuestionIsActive,
        });
        showAlert("success", "Pertanyaan berhasil diperbarui!");
      } else {
        await adminService.createQuestion({
          questionText: newQuestionText,
          isActive: newQuestionIsActive,
        });
        showAlert("success", "Pertanyaan baru berhasil ditambahkan!");
      }
      fetchQuestions();
      handleCloseFormModal();
    } catch (err) {
      setFormModalError(err.message || "Gagal menyimpan pertanyaan.");
    } finally {
      setFormModalLoading(false);
    }
  };

  const openDeleteConfirmation = (question) => {
    setQuestionToDelete(question);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmation = () => {
    setQuestionToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteConfirmed = async () => {
    if (!questionToDelete) return;
    setDeleteModalLoading(true);
    try {
      await adminService.deleteQuestion(questionToDelete._id);
      showAlert(
        "success",
        `Pertanyaan "${questionToDelete.questionText}" berhasil dihapus.`
      );
      fetchQuestions();
      closeDeleteConfirmation();
    } catch (err) {
      showAlert("error", err.message || "Gagal menghapus pertanyaan.");
    } finally {
      setDeleteModalLoading(false);
    }
  };

  if (loading && questions.length === 0)
    return <div style={{ padding: "20px 0" }}>Memuat kuesioner...</div>;

  return (
    <div className="admin-questions-page">
      <h1>Kelola Kuesioner</h1>

      <button
        onClick={handleOpenModalForCreate}
        className="submit-btn"
        style={{
          marginBottom: "20px",
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
        Tambah Pertanyaan Baru
      </button>

      {questions.length === 0 && !loading ? (
        <p>Belum ada kuesioner yang dibuat.</p>
      ) : (
        <table className="admin-table" style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>No.</th>
              <th style={tableStyles.th}>Teks Pertanyaan</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}>Jawaban (Otomatis)</th>
              <th style={tableStyles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => (
              <tr key={question._id} style={{ height: "100%" }}>
                <td style={tableStyles.td}>
                  <center>{index + 1}</center>
                </td>
                <td style={tableStyles.td}>{question.questionText}</td>
                <td style={tableStyles.td}>
                  <span
                    style={
                      question.isActive ? qStyles.active : qStyles.inactive
                    }
                  >
                    {question.isActive ? "Aktif" : "Non-Aktif"}
                  </span>
                </td>
                <td style={tableStyles.td}>
                  Sangat Puas, Puas, Kurang Puas, Tidak Puas
                </td>
                <td style={tableStyles.td_action}>
                  <button
                    onClick={() => handleOpenModalForEdit(question)}
                    style={{ ...qStyles.actionButton, ...qStyles.editButton }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirmation(question)}
                    style={{ ...qStyles.actionButton, ...qStyles.deleteButton }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h2>
              {currentQuestion ? "Edit Pertanyaan" : "Tambah Pertanyaan Baru"}
            </h2>
            {formModalError && (
              <p className="notification error">{formModalError}</p>
            )}
            <form onSubmit={handleSubmitModal}>
              <div className="form-group">
                <label htmlFor="questionText" style={{ fontWeight: "initial" }}>
                  Teks Pertanyaan
                </label>
                <textarea
                  type="text"
                  id="questionText"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  rows="3"
                  required
                  style={{
                    width: "100%",
                    height: "100px",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    resize: "none",
                    fontFamily: "-apple-system, helvetica, sans-serif",
                  }}
                ></textarea>
              </div>
              <div
                className="form-group"
                style={{ marginTop: "15px", textAlign: "left" }}
              ></div>
              <div className="button-group" style={{ marginTop: "25px" }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={formModalLoading}
                >
                  {formModalLoading
                    ? "Menyimpan..."
                    : currentQuestion
                    ? "Simpan Perubahan"
                    : "Tambah Pertanyaan"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="reset-btn"
                  disabled={formModalLoading}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteConfirmed}
        title="Konfirmasi Penghapusan"
        message={`Apakah Anda yakin ingin menghapus pertanyaan: "${questionToDelete?.questionText}"? Tindakan ini tidak dapat diurungkan dan akan mempengaruhi data hasil survei terkait.`}
        confirmText={deleteModalLoading ? "Menghapus..." : "Ya, Hapus"}
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
  td: {
    border: "1px solid #ddd",
    padding: "10px",
    color: "#555",
  },
  td_action: {
    border: "1px solid #ddd",
    padding: "10px",
    width: "135px",
    color: "#555",
    textAlign: "center",
  },
};

const qStyles = {
  actionButton: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    fontSize: "0.9rem",
    margin: "0 5px",
    flex: "1",
  },
  editButton: { backgroundColor: "#3498db" },
  deleteButton: { backgroundColor: "#EB001B" },
  active: {
    color: "#2ecc71",
    fontWeight: "bold",
    backgroundColor: "#e6f9f0",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  inactive: {
    color: "#7f8c8d",
    fontWeight: "normal",
    backgroundColor: "#f0f0f0",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
};

export default QuestionsPage;
