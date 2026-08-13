import { Modal } from "@/components/ui/modal";
import { ReportHistoryItem } from "@/types/report";
import { formatDate, formatDateTime } from "@/lib/formatters";

interface ReportPreviewProps {
  report: ReportHistoryItem | null;
  onClose: () => void;
}

export function ReportPreview({ report, onClose }: ReportPreviewProps) {
  if (!report) return null;

  return (
    <Modal open={Boolean(report)} onClose={onClose} title={report.name}>
      <div className="space-y-3 text-sm">
        <Row label="Período">
          {formatDate(report.metadata.period.from)} — {formatDate(report.metadata.period.to)}
        </Row>
        <Row label="Filtros aplicados">{report.metadata.filtersApplied}</Row>
        <Row label="Data/hora de geração">{formatDateTime(report.metadata.generatedAt)}</Row>
        <Row label="Última sincronização considerada">{formatDateTime(report.metadata.lastSyncConsidered)}</Row>
        <Row label="Fonte dos dados">{report.metadata.dataSource}</Row>
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1.5">Definição das métricas</p>
          <ul className="space-y-1.5">
            {report.metadata.metricDefinitions.map((m) => (
              <li key={m.metric} className="text-xs text-text-secondary">
                <strong className="text-text-primary">{m.metric}:</strong> {m.definition}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-text-primary">{children}</p>
    </div>
  );
}
