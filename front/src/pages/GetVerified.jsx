import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import { Badge, Button, Field, Icon, PageHeader, SkeletonCard, statusTone, useToast } from "../ui";

export default function GetVerified() {
  const navigate = useNavigate();
  const [licensePdf, setLicensePdf] = useState(null);
  const [idPdf, setIdPdf] = useState(null);
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const toast = useToast();

  /* =========================
     CHECK PROFILE COMPLETION & VERIFICATION STATUS
     ========================= */
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        // If profile is not completed, redirect to resume page
        if (!data.profile_completed) {
          navigate("/resume", { replace: true });
          return;
        }

        // Store verification status and data
        const status = data.verification_status || null;
        setVerificationStatus(status);
        setVerificationData(data);
        setRegistrationCouncil(data.registration_council || "");

        // Profile is completed, allow access
        setCheckingProfile(false);
      } catch (err) {
        console.error("[GetVerified] Error checking profile:", err);
        // On error, redirect to resume to be safe
        navigate("/resume", { replace: true });
      }
    };

    checkProfile();
  }, [navigate]);

  /* =========================
     UPLOAD FILES
     ========================= */
  const uploadFiles = async () => {
    const formData = new FormData();
    formData.append("license", licensePdf);
    formData.append("id", idPdf);

    const res = await fetch(`${API_BASE_URL}/verification/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data;
  };

  /* =========================
     SUBMIT VERIFICATION
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const upload = await uploadFiles();

      const res = await fetch(`${API_BASE_URL}/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...upload,
          registration_council: registrationCouncil,
        }),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      toast.success("Documents submitted for verification");
      // Update state immediately
      setVerificationStatus("pending");
      setVerificationData((prev) => ({
        ...prev,
        license_doc_url: upload.license_doc_url,
        id_doc_url: upload.id_doc_url,
        registration_council: registrationCouncil,
        verification_status: "pending",
      }));
      
      // Refresh verification status from server
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setVerificationStatus(refreshData.verification_status || "pending");
          setVerificationData(refreshData);
        }
      } catch (refreshErr) {
        console.error("[GetVerified] Error refreshing status:", refreshErr);
        // Don't show error to user, state is already updated
      }
    } catch (err) {
      console.error("[GetVerified] Submission error:", err);
      const errorMessage = err.message || "Failed to submit verification. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking profile completion
  if (checkingProfile) {
    return (
      <Shell>
        <p className="ds-label mb-4">Checking profile completion…</p>
        <SkeletonCard lines={4} />
      </Shell>
    );
  }

  // Form shows only if status is null/not_submitted/not_started/rejected (resubmission allowed when rejected)
  const showForm = !verificationStatus || verificationStatus === "not_submitted" || verificationStatus === "not_started" || verificationStatus === "rejected";

  const statusText = { pending: "Under process", approved: "Verified", rejected: "Rejected" }[verificationStatus] || "Not submitted";

  return (
    <Shell>
      <PageHeader
        eyebrow="Trust"
        title="Get verified"
        description={showForm ? "Upload your documents to verify your medical credentials." : "Your verification status."}
        actions={
          <Badge tone={verificationStatus ? statusTone(verificationStatus) : "neutral"} icon={verificationStatus === "approved" ? "verified" : undefined}>
            {statusText}
          </Badge>
        }
      />

      {/* steps */}
      <ol className="ds-hairline mb-6 grid-cols-3 overflow-hidden rounded-[var(--radius-card)]">
        {[
          ["01", "Resume", true],
          ["02", "Documents", !showForm],
          ["03", "Approved", verificationStatus === "approved"],
        ].map(([n, t, done]) => (
          <li key={n} className="flex items-center gap-2 px-4 py-3">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] ${done ? "bg-emerald-600 text-white" : "border border-gray-300 text-gray-500"}`}>
              {done ? <Icon name="check" className="text-[14px]" /> : n}
            </span>
            <span className="ds-label truncate !text-gray-800">{t}</span>
          </li>
        ))}
      </ol>

      {showForm ? (
        <form onSubmit={handleSubmit} className="ds-card overflow-hidden">
          {verificationStatus === "rejected" && (
            <div className="border-b border-coral-200 bg-coral-50 px-6 py-4 text-sm text-coral-800">
              <p className="flex items-center gap-2 font-semibold">
                <Icon name="cancel" className="text-[18px]" /> Verification rejected
              </p>
              <p className="mt-1">Your previous request was rejected. Please review and resubmit your documents below.</p>
            </div>
          )}
          <div className="space-y-5 p-6">
            <FilePick label="Medical license (PDF)" file={licensePdf} onChange={setLicensePdf} />
            <FilePick label="ID proof (PDF)" file={idPdf} onChange={setIdPdf} />
            <Field
              label="Registration council"
              placeholder="e.g. Medical Council of India"
              required
              value={registrationCouncil}
              onChange={(e) => setRegistrationCouncil(e.target.value)}
            />
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Button type="submit" size="lg" className="w-full" loading={loading} iconRight="arrow_forward">
              {loading ? "Submitting…" : verificationStatus === "rejected" ? "Resubmit for verification" : "Submit for verification"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="ds-card overflow-hidden">
          <dl className="divide-y divide-gray-200">
            <Doc label="Medical license" ok={!!verificationData?.license_doc_url} />
            <Doc label="ID proof" ok={!!verificationData?.id_doc_url} />
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="ds-label">Registration council</dt>
              <dd className="text-right text-sm font-medium text-gray-900">{verificationData?.registration_council || "Not provided"}</dd>
            </div>
          </dl>
          {verificationStatus === "pending" && (
            <p className="flex items-start gap-2 border-t border-gray-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
              <Icon name="hourglass_top" className="text-[18px]" />
              Your documents are being reviewed. You will be notified once verification is complete.
            </p>
          )}
          {verificationStatus === "approved" && (
            <p className="flex items-start gap-2 border-t border-gray-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800">
              <Icon name="verified" className="text-[18px]" />
              Your account has been verified successfully.
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-2xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function FilePick({ label, file, onChange }) {
  return (
    <label className="block">
      <span className="ds-label mb-1.5 block">{label}</span>
      <span className="group flex min-h-[64px] cursor-pointer items-center gap-4 rounded-[var(--radius-control)] border border-dashed border-gray-300 bg-white px-4 py-3 transition-colors duration-150 hover:border-gray-900 focus-within:border-primary">
        <Icon name={file ? "picture_as_pdf" : "upload_file"} className={`text-[24px] ${file ? "text-coral-600" : "text-gray-400"}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">{file ? file.name : "Choose a PDF"}</span>
          <span className="block text-xs text-gray-500">{file ? `${(file.size / 1024).toFixed(0)} KB` : "PDF only"}</span>
        </span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-coral-700">{file ? "Change" : "Browse"}</span>
        <input type="file" accept="application/pdf" required onChange={(e) => onChange(e.target.files[0])} className="sr-only" />
      </span>
    </label>
  );
}

function Doc({ label, ok }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <dt className="ds-label">{label}</dt>
      <dd className={`flex items-center gap-1.5 text-sm font-medium ${ok ? "text-emerald-700" : "text-gray-500"}`}>
        <Icon name={ok ? "check_circle" : "remove"} className="text-[18px]" />
        {ok ? "Uploaded" : "No document"}
      </dd>
    </div>
  );
}
