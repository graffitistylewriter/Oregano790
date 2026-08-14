/*=========================================================
OREGANO 790
BOOTSTRAP GUARD
DEV-038 RUNTIME BOOTSTRAP HARDENING
=========================================================*/

export const createBootstrapGuard = (boot, key = "__oreganoBootstrapPromise") => {
    if (typeof boot !== "function") {
        throw new TypeError("Bootstrap guard requires a boot function.");
    }

    return scope => {
        if (!scope || (typeof scope !== "object" && typeof scope !== "function")) {
            return Promise.reject(new TypeError("Bootstrap guard requires a runtime scope."));
        }

        if (scope[key]) return scope[key];

        const promise = Promise.resolve().then(boot);
        scope[key] = promise;
        return promise;
    };
};
