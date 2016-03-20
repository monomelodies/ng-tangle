# ng-tangle
Entangle Angular with server side code

AngularJS is awesome, but there's also a lot to be said for "traditional"
server side applications - SEO, reuse of existing tools, less code duplication.
With ngTangle you can "entangle" your "traditional" application with some
AngularJS goodies via minimal adjustments.

## Installation

### NPM (recommended)
`npm install --save ng-tangle`

Either `import 'ng-tangle'` in your application, or add a reference to
`"/path/to/ng-tangle/index.js"` in your HTML. ngTangle depends on
`angular-route`, so make sure that's also loaded.

Your Angular application must import `ngTangle` as a dependency:

```javascript
angular.module('myAwesomeApp', ['ngTangle']);
```

### Manual
Download or clone the repository and follow the rest from the steps above.

## Usage
ngTangle defines a few directives you can add to your (traditional) HTML to
give it AngularJS superpowers. ngTangle interceps all "normal" anchor clicks to
fake an SPA, so at the very least you'll want to use `tangle-template`.

## Templating
You don't want to duplicate your routing table in Angular. Your server-side code
already handles that just fine. Well: you don't _have_ to!

The `tangle-template` directive (as an attribute) defines an HTML element as
"updatable". Whenever ngTangle intercepts a click on an anchor, it issues an
XMLHttpRequest to get the contents instead, and after receiving them updates the
marked elements with the new content.

> Templated elements should be unique in your HTML structure or weird things
> might happen. They must be unique based on ID (duh), class name (`.main` could
> be applied to a top-level `<header>` and `<footer>`, for instance) and tag
> name (e.g. a page only ever has one `<title>`). If any of these checks fail,
> the element will be left alone.

Note that ngTangle doesn't touch any existing `ng-click` directives, so you can
safely mix and match. Also, any routes specifically defined in Angular will also
still work.

## Form submission
Any form with the `tangle-submit` attribute will have its submission intercepted
and performed via an XMLHttpRequest as well. The resulting page (presumably
HTML) is subsequently fed to the `tangle-template` handler.

Forms not tagged with the directive are handled "the usual" way, i.e. either a
full page refresh or an `ng-submit` handler (or some other handler if you're
feeling particularly masochistic).

## Handling redirects
If any page requests a redirect (by issuing one of the 3xx HTTP headers),
Angular's `$http` service follows it verbatim (and this is a browser feature,
not an Angular-issue). While `ngTangle` correctly updates your content with the
output from the redirect, we would also like the URL in the address bar to
change.

To accomplish this, `ngTangle` looks for a `"Tangle-Target"` header in the
response. This header should contain the full URI (including scheme/hostname) of
the page being rendered. If this URI differs from the one just set by `ngRoute`,
`ngTangle` will update it for you.

How to send custom headers depends on your server setup. E.g. in PHP you would
write something like this:

```php
<?php

header("Tangle-Target: http://example.com/the/full/path/");
```

The target header is recommended but optional. If you omit it, Tangle simply
won't "redirect". Note that this may cause weird behaviour, e.g. when you
declare forms with `action=""` and the form now points at the wrong URL.

## Flushing the HTTP cache
For efficiency `ngTangle` caches all `$http.get` calls for templates using
Angular's built-in `$cacheFactory`. However, there are many cases where you want
to explicitly "flush" this cache (or parts of it). For instance when a logged in
user has just logged out and menu options need to be hidden. For this purpose
you can send a custom header called `"tangle-etag"`.

This header can contain any string, but the important thing is it should
represent the "state" of the entire application. I.e., for our example of the
user logging out you could simply use her user ID (which would be empty or 0
if no longer authenticated). You can usually set such a header in a central
place in your application.

Note that this usage of "ETag" differs from "normal" HTTP caching in that it
doesn't describe the state of the _URI_ but rather of the entire application.
How that state is computed is of course up to the implementor.

Internally `ngTangle` uses the `tangleFlush` event to trigger cache flushes, so
you can also call this manually (e.g. when using Web sockets and something is
known to have changed on a certain page). Either fire the event with no
parameters to clear the entire cache (quick and dirty) or optionally specify a
particular URI or an array of URIs to clear specifically. Again, these URIs must
include sheme/hostname.

It should also be noted that the `tangle-submit` directive _updates_ the cache
for the URI being submitted to, so in many cases the flush will happen
implicitly. It is mostly relevant if something alters the global application
state.

## Todos
This is just a quick and dirty first version. For future development:
- Make the handler smarter in what it extracts/replaces. It now just loops
  through all HTML nodes in the returned string.
- Personal pet peeve: the `<script type="text/ng-template">` tag. Vim won't
  syntax-highlight the HTML inside, and while I'm sure there's a plugin for that
  (or else it would be trivial to write) abusing `<script>` feels dirty. I'd
  much rather just write HTML and have a directive to turn it into a template.

