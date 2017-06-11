
"use strict";

let $location = undefined;
let $rootScope = undefined;

/**
 * Inspect a response and handle accordingly if it's special. Else return true.
 */
export default class Response {

    constructor(_$location_, _$rootScope_) {
        $location = _$location_;
        $rootScope = _$rootScope_;
    }

    handle(response) {
        const headers = response.headers();
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
        const received = angular.element(response.data);
        $rootScope.$broadcast('tangleTemplate', received);
    }

};

Response.$inject = ['$location', '$rootScope'];

