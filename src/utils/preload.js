/**
 * Preload the font resource and add it to document.
 * @param {string} fontFamily font family name
 * @param {string | URL} url font resource URL
 * @param {AbortSignal?} signal abort signal to cancel the request
 */
export async function preloadFont(fontFamily, url, signal = undefined) {
  try {
    const response = await fetch(url, {
      headers: {
        "cache-control": "max-age=31536000",
      },
      signal,
    });
    const data = await response.arrayBuffer();
    const font = await new FontFace(fontFamily, data).load();
    document.fonts.add(font);
    console.info(`Font ${fontFamily} preload done.`);
  } catch (error) {
    console.error(error);
  }
}
