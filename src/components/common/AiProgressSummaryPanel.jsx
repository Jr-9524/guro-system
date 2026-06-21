import { Copy, FilePlus2 } from "lucide-react";
import Button from "./Button";

const AiProgressSummaryPanel = ({
  value,
  onChange,
  onCopy,
  onInclude,
  includeLabel = "Include in Report",
}) => (
  <section className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">AI Progress Summary</h2>
        <p className="mt-1 text-sm text-base-content/60">
          AI-generated summary. Please review and edit before saving or sharing.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={Copy}
          disabled={!value.trim()}
          onClick={onCopy}
        >
          Copy
        </Button>
        {onInclude && (
          <Button
            size="sm"
            icon={FilePlus2}
            disabled={!value.trim()}
            onClick={onInclude}
          >
            {includeLabel}
          </Button>
        )}
      </div>
    </div>
    <textarea
      className="textarea textarea-bordered mt-4 min-h-48 w-full leading-relaxed"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Editable AI progress summary"
    />
    <p className="mt-2 text-xs text-base-content/55">
      AI summarizes existing progress data only. The teacher remains responsible
      for reviewing and approving the final progress report.
    </p>
  </section>
);

export default AiProgressSummaryPanel;
