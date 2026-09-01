import { inject, Injectable, signal } from '@angular/core';
import {
  buildAiAssistSystemPrompt,
  defaultComponentRegistry,
  getAiProvider,
  getGroupingGuide,
  parseAiBuilderResponse,
  resolvePaletteGroups,
  validateAiBuilderActions,
  type AiBuilderContext,
  type AiBuilderResponse,
  type AiNodeSummary,
  type AiProviderId,
} from '@rosettadash/core';
import { readActiveStackProfile } from '../../welcome/stack-profile-session';
import { ByokTestConnectionService } from '../../environment/byok-test-connection.service';
import { CredentialValidationService } from '../../environment/credential-validation.service';
import { EnvironmentConfigService } from '../../environment/environment-config.service';
import { BuilderStateService } from '../builder-state.service';
import { FetchAiCompletionClient, type AiCompletionClient, type AiChatMessage } from './ai-completion-client';

export interface AiAssistMessage {
  role: 'user' | 'assistant';
  content: string;
  response?: AiBuilderResponse;
  error?: string;
}

export interface AiReadiness {
  ready: boolean;
  providerId: AiProviderId;
  providerLabel: string;
  model: string;
  freeLocal: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistService {
  private readonly state = inject(BuilderStateService);
  private readonly config = inject(EnvironmentConfigService);
  private readonly credentialValidation = inject(CredentialValidationService);
  private readonly testConnection = inject(ByokTestConnectionService);
  private client: AiCompletionClient = new FetchAiCompletionClient();

  readonly messages = signal<AiAssistMessage[]>([]);
  readonly pending = signal(false);
  readonly readiness = signal<AiReadiness | null>(null);

  setClient(client: AiCompletionClient): void {
    this.client = client;
  }

  resetClient(): void {
    this.client = new FetchAiCompletionClient();
  }

  async initialize(): Promise<void> {
    if (!this.config.loaded()) {
      await this.config.initialize();
    }
    this.readiness.set(await this.checkReadiness());
  }

  async refreshReadiness(): Promise<void> {
    this.readiness.set(await this.checkReadiness());
  }

  buildContext(): AiBuilderContext {
    const nodes = this.state.nodes();
    const summaries: AiNodeSummary[] = nodes.map((node) => {
      const definition = defaultComponentRegistry.get(node.type);
      const label =
        typeof node.properties['title'] === 'string'
          ? node.properties['title']
          : typeof node.properties['label'] === 'string'
            ? node.properties['label']
            : definition?.label ?? node.type;
      return {
        id: node.id,
        type: node.type,
        label,
        outputs: definition?.outputs.map((port) => port.id) ?? [],
        inputs: definition?.inputs.map((port) => port.id) ?? [],
      };
    });

    const selectedIds = new Set(this.state.selectedNodeIds());
    const groupingGuideHints = this.state
      .selectedNodeIds()
      .map((nodeId) => {
        const node = nodes.find((entry) => entry.id === nodeId);
        if (!node) {
          return null;
        }
        const guide = getGroupingGuide(node.type);
        return guide ? `${node.type}: ${guide.summary}` : null;
      })
      .filter((entry): entry is string => !!entry);

    return {
      stackProfile: readActiveStackProfile(),
      selectedNodeIds: this.state.selectedNodeIds(),
      selectedNodeSummaries: summaries.filter((node) => selectedIds.has(node.id)),
      canvasNodeCount: nodes.length,
      availableComponentTypes: defaultComponentRegistry.list().map((entry) => entry.type),
      paletteGroups: resolvePaletteGroups(defaultComponentRegistry).map((group) => group.id),
      groupingGuideHints,
    };
  }

  private nodeSummaries(): AiNodeSummary[] {
    return this.state.nodes().map((node) => {
      const definition = defaultComponentRegistry.get(node.type);
      const label =
        typeof node.properties['title'] === 'string'
          ? node.properties['title']
          : typeof node.properties['label'] === 'string'
            ? node.properties['label']
            : definition?.label ?? node.type;
      return {
        id: node.id,
        type: node.type,
        label,
        outputs: definition?.outputs.map((port) => port.id) ?? [],
        inputs: definition?.inputs.map((port) => port.id) ?? [],
      };
    });
  }

  async sendPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || this.pending()) {
      return;
    }

    const readiness = await this.checkReadiness();
    this.readiness.set(readiness);
    if (!readiness.ready) {
      this.messages.update((current) => [
        ...current,
        { role: 'user', content: trimmed },
        {
          role: 'assistant',
          content: readiness.message ?? 'Configure an AI provider on the Settings page.',
          error: readiness.message,
        },
      ]);
      return;
    }

    this.messages.update((current) => [...current, { role: 'user', content: trimmed }]);
    this.pending.set(true);

    try {
      const context = this.buildContext();
      const system = buildAiAssistSystemPrompt(context);
      const history: AiChatMessage[] = [{ role: 'system', content: system }];
      for (const message of this.messages()) {
        if (message.role === 'user') {
          history.push({ role: 'user', content: message.content });
          continue;
        }
        history.push({
          role: 'assistant',
          content: message.response ? JSON.stringify(message.response) : message.content,
        });
      }

      const byok = this.config.settings().byok;
      const provider = getAiProvider(byok.activeProvider);
      const raw = await this.client.complete({
        providerId: provider.id,
        model: byok.activeModel,
        apiKey: this.config.getValue(provider.apiKeyEnvKey),
        baseUrl: byok.customBaseUrl || this.config.getValue(`${provider.id.toUpperCase().replace(/-/g, '_')}_BASE_URL`) || provider.defaultBaseUrl,
        azureResourceName: byok.azureResourceName,
        azureDeploymentId: byok.azureDeploymentId,
        messages: history,
      });

      const response = parseAiBuilderResponse(raw);
      let validation;
      try {
        validation = validateAiBuilderActions(
          response.actions,
          defaultComponentRegistry,
          this.nodeSummaries(),
        );
      } catch (error) {
        const message = this.formatAssistError(error);
        this.messages.update((current) => [
          ...current,
          { role: 'assistant', content: message, error: message },
        ]);
        return;
      }

      this.messages.update((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.summary,
          response: validation.valid
            ? response
            : {
                ...response,
                summary: `${response.summary} (Some actions need fixes before apply.)`,
              },
          error: validation.valid
            ? undefined
            : validation.issues.map((issue) => issue.message).join(' '),
        },
      ]);
    } catch (error) {
      const message = this.formatAssistError(error);
      this.messages.update((current) => [
        ...current,
        { role: 'assistant', content: message, error: message },
      ]);
    } finally {
      this.pending.set(false);
    }
  }

  applyLatestResponse(): { ok: true } | { ok: false; error: string } {
    const latest = [...this.messages()].reverse().find((message) => message.response);
    if (!latest?.response) {
      return { ok: false, error: 'No AI response to apply.' };
    }

    const validation = validateAiBuilderActions(
      latest.response.actions,
      defaultComponentRegistry,
      this.nodeSummaries(),
    );
    if (!validation.valid) {
      return { ok: false, error: validation.issues.map((issue) => issue.message).join(' ') };
    }

    const result = this.state.applyAiActions(validation.applicableActions);
    if (!result.ok) {
      return result;
    }

    return { ok: true };
  }

  private formatAssistError(error: unknown): string {
    if (error instanceof SyntaxError) {
      return 'The model returned invalid JSON. Try a simpler, more specific request.';
    }
    if (error instanceof Error) {
      if (error.message.includes('AI response must include')) {
        return 'The model returned an incomplete response. Try again with a shorter prompt.';
      }
      if (/\.trim is not a function/.test(error.message)) {
        return 'The model returned actions in an unexpected format. Try rephrasing your request.';
      }
      return error.message;
    }
    return 'AI request failed. Check Settings and try again.';
  }

  private async checkReadiness(): Promise<AiReadiness> {
    const byok = this.config.settings().byok;
    const provider = getAiProvider(byok.activeProvider);
    const model = byok.activeModel || provider.models[0]?.id || '';
    const baseUrl =
      byok.customBaseUrl ||
      this.config.getValue(`${provider.id.toUpperCase().replace(/-/g, '_')}_BASE_URL`) ||
      provider.defaultBaseUrl;

    if (provider.id === 'ollama') {
      const test = await this.testConnection.testProvider({
        providerId: 'ollama',
        apiKey: '',
        baseUrl,
      });
      if (test.status !== 'success') {
        return {
          ready: false,
          providerId: provider.id,
          providerLabel: provider.label,
          model,
          freeLocal: true,
          message: 'Start Ollama locally, then run: ollama pull llama3.2',
        };
      }
      if (!model) {
        return {
          ready: false,
          providerId: provider.id,
          providerLabel: provider.label,
          model: '',
          freeLocal: true,
          message: 'Choose a local model on the Settings page (for example llama3.2).',
        };
      }
      return {
        ready: true,
        providerId: provider.id,
        providerLabel: provider.label,
        model,
        freeLocal: true,
      };
    }

    const hasKey =
      !provider.requiresApiKey || this.credentialValidation.providerHasStoredKey(provider.id);
    return {
      ready: hasKey,
      providerId: provider.id,
      providerLabel: provider.label,
      model,
      freeLocal: false,
      message: hasKey
        ? undefined
        : `Add your ${provider.label} API key on the Settings page (BYOK — you pay the provider, not RosettaDash).`,
    };
  }
}
