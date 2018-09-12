"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var register_loader_js_1 = require("es-module-loader/core/register-loader.js");
var common_js_1 = require("./common.js");
var config_js_1 = require("./config.js");
function createMetadata() {
    return {
        pluginKey: undefined,
        pluginArgument: undefined,
        pluginModule: undefined,
        packageKey: undefined,
        packageConfig: undefined,
        load: undefined
    };
}
exports.createMetadata = createMetadata;
function getCoreParentMetadata(loader, config, parentKey) {
    var parentMetadata = createMetadata();
    if (parentKey) {
        var parentPluginIndex;
        if (config.pluginFirst) {
            if ((parentPluginIndex = parentKey.lastIndexOf('!')) !== -1)
                parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(0, parentPluginIndex);
        }
        else {
            if ((parentPluginIndex = parentKey.indexOf('!')) !== -1)
                parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(parentPluginIndex + 1);
        }
    }
    return parentMetadata;
}
function getParentMetadata(loader, config, parentKey) {
    var parentMetadata = createMetadata();
    if (parentKey) {
        var parentPluginIndex;
        if (config.pluginFirst) {
            if ((parentPluginIndex = parentKey.lastIndexOf('!')) !== -1)
                parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(0, parentPluginIndex);
        }
        else {
            if ((parentPluginIndex = parentKey.indexOf('!')) !== -1)
                parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(parentPluginIndex + 1);
        }
        parentMetadata.packageKey = common_js_1.getMapMatch(config.packages, parentKey);
        if (parentMetadata.packageKey)
            parentMetadata.packageConfig = config.packages[parentMetadata.packageKey];
    }
    return parentMetadata;
}
function normalize(key, parentKey) {
    var config = this[common_js_1.CONFIG];
    var metadata = createMetadata();
    var parentMetadata = getParentMetadata(this, config, parentKey);
    var loader = this;
    return Promise.resolve()
        .then(function () {
        var booleanIndex = key.lastIndexOf('#?');
        if (booleanIndex === -1)
            return Promise.resolve(key);
        var conditionObj = parseCondition.call(loader, key.substr(booleanIndex + 2));
        return resolveCondition.call(loader, conditionObj, parentKey, true)
            .then(function (conditionValue) {
            return conditionValue ? key.substr(0, booleanIndex) : '@empty';
        });
    })
        .then(function (key) {
        var parsed = parsePlugin(config.pluginFirst, key);
        if (!parsed)
            return packageResolve.call(loader, config, key, parentMetadata && parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, false);
        metadata.pluginKey = parsed.plugin;
        return Promise.all([
            packageResolve.call(loader, config, parsed.argument, parentMetadata && parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, true),
            loader.resolve(parsed.plugin, parentKey)
        ])
            .then(function (normalized) {
            metadata.pluginArgument = normalized[0];
            metadata.pluginKey = normalized[1];
            if (metadata.pluginArgument === metadata.pluginKey)
                throw new Error('Plugin ' + metadata.pluginArgument + ' cannot load itself, make sure it is excluded from any wildcard meta configuration via a custom loader: false rule.');
            return combinePluginParts(config.pluginFirst, normalized[0], normalized[1]);
        });
    })
        .then(function (normalized) {
        return interpolateConditional.call(loader, normalized, parentKey, parentMetadata);
    })
        .then(function (normalized) {
        setMeta.call(loader, config, normalized, metadata);
        if (metadata.pluginKey || !metadata.load.loader)
            return normalized;
        return loader.resolve(metadata.load.loader, normalized)
            .then(function (pluginKey) {
            metadata.pluginKey = pluginKey;
            metadata.pluginArgument = normalized;
            return normalized;
        });
    })
        .then(function (normalized) {
        loader[common_js_1.METADATA][normalized] = metadata;
        return normalized;
    });
}
exports.normalize = normalize;
function decanonicalize(config, key) {
    var parsed = parsePlugin(config.pluginFirst, key);
    if (parsed) {
        var pluginKey = decanonicalize.call(this, config, parsed.plugin);
        return combinePluginParts(config.pluginFirst, coreResolve.call(this, config, parsed.argument, undefined, false, false), pluginKey);
    }
    return coreResolve.call(this, config, key, undefined, false, false);
}
exports.decanonicalize = decanonicalize;
function normalizeSync(key, parentKey) {
    var config = this[common_js_1.CONFIG];
    var metadata = createMetadata();
    var parentMetadata = parentMetadata || getParentMetadata(this, config, parentKey);
    var parsed = parsePlugin(config.pluginFirst, key);
    if (parsed) {
        metadata.pluginKey = normalizeSync.call(this, parsed.plugin, parentKey);
        return combinePluginParts(config.pluginFirst, packageResolveSync.call(this, config, parsed.argument, parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, !!metadata.pluginKey), metadata.pluginKey);
    }
    return packageResolveSync.call(this, config, key, parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, !!metadata.pluginKey);
}
exports.normalizeSync = normalizeSync;
function coreResolve(config, key, parentKey, doMap, packageName) {
    var relativeResolved = common_js_1.resolveIfNotPlain(key, parentKey || common_js_1.baseURI);
    if (relativeResolved)
        return common_js_1.applyPaths(config.baseURL, config.paths, relativeResolved);
    if (doMap) {
        var mapMatch = common_js_1.getMapMatch(config.map, key);
        if (mapMatch) {
            key = config.map[mapMatch] + key.substr(mapMatch.length);
            relativeResolved = common_js_1.resolveIfNotPlain(key, common_js_1.baseURI);
            if (relativeResolved)
                return common_js_1.applyPaths(config.baseURL, config.paths, relativeResolved);
        }
    }
    if (this.registry.has(key))
        return key;
    if (key.substr(0, 6) === '@node/')
        return key;
    var trailingSlash = packageName && key[key.length - 1] !== '/';
    var resolved = common_js_1.applyPaths(config.baseURL, config.paths, trailingSlash ? key + '/' : key);
    if (trailingSlash)
        return resolved.substr(0, resolved.length - 1);
    return resolved;
}
exports.coreResolve = coreResolve;
function packageResolveSync(config, key, parentKey, metadata, parentMetadata, skipExtensions) {
    if (parentMetadata && parentMetadata.packageConfig && key[0] !== '.') {
        var parentMap = parentMetadata.packageConfig.map;
        var parentMapMatch = parentMap && common_js_1.getMapMatch(parentMap, key);
        if (parentMapMatch && typeof parentMap[parentMapMatch] === 'string') {
            var mapped = doMapSync(this, config, parentMetadata.packageConfig, parentMetadata.packageKey, parentMapMatch, key, metadata, skipExtensions);
            if (mapped)
                return mapped;
        }
    }
    var normalized = coreResolve.call(this, config, key, parentKey, true, true);
    var pkgConfigMatch = getPackageConfigMatch(config, normalized);
    metadata.packageKey = pkgConfigMatch && pkgConfigMatch.packageKey || common_js_1.getMapMatch(config.packages, normalized);
    if (!metadata.packageKey)
        return normalized;
    if (config.packageConfigKeys.indexOf(normalized) !== -1) {
        metadata.packageKey = undefined;
        return normalized;
    }
    metadata.packageConfig = config.packages[metadata.packageKey] || (config.packages[metadata.packageKey] = config_js_1.createPackage());
    var subPath = normalized.substr(metadata.packageKey.length + 1);
    return applyPackageConfigSync(this, config, metadata.packageConfig, metadata.packageKey, subPath, metadata, skipExtensions);
}
function packageResolve(config, key, parentKey, metadata, parentMetadata, skipExtensions) {
    var loader = this;
    return common_js_1.resolvedPromise
        .then(function () {
        if (parentMetadata && parentMetadata.packageConfig && key.substr(0, 2) !== './') {
            var parentMap = parentMetadata.packageConfig.map;
            var parentMapMatch = parentMap && common_js_1.getMapMatch(parentMap, key);
            if (parentMapMatch)
                return doMap(loader, config, parentMetadata.packageConfig, parentMetadata.packageKey, parentMapMatch, key, metadata, skipExtensions);
        }
        return common_js_1.resolvedPromise;
    })
        .then(function (mapped) {
        if (mapped)
            return mapped;
        var normalized = coreResolve.call(loader, config, key, parentKey, true, true);
        var pkgConfigMatch = getPackageConfigMatch(config, normalized);
        metadata.packageKey = pkgConfigMatch && pkgConfigMatch.packageKey || common_js_1.getMapMatch(config.packages, normalized);
        if (!metadata.packageKey)
            return Promise.resolve(normalized);
        if (config.packageConfigKeys.indexOf(normalized) !== -1) {
            metadata.packageKey = undefined;
            metadata.load = createMeta();
            metadata.load.format = 'json';
            metadata.load.loader = '';
            return Promise.resolve(normalized);
        }
        metadata.packageConfig = config.packages[metadata.packageKey] || (config.packages[metadata.packageKey] = config_js_1.createPackage());
        var loadConfig = pkgConfigMatch && !metadata.packageConfig.configured;
        return (loadConfig ? loadPackageConfigPath(loader, config, pkgConfigMatch.configPath, metadata) : common_js_1.resolvedPromise)
            .then(function () {
            var subPath = normalized.substr(metadata.packageKey.length + 1);
            return applyPackageConfig(loader, config, metadata.packageConfig, metadata.packageKey, subPath, metadata, skipExtensions);
        });
    });
}
function createMeta() {
    return {
        extension: '',
        deps: undefined,
        format: undefined,
        loader: undefined,
        scriptLoad: undefined,
        globals: undefined,
        nonce: undefined,
        integrity: undefined,
        sourceMap: undefined,
        exports: undefined,
        encapsulateGlobal: false,
        crossOrigin: undefined,
        cjsRequireDetection: true,
        cjsDeferDepsExecute: false,
        esModule: false
    };
}
function setMeta(config, key, metadata) {
    metadata.load = metadata.load || createMeta();
    var bestDepth = 0;
    var wildcardIndex;
    for (var module in config.meta) {
        wildcardIndex = module.indexOf('*');
        if (wildcardIndex === -1)
            continue;
        if (module.substr(0, wildcardIndex) === key.substr(0, wildcardIndex)
            && module.substr(wildcardIndex + 1) === key.substr(key.length - module.length + wildcardIndex + 1)) {
            var depth = module.split('/').length;
            if (depth > bestDepth)
                bestDepth = depth;
            common_js_1.extendMeta(metadata.load, config.meta[module], bestDepth !== depth);
        }
    }
    if (config.meta[key])
        common_js_1.extendMeta(metadata.load, config.meta[key], false);
    if (metadata.packageKey) {
        var subPath = key.substr(metadata.packageKey.length + 1);
        var meta = {};
        if (metadata.packageConfig.meta) {
            var bestDepth = 0;
            getMetaMatches(metadata.packageConfig.meta, subPath, function (metaPattern, matchMeta, matchDepth) {
                if (matchDepth > bestDepth)
                    bestDepth = matchDepth;
                common_js_1.extendMeta(meta, matchMeta, matchDepth && bestDepth > matchDepth);
            });
            common_js_1.extendMeta(metadata.load, meta, false);
        }
        if (metadata.packageConfig.format && !metadata.pluginKey && !metadata.load.loader)
            metadata.load.format = metadata.load.format || metadata.packageConfig.format;
    }
}
function parsePlugin(pluginFirst, key) {
    var argumentKey;
    var pluginKey;
    var pluginIndex = pluginFirst ? key.indexOf('!') : key.lastIndexOf('!');
    if (pluginIndex === -1)
        return;
    if (pluginFirst) {
        argumentKey = key.substr(pluginIndex + 1);
        pluginKey = key.substr(0, pluginIndex);
    }
    else {
        argumentKey = key.substr(0, pluginIndex);
        pluginKey = key.substr(pluginIndex + 1) || argumentKey.substr(argumentKey.lastIndexOf('.') + 1);
    }
    return {
        argument: argumentKey,
        plugin: pluginKey
    };
}
function combinePluginParts(pluginFirst, argumentKey, pluginKey) {
    if (pluginFirst)
        return pluginKey + '!' + argumentKey;
    else
        return argumentKey + '!' + pluginKey;
}
function addDefaultExtension(config, pkg, pkgKey, subPath, skipExtensions) {
    if (!subPath || !pkg.defaultExtension || subPath[subPath.length - 1] === '/' || skipExtensions)
        return subPath;
    var metaMatch = false;
    if (pkg.meta)
        getMetaMatches(pkg.meta, subPath, function (metaPattern, matchMeta, matchDepth) {
            if (matchDepth === 0 || metaPattern.lastIndexOf('*') !== metaPattern.length - 1)
                return metaMatch = true;
        });
    if (!metaMatch && config.meta)
        getMetaMatches(config.meta, pkgKey + '/' + subPath, function (metaPattern, matchMeta, matchDepth) {
            if (matchDepth === 0 || metaPattern.lastIndexOf('*') !== metaPattern.length - 1)
                return metaMatch = true;
        });
    if (metaMatch)
        return subPath;
    var defaultExtension = '.' + pkg.defaultExtension;
    if (subPath.substr(subPath.length - defaultExtension.length) !== defaultExtension)
        return subPath + defaultExtension;
    else
        return subPath;
}
function applyPackageConfigSync(loader, config, pkg, pkgKey, subPath, metadata, skipExtensions) {
    if (!subPath) {
        if (pkg.main)
            subPath = pkg.main.substr(0, 2) === './' ? pkg.main.substr(2) : pkg.main;
        else
            return pkgKey;
    }
    if (pkg.map) {
        var mapPath = './' + subPath;
        var mapMatch = common_js_1.getMapMatch(pkg.map, mapPath);
        if (!mapMatch) {
            mapPath = './' + addDefaultExtension(config, pkg, pkgKey, subPath, skipExtensions);
            if (mapPath !== './' + subPath)
                mapMatch = common_js_1.getMapMatch(pkg.map, mapPath);
        }
        if (mapMatch) {
            var mapped = doMapSync(loader, config, pkg, pkgKey, mapMatch, mapPath, metadata, skipExtensions);
            if (mapped)
                return mapped;
        }
    }
    return pkgKey + '/' + addDefaultExtension(config, pkg, pkgKey, subPath, skipExtensions);
}
function validMapping(mapMatch, mapped, path) {
    if (mapped.substr(0, mapMatch.length) === mapMatch && path.length > mapMatch.length)
        return false;
    return true;
}
function doMapSync(loader, config, pkg, pkgKey, mapMatch, path, metadata, skipExtensions) {
    if (path[path.length - 1] === '/')
        path = path.substr(0, path.length - 1);
    var mapped = pkg.map[mapMatch];
    if (typeof mapped === 'object')
        throw new Error('Synchronous conditional normalization not supported sync normalizing ' + mapMatch + ' in ' + pkgKey);
    if (!validMapping(mapMatch, mapped, path) || typeof mapped !== 'string')
        return;
    return packageResolveSync.call(loader, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions);
}
function applyPackageConfig(loader, config, pkg, pkgKey, subPath, metadata, skipExtensions) {
    if (!subPath) {
        if (pkg.main)
            subPath = pkg.main.substr(0, 2) === './' ? pkg.main.substr(2) : pkg.main;
        else
            return Promise.resolve(pkgKey);
    }
    var mapPath, mapMatch;
    if (pkg.map) {
        mapPath = './' + subPath;
        mapMatch = common_js_1.getMapMatch(pkg.map, mapPath);
        if (!mapMatch) {
            mapPath = './' + addDefaultExtension(config, pkg, pkgKey, subPath, skipExtensions);
            if (mapPath !== './' + subPath)
                mapMatch = common_js_1.getMapMatch(pkg.map, mapPath);
        }
    }
    return (mapMatch ? doMap(loader, config, pkg, pkgKey, mapMatch, mapPath, metadata, skipExtensions) : common_js_1.resolvedPromise)
        .then(function (mapped) {
        if (mapped)
            return Promise.resolve(mapped);
        return Promise.resolve(pkgKey + '/' + addDefaultExtension(config, pkg, pkgKey, subPath, skipExtensions));
    });
}
function doMap(loader, config, pkg, pkgKey, mapMatch, path, metadata, skipExtensions) {
    if (path[path.length - 1] === '/')
        path = path.substr(0, path.length - 1);
    var mapped = pkg.map[mapMatch];
    if (typeof mapped === 'string') {
        if (!validMapping(mapMatch, mapped, path))
            return common_js_1.resolvedPromise;
        return packageResolve.call(loader, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions)
            .then(function (normalized) {
            return interpolateConditional.call(loader, normalized, pkgKey + '/', metadata);
        });
    }
    var conditionPromises = [];
    var conditions = [];
    for (var e in mapped) {
        var c = parseCondition(e);
        conditions.push({
            condition: c,
            map: mapped[e]
        });
        conditionPromises.push(register_loader_js_1.default.prototype.import.call(loader, c.module, pkgKey));
    }
    return Promise.all(conditionPromises)
        .then(function (conditionValues) {
        for (var i = 0; i < conditions.length; i++) {
            var c = conditions[i].condition;
            var value = common_js_1.readMemberExpression(c.prop, '__useDefault' in conditionValues[i] ? conditionValues[i].__useDefault : conditionValues[i]);
            if (!c.negate && value || c.negate && !value)
                return conditions[i].map;
        }
    })
        .then(function (mapped) {
        if (mapped) {
            if (!validMapping(mapMatch, mapped, path))
                return common_js_1.resolvedPromise;
            return packageResolve.call(loader, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions)
                .then(function (normalized) {
                return interpolateConditional.call(loader, normalized, pkgKey + '/', metadata);
            });
        }
    });
}
var packageConfigPaths = {};
function createPkgConfigPathObj(path) {
    var lastWildcard = path.lastIndexOf('*');
    var length = Math.max(lastWildcard + 1, path.lastIndexOf('/'));
    return {
        length: length,
        regEx: new RegExp('^(' + path.substr(0, length).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^\\/]+') + ')(\\/|$)'),
        wildcard: lastWildcard !== -1
    };
}
function getPackageConfigMatch(config, normalized) {
    var pkgKey, exactMatch = false, configPath;
    for (var i = 0; i < config.packageConfigPaths.length; i++) {
        var packageConfigPath = config.packageConfigPaths[i];
        var p = packageConfigPaths[packageConfigPath] || (packageConfigPaths[packageConfigPath] = createPkgConfigPathObj(packageConfigPath));
        if (normalized.length < p.length)
            continue;
        var match = normalized.match(p.regEx);
        if (match && (!pkgKey || (!(exactMatch && p.wildcard) && pkgKey.length < match[1].length))) {
            pkgKey = match[1];
            exactMatch = !p.wildcard;
            configPath = pkgKey + packageConfigPath.substr(p.length);
        }
    }
    if (!pkgKey)
        return;
    return {
        packageKey: pkgKey,
        configPath: configPath
    };
}
function loadPackageConfigPath(loader, config, pkgConfigPath, metadata, normalized) {
    var configLoader = loader.pluginLoader || loader;
    if (config.packageConfigKeys.indexOf(pkgConfigPath) === -1)
        config.packageConfigKeys.push(pkgConfigPath);
    return configLoader.import(pkgConfigPath)
        .then(function (pkgConfig) {
        config_js_1.setPkgConfig(metadata.packageConfig, pkgConfig, metadata.packageKey, true, config);
        metadata.packageConfig.configured = true;
    })
        .catch(function (err) {
        throw common_js_1.addToError(err, 'Unable to fetch package configuration file ' + pkgConfigPath);
    });
}
function getMetaMatches(pkgMeta, subPath, matchFn) {
    var wildcardIndex;
    for (var module in pkgMeta) {
        var dotRel = module.substr(0, 2) === './' ? './' : '';
        if (dotRel)
            module = module.substr(2);
        wildcardIndex = module.indexOf('*');
        if (wildcardIndex === -1)
            continue;
        if (module.substr(0, wildcardIndex) === subPath.substr(0, wildcardIndex)
            && module.substr(wildcardIndex + 1) === subPath.substr(subPath.length - module.length + wildcardIndex + 1)) {
            if (matchFn(module, pkgMeta[dotRel + module], module.split('/').length))
                return;
        }
    }
    var exactMeta = pkgMeta[subPath] && Object.hasOwnProperty.call(pkgMeta, subPath) ? pkgMeta[subPath] : pkgMeta['./' + subPath];
    if (exactMeta)
        matchFn(exactMeta, exactMeta, 0);
}
var sysConditions = ['browser', 'node', 'dev', 'build', 'production', 'default'];
function parseCondition(condition) {
    var conditionExport, conditionModule, negation;
    var negation;
    var conditionExportIndex = condition.lastIndexOf('|');
    if (conditionExportIndex !== -1) {
        conditionExport = condition.substr(conditionExportIndex + 1);
        conditionModule = condition.substr(0, conditionExportIndex);
        if (conditionExport[0] === '~') {
            negation = true;
            conditionExport = conditionExport.substr(1);
        }
    }
    else {
        negation = condition[0] === '~';
        conditionExport = 'default';
        conditionModule = condition.substr(negation);
        if (sysConditions.indexOf(conditionModule) !== -1) {
            conditionExport = conditionModule;
            conditionModule = null;
        }
    }
    return {
        module: conditionModule || '@system-env',
        prop: conditionExport,
        negate: negation
    };
}
function resolveCondition(conditionObj, parentKey, bool) {
    return register_loader_js_1.default.prototype.import.call(this, conditionObj.module, parentKey)
        .then(function (condition) {
        var m = common_js_1.readMemberExpression(conditionObj.prop, condition);
        if (bool && typeof m !== 'boolean')
            throw new TypeError('Condition did not resolve to a boolean.');
        return conditionObj.negate ? !m : m;
    });
}
var interpolationRegEx = /#\{[^\}]+\}/;
function interpolateConditional(key, parentKey, parentMetadata) {
    var conditionalMatch = key.match(interpolationRegEx);
    if (!conditionalMatch)
        return Promise.resolve(key);
    var conditionObj = parseCondition.call(this, conditionalMatch[0].substr(2, conditionalMatch[0].length - 3));
    return resolveCondition.call(this, conditionObj, parentKey, false)
        .then(function (conditionValue) {
        if (typeof conditionValue !== 'string')
            throw new TypeError('The condition value for ' + key + ' doesn\'t resolve to a string.');
        if (conditionValue.indexOf('/') !== -1)
            throw new TypeError('Unabled to interpolate conditional ' + key + (parentKey ? ' in ' + parentKey : '') + '\n\tThe condition value ' + conditionValue + ' cannot contain a "/" separator.');
        return key.replace(interpolationRegEx, conditionValue);
    });
}
