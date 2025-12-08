import React, { useState, useEffect } from "react";
import surveyService from "../../services/surveyService";
import "../../../src/App.css";

const SurveyForm = ({ respondentData, onSurveySubmitSuccess }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const fetchedQuestions = await surveyService.getActiveQuestions();
        setQuestions(fetchedQuestions || []);
        const initialAnswers = {};
        (fetchedQuestions || []).forEach((q) => (initialAnswers[q._id] = ""));
        setAnswers(initialAnswers);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || "Gagal memuat pertanyaan survei.");
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswerChange = (questionId, answerValue) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerValue,
    }));
  };

  const handleReset = () => {
    const resetAnswers = {};
    questions.forEach((q) => (resetAnswers[q._id] = ""));
    setAnswers(resetAnswers);
    setError("");
    setSubmitMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitMessage("");

    const unansweredQuestions = questions.filter((q) => !answers[q._id]);
    if (unansweredQuestions.length > 0) {
      setError(
        `Harap isi semua pertanyaan survei. Pertanyaan "${unansweredQuestions[0].questionText}" belum diisi.`
      );
      return;
    }

    const surveyPayload = {
      respondentData: {
        name: respondentData.name,
        gender: respondentData.gender,
        age: respondentData.age,
        visitFrequency: respondentData.visitFrequency,
      },
      answers: questions.map((q) => ({
        surveyId: q._id,
        questionText: q.questionText,
        answer: answers[q._id],
      })),
    };

    // Add token if provided
    if (respondentData.tokenCode) {
      surveyPayload.tokenCode = respondentData.tokenCode;
    }

    try {
      setIsLoading(true);
      const response = await surveyService.submitSurvey(surveyPayload);
      setSubmitMessage(response.message || "Survei berhasil dikirim!");
      setIsLoading(false);
      onSurveySubmitSuccess();
    } catch (err) {
      setError(err.message || "Gagal mengirim survei. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const getAnswerColor = (option) => {
    const colors = {
      "Sangat Puas": "#10b981",
      Puas: "#3b82f6",
      "Kurang Puas": "#f59e0b",
      "Tidak Puas": "#ef4444",
    };
    return colors[option] || "#6b7280";
  };

  const getAnswerIcon = (option) => {
    const icons = {
      "Sangat Puas": "😄",
      Puas: "🙂",
      "Kurang Puas": "😐",
      "Tidak Puas": "☹️",
    };
    return icons[option] || "🤔";
  };

  if (isLoading) {
    return (
      <div className="survey-loading">
        <div className="spinner"></div>
        <p>Memuat pertanyaan survei...</p>
      </div>
    );
  }

  if (!isLoading && questions.length === 0 && !error) {
    return (
      <div className="survey-empty">
        <p className="notification warning">
          Saat ini tidak ada survei yang aktif.
        </p>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (Object.values(answers).filter((a) => a).length / questions.length) * 100
  );

  return (
    <form onSubmit={handleSubmit} className="survey-form-container">
      <div className="survey-header">
        <h2 className="survey-title">📋 Survei Kepuasan Pelayanan</h2>
        <p className="survey-subtitle">
          Suara Anda sangat berharga untuk meningkatkan kualitas layanan kami
        </p>
      </div>

      {/* Progress Bar */}
      <div className="progress-wrapper">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="progress-text">
          {Object.values(answers).filter((a) => a).length} dari{" "}
          {questions.length} pertanyaan
        </p>
      </div>

      {error && (
        <div className="notification error">
          <span>❌</span> {error}
        </div>
      )}
      {submitMessage && (
        <div className="notification success">
          <span>✅</span> {submitMessage}
        </div>
      )}

      {/* Questions */}
      <div className="questions-container">
        {questions.map((question, index) => {
          const questionIdBase = `question-${question._id}`;
          return (
            <div
              key={question._id}
              className="survey-question-item animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="question-header">
                <span className="question-number">{index + 1}</span>
                <p className="question-text">{question.questionText}</p>
              </div>

              <div className="radio-group">
                {["Sangat Puas", "Puas", "Kurang Puas", "Tidak Puas"].map(
                  (option) => {
                    const radioId = `${questionIdBase}-option-${option.replace(
                      /\s+/g,
                      ""
                    )}`;
                    const isSelected = answers[question._id] === option;
                    return (
                      <div
                        key={radioId}
                        className={`radio-option ${
                          isSelected ? "selected" : ""
                        }`}
                        style={{
                          borderColor: isSelected
                            ? getAnswerColor(option)
                            : "#e5e7eb",
                          backgroundColor: isSelected
                            ? `${getAnswerColor(option)}10`
                            : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          id={radioId}
                          name={question._id}
                          value={option}
                          checked={isSelected}
                          onChange={() =>
                            handleAnswerChange(question._id, option)
                          }
                          required
                          className="radio-input"
                        />
                        <label htmlFor={radioId} className="radio-label">
                          <span className="radio-icon">
                            {getAnswerIcon(option)}
                          </span>
                          <span className="radio-text">{option}</span>
                          {isSelected && (
                            <span
                              className="radio-check"
                              style={{ color: getAnswerColor(option) }}
                            >
                              ✓
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {questions.length > 0 && (
        <div className="button-group">
          <button
            type="button"
            onClick={handleReset}
            className="reset-btn"
            disabled={isLoading}
          >
            Reset Jawaban
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || progressPercentage < 100}
          >
            {isLoading ? "Mengirim..." : "Kirim Survei"}
          </button>
        </div>
      )}
    </form>
  );
};

export default SurveyForm;
