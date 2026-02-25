import imageCompression from "browser-image-compression";

export async function compressAndConvertToWebP(file: File, prefix: string): Promise<File> {
  // Compress first
  const options = {
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: "image/webp" as const,
  };

  try {
    const compressed = await imageCompression(file, options);
    const cleanName = prefix.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const webpFile = new File([compressed], `${cleanName}-${Date.now()}.webp`, {
      type: "image/webp",
    });
    return webpFile;
  } catch {
    // Fallback: return original if compression fails
    return file;
  }
}
