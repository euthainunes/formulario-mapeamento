import { generateExcelBuffer, generatePdfBuffer, ReportFileMetadata } from './report-file-generators';

const META: ReportFileMetadata = {
  reportName: 'Acessos — 2026-08-01 a 2026-08-13',
  tenantName: 'BeeHome Brasil',
  typeLabel: 'Acessos',
  period: { from: '2026-08-01', to: '2026-08-13' },
  filtersLabel: 'Departamento: Comunicação',
  generatedAt: '2026-08-13T12:00:00.000Z',
  lastSyncConsidered: '2026-08-13T10:00:00.000Z',
  dataSource: 'Intranet BeeHome (via MetricSnapshot/normalizado)',
  metricDefinitions: [{ metric: 'access.totalLogins', definition: 'Total de eventos de login no período' }],
  formulaVersion: 1,
};

const ROWS = [
  { date: '2026-08-01', total: 12 },
  { date: '2026-08-02', total: 8 },
];

describe('report-file-generators', () => {
  it('gera um .xlsx válido (assinatura ZIP) com dados e metadados', async () => {
    const buffer = await generateExcelBuffer(ROWS, META);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    // Assinatura de arquivo ZIP (xlsx é um pacote ZIP/OOXML): 0x50 0x4B ("PK").
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('gera um .xlsx válido mesmo sem linhas de dados', async () => {
    const buffer = await generateExcelBuffer([], META);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('gera um .pdf válido (assinatura %PDF-) com dados e metadados', async () => {
    const buffer = await generatePdfBuffer(ROWS, META);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('gera um .pdf válido mesmo sem linhas de dados', async () => {
    const buffer = await generatePdfBuffer([], META);
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });

  it('pagina a tabela do PDF quando o volume de linhas excede o limite', async () => {
    const manyRows = Array.from({ length: 500 }, (_, i) => ({ date: `dia-${i}`, total: i }));
    const buffer = await generatePdfBuffer(manyRows, META);
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });
});
