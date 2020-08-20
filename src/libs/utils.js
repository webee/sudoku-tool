let debug = process.env.NODE_ENV !== 'production';
const nilFunc = () => {};
export const setDebug = () => {
  debug = true;
};

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

export const aggregateLinks = (links, order = 0, startName = 'start', endsName = 'ends') => {
  const s = {};
  for (const link of links) {
    const start = link[order];
    const end = link[(order + 1) % 2];
    const v = getAttrDefault(s, start, { [startName]: start, [endsName]: new Set() });
    v[endsName].add(end);
  }
  return s;
};

export function* findNGroupFromLinks(links, n, cls, options = { checkClear: true }) {
  const points = Object.values(aggregateLinks(links, cls));
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

export function* findALSFromPoints(points, n) {
  const m = n + 1;
  const xpoints = points.filter(p => p.ends.size <= m);

  for (const idxes of comb(xpoints.length, n)) {
    // check
    const starts = new Set();
    const ends = new Set();
    for (const idx of idxes) {
      const point = xpoints[idx];
      starts.add(point.start);
      point.ends.forEach(ends.add, ends);
      if (ends.size > m) {
        break;
      }
    }
    if (ends.size === m) {
      yield [starts, ends];
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
  enabled: true,
  ifEnabled(val, def) {
    return (this.enabled && val) || def;
  },
  get group() {
    return this.ifEnabled(debug && _console.group, nilFunc);
  },
  get groupEnd() {
    return this.ifEnabled(debug && _console.groupEnd, nilFunc);
  },
  get log() {
    return this.ifEnabled(debug && _console.log, nilFunc);
  },
  get error() {
    return this.ifEnabled(debug && _console.error, nilFunc);
  },
};

export const getAttrDefault = (obj, name, defVal) => {
  if (!obj.hasOwnProperty(name)) {
    obj[name] = defVal;
  }
  return obj[name];
};
export function shuffleArray(array) {
  const res = [...array];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export function intersection(setA, setB) {
  let _intersection = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

export class TimeoutConfirmer {
  constructor(timeout, confirmContinue) {
    this.timeout = timeout;
    this.confirmContinue = confirmContinue;
    // running time
    this.rt = 0;
    // start time
    this.st = new Date();
  }

  continue() {
    const ts = new Date() - this.st;
    if (ts >= this.timeout) {
      this.rt += ts;
      console.log(`running time: ${this.rt / 1000}s`);
      if (!this.confirmContinue(this.rt)) {
        return false;
      }
      // reset start time
      this.st = new Date();
    }
    return true;
  }
}
