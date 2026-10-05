import { cp, lstat, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Source content is reviewed, but escaping HTML alone does not make a URL safe.
export function validateHttpsURL(value, label = 'URL') {
  if (typeof value !== 'string' || /[\\\s\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} must be an absolute HTTPS URL without whitespace`);
  }
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error(`${label} must be an HTTPS URL without embedded credentials`);
  }
  return url;
}

export function validateAssetPath(file) {
  if (!/^assets\/(art|brand|css|fonts|js|kit|scarcity)\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(webp|png|jpe?g|svg|ico|css|js|woff2|ttf|txt|md|json|zip)$/.test(file)) {
    throw new Error(`Unapproved public asset path: ${file}`);
  }
}

// Call only for explicitly reviewed exports. Root compatibility images need the
// same symlink checks as assets so neither route can publish an outside file.
export async function publishRegularFile(root, destination, file) {
  if (typeof file !== 'string' || !/^(?:[a-zA-Z0-9][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(file)) {
    throw new Error(`Public file must have a safe relative path: ${file}`);
  }
  const parts = file.split('/');
  for (let i = 1; i <= parts.length; i++) {
    const info = await lstat(path.join(root, ...parts.slice(0, i)));
    if (info.isSymbolicLink() || (i === parts.length ? !info.isFile() : !info.isDirectory())) {
      throw new Error(`Public file must be a regular file without symlinks: ${file}`);
    }
  }
  const target = path.join(destination, file);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, file), target);
}

// Only the explicit asset manifest is published; format validation stays stricter
// than the shared copier because source art and nested private files are excluded.
export async function publishAssets(root, destination, files) {
  if (new Set(files).size !== files.length) throw new Error('Duplicate public asset');
  for (const file of files) {
    validateAssetPath(file);
    await publishRegularFile(root, destination, file);
  }
}
