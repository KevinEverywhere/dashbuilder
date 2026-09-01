import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  normalizeStackProfile,
  stackProfileToExportTargets,
  type Composite,
  type Project,
  type StackProfile,
} from '@rosettadash/core';
import { BuilderStateService } from './builder-state.service';
import { ProjectsApiService } from './projects-api.service';
import {
  BUILDER_SESSION_KEY,
  clearLibraryRestore,
  clearPendingStackProfile,
  readBuilderSession,
  readLibraryRestore,
  readPendingStackProfile,
  writeActiveStackProfile,
  type BuilderSession,
} from '../welcome/stack-profile-session';

@Injectable({ providedIn: 'root' })
export class BuilderProjectService {
  private readonly api = inject(ProjectsApiService);
  private readonly state = inject(BuilderStateService);

  async initialize(): Promise<void> {
    this.state.loading.set(true);
    this.state.errorMessage.set(null);

    try {
      const libraryRestore = readLibraryRestore();
      if (libraryRestore) {
        clearLibraryRestore();
        await this.createNewWorkspace();
        this.state.applySavedComposite({
          ...libraryRestore.composite,
          name: libraryRestore.composite.name || 'Restored dashboard',
        });
        if (libraryRestore.stackProfile) {
          writeActiveStackProfile(libraryRestore.stackProfile);
        }
        this.state.dirty.set(true);
        this.state.saveStatus.set('idle');
        return;
      }

      const session = this.readSession();
      if (session) {
        const restored = await this.tryRestore(session);
        if (restored) {
          return;
        }
      }
      await this.createNewWorkspace();
    } catch {
      if (!this.state.project()) {
        this.bootstrapLocalWorkspace();
      }
    } finally {
      this.state.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const project = this.state.project();
    const composite = this.state.composite();
    if (!project || !composite) {
      return;
    }

    this.state.saveStatus.set('saving');
    this.state.errorMessage.set(null);

    try {
      const payload = this.state.buildCompositePayload();
      const updated = await firstValueFrom(
        this.api.updateComposite(project.id, composite.id, payload),
      );
      this.state.applySavedComposite(updated);
      this.writeSession({ projectId: project.id, compositeId: updated.id });
    } catch (error) {
      this.state.saveStatus.set('error');
      this.state.errorMessage.set(this.toMessage(error));
      throw error;
    }
  }

  private async tryRestore(session: BuilderSession): Promise<boolean> {
    try {
      const project = await firstValueFrom(this.api.getProject(session.projectId));
      const composite =
        project.composites.find((item) => item.id === session.compositeId) ??
        project.composites[0];

      if (!composite) {
        return false;
      }

      this.state.setProjectContext(project, composite);
      this.writeSession({ projectId: project.id, compositeId: composite.id });
      if (project.stackProfile) {
        writeActiveStackProfile(project.stackProfile);
      }
      return true;
    } catch {
      return false;
    }
  }

  private async createNewWorkspace(): Promise<void> {
    const pendingStack = readPendingStackProfile();
    const stackProfile: StackProfile = normalizeStackProfile(pendingStack ?? { ui: 'web-components' }) ?? {
      ui: 'web-components',
    };
    clearPendingStackProfile();

    const exportTargets = stackProfileToExportTargets(stackProfile);

    const project = await firstValueFrom(
      this.api.createProject({
        name: 'Untitled Dashboard',
        stackProfile,
      }),
    );

    const composite = await firstValueFrom(
      this.api.createComposite(project.id, {
        name: 'Main',
        nodes: [],
        bindings: [],
        ...(exportTargets ? { exportTargets } : {}),
      }),
    );

    const hydrated = { ...project, composites: [composite] };
    this.state.setProjectContext(hydrated, composite);
    this.writeSession({ projectId: project.id, compositeId: composite.id });
    writeActiveStackProfile(stackProfile);
  }

  private readSession(): BuilderSession | null {
    return readBuilderSession();
  }

  private writeSession(session: BuilderSession): void {
    sessionStorage.setItem(BUILDER_SESSION_KEY, JSON.stringify(session));
  }

  /** Local-only workspace when the projects API is unavailable on load. */
  private bootstrapLocalWorkspace(): void {
    const pendingStack = readPendingStackProfile();
    const stackProfile: StackProfile = normalizeStackProfile(pendingStack ?? { ui: 'web-components' }) ?? {
      ui: 'web-components',
    };
    clearPendingStackProfile();

    const exportTargets = stackProfileToExportTargets(stackProfile);
    const now = new Date().toISOString();
    const composite: Composite = {
      id: crypto.randomUUID(),
      version: 1,
      name: 'Main',
      nodes: [],
      bindings: [],
      ...(exportTargets ? { exportTargets } : {}),
    };
    const project: Project = {
      id: crypto.randomUUID(),
      name: 'Untitled Dashboard',
      composites: [composite],
      stackProfile,
      createdAt: now,
      updatedAt: now,
    };

    this.state.setProjectContext(project, composite);
    writeActiveStackProfile(stackProfile);
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Could not reach the server. Is it running?';
      }
      if (typeof error.error === 'object' && error.error !== null && 'message' in error.error) {
        const message = (error.error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
      return `Server error (${error.status}).`;
    }
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return 'Something went wrong while talking to the server.';
  }
}
