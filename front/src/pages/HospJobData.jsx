import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import { Avatar, Badge, Button, EmptyState, Field, Icon, Modal, Skeleton, SkeletonCard, TextArea, statusTone, useToast } from "../ui";

export default function HospJobData() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const isAdmin = userRole === "admin";

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);

  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [canViewApplicants, setCanViewApplicants] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { kind: "reject", id } | { kind: "delete" }
  const toast = useToast();

  /* ================= FETCH JOB ================= */
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch job");

        setJob(data.job);
        setForm(data.job);

        // Check if user can edit/view applicants
        // Admin can always view and edit
        if (isAdmin) {
          setCanEdit(true);
          setCanViewApplicants(true);
        } else if (userRole === "hospital") {
          setCanViewApplicants(true); 
          setCanEdit(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, token, userRole, isAdmin, navigate]);

  /* ================= FETCH APPLICANTS ================= */
  useEffect(() => {
    // Only fetch applicants if user is hospital or admin
    if (userRole !== "hospital" && !isAdmin) {
      setLoadingApplicants(false);
      setCanViewApplicants(false);
      return;
    }

    const fetchApplicants = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs/${jobId}/applicants`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        const data = await res.json();
        if (!res.ok) {
          // If unauthorized (403), user can't view applicants
          if (res.status === 403) {
            setCanViewApplicants(false);
            setCanEdit(false);
            setLoadingApplicants(false);
            return;
          }
          throw new Error(data.message);
        }

        setApplicants(data.applicants || []);
        setCanViewApplicants(true);
      } catch (err) {
        console.error("Applicants fetch error:", err.message);
        // If error is not 403, still allow viewing (might be network error)
        if (err.message.includes("Unauthorized") || err.message.includes("403")) {
          setCanViewApplicants(false);
          setCanEdit(false);
        }
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [jobId, token, userRole, isAdmin, navigate]);

  /* ================= UPDATE JOB ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Backend will verify if user can edit
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          min_salary: Number(form.min_salary),
          max_salary: Number(form.max_salary),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If unauthorized, disable edit
        if (res.status === 403) {
          setCanEdit(false);
        }
        throw new Error(data.message);
      }

      setJob(data.job);
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ================= APPROVE APPLICATION ================= */
  const handleApprove = async (applicationId, interviewDate) => {
    if (!interviewDate) {
      toast.warning("Please select an interview date");
      return;
    }

    setProcessingAction(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/application/approve/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interview_date: interviewDate }),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve application");
      }

      // Refresh applicants list
      const applicantsRes = await fetch(`${API_BASE_URL}/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const applicantsData = await applicantsRes.json();
      if (applicantsRes.ok) {
        setApplicants(applicantsData.applicants || []);
      }

      toast.success(`Application approved. Interview date: ${data.interview_date}`);
      setShowDateModal(false);
      setSelectedApplicationId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ================= REJECT APPLICATION ================= */
  const handleReject = async (applicationId) => {
    setConfirmAction(null);

    setProcessingAction(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/application/reject/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject application");
      }

      // Refresh applicants list
      const applicantsRes = await fetch(`${API_BASE_URL}/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const applicantsData = await applicantsRes.json();
      if (applicantsRes.ok) {
        setApplicants(applicantsData.applicants || []);
      }

      toast.info("Application rejected");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ================= DELETE JOB ================= */
  const handleDelete = async () => {
    setConfirmAction(null);

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete job");
      }

      toast.success("Job deleted");
      navigate("/posted-jobs");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <Shell>
        <div className="mb-8 space-y-3" aria-busy="true" aria-label="Loading job">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-2/3" />
        </div>
        <SkeletonCard lines={5} />
      </Shell>
    );
  }

  if (error || !job) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState
            icon={error ? "error" : "search_off"}
            title={error ? "Couldn't load this job" : "Job not found"}
            description={error || "It may have been deleted."}
            action={
              <Button to="/posted-jobs" variant="secondary" icon="arrow_back">
                Jobs posted
              </Button>
            }
          />
        </div>
      </Shell>
    );
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const salary = job.min_salary && job.max_salary ? `₹${job.min_salary.toLocaleString()} – ₹${job.max_salary.toLocaleString()}` : null;
  const statusOf = (a) => a.verification_status || a.users?.verification_status || "pending";
  const counts = applicants.reduce((acc, a) => ({ ...acc, [statusOf(a)]: (acc[statusOf(a)] || 0) + 1 }), {});

  return (
    <Shell>
      <button
        type="button"
        onClick={() => navigate(isAdmin ? -1 : "/posted-jobs")}
        className="ds-label mb-6 inline-flex min-h-10 items-center gap-1.5 transition-colors duration-150 hover:!text-gray-900"
      >
        <Icon name="arrow_back" className="text-[16px]" /> {isAdmin ? "Back" : "Jobs posted"}
      </button>

      {/* ================= HEADER ================= */}
      <div className="mb-8 flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ds-eyebrow mb-3">{editing ? "Editing" : isAdmin ? "Job · admin view" : "Job"}</p>
          <h1 className="ds-display break-words text-[32px] sm:text-[44px]">{editing ? "Edit job" : job.title}</h1>
        </div>
        {!editing && canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button icon="edit" onClick={() => setEditing(true)}>
              Edit job
            </Button>
            <Button variant="outline" icon="delete" loading={deleting} onClick={() => setConfirmAction({ kind: "delete" })} className="text-coral-700">
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {/* ================= VIEW MODE ================= */}
      {!editing && (
        <div className="space-y-6">
          <dl className="ds-hairline grid-cols-2 overflow-hidden rounded-[var(--radius-card)] md:grid-cols-4">
            <Detail label="Department" value={job.department} />
            <Detail label="Job type" value={job.job_type} />
            <Detail label="Experience" value={job.experience_required} />
            <Detail label="Salary" value={salary} />
          </dl>
          <section className="ds-card p-6 sm:p-8">
            <h2 className="ds-label mb-4 !text-gray-900">Job description</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{job.description || "—"}</p>
          </section>
        </div>
      )}

      {/* ================= EDIT MODE ================= */}
      {editing && (
        <form onSubmit={handleUpdate} className="ds-card overflow-hidden">
          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <Field label="Job title" value={form.title ?? ""} onChange={set("title")} />
            <Field label="Department" value={form.department ?? ""} onChange={set("department")} />
            <Field label="Job type" value={form.job_type ?? ""} onChange={set("job_type")} />
            <Field label="Experience required" value={form.experience_required ?? ""} onChange={set("experience_required")} />
            <Field label="Minimum salary ₹" type="number" value={form.min_salary ?? ""} onChange={set("min_salary")} />
            <Field label="Maximum salary ₹" type="number" value={form.max_salary ?? ""} onChange={set("max_salary")} />
            <TextArea label="Job description" rows={6} value={form.description ?? ""} onChange={set("description")} className="md:col-span-2" />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setForm(job);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" icon="check">
              Save changes
            </Button>
          </div>
        </form>
      )}

      {/* ================= APPLICANTS ================= */}
      {(userRole === "hospital" || isAdmin) && canViewApplicants && (
        <section className="mt-12">
          <div className="ds-sec-head !mb-5">
            <span className="ds-label">
              <b>01</b> — Applicants{isAdmin && " · admin view"}
            </span>
            <span className="ds-rule" />
            <span className="ds-label">
              {applicants.length} total
              {applicants.length > 0 && ` · ${counts.pending || 0} pending`}
            </span>
          </div>

          <div className="ds-card overflow-hidden">
            {loadingApplicants ? (
              <ul className="divide-y divide-gray-200" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : applicants.length === 0 ? (
              <EmptyState icon="group" title="No applications yet" description="Applications from verified doctors will appear here." />
            ) : (
              <ul className="divide-y divide-gray-200">
                {applicants.map((a) => {
                  const status = statusOf(a);
                  const isProcessing = processingAction === a.id;
                  return (
                    <li key={a.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                      <Link to={`/profile/${a.users.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                        <Avatar name={a.users?.name || "?"} size={44} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{a.users?.name || "Unknown"}</span>
                            <Badge tone={statusTone(status)}>{status}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-gray-600">
                            {a.users?.designation || "—"}
                            {a.users?.specialization ? ` · ${a.users.specialization}` : ""}
                          </p>
                          <p className="mt-1 flex flex-wrap gap-x-4 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                            <span>Applied {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—"}</span>
                            {a.interview_date && status === "approved" && (
                              <span className="text-emerald-700">Interview {new Date(a.interview_date).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </Link>
                      <div className="flex flex-wrap gap-2 lg:shrink-0">
                        <Button variant="outline" size="sm" icon="description" onClick={() => navigate(`/resume/${a.users.id}`)}>
                          Resume
                        </Button>
                        {status !== "approved" && (
                          <Button
                            variant="success"
                            size="sm"
                            icon="check_circle"
                            loading={isProcessing}
                            disabled={status === "rejected"}
                            onClick={() => {
                              setSelectedApplicationId(a.id);
                              setShowDateModal(true);
                            }}
                          >
                            Approve
                          </Button>
                        )}
                        {status !== "rejected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="cancel"
                            className="text-coral-700"
                            disabled={isProcessing || status === "approved"}
                            onClick={() => setConfirmAction({ kind: "reject", id: a.id })}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Date Input Modal for Approve */}
      <DateInputModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setSelectedApplicationId(null);
        }}
        onConfirm={(date) => {
          if (selectedApplicationId) {
            return handleApprove(selectedApplicationId, date);
          }
        }}
        applicantName={applicants.find((a) => a.id === selectedApplicationId)?.users?.name || "Applicant"}
      />

      {/* Reject / delete confirmation */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.kind === "delete" ? "Delete this job?" : "Reject this application?"}
        icon={confirmAction?.kind === "delete" ? "delete" : "cancel"}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => (confirmAction?.kind === "delete" ? handleDelete() : handleReject(confirmAction.id))}
            >
              {confirmAction?.kind === "delete" ? "Delete job" : "Reject"}
            </Button>
          </div>
        }
      >
        <p className="px-6 py-5 text-sm text-gray-700">
          {confirmAction?.kind === "delete"
            ? `“${job.title}” and its applications will be removed. This can’t be undone.`
            : "The applicant will be notified that their application was rejected."}
        </p>
      </Modal>
    </Shell>
  );
}

/* ================= DATE INPUT MODAL ================= */
function DateInputModal({ isOpen, onClose, onConfirm, applicantName }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) setDate(new Date().toISOString().split("T")[0]);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!date) {
      toast.warning("Please select an interview date");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(date);
    } catch (err) {
      toast.error(err.message || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Approve application"
      subtitle={`Pick an interview date for ${applicantName}`}
      icon="event"
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" icon="check" onClick={handleConfirm} loading={loading} disabled={!date}>
            {loading ? "Approving…" : "Approve"}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5">
        <Field label="Interview date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
      </div>
    </Modal>
  );
}

/* ================= HELPERS ================= */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-5xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 p-5">
      <dt className="ds-label">{label}</dt>
      <dd className="mt-1.5 break-words font-medium capitalize text-gray-900">{value || "—"}</dd>
    </div>
  );
}
