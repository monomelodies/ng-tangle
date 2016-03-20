
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
        let cache = $cacheFactory('tangleTemplate');
        $rootScope.$on('$routeChangeSuccess', function () {
            if (initial) {
                initial = false;
                return;
            }
            $http.get(window.location.href, {cache: cache, headers: {'x-requested-with': 'xmlhttprequest'}}).then(tangleResponse.handle);
        });
        $rootScope.ngTangle = {loading: false};
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
            var received = angular.element(response.data);
            $rootScope.$broadcast('tangleTemplate', received);
        };
    }])

    /**
     * Add underwater submits for forms marked with submit directive.
     */
    .directive('tangleSubmit', ['$http', '$rootScope', 'tangleResponse', function ($http, $rootScope, tangleResponse) {
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
                        $http.post(target, data).then(tangleResponse.handle);
                    } else {
                        if (target.indexOf('?') == -1) {
                            data = '?' + data.substring(1);
                        }
                        $http.get(target + data).then(tangleResponse.handle);
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
                $rootScope.$on('$routeChangeStart', function () {
                    if (!initial) {
                        $rootScope.ngTangle.loading = true;
                    }
                });
                $rootScope.$on('tangleTemplate', function (event, parsed, originalRequest) {
                    $rootScope.ngTangle.loading = false;
                    angular.forEach(parsed, function (el) {
                        if (!el.tagName) {
                            return;
                        }
                        // Replace & recompile the content if:
                        // - the tagname matches
                        // - the classnames match (if specified)
                        // - the id matches (if specified)
                        if (el.tagName.toLowerCase() != elem[0].tagName.toLowerCase()) {
                            return;
                        }
                        if (el.id && elem.attr('id') && el.id != elem.attr('id')) {
                            return;
                        }
                        let c1 = el.className ? el.className.split(' ').sort(sort) : [];
                        let c2 = attrs['class'] ? attrs['class'].split(' ').sort(sort) : [];
                        if (!angular.equals(c1, c2)) {
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

function sort(a, b) {
    return a < b ? -1 : 1;
}

