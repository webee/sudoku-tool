const debug = process.env.NODE_ENV !== 'production';
const nilFunc = () => {};

function* combx(d, n, k) {
  if (n < k) {
  } else if (k === 1) {
    for (let i = d; i < n + d; i++) {
      yield [i];
    }
  } else if (n === k) {
    const res = [];
    for (let i = d; i < n + d; i++) {
      res.push(i);
    }
    yield res;
  } else {
    // with 0
    for (const res of combx(d + 1, n - 1, k - 1)) {
      yield [d, ...res];
    }
    // without 0
    yield* combx(d + 1, n - 1, k);
  }
}

export function* comb(n, k) {
  yield* combx(0, n, k);
}

export function* findNGroupFromLinks(links, n, order = 0, options = { checkClear: true }) {
  const s = {};
  for (const link of links) {
    const start = link[order];
    const end = link[(order + 1) % 2];
    const v = s[start] || { start, ends: new Set() };
    v.ends.add(end);
    s[start] = v;
  }
  const points = Object.values(s);
  const xpoints = points.filter(p => p.ends.size <= n);
  if (options.checkClear && points.length <= n) {
    // only return group if count(starts) > n
    return;
  }

  for (const idxes of comb(xpoints.length, n)) {
    // check
    const starts = new Set();
    const ends = new Set();
    for (const idx of idxes) {
      const point = xpoints[idx];
      starts.add(point.start);
      point.ends.forEach(ends.add, ends);
      if (ends.size > n) {
        break;
      }
    }
    if (ends.size === n) {
      let cleared = options.checkClear;
      if (cleared) {
        // n is 1, no need to check.
        // check if group is cleared
        for (const p of points.filter(p => !starts.has(p.start))) {
          if ([...p.ends].filter(e => !ends.has(e)).length < p.ends.size) {
            // other starts has end in ends
            // need clear
            cleared = false;
            break;
          }
        }
      }

      if (!cleared) {
        yield [starts, ends];
      }
    }
  }
}

const _store = {};
export const memorize = f => (...args) => {
  if (_store[f]) {
    _store[f] = { args: [], res: undefined };
  }
  const data = _store[f];
  if (!(data.args.length === args.length && data.args.reduce((r, arg, idx) => r && Object.is(arg, args[idx]), true))) {
    data.args = args;
    data.res = f(...args);
  }
  return data.res;
};

const _console = (window || global || {}).console || {};

export const console = {
  group: (debug && _console.group) || nilFunc,
  groupEnd: (debug && _console.groupEnd) || nilFunc,
  log: (debug && _console.log) || nilFunc,
  error: (debug && _console.error) || nilFunc,
};

export const getAttrDefault = (obj, name, defVal) => {
  if (obj[name] === undefined) {
    obj[name] = defVal;
  }
  return obj[name];
};
