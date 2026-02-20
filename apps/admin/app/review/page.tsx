import { ReviewBboxOverlay } from "../../components/ReviewBboxOverlay";

const sampleLines = [
  { line: 12, text: "لسان العرب: مادة كتب - النص المستخرج من OCR", confidence: 0.93 },
  { line: 13, text: "يحتاج إلى مراجعة يدوية لبعض الحروف", confidence: 0.74 },
  { line: 14, text: "يتم حفظ التصحيحات في correction_log", confidence: 0.98 }
];

export default function ReviewPage() {
  return (
    <main className="layout">
      <aside className="sidebar">
        <h1>Review Queue</h1>
        <p>Open tasks: 14</p>
        <p>Blocked pages: 3</p>
      </aside>
      <section className="content">
        <div className="review-grid">
          <div className="scan-panel">
            <ReviewBboxOverlay x={18} y={24} width={66} height={8} />
            <ReviewBboxOverlay x={16} y={35} width={70} height={8} />
            <ReviewBboxOverlay x={18} y={46} width={64} height={8} />
          </div>
          <div className="card">
            <h2>OCR vs Scan Review</h2>
            {sampleLines.map((item) => (
              <p key={item.line}>
                <strong>Line {item.line}</strong> ({Math.round(item.confidence * 100)}%): {item.text}
              </p>
            ))}
            <p>
              Reviewer actions: accept line, edit normalized text, mark for re-OCR fallback.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
