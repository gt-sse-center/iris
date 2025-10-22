import { request, ApiError } from "./client";
import { backendUrlCandidates } from "./base";
import {
  ImageInfoSummary,
  IrisAction,
  IrisConfig,
  IrisUser,
  PredictMaskPayload,
  SegmentationBootstrap
} from "./types";

export async function fetchCurrentUser(): Promise<IrisUser> {
  const data = await request<IrisUser>("/user/get/current");
  return data;
}

export async function loginUser(username: string, password: string): Promise<void> {
  await request<string>("/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password }),
    responseType: "text"
  });
}

export async function registerUser(username: string, password: string): Promise<void> {
  await request<string>("/user/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password }),
    responseType: "text"
  });
}

export async function fetchImageInfo(imageId: string): Promise<ImageInfoSummary> {
  return request<ImageInfoSummary>(`/image_info/${encodeURIComponent(imageId)}`);
}

export async function fetchActionInfo(imageId: string, actionType: string): Promise<IrisAction> {
  return request<IrisAction>(`/get_action_info/${encodeURIComponent(imageId)}/${encodeURIComponent(actionType)}`);
}

export async function updateActionInfo(actionId: number, payload: Partial<IrisAction>): Promise<void> {
  await request(`/set_action_info/${actionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchSegmentationBootstrap(imageId?: string | null): Promise<SegmentationBootstrap> {
  const suffix = imageId ? `?image_id=${encodeURIComponent(imageId)}` : "";
  const html = await request<string>(`/segmentation/${suffix}`, { responseType: "text" });
  const imageIdMatch = html.match(/'image_id'\s*:\s*(?:"([^"]+)"|([^\s,}]+))/);
  const locationMatch = html.match(/'image_location'\s*:\s*(\[[^\]]+\])/);

  if (!imageIdMatch) {
    throw new ApiError("Unable to parse image id from segmentation bootstrap response", 500);
  }

  const resolvedId = imageIdMatch[1] ?? imageIdMatch[2];
  let location: [number, number] = [0, 0];

  if (locationMatch) {
    try {
      const parsed = JSON.parse(locationMatch[1]);
      if (Array.isArray(parsed) && parsed.length === 2) {
        location = [Number(parsed[0]), Number(parsed[1])];
      }
    } catch {
      // Ignore parsing errors and keep default location
    }
  }

  return {
    imageId: resolvedId,
    imageLocation: location
  };
}

export interface LoadedMask {
  finalMask: Uint8Array;
  userMask: Uint8Array;
}

export async function loadMask(imageId: string): Promise<LoadedMask | null> {
  try {
  const buffer = await request<ArrayBuffer>(`/segmentation/load_mask/${encodeURIComponent(imageId)}`, {
      responseType: "arraybuffer"
    });
    const data = new Uint8Array(buffer);
    if (data.length < 4) {
      return null;
    }
    if (data[0] !== 254 || data[data.length - 1] !== 254) {
      return null;
    }

    const maskLength = (data.length - 2) / 2;
    const finalMask = data.slice(1, maskLength + 1);
    const userMask = data.slice(maskLength + 1, data.length - 1);
    return { finalMask, userMask };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveMask(imageId: string, payload: Uint8Array): Promise<void> {
  await request(`/segmentation/save_mask/${encodeURIComponent(imageId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    body: payload
  });
}

export async function predictMask(imageId: string, payload: PredictMaskPayload): Promise<Uint8Array> {
  const buffer = await request<ArrayBuffer>(`/segmentation/predict_mask/${encodeURIComponent(imageId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    responseType: "arraybuffer"
  });

  return new Uint8Array(buffer);
}

export async function fetchMetadata(imageId: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/metadata/${encodeURIComponent(imageId)}?safe_html=true`);
}

export async function fetchHelpContent(hotkeys: Record<string, string>): Promise<string> {
  return request<string>("/help/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hotkeys }),
    responseType: "text"
  });
}

export async function fetchConfig(user: IrisUser): Promise<IrisConfig | null> {
  if (user.config) {
    return user.config;
  }

  const refreshed = await fetchCurrentUser();
  return refreshed.config ?? null;
}

export async function fetchNextImageId(current: string): Promise<string> {
  let response: Response | null = null;
  let lastError: unknown = null;
  for (const url of backendUrlCandidates(`/segmentation/next_image?image_id=${encodeURIComponent(current)}`)) {
    try {
      response = await fetch(url, {
        credentials: "include"
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw lastError ?? new Error("Failed to load next image");
  }
  if (!response.ok) {
    throw new ApiError(response.statusText, response.status);
  }
  const url = new URL(response.url);
  const nextImageId = url.searchParams.get("image_id");
  if (!nextImageId) {
    throw new ApiError("Unable to determine next image id from redirect", 500);
  }
  return nextImageId;
}

export async function fetchPreviousImageId(current: string): Promise<string> {
  let response: Response | null = null;
  let lastError: unknown = null;
  for (const url of backendUrlCandidates(`/segmentation/previous_image?image_id=${encodeURIComponent(current)}`)) {
    try {
      response = await fetch(url, {
        credentials: "include"
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw lastError ?? new Error("Failed to load previous image");
  }
  if (!response.ok) {
    throw new ApiError(response.statusText, response.status);
  }
  const url = new URL(response.url);
  const previousImageId = url.searchParams.get("image_id");
  if (!previousImageId) {
    throw new ApiError("Unable to determine previous image id from redirect", 500);
  }
  return previousImageId;
}
