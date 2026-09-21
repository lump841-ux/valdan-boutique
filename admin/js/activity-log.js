/**
 * Writes a row to activity_logs. Fails silently (console only) — a logging
 * failure should never block the admin's actual save/publish action.
 */
async function vdLogActivity(action, entityType, entityId, details) {
  if (!window.sb || !window.vdCurrentAdmin) return;
  try {
    await window.sb.from('activity_logs').insert({
      admin_id: window.vdCurrentAdmin.id,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || {},
    });
  } catch (e) {
    console.warn('Activity log write failed:', e);
  }
}

function vdFormatActivity(row) {
  const who = row.admin_users?.full_name || row.admin_users?.email || 'An admin';
  const when = new Date(row.created_at).toLocaleString();
  const labels = {
    login: 'logged in',
    'hero_image.upload': 'uploaded a hero image',
    'hero_image.publish': 'published a hero image change',
    'hero_image.draft': 'saved a hero image draft',
    'product.create': 'created a product',
    'product.update': 'updated a product',
    'product.delete': 'deleted a product',
    'product.publish': 'published a product',
    'collection.create': 'created a collection',
    'collection.update': 'updated a collection',
    'collection.delete': 'deleted a collection',
    'content.publish': 'published website content changes',
    'media.delete': 'deleted a media file',
    'message.status': 'updated a contact message',
  };
  const label = labels[row.action] || row.action;
  return `${who} ${label} — ${when}`;
}
