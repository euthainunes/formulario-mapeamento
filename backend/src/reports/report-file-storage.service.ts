import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

const MIME_TYPES: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

const EXTENSIONS: Record<string, string> = {
  csv: 'csv',
  excel: 'xlsx',
  pdf: 'pdf',
};

export function mimeTypeForFormat(format: string): string {
  return MIME_TYPES[format] ?? 'application/octet-stream';
}

export function extensionForFormat(format: string): string {
  return EXTENSIONS[format] ?? format;
}

/**
 * Persiste os arquivos de relatório gerados (CSV/Excel/PDF) em disco, sob
 * `backend/storage/reports/<tenantId>/`. Caminho raiz relativo a
 * `process.cwd()` (o backend sempre roda com cwd = backend/, tanto em
 * `npm run start:dev` quanto em `node dist/main`), sobreponível via
 * REPORTS_STORAGE_DIR (usado pelos testes para isolar o diretório real).
 */
@Injectable()
export class ReportFileStorageService {
  private readonly rootDir = path.resolve(process.cwd(), process.env.REPORTS_STORAGE_DIR || 'storage/reports');

  /** Grava o conteúdo e devolve o caminho relativo (fileReference) gravado no ReportExport. */
  async save(tenantId: string, exportId: string, format: string, content: Buffer | string): Promise<{ relativePath: string; sizeBytes: number }> {
    const dir = path.join(this.rootDir, tenantId);
    await fs.mkdir(dir, { recursive: true });

    const fileName = `${exportId}.${extensionForFormat(format)}`;
    const absolutePath = path.join(dir, fileName);
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    await fs.writeFile(absolutePath, buffer);

    const relativePath = path.join('storage', 'reports', tenantId, fileName);
    return { relativePath, sizeBytes: buffer.byteLength };
  }

  /** Lê de volta um arquivo gravado a partir do caminho relativo salvo em fileReference. */
  async read(relativePath: string): Promise<Buffer> {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return fs.readFile(absolutePath);
  }
}
