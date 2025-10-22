import { backendUrlCandidates } from "./base";

const DEFAULT_HEADERS: HeadersInit = {
  "X-Requested-With": "XMLHttpRequest"
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  responseType?: "json" | "arraybuffer" | "text";
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    credentials: "include",
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers ?? {})
    }
  };

  let response: Response | null = null;
  let lastError: unknown = null;
  for (const url of backendUrlCandidates(path)) {
    try {
      response = await fetch(url, init);
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw lastError ?? new Error("Failed to fetch");
  }

  if (!response.ok) {
    const detail = await safeReadError(response);
    throw new ApiError(detail ?? response.statusText, response.status);
  }

  const responseType = options.responseType ?? "json";

  if (responseType === "arraybuffer") {
    return (await response.arrayBuffer()) as T;
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

async function safeReadError(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text.length ? text : null;
  } catch (error) {
    return null;
  }
}
