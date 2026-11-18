import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import FeedColumn from "../components/FeedColumn";
import API_BASE_URL from "../config/api.js";
import hospitalImage from "../assets/image.png";
import { Button, ArrowLink, Icon, Words, Reveal, SectionHead, Skeleton } from "../ui";

const TOOLS = [
  { k: "Trust", icon: "verified_user", h: "Hospital profile", code: "PROFILE", p: "Set up your profile to get verified and connect with qualified healthcare professionals.", to: "/hospital-profile", out: "Manage profile" },
  { k: "Hiring", icon: "work", h: "Job posting", code: "JOBS", p: "Post openings and reach thousands of verified doctors. Find the right candidate faster.", to: "/post-job", out: "Post a job" },
  { k: "Insight", icon: "bar_chart", h: "Analytics & reports", code: "DATA", p: "Application statistics and hiring progress for every role you have posted.", to: "/posted-jobs", out: "View reports" },
];

const ACTIONS = [
  { icon: "add", h: "Post new job", p: "Create a new job posting", to: "/post-job" },
  { icon: "visibility", h: "View posted jobs", p: "Manage your job listings", to: "/posted-jobs" },
  { icon: "local_hospital", h: "Hospital profile", p: "Update your hospital info", to: "/hospital-profile" },
  { icon: "search", h: "Search doctors", p: "Find qualified candidates", to: "/find-doctor" },
];

const STEPS = [
  { n: "01", title: "Complete your profile", desc: "Set up your hospital profile with all necessary details and verification documents." },
  { n: "02", title: "Post job openings", desc: "Create detailed job postings with requirements, benefits and application process." },
  { n: "03", title: "Review & hire", desc: "Review applications from verified doctors and connect with the best candidates." },
];

const BENEFITS = [
  { icon: "verified", h: "Verified professionals", p: "All doctors are verified with authentic credentials and licenses." },
  { icon: "bolt", h: "Fast hiring process", p: "A streamlined application process helps you hire faster." },
  { icon: "lock", h: "Secure platform", p: "Your data and communications are protected with enterprise-grade security." },
  { icon: "monitoring", h: "Analytics dashboard", p: "Track applications, views and hiring metrics in real time." },
  { icon: "forum", h: "Direct communication", p: "Chat directly with candidates and manage conversations easily." },
  { icon: "public", h: "Wide reach", p: "Access to thousands of qualified healthcare professionals nationwide." },
];

export default function HospitalHome() {
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);
  const [whoUpdates, setWhoUpdates] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [whoLoading, setWhoLoading] = useState(true);

  useEffect(() => {
    const fetchHospitalData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/hospital/fetch`, {
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
          setHospitalData(data);
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news/medical?q=medical&limit=3`);
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
          throw new Error("Unauthorized");
        }
        if (res.ok) {
          const data = await res.json();
          setNewsArticles(data.articles || []);
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchWHOUpdates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/who/updates`);
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
          throw new Error("Unauthorized");
        }
        if (res.ok) {
          const data = await res.json();
          setWhoUpdates((data.articles || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch WHO updates:", err);
      } finally {
        setWhoLoading(false);
      }
    };

    fetchHospitalData();
    fetchNews();
    fetchWHOUpdates();
  }, [navigate]);

  const place = [hospitalData?.hospital_city, hospitalData?.hospital_state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ hero */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="ds-container relative grid gap-12 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
          <div className="min-w-0">
            <p className="ds-eyebrow animate-fade-up">Hospital portal</p>

            <div className="mt-6 min-h-[52px]" aria-live="polite">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64 max-w-full" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
              ) : hospitalData?.hospital_name ? (
                <div className="animate-fade-up">
                  <p className="text-lg font-semibold text-gray-900">Welcome, {hospitalData.hospital_name}</p>
                  {(place || hospitalData.hospital_type) && (
                    <p className="ds-label mt-1">{[place, hospitalData.hospital_type].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              ) : null}
            </div>

            <h1 className="ds-display mt-6 text-[44px] leading-[0.95] sm:text-[64px] lg:text-[76px]">
              <Words text="Manage your hospital," trigger="mount" />
              <Words text="find top talent." from={3} trigger="mount" className="text-primary" />
            </h1>

            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-gray-600">
              DocSpace helps you recruit verified doctors, manage your team and streamline your hiring process. Connect with qualified healthcare
              professionals and grow your institution.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/post-job" size="lg" iconRight="arrow_forward">
                Post a job
              </Button>
              <Button to="/hospital-profile" size="lg" variant="secondary">
                Manage profile
              </Button>
            </div>
          </div>

          <Reveal className="relative mx-auto w-full max-w-lg">
            <div className="ds-card overflow-hidden p-2">
              <img src={hospitalImage} alt="Hospital staff reviewing records" className="aspect-square w-full rounded-[6px] object-cover" />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 flex items-center gap-3 border border-gray-900 bg-white px-4 py-3 shadow-[var(--shadow-hard)] sm:left-auto sm:right-6">
              <Icon name="psychology" className="text-primary" />
              <p className="text-sm">
                <span className="font-display text-lg font-medium text-gray-900">99%</span>
                <span className="ds-label ml-2">AI verification accuracy</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ 01 · tools */}
      <section className="ds-container py-20 lg:py-28">
        <SectionHead n="01" title="Management tools" meta="3 tools" />
        <h2 className="ds-display mb-10 max-w-3xl text-[32px] sm:text-[44px]">
          <Words text="Everything you need to run your hiring." />
        </h2>
        <Reveal className="ds-hairline grid-cols-1 md:grid-cols-3">
          {TOOLS.map((f) => (
            <Link key={f.h} to={f.to} className="ds-plate group flex min-h-[240px] flex-col p-6">
              <div className="ds-plate-body flex h-full flex-col gap-4">
                <span className="flex items-center justify-between">
                  <span className="ds-label transition-colors duration-300 group-hover:!text-coral-700">{f.k}</span>
                  <Icon name={f.icon} className="text-[22px] text-gray-400 transition-colors duration-300 group-hover:text-primary" />
                </span>
                <h3 className="ds-display text-[24px]">
                  {f.h}
                  <em className="ml-3 align-[0.5em] font-mono text-[10px] not-italic tracking-[0.24em] text-gray-400">{f.code}</em>
                </h3>
                <p className="max-w-[38ch] text-sm leading-relaxed text-gray-600">{f.p}</p>
                <span className="mt-auto font-mono text-[11px] uppercase tracking-[0.14em] text-coral-700">out → {f.out}</span>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* ============================================ 02 · quick actions */}
      <section className="border-y border-gray-200 bg-gray-50 py-20 lg:py-28">
        <div className="ds-container">
          <SectionHead n="02" title="Quick actions" meta="Shortcuts" />
          <Reveal className="ds-hairline grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIONS.map((a) => (
              <Link key={a.h} to={a.to} className="group flex min-h-[44px] items-center gap-4 p-5 transition-colors duration-150 hover:bg-coral-50">
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-gray-900 bg-white text-gray-900 shadow-[var(--shadow-hard)] transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                  <Icon name={a.icon} className="text-[20px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900">{a.h}</span>
                  <span className="block text-sm text-gray-500">{a.p}</span>
                </span>
                <Icon name="arrow_forward" className="text-gray-300 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================================ 03 · steps */}
      <section className="ds-container py-20 lg:py-28">
        <SectionHead n="03" title="How it works" meta="3 steps" />
        <div className="grid gap-px overflow-hidden border border-[var(--color-line-soft)] bg-[var(--color-line-soft)] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05} className="group relative bg-white p-7">
              <span className="font-display text-[64px] font-normal leading-none tracking-tighter text-gray-200 transition-colors duration-300 group-hover:text-primary">{s.n}</span>
              <h3 className="ds-display mt-6 text-[22px]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-x-100" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================ 04 · benefits */}
      <section className="border-t border-gray-200 py-20 lg:py-28">
        <div className="ds-container">
          <SectionHead n="04" title="Why DocSpace" meta="6 reasons" />
          <Reveal className="ds-hairline grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <div key={b.h} className="p-6">
                <span className="flex items-center justify-between">
                  <Icon name={b.icon} className="text-[22px] text-primary" />
                  <span className="ds-label">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{b.h}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{b.p}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================================ 05 · informed */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 lg:py-28">
        <div className="ds-container">
          <SectionHead n="05" title="Stay informed" meta="News · WHO" />
          <div className="grid gap-10 lg:grid-cols-2">
            <FeedColumn title="Medical news" to="/news" loading={newsLoading} items={newsArticles} kind="news" />
            <FeedColumn title="WHO updates" to="/who" loading={whoLoading} items={whoUpdates} kind="who" />
          </div>
        </div>
      </section>

      {/* ============================================ cta */}
      <section className="relative overflow-hidden border-t border-gray-200">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="ds-container relative grid items-center gap-10 py-20 lg:grid-cols-[1fr_1fr] lg:py-28">
          <div>
            <p className="ds-eyebrow">Next hire</p>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-gray-600">
              Join hundreds of hospitals already using DocSpace to recruit top medical talent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/post-job" size="lg" iconRight="arrow_forward">
                Post your first job
              </Button>
              <Button to="/hospital-profile" size="lg" variant="secondary">
                Complete profile
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 lg:items-end">
            <h2 className="ds-display text-[56px] leading-[0.9] tracking-[-0.04em] sm:text-[88px] lg:text-right lg:text-[112px]">
              <Words text="Hire" />
              <Words text="verified." from={1} className="text-primary" />
            </h2>
            <ArrowLink to="/find-doctor">Search doctors</ArrowLink>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
