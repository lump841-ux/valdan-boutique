/**
 * Shared image-upload pipeline used by Hero Images, Products, Collections,
 * and the Media Library. Handles validation, unique storage filenames,
 * dimension detection, and the media_assets row.
 */
const VD_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const VD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function vdValidateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!VD_ALLOWED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a JPG, PNG, or WEBP image.';
  }
  if (file.size > VD_MAX_BYTES) {
    return 'File must be smaller than 10 MB.';
  }
  return null;
}

function vdReadImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function vdSafeExtension(file) {
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return map[file.type] || 'jpg';
}

/**
 * Uploads a validated image to `bucket` under `folder/`, using a random
 * filename (never the original), and records it in media_assets.
 *
 * @param {string} bucket   'hero-images' | 'products' | 'collections' | 'media-library'
 * @param {string} folder   e.g. 'home' for hero images, or a product/collection id
 * @param {File}   file
 * @param {string} category 'hero' | 'product' | 'collection' | 'media-library'
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
async function vdUploadImage(bucket, folder, file, category, onProgress) {
  const validationError = vdValidateImageFile(file);
  if (validationError) return { data: null, error: validationError };
  if (!vdRequireSupabase()) return { data: null, error: 'Backend is not connected yet.' };

  const ext = vdSafeExtension(file);
  const uniqueName = (window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)) + '.' + ext;
  const path = folder ? folder + '/' + uniqueName : uniqueName;

  if (onProgress) onProgress(10);
  const dims = await vdReadImageDimensions(file);
  if (onProgress) onProgress(30);

  const { error: uploadError } = await window.sb.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) return { data: null, error: uploadError.message || 'Image could not be uploaded.' };
  if (onProgress) onProgress(75);

  const { data: pub } = window.sb.storage.from(bucket).getPublicUrl(path);
  const publicUrl = pub?.publicUrl;

  const { data: assetRow, error: dbError } = await window.sb
    .from('media_assets')
    .insert({
      storage_bucket: bucket,
      storage_path: path,
      public_url: publicUrl,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      width: dims.width,
      height: dims.height,
      category: category || 'media-library',
      uploaded_by: window.vdCurrentAdmin ? window.vdCurrentAdmin.id : null,
    })
    .select()
    .single();

  if (onProgress) onProgress(100);
  if (dbError) return { data: null, error: dbError.message };
  return { data: assetRow, error: null };
}

/** Checks whether a media asset is currently referenced anywhere. */
async function vdCheckMediaUsage(mediaAssetId) {
  const usages = [];
  const [heroRes, prodImgRes, prodPrimaryRes, collRes] = await Promise.all([
    window.sb.from('hero_images').select('page_slug, status').eq('media_asset_id', mediaAssetId),
    window.sb.from('product_images').select('product_id, products(name)').eq('media_asset_id', mediaAssetId),
    window.sb.from('collections').select('id, title, status').eq('media_asset_id', mediaAssetId),
  ]);
  (heroRes.data || []).forEach((h) => usages.push(`Hero image — ${h.page_slug} (${h.status})`));
  (prodImgRes.data || []).forEach((p) => usages.push(`Product photo — ${p.products?.name || p.product_id}`));
  (collRes.data || []).forEach((c) => usages.push(`Collection cover — ${c.title} (${c.status})`));
  return usages;
}

/** Deletes a media asset from storage + the database, after usage is clear. */
async function vdDeleteMediaAsset(assetRow) {
  await window.sb.storage.from(assetRow.storage_bucket).remove([assetRow.storage_path]);
  return window.sb.from('media_assets').delete().eq('id', assetRow.id);
}
