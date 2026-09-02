<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DB_WASM_MEDIA_TAG,
		registerRdWasmMedia,
	} from '@rosettadash/web-components/visual/wasm/media';
	import {
		attachHostEvents,
		setHostAttribute,
		setHostProperty,
	} from '../../../lib/custom-element-host';
	import type { WasmMediaProps } from './types';

	let {
		label,
		operation,
		extractionMode,
		outputFormat,
		showProgress,
		cropX,
		cropY,
		cropWidth,
		cropHeight,
		outputWidth,
		outputHeight,
		yaw,
		pitch,
		horizontalFov,
		reverse,
		inputFile,
		cropRegion,
		recordRange,
		previewRecording,
		className,
		onProgress,
		onExtractComplete,
		onExtractError,
		onMetadata,
	}: WasmMediaProps = $props();

	let host: HTMLElement;
	let detachEvents = () => {};

	onMount(() => {
		registerRdWasmMedia();
		detachEvents = attachHostEvents(host, {
			progress: (detail) => onProgress?.(detail as { progress: number }),
			'extract-complete': (detail) =>
				onExtractComplete?.(
					detail as {
						blob: Blob;
						metadata: Record<string, string | number | boolean | null | undefined>;
					},
				),
			'extract-error': (detail) => onExtractError?.(detail as { message: string }),
			metadata: (detail) =>
				onMetadata?.(
					detail as Record<string, string | number | boolean | null | undefined>,
				),
		});
		return () => detachEvents();
	});

	$effect(() => {
		if (!host) {
			return;
		}
		setHostAttribute(host, 'label', label);
		setHostAttribute(host, 'operation', operation);
		setHostAttribute(host, 'extraction-mode', extractionMode);
		setHostAttribute(host, 'output-format', outputFormat);
		setHostAttribute(host, 'show-progress', showProgress);
		setHostAttribute(host, 'crop-x', cropX);
		setHostAttribute(host, 'crop-y', cropY);
		setHostAttribute(host, 'crop-width', cropWidth);
		setHostAttribute(host, 'crop-height', cropHeight);
		setHostAttribute(host, 'output-width', outputWidth);
		setHostAttribute(host, 'output-height', outputHeight);
		setHostAttribute(host, 'yaw', yaw);
		setHostAttribute(host, 'pitch', pitch);
		setHostAttribute(host, 'horizontal-fov', horizontalFov);
		setHostAttribute(host, 'reverse', reverse);
		setHostProperty(host, 'inputFile', inputFile);
		setHostProperty(host, 'cropRegion', cropRegion);
		setHostProperty(host, 'recordRange', recordRange);
		setHostProperty(host, 'previewRecording', previewRecording);
	});
</script>

<svelte:element this={DB_WASM_MEDIA_TAG} bind:this={host} class={className} />
