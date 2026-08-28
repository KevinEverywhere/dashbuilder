export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function attr(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return escapeHtml(String(value));
}

export function jsonAttr(value: unknown): string {
  return escapeHtml(JSON.stringify(value));
}

export function ariaCurrentPage(current: boolean): string {
  return current ? ' aria-current="page"' : '';
}
