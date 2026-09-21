import type { ImageSourcePropType } from "react-native";
import { icons } from "../constants/icons";

const ICONIFY_API = "https://api.iconify.design";
const ICONIFY_REQUEST_TIMEOUT_MS = 5000;

interface IconifySearchResponse {
  icons?: string[];
}

export async function resolveSubscriptionIcon(
  subscriptionName: string,
): Promise<ImageSourcePropType> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ICONIFY_REQUEST_TIMEOUT_MS,
  );

  try {
    const params = new URLSearchParams({
      query: subscriptionName,
      prefix: "simple-icons",
      limit: "32",
    });
    const response = await fetch(`${ICONIFY_API}/search?${params.toString()}`, {
      signal: controller.signal,
    });

    if (!response.ok) return icons.wallet;

    const result = (await response.json()) as IconifySearchResponse;
    const iconId = result.icons?.[0];
    if (!iconId) return icons.wallet;

    const [prefix, name] = iconId.split(":");
    if (!prefix || !name) return icons.wallet;

    return {
      uri: `${ICONIFY_API}/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg?width=64&height=64`,
    };
  } catch {
    return icons.wallet;
  } finally {
    clearTimeout(timeout);
  }
}
