/**
 * Identifier helpers.
 *
 * The centralized AI service stamps every call with a requestId; a future
 * session id will correlate a full assessment run. PRISM evaluation will use
 * these ids to group inputs/outputs per test case.
 */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
