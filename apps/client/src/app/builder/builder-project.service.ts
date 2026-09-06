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
  readPendingProjectName,
  clearPendingProjectName,
  writeActiveStackProfile,
  writePendingStackProfile,
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
          writePendingStackProfile(libraryRestore.stackProfile);
        }
        this.state.dirty.set(true);
        this.state.saveStatus.set('idle');
        await this.applySessionStackProfile();
        return;
      }

      const session = this.readSession();
      if (session) {
        const restored = await this.tryRestore(session);
        if (restored) {
          await this.applySessionStackProfile();
          return;
        }
      }
      await this.createNewWorkspace();
      await this.applySessionStackProfile();
    } catch {
      if (!this.state.project()) {
        this.bootstrapLocalWorkspace();
      }
      await this.applySessionStackProfile();
    } finally {
      this.state.loading.set(false);
    }
  }

  isDefaultProjectName(name: string | undefined): boolean {
    const normalized = name?.trim().toLowerCase();
    return !normalized || normalized === 'untitled dashboard' || normalized === 'untitled';
  }

  async renameProject(name: string): Promise<void> {
    const project = this.state.project();
    if (!project) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === project.name) {
      return;
    }

    this.state.errorMessage.set(null);

    try {
      const updatedProject = await firstValueFrom(
        this.api.updateProject(project.id, { name: trimmedName }),
      );
      this.state.project.set({
        ...project,
        name: updatedProject.name,
        updatedAt: updatedProject.updatedAt,
      });
    } catch (error) {
      this.state.errorMessage.set(this.toMessage(error));
      throw error;
    }
  }

  async save(projectName?: string): Promise<void> {
    const project = this.state.project();
    const composite = this.state.composite();
    if (!project || !composite) {
      return;
    }

    this.state.saveStatus.set('saving');
    this.state.errorMessage.set(null);

    try {
      const trimmedName = projectName?.trim();
      if (trimmedName && trimmedName !== project.name) {
        const updatedProject = await firstValueFrom(
          this.api.updateProject(project.id, { name: trimmedName }),
        );
        this.state.project.set({
          ...project,
          name: updatedProject.name,
          updatedAt: updatedProject.updatedAt,
        });
      }

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
      return true;
    } catch {
      return false;
    }
  }

  private async createNewWorkspace(): Promise<void> {
    const pendingStack = readPendingStackProfile();
    const stackProfile: StackProfile = normalizeStackProfile(pendingStack ?? undefined) ?? {
      ui: 'web-components',
    };
    clearPendingStackProfile();

    const pendingName = readPendingProjectName();
    clearPendingProjectName();

    const exportTargets = stackProfileToExportTargets(stackProfile);

    const project = await firstValueFrom(
      this.api.createProject({
        name: pendingName ?? 'Untitled Dashboard',
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
    const stackProfile: StackProfile = normalizeStackProfile(pendingStack ?? undefined) ?? {
      ui: 'web-components',
    };
    clearPendingStackProfile();

    const pendingName = readPendingProjectName();
    clearPendingProjectName();

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
      name: pendingName ?? 'Untitled Dashboard',
      composites: [composite],
      stackProfile,
      createdAt: now,
      updatedAt: now,
    };

    this.state.setProjectContext(project, composite);
    writeActiveStackProfile(stackProfile);
  }

  private async applySessionStackProfile(): Promise<void> {
    const pending = readPendingStackProfile();
    clearPendingStackProfile();
    if (!pending) {
      return;
    }

    const profile = normalizeStackProfile(pending);
    if (!profile) {
      return;
    }

    const project = this.state.project();
    if (!project) {
      return;
    }

    const current = normalizeStackProfile(project.stackProfile);
    if (current && this.stackProfilesEqual(current, profile)) {
      writeActiveStackProfile(profile);
      return;
    }

    this.applyStackProfileToState(profile);

    try {
      await firstValueFrom(this.api.updateProject(project.id, { stackProfile: profile }));
      const composite = this.state.composite();
      if (composite) {
        const updated = await firstValueFrom(
          this.api.updateComposite(project.id, composite.id, this.state.buildCompositePayload()),
        );
        this.state.composite.set(updated);
      }
    } catch {
      this.state.markDirty();
    }
  }

  private applyStackProfileToState(profile: StackProfile): void {
    const project = this.state.project();
    const composite = this.state.composite();
    if (!project || !composite) {
      return;
    }

    const exportTargets = stackProfileToExportTargets(profile);
    this.state.project.set({
      ...project,
      stackProfile: profile,
    });
    if (exportTargets) {
      this.state.composite.set({
        ...composite,
        exportTargets: {
          ...composite.exportTargets,
          ...exportTargets,
        },
      });
    }
    writeActiveStackProfile(profile);
    this.state.markDirty();
  }

  private stackProfilesEqual(left: StackProfile, right: StackProfile): boolean {
    return JSON.stringify(normalizeStackProfile(left)) === JSON.stringify(normalizeStackProfile(right));
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
