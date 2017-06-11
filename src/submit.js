
"use strict";

/**
 * Add underwater submits for forms marked with submit directive.
 * `tangle-submit` can optionally contain an expression to run after
 * successfull submission (like `ng-submit`).
 */
export default ['$http', '$rootScope', 'tangleResponse', '$cacheFactory', '$parse', ($http, $rootScope, tangleResponse, $cacheFactory, $parse) => {
    let cache = $cacheFactory.get('tangleTemplate');
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            const submitHandler = $parse(attrs.tangleSubmit);
            elem.bind('submit', event => {
                event.preventDefault();
                elem.addClass('ng-submitted');
                if (elem.hasClass('ng-invalid')) {
                    return false;
                }
                $rootScope.ngTangle.loading = true;
                const method = elem.attr('method').toLowerCase();
                const inputs = elem[0].querySelectorAll('input, select, textarea');
                const target = elem.attr('action') && elem.attr('action').length
                    ? elem.attr('action')
                    : window.location.href;
                let data = '';
                for (let i = 0; i < inputs.length; i++) {
                    if (inputs[i].disabled) {
                        continue;
                    }
                    if (inputs[i].tagName.toLowerCase() == 'input'
                        && ['checkbox', 'radio'].indexOf(inputs[i].type.toLowerCase()) != -1
                        && !inputs[i].checked
                    ) {
                        continue;
                    }
                    data += '&' + inputs[i].name + '=' + encodeURIComponent(inputs[i].value);
                }
                if (method == 'post') {
                    $http.post(target, data.substring(1)).then(response => {
                        elem.removeClass('ng-submitted');
                        tangleResponse.handle(response);
                        cache.remove(target);
                        submitHandler(scope);
                        $rootScope.$broadcast('tangleSubmitted');
                    });
                } else {
                    if (target.indexOf('?') == -1) {
                        data = '?' + data.substring(1);
                    }
                    $http.get(target + data).then(response => {
                        elem.removeClass('ng-submitted');
                        tangleResponse.handle(response);
                        cache.remove(target + data);
                        submitHandler(scope);
                        $rootScope.$broadcast('tangleSubmitted');
                    });
                }
                return false;
            });
        }
    };
}];

