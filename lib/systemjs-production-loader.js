"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var loader_polyfill_js_1 = require("es-module-loader/core/loader-polyfill.js");
exports.ModuleNamespace = loader_polyfill_js_1.ModuleNamespace;
var register_loader_js_1 = require("es-module-loader/core/register-loader.js");
var common_js_1 = require("./common.js");
var format_helpers_js_1 = require("./format-helpers.js");
exports.default = SystemJSProductionLoader;
function SystemJSProductionLoader() {
    register_loader_js_1.default.call(this);
    this[common_js_1.CONFIG] = {
        baseURL: common_js_1.baseURI,
        paths: {},
        map: {},
        submap: {},
        depCache: {}
    };
    format_helpers_js_1.setAmdHelper(this);
    if (common_js_1.isBrowser)
        common_js_1.global.define = this.amdDefine;
}
SystemJSProductionLoader.plainResolve = common_js_1.PLAIN_RESOLVE;
SystemJSProductionLoader.plainResolveSync = common_js_1.PLAIN_RESOLVE_SYNC;
var systemJSPrototype = SystemJSProductionLoader.prototype = Object.create(register_loader_js_1.default.prototype);
systemJSPrototype.constructor = SystemJSProductionLoader;
systemJSPrototype[SystemJSProductionLoader.resolve = register_loader_js_1.default.resolve] = function (key, parentKey) {
    var resolved = common_js_1.resolveIfNotPlain(key, parentKey || common_js_1.baseURI);
    if (resolved !== undefined)
        return Promise.resolve(resolved);
    var loader = this;
    return common_js_1.resolvedPromise
        .then(function () {
        return loader[common_js_1.PLAIN_RESOLVE](key, parentKey);
    })
        .then(function (resolved) {
        resolved = resolved || key;
        if (loader.registry.has(resolved))
            return resolved;
        var config = loader[common_js_1.CONFIG];
        return common_js_1.applyPaths(config.baseURL, config.paths, resolved);
    });
};
systemJSPrototype.newModule = function (bindings) {
    return new loader_polyfill_js_1.ModuleNamespace(bindings);
};
systemJSPrototype.isModule = common_js_1.isModule;
systemJSPrototype.resolveSync = function (key, parentKey) {
    var resolved = common_js_1.resolveIfNotPlain(key, parentKey || common_js_1.baseURI);
    if (resolved !== undefined)
        return resolved;
    resolved = this[common_js_1.PLAIN_RESOLVE_SYNC](key, parentKey) || key;
    if (this.registry.has(resolved))
        return resolved;
    var config = this[common_js_1.CONFIG];
    return common_js_1.applyPaths(config.baseURL, config.paths, resolved);
};
systemJSPrototype[common_js_1.PLAIN_RESOLVE] = systemJSPrototype[common_js_1.PLAIN_RESOLVE_SYNC] = plainResolve;
systemJSPrototype[SystemJSProductionLoader.instantiate = register_loader_js_1.default.instantiate] = coreInstantiate;
systemJSPrototype.config = function (cfg) {
    var config = this[common_js_1.CONFIG];
    if (cfg.baseURL) {
        config.baseURL = common_js_1.resolveIfNotPlain(cfg.baseURL, common_js_1.baseURI) || common_js_1.resolveIfNotPlain('./' + cfg.baseURL, common_js_1.baseURI);
        if (config.baseURL[config.baseURL.length - 1] !== '/')
            config.baseURL += '/';
    }
    if (cfg.paths)
        common_js_1.extend(config.paths, cfg.paths);
    if (cfg.map) {
        var val = cfg.map;
        for (var p in val) {
            if (!Object.hasOwnProperty.call(val, p))
                continue;
            var v = val[p];
            if (typeof v === 'string') {
                config.map[p] = v;
            }
            else {
                var resolvedParent = common_js_1.resolveIfNotPlain(p, common_js_1.baseURI) || common_js_1.applyPaths(config.baseURL, config.paths, p);
                common_js_1.extend(config.submap[resolvedParent] || (config.submap[resolvedParent] = {}), v);
            }
        }
    }
    config.wasm = cfg.wasm === true;
    for (var p in cfg) {
        if (!Object.hasOwnProperty.call(cfg, p))
            continue;
        var val = cfg[p];
        switch (p) {
            case 'baseURL':
            case 'paths':
            case 'map':
            case 'wasm':
                break;
            case 'depCache':
                for (var p in val) {
                    if (!Object.hasOwnProperty.call(val, p))
                        continue;
                    var resolvedParent = this.resolveSync(p, undefined);
                    config.depCache[resolvedParent] = (config.depCache[resolvedParent] || []).concat(val[p]);
                }
                break;
            default:
                throw new TypeError('The SystemJS production build does not support the "' + p + '" configuration option.');
        }
    }
};
systemJSPrototype.getConfig = function (name) {
    var config = this[common_js_1.CONFIG];
    var map = {};
    common_js_1.extend(map, config.map);
    for (var p in config.submap) {
        if (!Object.hasOwnProperty.call(config.submap, p))
            continue;
        map[p] = common_js_1.extend({}, config.submap[p]);
    }
    var depCache = {};
    for (var p in config.depCache) {
        if (!Object.hasOwnProperty.call(config.depCache, p))
            continue;
        depCache[p] = [].concat(config.depCache[p]);
    }
    return {
        baseURL: config.baseURL,
        paths: common_js_1.extend({}, config.paths),
        depCache: depCache,
        map: map,
        wasm: config.wasm === true
    };
};
systemJSPrototype.register = function (key, deps, declare) {
    if (typeof key === 'string')
        key = this.resolveSync(key, undefined);
    return register_loader_js_1.default.prototype.register.call(this, key, deps, declare);
};
systemJSPrototype.registerDynamic = function (key, deps, executingRequire, execute) {
    if (typeof key === 'string')
        key = this.resolveSync(key, undefined);
    return register_loader_js_1.default.prototype.registerDynamic.call(this, key, deps, executingRequire, execute);
};
function plainResolve(key, parentKey) {
    var config = this[common_js_1.CONFIG];
    if (parentKey) {
        var parent = common_js_1.getMapMatch(config.submap, parentKey);
        var submap = config.submap[parent];
        var mapMatch = submap && common_js_1.getMapMatch(submap, key);
        if (mapMatch) {
            var target = submap[mapMatch] + key.substr(mapMatch.length);
            return common_js_1.resolveIfNotPlain(target, parent) || target;
        }
    }
    var map = config.map;
    var mapMatch = common_js_1.getMapMatch(map, key);
    if (mapMatch) {
        var target = map[mapMatch] + key.substr(mapMatch.length);
        return common_js_1.resolveIfNotPlain(target, parentKey || config.baseURL) || target;
    }
}
function instantiateWasm(loader, response, processAnonRegister) {
    return WebAssembly.compileStreaming(response).then(function (module) {
        var deps = [];
        var setters = [];
        var importObj = {};
        if (WebAssembly.Module.imports)
            WebAssembly.Module.imports(module).forEach(function (i) {
                var key = i.module;
                setters.push(function (m) {
                    importObj[key] = m;
                });
                if (deps.indexOf(key) === -1)
                    deps.push(key);
            });
        loader.register(deps, function (_export) {
            return {
                setters: setters,
                execute: function () {
                    _export(new WebAssembly.Instance(module, importObj).exports);
                }
            };
        });
        processAnonRegister();
    });
}
function doScriptLoad(loader, url, processAnonRegister) {
    Object.keys(common_js_1.global).forEach(format_helpers_js_1.globalIterator, function (name, value) {
        globalSnapshot[name] = value;
    });
    return new Promise(function (resolve, reject) {
        return common_js_1.scriptLoad(url, 'anonymous', undefined, function () {
            var registered = processAnonRegister();
            if (!registered) {
                format_helpers_js_1.registerLastDefine(loader);
                registered = processAnonRegister();
                if (!registered) {
                    var moduleValue = retrieveGlobal();
                    loader.register([], function () {
                        return {
                            exports: moduleValue
                        };
                    });
                    processAnonRegister();
                }
            }
            resolve();
        }, reject);
    });
}
function doEvalLoad(loader, url, source, processAnonRegister) {
    Object.keys(common_js_1.global).forEach(format_helpers_js_1.globalIterator, function (name, value) {
        globalSnapshot[name] = value;
    });
    (0, eval)(source + '\n//# sourceURL=' + url);
    var registered = processAnonRegister();
    if (!registered) {
        format_helpers_js_1.registerLastDefine(loader);
        registered = processAnonRegister();
        if (!registered) {
            var moduleValue = retrieveGlobal();
            loader.register([], function () {
                return {
                    exports: moduleValue
                };
            });
            processAnonRegister();
        }
    }
}
var globalSnapshot = {};
function retrieveGlobal() {
    var globalValue = { default: undefined };
    var multipleGlobals = false;
    var globalName = undefined;
    Object.keys(common_js_1.global).forEach(format_helpers_js_1.globalIterator, function (name, value) {
        if (globalSnapshot[name] === value)
            return;
        globalSnapshot[name] = value;
        if (value === undefined)
            return;
        if (multipleGlobals) {
            globalValue[name] = value;
        }
        else if (globalName) {
            if (globalValue.default !== value) {
                multipleGlobals = true;
                globalValue.__esModule = true;
                globalValue[globalName] = globalValue.default;
                globalValue[name] = value;
            }
        }
        else {
            globalValue.default = value;
            globalName = name;
        }
    });
    return globalValue;
}
function coreInstantiate(key, processAnonRegister) {
    var config = this[common_js_1.CONFIG];
    var depCache = config.depCache[key];
    if (depCache) {
        for (var i = 0; i < depCache.length; i++)
            this.resolve(depCache[i], key).then(common_js_1.preloadScript);
    }
    if (config.wasm) {
        var loader = this;
        return fetch(key)
            .then(function (res) {
            if (!res.ok)
                throw new Error('Fetch error: ' + res.status + ' ' + res.statusText);
            if (res.headers.get('content-type').indexOf('application/wasm') === -1) {
                return res.text()
                    .then(function (source) {
                    doEvalLoad(loader, key, source, processAnonRegister);
                });
            }
            return instantiateWasm(loader, res, processAnonRegister);
        });
    }
    return doScriptLoad(this, key, processAnonRegister);
}
