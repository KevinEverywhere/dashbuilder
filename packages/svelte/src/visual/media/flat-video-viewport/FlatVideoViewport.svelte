<script lang="ts">
	import { onMount } from 'svelte';
	import type { FlatCropRect } from '@rosettadash/core';
	import {
		DB_FLAT_VIDEO_VIEWPORT_TAG,
		registerRdFlatVideoViewport,
	} from '@rosettadash/web-components/visual/media/flat-video-viewport';
	import {
		attachHostEvents,
		setHostAttribute,
		setHostProperty,
	} from '../../../lib/custom-element-host';
	import type { FlatVideoViewportProps } from './types';

	let {
		videoSrc,
		sourceWidth,
		sourceHeight,
		cropX,
		cropY,
		cropWidth,
		cropHeight,
		outputWidth,
		outputHeight,
		lockAspectRatio,
		className,
		outputPreviewHost = null,
		onCropChange,
	}: FlatVideoViewportProps = $props();

	let host: HTMLElement;
	let detachEvents = () => {};

	export function play(): Promise<void> {
		return (host as { play?: () => Promise<void> }).play?.() ?? Promise.resolve();
	}
	export function pause(): void {
		(host as { pause?: () => void }).pause?.();
	}
	export function stop(): void {
		(host as { stop?: () => void }).stop?.();
	}
	export function seek(time: number): void {
		(host as { seek?: (t: number) => void }).seek?.(time);
	}
	export function getCurrentTime(): number {
		return (host as { getCurrentTime?: () => number }).getCurrentTime?.() ?? 0;
	}
	export function getDuration(): number {
		return (host as { getDuration?: () => number }).getDuration?.() ?? 0;
	}
	export function isPaused(): boolean {
		return (host as { isPaused?: () => boolean }).isPaused?.() ?? true;
	}
	export function getOutputCanvas(): HTMLCanvasElement | null {
		return (host as { getOutputCanvas?: () => HTMLCanvasElement | null }).getOutputCanvas?.() ?? null;
	}
	export function startRecording(): boolean {
		return (host as { startRecording?: () => boolean }).startRecording?.() ?? false;
	}
	export function stopRecording(): Promise<Blob | null> {
		return (
			(host as { stopRecording?: () => Promise<Blob | null> }).stopRecording?.() ??
			Promise.resolve(null)
		);
	}

	onMount(() => {
		registerRdFlatVideoViewport();
		detachEvents = attachHostEvents(host, {
			'crop-change': (detail) => onCropChange?.(detail as FlatCropRect),
		});
		return () => detachEvents();
	});

	$effect(() => {
		if (!host) {
			return;
		}
		setHostAttribute(host, 'source-width', sourceWidth);
		setHostAttribute(host, 'source-height', sourceHeight);
		setHostAttribute(host, 'crop-x', cropX);
		setHostAttribute(host, 'crop-y', cropY);
		setHostAttribute(host, 'crop-width', cropWidth);
		setHostAttribute(host, 'crop-height', cropHeight);
		setHostAttribute(host, 'output-width', outputWidth);
		setHostAttribute(host, 'output-height', outputHeight);
		setHostAttribute(host, 'lock-aspect-ratio', lockAspectRatio);
		setHostProperty(host, 'videoSrc', videoSrc ?? null);
		setHostProperty(host, 'outputPreviewHost', outputPreviewHost);
	});
</script>

<svelte:element this={DB_FLAT_VIDEO_VIEWPORT_TAG} bind:this={host} class={className} />
