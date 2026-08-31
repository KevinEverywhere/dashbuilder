import { Test, TestingModule } from '@nestjs/testing';
import { probeDataSource } from './preview-probe.service';

describe('probeDataSource', () => {
  it('rejects empty connection URL', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.postgresql',
      connectionUrl: '',
      table: 'records',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Connection URL');
  });

  it('rejects postgres probe without table name', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.postgresql',
      connectionUrl: 'postgresql://localhost:5432/test',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Table name');
  });
});
