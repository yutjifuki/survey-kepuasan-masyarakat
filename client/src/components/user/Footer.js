import React from "react";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaGlobe,
  FaInstagram,
  FaPhone,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>
            <FaMapMarkerAlt style={styles.icon} />
            Alamat Kantor
          </h4>
          <p style={styles.text}>
            Jl. Raya Blora - Rembang, Ngotet Kidul, Ngotet, Kec. Rembang,
            Kabupaten Rembang, Jawa Tengah 59219
          </p>
        </div>

        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>Kontak Kami</h4>
          <div style={styles.contactItem}>
            <FaEnvelope style={styles.contactIcon} />
            <a href="mailto:dinperinnaker@rembangkab.go.id" style={styles.link}>
              dinperinnaker@rembangkab.go.id
            </a>
          </div>
          <div style={styles.contactItem}>
            <FaGlobe style={styles.contactIcon} />
            <a
              href="https://dinperinnaker.rembangkab.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              dinperinnaker.rembangkab.go.id
            </a>
          </div>
          <div style={styles.contactItem}>
            <FaInstagram style={styles.contactIcon} />
            <a
              href="https://www.instagram.com/dinperinnaker.rembangkab/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              @dinperinnaker.rembangkab
            </a>
          </div>
        </div>

        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>Jam Pelayanan</h4>
          <div style={styles.scheduleItem}>
            <span style={styles.day}>Senin - Kamis</span>
            <span style={styles.time}>07:30 - 16:00 WIB</span>
          </div>
          <div style={styles.scheduleItem}>
            <span style={styles.day}>Jumat</span>
            <span style={styles.time}>07:30 - 11:00 WIB</span>
          </div>
        </div>
      </div>

      <div style={styles.footerBottom}>
        <div style={styles.bottomContent}>
          <p style={styles.copyright}>
            &copy; {new Date().getFullYear()} Dinas Perindustrian dan Tenaga
            Kerja Kabupaten Rembang
          </p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    width: "100%",
    boxSizing: "border-box",
    paddingTop: "3rem",
  },
  footerContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "3rem",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem 2rem 2rem",
  },
  footerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionTitle: {
    color: "#FAA916",
    fontSize: "1.3rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  icon: {
    fontSize: "1.2rem",
  },
  text: {
    color: "#cbd5e1",
    fontSize: "0.95rem",
    lineHeight: "1.7",
    margin: 0,
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    marginBottom: "0.5rem",
  },
  contactIcon: {
    color: "#FAA916",
    fontSize: "1.1rem",
    flexShrink: 0,
  },
  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s ease, transform 0.3s ease",
    display: "inline-block",
  },
  scheduleItem: {
    backgroundColor: "rgba(250, 169, 22, 0.1)",
    padding: "0.8rem 1rem",
    borderRadius: "8px",
    // borderLeft: "3px solid #FAA916",
  },
  day: {
    display: "block",
    color: "#FAA916",
    fontWeight: "600",
    fontSize: "0.95rem",
    marginBottom: "0.3rem",
  },
  time: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "0.9rem",
  },
  closedNote: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontStyle: "italic",
    textAlign: "center",
  },
  footerBottom: {
    borderTop: "1px solid rgba(250, 169, 22, 0.3)",
    padding: "1.5rem 2rem",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  bottomContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    textAlign: "center",
  },
  copyright: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.9rem",
    color: "#94a3b8",
  },
  madeWith: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#64748b",
    fontStyle: "italic",
  },
};

export default Footer;
