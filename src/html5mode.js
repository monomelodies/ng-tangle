
"use strict";

/**
 * @see http://www.marijnophorst.com/2015/06/16/graceful-routing-fallback-in-hybrid-angularjs-apps/
 */
export default ['$locationProvider', $locationProvider => {
    if (!!(window.history && window.history.pushState)) {
        $locationProvider.html5Mode(true);
    }
}];

