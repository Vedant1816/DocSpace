import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import { Avatar, Badge, Button, Field, Icon, PageHeader, SelectField, Skeleton, TextArea } from "../ui";

export default function PostJob() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    department: "",
    job_type: "",
    experience_required: "",
    min_salary: "",
    max_salary: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [hospitalData, setHospitalData] = useState(null);

  // Fetch hospital data and check verification status
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!token) {
        setCheckingVerification(false);
        return;
      }

      try {
        // Fetch hospital information
        const hospitalRes = await fetch(`${API_BASE_URL}/hospital/fetch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hospitalRes.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        if (hospitalRes.ok) {
          const hospitalInfo = await hospitalRes.json();
          setHospitalData(hospitalInfo);
        }

        // Check verification status
        const statusRes = await fetch(`${API_BASE_URL}/hospital/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVerificationStatus(statusData.verification_status);
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
      } finally {
        setCheckingVerification(false);
      }
    };

    fetchHospitalData();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check if hospital is verified (accept both "verified" and "approved")
    const isVerified = verificationStatus === "verified" || verificationStatus === "approved";
    if (!isVerified) {
      setError("Your hospital must be verified before posting jobs. Please complete verification first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
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
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to post job");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isVerified = verificationStatus === "verified" || verificationStatus === "approved";
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-5xl py-10 sm:py-14">
        <PageHeader eyebrow="Hiring" title="Post a job" description="Create a clear posting to attract verified medical talent." />

        {/* POSTING AS + VERIFICATION */}
        <div className="ds-card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          {checkingVerification ? (
            <div className="flex flex-1 items-center gap-3" aria-busy="true">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={hospitalData?.hospital_name || "Hospital"} size={44} />
                <div className="min-w-0">
                  <p className="ds-label">Posting as</p>
                  <p className="truncate font-semibold text-gray-900">{hospitalData?.hospital_name || "Your hospital"}</p>
                  {hospitalData?.hospital_city && hospitalData?.hospital_state && (
                    <p className="text-sm text-gray-500">
                      {hospitalData.hospital_city}, {hospitalData.hospital_state}
                    </p>
                  )}
                </div>
              </div>
              <Badge tone={isVerified ? "success" : "warning"} icon={isVerified ? "verified" : "warning"}>
                {isVerified ? "Verified" : verificationStatus || "Not verified"}
              </Badge>
            </>
          )}
        </div>

        {!checkingVerification && !isVerified && (
          <div className="mb-6 border-l-2 border-amber-400 bg-amber-50 px-5 py-4">
            <p className="font-semibold text-amber-900">Verification required</p>
            <p className="mt-1 text-sm text-amber-900/80">Your hospital must be verified before posting jobs.</p>
            <Link to="/hospital-profile" className="mt-2 inline-flex min-h-10 items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-coral-700 hover:text-coral-800">
              Complete verification <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="ds-card overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="ds-label !text-gray-900">01 — Job details</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Job title" value={form.title} onChange={set("title")} placeholder="e.g. Consultant cardiologist" />
              <Field label="Department" value={form.department} onChange={set("department")} placeholder="e.g. Cardiology" />
              <SelectField label="Job type" value={form.job_type} onChange={set("job_type")}>
                <option value="">Select job type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </SelectField>
              <Field label="Experience required" value={form.experience_required} onChange={set("experience_required")} placeholder="e.g. 3+ years" />
              <Field label="Minimum salary ₹" type="number" value={form.min_salary} onChange={set("min_salary")} />
              <Field label="Maximum salary ₹" type="number" value={form.max_salary} onChange={set("max_salary")} />
            </div>
            <TextArea
              label="Job description"
              rows={7}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe the role, responsibilities, requirements and benefits…"
            />

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-[var(--radius-control)] border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
                <Icon name="error" className="text-[18px]" /> {error}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => navigate("/posted-jobs")}>
              Cancel
            </Button>
            <Button type="submit" loading={loading || checkingVerification} disabled={!isVerified} iconRight={isVerified ? "arrow_forward" : undefined}>
              {checkingVerification ? "Checking verification…" : loading ? "Posting…" : !isVerified ? "Verification required" : "Post job opening"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
