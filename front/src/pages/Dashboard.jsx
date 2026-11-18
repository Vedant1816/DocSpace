import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import PieChart from "../components/PieChart";
import Histogram from "../components/Histogram";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Icon,
  PageHeader,
  Reveal,
  SectionHead,
  Skeleton,
  SkeletonCard,
  StatCard,
  Tabs,
  statusTone,
} from "../ui";

/* Categorical order validated with the dataviz palette checker (light surface). */
const chartColors = ["#E05252", "#2a78d6", "#1baf7a", "#eda100", "#8b5cf6", "#e87ba4"];
/* Status colors: approved / rejected / pending (always shown with labels). */
const statusColors = ["#12B886", "#E05252", "#F59F00"];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* =========================
   DASHBOARD
   ========================= */

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Trigger a custom event to notify App.jsx to update state
    window.dispatchEvent(new Event("logout"));
    navigate("/auth");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
          throw new Error("Unauthorized");
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load dashboard");
        return json;
      })
      .then(setData)
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  /* =========================
     STATES
     ========================= */

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState
            icon="error"
            title="Couldn't load your dashboard"
            description={error}
            action={
              <Button variant="secondary" icon="refresh" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        </div>
      </Shell>
    );
  }

  if (!data || !data.profile) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState icon="person_off" title="Profile not available" description="We couldn't find a profile for this account." />
        </div>
      </Shell>
    );
  }

  const { profile, role, hospital, postedJobs = [], appliedJobs = [], totalApplications = 0, applicationStatuses = [], applicationDates = [] } = data;
  const isHospital = role === "hospital";

  // Calculate statistics
  const stats = isHospital
    ? {
        totalJobsPosted: postedJobs.length,
        totalApplications: totalApplications, // From backend
        activeJobs: postedJobs.length, // Can be enhanced with status
      }
    : {
        totalApplied: appliedJobs.length,
        totalResponses: appliedJobs.filter((app) => app.verification_status === "approved" || app.verification_status === "rejected").length,
        pendingApplications: appliedJobs.filter((app) => !app.verification_status || app.verification_status === "pending").length,
      };

  const countBy = (items, key) => {
    const counts = {};
    items.forEach((item) => {
      const k = key(item);
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  };

  // Job Type Distribution
  const jobTypeData = countBy(isHospital ? postedJobs : appliedJobs, (x) => (isHospital ? x.job_type : x.jobs?.job_type) || "other").map((d) => ({
    ...d,
    label: cap(d.label).replace("-", " "),
  }));

  // Department Distribution
  const departmentData = countBy(isHospital ? postedJobs : appliedJobs, (x) => (isHospital ? x.department : x.jobs?.department) || "Other");

  // Application Status Distribution - for both users and hospitals
  const applicationStatusData = (() => {
    const statusCount = { approved: 0, rejected: 0, pending: 0 };
    const statuses = isHospital ? applicationStatuses : appliedJobs.map((app) => app.verification_status || "pending");
    statuses.forEach((status) => {
      if (status === "approved") statusCount.approved += 1;
      else if (status === "rejected") statusCount.rejected += 1;
      else statusCount.pending += 1;
    });
    return [
      { label: "Approved", value: statusCount.approved, color: statusColors[0] },
      { label: "Rejected", value: statusCount.rejected, color: statusColors[1] },
      { label: "Pending", value: statusCount.pending, color: statusColors[2] },
    ].filter((item) => item.value > 0);
  })();

  // Monthly Activity - all 12 months of each year with activity
  const monthlyData = (() => {
    const counts = {};
    const dates = isHospital ? applicationDates : appliedJobs.map((app) => app.created_at || app.applied_at);

    dates.filter(Boolean).forEach((dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      if (!counts[year]) counts[year] = Array(12).fill(0);
      counts[year][date.getMonth()] += 1;
    });

    const chartData = [];
    Object.keys(counts)
      .sort()
      .forEach((year) => {
        for (let month = 0; month < 12; month++) {
          chartData.push({
            label: new Date(year, month).toLocaleDateString("en-US", { month: "long" }),
            value: counts[year][month] || 0,
            sortKey: `${year}-${String(month + 1).padStart(2, "0")}`,
          });
        }
      });
    return chartData;
  })();

  const hasActivity = postedJobs.length > 0 || appliedJobs.length > 0;
  const name = isHospital ? hospital?.hospital_name || profile.name : profile.name;
  const verification = isHospital ? hospital?.verification_status : profile.verification_status;

  const statusOf = (app) => app.verification_status || "pending";
  const filteredApplied = filter === "all" ? appliedJobs : appliedJobs.filter((a) => statusOf(a) === filter);
  const filterTabs = ["all", "pending", "approved", "rejected"].map((v) => ({
    value: v,
    label: cap(v),
    count: v === "all" ? appliedJobs.length : appliedJobs.filter((a) => statusOf(a) === v).length,
  }));

  /* =========================
     UI
     ========================= */

  return (
    <Shell>
      <PageHeader
        eyebrow={isHospital ? "Hospital dashboard" : "Doctor dashboard"}
        title={`Hello, ${isHospital ? name || "there" : String(name || "there").split(" ")[0]}`}
        description={isHospital ? "Your openings, applicants and hiring activity at a glance." : "Your applications, responses and profile at a glance."}
        actions={
          isHospital ? (
            <>
              <Button to="/post-job" icon="add">
                Post a job
              </Button>
              <Button to="/hospital-profile" variant="secondary">
                Edit profile
              </Button>
            </>
          ) : (
            <>
              <Button to="/search/jobs" icon="search">
                Find jobs
              </Button>
              <Button to="/resume" variant="secondary">
                Edit resume
              </Button>
            </>
          )
        }
      />

      {/* 01 · overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isHospital ? (
          <>
            <StatCard icon="work" label="Jobs posted" value={stats.totalJobsPosted} />
            <StatCard icon="description" label="Total applications" value={stats.totalApplications} tone="info" delay={0.05} />
            <StatCard icon="check_circle" label="Active jobs" value={stats.activeJobs} tone="success" delay={0.1} />
          </>
        ) : (
          <>
            <StatCard icon="send" label="Jobs applied" value={stats.totalApplied} />
            <StatCard icon="mark_email_read" label="Responses received" value={stats.totalResponses} tone="success" delay={0.05} />
            <StatCard icon="schedule" label="Pending applications" value={stats.pendingApplications} tone="warning" delay={0.1} />
          </>
        )}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* 02 · profile */}
        <section>
          <SectionHead n="01" title={isHospital ? "Hospital" : "Profile"} meta={isHospital ? "Registered details" : "Public details"} className="!mb-5" />
          <Reveal className="ds-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-gray-200 p-5">
              <Avatar name={name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-medium text-gray-900">{name || "—"}</p>
                <p className="ds-label truncate">{isHospital ? hospital?.hospital_type || "Hospital" : profile.designation || profile.role}</p>
              </div>
              {verification && <Badge tone={statusTone(verification)}>{verification}</Badge>}
            </div>

            <dl className="grid grid-cols-1 gap-px bg-[var(--color-line-soft)] sm:grid-cols-2">
              {isHospital && hospital ? (
                <>
                  <ProfileRow label="Registration no." value={hospital.registration_number_hospital} mono />
                  <ProfileRow label="Location" value={[hospital.hospital_city, hospital.hospital_state].filter(Boolean).join(", ")} />
                  <ProfileRow label="Contact person" value={hospital.hospital_person_name} />
                  <ProfileRow label="Contact email" value={hospital.hospital_person_email} />
                  <ProfileRow label="Website" value={hospital.hospital_website} wide />
                </>
              ) : (
                <>
                  <ProfileRow label="Email" value={profile.email} />
                  <ProfileRow label="Phone" value={profile.phone} />
                  <ProfileRow label="Specialization" value={profile.specialization} />
                  <ProfileRow label="Experience" value={profile.years_of_experience ? `${profile.years_of_experience} years` : null} />
                  <ProfileRow label="Hospital" value={profile.hospital_affiliation} wide />
                </>
              )}
            </dl>

            {!isHospital && (
              <div className="border-t border-gray-200 p-5">
                <p className="ds-label mb-2">Bio</p>
                <p className="text-sm leading-relaxed text-gray-700">{profile.bio || "No bio yet."}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3">
              <span className="ds-label">Session</span>
              <Button variant="ghost" size="sm" icon="logout" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </Reveal>
        </section>

        {/* 03 · jobs */}
        <section className="min-w-0">
          <SectionHead
            n="02"
            title={isHospital ? "Jobs you posted" : "Applications"}
            meta={`${isHospital ? postedJobs.length : appliedJobs.length} total`}
            className="!mb-5"
          />

          {!isHospital && appliedJobs.length > 0 && <Tabs items={filterTabs} value={filter} onChange={setFilter} size="sm" label="Filter applications" className="mb-4" />}

          <div className="ds-card overflow-hidden">
            {isHospital ? (
              postedJobs.length === 0 ? (
                <EmptyState
                  icon="work"
                  title="No jobs posted yet"
                  description="Post your first opening to start receiving applications from verified doctors."
                  action={
                    <Button to="/post-job" icon="add">
                      Post a job
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-gray-200">
                  {postedJobs.map((job) => (
                    <JobRow
                      key={job.id}
                      title={job.title}
                      meta={[job.department, job.job_type].filter(Boolean).join(" · ")}
                      date={job.created_at}
                      dateLabel="Posted"
                      link={`/jobs/${job.id}`}
                    />
                  ))}
                </ul>
              )
            ) : appliedJobs.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="No applications yet"
                description="Browse openings from verified hospitals and apply in a few clicks."
                action={
                  <Button to="/search/jobs" icon="search">
                    Find jobs
                  </Button>
                }
              />
            ) : filteredApplied.length === 0 ? (
              <EmptyState icon="filter_alt_off" title={`No ${filter} applications`} description="Try another filter." />
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredApplied.map((app) => (
                  <JobRow
                    key={app.id}
                    title={app.jobs?.title || "—"}
                    meta={[app.jobs?.department, app.jobs?.job_type].filter(Boolean).join(" · ")}
                    date={app.created_at || app.applied_at || null}
                    dateLabel="Applied"
                    link={`/jobs/view/${app.jobs?.id}`}
                    status={statusOf(app)}
                    interviewDate={app.interview_date || null}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* 04 · analytics */}
      {hasActivity && (
        <section className="mt-14">
          <SectionHead n="03" title="Analytics" meta={isHospital ? "Applications" : "Your applications"} className="!mb-5" />
          <div className="ds-hairline grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {applicationStatusData.length > 0 && (
              <ChartCell title="Application status">
                <PieChart data={applicationStatusData} colors={applicationStatusData.map((d) => d.color)} size={168} />
              </ChartCell>
            )}
            {jobTypeData.length > 0 && (
              <ChartCell title={isHospital ? "Jobs by type" : "Applications by type"}>
                <PieChart data={jobTypeData} colors={chartColors} size={168} />
              </ChartCell>
            )}
            {departmentData.length > 0 && (
              <ChartCell title={isHospital ? "Jobs by department" : "Applications by department"}>
                <PieChart data={departmentData} colors={chartColors} size={168} />
              </ChartCell>
            )}
            {monthlyData.length > 0 && (
              <ChartCell title="Application trend" meta="By month" className="md:col-span-2 lg:col-span-3">
                <Histogram data={monthlyData} colors={chartColors} height={200} />
              </ChartCell>
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}

/* =========================
   COMPONENTS
   ========================= */

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container py-10 sm:py-14">{children}</div>
    </div>
  );
}

function ChartCell({ title, meta, className, children }) {
  return (
    <div className={`min-w-0 p-5 sm:p-6 ${className || ""}`}>
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="ds-display text-[18px]">{title}</h3>
        {meta && <span className="ds-label">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function JobRow({ title, meta, date, dateLabel, link, status, interviewDate }) {
  return (
    <li>
      <Link to={link} className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-coral-50/60">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{title}</h4>
            {status && <Badge tone={statusTone(status)}>{status}</Badge>}
          </div>
          {meta && <p className="mt-0.5 truncate text-sm capitalize text-gray-500">{meta}</p>}
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
            {date && (
              <span>
                {dateLabel} {new Date(date).toLocaleDateString()}
              </span>
            )}
            {interviewDate && status === "approved" && (
              <span className="flex items-center gap-1 text-emerald-700">
                <Icon name="event" className="text-[14px]" />
                Interview {new Date(interviewDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <Icon name="arrow_forward" className="text-gray-300 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </li>
  );
}

function ProfileRow({ label, value, mono, wide }) {
  return (
    <div className={`min-w-0 bg-white px-5 py-3.5 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="ds-label">{label}</dt>
      <dd className={`mt-1 truncate text-sm text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</dd>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <Shell>
      <div className="mb-8 space-y-3" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ds-card space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={6} />
      </div>
    </Shell>
  );
}
