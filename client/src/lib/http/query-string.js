function isDefined(value) {
  return value !== undefined && value !== null && value !== "";
}

export function toQueryString(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (!isDefined(value)) return;

    if (Array.isArray(value)) {
      value.filter(isDefined).forEach((item) => params.append(key, item));
      return;
    }

    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
