"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_js_1 = require("./common.js");
function fetchFetch(url, authorization, integrity, asBuffer) {
    if (url.substr(0, 8) === 'file:///') {
        if (hasXhr)
            return xhrFetch(url, authorization, integrity, asBuffer);
        else
            throw new Error('Unable to fetch file URLs in this environment.');
    }
    url = url.replace(/#/g, '%23');
    var opts = {
        headers: { Accept: 'application/x-es-module, */*' }
    };
    if (integrity)
        opts.integrity = integrity;
    if (authorization) {
        if (typeof authorization == 'string')
            opts.headers['Authorization'] = authorization;
        opts.credentials = 'include';
    }
    return fetch(url, opts)
        .then(function (res) {
        if (res.ok)
            return asBuffer ? res.arrayBuffer() : res.text();
        else
            throw new Error('Fetch error: ' + res.status + ' ' + res.statusText);
    });
}
function xhrFetch(url, authorization, _, asBuffer) {
    return new Promise(function (resolve, reject) {
        url = url.replace(/#/g, '%23');
        var xhr = new XMLHttpRequest();
        if (asBuffer)
            xhr.responseType = 'arraybuffer';
        function load() {
            resolve(asBuffer ? xhr.response : xhr.responseText);
        }
        function error() {
            reject(new Error('XHR error: ' + (xhr.status ? ' (' + xhr.status + (xhr.statusText ? ' ' + xhr.statusText : '') + ')' : '') + ' loading ' + url));
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status == 0) {
                    if (xhr.response) {
                        load();
                    }
                    else {
                        xhr.addEventListener('error', error);
                        xhr.addEventListener('load', load);
                    }
                }
                else if (xhr.status === 200) {
                    load();
                }
                else {
                    error();
                }
            }
        };
        xhr.open("GET", url, true);
        if (xhr.setRequestHeader) {
            xhr.setRequestHeader('Accept', 'application/x-es-module, */*');
            if (authorization) {
                if (typeof authorization == 'string')
                    xhr.setRequestHeader('Authorization', authorization);
                xhr.withCredentials = true;
            }
        }
        xhr.send(null);
    });
}
var fs;
function nodeFetch(url, authorization, integrity, asBuffer) {
    if (url.substr(0, 8) != 'file:///') {
        if (hasFetch)
            return fetchFetch(url, authorization, integrity, asBuffer);
        else
            return Promise.reject(new Error('Unable to fetch "' + url + '". Only file URLs of the form file:/// supported running in Node without fetch.'));
    }
    fs = fs || require('fs');
    if (common_js_1.isWindows)
        url = url.replace(/\//g, '\\').substr(8);
    else
        url = url.substr(7);
    return new Promise(function (resolve, reject) {
        fs.readFile(url, function (err, data) {
            if (err) {
                return reject(err);
            }
            else {
                if (asBuffer) {
                    resolve(data);
                }
                else {
                    var dataString = data + '';
                    if (dataString[0] === '\ufeff')
                        dataString = dataString.substr(1);
                    resolve(dataString);
                }
            }
        });
    });
}
function noFetch() {
    throw new Error('No fetch method is defined for this environment.');
}
var fetchFunction;
var hasXhr = typeof XMLHttpRequest !== 'undefined';
var hasFetch = typeof fetch !== 'undefined';
if (typeof self !== 'undefined' && typeof self.fetch !== 'undefined')
    fetchFunction = fetchFetch;
else if (hasXhr)
    fetchFunction = xhrFetch;
else if (typeof require !== 'undefined' && typeof process !== 'undefined')
    fetchFunction = nodeFetch;
else
    fetchFunction = noFetch;
exports.default = fetchFunction;
