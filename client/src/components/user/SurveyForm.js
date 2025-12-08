import React, { useState, useEffect } from "react";
import surveyService from "../../services/surveyService";

const SurveyForm = ({ respondentData, onSurveySubmitSuccess }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

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

  if (isLoading) return <p>Memuat pertanyaan survei...</p>;
  if (!isLoading && questions.length === 0 && !error) {
    return (
      <p className="notification warning">
        Saat ini tidak ada survei yang aktif.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Daftar Survei</h2>

      {error && <p className="notification error">{error}</p>}
      {submitMessage && <p className="notification success">{submitMessage}</p>}

      {questions.map((question) => {
        const questionIdBase = `question-${question._id}`;
        return (
          <div key={question._id} className="survey-question-item">
            <p>{question.questionText}</p>
            <div className="radio-group">
              {["Sangat Puas", "Puas", "Kurang Puas", "Tidak Puas"].map(
                (option) => {
                  const radioId = `${questionIdBase}-option-${option.replace(
                    /\s+/g,
                    ""
                  )}`;
                  return (
                    <div
                      key={radioId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="radio"
                        id={radioId}
                        name={question._id}
                        value={option}
                        checked={answers[question._id] === option}
                        onChange={() =>
                          handleAnswerChange(question._id, option)
                        }
                        required
                        style={{ marginRight: "8px", transform: "scale(1.1)" }}
                      />
                      <label
                        htmlFor={radioId}
                        style={{ cursor: "pointer", flexGrow: 1 }}
                      >
                        {option}
                      </label>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      })}

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
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Mengirim..." : "Kirim Survei"}
          </button>
        </div>
      )}
    </form>
  );
};

export default SurveyForm;
