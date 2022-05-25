export default function iterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return [];
  }
  // if (typeof obj[Symbol.iterator] === 'function') {
  //   console.log('iterable ', obj);
  // } else {
  //   console.log('not iterable ', obj);
  // }
  return Array.isArray(obj) ? obj : typeof obj[Symbol.iterator] === 'function' ? [...obj] : [];
}