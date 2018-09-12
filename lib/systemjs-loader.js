"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var register_loader_js_1 = require("es-module-loader/core/register-loader.js");
var common_js_1 = require("./common.js");
var config_js_1 = require("./config.js");
var resolve_js_1 = require("./resolve.js");
var instantiate_js_1 = require("./instantiate.js");
var format_helpers_js_1 = require("./format-helpers.js");
exports.default = SystemJSLoader;
var scriptSrc;
if (typeof Promise === 'undefined')
    throw new Error('SystemJS needs a Promise polyfill.');
if (typeof document !== 'undefined') {
    var scripts = document.getElementsByTagName('script');
    var curScript = scripts[scripts.length - 1];
    if (document.currentScript && (curScript.defer || curScript.async))
        curScript = document.currentScript;
    scriptSrc = curScript && curScript.src;
}
else if (typeof importScripts !== 'undefined') {
    try {
        throw new Error('_');
    }
    catch (e) {
        e.stack.replace(/(?:at|@).*(http.+):[\d]+:[\d]+/, function (m, url) {
            scriptSrc = url;
        });
    }
}
else if (typeof __filename !== 'undefined') {
    scriptSrc = __filename;
}
function SystemJSLoader() {
    register_loader_js_1.default.call(this);
    this._loader = {};
    this[common_js_1.METADATA] = {};
    this[common_js_1.CONFIG] = {
        baseURL: common_js_1.baseURI,
        paths: {},
        packageConfigPaths: [],
        packageConfigKeys: [],
        map: {},
        packages: {},
        depCache: {},
        meta: {},
        bundles: {},
        production: false,
        transpiler: undefined,
        loadedBundles: {},
        warnings: false,
        pluginFirst: false,
        wasm: false
    };
    this.scriptSrc = scriptSrc;
    this._nodeRequire = instantiate_js_1.nodeRequire;
    this.registry.set('@empty', common_js_1.emptyModule);
    setProduction.call(this, false, false);
    format_helpers_js_1.setHelpers(this);
    format_helpers_js_1.setAmdHelper(this);
}
function setProduction(isProduction, isBuilder) {
    this[common_js_1.CONFIG].production = isProduction;
    this.registry.set('@system-env', exports.envModule = this.newModule({
        browser: common_js_1.isBrowser,
        node: !!this._nodeRequire,
        production: !isBuilder && isProduction,
        dev: isBuilder || !isProduction,
        build: isBuilder,
        'default': true
    }));
}
exports.setProduction = setProduction;
SystemJSLoader.prototype = Object.create(register_loader_js_1.default.prototype);
SystemJSLoader.prototype.constructor = SystemJSLoader;
SystemJSLoader.prototype[SystemJSLoader.resolve = register_loader_js_1.default.resolve] = SystemJSLoader.prototype.normalize = resolve_js_1.normalize;
SystemJSLoader.prototype.load = function (key, parentKey) {
    common_js_1.warn.call(this[common_js_1.CONFIG], 'System.load is deprecated.');
    return this.import(key, parentKey);
};
SystemJSLoader.prototype.decanonicalize = SystemJSLoader.prototype.normalizeSync = SystemJSLoader.prototype.resolveSync = resolve_js_1.normalizeSync;
SystemJSLoader.prototype[SystemJSLoader.instantiate = register_loader_js_1.default.instantiate] = instantiate_js_1.instantiate;
SystemJSLoader.prototype.config = config_js_1.setConfig;
SystemJSLoader.prototype.getConfig = config_js_1.getConfig;
SystemJSLoader.prototype.global = common_js_1.global;
SystemJSLoader.prototype.import = function () {
    return register_loader_js_1.default.prototype.import.apply(this, arguments)
        .then(function (m) {
        return '__useDefault' in m ? m.__useDefault : m;
    });
};
exports.configNames = ['baseURL', 'map', 'paths', 'packages', 'packageConfigPaths', 'depCache', 'meta', 'bundles', 'transpiler', 'warnings', 'pluginFirst', 'production', 'wasm'];
var hasProxy = typeof Proxy !== 'undefined';
for (var i = 0; i < exports.configNames.length; i++)
    (function (configName) {
        Object.defineProperty(SystemJSLoader.prototype, configName, {
            get: function () {
                var cfg = config_js_1.getConfigItem(this[common_js_1.CONFIG], configName);
                if (hasProxy && typeof cfg === 'object')
                    cfg = new Proxy(cfg, {
                        set: function (target, option) {
                            throw new Error('Cannot set SystemJS.' + configName + '["' + option + '"] directly. Use SystemJS.config({ ' + configName + ': { "' + option + '": ... } }) rather.');
                        }
                    });
                return cfg;
            },
            set: function (name) {
                throw new Error('Setting `SystemJS.' + configName + '` directly is no longer supported. Use `SystemJS.config({ ' + configName + ': ... })`.');
            }
        });
    })(exports.configNames[i]);
function registryWarn(loader, method) {
    common_js_1.warn.call(loader[common_js_1.CONFIG], 'SystemJS.' + method + ' is deprecated for SystemJS.registry.' + method);
}
SystemJSLoader.prototype.delete = function (key) {
    registryWarn(this, 'delete');
    return this.registry.delete(key);
};
SystemJSLoader.prototype.get = function (key) {
    registryWarn(this, 'get');
    return this.registry.get(key);
};
SystemJSLoader.prototype.has = function (key) {
    registryWarn(this, 'has');
    return this.registry.has(key);
};
SystemJSLoader.prototype.set = function (key, module) {
    registryWarn(this, 'set');
    return this.registry.set(key, module);
};
SystemJSLoader.prototype.newModule = function (bindings) {
    return new common_js_1.ModuleNamespace(bindings);
};
SystemJSLoader.prototype.isModule = common_js_1.isModule;
SystemJSLoader.prototype.register = function (key, deps, declare) {
    if (typeof key === 'string')
        key = resolve_js_1.decanonicalize.call(this, this[common_js_1.CONFIG], key);
    return register_loader_js_1.default.prototype.register.call(this, key, deps, declare);
};
SystemJSLoader.prototype.registerDynamic = function (key, deps, executingRequire, execute) {
    if (typeof key === 'string')
        key = resolve_js_1.decanonicalize.call(this, this[common_js_1.CONFIG], key);
    return register_loader_js_1.default.prototype.registerDynamic.call(this, key, deps, executingRequire, execute);
};
