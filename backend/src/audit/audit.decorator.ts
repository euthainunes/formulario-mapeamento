import { SetMetadata } from '@nestjs/common';

export const AUDIT_TARGET_KEY = 'auditTargetType';

/** Marca um handler de mutação administrativa para ser registrado em AuditLog. */
export const Audit = (targetType: string) => SetMetadata(AUDIT_TARGET_KEY, targetType);
