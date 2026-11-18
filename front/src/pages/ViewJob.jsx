import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import { Badge, Button, EmptyState, Icon, Skeleton, useToast } from "../ui";

export default function ViewJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const toast = useToast();

  // Check if user is verified
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingProfile(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/get-status/doctor`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.status === "approved" || false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`,{
          headers: {Authorization : `Bearer ${token}`},
        });
          if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
        }
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch job");
        }

        setJob(data.job);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, navigate]);

  /* =========================
     APPLY HANDLER
     ========================= */
  const handleApply = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.info("Please log in to apply for this job");
      return;
    }

    // Check if profile is completed
    if (!isVerified) {
      toast.warning("You need to be verified before applying for a job");
      return;
    }

    try {
      setApplying(true);

      const res = await fetch(
        `${API_BASE_URL}/applications/apply/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to apply");
        return;
      }

      toast.success("Applied successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  /* =========================
     UI STATES
     ========================= */
  if (loading) {
    return (
      <Shell>
        <div className="space-y-4" aria-busy="true" aria-label="Loading job">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <div className="ds-card mt-8 grid gap-px sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
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
            description={error || "It may have been removed by the hospital."}
            action={
              <Button to="/search/jobs" variant="secondary" icon="arrow_back">
                All jobs
              </Button>
            }
          />
        </div>
      </Shell>
    );
  }

  const location = job.hospital?.city ? `${job.hospital.city}${job.hospital.state ? `, ${job.hospital.state}` : ""}` : null;
  const salary = job.min_salary && job.max_salary ? `₹${job.min_salary.toLocaleString()} – ₹${job.max_salary.toLocaleString()}` : null;

  /* =========================
     RENDER
     ========================= */
  return (
    <Shell>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="ds-label mb-6 inline-flex min-h-10 items-center gap-1.5 transition-colors duration-150 hover:!text-gray-900"
      >
        <Icon name="arrow_back" className="text-[16px]" /> Back
      </button>

      <div className="mb-8 flex animate-fade-up flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="ds-eyebrow mb-3">{job.hospital?.name || "Job opening"}</p>
          <h1 className="ds-display text-[32px] sm:text-[48px]">{job.title}</h1>
          <p className="ds-label mt-3">
            Posted {new Date(job.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <dl className="ds-hairline grid-cols-2 sm:grid-cols-3 overflow-hidden rounded-[var(--radius-card)]">
            <Detail label="Department" value={job.department} />
            <Detail label="Job type" value={job.job_type} capitalize />
            <Detail label="Experience" value={job.experience_required} />
            <Detail label="Salary" value={salary} />
            <Detail label="Hospital" value={job.hospital?.name} />
            <Detail label="Location" value={location} />
          </dl>

          <section className="ds-card p-6 sm:p-8">
            <h2 className="ds-label mb-4 !text-gray-900">Job description</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{job.description || "—"}</p>
          </section>
        </div>

        {/* APPLY */}
        <aside className="ds-card p-6 lg:sticky lg:top-24">
          <p className="ds-label">Apply</p>
          <p className="mt-2 font-display text-xl font-medium text-gray-900">{job.title}</p>
          {salary && <p className="mt-1 text-sm text-gray-600">{salary}</p>}

          {!checkingProfile && !isVerified && (
            <div className="mt-5 border-l-2 border-amber-400 bg-amber-50 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Icon name="warning" className="text-[18px]" /> Not verified
              </p>
              <p className="mt-1 text-sm text-amber-900/80">You need to be verified before applying for a job.</p>
              <Link to="/get-verified" className="mt-2 inline-flex min-h-10 items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-coral-700 hover:text-coral-800">
                Get verified <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
          )}
          {!checkingProfile && isVerified && (
            <p className="mt-4">
              <Badge tone="success" icon="verified">
                Verified profile
              </Badge>
            </p>
          )}

          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleApply}
            loading={applying || checkingProfile}
            disabled={!isVerified}
            iconRight={isVerified ? "arrow_forward" : undefined}
          >
            {checkingProfile ? "Checking…" : applying ? "Applying…" : !isVerified ? "Get verified to apply" : "Apply now"}
          </Button>
        </aside>
      </div>
    </Shell>
  );
}

/* =========================
   HELPER COMPONENTS
   ========================= */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-6xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Detail({ label, value, capitalize }) {
  return (
    <div className="min-w-0 p-5">
      <dt className="ds-label">{label}</dt>
      <dd className={`mt-1.5 break-words font-medium text-gray-900 ${capitalize ? "capitalize" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
