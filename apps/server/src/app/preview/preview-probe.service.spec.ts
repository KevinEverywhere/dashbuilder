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

  it('rejects mysql probe without table name', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.mysql',
      connectionUrl: 'mysql://localhost:3306/test',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Table name');
  });

  it('rejects mysql probe with an unsafe table name', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.mysql',
      connectionUrl: 'mysql://localhost:3306/test',
      table: 'orders; DROP TABLE people',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('invalid characters');
  });

  it('rejects mongo probe without a collection name', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.mongodb',
      connectionUrl: 'mongodb://localhost:27017/test',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Collection name');
  });

  it('rejects mongo probe without a connection URL even when a collection is given', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.mongodb',
      connectionUrl: '   ',
      collection: 'orders',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Connection URL');
  });

  it('rejects an unsupported source type', async () => {
    const result = await probeDataSource({
      sourceType: 'infra.redis',
      connectionUrl: 'redis://localhost:6379',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Unsupported source type');
  });
});
