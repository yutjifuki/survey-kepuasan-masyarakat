const express = require("express");
const router = express.Router();
const {
  generateTokens,
  getAllTokens,
  getTokenById,
  validateToken,
  deleteToken,
  resetAllTokens,
  getActiveTokensPublic,
} = require("../controllers/tokenController");
const { protectAdmin } = require("../middleware/authMiddleware");
const { check } = require("express-validator");

router.post("/validate", validateToken);
router.get("/active-public", getActiveTokensPublic);
router.post(
  "/generate",
  protectAdmin,
  [
    check("quantity", "Jumlah token harus berupa angka")
      .isInt({ min: 1, max: 10 })
      .withMessage("Jumlah token harus antara 1-10"),
  ],
  generateTokens
);

router.get("/", protectAdmin, getAllTokens);

router.get("/:id", protectAdmin, getTokenById);

router.delete("/reset-all", protectAdmin, resetAllTokens);

router.delete("/:id", protectAdmin, deleteToken);

router.post("/validate", validateToken);

module.exports = router;
