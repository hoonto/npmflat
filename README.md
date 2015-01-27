npmflat
========

Analyze a package.json and produce the npm-shrinkwrap.json file that may be used by npm or directly by npmflat to install dependencies into a flattened structure given each packages semantically versioned dependencies. npmflat differs from other node_module hierarchy flattening modules that I’ve come across in that it does not install a deep nest and then move things around - it builds the npm-shrinkwrap specifically to reduce installation and install depth overhead from the start.

As a side-effect, npmflat also deduplicates modules to some degree although a better algorithm for selecting packages that move up the dependency graph could be developed in order to further optimize. At this point however the first package encountered while searching the hierarchy tree of package.json’s is moved to the top of the hierarchy and if other semantically versioned dependencies in the graph would be in conflict, then they are promoted up the hierarchy until a potential conflict would occur.

npmflat may be handy on windows systems where common utilities such as Explorer and DOS have character limits of something like 260 characters for file name and path together (yes this is the case, and yes the year is currently 2015).

Install: npm install -g npmflat

Usage: npmflat [--production] [install]

## Examples:
* `npmflat` will produce the npm-shrinkwrap.json file in the directory from which it is executed including the dependencies, devDependencies, and optionalDependencies indicated in the package.json that should also be present in the current working directory. It will not execute an npm install, that would have to be done manually (`npm install`).
* `npmflat --production` will produce an npm-shrinkwrap.json provided a package.json in the same directory exists including dependencies and optionalDependencies but excluding devDependencies.
* `npmflat install` does the same thing as `npmflat` but also executes `npm install` programmatically.
* `npmflat --production install` does the same thing as `npmflat --production` but also executes `npm install` programmatically.

## Notes

* npmflat will overwrite any existing npm-shrinkwrap.json file present!
* npmflat itself only requires npm to be globally installed prior to execution.
* npmflat does not yet pass command-line arguments to npm when the install option is provided. So for example, on windows if you wanted to pass the Visual Studio 2013 tool-chain to node-gyp via the npm install switch `-msvs-version=”2013”` then you would prefer to use npmflat to generate the npm-shrinkwrap.json and execute `npm install -msvs-version=”2013”` separately.
* If you get ENOENT error on install it may be the case that one of your locally installed modules is attempting to chmod a bin file that does not exist due to our modified npm-shrinkwrap.json file (it exists somewhere else up the hierarchy now).  If this is happening to you, try running `npm install --no-bin-links` and then find the offending file elsewhere in the hierarchy and chmod +x manually (if this is necessary for the package to work for you, which it may not be)

