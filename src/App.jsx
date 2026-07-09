import React, { useState, useEffect } from "react";
import {
  FiPhone,
  FiCopy,
  FiTrash2,
  FiRefreshCw,
  FiEyeOff,
  FiCheckSquare,
  FiSquare,
  FiAlertTriangle,
  FiBell,
} from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const theme = {
  bgMain: "#f7f8fb",
  bgSecondary: "#ffffff",
  surface: "#eef1f6",
  brandDark: "#0b0b0f",
  brandDarker: "#07070a",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  accentPrimary: "#ffb000",
  accentSecondary: "#ff7a18",
};

// Helper utility converting standard VAPID string block payload to raw Uint8 buffer maps
const urlB64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("unseen");

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    isUpdate: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    leadId: null,
  });

  const [attemptedIds, setAttemptedIds] = useState(() => {
    const saved = localStorage.getItem("solar_attempted_ids");
    return saved ? JSON.parse(saved) : [];
  });

  // --- DEVICE SYSTEM PUSH HANDSHAKE REGISTRATION ---
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = theme.bgMain;

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          console.log(
            "Service Worker active on scope context routing:",
            registration.scope,
          );

          const permissionStatus = await Notification.requestPermission();
          if (permissionStatus === "granted") {
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            try {
              let subscription =
                await registration.pushManager.getSubscription();

              // Register new subscription parameters if empty reference mapping found
              if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlB64ToUint8Array(publicVapidKey),
                });
              }

              // Send the PWA device mapping straight to persistent relational engine structures
              await fetch(`${API_BASE_URL}/api/register-device`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription }),
              });
            } catch (subscriptionError) {
              console.error(
                "VAPID device binding negotiation failure:",
                subscriptionError,
              );
            }
          }
        })
        .catch((err) =>
          console.error("Service worker mapping integration drop error:", err),
        );
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // --- REAL-TIME STREAMING BROADCAST INTERFACE HANDLER ---
  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/admin/leads/stream`,
      {
        withCredentials: true,
      },
    );

    eventSource.onmessage = (event) => {
      const freshLead = JSON.parse(event.data);

      setLeads((prevLeads) => {
        if (prevLeads.some((lead) => lead.id === freshLead.id))
          return prevLeads;
        return [freshLead, ...prevLeads];
      });

      setToast({
        visible: true,
        message: `🚨 New Entry: ${freshLead.name} submitted!`,
        isUpdate: true,
      });

      setTimeout(() => {
        setToast({ visible: false, message: "", isUpdate: false });
      }, 4000);
    };

    eventSource.onerror = () => {
      console.warn(
        "SSE interface socket dropped. Disconnecting reference node layer safely.",
      );
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/leads`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error("Could not fetch updated system matrix indexes.");
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const toggleLeadStatus = (id) => {
    const updated = attemptedIds.includes(id)
      ? attemptedIds.filter((itemId) => itemId !== id)
      : [...attemptedIds, id];
    setAttemptedIds(updated);
    localStorage.setItem("solar_attempted_ids", JSON.stringify(updated));
  };

  const copyToClipboard = (phone) => {
    navigator.clipboard.writeText(phone);
    setToast({ visible: true, message: `Copied ${phone}!`, isUpdate: false });
    setTimeout(() => {
      setToast({ visible: false, message: "", isUpdate: false });
    }, 3000);
  };

  const requestDelete = (id) => {
    setDeleteModal({ visible: true, leadId: id });
  };

  const confirmDelete = async () => {
    const id = deleteModal.leadId;
    setDeleteModal({ visible: false, leadId: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/leads/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error("Server declined entry isolation drop mapping logic.");

      setLeads(leads.filter((lead) => lead.id !== id));
      const updatedAttempted = attemptedIds.filter((itemId) => itemId !== id);
      setAttemptedIds(updatedAttempted);
      localStorage.setItem(
        "solar_attempted_ids",
        JSON.stringify(updatedAttempted),
      );
    } catch (err) {
      alert(`Error context sequence failure: ${err.message}`);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const dateObj = new Date(isoString);
    const dateStr = dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = dateObj.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} • ${timeStr}`;
  };

  const filteredLeads = leads.filter((lead) => {
    const isAttempted = attemptedIds.includes(lead.id);
    return activeTab === "attempted" ? isAttempted : !isAttempted;
  });

  return (
    <div style={styles.phoneContainer}>
      {error && <div style={styles.errorBanner}>{error}</div>}

      <main style={styles.scrollContainer}>
        {loading ? (
          <p style={styles.centerText}>Loading fresh records...</p>
        ) : filteredLeads.length === 0 ? (
          <p style={styles.centerText}>No items found in {activeTab} status.</p>
        ) : (
          filteredLeads.map((lead) => {
            const isCurrentlyAttempted = attemptedIds.includes(lead.id);
            return (
              <div key={lead.id} style={styles.leadCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.identityBlock}>
                    <h3 style={styles.leadName}>{lead.name}</h3>
                    <span style={styles.timeValue}>
                      {formatDateTime(lead.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleLeadStatus(lead.id)}
                    style={styles.statusToggleBtn}
                  >
                    {isCurrentlyAttempted ? (
                      <FiCheckSquare size={20} color={theme.accentSecondary} />
                    ) : (
                      <FiSquare size={20} color={theme.textSecondary} />
                    )}
                  </button>
                </div>

                <div style={styles.metricsGrid}>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Monthly Bill</span>
                    <span style={styles.metricValue}>₹{lead.monthly_bill}</span>
                  </div>
                </div>

                <div style={styles.actionRow}>
                  <a
                    href={`tel:${lead.phone}`}
                    style={{ ...styles.actionButton, ...styles.callBtn }}
                  >
                    <FiPhone size={14} style={styles.iconSpacing} /> Call
                  </a>
                  <button
                    onClick={() => copyToClipboard(lead.phone)}
                    style={{ ...styles.actionButton, ...styles.copyBtn }}
                  >
                    <FiCopy size={14} style={styles.iconSpacing} /> Copy
                  </button>
                  <button
                    onClick={() => requestDelete(lead.id)}
                    style={{ ...styles.actionButton, ...styles.deleteBtn }}
                  >
                    <FiTrash2 size={14} style={styles.iconSpacing} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Slide-out Visual Banner Notification */}
      <div
        style={{
          ...styles.toastContainer,
          backgroundColor: toast.isUpdate
            ? theme.accentSecondary
            : theme.brandDark,
          transform: toast.visible ? "translateX(0)" : "translateX(150%)",
          opacity: toast.visible ? 1 : 0,
        }}
      >
        {toast.isUpdate ? (
          <FiBell size={14} style={styles.iconSpacing} />
        ) : (
          <FiCopy size={14} style={styles.iconSpacing} />
        )}
        <span>{toast.message}</span>
      </div>

      {/* Action Overlay Confirmation Container Block */}
      {deleteModal.visible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIconContainer}>
              <FiAlertTriangle size={24} color="#cf222e" />
            </div>
            <h4 style={styles.modalTitle}>Delete Lead?</h4>
            <p style={styles.modalBody}>
              Are you sure you want to completely remove this registration?
            </p>
            <div style={styles.modalActionRow}>
              <button
                onClick={() => setDeleteModal({ visible: false, leadId: null })}
                style={{ ...styles.modalBtn, ...styles.modalCancelBtn }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ ...styles.modalBtn, ...styles.modalConfirmBtn }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footerBar}>
        <button
          onClick={() => setActiveTab("unseen")}
          style={{
            ...styles.navButton,
            backgroundColor:
              activeTab === "unseen" ? theme.brandDark : "transparent",
            color:
              activeTab === "unseen"
                ? theme.accentPrimary
                : theme.textSecondary,
          }}
        >
          <FiEyeOff size={15} style={styles.iconSpacing} />
          Unseen ({leads.filter((l) => !attemptedIds.includes(l.id)).length})
        </button>

        <button
          onClick={fetchLeads}
          style={{ ...styles.navButton, ...styles.reloadButton }}
        >
          <FiRefreshCw size={15} style={styles.iconSpacing} /> Reload
        </button>

        <button
          onClick={() => setActiveTab("attempted")}
          style={{
            ...styles.navButton,
            backgroundColor:
              activeTab === "attempted" ? theme.brandDark : "transparent",
            color:
              activeTab === "attempted"
                ? theme.accentPrimary
                : theme.textSecondary,
          }}
        >
          <FiCheckSquare size={15} style={styles.iconSpacing} />
          Attempted ({leads.filter((l) => attemptedIds.includes(l.id)).length})
        </button>
      </footer>
    </div>
  );
}

const styles = {
  phoneContainer: {
    maxWidth: "430px",
    margin: "0 auto",
    backgroundColor: theme.bgMain,
    height: "100dvh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 0 20px rgba(0,0,0,0.05)",
    position: "relative",
    overflow: "hidden",
  },
  scrollContainer: {
    padding: "16px",
    flex: 1,
    overflowY: "auto",
    paddingBottom: "16px",
  },
  leadCard: {
    backgroundColor: theme.bgSecondary,
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "12px",
    border: `1px solid ${theme.surface}`,
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  identityBlock: { display: "flex", flexDirection: "column", gap: "2px" },
  statusToggleBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  leadName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: theme.textPrimary,
  },
  timeValue: {
    fontSize: "12px",
    fontWeight: "400",
    color: theme.textSecondary,
  },
  metricsGrid: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: "12px",
    borderBottom: `1px dashed ${theme.surface}`,
    marginBottom: "12px",
  },
  metricItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: "13px",
    color: theme.textSecondary,
    fontWeight: "500",
  },
  metricValue: { fontSize: "16px", fontWeight: "700", color: theme.brandDark },
  actionRow: { display: "flex", gap: "8px" },
  actionButton: {
    flex: 1,
    padding: "8px 0",
    borderRadius: "6px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: { backgroundColor: theme.surface, color: theme.textPrimary },
  copyBtn: { backgroundColor: theme.surface, color: theme.textPrimary },
  deleteBtn: { backgroundColor: "#ffebe9", color: "#cf222e" },
  errorBanner: {
    backgroundColor: "#ffebe9",
    color: "#cf222e",
    padding: "10px",
    textAlign: "center",
    fontSize: "14px",
  },
  centerText: {
    textAlign: "center",
    color: theme.textSecondary,
    marginTop: "60px",
  },
  iconSpacing: { marginRight: "6px" },
  toastContainer: {
    position: "absolute",
    bottom: "66px",
    right: "16px",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition:
      "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out",
    zIndex: 100,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 200,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "320px",
    padding: "20px",
    textAlign: "center",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  },
  modalIconContainer: {
    width: "48px",
    height: "48px",
    backgroundColor: "#ffebe9",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px auto",
  },
  modalTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: theme.textPrimary,
  },
  modalBody: {
    margin: "0 0 20px 0",
    fontSize: "13px",
    color: theme.textSecondary,
    lineHeight: "1.5",
  },
  modalActionRow: { display: "flex", gap: "10px" },
  modalBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalCancelBtn: { backgroundColor: theme.surface, color: theme.textPrimary },
  modalConfirmBtn: { backgroundColor: "#cf222e", color: "#ffffff" },
  footerBar: {
    height: "52px",
    backgroundColor: theme.bgSecondary,
    borderTop: `1px solid ${theme.surface}`,
    display: "flex",
    padding: "6px 8px",
    gap: "6px",
    zIndex: 20,
    flexShrink: 0,
  },
  navButton: {
    flex: 1,
    border: `1px solid ${theme.surface}`,
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  reloadButton: {
    backgroundColor: theme.accentPrimary,
    color: theme.brandDarker,
    border: "none",
  },
};
