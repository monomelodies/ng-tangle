
"use strict";

import html5mode from './html5mode';
import defaultRouting from './defaultRouting';
import Response from './Response';
import watch from './watch';
import submit from './submit';
import template from './template';

export default angular.module('ngTangle', ['ngRoute'])
    .config(html5mode)
    .config(defaultRouting)
    .service('tangleResponse', Response)
    .run(watch)
    .directive('tangleTemplate', template)
    .directive('tangleSubmit', submit)
    .name;

