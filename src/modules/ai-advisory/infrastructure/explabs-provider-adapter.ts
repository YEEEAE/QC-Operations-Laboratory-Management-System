import { ENV_KEYS } from '../../../config/constants.js';
import { recordCounter, recordHistogram } from '../../../shared/observability/telemetry.js';
import type { StructuredLogger } from '../../../shared/observability/logger.js';
import type { AdvisoryDataClass } from '../ports/ai-provider.js';

const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 30_000;

export type ExLabsAvailabilityState =
  | 'DISABLED'
  | 'CONFIGURATION_MISSING'
  | 'POLICY_NOT_APPROVED'
  | 'CIRCUIT_OPEN'
  | 'HALF_OPEN'
  | 'AVAILABLE';

export interface ExLabsProviderConfiguration {
  enabled: boolean;
  baseUrl?: string;
  allowedOrigin?: string;
  apiKey?: string;
  requestTimeoutMs: number;
  profile: string;
}

export function parseExLabsProviderConfiguration(
  input: Record<string, string | undefined>,
): ExLabsProviderConfiguration {
  const rawTimeout = input[ENV_KEYS.explabsRequestTimeoutMs]?.trim();
  const parsedTimeout = rawTimeout ? Number(rawTimeout) : DEFAULT_TIMEOUT_MS;
  const validTimeout = Number.isInteger(parsedTimeout) && parsedTimeout >= 100 && parsedTimeout <= 30_000;
  return {
    enabled: input[ENV_KEYS.explabsEnabled]?.trim().toLowerCase() === 'true',
    ...(input[ENV_KEYS.explabsBaseUrl]?.trim()
      ? { baseUrl: input[ENV_KEYS.explabsBaseUrl]!.trim() }
      : {}),
    ...(input[ENV_KEYS.explabsAllowedOrigin]?.trim()
      ? { allowedOrigin: input[ENV_KEYS.explabsAllowedOrigin]!.trim() }
      : {}),
    ...(input[ENV_KEYS.explabsApiKey]?.trim()
      ? { apiKey: input[ENV_KEYS.explabsApiKey]!.trim() }
      : {}),
    requestTimeoutMs: validTimeout ? parsedTimeout : -1,
    profile: input.APP_ENVIRONMENT_PROFILE?.trim() || input.NODE_ENV?.trim() || 'development',
  };
}

export interface ExLabsAuthorization {
  /** References must point to owner-approved, controlled decisions and records. */
  sys11DecisionReference: string;
  providerContractReference: string;
  dataClassificationReference: string;
  consentReference: string;
  retentionReference: string;
  providerControlsReference: string;
  permittedDataClasses: readonly AdvisoryDataClass[];
}

export interface ExLabsRequestPlan {
  method: string;
  path: string;
  headers: HeadersInit;
  body?: string | Uint8Array;
  idempotent: boolean;
  dataClass: AdvisoryDataClass;
}

/**
 * A future, vendor-documented request contract. No default method, path,
 * authentication scheme, payload shape, or response model is supplied here.
 */
export interface ExLabsProviderContract<Input, Output> {
  providerSpecReference: string;
  buildRequest(input: Input): ExLabsRequestPlan;
  /** Applies only the authentication header documented by the approved spec. */
  applyAuthentication(headers: Headers, apiKey: string): void;
  decodeResponse(status: number, headers: Headers, body: Uint8Array): Output;
}

export interface ExLabsAvailability {
  state: ExLabsAvailabilityState;
  available: boolean;
}

export type ExLabsFailureKind =
  | 'NOT_CONFIGURED'
  | 'POLICY_NOT_APPROVED'
  | 'CIRCUIT_OPEN'
  | 'INVALID_TARGET'
  | 'REQUEST_TOO_LARGE'
  | 'RESPONSE_TOO_LARGE'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP_4XX'
  | 'HTTP_5XX'
  | 'INVALID_RESPONSE';

export class ExLabsProviderError extends Error {
  constructor(
    readonly kind: ExLabsFailureKind,
    readonly statusCode?: number,
  ) {
    super(`External provider request unavailable (${kind})`);
    this.name = 'ExLabsProviderError';
  }
}

/**
 * Server-only, opt-in HTTP boundary. It is intentionally not wired into
 * aiAdvisoryDependencies or any QC decision workflow. Construction alone
 * cannot activate it: configuration, owner authorization, and a verified
 * provider contract must all be supplied.
 */
export class ExLabsProviderAdapter {
  private consecutiveFailures = 0;
  private openedAt: number | undefined;
  private halfOpenProbeInFlight = false;

  constructor(
    private readonly configuration: ExLabsProviderConfiguration,
    private readonly authorization?: ExLabsAuthorization,
    private readonly contract?: ExLabsProviderContract<unknown, unknown>,
    private readonly logger?: StructuredLogger,
    private readonly now: () => number = Date.now,
  ) {}

  availability(): ExLabsAvailability {
    if (!this.configuration.enabled) return { state: 'DISABLED', available: false };
    if (!this.hasConfiguration()) return { state: 'CONFIGURATION_MISSING', available: false };
    if (!this.hasAuthorization()) return { state: 'POLICY_NOT_APPROVED', available: false };
    if (this.openedAt !== undefined) {
      if (this.now() - this.openedAt < CIRCUIT_OPEN_MS) {
        return { state: 'CIRCUIT_OPEN', available: false };
      }
      return { state: 'HALF_OPEN', available: !this.halfOpenProbeInFlight };
    }
    return { state: 'AVAILABLE', available: true };
  }

  async request<Input, Output>(
    input: Input,
    contract: ExLabsProviderContract<Input, Output> = this.contract as ExLabsProviderContract<Input, Output>,
  ): Promise<Output> {
    const availability = this.availability();
    if (!availability.available) {
      const kind = availability.state === 'POLICY_NOT_APPROVED'
        ? 'POLICY_NOT_APPROVED'
        : availability.state === 'CIRCUIT_OPEN' || availability.state === 'HALF_OPEN'
          ? 'CIRCUIT_OPEN'
          : 'NOT_CONFIGURED';
      throw new ExLabsProviderError(kind);
    }
    if (!contract || !this.configuration.apiKey || !this.authorization) {
      throw new ExLabsProviderError('POLICY_NOT_APPROVED');
    }

    let plan: ExLabsRequestPlan;
    let requestUrl: URL;
    let body: Uint8Array | undefined;
    try {
      plan = contract.buildRequest(input);
      this.assertPlan(plan, contract);
      requestUrl = this.resolveTarget(plan.path);
      body = plan.body === undefined ? undefined : toBytes(plan.body);
      const headers = new Headers(plan.headers);
      contract.applyAuthentication(headers, this.configuration.apiKey!);
      plan = { ...plan, headers };
    } catch (error) {
      if (error instanceof ExLabsProviderError) throw error;
      // A future vendor contract must not leak its exception text, headers, or input.
      throw new ExLabsProviderError('INVALID_RESPONSE');
    }
    if (body && body.byteLength > MAX_REQUEST_BYTES) {
      throw new ExLabsProviderError('REQUEST_TOO_LARGE');
    }

    const halfOpenProbe = this.openedAt !== undefined;
    if (halfOpenProbe) {
      if (this.halfOpenProbeInFlight) throw new ExLabsProviderError('CIRCUIT_OPEN');
      this.halfOpenProbeInFlight = true;
    }

    const startedAt = this.now();
    try {
      const attempts = plan.idempotent ? MAX_RETRIES + 1 : 1;
      let lastFailure: ExLabsProviderError | undefined;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const output = await this.fetchOnce(requestUrl, plan, body, contract);
          this.recordSuccess();
          recordHistogram('external_provider_request_duration_ms', this.now() - startedAt, {
            dependency: 'explabs',
            outcome: 'success',
          });
          return output;
        } catch (error) {
          const failure = error instanceof ExLabsProviderError
            ? error
            : new ExLabsProviderError('INVALID_RESPONSE');
          lastFailure = failure;
          if (attempt + 1 < attempts && isRetryable(failure)) continue;
          throw failure;
        }
      }
      throw lastFailure ?? new ExLabsProviderError('NETWORK');
    } catch (error) {
      const failure = error instanceof ExLabsProviderError
        ? error
        : new ExLabsProviderError('INVALID_RESPONSE');
      this.recordFailure(failure);
      recordCounter('external_provider_request_failures', 1, {
        dependency: 'explabs',
        error_family: failure.kind,
      });
      recordHistogram('external_provider_request_duration_ms', this.now() - startedAt, {
        dependency: 'explabs',
        outcome: 'error',
      });
      this.logger?.warn(
        {
          dependency: 'explabs',
          errorFamily: failure.kind,
          ...(failure.statusCode ? { statusCode: failure.statusCode } : {}),
        },
        'External provider request failed.',
      );
      throw failure;
    } finally {
      if (halfOpenProbe) this.halfOpenProbeInFlight = false;
    }
  }

  private hasConfiguration(): boolean {
    if (this.configuration.profile !== 'production') return false;
    if (!this.configuration.apiKey || !this.configuration.baseUrl || !this.configuration.allowedOrigin) return false;
    try {
      const base = new URL(this.configuration.baseUrl);
      const allowed = new URL(this.configuration.allowedOrigin);
      return (
        base.protocol === 'https:' &&
        allowed.protocol === 'https:' &&
        base.origin === allowed.origin &&
        allowed.origin === this.configuration.allowedOrigin &&
        !base.username && !base.password && !base.search && !base.hash &&
        this.configuration.requestTimeoutMs >= 100 &&
        this.configuration.requestTimeoutMs <= 30_000
      );
    } catch {
      return false;
    }
  }

  private hasAuthorization(): boolean {
    const authorization = this.authorization;
    const contract = this.contract;
    if (
      !authorization ||
      !contract ||
      typeof contract.providerSpecReference !== 'string' ||
      !contract.providerSpecReference.trim() ||
      !Array.isArray(authorization.permittedDataClasses)
    ) return false;
    return [
      authorization.sys11DecisionReference,
      authorization.providerContractReference,
      authorization.dataClassificationReference,
      authorization.consentReference,
      authorization.retentionReference,
      authorization.providerControlsReference,
    ].every((value) => typeof value === 'string' && value.trim().length > 0) &&
      authorization.permittedDataClasses.length > 0;
  }

  private assertPlan<Input, Output>(
    plan: ExLabsRequestPlan,
    contract: ExLabsProviderContract<Input, Output>,
  ): void {
    if (!contract.providerSpecReference.trim() || !this.hasAuthorization()) {
      throw new ExLabsProviderError('POLICY_NOT_APPROVED');
    }
    if (!this.authorization?.permittedDataClasses.includes(plan.dataClass)) {
      throw new ExLabsProviderError('POLICY_NOT_APPROVED');
    }
    if (!/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test(plan.method)) {
      throw new ExLabsProviderError('INVALID_TARGET');
    }
    if (plan.method.toUpperCase() === 'GET' || plan.method.toUpperCase() === 'HEAD') {
      if (plan.body !== undefined) throw new ExLabsProviderError('INVALID_TARGET');
    }
  }

  private resolveTarget(path: string): URL {
    try {
      const base = new URL(this.configuration.baseUrl!);
      if (!base.pathname.endsWith('/')) base.pathname += '/';
      const target = new URL(path, base);
      const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
      const inBasePath = target.pathname === base.pathname || target.pathname.startsWith(basePath);
      const secretQuery = [...target.searchParams.keys()].some((key) =>
        /(?:api[_-]?key|token|secret|credential|authorization)/i.test(key),
      );
      if (
        target.protocol !== 'https:' ||
        target.origin !== this.configuration.allowedOrigin ||
        target.origin !== base.origin ||
        !inBasePath ||
        target.username || target.password || target.hash || secretQuery
      ) throw new Error('invalid target');
      return target;
    } catch {
      throw new ExLabsProviderError('INVALID_TARGET');
    }
  }

  private async fetchOnce<Input, Output>(
    url: URL,
    plan: ExLabsRequestPlan,
    body: Uint8Array | undefined,
    contract: ExLabsProviderContract<Input, Output>,
  ): Promise<Output> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.configuration.requestTimeoutMs);
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: plan.method.toUpperCase(),
          headers: plan.headers,
          ...(body ? { body } : {}),
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'error',
          signal: controller.signal,
        });
      } catch {
        throw new ExLabsProviderError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK');
      }
      if (!response.ok) {
        throw new ExLabsProviderError(response.status >= 500 ? 'HTTP_5XX' : 'HTTP_4XX', response.status);
      }
      let responseBody: Uint8Array;
      try {
        responseBody = await readBoundedBody(response);
      } catch (error) {
        if (error instanceof ExLabsProviderError) throw error;
        throw new ExLabsProviderError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK');
      }
      try {
        return contract.decodeResponse(response.status, response.headers, responseBody);
      } catch {
        throw new ExLabsProviderError('INVALID_RESPONSE');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = undefined;
  }

  private recordFailure(error: ExLabsProviderError): void {
    if (error.kind === 'HTTP_4XX') {
      this.consecutiveFailures = 0;
      this.openedAt = undefined;
      return;
    }
    if (!isRetryable(error)) return;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) this.openedAt = this.now();
  }
}

function isRetryable(error: ExLabsProviderError): boolean {
  return error.kind === 'TIMEOUT' || error.kind === 'NETWORK' || error.kind === 'HTTP_5XX';
}

function toBytes(body: string | Uint8Array): Uint8Array {
  return typeof body === 'string' ? new TextEncoder().encode(body) : body;
}

async function readBoundedBody(response: Response): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ExLabsProviderError('RESPONSE_TOO_LARGE');
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
