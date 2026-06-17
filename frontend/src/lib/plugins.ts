export const REQUIRED_PLUGINS = ["gmail", "googlecalendar"] as const;

export const allPluginsConnected = (
  plugins: Record<string, boolean> | undefined | null,
): boolean => {
  if (!plugins) return false;
  return REQUIRED_PLUGINS.every((pluginId) => plugins[pluginId] === true);
};
