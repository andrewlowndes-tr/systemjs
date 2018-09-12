"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_js_1 = require("./common.js");
function setHelpers(loader) {
    loader.set('@@cjs-helpers', loader.newModule({
        requireResolve: requireResolve.bind(loader),
        getPathVars: getPathVars
    }));
    loader.set('@@global-helpers', loader.newModule({
        prepareGlobal: prepareGlobal
    }));
}
exports.setHelpers = setHelpers;
function setAmdHelper(loader) {
    function require(names, callback, errback, referer) {
        if (typeof names === 'object' && !(names instanceof Array))
            return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));
        if (typeof names === 'string' && typeof callback === 'function')
            names = [names];
        if (names instanceof Array) {
            var dynamicRequires = [];
            for (var i = 0; i < names.length; i++)
                dynamicRequires.push(loader.import(names[i], referer));
            Promise.all(dynamicRequires).then(function (modules) {
                if (callback)
                    callback.apply(null, modules);
            }, errback);
        }
        else if (typeof names === 'string') {
            var normalized = loader.decanonicalize(names, referer);
            var module = loader.get(normalized);
            if (!module)
                throw new Error('Module not already loaded loading "' + names + '" as ' + normalized + (referer ? ' from "' + referer + '".' : '.'));
            return '__useDefault' in module ? module.__useDefault : module;
        }
        else
            throw new TypeError('Invalid require');
    }
    function define(name, deps, factory) {
        if (typeof name !== 'string') {
            factory = deps;
            deps = name;
            name = null;
        }
        if (!(deps instanceof Array)) {
            factory = deps;
            deps = ['require', 'exports', 'module'].splice(0, factory.length);
        }
        if (typeof factory !== 'function')
            factory = (function (factory) {
                return function () { return factory; };
            })(factory);
        if (!name) {
            if (curMetaDeps) {
                deps = deps.concat(curMetaDeps);
                curMetaDeps = undefined;
            }
        }
        var requireIndex, exportsIndex, moduleIndex;
        if ((requireIndex = deps.indexOf('require')) !== -1) {
            deps.splice(requireIndex, 1);
            if (!name)
                deps = deps.concat(amdGetCJSDeps(factory.toString(), requireIndex));
        }
        if ((exportsIndex = deps.indexOf('exports')) !== -1)
            deps.splice(exportsIndex, 1);
        if ((moduleIndex = deps.indexOf('module')) !== -1)
            deps.splice(moduleIndex, 1);
        function execute(req, exports, module) {
            var depValues = [];
            for (var i = 0; i < deps.length; i++)
                depValues.push(req(deps[i]));
            module.uri = module.id;
            module.config = common_js_1.noop;
            if (moduleIndex !== -1)
                depValues.splice(moduleIndex, 0, module);
            if (exportsIndex !== -1)
                depValues.splice(exportsIndex, 0, exports);
            if (requireIndex !== -1) {
                var contextualRequire = function (names, callback, errback) {
                    if (typeof names === 'string' && typeof callback !== 'function')
                        return req(names);
                    return require.call(loader, names, callback, errback, module.id);
                };
                contextualRequire.toUrl = function (name) {
                    return loader.normalizeSync(name, module.id);
                };
                depValues.splice(requireIndex, 0, contextualRequire);
            }
            var curRequire = common_js_1.global.require;
            common_js_1.global.require = require;
            var output = factory.apply(exportsIndex === -1 ? common_js_1.global : exports, depValues);
            common_js_1.global.require = curRequire;
            if (typeof output !== 'undefined')
                module.exports = output;
        }
        if (!name) {
            loader.registerDynamic(deps, false, curEsModule ? wrapEsModuleExecute(execute) : execute);
        }
        else {
            loader.registerDynamic(name, deps, false, execute);
            if (lastNamedDefine) {
                lastNamedDefine = undefined;
                multipleNamedDefines = true;
            }
            else if (!multipleNamedDefines) {
                lastNamedDefine = [deps, execute];
            }
        }
    }
    define.amd = {};
    loader.amdDefine = define;
    loader.amdRequire = require;
}
exports.setAmdHelper = setAmdHelper;
var windowOrigin;
if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.location)
    windowOrigin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
function stripOrigin(path) {
    if (path.substr(0, 8) === 'file:///')
        return path.substr(7 + !!common_js_1.isWindows);
    if (windowOrigin && path.substr(0, windowOrigin.length) === windowOrigin)
        return path.substr(windowOrigin.length);
    return path;
}
function requireResolve(request, parentId) {
    return stripOrigin(this.normalizeSync(request, parentId));
}
exports.requireResolve = requireResolve;
function getPathVars(moduleId) {
    var pluginIndex = moduleId.lastIndexOf('!');
    var filename;
    if (pluginIndex !== -1)
        filename = moduleId.substr(0, pluginIndex);
    else
        filename = moduleId;
    var dirname = filename.split('/');
    dirname.pop();
    dirname = dirname.join('/');
    return {
        filename: stripOrigin(filename),
        dirname: stripOrigin(dirname)
    };
}
exports.getPathVars = getPathVars;
var commentRegEx = /(^|[^\\])(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var stringRegEx = /("[^"\\\n\r]*(\\.[^"\\\n\r]*)*"|'[^'\\\n\r]*(\\.[^'\\\n\r]*)*')/g;
var hashBangRegEx = /^\#\!.*/;
function getCJSDeps(source) {
    common_js_1.cjsRequireRegEx.lastIndex = commentRegEx.lastIndex = stringRegEx.lastIndex = 0;
    var deps = [];
    var match;
    var stringLocations = [], commentLocations = [];
    function inLocation(locations, match) {
        for (var i = 0; i < locations.length; i++)
            if (locations[i][0] < match.index && locations[i][1] > match.index)
                return true;
        return false;
    }
    if (source.length / source.split('\n').length < 200) {
        while (match = stringRegEx.exec(source))
            stringLocations.push([match.index, match.index + match[0].length]);
        while (match = commentRegEx.exec(source)) {
            if (!inLocation(stringLocations, match))
                commentLocations.push([match.index + match[1].length, match.index + match[0].length - 1]);
        }
    }
    while (match = common_js_1.cjsRequireRegEx.exec(source)) {
        if (!inLocation(stringLocations, match) && !inLocation(commentLocations, match)) {
            var dep = match[1].substr(1, match[1].length - 2);
            if (dep.match(/"|'/))
                continue;
            deps.push(dep);
        }
    }
    return deps;
}
exports.getCJSDeps = getCJSDeps;
var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'frameElement', 'external',
    'mozAnimationStartTime', 'mozPaintCount', 'webkitStorageInfo', 'webkitIndexedDB', 'mozInnerScreenY', 'mozInnerScreenX'];
var globalSnapshot;
function globalIterator(globalName) {
    if (ignoredGlobalProps.indexOf(globalName) !== -1)
        return;
    try {
        var value = common_js_1.global[globalName];
    }
    catch (e) {
        ignoredGlobalProps.push(globalName);
    }
    this(globalName, value);
}
exports.globalIterator = globalIterator;
function getGlobalValue(exports) {
    if (typeof exports === 'string')
        return common_js_1.readMemberExpression(exports, common_js_1.global);
    if (!(exports instanceof Array))
        throw new Error('Global exports must be a string or array.');
    var globalValue = {};
    for (var i = 0; i < exports.length; i++)
        globalValue[exports[i].split('.').pop()] = common_js_1.readMemberExpression(exports[i], common_js_1.global);
    return globalValue;
}
exports.getGlobalValue = getGlobalValue;
function prepareGlobal(moduleName, exports, globals, encapsulate) {
    var curDefine = common_js_1.global.define;
    common_js_1.global.define = undefined;
    var oldGlobals;
    if (globals) {
        oldGlobals = {};
        for (var g in globals) {
            oldGlobals[g] = common_js_1.global[g];
            common_js_1.global[g] = globals[g];
        }
    }
    if (!exports) {
        globalSnapshot = {};
        Object.keys(common_js_1.global).forEach(globalIterator, function (name, value) {
            globalSnapshot[name] = value;
        });
    }
    return function () {
        var globalValue = exports ? getGlobalValue(exports) : {};
        var singleGlobal;
        var multipleExports = !!exports;
        if (!exports || encapsulate)
            Object.keys(common_js_1.global).forEach(globalIterator, function (name, value) {
                if (globalSnapshot[name] === value)
                    return;
                if (value === undefined)
                    return;
                if (encapsulate)
                    common_js_1.global[name] = undefined;
                if (!exports) {
                    globalValue[name] = value;
                    if (singleGlobal !== undefined) {
                        if (!multipleExports && singleGlobal !== value)
                            multipleExports = true;
                    }
                    else {
                        singleGlobal = value;
                    }
                }
            });
        globalValue = multipleExports ? globalValue : singleGlobal;
        if (oldGlobals) {
            for (var g in oldGlobals)
                common_js_1.global[g] = oldGlobals[g];
        }
        common_js_1.global.define = curDefine;
        return globalValue;
    };
}
exports.prepareGlobal = prepareGlobal;
var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
var fnBracketRegEx = /\(([^\)]*)\)/;
var wsRegEx = /^\s+|\s+$/g;
var requireRegExs = {};
function amdGetCJSDeps(source, requireIndex) {
    source = source.replace(commentRegEx, '');
    var params = source.match(fnBracketRegEx);
    var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');
    var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));
    requireRegEx.lastIndex = 0;
    var deps = [];
    var match;
    while (match = requireRegEx.exec(source))
        deps.push(match[2] || match[3]);
    return deps;
}
function wrapEsModuleExecute(execute) {
    return function (require, exports, module) {
        execute(require, exports, module);
        exports = module.exports;
        if ((typeof exports === 'object' || typeof exports === 'function') && !('__esModule' in exports))
            Object.defineProperty(module.exports, '__esModule', {
                value: true
            });
    };
}
var multipleNamedDefines = false;
var lastNamedDefine;
var curMetaDeps;
var curEsModule = false;
function clearLastDefine(metaDeps, esModule) {
    curMetaDeps = metaDeps;
    curEsModule = esModule;
    lastNamedDefine = undefined;
    multipleNamedDefines = false;
}
exports.clearLastDefine = clearLastDefine;
function registerLastDefine(loader) {
    if (lastNamedDefine)
        loader.registerDynamic(curMetaDeps ? lastNamedDefine[0].concat(curMetaDeps) : lastNamedDefine[0], false, curEsModule ? wrapEsModuleExecute(lastNamedDefine[1]) : lastNamedDefine[1]);
    else if (multipleNamedDefines)
        loader.registerDynamic([], false, common_js_1.noop);
}
exports.registerLastDefine = registerLastDefine;
