# kogs
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`kogs` is a monorepo that contains a collection of lightweight Node.js modules designed to provide foundational functionality in a generic format.

This project is developed with the following motivations:

- Reduce code duplication in projects by providing a common set of functionality split into small, focused modules.
- Alleviate `node_modules` bloat by using native functionality and avoiding dependencies where possible.
- Align with the [Unix philosophy](https://en.wikipedia.org/wiki/Unix_philosophy) of small, focused modules that do one thing well.
- Design modules to be as generic as possible, with the goal of being useful in a variety of projects.
- Keep APIs simple and consistent, sticking to a common set of conventions.

![xkcd: Standards](https://imgs.xkcd.com/comics/standards.png)

**Isn't this just reinventing the wheel?** Yes, there is a vast ecosystem of existing modules that provide similar functionality. However, I often find when pulling in third-party modules I run into some common problems:
- Modules are too large and include functionality/complexity that I don't need.
- Modules have way too many dependencies, often including large libraries like `lodash` or `moment`, or unnecessary single-function modules like `is-plain-object`.
- Modules can be poorly maintained and have long lists of open issues and pull requests. Taking the time to patch upstream issues in an unfamiliar codebase can be a time-consuming process.
- Modules might not implement all desired functionality, requiring compromise, or upstream/fork development.
- Modules that are no longer maintained end up with security vulnerabilities that require auditing.
- Modules can be poorly documented and/or have a confusing APIs.
- Using a variety of modules from different sources leads in inconsistent APIs and conventions.
- Older modules often lack support for newer features like async/await, requiring the use of wrappers.

While some of the issues above *can* be resolved with tree-shaking, bundling, etc, I often found myself just writing small modules to solve a specific problem, and then sharing that code across projects. This project is an attempt to consolidate that code into a single place where it can be maintained, and potentially make it useful to others.

Using home-grown modules also has some benefits:
- Familiarity with the internals of the modules can improve development efficiency and reduce debugging time.
- Modules can be customized and extended to fit specific needs without the need to fork or learn upstream codebases.
- APIs can be designed to be consistent between modules, reducing time spent learning new APIs.
- Using a common set of modules between projects consolidates code to a single place, making it easier to maintain and fix security vulnerabilities across projects.

The main goal of these modules will be to facilitate the development of my own projects. This will result in opinionated APIs and conventions that may not be ideal for everyone. However, I will try to keep the APIs as simple and consistent as possible, and will be open to suggestions for improvements.

All modules will adhere to semantic versioning, and will be published to npm under the `@kogs` scope.