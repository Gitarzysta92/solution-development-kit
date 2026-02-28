export const ok = (value) => ({ ok: true, value });
export const err = (error) => ({ ok: false, error });
export const isOk = (r) => r.ok;
export const isErr = (r) => !r.ok;
//# sourceMappingURL=result.js.map