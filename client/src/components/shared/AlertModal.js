import React, { useEffect, useState } from "react";
import "./AlertModal.css";
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfo,
  MdNotifications,
} from "react-icons/md";

const AlertModal = ({
  type = "info",
  message = "",
  isOpen = false,
  onClose = () => {},
  autoClose = true,
  duration = 2000,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      return;
    }

    if (autoClose) {
      // Start exit animation 300ms before closing
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, duration - 300);

      const closeTimer = setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, duration);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isOpen, autoClose, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    const iconStyle = {
      fontSize: "22px",
      color: "white",
      flexShrink: 0,
    };

    switch (type) {
      case "success":
        return <MdCheckCircle style={iconStyle} />;
      case "error":
        return <MdError style={iconStyle} />;
      case "warning":
        return <MdWarning style={iconStyle} />;
      case "info":
        return <MdInfo style={iconStyle} />;
      default:
        return <MdNotifications style={iconStyle} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div
      className={`alert-toast ${isExiting ? "alert-exiting" : ""}`}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: getBackgroundColor(),
        color: "white",
        padding: "16px 20px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "400px",
        zIndex: 9999,
      }}
    >
      {getIcon()}

      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
          {message}
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        .alert-toast {
          animation: slideInRight 0.3s ease-out;
        }

        .alert-toast.alert-exiting {
          animation: slideOutRight 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default AlertModal;
