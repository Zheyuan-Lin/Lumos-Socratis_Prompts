/**
 * Initializes app modes by cloning the provided configuration
 * @param config The configuration object to initialize from
 * @returns A deep clone of the configuration object
 */
export function initializeAppModes(config: any): any {
  return JSON.parse(JSON.stringify(config));
} 