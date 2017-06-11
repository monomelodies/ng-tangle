
"use strict";

import 'angular-route';
import html5mode from './html5mode';
import defaultRouting from './defaultRouting';
import Response from './Response';
import watch from './watch';
import submit from './submit';

export default angular.module('ngTangle', ['ngRoute'])
    .config(html5mode)
    .config(defaultRouting)
    .service('tangleResponse', Response)
    .run(watch)
    .directive('tangleSubmit', submit)
    .name;

