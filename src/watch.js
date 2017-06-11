
"use strict";

/**
 * Watch the $locationChangeSuccess event and get new content accordingly.
 */
export default ['$http', '$rootScope', '$cacheFactory', 'tangleResponse', ($http, $rootScope, $cacheFactory, tangleResponse) => {
    let cache = $cacheFactory('tangleTemplate');
    $rootScope.$on('tangleLoad', () => {
        $http.get(window.location.href, {cache: cache, headers: {'x-requested-with': 'xmlhttprequest'}}).then(tangleResponse.handle);
    });
    $rootScope.ngTangle = {loading: false};
    $rootScope.$on('$locationChangeSuccess', (event, current, prev) => {
        // Initial loads and mere hash changes shouldn't trigger this:
        if (prev && prev.replace(/#.*?$/, '') != current.replace(/#.*?$/, '')) {
            $rootScope.$broadcast('tangleLoad');
        }
    });
    
    const uncache = url => {
        cache.remove(url);
        if (('' + window.location.href).match(url)) {
            $rootScope.$broadcast('tangleLoad');
        }
    };
    
    $rootScope.$on('tangleFlush', (event, url) => {
        if (url) {
            if (angular.isArray(url)) {
                angular.forEach(url, uncache);
            } else {
                uncache(url);
            }
        } else {
            cache.removeAll();
            $rootScope.$broadcast('tangleLoad');
        }
    });
}];

