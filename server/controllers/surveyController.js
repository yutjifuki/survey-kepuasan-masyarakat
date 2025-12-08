const Survey = require("../models/Survey");
const Respondent = require("../models/Respondent");
const Submission = require("../models/Submission");
const Token = require("../models/Token");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

const submitSurvey = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let cookieId = req.cookies.surveySubmitted;
  const { respondentData, answers, tokenCode } = req.body;

  // Check if token is provided and validate it
  if (tokenCode) {
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
    } catch (error) {
      console.error("Error validating token:", error);
      return res.status(500).json({ message: "Error memvalidasi token" });
    }
  } else {
    // If no token, check cookie-based submission
    if (cookieId) {
      const existingCookieSubmission = await Submission.findOne({ cookieId });
      if (existingCookieSubmission) {
        return res.status(400).json({
          message:
            "Anda sudah mengisi survei hari ini. Terima kasih atas partisipasi Anda!",
        });
      }
    }
  }

  const activeQuestions = await Survey.find({ isActive: true });
  if (answers.length !== activeQuestions.length) {
    return res
      .status(400)
      .json({ message: "Harap isi semua pertanyaan survei." });
  }
  for (const ans of answers) {
    if (!ans.answer) {
      return res
        .status(400)
        .json({ message: `Pertanyaan "${ans.questionText}" belum diisi.` });
    }
  }

  try {
    let existingRespondent = await Respondent.findOne({
      name: { $regex: new RegExp("^" + respondentData.name + "$", "i") },
      gender: respondentData.gender,
      age: respondentData.age,
      visitFrequency: respondentData.visitFrequency,
    });

    if (!existingRespondent) {
      existingRespondent = new Respondent(respondentData);
      existingRespondent = await existingRespondent.save();
    }

    // Check daily submission only if not using token
    if (!tokenCode) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const existingSubmission = await Submission.findOne({
        respondentId: existingRespondent._id,
        submittedAt: { $gte: startOfToday, $lte: endOfToday },
      });

      if (existingSubmission) {
        return res.status(400).json({
          message:
            "Anda sudah mengisi survei hari ini. Terima kasih atas partisipasi Anda!",
        });
      }
    }

    if (!cookieId) {
      cookieId = uuidv4();
    }

    const newSubmission = new Submission({
      respondentId: existingRespondent._id,
      cookieId: cookieId,
      answers: answers.map((ans) => ({
        surveyId: ans.surveyId,
        questionText: ans.questionText,
        answer: ans.answer,
      })),
    });
    await newSubmission.save();

    // Mark token as used if token was provided
    if (tokenCode) {
      const token = await Token.findOne({ tokenCode });
      token.usedBy = existingRespondent._id;
      token.usedAt = new Date();
      token.isActive = false;
      await token.save();
    } else {
      // Set cookie only if not using token
      res.cookie("surveySubmitted", cookieId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    res.status(201).json({
      message: "Survei berhasil dikirim. Terima kasih atas partisipasi Anda!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error saat mengirim survei" });
  }
};

const checkSubmissionStatus = async (req, res) => {
  const cookieId = req.cookies.surveySubmitted;

  if (cookieId) {
    const existingSubmission = await Submission.findOne({ cookieId });
    if (existingSubmission) {
      return res.json({ hasSubmitted: true });
    }
  }

  res.json({ hasSubmitted: false });
};

const getOverallStatistics = async (req, res) => {
  try {
    const totalSubmissions = await Submission.countDocuments();
    if (totalSubmissions === 0) {
      return res.json({
        "Sangat Puas": "0%",
        Puas: "0%",
        "Kurang Puas": "0%",
        "Tidak Puas": "0%",
        totalRespondents: 0,
        overallIKM: "0.00",
      });
    }

    const results = await Submission.aggregate([
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$answers.answer",
          count: { $sum: 1 },
        },
      },
    ]);

    let totalAnswers = 0;
    const satisfactionCounts = {
      "Sangat Puas": 0,
      Puas: 0,
      "Kurang Puas": 0,
      "Tidak Puas": 0,
    };

    results.forEach((result) => {
      satisfactionCounts[result._id] = result.count;
      totalAnswers += result.count;
    });

    const questionsCount = await Survey.countDocuments({ isActive: true });
    const uniqueRespondents = totalAnswers / (questionsCount || 1);

    const satisfactionPercentages = {};
    for (const key in satisfactionCounts) {
      satisfactionPercentages[key] =
        totalAnswers > 0
          ? ((satisfactionCounts[key] / totalAnswers) * 100).toFixed(1) + "%"
          : "0%";
    }

    const totalUniqueRespondents = await Respondent.countDocuments();

    // Calculate overall IKM as average of per-question IKMs
    const allQuestions = await Survey.find({ isActive: true });
    const submissions = await Submission.find({});
    let totalIKM = 0;
    let questionCount = 0;

    for (const question of allQuestions) {
      let totalScore = 0;
      let totalAnswersForQuestion = 0;

      submissions.forEach((submission) => {
        submission.answers.forEach((answer) => {
          if (answer.surveyId.equals(question._id)) {
            if (answer.answer === "Sangat Puas") totalScore += 4;
            else if (answer.answer === "Puas") totalScore += 3;
            else if (answer.answer === "Kurang Puas") totalScore += 2;
            else if (answer.answer === "Tidak Puas") totalScore += 1;
            totalAnswersForQuestion++;
          }
        });
      });

      if (totalAnswersForQuestion > 0) {
        const avgScore = totalScore / totalAnswersForQuestion;
        const ikm = (avgScore / 4) * 100;
        totalIKM += ikm;
        questionCount++;
      }
    }

    const overallIKM =
      questionCount > 0 ? (totalIKM / questionCount).toFixed(2) : "0.00";

    res.json({
      ...satisfactionPercentages,
      totalRespondents: totalUniqueRespondents,
      overallIKM,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAdminDashboardStatistics = async (req, res) => {
  try {
    const totalRespondents = await Respondent.countDocuments();
    const totalSurveyQuestions = await Survey.countDocuments();

    const submissions = await Submission.find().populate("answers.surveyId");
    if (submissions.length === 0) {
      return res.json({
        totalRespondents,
        totalSurveyQuestions,
        satisfactionCounts: {
          "Sangat Puas": 0,
          Puas: 0,
          "Kurang Puas": 0,
          "Tidak Puas": 0,
        },
        satisfactionPercentages: {
          "Sangat Puas": 0,
          Puas: 0,
          "Kurang Puas": 0,
          "Tidak Puas": 0,
        },
        detailedResultsPerQuestion: [],
      });
    }

    const satisfactionCounts = {
      "Sangat Puas": 0,
      Puas: 0,
      "Kurang Puas": 0,
      "Tidak Puas": 0,
    };
    let totalAnswers = 0;

    submissions.forEach((submission) => {
      submission.answers.forEach((answer) => {
        if (satisfactionCounts.hasOwnProperty(answer.answer)) {
          satisfactionCounts[answer.answer]++;
        }
        totalAnswers++;
      });
    });

    const satisfactionPercentages = {};
    if (totalAnswers > 0) {
      for (const key in satisfactionCounts) {
        satisfactionPercentages[key] = parseFloat(
          ((satisfactionCounts[key] / totalAnswers) * 100).toFixed(1)
        );
      }
    } else {
      for (const key in satisfactionCounts) {
        satisfactionPercentages[key] = 0;
      }
    }

    res.json({
      totalRespondents,
      totalSurveyQuestions,
      satisfactionCounts,
      satisfactionPercentages,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getResultsByQuestion = async (req, res) => {
  try {
    const allQuestions = await Survey.find({});
    const submissions = await Submission.find({});

    const results = [];

    for (const question of allQuestions) {
      const questionResult = {
        questionId: question._id,
        questionText: question.questionText,
        isActive: question.isActive,
        answers: {
          "Sangat Puas": 0,
          Puas: 0,
          "Kurang Puas": 0,
          "Tidak Puas": 0,
        },
        totalAnswersForThisQuestion: 0,
      };

      submissions.forEach((submission) => {
        submission.answers.forEach((answer) => {
          if (answer.surveyId.equals(question._id)) {
            if (questionResult.answers.hasOwnProperty(answer.answer)) {
              questionResult.answers[answer.answer]++;
              questionResult.totalAnswersForThisQuestion++;
            }
          }
        });
      });
      results.push(questionResult);
    }

    res.json(results);
  } catch (error) {
    console.error("Error fetching results by question:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPublicIKMData = async (req, res) => {
  try {
    const Survey = require("../models/Survey");
    const Submission = require("../models/Submission");

    // Get all questions
    const allQuestions = await Survey.find({});
    const submissions = await Submission.find({});

    if (allQuestions.length === 0 || submissions.length === 0) {
      return res.json({
        ikm: 0,
        category: "Tidak Baik",
        categoryColor: "#ef4444",
        categoryGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        totalQuestions: 0,
        totalResponses: 0,
      });
    }

    // Calculate IKM per question
    const results = [];
    for (const question of allQuestions) {
      const questionResult = {
        questionId: question._id,
        answers: {
          "Sangat Puas": 0,
          Puas: 0,
          "Kurang Puas": 0,
          "Tidak Puas": 0,
        },
        totalAnswersForThisQuestion: 0,
      };

      submissions.forEach((submission) => {
        submission.answers.forEach((answer) => {
          if (answer.surveyId.equals(question._id)) {
            if (questionResult.answers.hasOwnProperty(answer.answer)) {
              questionResult.answers[answer.answer]++;
              questionResult.totalAnswersForThisQuestion++;
            }
          }
        });
      });

      if (questionResult.totalAnswersForThisQuestion > 0) {
        results.push(questionResult);
      }
    }

    // Calculate IKM for each question
    const calculateIKMPerQuestion = (questionResult) => {
      if (questionResult.totalAnswersForThisQuestion === 0) return 0;

      let totalScore = 0;
      totalScore += (questionResult.answers["Sangat Puas"] || 0) * 4;
      totalScore += (questionResult.answers["Puas"] || 0) * 3;
      totalScore += (questionResult.answers["Kurang Puas"] || 0) * 2;
      totalScore += (questionResult.answers["Tidak Puas"] || 0) * 1;

      const avgScore = totalScore / questionResult.totalAnswersForThisQuestion;
      const ikm = (avgScore / 4) * 100;
      return parseFloat(ikm.toFixed(2));
    };

    const ikmValues = results.map(calculateIKMPerQuestion);
    const avgIKM =
      ikmValues.length > 0
        ? ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
        : 0;

    const getCategoryByIKM = (ikm) => {
      if (ikm >= 88.31) {
        return {
          category: "Sangat Baik",
          color: "#10b981",
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        };
      }
      if (ikm >= 76.61) {
        return {
          category: "Baik",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        };
      }
      if (ikm >= 65.0) {
        return {
          category: "Kurang Baik",
          color: "#f59e0b",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        };
      }
      return {
        category: "Tidak Baik",
        color: "#ef4444",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      };
    };

    const categoryInfo = getCategoryByIKM(avgIKM);

    res.json({
      ikm: avgIKM.toFixed(2),
      category: categoryInfo.category,
      categoryColor: categoryInfo.color,
      categoryGradient: categoryInfo.gradient,
      totalQuestions: allQuestions.length,
      totalResponses: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching public IKM data:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  submitSurvey,
  checkSubmissionStatus,
  getOverallStatistics,
  getAdminDashboardStatistics,
  getResultsByQuestion,
  getPublicIKMData,
};
