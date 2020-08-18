export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export class Notes {
  static _base = 1 << 16;
  static new(...notes) {
    let value = Notes._base;
    for (const n of notes) {
      value |= 1 << n;
    }
    return value;
  }

  static isEmpty(value) {
    return value === this._base;
  }

  static size(value) {
    let s = 0;
    for (let n = 1; n <= 9; n++) {
      value = value >> 1;
      if ((value & 1) === 1) {
        s++;
      }
    }
    return s;
  }

  static first(value) {
    for (let n = 1; n <= 9; n++) {
      if (Notes.has(value, n)) {
        return n;
      }
    }
  }

  static entries(value) {
    const res = [];
    for (let n = 1; n <= 9; n++) {
      if (Notes.has(value, n)) {
        res.push(n);
      }
    }
    return res;
  }

  static is(value) {
    return (value & this._base) !== 0;
  }

  static has(value, n) {
    return Notes.is(value) && (value & (1 << n)) !== 0;
  }

  static add(value, n) {
    return value | (1 << n);
  }

  static delete(value, ...ns) {
    for (const n of ns) {
      value &= ~(1 << n);
    }
    return value;
  }
}
