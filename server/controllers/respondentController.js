const Respondent = require("../models/Respondent");
const Submission = require("../models/Submission");

const getAllRespondents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const skip = (page - 1) * limit;

  // Get filter parameters from query
  const { gender, ageMin, ageMax, visitFrequency, dateFrom, dateTo } =
    req.query;

  try {
    // Build filter query
    const filterQuery = {};

    // Gender filter
    if (gender) {
      filterQuery.gender = gender;
    }

    // Age range filter
    if (ageMin || ageMax) {
      filterQuery.age = {};
      if (ageMin) {
        filterQuery.age.$gte = parseInt(ageMin);
      }
      if (ageMax) {
        filterQuery.age.$lte = parseInt(ageMax);
      }
    }

    // Visit frequency filter
    if (visitFrequency) {
      filterQuery.visitFrequency = visitFrequency;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filterQuery.createdAt = {};
      if (dateFrom) {
        // Set to start of day
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filterQuery.createdAt.$gte = fromDate;
      }
      if (dateTo) {
        // Set to end of day
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filterQuery.createdAt.$lte = toDate;
      }
    }

    // Fetch respondents with filters
    const respondents = await Respondent.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRespondents = await Respondent.countDocuments(filterQuery);

    res.json({
      respondents,
      currentPage: page,
      totalPages: Math.ceil(totalRespondents / limit),
      totalRespondents,
      appliedFilters: {
        gender,
        ageMin,
        ageMax,
        visitFrequency,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) {
    console.error("Error fetching respondents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getRespondentById = async (req, res) => {
  try {
    const respondent = await Respondent.findById(req.params.id);
    if (!respondent) {
      return res.status(404).json({ message: "Responden tidak ditemukan" });
    }
    const submissions = await Submission.findOne({
      respondentId: req.params.id,
    }).populate("answers.surveyId", "questionText");
    res.json({ respondent, submissions });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const resetAllRespondentData = async (req, res) => {
  try {
    const respondentDeleteResult = await Respondent.deleteMany({});
    console.log("Respondents deletion result:", respondentDeleteResult);

    const submissionDeleteResult = await Submission.deleteMany({});
    console.log("Submissions deletion result:", submissionDeleteResult);

    res.json({
      message: `Semua data responden (${respondentDeleteResult.deletedCount} data) berhasil direset.`,
      deletedRespondents: respondentDeleteResult.deletedCount,
      deletedSubmissions: submissionDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error resetting all respondent data:", error);
    res
      .status(500)
      .json({ message: "Server Error saat mereset data responden." });
  }
};

module.exports = {
  getAllRespondents,
  getRespondentById,
  resetAllRespondentData,
};
