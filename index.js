'use strict';

var npmflat = module.exports;
var npm = require('npm');
var fs = require('fs');
var path = require("path");


npmflat.packageBuilder = new PackageBuilder();

function PackageBuilder() {
    this.packages = {};
}

/**
 * opts: {
 *   workingDirectory: the working directory in which npmflat should execute that contains a valid package.json
 *   packagePath: the path to and name of the package.json file to be analyzed
 *   install: whether or not to follow the writing of the npm-shrinkwrap.json file with an npm install
 *   production: whether or not to include devDependencies (false === include devDependencies)
 * }
 */

PackageBuilder.prototype.build = function(opts){
    var self = this;

    var packageReads = {};

    //throws error if it doesn't exist
    var inPackage = require(opts.packagePath);

    self.packages.name = inPackage.name;
    self.packages.version = inPackage.version;
    self.packages.dependencies = {};

    function writeSameLine(str) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(str);
        process.stdout.cursorTo(0);
    }

    function install(packages){
        npm.commands.install(['.'], function(err,packagesInstalled) {
            writeSameLine('Installed\n');
        });
    }

    function compress(packages,marker,parent){
        if(packages){
            for(var pack in packages.dependencies){
                if(parent && !parent.dependencies[pack]){
                    if(marker.quit) marker.quit = false;
                    parent.dependencies[pack] = packages.dependencies[pack];
                    delete packages.dependencies[pack];
                }else if(parent && parent.dependencies[pack] && parent.dependencies[pack].version === packages.dependencies[pack].version){
                    if(marker.quit) marker.quit = false;
                    delete packages.dependencies[pack];
                }
                compress(packages.dependencies[pack],marker,packages);
            }
        }
    }

    function processEachDep(packages){
        var marker;

        writeSameLine('Compressing dependencies...');

        do {
            marker = { quit: true };
            compress(packages,marker);
        }while(!marker.quit);

        fs.writeFile(path.join(opts.workingDirectory,'npm-shrinkwrap.json'), JSON.stringify(packages,null,4), function(err){
            if(!err) writeSameLine('Wrote npm-shrinkwrap.json\n');
            else console.log('\nError writing npm-shrinkwrap.json: ',err);

            if(opts.install) install(self.packages);
        });
    }

    function explorePackage(packageName,packageVersion,outPack,parentStr){
        if(!packageVersion) packageVersion = '*';

        writeSameLine('reading: ' + packageName+'@'+packageVersion);

        packageReads[packageName+'@'+packageVersion] = packageReads[packageName+'@'+packageVersion] ? ++packageReads[packageName+'@'+packageVersion] : 1;

        //MLM: This is considered internal API but does give us the version we want.
        npm.commands.cache.read(packageName,packageVersion,false,function(err,resolvedPackage) {
            packageReads[packageName+'@'+packageVersion] = packageReads[packageName+'@'+packageVersion] ? --packageReads[packageName+'@'+packageVersion] : -1;
            if(packageReads[packageName+'@'+packageVersion] === 0){
                delete packageReads[packageName+'@'+packageVersion];
            }
            if(!err && resolvedPackage){
                var dependencies = resolvedPackage.dependencies;
                outPack[packageName] = {
                    version: resolvedPackage.version,
                    from: resolvedPackage._from,
                    resolved: resolvedPackage._resolved,
                    dependencies: {},
                };
                if(resolvedPackage.dependencies && Object.keys(resolvedPackage.dependencies).length > 0){
                    if(parentStr.indexOf(packageName + '@' + resolvedPackage.version ) < 0){
                        var newParentStr = parentStr + packageName + '@' + resolvedPackage.version + '/';
                        eachDep(dependencies,outPack[packageName],newParentStr);
                    }
                }
            }
        });
    }

    function eachDep(dependencies,outPack,parentStr){
        Object.keys(dependencies).forEach(function(packageName){
            var newParentStr = parentStr || '';
            explorePackage(packageName,dependencies[packageName],outPack.dependencies,newParentStr);
        });
    }


    npm.load(function(err,npm){
        if(!err){
            // Add dev dependencies
            if(!inPackage.dependencies) inPackage.dependencies = {};

            if(!opts.production && inPackage.devDependencies){
                Object.keys(inPackage.devDependencies).forEach(function(key){
                    inPackage.dependencies[key] = inPackage.devDependencies[key];
                });
            }
            // Add optional dependencies
            if(inPackage.optionalDependencies){
                Object.keys(inPackage.optionalDependencies).forEach(function(key){
                    inPackage.dependencies[key] = inPackage.optionalDependencies[key];
                });
            }
            writeSameLine('Discovering dependencies...');
            eachDep(inPackage.dependencies,self.packages,'');
            var lastKeysLength = 0;

            var interval = setInterval(function() {
                var currentKeysLength = Object.keys(packageReads).length;

                if(currentKeysLength === lastKeysLength && lastKeysLength < 2){
                    clearInterval(interval);
                    processEachDep(self.packages);
                }else{
                    lastKeysLength = currentKeysLength;
                }
            },5000);

        }else console.log('\nNPM Error: ',err);
    });


};

