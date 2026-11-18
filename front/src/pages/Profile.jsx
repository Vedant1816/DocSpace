import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { Avatar, Badge, Button, EmptyState, Icon, SkeletonCard } from "../ui";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile/public/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Profile not found");
        }
        return data;
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err.message);
        setError(err.message || "Profile not available");
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <Shell>
        <SkeletonCard lines={6} />
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState icon="person_off" title="Profile not available" description={error || "This profile may be private or removed."} />
        </div>
      </Shell>
    );
  }

  const verified = data.verification_status === "approved" || data.verification_status === "verified";
  const list = (v) => (Array.isArray(v) && v.length ? v : null);

  return (
    <Shell>
      {/* HEADER */}
      <div className="ds-card overflow-hidden">
        <div className="grid-bg border-b border-gray-200 px-6 pb-6 pt-10 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Avatar name={data.name} size={88} className="ring-4 ring-white" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="ds-display break-words text-[30px] sm:text-[40px]">{data.name}</h1>
                {verified ? (
                  <Badge tone="success" icon="verified">
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="warning">Pending verification</Badge>
                )}
              </div>
              <p className="ds-label mt-1">
                {data.designation || "Doctor"} · {data.specialization || "Medical"}
              </p>
              {data.hospital_affiliation && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                  <Icon name="local_hospital" className="text-[18px] text-gray-400" />
                  {data.hospital_affiliation}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon="description" onClick={() => navigate(`/resume/${id}`)}>
                Resume
              </Button>
              <Button icon="chat" onClick={() => navigate(`/chat/${id}`)}>
                Message
              </Button>
            </div>
          </div>
        </div>

        {/* BIO */}
        <section className="border-b border-gray-200 px-6 py-6 sm:px-8">
          <h2 className="ds-label mb-3 !text-gray-900">About</h2>
          <p className="whitespace-pre-line leading-relaxed text-gray-700">{data.bio || "No bio provided."}</p>
        </section>

        {/* DETAILS */}
        <section className="grid gap-px bg-[var(--color-line-soft)] md:grid-cols-3">
          <Detail label="Specialization">{data.specialization || "—"}</Detail>
          <Detail label="Qualifications">
            <Tags items={list(data.qualifications)} />
          </Detail>
          <Detail label="Skills">
            <Tags items={list(data.skills)} />
          </Detail>
        </section>
      </div>
    </Shell>
  );
}

/* ================= UI HELPERS ================= */

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-4xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="bg-white px-6 py-5 sm:px-8">
      <p className="ds-label mb-2">{label}</p>
      <div className="text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}

function Tags({ items }) {
  if (!items) return <span className="text-gray-500">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-[4px] border border-gray-200 px-2 py-1 font-normal text-gray-800">
          {t}
        </li>
      ))}
    </ul>
  );
}
