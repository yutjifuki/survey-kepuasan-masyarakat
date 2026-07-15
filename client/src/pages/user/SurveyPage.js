import React, { useState, useEffect } from "react";
import RespondentModal from "../../components/user/RespondentModal";
import SurveyForm from "../../components/user/SurveyForm";
import surveyService from "../../services/surveyService";
import { FaRegSmileWink } from "react-icons/fa";

const SurveyPage = ({ hasSubmittedInitial, onSurveySubmit }) => {
  const [showRespondentModal, setShowRespondentModal] = useState(true);
  const [respondentData, setRespondentData] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(hasSubmittedInitial);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (hasSubmittedInitial === undefined) {
      const checkStatus = async () => {
        setIsCheckingStatus(true);
        const data = await surveyService.checkSubmissionStatus();
        setHasSubmitted(data.hasSubmitted);
        setIsCheckingStatus(false);
        if (!data.hasSubmitted) {
          setShowRespondentModal(true);
        } else {
          setShowRespondentModal(false);
        }
      };
      checkStatus();
    } else {
      setIsCheckingStatus(false);
      if (!hasSubmittedInitial) {
        setShowRespondentModal(true);
      } else {
        setShowRespondentModal(false);
      }
    }
  }, [hasSubmittedInitial]);

  const handleRespondentSubmit = (data) => {
    setRespondentData(data);
    setShowRespondentModal(false);
  };

  const handleSurveySubmitSuccess = () => {
    setHasSubmitted(true);
    if (typeof onSurveySubmit === "function") {
      onSurveySubmit();
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="survey-page-container">
        <p>Memeriksa status survei Anda...</p>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="survey-page-container">
        <div className="thank-you-message-container">
          <FaRegSmileWink className="thank-you-icon" />
          <p className="thank-you-message">
            Terima kasih telah mengisi survei!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page-container">
      {showRespondentModal && !respondentData && (
        <RespondentModal onSubmit={handleRespondentSubmit} />
      )}
      {!showRespondentModal && respondentData && (
        <SurveyForm
          respondentData={respondentData}
          onSurveySubmitSuccess={handleSurveySubmitSuccess}
        />
      )}
    </div>
  );
};

export default SurveyPage;
