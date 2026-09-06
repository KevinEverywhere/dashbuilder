export interface AuthoringOutputPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const AUTHORING_OUTPUT_PRESETS: AuthoringOutputPreset[] = [
  { id: '480x480', label: '480×480 (1:1)', width: 480, height: 480 },
  { id: '320x240', label: '320×240 (4:3)', width: 320, height: 240 },
  { id: '640x360', label: '640×360 (16:9)', width: 640, height: 360 },
  { id: '720x480', label: '720×480 (3:2)', width: 720, height: 480 },
];

/** Default flat Authoring export — matches 1:1 source/output viewport frames. */
export const AUTHORING_DEFAULT_OUTPUT_PRESET_ID = '480x480';

export const AUTHORING_OUTPUT_CUSTOM_ID = 'custom';

export function getAuthoringOutputPreset(id: string): AuthoringOutputPreset | undefined {
  return AUTHORING_OUTPUT_PRESETS.find((entry) => entry.id === id);
}
