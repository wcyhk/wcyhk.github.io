// Keep printed lowercase QR codes working after the game repository was renamed.
export function destinationFor(href) {
  const current = new URL(href);
  const wildPrefix = '/wild-doctor';
  if (current.pathname.toLowerCase() === wildPrefix || current.pathname.toLowerCase().startsWith(wildPrefix + '/')) {
    const suffix = current.pathname.slice(wildPrefix.length) || '/';
    const target = new URL('https://wild-doctor-wcyhk.onrender.com' + suffix);
    target.search = current.search;
    target.hash = current.hash;
    return target.href;
  }
  const prefix = '/qingming-hand-treasure';
  const path = current.pathname;
  let suffix;
  if (path === '/') suffix = '/';
  else if (path.toLowerCase() === prefix || path.toLowerCase().startsWith(prefix + '/')) suffix = path.slice(prefix.length) || '/';
  else return null;
  const target = new URL('https://wcy.hk/QingMing-Hand-Treasure' + suffix);
  target.search = current.search;
  target.hash = current.hash;
  return target.href === current.href ? null : target.href;
}

if (typeof window !== 'undefined') {
  const target = destinationFor(window.location.href);
  if (target) window.location.replace(target);
}
