type ConfigValue = {
    value: string;
    optional?: boolean;
};
export type ApplicationShellConfig = Record<string, ConfigValue>;
type ApplicationShellWithInitialize<TInit> = {
    run: (fn: (data: TInit) => Promise<void>) => ApplicationShellWithRun<TInit>;
};
type ApplicationShellWithRun<TInit> = {
    catch: (fn: (err: unknown) => Promise<void>) => ApplicationShellWithCatch<TInit>;
    finally: (fn: (data: TInit) => Promise<void>) => ApplicationShellWithRun<TInit>;
};
type ApplicationShellWithCatch<TInit> = {
    finally: (fn: (data: TInit) => Promise<void>) => ApplicationShellWithCatch<TInit>;
};
export declare class ApplicationShell {
    private readonly config;
    private initializeFn;
    private runFn;
    private catchFn;
    private finallyFn;
    constructor(config: ApplicationShellConfig);
    initialize<TInit>(fn: (params: any) => Promise<TInit>): ApplicationShellWithInitialize<TInit>;
    private execute;
}
export {};
//# sourceMappingURL=application-shell.d.ts.map