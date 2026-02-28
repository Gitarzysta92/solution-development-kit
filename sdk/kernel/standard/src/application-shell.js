import { __awaiter } from "tslib";
export class ApplicationShell {
    constructor(config) {
        this.config = config;
        this.initializeFn = null;
        this.runFn = null;
        this.catchFn = null;
        this.finallyFn = null;
    }
    initialize(fn) {
        this.initializeFn = fn;
        const self = this;
        return {
            run(runFn) {
                self.runFn = runFn;
                return {
                    catch(catchFn) {
                        self.catchFn = catchFn;
                        return {
                            finally(finallyFn) {
                                self.finallyFn = finallyFn;
                                self.execute();
                                return {
                                    finally: (fn) => {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    finally(finallyFn) {
                        self.finallyFn = finallyFn;
                        self.execute();
                        return {
                            catch: (fn) => {
                                return {};
                            },
                            finally: (fn) => {
                                return {};
                            }
                        };
                    }
                };
            }
        };
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let initializedData = null;
            try {
                if (!this.initializeFn) {
                    throw new Error('initialize() must be called before execute()');
                }
                const params = {};
                for (const [key, configValue] of Object.entries(this.config)) {
                    if (!configValue.optional && !configValue.value) {
                        throw new Error(`Required configuration value for '${key}' is missing`);
                    }
                    if (configValue.value) {
                        params[key] = configValue.value;
                    }
                }
                initializedData = yield this.initializeFn(params);
                if (this.runFn) {
                    yield this.runFn(initializedData);
                }
            }
            catch (err) {
                if (this.catchFn) {
                    yield this.catchFn(err);
                }
            }
            finally {
                if (this.finallyFn && initializedData) {
                    yield this.finallyFn(initializedData);
                }
            }
        });
    }
}
//# sourceMappingURL=application-shell.js.map