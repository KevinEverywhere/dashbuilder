import { Injectable } from '@nestjs/common';
import {
  Composite,
  ExportIR,
  StackProfile,
  builtInExporterManifest,
  buildExportIR,
  defaultComponentRegistry,
} from '@rosettadash/core';
import { generateAngularUiFiles } from '@rosettadash/exporters-angular';
import { generateExpressInfraFiles } from '@rosettadash/exporters-express';
import { generateMongoInfraFiles } from '@rosettadash/exporters-mongodb';
import { generateMysqlInfraFiles } from '@rosettadash/exporters-mysql';
import { generateSupabaseInfraFiles } from '@rosettadash/exporters-supabase';
import { generateNestInfraFiles } from '@rosettadash/exporters-nest';
import { generateNextInfraFiles } from '@rosettadash/exporters-next';
import { generateNuxtInfraFiles } from '@rosettadash/exporters-nuxt';
import { generateReactUiFiles } from '@rosettadash/exporters-react';
import { generateWebComponentsUiFiles } from '@rosettadash/exporters-web-components';
import { generateSvelteUiFiles } from '@rosettadash/exporters-svelte';
import { generateVueUiFiles } from '@rosettadash/exporters-vue';

@Injectable()
export class ExportService {
  /** Plugin metadata registry — see docs/16-exporter-plugin-sdk.md */
  readonly exporterManifest = builtInExporterManifest;

  buildIr(composite: Composite, stackProfile?: StackProfile) {
    return buildExportIR(composite, defaultComponentRegistry, { stackProfile });
  }

  buildReactExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateReactUiFiles(ir);
    return { ir, files };
  }

  buildAngularExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateAngularUiFiles(ir);
    return { ir, files };
  }

  buildVueExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateVueUiFiles(ir);
    return { ir, files };
  }

  buildSvelteExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateSvelteUiFiles(ir);
    return { ir, files };
  }

  buildWebComponentsExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateWebComponentsUiFiles(ir);
    return { ir, files };
  }

  buildNestExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateNestInfraFiles(ir);
    return { ir, files };
  }

  buildExpressExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateExpressInfraFiles(ir);
    return { ir, files };
  }

  buildNextExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateNextInfraFiles(ir);
    return { ir, files };
  }

  buildNuxtExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateNuxtInfraFiles(ir);
    return { ir, files };
  }

  buildMongoExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateMongoInfraFiles(ir);
    return { ir, files };
  }

  buildSupabaseExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateSupabaseInfraFiles(ir);
    return { ir, files };
  }

  buildMysqlExport(composite: Composite) {
    const ir = this.buildIr(composite);
    const files = generateMysqlInfraFiles(ir);
    return { ir, files };
  }

  buildBundleExport(composite: Composite, stackProfile?: StackProfile) {
    const ir = this.buildIr(composite, stackProfile);
    const uiFiles = this.generateUiFiles(ir);
    const databaseFiles = this.generateDatabaseFiles(ir);
    // DAS-185: a database target used to short-circuit the server, so a bundle
    // with, say, a MySQL target silently emitted no server at all. The server
    // exporters now handle every promised engine, so a bundle carries all three
    // layers.
    const serverFiles = this.shouldGenerateServerFiles(ir) ? this.generateServerFiles(ir) : [];

    return {
      ir,
      files: dedupeByPath([...uiFiles, ...serverFiles, ...databaseFiles]),
    };
  }

  private shouldGenerateServerFiles(ir: ExportIR): boolean {
    if (!ir.targets.server) {
      return false;
    }

    if (ir.dataSources.some((source) => source.type.startsWith('infra.server.'))) {
      return true;
    }

    return ir.dataSources.some((source) =>
      ['infra.postgresql', 'infra.mongodb', 'infra.supabase', 'infra.mysql'].includes(source.type),
    );
  }

  private generateDatabaseFiles(ir: ExportIR) {
    switch (ir.targets.database) {
      case 'mongodb':
        return generateMongoInfraFiles(ir);
      case 'supabase':
        return generateSupabaseInfraFiles(ir);
      case 'mysql':
        return generateMysqlInfraFiles(ir);
      default:
        return [];
    }
  }

  private generateUiFiles(ir: ExportIR) {
    switch (ir.targets.ui) {
      case 'angular':
        return generateAngularUiFiles(ir);
      case 'vue':
        return generateVueUiFiles(ir);
      case 'svelte':
        return generateSvelteUiFiles(ir);
      case 'web-components':
        return generateWebComponentsUiFiles(ir);
      default:
        return generateReactUiFiles(ir);
    }
  }

  private generateServerFiles(ir: ExportIR) {
    switch (ir.targets.server) {
      case 'express':
        return generateExpressInfraFiles(ir);
      case 'next':
        return generateNextInfraFiles(ir);
      case 'nuxt':
        return generateNuxtInfraFiles(ir);
      default:
        return generateNestInfraFiles(ir);
    }
  }
}

/**
 * The UI, server, and database exporters each emit their own `.env.example`
 * and README. First writer wins, which keeps the server's copy — it is built
 * from the full `ir.envVars` set and so covers every layer.
 */
function dedupeByPath<T extends { path: string }>(files: T[]): T[] {
  const seen = new Set<string>();
  return files.filter((file) => {
    if (seen.has(file.path)) {
      return false;
    }
    seen.add(file.path);
    return true;
  });
}
