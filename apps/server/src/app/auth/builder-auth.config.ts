export function isBuilderAuthEnabled(): boolean {
  return process.env['BUILDER_AUTH_ENABLED'] === 'true';
}

export function getBuilderApiKey(): string | undefined {
  const key = process.env['BUILDER_API_KEY'];
  return key && key.length > 0 ? key : undefined;
}

const PUBLIC_ROUTE_SUFFIXES = ['/health', '/auth/config', '/auth/login', '/news'];

export function isPublicBuilderRoute(path: string): boolean {
  const normalized = path.split('?')[0];
  if (normalized === '/' || normalized === '/api' || normalized === '') {
    return true;
  }
  return PUBLIC_ROUTE_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function extractBuilderApiKey(request: {
  headers: Record<string, string | string[] | undefined>;
}): string | undefined {
  const headerKey = request.headers['x-rosettadash-api-key'];
  if (typeof headerKey === 'string' && headerKey.length > 0) {
    return headerKey;
  }

  const authHeader = request.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    return token.length > 0 ? token : undefined;
  }

  return undefined;
}
