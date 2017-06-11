
"use strict";

/**
 * The tangle-template directive. This marks the element as "to watch" for
 * new content.
 */
export default ['$rootScope', '$compile', ($rootScope, $compile) => ({
    restrict: 'A',
    link: (scope, elem, attrs) => {
        const id = identifier(elem[0], attrs['class']);
        $rootScope.$on('$routeChangeStart', () => $rootScope.ngTangle.loading = true);
        $rootScope.$on('tangleTemplate', (event, parsed) => {
            $rootScope.ngTangle.loading = false;
            angular.forEach(parsed, el => {
                if (identifier(el, el.className) == id || (el.querySelector && (el = el.querySelector(id)))) {
                    scope.$broadcast('$destroy');
                    elem.html(el.innerHTML);
                    if (elem[0].tagName.toLowerCase() != 'title') {
                        $compile(elem.contents())(scope);
                    }
                }
            });
        });
    }
})];

function identifier(element, className) {
    if (!element.tagName) {
        return false;
    }
    let id = element.tagName.toLowerCase();
    if (element.id) {
        id += '#' + element.id;
    }
    if (className) {
        className.split(' ').sort((a, b) => a < b ? -1 : 1).map(className => id += '.' + className);
    }
    return id;
}

