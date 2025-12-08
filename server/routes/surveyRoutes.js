const express = require("express");
const router = express.Router();
const {
  submitSurvey,
  checkSubmissionStatus,
  getOverallStatistics,
  getAdminDashboardStatistics,
  getResultsByQuestion,
  getPublicIKMData,
} = require("../controllers/surveyController");
const { protectAdmin } = require("../middleware/authMiddleware");
const { check, body } = require("express-validator");

router.post(
  "/submit",
  [
    check("respondentData.name", "Nama tidak boleh kosong").not().isEmpty(),
    check("respondentData.gender", "Jenis kelamin harus dipilih").isIn([
      "Laki-laki",
      "Perempuan",
    ]),
    check("respondentData.age", "Usia harus angka").isInt({ min: 1 }),
    check(
      "respondentData.visitFrequency",
      "Frekuensi kunjungan harus dipilih"
    ).isIn(["Pertama kali", "Lebih dari satu kali", "Sering"]),
    body("answers")
      .isArray({ min: 1 })
      .withMessage("Jawaban survei harus diisi"),
    body("answers.*.surveyId", "ID Pertanyaan tidak valid").isMongoId(),
    body("answers.*.questionText", "Teks Pertanyaan tidak boleh kosong")
      .not()
      .isEmpty(),
    body("answers.*.answer", "Jawaban harus dipilih").isIn([
      "Sangat Puas",
      "Puas",
      "Kurang Puas",
      "Tidak Puas",
    ]),
  ],
  submitSurvey
);
router.get("/check-submission", checkSubmissionStatus);
router.get("/statistics", getOverallStatistics);
router.get("/public-ikm", getPublicIKMData);
router.get("/zonadptk/statistics", protectAdmin, getAdminDashboardStatistics);
router.get("/zonadptk/results-by-question", protectAdmin, getResultsByQuestion);

module.exports = router;
