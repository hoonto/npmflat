npmflat
========

__This module is currently not in the npm registry as it is not ready for production and still needs much re-work as it is just a proof of concept__

Analyze a package.json and install dependencies into the most flattened structure possible given each packages version requirements.

This becomes especially handy on windows systems but also seems to solve some npm install hangs for me.

Usage: npmflat [,schema.json]

The schema.json second argument shows how npmflat intended to flatten the hierarchy and is useful for double-checking the results. If everything worked correctly then the node_modules folder was correctly flatted to this structure.

## Notes

This module differs from other flattening modules in that it traverses the package.json dependencies hierarchy first without installing anything (using npm.command.view to retrieve nested package.json’s in the registry). It then builds a flattened structure based on the semver requirements of each package, lifting packages in the hierarchy where there are not semver conflicts for the same package. It then installs the packages in the correct order and eliminates unnecessary modules that have already been lifted higher in the hierarchy.

What this means is that it does not attempt to move directories around after an npm install, and can be used in-place of the basic `npm install` command. No support has yet been written for variations on npm install or command-line switches with which you may be familiar.

npmflat does not build a node_modules directory for itself, so it is already pretty flat.

