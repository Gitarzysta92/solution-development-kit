export type Result<T, E = unknown> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
export declare const ok: <T>(value: T) => Result<T, never>;
export declare const err: <E>(error: E) => Result<never, E>;
export declare const isOk: <T, E>(r: Result<T, E>) => r is {
    ok: true;
    value: T;
};
export declare const isErr: <T, E>(r: Result<T, E>) => r is {
    ok: false;
    error: E;
};
//# sourceMappingURL=result.d.ts.map