
"use strict";

var initial = true;

angular.module('ngTangle', ['ngRoute'])

    /**
     * @see http://www.marijnophorst.com/2015/06/16/graceful-routing-fallback-in-hybrid-angularjs-apps/
     */
    .config(['$locationProvider', function ($locationProvider) {
        if (!!(window.history && window.history.pushState)) {
            $locationProvider.html5Mode(true);
        }
    }])

    /**
     * We don't actually _have_ routes, but just define these dummy routes
     * so the ngRoute logic will kick in and make our site HTML5 history
     * compatible.
     *
     * If your app (optionally) also specifies some routes, they should work
     * fine in conjunction.
     */
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {});
        $routeProvider.otherwise({});
    }])

    /**
     * Watch the $routeChangeSuccess event and get new content accordingly.
     */
    .run(['$http', '$rootScope', '$cacheFactory', 'tangleResponse', function ($http, $rootScope, $cacheFactory, tangleResponse) {
        var cache = $cacheFactory('tangleTemplate');
        $rootScope.$on('$routeChangeSuccess', function () {
            if (initial) {
                initial = false;
                return;
            }
            $http.get(window.location.href, {cache: cache, headers: {'x-requested-with': 'xmlhttprequest'}}).then(tangleResponse.handle);
        });
        $rootScope.ngTangle = {loading: false};
        $rootScope.$on('tangleFlush', function (event, url) {
            if (url) {
                if (angular.isArray(url)) {
                    angular.forEach(cache.remove);
                } else {
                    cache.remove(url);
                }
            } else {
                cache.removeAll();
            }
        });
    }])

    /**
     * Inspect a response and handle accordingly if it's special. Else return true.
     */
    .service('tangleResponse', ['$location', '$rootScope', function ($location, $rootScope) {
        this.handle = function (response) {
            var headers = response.headers();
            if (headers['tangle-target'] && headers['tangle-target'] != window.location.href) {
                if (headers['tangle-target'].match(location.origin)) {
                    $location.url(headers['tangle-target'].replace(window.location.origin, ''));
                } else {
                    window.location.href = headers['tangle-target'];
                }
            }
            if (headers['tangle-etag']) {
                if ($rootScope.ngTangle.etag && $rootScope.ngTangle.etag != headers['tangle-etag']) {
                    $rootScope.$broadcast('tangleFlush');
                }
                $rootScope.ngTangle.etag = headers['tangle-etag'];
            }
            var received = angular.element(response.data);
            $rootScope.$broadcast('tangleTemplate', received);
        };
    }])

    /**
     * Add underwater submits for forms marked with submit directive.
     */
    .directive('tangleSubmit', ['$http', '$rootScope', 'tangleResponse', '$cacheFactory', function ($http, $rootScope, tangleResponse, $cacheFactory) {
        var cache = $cacheFactory.get('tangleTemplate');
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                elem.bind('submit', function (event) {
                    event.preventDefault();
                    var method = elem.attr('method').toLowerCase();
                    var inputs = elem[0].querySelectorAll('input, select, textarea');
                    var target = elem.attr('action') && elem.attr('action').length ?
                        elem.attr('action') :
                        window.location.href;
                    var data = method == 'post' ? {} : '';
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].disabled) {
                            continue;
                        }
                        if (method == 'post') {
                            data[inputs[i].name] = inputs[i].value;
                        } else {
                            data += '&' + inputs[i].name + '=' + encodeURIComponent(inputs[i].value);
                        }
                    }
                    if (method == 'post') {
                        $http.post(target, data).then(function (response) {
                            tangleResponse.handle(response);
                            cache.put(target, response.data);
                        });
                    } else {
                        if (target.indexOf('?') == -1) {
                            data = '?' + data.substring(1);
                        }
                        $http.get(target + data).then(function (response) {
                            tangleResponse.handle(response);
                            cache.put(target + data, response.data);
                        });
                    }
                    return false;
                });
            }
        };
    }])

    /**
     * The tangle-template directive. This marks the element as "to watch" for
     * new content.
     */
    .directive('tangleTemplate', ['$rootScope', '$compile', function ($rootScope, $compile) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                var id = identifier(elem[0], attrs['class']);
                $rootScope.$on('$routeChangeStart', function () {
                    if (!initial) {
                        $rootScope.ngTangle.loading = true;
                    }
                });
                $rootScope.$on('tangleTemplate', function (event, parsed) {
                    $rootScope.ngTangle.loading = false;
                    angular.forEach(parsed, function (el) {
                        if (identifier(el, el.className) != id) {
                            return;
                        }
                        elem.html(el.innerHTML);
                        if (elem[0].tagName.toLowerCase() != 'title') {
                            $compile(elem.contents())(scope);
                        }
                    });
                });
            }
        };
    }]);

function identifier(element, className) {
    if (!element.tagName) {
        return false;
    }
    var id = element.tagName.toLowerCase();
    if (element.id) {
        id += '#' + element.id;
    }
    if (className) {
        className.split(' ').sort(function (a, b) {
            return a < b ? -1 : 1;
        }).map(function (className) {
            id += '.' + className;
        });
    }
    return id;
}

