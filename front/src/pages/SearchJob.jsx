import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import { Avatar, Button, EmptyState, Field, Icon, PageHeader, SelectField, Skeleton, Stagger, StaggerItem } from "../ui";

export default function AllJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortPriority, setSortPriority] = useState([]);


  /* FILTER STATE (single source of truth) */
  const [filters, setFilters] = useState({
    department: "",
    job_type: "",
    experience: "",
    min_salary: "",
    max_salary: "",
    city: "",
  });

  const updateFilter = (key, value) => {
  setFilters((prev) => ({
    ...prev,
    [key]: value,
  }));

  const sortableFields = ["experience", "min_salary", "max_salary", "city"];

  if (!sortableFields.includes(key)) return;

  setSortPriority((prev) => {
    // if cleared → remove from priority
    if (!value) {
      return prev.filter((k) => k !== key);
    }

    // if already present → keep order
    if (prev.includes(key)) {
      return prev;
    }

    // first time added → append (lower priority)
    return [...prev, key];
  });
};



  /* AUTO SEARCH EFFECT */
  useEffect(() => {
    const controller = new AbortController();

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        if (sortPriority.length > 0) {
           params.append("sort_order", sortPriority.join(","));
        }

        const url =
          params.toString().length > 0
            ? `${API_BASE_URL}/search?${params.toString()}`
            : `${API_BASE_URL}/jobs`;

        const res = await fetch(url, { signal: controller.signal });
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch jobs");
        }

        setJobs(data.jobs || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    /* debounce */
    const timeout = setTimeout(fetchJobs, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, sortPriority, navigate]);

  const resetFilters = () => {
    setFilters({
      department: "",
      job_type: "",
      experience: "",
      min_salary: "",
      max_salary: "",
      city: "",
    });
    setSortPriority([]);
  };
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container py-10 sm:py-14">
        <PageHeader eyebrow="Careers" title="Job openings" description="Roles posted directly by verified hospitals. Results update as you type." />

        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* FILTERS */}
          <aside className="ds-card p-5 lg:sticky lg:top-24" aria-label="Filters">
            <div className="mb-5 flex items-center justify-between">
              <p className="ds-label !text-gray-900">
                Filters{activeCount > 0 && <span className="ml-2 text-coral-600">{activeCount}</span>}
              </p>
              <Button variant="ghost" size="sm" icon="refresh" onClick={resetFilters} disabled={activeCount === 0}>
                Reset
              </Button>
            </div>
            <div className="space-y-4">
              <Field label="Department" value={filters.department} onChange={(e) => updateFilter("department", e.target.value)} placeholder="e.g. Cardiology" />
              <Field label="City" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} placeholder="e.g. Mumbai" />
              <Field label="Experience" value={filters.experience} onChange={(e) => updateFilter("experience", e.target.value)} placeholder="Years" inputMode="numeric" />
              <SelectField label="Job type" value={filters.job_type} onChange={(e) => updateFilter("job_type", e.target.value)}>
                <option value="">Any type</option>
                <option value="full-time">Full time</option>
                <option value="part-time">Part time</option>
                <option value="contract">Contract</option>
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min salary ₹" type="number" value={filters.min_salary} onChange={(e) => updateFilter("min_salary", e.target.value)} />
                <Field label="Max salary ₹" type="number" value={filters.max_salary} onChange={(e) => updateFilter("max_salary", e.target.value)} />
              </div>
            </div>
            {sortPriority.length > 0 && (
              <p className="ds-label mt-5 border-t border-gray-200 pt-4 normal-case">Sorted by {sortPriority.map((k) => k.replace("_", " ")).join(" → ")}</p>
            )}
          </aside>

          {/* RESULTS */}
          <section className="min-w-0" aria-live="polite" aria-busy={loading}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <p className="ds-label !text-gray-900">{loading ? "Searching…" : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} found`}</p>
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
                <Icon name="error" className="text-[18px]" /> {error}
              </div>
            )}

            <div className="ds-card overflow-hidden">
              {loading ? (
                <ul className="divide-y divide-gray-200" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-4 p-5">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : jobs.length === 0 ? (
                <EmptyState
                  icon="search_off"
                  title="No jobs found"
                  description="Try adjusting or clearing your filters to see more results."
                  action={
                    activeCount > 0 && (
                      <Button variant="secondary" icon="refresh" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    )
                  }
                />
              ) : (
                <Stagger as="ul" className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <StaggerItem as="li" key={job.id}>
                      <Link to={`/jobs/view/${job.id}`} className="ds-plate group flex items-center gap-4 p-5">
                        <div className="ds-plate-body flex min-w-0 flex-1 items-center gap-4">
                          <Avatar name={job.hospital?.name || job.title} size={44} />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{job.title}</h3>
                            {job.hospital && (
                              <p className="mt-0.5 truncate text-sm text-gray-600">
                                {job.hospital.name}
                                {job.hospital.city && (
                                  <span className="text-gray-400">
                                    {" · "}
                                    {job.hospital.city}
                                    {job.hospital.state && `, ${job.hospital.state}`}
                                  </span>
                                )}
                              </p>
                            )}
                            {(job.department || job.job_type) && (
                              <p className="ds-label mt-1.5">{[job.department, job.job_type].filter(Boolean).join(" · ")}</p>
                            )}
                          </div>
                        </div>
                        <Icon name="arrow_forward" className="relative text-gray-300 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
