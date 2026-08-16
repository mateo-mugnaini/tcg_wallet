let acceptingRequests = true;

export function isAcceptingRequests() {
  return acceptingRequests;
}

export function markShuttingDown() {
  acceptingRequests = false;
}

export function resetAppState() {
  acceptingRequests = true;
}
