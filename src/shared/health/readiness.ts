export interface ReadinessProbe {
  isReady(): Promise<boolean>;
}

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

export async function createReadinessResponse(probe: ReadinessProbe): Promise<Response> {
  const isReady = await probe.isReady();

  return new Response(JSON.stringify({ status: isReady ? 'healthy' : 'unhealthy' }), {
    status: isReady ? 200 : 503,
    headers: responseHeaders,
  });
}
