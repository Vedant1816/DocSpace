import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { Avatar, Badge, Button, EmptyState, Field, Icon, Modal, SkeletonCard, statusTone, useToast } from "../ui";

// Date Input Modal Component
function DateInputModal({ isOpen, onClose, onConfirm, userName }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) setDate(new Date().toISOString().split("T")[0]);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!date) {
      toast.warning("Please select a date");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(date);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to approve resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Approve resume"
      subtitle={`Select the start date for ${userName}`}
      icon="event"
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!date}>
            {loading ? "Approving…" : "Approve"}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5">
        <Field label="Start date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
      </div>
    </Modal>
  );
}

export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isHospital, setIsHospital] = useState(false);
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if current user is a hospital
    if (user && user.role === "hospital") {
      setIsHospital(true);
      setCurrentUser(user);
    }
    
    fetch(`${API_BASE_URL}/profile/resume/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load resume");
        }
        return data;
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Resume fetch error:", err.message);
        setError(err.message || "Failed to load resume");
        setLoading(false);
      });
  }, [id]);

  const handleApprove = async (startDate) => {
    const token = localStorage.getItem("token");
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/resume/approve/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start_date: startDate }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to approve resume");
      }

      toast.success(`Resume approved. Start date: ${result.start_date}`);
      setShowDateModal(false);
      // Refresh data to show updated status
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Failed to approve resume");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    // Confirmation is the caller's job (no UI calls this today).

    const token = localStorage.getItem("token");
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/resume/reject/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to reject resume");
      }

      toast.info("Resume rejected");
      // Refresh data to show updated status
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Failed to reject resume");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonCard lines={8} />
          </div>
          <SkeletonCard lines={4} />
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState
            icon="error"
            title="Couldn't load this resume"
            description={error}
            action={
              <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>
                Go back
              </Button>
            }
          />
        </div>
      </Shell>
    );
  }

  const status = data.verification_status || "pending";
  const verified = status === "verified" || status === "approved";
  const statusLabel = status === "not_submitted" ? "Not submitted" : status;

  return (
    <Shell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="ds-label mb-6 inline-flex min-h-10 items-center gap-1.5 transition-colors duration-150 hover:!text-gray-900"
      >
        <Icon name="arrow_back" className="text-[16px]" /> Back
      </button>

      {/* Header */}
      <div className="mb-8 flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={data.name} size={72} />
        <div className="min-w-0 flex-1">
          <p className="ds-eyebrow mb-2">Medical resume</p>
          <h1 className="ds-display break-words text-[30px] sm:text-[42px]">{data.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="ds-label">
              {data.designation || "Doctor"} · {data.specialization || "Medical"}
            </span>
            <Badge tone={statusTone(status)} icon={verified ? "verified" : undefined}>
              {statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Left Column - Resume Details */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Section n="01" title="Personal">
            <Grid>
              <Detail label="Name" value={data.name} />
              <Detail label="Email" value={data.email} />
              <Detail label="Phone" value={data.phone} />
              <Detail label="Role" value={data.role} />
            </Grid>
          </Section>

          <Section n="02" title="Professional">
            <Grid>
              <Detail label="Designation" value={data.designation} />
              <Detail label="Specialization" value={data.specialization} />
              <Detail label="Hospital affiliation" value={data.hospital_affiliation} />
              <Detail label="Experience" value={data.years_of_experience ? `${data.years_of_experience} years` : null} />
              <Detail label="Year of graduation" value={data.year_of_graduation} />
              {(data.registration_number || data.registration_council) && (
                <>
                  <Detail label="Registration no." value={data.registration_number} />
                  <Detail label="Registration council" value={data.registration_council} />
                </>
              )}
            </Grid>
          </Section>

          {(data.qualifications || data.skills) && (
            <Section n="03" title="Background">
              <div className="grid gap-px bg-[var(--color-line-soft)] sm:grid-cols-2">
                <Tags label="Qualifications" items={data.qualifications} />
                <Tags label="Skills" items={data.skills} />
              </div>
            </Section>
          )}

          {data.bio && (
            <Section n="04" title="About">
              <p className="whitespace-pre-line break-words p-6 leading-relaxed text-gray-700">{data.bio}</p>
            </Section>
          )}
        </div>

        {/* Right Column - Documents */}
        <aside className="min-w-0 space-y-6">
          <Section n="—" title="Documents">
            <div className="space-y-5 p-5">
              <DocFrame label="Medical license" icon="description" url={data.license_doc_url} verified={verified} />
              <DocFrame label="ID document" icon="badge" url={data.id_doc_url} verified={verified} />
            </div>
          </Section>
        </aside>
      </div>

      {/* Date Input Modal */}
      <DateInputModal isOpen={showDateModal} onClose={() => setShowDateModal(false)} onConfirm={handleApprove} userName={data?.name || "User"} />
    </Shell>
  );
}

/* ================= UI HELPERS ================= */

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-6xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="ds-card overflow-hidden">
      <h2 className="ds-label border-b border-gray-200 px-6 py-3.5">
        <b className="font-medium text-coral-600">{n}</b> — {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <dl className="grid gap-px bg-[var(--color-line-soft)] sm:grid-cols-2">{children}</dl>;
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 bg-white px-6 py-4">
      <dt className="ds-label">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{value || "—"}</dd>
    </div>
  );
}

function Tags({ label, items }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return (
    <div className="bg-white px-6 py-4">
      <p className="ds-label mb-2">{label}</p>
      {list.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {list.map((t, i) => (
            <li key={i} className="rounded-[4px] border border-gray-200 px-2 py-1 text-sm text-gray-800">
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">—</p>
      )}
    </div>
  );
}

function DocFrame({ label, icon, url, verified }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <Icon name={icon} className="text-[18px] text-gray-400" /> {label}
        </h3>
        {url && verified && (
          <Badge tone="info" icon="verified">
            NMC
          </Badge>
        )}
      </div>
      {url ? (
        <>
          <div className="overflow-hidden rounded-[6px] border border-gray-200">
            <iframe src={url} className="h-72 w-full sm:h-80" title={label} />
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-coral-700 hover:text-coral-800">
            Open in new tab <Icon name="open_in_new" className="text-[14px]" />
          </a>
        </>
      ) : (
        <p className="rounded-[6px] border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">No document available</p>
      )}
    </div>
  );
}
