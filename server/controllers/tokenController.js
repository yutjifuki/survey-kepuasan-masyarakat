const Token = require("../models/Token");
const { validationResult } = require("express-validator");

// Generate random token code (5 characters: uppercase, lowercase, numbers)
const generateTokenCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 5; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

// Generate multiple tokens
const generateTokens = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { quantity } = req.body;

  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({ message: "Jumlah token harus antara 1-10" });
  }

  try {
    const tokens = [];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    for (let i = 0; i < quantity; i++) {
      let tokenCode;
      let isUnique = false;

      // Ensure unique token code
      while (!isUnique) {
        tokenCode = generateTokenCode();
        const existingToken = await Token.findOne({ tokenCode });
        if (!existingToken) {
          isUnique = true;
        }
      }

      const newToken = new Token({
        tokenCode,
        expiresAt,
      });

      const savedToken = await newToken.save();
      tokens.push(savedToken);
    }

    res.status(201).json({
      message: `${quantity} token berhasil dibuat`,
      tokens,
    });
  } catch (error) {
    console.error("Error generating tokens:", error);
    res.status(500).json({ message: "Server Error saat membuat token" });
  }
};

// Get all tokens with pagination
const getAllTokens = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const skip = (page - 1) * limit;

  try {
    const tokens = await Token.find()
      .populate("usedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTokens = await Token.countDocuments();

    // Update isActive status for expired tokens
    const now = new Date();
    for (const token of tokens) {
      if (token.expiresAt < now && token.isActive && !token.usedBy) {
        token.isActive = false;
        await token.save();
      }
    }

    res.json({
      tokens,
      currentPage: page,
      totalPages: Math.ceil(totalTokens / limit),
      totalTokens,
    });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get token by ID (for detail view)
const getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate(
      "usedBy",
      "name gender age visitFrequency"
    );

    if (!token) {
      return res.status(404).json({ message: "Token tidak ditemukan" });
    }

    // Update isActive if expired
    const now = new Date();
    if (token.expiresAt < now && token.isActive && !token.usedBy) {
      token.isActive = false;
      await token.save();
    }

    res.json(token);
  } catch (error) {
    console.error("Error fetching token:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Validate token (for user survey)
const validateToken = async (req, res) => {
  const { tokenCode } = req.body;

  if (!tokenCode || tokenCode.length !== 5) {
    return res.status(400).json({ message: "Format token tidak valid" });
  }

  try {
    const token = await Token.findOne({ tokenCode });

    if (!token) {
      return res.status(404).json({ message: "Token tidak valid" });
    }

    const now = new Date();
    if (token.expiresAt < now) {
      token.isActive = false;
      await token.save();
      return res.status(400).json({ message: "Token sudah kadaluarsa" });
    }

    if (!token.isActive || token.usedBy) {
      return res.status(400).json({ message: "Token sudah digunakan" });
    }

    res.json({ valid: true, message: "Token valid" });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete single token
const deleteToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ message: "Token tidak ditemukan" });
    }

    await token.deleteOne();
    res.json({ message: "Token berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting token:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Reset all tokens
const resetAllTokens = async (req, res) => {
  try {
    const deleteResult = await Token.deleteMany({});

    res.json({
      message: `Semua token (${deleteResult.deletedCount} data) berhasil dihapus.`,
      deletedTokens: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error resetting all tokens:", error);
    res.status(500).json({ message: "Server Error saat mereset token." });
  }
};

const getActiveTokensPublic = async (req, res) => {
  try {
    const now = new Date();

    const activeTokens = await Token.find({
      isActive: true,
      usedBy: null,
      expiresAt: { $gt: now },
    })
      .select("tokenCode expiresAt createdAt")
      .sort({ createdAt: -1 });

    res.json({
      tokens: activeTokens,
      totalActive: activeTokens.length,
    });
  } catch (error) {
    console.error("Error fetching active tokens:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  generateTokens,
  getAllTokens,
  getTokenById,
  validateToken,
  deleteToken,
  resetAllTokens,
  getActiveTokensPublic,
};
