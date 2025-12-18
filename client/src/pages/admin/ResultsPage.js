import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaPrint, FaFilter, FaTimes, FaSearch } from "react-icons/fa";
import adminService from "../../services/adminService";

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    ikm_min: "",
    ikm_max: "",
    searchKeyword: "",
  });
  const [activeFilters, setActiveFilters] = useState({});

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

  const getCategoryByIKM = (ikm) => {
    if (ikm >= 88.31) return { category: "Sangat Baik", color: "#2ecc71" };
    if (ikm >= 76.61) return { category: "Baik", color: "#3498db" };
    if (ikm >= 65.0) return { category: "Kurang Baik", color: "#f39c12" };
    return { category: "Tidak Baik", color: "#e74c3c" };
  };

  const generateInsight = (questionResult, allResults, allIKMs) => {
    const ikm = calculateIKMPerQuestion(questionResult);
    const totalRespondents = questionResult.totalAnswersForThisQuestion;
    const unsatisfiedCount =
      (questionResult.answers["Tidak Puas"] || 0) +
      (questionResult.answers["Kurang Puas"] || 0);
    const unsatisfiedPercent = (unsatisfiedCount / totalRespondents) * 100;

    const isBestQuestion = Math.max(...allIKMs) === ikm;
    const isWorstQuestion = Math.min(...allIKMs) === ikm;

    let insights = [];

    if (isBestQuestion && !isWorstQuestion && allIKMs.length > 1) {
      insights.push(
        "✓ Pertanyaan ini memiliki skor tertinggi dibanding pertanyaan lain - terus pertahankan."
      );
    }

    if (isWorstQuestion && !isBestQuestion && allIKMs.length > 1) {
      insights.push(
        "⚠ Pertanyaan ini memiliki skor terendah - memerlukan perhatian khusus untuk perbaikan."
      );
    }

    if (!isBestQuestion && !isWorstQuestion) {
      if (ikm >= 88.31) {
        insights.push(
          `✓ Tingkat kepuasan sangat tinggi (${ikm.toFixed(
            1
          )}%). Layanan sudah memenuhi ekspektasi masyarakat dengan sangat baik.`
        );
      } else if (ikm >= 76.61) {
        if (unsatisfiedPercent > 15) {
          const satisfactionCategory = getCategoryByIKM(ikm).category;
          insights.push(
            `⚠ Meski nilai ${satisfactionCategory.toLowerCase()}, masih ada ${unsatisfiedPercent.toFixed(
              1
            )}% responden yang kurang puas. Perlu evaluasi lebih lanjut.`
          );
        } else {
          insights.push(
            `✓ Nilai baik (${ikm.toFixed(
              1
            )}%). Pertahankan konsistensi layanan yang telah dicapai.`
          );
        }
      } else if (ikm >= 65.0) {
        insights.push(
          `⚠ Nilai kurang baik (${ikm.toFixed(
            1
          )}%) Segera lakukan perbaikan terstruktur.`
        );
      } else {
        insights.push(
          `❌ Nilai tidak baik (${ikm.toFixed(
            1
          )}%). Diperlukan tindakan korektif mendesak untuk meningkatkan kualitas layanan.`
        );
      }
    }

    return insights.join(" ");
  };

  // Calculate monthly IKM
  const calculateMonthlyIKM = () => {
    if (!results || results.length === 0) return [];

    const monthlyData = {};

    results.forEach((question) => {
      const ikm = calculateIKMPerQuestion(question);

      // Create month key (assuming createdAt or using current month)
      const month = new Date().toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(ikm);
    });

    // Calculate average IKM per month
    return Object.entries(monthlyData).map(([month, ikms]) => ({
      month,
      ikm: parseFloat(
        (ikms.reduce((a, b) => a + b, 0) / ikms.length).toFixed(2)
      ),
    }));
  };

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const resultsData = await adminService.getResultsByQuestion();
      const statsData = await adminService.getAdminDashboardStats();
      setResults(resultsData || []);
      setDashboardStats(statsData);
      setError("");
    } catch (err) {
      setError(err.message || "Gagal memuat hasil kuesioner.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Apply filters
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (activeFilters.searchKeyword) {
      filtered = filtered.filter((q) =>
        q.questionText
          .toLowerCase()
          .includes(activeFilters.searchKeyword.toLowerCase())
      );
    }

    if (activeFilters.ikm_min || activeFilters.ikm_max) {
      filtered = filtered.filter((q) => {
        const ikm = calculateIKMPerQuestion(q);
        const min = activeFilters.ikm_min
          ? parseFloat(activeFilters.ikm_min)
          : 0;
        const max = activeFilters.ikm_max
          ? parseFloat(activeFilters.ikm_max)
          : 100;
        return ikm >= min && ikm <= max;
      });
    }

    return filtered;
  }, [results, activeFilters]);

  const ikmValues = results
    .filter((result) => result.totalAnswersForThisQuestion > 0)
    .map(calculateIKMPerQuestion);
  const monthlyIKM = calculateMonthlyIKM();

  const avgIKM =
    ikmValues.length > 0
      ? ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
      : 0;
  const category = getCategoryByIKM(avgIKM);

  const totalSangatPuas = results.reduce(
    (sum, q) => sum + (q.answers["Sangat Puas"] || 0),
    0
  );
  const totalPuas = results.reduce(
    (sum, q) => sum + (q.answers["Puas"] || 0),
    0
  );
  const totalKurangPuas = results.reduce(
    (sum, q) => sum + (q.answers["Kurang Puas"] || 0),
    0
  );
  const totalTidakPuas = results.reduce(
    (sum, q) => sum + (q.answers["Tidak Puas"] || 0),
    0
  );

  const totalResponses =
    totalSangatPuas + totalPuas + totalKurangPuas + totalTidakPuas;

  const handleApplyFilter = () => {
    setActiveFilters(filters);
    setShowFilterPanel(false);
  };

  const handleResetFilter = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      ikm_min: "",
      ikm_max: "",
      searchKeyword: "",
    });
    setActiveFilters({});
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("id-ID");

    doc.setFontSize(18);
    doc.text("LAPORAN HASIL SURVEI KEPUASAN MASYARAKAT", 14, 22);
    doc.setFontSize(11);
    doc.text(`Tanggal Laporan: ${today}`, 14, 30);
    doc.text(
      `Total Responden: ${dashboardStats?.totalRespondents || 0}`,
      14,
      37
    );
    doc.text(`Total Pertanyaan: ${results.length}`, 14, 44);
    doc.text(`IKM: ${avgIKM.toFixed(2)}`, 14, 51);
    doc.text(`Kategori: ${category.category}`, 14, 58);

    // IKM Table
    const ikmTableData = filteredResults.map((q, idx) => {
      const ikm = calculateIKMPerQuestion(q);
      const category = getCategoryByIKM(ikm).category;
      return [
        idx + 1,
        q.questionText.substring(0, 50) + "...",
        ikm.toFixed(2),
        category,
        q.totalAnswersForThisQuestion,
      ];
    });

    autoTable(doc, {
      startY: 66,
      head: [["No.", "Pertanyaan", "IKM", "Kategori", "Responden"]],
      body: ikmTableData,
      theme: "grid",
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 80 } },
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text("DETAIL ANALISIS PER PERTANYAAN", 14, 22);

    filteredResults.forEach((q, idx) => {
      if (idx > 0 && idx % 2 === 0) doc.addPage();

      const startY = idx % 2 === 0 ? 30 : 150;

      doc.setFontSize(10);
      doc.text(`${idx + 1}. ${q.questionText}`, 14, startY);

      const detailData = [
        [
          "Sangat Puas",
          q.answers["Sangat Puas"],
          (
            (q.answers["Sangat Puas"] / q.totalAnswersForThisQuestion) *
            100
          ).toFixed(1) + "%",
        ],
        [
          "Puas",
          q.answers["Puas"],
          ((q.answers["Puas"] / q.totalAnswersForThisQuestion) * 100).toFixed(
            1
          ) + "%",
        ],
        [
          "Kurang Puas",
          q.answers["Kurang Puas"],
          (
            (q.answers["Kurang Puas"] / q.totalAnswersForThisQuestion) *
            100
          ).toFixed(1) + "%",
        ],
        [
          "Tidak Puas",
          q.answers["Tidak Puas"],
          (
            (q.answers["Tidak Puas"] / q.totalAnswersForThisQuestion) *
            100
          ).toFixed(1) + "%",
        ],
      ];

      autoTable(doc, {
        startY: startY + 5,
        head: [["Kategori", "Jumlah", "Persentase"]],
        body: detailData,
        theme: "grid",
        columnStyles: { 0: { cellWidth: 50 } },
      });
    });

    doc.save(`Laporan_Survei_${today.replace(/\//g, "-")}.pdf`);
  };

  if (loading)
    return <p style={{ padding: "20px" }}>Memuat hasil kuesioner...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Hasil Kuesioner Kepuasan Masyarakat</h1>

      {/* Header Actions */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          style={{
            padding: "10px 15px",
            backgroundColor: showFilterPanel ? "#e67e22" : "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaFilter /> Filter & Cari
        </button>
        <button
          onClick={handleExportPDF}
          style={{
            padding: "10px 15px",
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaPrint /> Ekspor PDF
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3>Filter & Pencarian</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label>Cari Pertanyaan:</label>
              <input
                type="text"
                placeholder="Masukkan keyword..."
                value={filters.searchKeyword}
                onChange={(e) =>
                  setFilters({ ...filters, searchKeyword: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label>IKM Min:</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={filters.ikm_min}
                onChange={(e) =>
                  setFilters({ ...filters, ikm_min: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label>IKM Max:</label>
              <input
                type="number"
                placeholder="100"
                min="0"
                max="100"
                value={filters.ikm_max}
                onChange={(e) =>
                  setFilters({ ...filters, ikm_max: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleApplyFilter}
              style={{
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <FaSearch /> Terapkan Filter
            </button>
            <button
              onClick={handleResetFilter}
              style={{
                padding: "10px 20px",
                backgroundColor: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <FaTimes /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Total Responden
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
            }}
          >
            {dashboardStats?.totalRespondents || 0}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Jumlah Pertanyaan
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
            }}
          >
            {filteredResults.length}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>IKM</p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
            }}
          >
            {(ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length).toFixed(
              2
            )}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>Kategori</p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {category.category}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Sangat Puas
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {((totalSangatPuas / totalResponses) * 100).toFixed(1)}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>Puas</p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {((totalPuas / totalResponses) * 100).toFixed(1)}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Kurang Puas
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {((totalKurangPuas / totalResponses) * 100).toFixed(1)}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Tidak Puas
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {((totalTidakPuas / totalResponses) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Results by Question */}
      {filteredResults.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          {filteredResults.map((q, idx) => {
            const ikm = calculateIKMPerQuestion(q);
            const category = getCategoryByIKM(ikm);
            const insight = generateInsight(q, results, ikmValues);

            return (
              <div
                key={q.questionId}
                style={{
                  backgroundColor: "#fbfffe",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                {/* Question Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        color: "#2c3e50",
                      }}
                    >
                      {idx + 1}. {q.questionText}
                    </h4>
                  </div>
                  <div
                    style={{
                      backgroundColor: category.color,
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    IKM: {ikm.toFixed(2)} - {category.category}
                  </div>
                </div>

                {/* Insight */}
                <div
                  style={{
                    backgroundColor: "#ecf7f8",
                    border: "1px solid #a8d8ea",
                    borderRadius: "4px",
                    padding: "12px",
                    marginBottom: "15px",
                    fontSize: "14px",
                    color: "#2c5aa0",
                  }}
                >
                  💡 {insight}
                </div>

                {/* Charts and Data */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "15px",
                    border: "none",
                    outline: "none",
                  }}
                >
                  {/* Bar Chart */}
                  <div>
                    <h5 style={{ margin: "0 0 10px 0" }}>Grafik Jawaban</h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            name: "Sangat Puas",
                            nilai: q.answers["Sangat Puas"],
                            persentase: (
                              (q.answers["Sangat Puas"] /
                                q.totalAnswersForThisQuestion) *
                              100
                            ).toFixed(1),
                          },
                          {
                            name: "Puas",
                            nilai: q.answers["Puas"],
                            persentase: (
                              (q.answers["Puas"] /
                                q.totalAnswersForThisQuestion) *
                              100
                            ).toFixed(1),
                          },
                          {
                            name: "Kurang Puas",
                            nilai: q.answers["Kurang Puas"],
                            persentase: (
                              (q.answers["Kurang Puas"] /
                                q.totalAnswersForThisQuestion) *
                              100
                            ).toFixed(1),
                          },
                          {
                            name: "Tidak Puas",
                            nilai: q.answers["Tidak Puas"],
                            persentase: (
                              (q.answers["Tidak Puas"] /
                                q.totalAnswersForThisQuestion) *
                              100
                            ).toFixed(1),
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="nilai" fill="#3498db" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Summary */}
                  <div>
                    <h5 style={{ margin: "0 0 10px 0" }}>Data Numerik</h5>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {[
                        {
                          label: "Sangat Puas",
                          count: q.answers["Sangat Puas"],
                          color: "#2ecc71",
                        },
                        {
                          label: "Puas",
                          count: q.answers["Puas"],
                          color: "#3498db",
                        },
                        {
                          label: "Kurang Puas",
                          count: q.answers["Kurang Puas"],
                          color: "#f39c12",
                        },
                        {
                          label: "Tidak Puas",
                          count: q.answers["Tidak Puas"],
                          color: "#e74c3c",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            backgroundColor: "#f9f9f9",
                            border: `1px solid ${item.color}`,
                            borderRadius: "4px",
                            padding: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#2c3e50" }}>{item.label}</span>
                          <span
                            style={{ color: item.color, fontWeight: "bold" }}
                          >
                            {item.count} (
                            {(
                              (item.count / q.totalAnswersForThisQuestion) *
                              100
                            ).toFixed(1)}
                            %)
                          </span>
                        </div>
                      ))}
                      <div
                        style={{
                          backgroundColor: "#ecf0f1",
                          borderRadius: "4px",
                          padding: "10px",
                          marginTop: "10px",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        Total Responden: {q.totalAnswersForThisQuestion}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IKM Summary Table */}
      {filteredResults.length > 0 && (
        <div
          style={{
            backgroundColor: "#fbfffe",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "30px",
          }}
        >
          <h3>Tabel Ringkasan IKM</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#2c3e50", color: "white" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    No.
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Pertanyaan
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Sangat Puas
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Puas
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Kurang Puas
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Tidak Puas
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    IKM
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Kategori
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #34495e",
                    }}
                  >
                    Responden
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((q, idx) => {
                  const ikm = calculateIKMPerQuestion(q);
                  const category = getCategoryByIKM(ikm);
                  return (
                    <tr
                      key={q.questionId}
                      style={{ borderBottom: "1px solid #ecf0f1" }}
                    >
                      <td style={{ padding: "12px", textAlign: "left" }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "12px", textAlign: "left" }}>
                        {q.questionText.substring(0, 50)}...
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {q.answers["Sangat Puas"]}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {q.answers["Puas"]}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {q.answers["Kurang Puas"]}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {q.answers["Tidak Puas"]}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {ikm.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          // backgroundColor: category.color + "20",
                          color: category.color,
                          fontWeight: "bold",
                          borderRadius: "4px",
                        }}
                      >
                        {category.category}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {q.totalAnswersForThisQuestion}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr style={{ backgroundColor: "#ecf0f1", fontWeight: "bold" }}>
                  <td colSpan="2" style={{ padding: "12px" }}>
                    TOTAL
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {filteredResults.reduce(
                      (sum, q) => sum + q.answers["Sangat Puas"],
                      0
                    )}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {filteredResults.reduce(
                      (sum, q) => sum + q.answers["Puas"],
                      0
                    )}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {filteredResults.reduce(
                      (sum, q) => sum + q.answers["Kurang Puas"],
                      0
                    )}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {filteredResults.reduce(
                      (sum, q) => sum + q.answers["Tidak Puas"],
                      0
                    )}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {(
                      ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
                    ).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: getCategoryByIKM(
                        ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
                      ).color,
                      fontWeight: "bold",
                      borderRadius: "4px",
                    }}
                  >
                    {
                      getCategoryByIKM(
                        ikmValues.reduce((a, b) => a + b, 0) / ikmValues.length
                      ).category
                    }
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {filteredResults.reduce(
                      (sum, q) => sum + q.totalAnswersForThisQuestion,
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
