(function () {
    var ua = navigator.userAgent.toLowerCase(),
        S = {
        version: "3.0rc1",
        adapter: null,
        cache: [],
        client: {
            isIE: ua.indexOf("msie") > -1,
            isIE6: ua.indexOf("msie 6") > -1,
            isIE7: ua.indexOf("msie 7") > -1,
            isGecko: ua.indexOf("gecko") > -1 && ua.indexOf("safari") == -1,
            isWebkit: ua.indexOf("applewebkit/") > -1,
            isWindows: ua.indexOf("windows") > -1 || ua.indexOf("win32") > -1,
            isMac: ua.indexOf("macintosh") > -1 || ua.indexOf("mac os x") > -1,
            isLinux: ua.indexOf("linux") > -1
        },
        content: null,
        current: -1,
        dimensions: null,
        gallery: [],
        expando: "shadowboxCacheKey",
        libraries: {
            Prototype: "prototype",
            jQuery: "jquery",
            MooTools: "mootools",
            YAHOO: "yui",
            dojo: "dojo",
            Ext: "ext"
        },
        options: {
            adapter: null,
            animate: true,
            animateFade: true,
            autoplayMovies: true,
            continuous: false,
            ease: function (x) {
                return 1 + Math.pow(x - 1, 3)
            },
            enableKeys: true,
            errors: {
                fla: {
                    name: "Flash",
                    url: "http://www.adobe.com/products/flashplayer/"
                },
                qt: {
                    name: "QuickTime",
                    url: "http://www.apple.com/quicktime/download/"
                },
                wmp: {
                    name: "Windows Media Player",
                    url: "http://www.microsoft.com/windows/windowsmedia/"
                },
                f4m: {
                    name: "Flip4Mac",
                    url: "http://www.flip4mac.com/wmv_download.htm"
                }
            },
            ext: {
                img: ["png", "jpg", "jpeg", "gif", "bmp"],
                swf: ["swf"],
                flv: ["flv", "m4v"],
                qt: ["dv", "mov", "moov", "movie", "mp4"],
                wmp: ["asf", "wm", "wmv"],
                qtwmp: ["avi", "mpg", "mpeg"]
            },
            flashParams: {
                bgcolor: "#000000",
                allowfullscreen: true
            },
            flashVars: {},
            flashVersion: "9.0.115",
            handleOversize: "resize",
            handleUnsupported: "link",
            language: "en",
            onChange: null,
            onClose: null,
            onFinish: null,
            onOpen: null,
            players: ["img"],
            showMovieControls: true,
            skipSetup: false,
            slideshowDelay: 0,
            useSizzle: true,
            viewportPadding: 20
        },
        path: "",
        plugins: null,
        ready: false,
        regex: {
            domain: /:\/\/(.*?)[:\/]/,
            inline: /#(.+)$/,
            rel: /^(light|shadow)box/i,
            gallery: /^(light|shadow)box\[(.*?)\]/i,
            unsupported: /^unsupported-(\w+)/,
            param: /\s*([a-z_]*?)\s*=\s*(.+)\s*/
        },
        applyOptions: function (opts) {
            if (opts) {
                default_options = apply({},
                S.options);
                apply(S.options, opts)
            }
        },
        revertOptions: function () {
            apply(S.options, default_options)
        },
        change: function (index) {
            if (!S.gallery) {
                return
            }
            if (!S.gallery[index]) {
                if (!S.options.continuous) {
                    return
                } else {
                    index = index < 0 ? S.gallery.length - 1 : 0
                }
            }
            S.current = index;
            if (typeof slide_timer == "number") {
                clearTimeout(slide_timer);
                slide_timer = null;
                slide_delay = slide_start = 0
            }
            if (S.options.onChange) {
                S.options.onChange()
            }
            loadContent()
        },
        close: function () {
            if (!active) {
                return
            }
            active = false;
            listenKeys(false);
            if (S.content) {
                S.content.remove();
                S.content = null
            }
            if (typeof slide_timer == "number") {
                clearTimeout(slide_timer)
            }
            slide_timer = null;
            slide_delay = 0;
            if (S.options.onClose) {
                S.options.onClose()
            }
            S.skin.onClose();
            S.revertOptions()
        },
        contentId: function () {
            return content_id
        },
        error: function (msg) {
            if (!S.debug) {
                return
            }
            if (typeof window.console != "undefined" && typeof console.log == "function") {
                console.log(msg)
            } else {
                alert(msg)
            }
        },
        getCurrent: function () {
            return S.current > -1 ? S.gallery[S.current] : null
        },
        hasNext: function () {
            return S.gallery.length > 1 && (S.current != S.gallery.length - 1 || S.options.continuous)
        },
        init: function (opts) {
            if (initialized) {
                return
            }
            initialized = true;
            opts = opts || {};
            init_options = opts;
            if (opts) {
                apply(S.options, opts)
            }
            for (var e in S.options.ext) {
                S.regex[e] = new RegExp(".(" + S.options.ext[e].join("|") + ")s*$", "i")
            }
            if (!S.path) {
                var pathre = /(.+\/)shadowbox\.js/i,
                    path;
                each(document.getElementsByTagName("script"), function (s) {
                    path = pathre.exec(s.src);
                    if (path) {
                        S.path = path[1];
                        return false
                    }
                })
            }
            if (S.options.adapter) {
                S.adapter = S.options.adapter.toLowerCase()
            } else {
                for (var lib in S.libraries) {
                    if (typeof window[lib] != "undefined") {
                        S.adapter = S.libraries[lib];
                        break
                    }
                }
                if (!S.adapter) {
                    S.adapter = "base"
                }
            }
            if (S.options.useSizzle && !window.Sizzle) {
                if (window.jQuery) {
                    window.Sizzle = jQuery.find
                } else {
                    U.include(S.path + "libraries/sizzle/sizzle.js")
                }
            }
            if (!S.lang) {
                U.include(S.path + "languages/shadowbox-" + S.options.language + ".js")
            }
            each(S.options.players, function (p) {
                if ((p == "swf" || p == "flv") && !window.swfobject) {
                    U.include(S.path + "libraries/swfobject/swfobject.js")
                }
                if (!S[p]) {
                    U.include(S.path + "players/shadowbox-" + p + ".js")
                }
            });
            if (!S.lib) {
                U.include(S.path + "adapters/shadowbox-" + S.adapter + ".js")
            }
            waitDom(waitLibs)
        },
        isActive: function () {
            return active
        },
        isPaused: function () {
            return slide_timer == "paused"
        },
        load: function () {
            if (S.ready) {
                return
            }
            S.ready = true;
            if (S.skin.options) {
                apply(S.options, S.skin.options);
                apply(S.options, init_options)
            }
            S.skin.init();
            if (!S.options.skipSetup) {
                S.setup()
            }
        },
        next: function () {
            S.change(S.current + 1)
        },
        open: function (obj) {
            if (U.isLink(obj)) {
                if (S.inCache(obj)) {
                    obj = S.cache[obj[S.expando]]
                } else {
                    obj = S.buildCacheObj(obj)
                }
            }
            if (obj.constructor == Array) {
                S.gallery = obj;
                S.current = 0
            } else {
                if (!obj.gallery) {
                    S.gallery = [obj];
                    S.current = 0
                } else {
                    S.current = null;
                    S.gallery = [];
                    each(S.cache, function (c) {
                        if (c.gallery && c.gallery == obj.gallery) {
                            if (S.current == null && c.content == obj.content && c.title == obj.title) {
                                S.current = S.gallery.length
                            }
                            S.gallery.push(c)
                        }
                    });
                    if (S.current == null) {
                        S.gallery.unshift(obj);
                        S.current = 0
                    }
                }
            }
            obj = S.getCurrent();
            if (obj.options) {
                S.revertOptions();
                S.applyOptions(obj.options)
            }
            var item, remove, m, format, replace, oe = S.options.errors,
                msg, el;
            for (var i = 0; i < S.gallery.length; ++i) {
                item = S.gallery[i] = apply({},
                S.gallery[i]);
                remove = false;
                if (m = S.regex.unsupported.exec(item.player)) {
                    if (S.options.handleUnsupported == "link") {
                        item.player = "html";
                        switch (m[1]) {
                        case "qtwmp":
                            format = "either";
                            replace = [oe.qt.url, oe.qt.name, oe.wmp.url, oe.wmp.name];
                            break;
                        case "qtf4m":
                            format = "shared";
                            replace = [oe.qt.url, oe.qt.name, oe.f4m.url, oe.f4m.name];
                            break;
                        default:
                            format = "single";
                            if (m[1] == "swf" || m[1] == "flv") {
                                m[1] = "fla"
                            }
                            replace = [oe[m[1]].url, oe[m[1]].name]
                        }
                        msg = S.lang.errors[format].replace(/\{(\d+)\}/g, function (m, n) {
                            return replace[n]
                        });
                        item.content = '<div class="sb-message">' + msg + "</div>"
                    } else {
                        remove = true
                    }
                } else {
                    if (item.player == "inline") {
                        m = S.regex.inline.exec(item.content);
                        if (m) {
                            var el = U.get(m[1]);
                            if (el) {
                                item.content = el.innerHTML
                            } else {
                                S.error("Cannot find element with id " + m[1])
                            }
                        } else {
                            S.error("Cannot find element id for inline content")
                        }
                    } else {
                        if (item.player == "swf" || item.player == "flv") {
                            var version = (item.options && item.options.flashVersion) || S.options.flashVersion;
                            if (!swfobject.hasFlashPlayerVersion(version)) {
                                item.width = 310;
                                item.height = 177
                            }
                        }
                    }
                }
                if (remove) {
                    S.gallery.splice(i, 1);
                    if (i < S.current) {
                        --S.current
                    } else {
                        if (i == S.current) {
                            S.current = i > 0 ? i - 1 : i
                        }
                    }--i
                }
            }
            if (S.gallery.length) {
                if (!active) {
                    if (typeof S.options.onOpen == "function" && S.options.onOpen(obj) === false) {
                        return
                    }
                    S.skin.onOpen(obj, loadContent)
                } else {
                    loadContent()
                }
                active = true
            }
        },
        pause: function () {
            if (typeof slide_timer != "number") {
                return
            }
            var time = new Date().getTime();
            slide_delay = Math.max(0, slide_delay - (time - slide_start));
            if (slide_delay) {
                clearTimeout(slide_timer);
                slide_timer = "paused";
                if (S.skin.onPause) {
                    S.skin.onPause()
                }
            }
        },
        play: function () {
            if (!S.hasNext()) {
                return
            }
            if (!slide_delay) {
                slide_delay = S.options.slideshowDelay * 1000
            }
            if (slide_delay) {
                slide_start = new Date().getTime();
                slide_timer = setTimeout(function () {
                    slide_delay = slide_start = 0;
                    S.next()
                },
                slide_delay);
                if (S.skin.onPlay) {
                    S.skin.onPlay()
                }
            }
        },
        previous: function () {
            S.change(S.current - 1)
        },
        setDimensions: function (height, width, max_h, max_w, tb, lr, resizable) {
            var h = height = parseInt(height),
                w = width = parseInt(width),
                pad = parseInt(S.options.viewportPadding) || 0;
            var extra_h = 2 * pad + tb;
            if (h + extra_h >= max_h) {
                h = max_h - extra_h
            }
            var extra_w = 2 * pad + lr;
            if (w + extra_w >= max_w) {
                w = max_w - extra_w
            }
            var resize_h = height,
                resize_w = width,
                change_h = (height - h) / height,
                change_w = (width - w) / width,
                oversized = (change_h > 0 || change_w > 0);
            if (resizable && oversized && S.options.handleOversize == "resize") {
                if (change_h > change_w) {
                    w = Math.round((width / height) * h)
                } else {
                    if (change_w > change_h) {
                        h = Math.round((height / width) * w)
                    }
                }
                resize_w = w;
                resize_h = h
            }
            S.dimensions = {
                height: h + tb,
                width: w + lr,
                inner_h: h,
                inner_w: w,
                top: (max_h - (h + extra_h)) / 2 + pad,
                left: (max_w - (w + extra_w)) / 2 + pad,
                oversized: oversized,
                resize_h: resize_h,
                resize_w: resize_w
            }
        },
        setup: function (links, opts) {
            each(S.findLinks(links), function (link) {
                S.addCache(link, opts)
            })
        },
        teardown: function (links) {
            each(S.findLinks(links), S.removeCache)
        },
        findLinks: function (links) {
            if (!links) {
                var links = [],
                    rel;
                each(document.getElementsByTagName("a"), function (a) {
                    rel = a.getAttribute("rel");
                    if (rel && S.regex.rel.test(rel)) {
                        links.push(a)
                    }
                })
            } else {
                var len = links.length;
                if (len) {
                    if (window.Sizzle) {
                        if (typeof links == "string") {
                            links = Sizzle(links)
                        } else {
                            if (len == 2 && links.push && typeof links[0] == "string" && links[1].nodeType) {
                                links = Sizzle(links[0], links[1])
                            }
                        }
                    }
                } else {
                    links = [links]
                }
            }
            return links
        },
        inCache: function (link) {
            return typeof link[S.expando] == "number" && S.cache[link[S.expando]]
        },
        addCache: function (link, opts) {
            if (!S.inCache(link)) {
                link[S.expando] = S.cache.length;
                S.lib.addEvent(link, "click", handleClick)
            }
            S.cache[link[S.expando]] = S.buildCacheObj(link, opts)
        },
        removeCache: function (link) {
            S.lib.removeEvent(link, "click", handleClick);
            S.cache[link[S.expando]] = null;
            delete link[S.expando]
        },
        clearCache: function () {
            each(S.cache, function (obj) {
                S.removeCache(obj.link)
            });
            S.cache = []
        },
        buildCacheObj: function (link, opts) {
            var obj = {
                link: link,
                title: link.getAttribute("title"),
                options: apply({},
                opts || {}),
                content: link.href
            };
            if (opts) {
                each(["player", "title", "height", "width", "gallery"], function (option) {
                    if (typeof obj.options[option] != "undefined") {
                        obj[option] = obj.options[option];
                        delete obj.options[option]
                    }
                })
            }
            if (!obj.player) {
                obj.player = S.getPlayer(obj.content)
            }
            var rel = link.getAttribute("rel");
            if (rel) {
                var match = rel.match(S.regex.gallery);
                if (match) {
                    obj.gallery = escape(match[2])
                }
                each(rel.split(";"), function (parameter) {
                    match = parameter.match(S.regex.param);
                    if (match) {
                        if (match[1] == "options") {
                            eval("apply(obj.options," + match[2] + ")")
                        } else {
                            obj[match[1]] = match[2]
                        }
                    }
                })
            }
            return obj
        },
        getPlayer: function (content) {
            var r = S.regex,
                p = S.plugins,
                m = content.match(r.domain),
                same_domain = m && document.domain == m[1];
            if (content.indexOf("#") > -1 && same_domain) {
                return "inline"
            }
            var q = content.indexOf("?");
            if (q > -1) {
                content = content.substring(0, q)
            }
            if (r.img.test(content)) {
                return "img"
            }
            if (r.swf.test(content)) {
                return p.fla ? "swf" : "unsupported-swf"
            }
            if (r.flv.test(content)) {
                return p.fla ? "flv" : "unsupported-flv"
            }
            if (r.qt.test(content)) {
                return p.qt ? "qt" : "unsupported-qt"
            }
            if (r.wmp.test(content)) {
                if (p.wmp) {
                    return "wmp"
                }
                if (p.f4m) {
                    return "qt"
                }
                if (S.client.isMac) {
                    return p.qt ? "unsupported-f4m" : "unsupported-qtf4m"
                }
                return "unsupported-wmp"
            }
            if (r.qtwmp.test(content)) {
                if (p.qt) {
                    return "qt"
                }
                if (p.wmp) {
                    return "wmp"
                }
                return S.client.isMac ? "unsupported-qt" : "unsupported-qtwmp"
            }
            return "iframe"
        }
    },
        U = S.util = {
        animate: function (el, p, to, d, cb) {
            var from = parseFloat(S.lib.getStyle(el, p));
            if (isNaN(from)) {
                from = 0
            }
            var delta = to - from;
            if (delta == 0) {
                if (cb) {
                    cb()
                }
                return
            }
            var op = p == "opacity";

            function fn(ease) {
                var to = from + ease * delta;
                if (op) {
                    U.setOpacity(el, to)
                } else {
                    el.style[p] = to + "px"
                }
            }
            if (!d || (!op && !S.options.animate) || (op && !S.options.animateFade)) {
                fn(1);
                if (cb) {
                    cb()
                }
                return
            }
            d *= 1000;
            var begin = new Date().getTime(),
                ease = S.options.ease,
                end = begin + d,
                time;
                
            var timer = setInterval(function () {
                time = (new Date()).getTime();
                if (time >= end) {
                    clearInterval(timer);
                    fn(1);
                    if (cb) {
                        cb();
                    }
                } else {
                    fn(ease((time - begin) / d));
                }
            }, 10);
        },
        apply: function (o, e) {
            for (var p in e) {
                o[p] = e[p]
            }
            return o
        },
        clearOpacity: function (el) {
            var s = el.style;
            if (window.ActiveXObject) {
                if (typeof s.filter == "string" && (/alpha/i).test(s.filter)) {
                    s.filter = s.filter.replace(/[\w\.]*alpha\(.*?\);?/i, "")
                }
            } else {
                s.opacity = ""
            }
        },
        each: function (obj, fn, scope) {
            for (var i = 0, len = obj.length; i < len; ++i) {
                if (fn.call(scope || obj[i], obj[i], i, obj) === false) {
                    return
                }
            }
        },
        get: function (id) {
            return document.getElementById(id)
        },
        include: function () {
            var includes = {};
            return function (file) {
                if (includes[file]) {
                    return
                }
                includes[file] = true;
                var head = document.getElementsByTagName("head")[0],
                    script = document.createElement("script");
                script.src = file;
                head.appendChild(script)
            }
        }(),
        isLink: function (obj) {
            if (!obj || !obj.tagName) {
                return false
            }
            var up = obj.tagName.toUpperCase();
            return up == "A" || up == "AREA"
        },
        removeChildren: function (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild)
            }
        },
        setOpacity: function (el, o) {
            var s = el.style;
            if (window.ActiveXObject) {
                s.zoom = 1;
                s.filter = (s.filter || "").replace(/\s*alpha\([^\)]*\)/gi, "") + (o == 1 ? "" : " alpha(opacity=" + (o * 100) + ")")
            } else {
                s.opacity = o
            }
        }
    },
        apply = U.apply,
        each = U.each,
        init_options, initialized = false,
        default_options = {},
        content_id = "sb-content",
        active = false,
        slide_timer, slide_start, slide_delay = 0;
    if (navigator.plugins && navigator.plugins.length) {
        var names = [];
        each(navigator.plugins, function (p) {
            names.push(p.name)
        });
        names = names.join();
        var f4m = names.indexOf("Flip4Mac") > -1;
        S.plugins = {
            fla: names.indexOf("Shockwave Flash") > -1,
            qt: names.indexOf("QuickTime") > -1,
            wmp: !f4m && names.indexOf("Windows Media") > -1,
            f4m: f4m
        }
    } else {
        function detectPlugin(n) {
            try {
                var axo = new ActiveXObject(n)
            } catch(e) {}
            return !!axo
        }
        S.plugins = {
            fla: detectPlugin("ShockwaveFlash.ShockwaveFlash"),
            qt: detectPlugin("QuickTime.QuickTime"),
            wmp: detectPlugin("wmplayer.ocx"),
            f4m: false
        }
    }
    function waitDom(cb) {
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", function () {
                document.removeEventListener("DOMContentLoaded", arguments.callee, false);
                cb()
            },
            false)
        } else {
            if (document.attachEvent) {
                document.attachEvent("onreadystatechange", function () {
                    if (document.readyState === "complete") {
                        document.detachEvent("onreadystatechange", arguments.callee);
                        cb()
                    }
                });
                if (document.documentElement.doScroll && window == window.top) {
                    (function () {
                        if (S.ready) {
                            return
                        }
                        try {
                            document.documentElement.doScroll("left")
                        } catch(error) {
                            setTimeout(arguments.callee, 0);
                            return
                        }
                        cb()
                    })()
                }
            }
        }
        if (typeof window.onload == "function") {
            var oldonload = window.onload;
            window.onload = function () {
                oldonload();
                cb()
            }
        } else {
            window.onload = cb
        }
    }
    function waitLibs() {
        if (S.lib && S.lang) {
            S.load()
        } else {
            setTimeout(waitLibs, 0)
        }
    }
    function handleClick(e) {
        var link;
        if (U.isLink(this)) {
            link = this
        } else {
            link = S.lib.getTarget(e);
            while (!U.isLink(link) && link.parentNode) {
                link = link.parentNode
            }
        }
        S.lib.preventDefault(e);
        if (link) {
            S.open(link);
            if (S.gallery.length) {
                S.lib.preventDefault(e)
            }
        }
    }
    function listenKeys(on) {
        if (!S.options.enableKeys) {
            return
        }
        S.lib[(on ? "add" : "remove") + "Event"](document, "keydown", handleKey)
    }
    function handleKey(e) {
        var code = S.lib.keyCode(e),
            handler;
        switch (code) {
        case 81:
        case 88:
        case 27:
            handler = S.close;
            break;
        case 37:
            handler = S.previous;
            break;
        case 39:
            handler = S.next;
            break;
        case 32:
            handler = typeof slide_timer == "number" ? S.pause : S.play
        }
        if (handler) {
            S.lib.preventDefault(e);
            handler()
        }
    }
    function loadContent() {
        var obj = S.getCurrent();
        if (!obj) {
            return
        }
        var p = obj.player == "inline" ? "html" : obj.player;
        if (typeof S[p] != "function") {
            S.error("Unknown player: " + p)
        }
        var change = false;
        if (S.content) {
            S.content.remove();
            change = true;
            S.revertOptions();
            if (obj.options) {
                S.applyOptions(obj.options)
            }
        }
        U.removeChildren(S.skin.bodyEl());
        S.content = new S[p](obj);
        listenKeys(false);
        S.skin.onLoad(S.content, change, function () {
            if (!S.content) {
                return
            }
            if (typeof S.content.ready != "undefined") {
                var id = setInterval(function () {
                    if (S.content) {
                        if (S.content.ready) {
                            clearInterval(id);
                            id = null;
                            S.skin.onReady(contentReady)
                        }
                    } else {
                        clearInterval(id);
                        id = null
                    }
                },
                100)
            } else {
                S.skin.onReady(contentReady)
            }
        });
        if (S.gallery.length > 1) {
            var next = S.gallery[S.current + 1] || S.gallery[0];
            if (next.player == "img") {
                var a = new Image();
                a.src = next.content
            }
            var prev = S.gallery[S.current - 1] || S.gallery[S.gallery.length - 1];
            if (prev.player == "img") {
                var b = new Image();
                b.src = prev.content
            }
        }
    }
    function contentReady() {
        if (!S.content) {
            return
        }
        S.content.append(S.skin.bodyEl(), content_id, S.dimensions);
        S.skin.onFinish(finishContent)
    }
    function finishContent() {
        if (!S.content) {
            return
        }
        if (S.content.onLoad) {
            S.content.onLoad()
        }
        if (S.options.onFinish) {
            S.options.onFinish()
        }
        if (!S.isPaused()) {
            S.play()
        }
        listenKeys(true)
    }
    window.Shadowbox = S
})();
(function () {
    var g = Shadowbox,
        f = g.util,
        q = false,
        b = [],
        m = ["sb-nav-close", "sb-nav-next", "sb-nav-play", "sb-nav-pause", "sb-nav-previous"],
        o = {
        markup: '<div id="sb-container"><div id="sb-overlay"></div><div id="sb-wrapper"><div id="sb-title"><div id="sb-title-inner"></div></div><div id="sb-body"><div id="sb-body-inner"></div><div id="sb-loading"><a onclick="Shadowbox.close()">{cancel}</a></div></div><div id="sb-info"><div id="sb-info-inner"><div id="sb-counter"></div><div id="sb-nav"><a id="sb-nav-close" title="{close}" onclick="Shadowbox.close()"></a><a id="sb-nav-next" title="{next}" onclick="Shadowbox.next()"></a><a id="sb-nav-play" title="{play}" onclick="Shadowbox.play()"></a><a id="sb-nav-pause" title="{pause}" onclick="Shadowbox.pause()"></a><a id="sb-nav-previous" title="{previous}" onclick="Shadowbox.previous()"></a></div><div style="clear:both"></div></div></div></div></div>',
        options: {
            animSequence: "sync",
            autoDimensions: false,
            counterLimit: 10,
            counterType: "default",
            displayCounter: true,
            displayNav: true,
            fadeDuration: 0.35,
            initialHeight: 160,
            initialWidth: 320,
            modal: false,
            overlayColor: "#000",
            overlayOpacity: 0.8,
            resizeDuration: 0.35,
            showOverlay: true,
            troubleElements: ["select", "object", "embed", "canvas"]
        },
        init: function () {
            var s = o.markup.replace(/\{(\w+)\}/g, function (w, x) {
                return g.lang[x]
            });
            g.lib.append(document.body, s);
            if (g.client.isIE6) {
                f.get("sb-body").style.zoom = 1;
                var u, r, t = /url\("(.*\.png)"\)/;
                f.each(m, function (w) {
                    u = f.get(w);
                    if (u) {
                        r = g.lib.getStyle(u, "backgroundImage").match(t);
                        if (r) {
                            u.style.backgroundImage = "none";
                            u.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true,src=" + r[1] + ",sizingMethod=scale);"
                        }
                    }
                })
            }
            var v;
            g.lib.addEvent(window, "resize", function () {
                if (v) {
                    clearTimeout(v);
                    v = null
                }
                if (g.isActive()) {
                    v = setTimeout(function () {
                        o.onWindowResize();
                        var w = g.content;
                        if (w && w.onWindowResize) {
                            w.onWindowResize()
                        }
                    },
                    50)
                }
            })
        },
        bodyEl: function () {
            return f.get("sb-body-inner")
        },
        onOpen: function (u, r) {
            e(false);
            var t = g.options.autoDimensions && "height" in u ? u.height : g.options.initialHeight,
            s = g.options.autoDimensions && "width" in u ? u.width : g.options.initialWidth;
            f.get("sb-container").style.display = "block";
            var v = p(t, s);
            d(v.inner_h, v.top, false);
            h(v.width, v.left, false);
            i(r)
        },
        onLoad: function (s, t, r) {
            k(true);
            j(t, function () {
                if (!s) {
                    return
                }
                if (!t) {
                    f.get("sb-wrapper").style.display = ""
                }
                r()
            })
        },
        onReady: function (r) {
            var t = g.content;
            if (!t) {
                return
            }
            var s = p(t.height, t.width, t.resizable);
            o.resizeContent(s.inner_h, s.width, s.top, s.left, true, function () {
                l(r)
            })
        },
        onFinish: function (r) {
            k(false, r)
        },
        onClose: function () {
            i();
            e(true)
        },
        onPlay: function () {
            c("play", false);
            c("pause", true)
        },
        onPause: function () {
            c("pause", false);
            c("play", true)
        },
        onWindowResize: function () {
            var t = g.content;
            if (!t) {
                return
            }
            var s = p(t.height, t.width, t.resizable);
            h(s.width, s.left, false);
            d(s.inner_h, s.top, false);
            var r = f.get(g.contentId());
            if (r) {
                if (t.resizable && g.options.handleOversize == "resize") {
                    r.height = s.resize_h;
                    r.width = s.resize_w
                }
            }
        },
        resizeContent: function (s, t, w, v, u, r) {
            var y = g.content;
            if (!y) {
                return
            }
            var x = p(y.height, y.width, y.resizable);
            switch (g.options.animSequence) {
            case "hw":
                d(x.inner_h, x.top, u, function () {
                    h(x.width, x.left, u, r)
                });
                break;
            case "wh":
                h(x.width, x.left, u, function () {
                    d(x.inner_h, x.top, u, r)
                });
                break;
            default:
                h(x.width, x.left, u);
                d(x.inner_h, x.top, u, r)
            }
        }
    };

    function n() {
        f.get("sb-container").style.top = document.documentElement.scrollTop + "px"
    }
    function e(r) {
        if (r) {
            f.each(b, function (s) {
                s[0].style.visibility = s[1] || ""
            })
        } else {
            b = [];
            f.each(g.options.troubleElements, function (s) {
                f.each(document.getElementsByTagName(s), function (t) {
                    b.push([t, t.style.visibility]);
                    t.style.visibility = "hidden"
                })
            })
        }
    }
    function i(r) {
        var s = f.get("sb-overlay"),
            t = f.get("sb-container"),
            v = f.get("sb-wrapper");
        if (r) {
            if (g.client.isIE6) {
                n();
                g.lib.addEvent(window, "scroll", n)
            }
            if (g.options.showOverlay) {
                q = true;
                s.style.backgroundColor = g.options.overlayColor;
                f.setOpacity(s, 0);
                if (!g.options.modal) {
                    g.lib.addEvent(s, "click", g.close)
                }
                v.style.display = "none"
            }
            t.style.visibility = "visible";
            if (q) {
                var u = parseFloat(g.options.overlayOpacity);
                f.animate(s, "opacity", u, g.options.fadeDuration, r)
            } else {
                r()
            }
        } else {
            if (g.client.isIE6) {
                g.lib.removeEvent(window, "scroll", n)
            }
            g.lib.removeEvent(s, "click", g.close);
            if (q) {
                v.style.display = "none";
                f.animate(s, "opacity", 0, g.options.fadeDuration, function () {
                    t.style.display = "";
                    v.style.display = "";
                    f.clearOpacity(s)
                })
            } else {
                t.style.visibility = "hidden"
            }
        }
    }
    function c(t, r) {
        var s = f.get("sb-nav-" + t);
        if (s) {
            s.style.display = r ? "" : "none"
        }
    }
    function k(s, r) {
        var u = f.get("sb-loading"),
            w = g.getCurrent().player,
            v = (w == "img" || w == "html");
        if (s) {
            function t() {
                f.clearOpacity(u);
                if (r) {
                    r()
                }
            }
            f.setOpacity(u, 0);
            u.style.display = "";
            if (v) {
                f.animate(u, "opacity", 1, g.options.fadeDuration, t)
            } else {
                t()
            }
        } else {
            function t() {
                u.style.display = "none";
                f.clearOpacity(u);
                if (r) {
                    r()
                }
            }
            if (v) {
                f.animate(u, "opacity", 0, g.options.fadeDuration, t)
            } else {
                t()
            }
        }
    }
    function a(u) {
        var z = g.getCurrent();
        f.get("sb-title-inner").innerHTML = z.title || "";
        var C, t, x, D, s;
        if (g.options.displayNav) {
            C = true;
            var B = g.gallery.length;
            if (B > 1) {
                if (g.options.continuous) {
                    t = s = true
                } else {
                    t = (B - 1) > g.current;
                    s = g.current > 0
                }
            }
            if (g.options.slideshowDelay > 0 && g.hasNext()) {
                D = !g.isPaused();
                x = !D
            }
        } else {
            C = t = x = D = s = false
        }
        c("close", C);
        c("next", t);
        c("play", x);
        c("pause", D);
        c("previous", s);
        var r = "";
        if (g.options.displayCounter && g.gallery.length > 1) {
            var B = g.gallery.length;
            if (g.options.counterType == "skip") {
                var y = 0,
                    w = B,
                    v = parseInt(g.options.counterLimit) || 0;
                if (v < B && v > 2) {
                    var A = Math.floor(v / 2);
                    y = g.current - A;
                    if (y < 0) {
                        y += B
                    }
                    w = g.current + (v - A);
                    if (w > B) {
                        w -= B
                    }
                }
                while (y != w) {
                    if (y == B) {
                        y = 0
                    }
                    r += '<a onclick="Shadowbox.change(' + y + ');"';
                    if (y == g.current) {
                        r += ' class="sb-counter-current"'
                    }
                    r += ">" + (y++) + "</a>"
                }
            } else {
                var r = (g.current + 1) + " " + g.lang.of + " " + B
            }
        }
        f.get("sb-counter").innerHTML = r;
        u()
    }
    function j(u, s) {
        var y = f.get("sb-wrapper"),
            B = f.get("sb-title"),
            v = f.get("sb-info"),
            r = f.get("sb-title-inner"),
            z = f.get("sb-info-inner"),
            A = parseInt(g.lib.getStyle(r, "height")) || 0,
            x = parseInt(g.lib.getStyle(z, "height")) || 0;
        var w = function () {
            r.style.visibility = z.style.visibility = "hidden";
            a(s)
        };
        if (u) {
            f.animate(B, "height", 0, 0.35);
            f.animate(v, "height", 0, 0.35);
            f.animate(y, "paddingTop", A, 0.35);
            f.animate(y, "paddingBottom", x, 0.35, w)
        } else {
            B.style.height = v.style.height = "0px";
            y.style.paddingTop = A + "px";
            y.style.paddingBottom = x + "px";
            w()
        }
    }
    function l(u) {
        var s = f.get("sb-wrapper"),
            w = f.get("sb-title"),
            v = f.get("sb-info"),
            z = f.get("sb-title-inner"),
            y = f.get("sb-info-inner"),
            x = parseInt(g.lib.getStyle(z, "height")) || 0,
            r = parseInt(g.lib.getStyle(y, "height")) || 0;
        z.style.visibility = y.style.visibility = "";
        if (z.innerHTML != "") {
            f.animate(w, "height", x, 0.35);
            f.animate(s, "paddingTop", 0, 0.35)
        }
        f.animate(v, "height", r, 0.35);
        f.animate(s, "paddingBottom", 0, 0.35, u)
    }
    function d(u, z, y, r) {
        var A = f.get("sb-body"),
            x = f.get("sb-wrapper"),
            w = parseInt(u),
            v = parseInt(z);
        if (y) {
            f.animate(A, "height", w, g.options.resizeDuration);
            f.animate(x, "top", v, g.options.resizeDuration, r)
        } else {
            A.style.height = w + "px";
            x.style.top = v + "px";
            if (r) {
                r()
            }
        }
    }
    function h(x, z, y, r) {
        var v = f.get("sb-wrapper"),
            u = parseInt(x),
            t = parseInt(z);
        if (y) {
            f.animate(v, "width", u, g.options.resizeDuration);
            f.animate(v, "left", t, g.options.resizeDuration, r)
        } else {
            v.style.width = u + "px";
            v.style.left = t + "px";
            if (r) {
                r()
            }
        }
    }
    function p(r, u, t) {
        var s = f.get("sb-body-inner");
        sw = f.get("sb-wrapper"),
        so = f.get("sb-overlay"),
        tb = sw.offsetHeight - s.offsetHeight,
        lr = sw.offsetWidth - s.offsetWidth,
        max_h = so.offsetHeight,
        max_w = so.offsetWidth;
        g.setDimensions(r, u, max_h, max_w, tb, lr, t);
        return g.dimensions
    }
    g.skin = o
})();
if (typeof jQuery == "undefined") {
    throw "Unable to load Shadowbox adapter, jQuery not found"
}
if (typeof Shadowbox == "undefined") {
    throw "Unable to load Shadowbox adapter, Shadowbox not found"
}(function (b, a) {
    a.lib = {
        getStyle: function (d, c) {
            return b(d).css(c)
        },
        remove: function (c) {
            b(c).remove()
        },
        getTarget: function (c) {
            return c.target
        },
        getPageXY: function (c) {
            return [c.pageX, c.pageY]
        },
        preventDefault: function (c) {
            c.preventDefault()
        },
        keyCode: function (c) {
            return c.keyCode
        },
        addEvent: function (e, c, d) {
            b(e).bind(c, d)
        },
        removeEvent: function (e, c, d) {
            b(e).unbind(c, d)
        },
        append: function (d, c) {
            b(d).append(c)
        }
    }
})(jQuery, Shadowbox);
(function (a) {
    a.fn.shadowbox = function (b) {
        return this.each(function () {
            var d = a(this);
            var e = a.extend({},
            b || {},
            a.metadata ? d.metadata() : a.meta ? d.data() : {});
            var c = this.className || "";
            e.width = parseInt((c.match(/w:(\d+)/) || [])[1]) || e.width;
            e.height = parseInt((c.match(/h:(\d+)/) || [])[1]) || e.height;
            Shadowbox.setup(d, e)
        })
    }
})(jQuery);
if (typeof Shadowbox == "undefined") {
    throw "Unable to load Shadowbox language file, Shadowbox not found."
}
Shadowbox.lang = {
    code: "en",
    of: "of",
    loading: "loading",
    cancel: "Cancel",
    next: "Next",
    previous: "Previous",
    play: "Play",
    pause: "Pause",
    close: "Close",
    errors: {
        single: 'You must install the <a href="{0}">{1}</a> browser plugin to view this content.',
        shared: 'You must install both the <a href="{0}">{1}</a> and <a href="{2}">{3}</a> browser plugins to view this content.',
        either: 'You must install either the <a href="{0}">{1}</a> or the <a href="{2}">{3}</a> browser plugin to view this content.'
    }
};
(function (h) {
    var e = h.util,
        i, k, j = "sb-drag-layer",
        d;

    function b() {
        i = {
            x: 0,
            y: 0,
            start_x: null,
            start_y: null
        }
    }
    function c(m, o, l) {
        if (m) {
            b();
            var n = ["position:absolute", "height:" + o + "px", "width:" + l + "px", "cursor:" + (h.client.isGecko ? "-moz-grab" : "move"), "background-color:" + (h.client.isIE ? "#fff;filter:alpha(opacity=0)" : "transparent")].join(";");
            h.lib.append(h.skin.bodyEl(), '<div id="' + j + '" style="' + n + '"></div>');
            h.lib.addEvent(e.get(j), "mousedown", g)
        } else {
            var p = e.get(j);
            if (p) {
                h.lib.removeEvent(p, "mousedown", g);
                h.lib.remove(p)
            }
            k = null
        }
    }
    function g(m) {
        h.lib.preventDefault(m);
        var l = h.lib.getPageXY(m);
        i.start_x = l[0];
        i.start_y = l[1];
        k = e.get(h.contentId());
        h.lib.addEvent(document, "mousemove", f);
        h.lib.addEvent(document, "mouseup", a);
        if (h.client.isGecko) {
            e.get(j).style.cursor = "-moz-grabbing"
        }
    }
    function a() {
        h.lib.removeEvent(document, "mousemove", f);
        h.lib.removeEvent(document, "mouseup", a);
        if (h.client.isGecko) {
            e.get(j).style.cursor = "-moz-grab"
        }
    }
    function f(o) {
        var q = h.content,
            p = h.dimensions,
            n = h.lib.getPageXY(o);
        var m = n[0] - i.start_x;
        i.start_x += m;
        i.x = Math.max(Math.min(0, i.x + m), p.inner_w - q.width);
        k.style.left = i.x + "px";
        var l = n[1] - i.start_y;
        i.start_y += l;
        i.y = Math.max(Math.min(0, i.y + l), p.inner_h - q.height);
        k.style.top = i.y + "px"
    }
    h.img = function (m) {
        this.obj = m;
        this.resizable = true;
        this.ready = false;
        var l = this;
        d = new Image();
        d.onload = function () {
            l.height = m.height ? parseInt(m.height, 10) : d.height;
            l.width = m.width ? parseInt(m.width, 10) : d.width;
            l.ready = true;
            d.onload = "";
            d = null
        };
        d.src = m.content
    };
    h.img.prototype = {
        append: function (l, o, n) {
            this.id = o;
            var m = document.createElement("img");
            m.id = o;
            m.src = this.obj.content;
            m.style.position = "absolute";
            m.setAttribute("height", n.resize_h);
            m.setAttribute("width", n.resize_w);
            l.appendChild(m)
        },
        remove: function () {
            var l = e.get(this.id);
            if (l) {
                h.lib.remove(l)
            }
            c(false);
            if (d) {
                d.onload = "";
                d = null
            }
        },
        onLoad: function () {
            var l = h.dimensions;
            if (l.oversized && h.options.handleOversize == "drag") {
                c(true, l.resize_h, l.resize_w)
            }
        },
        onWindowResize: function () {
            if (k) {
                var p = h.content,
                    o = h.dimensions,
                    n = parseInt(h.lib.getStyle(k, "top")),
                    m = parseInt(h.lib.getStyle(k, "left"));
                if (n + p.height < o.inner_h) {
                    k.style.top = o.inner_h - p.height + "px"
                }
                if (m + p.width < o.inner_w) {
                    k.style.left = o.inner_w - p.width + "px"
                }
            }
        }
    }
})(Shadowbox);
Shadowbox.options.players = ["img"];
Shadowbox.options.useSizzle = false;