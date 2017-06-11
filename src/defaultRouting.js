
"use strict";

/**
 * We don't actually _have_ routes, but just define these dummy routes
 * so the ngRoute logic will kick in and make our site HTML5 history
 * compatible.
 *
 * If your app (optionally) also specifies some routes, they should work
 * fine in conjunction.
 */
export default ['$routeProvider', $routeProvider => {
    $routeProvider.when('/', {});
    $routeProvider.otherwise({});
}];

