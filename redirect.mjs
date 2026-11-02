// Keep printed lowercase QR codes working after the game repository was renamed.
export function destinationFor(href) {
  const current = new URL(href);
  const prefix = '/qingming-hand-treasure';
  const path = current.pathname;
  let suffix;
  if (path === '/') suffix = '/';
  else if (path.toLowerCase() === prefix || path.toLowerCase().startsWith(prefix + '/')) suffix = path.slice(prefix.length) || '/';
  else return null;
  const target = new URL('https://yuenhk.github.io/QingMing-Hand-Treasure' + suffix);
  target.search = current.search;
  target.hash = current.hash;
  return target.href === current.href ? null : target.href;
}

if (typeof window !== 'undefined') {
  const target = destinationFor(window.location.href);
  if (target) window.location.replace(target);
}
