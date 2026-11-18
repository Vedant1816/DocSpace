import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button, EmptyState, Icon, Modal, PageHeader, Skeleton, useToast } from "../ui";

export default function JobsPosted() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchJobTitles = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs/titles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
          throw new Error(data.message || "Failed to fetch jobs");
        }

        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobTitles();
  }, [token, navigate]);

  const handleDelete = async (jobId, jobTitle) => {
    // Confirmation now happens in the modal below before this runs.
    setConfirm(null);
    setDeleting(jobId);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
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
        throw new Error(data.message || "Failed to delete job");
      }

      // Remove job from list
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast.success(`Deleted "${jobTitle}"`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-5xl py-10 sm:py-14">
        <PageHeader
          eyebrow="Hiring"
          title="Jobs posted"
          description="Manage and review the jobs you have posted."
          actions={
            <Button to="/post-job" icon="add">
              Post a job
            </Button>
          }
        />

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
            <Icon name="error" className="text-[18px]" /> {error}
          </div>
        )}

        <div className="mb-3 flex items-baseline justify-between">
          <p className="ds-label !text-gray-900">{loading ? "Loading…" : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}</p>
        </div>

        <div className="ds-card overflow-hidden">
          {loading ? (
            <ul className="divide-y divide-gray-200" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 p-5">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </li>
              ))}
            </ul>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon="work_off"
              title="No jobs posted yet"
              description="Start by posting your first job opening."
              action={
                <Button to="/post-job" icon="add">
                  Post your first job
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-gray-200">
              {jobs.map((job, i) => (
                <li key={job.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <Link to={`/jobs/${job.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                    <span className="font-display text-[22px] tabular-nums text-gray-300 transition-colors duration-200 group-hover:text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{job.title}</span>
                      {job.department && <span className="ds-label mt-0.5 block truncate">{job.department}</span>}
                    </span>
                  </Link>
                  <div className="flex gap-2 sm:shrink-0">
                    <Button to={`/jobs/${job.id}`} variant="outline" size="sm" icon="visibility">
                      Review
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="delete"
                      loading={deleting === job.id}
                      onClick={() => setConfirm(job)}
                      className="text-coral-700"
                      aria-label={`Delete ${job.title}`}
                    >
                      {deleting === job.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this job?"
        icon="delete"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon="delete" onClick={() => handleDelete(confirm.id, confirm.title)}>
              Delete job
            </Button>
          </div>
        }
      >
        <p className="px-6 py-5 text-sm text-gray-700">
          “{confirm?.title}” and its applications will be removed. This can’t be undone.
        </p>
      </Modal>
    </div>
  );
}
