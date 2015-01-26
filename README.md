npmflat
========

Analyze a package.json and produce and npm-shrinkwrap.json file that may be used by npm or directly by npmflat to install dependencies into a flattened structure given each packages semantic version requirements. As a side-effect, this also deduplicates modules to some degree - it is possible to get duplicate sibling dependencies in parent hierarchies if greater than three packages, two of which have the same version are attempting to rise up the same tree and the lone differently versioned package makes its way to the top first.
A better algorithm for selecting packages that move up the hierarchy may be developed - at this point, the first package seen is moved to the top of the hierarchy.

npmflat may be handy on windows systems where common utilities such as Explorer and DOS have character limits of something like 260 characters for file name and path together (yes this is the case, and yes the year is currently 2015).

Install: npm install -g npmflat

Usage: npmflat [,--production][,install]

## Examples:
* `npmflat` will produce the npm-shrinkwrap.json including dependencies, devDependencies, and optionalDependencies but not execute `npm install`
* `npmflat --production` will produce an npm-shrinkwrap.json file in the directory from which it is executed provided a package.json in the same directory exists including dependencies, devDependencies, and optionalDependencies.
* `npmflat install` will produce an npm-shrinkwrap.json file in the directory from which it is executed provided a package.json in the same directory exists including dependencies, devDependencies, and optionalDependencies. It will then execute `npm install`.
* `npmflat --production install` will produce an npm-shrinkwrap.json file in the directory from which it is executed provided a package.json in the same directory exists including dependencies and optionalDependencies. It will then execute `npm install`.

## Notes

* npmflat itself only requires npm to be globally installed prior to execution.
* npmflat does not yet pass command-line arguments to npm when the install option is provided. So on windows for example, if you wanted to pass the Visual Studio 2013 tool-chain to node-gyp via the npm install switch `-msvs-version=”2013”` then you would prefer to use npmflat to generate the npm-shrinkwrap.json and execute `npm install -msvs-version=”2013”` separately.



