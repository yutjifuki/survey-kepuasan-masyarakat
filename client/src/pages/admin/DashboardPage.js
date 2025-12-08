import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import PieChartComponent from "../../components/admin/PieChartComponent";

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsData = await adminService.getAdminDashboardStats();
        const resultsData = await adminService.getResultsByQuestion();
        setStats(statsData);
        setResults(resultsData || []);
        setError("");
      } catch (err) {
        setError(err.message || "Gagal memuat data dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p style={styles.loadingText}>Memuat dashboard...</p>;
  if (error) return <p style={styles.errorText}>{error}</p>;
  if (!stats)
    return <p style={styles.noDataText}>Tidak ada data statistik tersedia.</p>;

  const calculateIKMPerQuestion = (questionResult) => {
    if (
      !questionResult.totalAnswersForThisQuestion ||
      questionResult.totalAnswersForThisQuestion === 0
    )
      return 0;

    let totalScore = 0;
    totalScore += (questionResult.answers["Sangat Puas"] || 0) * 4;
    totalScore += (questionResult.answers["Puas"] || 0) * 3;
    totalScore += (questionResult.answers["Kurang Puas"] || 0) * 2;
    totalScore += (questionResult.answers["Tidak Puas"] || 0) * 1;

    const avgScore = totalScore / questionResult.totalAnswersForThisQuestion;
    const ikm = (avgScore / 4) * 100;
    return parseFloat(ikm.toFixed(2));
  };

  const calculateIKM = () => {
    const ikmValues = results
      .filter((result) => result.totalAnswersForThisQuestion > 0)
      .map(calculateIKMPerQuestion);
    const avgIKM =
      ikmValues.length > 0
        ? ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
        : 0;
    return avgIKM.toFixed(2);
  };

  const getCategoryByIKM = (ikm) => {
    if (ikm >= 88.31)
      return {
        category: "Sangat Baik",
        color: "#10b981",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      };
    if (ikm >= 76.61)
      return {
        category: "Baik",
        color: "#3b82f6",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      };
    if (ikm >= 65.0)
      return {
        category: "Kurang Baik",
        color: "#f59e0b",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      };
    return {
      category: "Tidak Baik",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    };
  };

  const ikm = calculateIKM();
  const categoryInfo = getCategoryByIKM(parseFloat(ikm));

  const statCards = [
    {
      title: "Total Responden",
      value: stats.totalRespondents || 0,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "Jumlah Kuesioner",
      value: stats.totalSurveyQuestions || 0,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "Kepuasan",
      value: `${(
        (stats.satisfactionPercentages["Puas"] || 0) +
        (stats.satisfactionPercentages["Sangat Puas"] || 0)
      ).toFixed(1)}%`,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      title: "Ketidakpuasan",
      value: `${(
        (stats.satisfactionPercentages["Kurang Puas"] || 0) +
        (stats.satisfactionPercentages["Tidak Puas"] || 0)
      ).toFixed(1)}%`,
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Admin</h1>
      </div>

      <div style={styles.cardsGrid}>
        {statCards.map((card, index) => (
          <div
            key={index}
            style={{ ...styles.card, background: card.gradient }}
          >
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardContent}>
              <span style={styles.cardTitle}>{card.title}</span>
              <p style={styles.cardValue}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.ikmSection}>
        <div style={{ ...styles.ikmCard, background: categoryInfo.gradient }}>
          <div style={styles.ikmHeader}>
            <span style={styles.ikmLabel}>Indeks Kepuasan Masyarakat</span>
          </div>
          <div style={styles.ikmValue}>{ikm}</div>
          <div style={styles.ikmCategory}>
            <span style={styles.categoryBadge}>{categoryInfo.category}</span>
          </div>
        </div>
      </div>

      <div style={styles.chartSection}>
        <div style={styles.chartHeader}>
          <h2 style={styles.chartTitle}>Statistik Kepuasan Keseluruhan</h2>
        </div>
        {stats.satisfactionPercentages &&
        Object.keys(stats.satisfactionPercentages).length > 0 ? (
          <div style={styles.chartContent}>
            <div style={styles.chartWrapper}>
              <PieChartComponent
                data={stats.satisfactionPercentages}
                title=" "
              />
            </div>
            <div style={styles.statsGrid}>
              {[
                { label: "Sangat Puas", color: "#10b981", emoji: "😄" },
                { label: "Puas", color: "#3b82f6", emoji: "🙂" },
                { label: "Kurang Puas", color: "#f59e0b", emoji: "😐" },
                { label: "Tidak Puas", color: "#ef4444", emoji: "☹️" },
              ].map((item, index) => (
                <div key={index} style={styles.statItem}>
                  <div style={styles.statIcon}>{item.emoji}</div>
                  <div style={styles.statInfo}>
                    <span style={styles.statLabel}>{item.label}</span>
                    <div style={styles.statValues}>
                      <span
                        style={{ ...styles.statPercentage, color: item.color }}
                      >
                        {stats.satisfactionPercentages[item.label] || 0}%
                      </span>
                      <span style={styles.statCount}>
                        ({stats.satisfactionCounts[item.label] || 0} jawaban)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={styles.noDataText}>Belum ada data kepuasan yang cukup.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "40px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    margin: "0 0 8px 0",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    marginBottom: "30px",
  },
  card: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  cardIcon: {
    fontSize: "3rem",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardValue: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0",
    lineHeight: "1",
  },
  ikmSection: {
    marginBottom: "30px",
  },
  ikmCard: {
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)",
    textAlign: "center",
  },
  ikmHeader: {
    marginBottom: "20px",
  },
  ikmLabel: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  ikmValue: {
    fontSize: "5rem",
    fontWeight: "900",
    color: "#ffffff",
    margin: "20px 0",
    textShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
  },
  ikmCategory: {
    marginTop: "20px",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "12px 32px",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: "30px",
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#ffffff",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 255, 255, 0.3)",
  },
  chartSection: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "35px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },
  chartHeader: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "2px solid #f1f5f9",
  },
  chartTitle: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0",
  },
  chartContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "40px",
    alignItems: "center",
  },
  chartWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  statIcon: {
    fontSize: "2rem",
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    display: "block",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "4px",
  },
  statValues: {
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  statPercentage: {
    fontSize: "1.8rem",
    fontWeight: "800",
  },
  statCount: {
    fontSize: "0.9rem",
    color: "#94a3b8",
  },
  loadingText: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#64748b",
    padding: "60px",
  },
  errorText: {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#ef4444",
    padding: "40px",
    backgroundColor: "#fee2e2",
    borderRadius: "12px",
    margin: "20px",
  },
  noDataText: {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#64748b",
    padding: "40px",
  },
};

export default DashboardPage;
