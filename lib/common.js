"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var resolve_js_1 = require("es-module-loader/core/resolve.js");
exports.resolveIfNotPlain = resolve_js_1.resolveIfNotPlain;
var common_js_1 = require("es-module-loader/core/common.js");
exports.baseURI = common_js_1.baseURI;
exports.isBrowser = common_js_1.isBrowser;
exports.isWindows = common_js_1.isWindows;
exports.addToError = common_js_1.addToError;
exports.global = common_js_1.global;
var loader_polyfill_js_1 = require("es-module-loader/core/loader-polyfill.js");
exports.ModuleNamespace = loader_polyfill_js_1.ModuleNamespace;
exports.resolvedPromise = Promise.resolve();
function noop() { }
exports.noop = noop;
;
exports.emptyModule = new loader_polyfill_js_1.ModuleNamespace({});
function protectedCreateNamespace(bindings) {
    if (bindings) {
        if (bindings instanceof loader_polyfill_js_1.ModuleNamespace || bindings[common_js_1.toStringTag] === 'module')
            return bindings;
        if (bindings.__esModule)
            return new loader_polyfill_js_1.ModuleNamespace(bindings);
    }
    return new loader_polyfill_js_1.ModuleNamespace({ default: bindings, __useDefault: bindings });
}
exports.protectedCreateNamespace = protectedCreateNamespace;
function isModule(m) {
    return m instanceof loader_polyfill_js_1.ModuleNamespace || m[common_js_1.toStringTag] === 'module';
}
exports.isModule = isModule;
exports.CONFIG = common_js_1.createSymbol('loader-config');
exports.METADATA = common_js_1.createSymbol('metadata');
exports.PLAIN_RESOLVE = common_js_1.createSymbol('plain-resolve');
exports.PLAIN_RESOLVE_SYNC = common_js_1.createSymbol('plain-resolve-sync');
exports.isWorker = typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts !== 'undefined';
function warn(msg, force) {
    if (force || this.warnings && typeof console !== 'undefined' && console.warn)
        console.warn(msg);
}
exports.warn = warn;
function checkInstantiateWasm(loader, wasmBuffer, processAnonRegister) {
    var bytes = new Uint8Array(wasmBuffer);
    if (bytes[0] === 0 && bytes[1] === 97 && bytes[2] === 115) {
        return WebAssembly.compile(wasmBuffer).then(function (m) {
            var deps = [];
            var setters = [];
            var importObj = {};
            if (WebAssembly.Module.imports)
                WebAssembly.Module.imports(m).forEach(function (i) {
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
                        _export(new WebAssembly.Instance(m, importObj).exports);
                    }
                };
            });
            processAnonRegister();
            return true;
        });
    }
    return Promise.resolve(false);
}
exports.checkInstantiateWasm = checkInstantiateWasm;
var parentModuleContext;
function loadNodeModule(key, baseURL) {
    if (key[0] === '.')
        throw new Error('Node module ' + key + ' can\'t be loaded as it is not a package require.');
    if (!parentModuleContext) {
        var Module = this._nodeRequire('module');
        var base = decodeURI(baseURL.substr(common_js_1.isWindows ? 8 : 7));
        parentModuleContext = new Module(base);
        parentModuleContext.paths = Module._nodeModulePaths(base);
    }
    return parentModuleContext.require(key);
}
exports.loadNodeModule = loadNodeModule;
function extend(a, b) {
    for (var p in b) {
        if (!Object.hasOwnProperty.call(b, p))
            continue;
        a[p] = b[p];
    }
    return a;
}
exports.extend = extend;
function prepend(a, b) {
    for (var p in b) {
        if (!Object.hasOwnProperty.call(b, p))
            continue;
        if (a[p] === undefined)
            a[p] = b[p];
    }
    return a;
}
exports.prepend = prepend;
function extendMeta(a, b, _prepend) {
    for (var p in b) {
        if (!Object.hasOwnProperty.call(b, p))
            continue;
        var val = b[p];
        if (a[p] === undefined)
            a[p] = val;
        else if (val instanceof Array && a[p] instanceof Array)
            a[p] = [].concat(_prepend ? val : a[p]).concat(_prepend ? a[p] : val);
        else if (typeof val == 'object' && val !== null && typeof a[p] == 'object')
            a[p] = (_prepend ? prepend : extend)(extend({}, a[p]), val);
        else if (!_prepend)
            a[p] = val;
    }
}
exports.extendMeta = extendMeta;
var supportsPreload = false, supportsPrefetch = false;
if (common_js_1.isBrowser)
    (function () {
        var relList = document.createElement('link').relList;
        if (relList && relList.supports) {
            supportsPrefetch = true;
            try {
                supportsPreload = relList.supports('preload');
            }
            catch (e) { }
        }
    })();
function preloadScript(url) {
    if (!supportsPreload && !supportsPrefetch) {
        var preloadImage = new Image();
        preloadImage.src = url;
        return;
    }
    var link = document.createElement('link');
    if (supportsPreload) {
        link.rel = 'preload';
        link.as = 'script';
    }
    else {
        link.rel = 'prefetch';
    }
    link.href = url;
    document.head.appendChild(link);
}
exports.preloadScript = preloadScript;
function workerImport(src, resolve, reject) {
    try {
        importScripts(src);
    }
    catch (e) {
        reject(e);
    }
    resolve();
}
if (common_js_1.isBrowser) {
    var onerror = window.onerror;
    window.onerror = function globalOnerror(msg, src) {
        if (onerror)
            onerror.apply(this, arguments);
    };
}
function scriptLoad(src, crossOrigin, integrity, resolve, reject) {
    src = src.replace(/#/g, '%23');
    if (exports.isWorker)
        return workerImport(src, resolve, reject);
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    if (crossOrigin)
        script.crossOrigin = crossOrigin;
    if (integrity)
        script.integrity = integrity;
    script.addEventListener('load', load, false);
    script.addEventListener('error', error, false);
    script.src = src;
    document.head.appendChild(script);
    function load() {
        resolve();
        cleanup();
    }
    function error(err) {
        cleanup();
        reject(new Error('Fetching ' + src));
    }
    function cleanup() {
        script.removeEventListener('load', load, false);
        script.removeEventListener('error', error, false);
        document.head.removeChild(script);
    }
}
exports.scriptLoad = scriptLoad;
function readMemberExpression(p, value) {
    var pParts = p.split('.');
    while (pParts.length)
        value = value[pParts.shift()];
    return value;
}
exports.readMemberExpression = readMemberExpression;
function applyPaths(baseURL, paths, key) {
    var mapMatch = getMapMatch(paths, key);
    if (mapMatch) {
        var target = paths[mapMatch] + key.substr(mapMatch.length);
        var resolved = resolve_js_1.resolveIfNotPlain(target, common_js_1.baseURI);
        if (resolved !== undefined)
            return resolved;
        return baseURL + target;
    }
    else if (key.indexOf(':') !== -1) {
        return key;
    }
    else {
        return baseURL + key;
    }
}
exports.applyPaths = applyPaths;
function checkMap(p) {
    var name = this.name;
    if (name.substr(0, p.length) === p && (name.length === p.length || name[p.length] === '/' || p[p.length - 1] === '/' || p[p.length - 1] === ':')) {
        var curLen = p.split('/').length;
        if (curLen > this.len) {
            this.match = p;
            this.len = curLen;
        }
    }
}
function getMapMatch(map, name) {
    if (Object.hasOwnProperty.call(map, name))
        return name;
    var bestMatch = {
        name: name,
        match: undefined,
        len: 0
    };
    Object.keys(map).forEach(checkMap, bestMatch);
    return bestMatch.match;
}
exports.getMapMatch = getMapMatch;
exports.cjsRequireRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)\s*\)/g;
