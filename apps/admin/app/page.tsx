import Link from "next/link";

export default function HomePage() {
  return (
    <main className="layout">
      <aside className="sidebar">
        <h1>Corpus Admin</h1>
        <p>Curated ingestion and QA controls.</p>
        <nav>
          <ul>
            <li>
              <Link href="/review">Review Queue</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <section className="content">
        <div className="card">
          <h2>Platform Status</h2>
          <p>Use this panel to monitor ingestion jobs, quality gates, and monthly release readiness.</p>
        </div>
      </section>
    </main>
  );
}
