import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import { Avatar, Badge, Button, EmptyState, Field, Icon, PageHeader, SelectField, SkeletonCard, TextArea, statusTone, useToast } from "../ui";

/* ================= MAIN ================= */

export default function MedicalResume() {
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  // No token: nothing to fetch, so start out not loading.
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE_URL}/profile/medical-resume`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setEditMode(false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell>
        <SkeletonCard lines={8} />
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="ds-card">
          <EmptyState icon="description" title="No profile data found" description="We couldn't load your medical resume. Try again in a moment." />
        </div>
      </Shell>
    );
  }

  const isEditLocked = data?.verification_status === "pending" || data?.verification_status === "approved";

  return (
    <Shell>
      <PageHeader
        eyebrow="Your profile"
        title={editMode ? "Edit resume" : "Medical resume"}
        description="One structured resume that verified hospitals can review."
        actions={
          !editMode && (
            <Button icon="edit" onClick={() => setEditMode(true)} disabled={isEditLocked}>
              Edit resume
            </Button>
          )
        }
      />

      {isEditLocked && (
        <Notice tone="info" icon="lock">
          {data.verification_status === "pending"
            ? "Your profile is currently under verification. Editing is temporarily disabled."
            : "Your profile has been verified. Editing is no longer allowed."}
        </Notice>
      )}

      {!data.profile_completed && (
        <Notice tone="warning" icon="warning">
          Your profile is not complete. Please fill and submit.
        </Notice>
      )}

      {editMode ? (
        <EditResume
          data={data}
          onCancel={() => setEditMode(false)}
          onSaved={(updated) => {
            setData(updated);
            setEditMode(false);
          }}
        />
      ) : (
        <ViewResume data={data} />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ds-container max-w-5xl py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Notice({ tone, icon, children }) {
  const cls = tone === "warning" ? "border-amber-400 bg-amber-50 text-amber-900" : "border-indigo-400 bg-indigo-50 text-indigo-900";
  return (
    <p className={`mb-4 flex items-start gap-2 border-l-2 px-4 py-3 text-sm ${cls}`}>
      <Icon name={icon} className="text-[18px]" />
      {children}
    </p>
  );
}

/* ================= VIEW MODE ================= */

function ViewResume({ data }) {
  const list = (v) => (Array.isArray(v) && v.length ? v : null);
  return (
    <div className="ds-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center">
        <Avatar name={data.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-medium uppercase tracking-tight text-gray-900">{data.name || "—"}</p>
          <p className="ds-label mt-0.5">{[data.designation, data.specialization].filter(Boolean).join(" · ") || data.role}</p>
        </div>
        {data.verification_status && <Badge tone={statusTone(data.verification_status)}>{data.verification_status}</Badge>}
      </div>

      <dl className="grid grid-cols-1 gap-px bg-[var(--color-line-soft)] sm:grid-cols-2 lg:grid-cols-3">
        <Row label="Role" value={data.role} capitalize />
        <Row label="Email" value={data.email} />
        <Row label="Phone" value={data.phone} />
        <Row label="Registration no." value={data.registration_number} mono />
        <Row label="Year of graduation" value={data.year_of_graduation} mono />
        <Row label="Experience" value={data.years_of_experience ? `${data.years_of_experience} years` : null} />
        <Row label="Hospital / clinic" value={data.hospital_affiliation} />
      </dl>

      <div className="grid gap-px border-t border-gray-200 bg-[var(--color-line-soft)] md:grid-cols-2">
        <Chips label="Qualifications" items={list(data.qualifications)} />
        <Chips label="Skills" items={list(data.skills)} />
      </div>

      <div className="border-t border-gray-200 p-6">
        <p className="ds-label mb-2">Bio</p>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{data.bio || "—"}</p>
      </div>
    </div>
  );
}

function Row({ label, value, mono, capitalize }) {
  return (
    <div className="min-w-0 bg-white px-6 py-4">
      <dt className="ds-label">{label}</dt>
      <dd className={`mt-1 break-words text-sm text-gray-900 ${mono ? "font-mono" : "font-medium"} ${capitalize ? "capitalize" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

function Chips({ label, items }) {
  return (
    <div className="bg-white px-6 py-4">
      <p className="ds-label mb-2">{label}</p>
      {items ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((q) => (
            <li key={q} className="rounded-[4px] border border-gray-200 px-2 py-1 text-sm text-gray-800">
              {q}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">—</p>
      )}
    </div>
  );
}

/* ================= EDIT MODE ================= */

function EditResume({ data, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    role: data.role || "",
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    designation: data.designation || "",
    specialization: data.specialization || "",
    registration_number: data.registration_number || "",
    year_of_graduation: data.year_of_graduation || "",
    years_of_experience: data.years_of_experience || "",
    hospital_affiliation: data.hospital_affiliation || "",
    qualifications: Array.isArray(data.qualifications) ? data.qualifications.join(", ") : "",
    skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
    bio: data.bio || "",
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const payload = {
      ...form,
      year_of_graduation: form.year_of_graduation ? Number(form.year_of_graduation) : null,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      qualifications: form.qualifications.split(",").map((q) => q.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      submit: true, // ALWAYS submit
    };

    delete payload.email;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("Failed to submit profile");
        return;
      }

      const refreshed = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedData = await refreshed.json();

      toast.success("Profile submitted successfully");
      onSaved(updatedData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ds-card overflow-hidden">
      <Group n="01" title="Identity">
        <SelectField label="Role" value={form.role} onChange={set("role")} required>
          <option value="">Select role</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="medical_worker">Medical worker</option>
        </SelectField>
        <Field label="Name" value={form.name} onChange={set("name")} required />
        <Field label="Email" value={form.email} disabled hint="Email can't be changed here." />
        <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} required />
      </Group>

      <Group n="02" title="Practice">
        <Field label="Designation" value={form.designation} onChange={set("designation")} required />
        <Field label="Specialization" value={form.specialization} onChange={set("specialization")} required />
        <Field label="Registration number" value={form.registration_number} onChange={set("registration_number")} required />
        <Field label="Hospital / clinic" value={form.hospital_affiliation} onChange={set("hospital_affiliation")} required />
        <Field label="Year of graduation" type="number" value={form.year_of_graduation} onChange={set("year_of_graduation")} required />
        <Field label="Years of experience" type="number" value={form.years_of_experience} onChange={set("years_of_experience")} required />
      </Group>

      <Group n="03" title="Background">
        <Field label="Qualifications" value={form.qualifications} onChange={set("qualifications")} hint="Comma separated, e.g. MBBS, MD" required />
        <Field label="Skills" value={form.skills} onChange={set("skills")} hint="Comma separated" required />
        <TextArea label="Bio" rows={4} value={form.bio} onChange={set("bio")} required className="md:col-span-2" />
      </Group>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} iconRight="arrow_forward">
          Submit profile
        </Button>
      </div>
    </form>
  );
}

function Group({ n, title, children }) {
  return (
    <fieldset className="border-b border-gray-200 p-6 last-of-type:border-b-0">
      <legend className="ds-label float-left mb-5 w-full">
        <b className="font-medium text-coral-600">{n}</b> — {title}
      </legend>
      <div className="clear-both grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
