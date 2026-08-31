import {
  formatPanHeading,
  headingFromPanOffset,
  wrapPeriod,
  wrapSignedDegrees,
} from './panorama-wrap';

describe('panorama-wrap', () => {
  it('wraps negative and overflow offsets onto the image period', () => {
    expect(wrapPeriod(40, 100)).toBe(40);
    expect(wrapPeriod(140, 100)).toBe(40);
    expect(wrapPeriod(-10, 100)).toBe(90);
    expect(wrapPeriod(0, 100)).toBe(0);
    expect(wrapPeriod(100, 100)).toBe(0);
  });

  it('does not treat 0 and a full period as a viewport-sized jump', () => {
    const width = 800;
    expect(wrapPeriod(width - 1, width)).toBe(width - 1);
    expect(wrapPeriod(width, width)).toBe(0);
    expect(wrapPeriod(width + 1, width)).toBe(1);
    expect(headingFromPanOffset(0, width)).toBe(0);
    expect(headingFromPanOffset(width, width)).toBe(0);
  });

  it('maps a half-image pan to 180°', () => {
    expect(headingFromPanOffset(640, 1280)).toBe(180);
    expect(formatPanHeading(180)).toBe('180°');
    expect(formatPanHeading(360)).toBe('0°');
    expect(formatPanHeading(-90)).toBe('270°');
  });

  it('wraps signed degrees onto the Destination Atlas slider range', () => {
    expect(wrapSignedDegrees(10)).toBe(10);
    expect(wrapSignedDegrees(370)).toBe(10);
    expect(wrapSignedDegrees(-20)).toBe(-20);
    expect(wrapSignedDegrees(181)).toBe(-179);
    expect(wrapSignedDegrees(-190)).toBe(170);
  });
});
