import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Metadados obrigatórios pela spec em todo relatório exportado (Excel/PDF):
 * período analisado, filtros aplicados, data/hora de geração, última
 * sincronização considerada, fonte dos dados, definição das métricas usadas
 * e versão das fórmulas derivadas (ver KpiCardDto.version — hoje toda
 * métrica do sistema está na versão 1 de sua definição).
 */
export interface ReportFileMetadata {
  reportName: string;
  tenantName: string;
  typeLabel: string;
  period: { from: string; to: string };
  filtersLabel: string;
  generatedAt: string;
  lastSyncConsidered: string;
  dataSource: string;
  metricDefinitions: { metric: string; definition: string }[];
  formulaVersion: number;
}

/** Limite de linhas exibidas na tabela do PDF — arquivo institucional pensado para leitura/impressão, não para análise de grandes volumes (isso é papel do CSV/Excel, que carregam o dataset completo). */
const PDF_MAX_ROWS = 200;

function metadataEntries(meta: ReportFileMetadata): [string, string][] {
  return [
    ['Período analisado', `${meta.period.from} a ${meta.period.to}`],
    ['Filtros aplicados', meta.filtersLabel || 'Nenhum filtro adicional aplicado'],
    ['Data/hora de geração', meta.generatedAt],
    ['Última sincronização considerada', meta.lastSyncConsidered],
    ['Fonte dos dados', meta.dataSource],
    ['Versão das fórmulas derivadas', String(meta.formulaVersion)],
  ];
}

function columnsFromRows(rows: Record<string, unknown>[]): string[] {
  const first = rows.find((r) => r && Object.keys(r).length > 0);
  return first ? Object.keys(first) : [];
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Gera um arquivo .xlsx real (ExcelJS) com:
 *  - aba "Dados": mesma fonte tabular usada pelo CSV (cabeçalho + linhas);
 *  - aba "Metadados": período, filtros, geração, última sincronização,
 *    fonte dos dados, versão das fórmulas e definição de cada métrica.
 */
export async function generateExcelBuffer(rows: Record<string, unknown>[], meta: ReportFileMetadata): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BeeHome — Gestão da Comunicação';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Dados');
  const columns = columnsFromRows(rows);

  if (columns.length === 0) {
    dataSheet.addRow(['Nenhum dado encontrado para o período/filtros selecionados.']);
  } else {
    const headerRow = dataSheet.addRow(columns);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    });
    for (const row of rows) {
      dataSheet.addRow(columns.map((col) => cellToString(row[col])));
    }
    dataSheet.columns.forEach((col) => {
      col.width = 22;
    });
  }

  const metaSheet = workbook.addWorksheet('Metadados');
  metaSheet.addRow(['Relatório', meta.reportName]).font = { bold: true };
  metaSheet.addRow(['Tenant', meta.tenantName]);
  metaSheet.addRow(['Tipo', meta.typeLabel]);
  metaSheet.addRow([]);
  for (const [label, value] of metadataEntries(meta)) {
    metaSheet.addRow([label, value]);
  }
  metaSheet.addRow([]);
  metaSheet.addRow(['Definição das métricas usadas']).font = { bold: true };
  metaSheet.addRow(['Métrica', 'Definição']).font = { bold: true };
  for (const def of meta.metricDefinitions) {
    metaSheet.addRow([def.metric, def.definition]);
  }
  metaSheet.columns.forEach((col) => {
    col.width = 45;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Gera um arquivo .pdf real (PDFKit) com cabeçalho institucional (título,
 * tenant, período), a mesma tabela de dados do CSV (paginada/simplificada
 * para no máximo PDF_MAX_ROWS linhas) e os metadados obrigatórios em uma
 * seção final.
 */
export function generatePdfBuffer(rows: Record<string, unknown>[], meta: ReportFileMetadata): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cabeçalho institucional
    doc.fontSize(16).font('Helvetica-Bold').text('Gestão da Comunicação — Inteligência da Intranet BeeHome');
    doc.moveDown(0.2);
    doc.fontSize(13).text(meta.reportName);
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#555555');
    doc.text(`Tenant: ${meta.tenantName}`);
    doc.text(`Tipo: ${meta.typeLabel}`);
    doc.text(`Período: ${meta.period.from} a ${meta.period.to}`);
    doc.fillColor('#000000');
    doc.moveDown(0.8);

    // Tabela de dados
    const columns = columnsFromRows(rows);
    doc.fontSize(11).font('Helvetica-Bold').text('Dados');
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica');

    if (columns.length === 0) {
      doc.text('Nenhum dado encontrado para o período/filtros selecionados.');
    } else {
      const visibleRows = rows.slice(0, PDF_MAX_ROWS);
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = pageWidth / columns.length;

      const drawRow = (values: string[], bold: boolean) => {
        const y = doc.y;
        if (y > doc.page.height - doc.page.margins.bottom - 60) {
          doc.addPage();
        }
        const rowY = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
        values.forEach((value, i) => {
          doc.text(value, doc.page.margins.left + i * colWidth, rowY, { width: colWidth - 4, ellipsis: true });
        });
        doc.y = rowY + 14;
      };

      drawRow(columns, true);
      for (const row of visibleRows) {
        drawRow(
          columns.map((col) => cellToString(row[col])),
          false,
        );
      }

      if (rows.length > PDF_MAX_ROWS) {
        doc.moveDown(0.5);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .text(`Exibindo ${PDF_MAX_ROWS} de ${rows.length} linhas. O arquivo CSV/Excel deste mesmo relatório contém o conjunto completo de dados.`);
      }
    }

    // Metadados obrigatórios (seção final)
    doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').text('Metadados do relatório');
    doc.moveDown(0.4);
    doc.fontSize(9).font('Helvetica');
    for (const [label, value] of metadataEntries(meta)) {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
    }

    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(9).text('Definição das métricas usadas');
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(8);
    for (const def of meta.metricDefinitions) {
      doc.font('Helvetica-Bold').text(`${def.metric}: `, { continued: true }).font('Helvetica').text(def.definition);
    }

    doc.end();
  });
}
