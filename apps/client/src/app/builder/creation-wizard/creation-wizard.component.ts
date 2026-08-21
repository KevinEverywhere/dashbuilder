import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { paletteGroupColor } from '@rosettadash/core';
import { CreationWizardService } from './creation-wizard.service';

@Component({
  selector: 'app-creation-wizard',
  imports: [RouterLink],
  templateUrl: './creation-wizard.component.html',
  styleUrl: './creation-wizard.component.scss',
})
export class CreationWizardComponent {
  protected readonly wizard = inject(CreationWizardService);

  readonly aiAssistRequested = output<string>();
  readonly saveRequested = output<void>();
  readonly saveToLibraryRequested = output<void>();
  readonly exportRequested = output<void>();

  protected readonly stepColor = computed(() => {
    const groupId = this.wizard.highlightGroupId();
    return groupId ? paletteGroupColor(groupId) : null;
  });

  protected readonly dialogTitle = computed(() => {
    switch (this.wizard.phase()) {
      case 'mode-choice':
        return 'How would you like to start?';
      case 'self-explore':
        return 'Explore with built-in tips';
      case 'intent':
        return 'What are you building?';
      case 'extend':
        return 'Extend your dashboard';
      case 'steps':
        return this.wizard.activeGoal()?.label ?? 'Creation guide';
      case 'arrange':
        return 'Arrange & save';
      case 'ai-choice':
        return 'Optional AI assist';
      default:
        return 'Creation guide';
    }
  });

  protected close(): void {
    this.wizard.closeWizardWithHint();
  }

  protected dismiss(): void {
    this.wizard.closeWizardWithHint(true);
  }

  protected enableAi(): void {
    this.wizard.chooseAiAssist(true);
    this.aiAssistRequested.emit(this.wizard.aiPromptForGoal());
  }

  protected requestSave(): void {
    this.wizard.applyMetaComponentName(this.wizard.metaComponentName());
    this.saveRequested.emit();
  }

  protected requestSaveToLibrary(): void {
    this.wizard.applyMetaComponentName(this.wizard.metaComponentName());
    this.saveToLibraryRequested.emit();
  }

  protected requestExport(): void {
    this.wizard.applyMetaComponentName(this.wizard.metaComponentName());
    this.wizard.finishArrangeAndClose();
    this.exportRequested.emit();
  }
}
