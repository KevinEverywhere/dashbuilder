<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
		registerRdEquirectSphereViewport,
		type EquirectSphereCameraChange,
		type EquirectSphereOutputSizeChange,
	} from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';
	import {
		attachHostEvents,
		setHostAttribute,
		setHostProperty,
	} from '../../../lib/custom-element-host';
	import type { EquirectSphereViewportProps } from './types';

	let {
		videoSrc,
		flipInterior,
		yaw,
		pitch,
		horizontalFov,
		outputWidth,
		outputHeight,
		minHorizontalFov,
		maxHorizontalFov,
		className,
		outputPreviewHost = null,
		resetExportReferenceToken,
		outputSizeCommitToken,
		onCameraChange,
		onOutputSizeChange,
	}: EquirectSphereViewportProps = $props();

	let host: HTMLElement;
	let detachEvents = () => {};

	export function play(): Promise<void> {
		return (host as EquirectSphereViewportProps & { play(): Promise<void> }).play?.() ?? Promise.resolve();
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
		registerRdEquirectSphereViewport();
		detachEvents = attachHostEvents(host, {
			'camera-change': (detail) => onCameraChange?.(detail as EquirectSphereCameraChange),
			'output-size-change': (detail) =>
				onOutputSizeChange?.(detail as EquirectSphereOutputSizeChange),
		});
		return () => detachEvents();
	});

	$effect(() => {
		if (!host) {
			return;
		}
		setHostAttribute(host, 'flip-interior', flipInterior);
		setHostAttribute(host, 'yaw', yaw);
		setHostAttribute(host, 'pitch', pitch);
		setHostAttribute(host, 'horizontal-fov', horizontalFov);
		setHostAttribute(host, 'min-horizontal-fov', minHorizontalFov);
		setHostAttribute(host, 'max-horizontal-fov', maxHorizontalFov);
	});

	$effect(() => {
		if (!host) {
			return;
		}
		setHostProperty(host, 'videoSrc', videoSrc ?? null);
	});

	$effect(() => {
		if (!host) {
			return;
		}
		setHostProperty(host, 'outputPreviewHost', outputPreviewHost);
	});

	$effect(() => {
		if (!host || !outputSizeCommitToken) {
			return;
		}
		untrack(() => {
			setHostAttribute(host, 'output-width', outputWidth);
			setHostAttribute(host, 'output-height', outputHeight);
		});
	});

	$effect(() => {
		if (!host || !resetExportReferenceToken) {
			return;
		}
		setHostProperty(host, 'resetExportReference', true);
	});
</script>

<svelte:element this={DB_EQUIRECT_SPHERE_VIEWPORT_TAG} bind:this={host} class={className} />
