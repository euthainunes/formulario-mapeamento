import { ForbiddenException } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController — isolamento cross-tenant', () => {
  let service: jest.Mocked<TenantService>;
  let controller: TenantController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<TenantService>;
    controller = new TenantController(service);
  });

  it('findOne rejeita quando o tenant da rota difere do tenant do usuário autenticado', () => {
    expect(() => controller.findOne('tenant-b', 'tenant-a')).toThrow(ForbiddenException);
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('update rejeita quando o tenant da rota difere do tenant do usuário autenticado', () => {
    expect(() => controller.update('tenant-b', {}, 'tenant-a')).toThrow(ForbiddenException);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('findOne rejeita quando não há tenant no contexto do chamador', () => {
    expect(() => controller.findOne('tenant-b', undefined)).toThrow(ForbiddenException);
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('findOne permite quando o tenant da rota é o mesmo do usuário autenticado', () => {
    controller.findOne('tenant-a', 'tenant-a');
    expect(service.findOne).toHaveBeenCalledWith('tenant-a');
  });

  it('update permite quando o tenant da rota é o mesmo do usuário autenticado', () => {
    controller.update('tenant-a', { name: 'Novo nome' }, 'tenant-a');
    expect(service.update).toHaveBeenCalledWith('tenant-a', { name: 'Novo nome' });
  });
});
