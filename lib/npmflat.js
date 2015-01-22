var npmflat = module.exports;
var npm = require('npm');
var fs = require('fs');
var rimraf = require('./rimraf');
var fork = require('child_process').fork;

npmflat.packageBuilder = new PackageBuilder();
npmflat.packages = {};
npmflat.maxDepsNum = 0;

function PackageBuilder() {
}

PackageBuilder.prototype.build = function(currentWD,inPackageName,outPackageName){
    var inPackage = require(inPackageName);
    var depth = 0;

    function explorePackage(pack,vers,outPack,cb){
        depth++;
        npm.commands.view([pack + '@' + vers,'dependencies'],true,function(err,deps){
            var lastDeps = deps[Object.keys(deps)[Object.keys(deps).length - 1]];
            var lastDepsVers = Object.keys(deps)[Object.keys(deps).length - 1];
            if(lastDeps){
                var totalDependencies = Object.keys(deps[lastDepsVers].dependencies).length;
                npmflat.maxDepsNum = totalDependencies > npmflat.maxDepsNum ? totalDependencies : npmflat.maxDepsNum;
                outPack[pack] = {
                    '__VERSION__': lastDepsVers,
                };
                //outPack[pack + '@' + lastDepsVers] = {};
                eachDep(lastDeps.dependencies,outPack[pack],cb);
                // Now we're popping up:
            }
            depth--;
            cb(outPack,depth);
        });
    }

    function eachDep(dependencies,outPack,cb){
        for(var pack in dependencies){
            explorePackage(pack,dependencies[pack],outPack,cb);
        }
    }

    function compress(packages,marker,parent){
        //For each node, find other nodes with the same name
        for(var pack in packages){
            if(pack !== '__VERSION__'){
                if(parent && !parent[pack]){
                    if(marker.quit) marker.quit = false;
                    parent[pack] = packages[pack];
                    delete packages[pack];
                }else if(parent && parent[pack] && parent[pack].__VERSION__ === packages[pack].__VERSION__){
                    if(marker.quit) marker.quit = false;
                    delete packages[pack];
                }
                compress(packages[pack],marker,packages);
            }
        }
    }

    function install(packages){

        var child  = fork(__dirname + '/install.js');
        child.send({
            path: currentWD,
            packages: packages
        });
        child.on('message',function(result){
            //child.disconnect();
        });
    }

    function processEachDep(out,depth){
        if(depth === 0){
            console.log('Flattening...');
            var marker;

            do {
                marker = { quit: true };
                compress(npmflat.packages,marker);
            }while(!marker.quit);

            install(npmflat.packages);

            if(outPackageName){
                fs.writeFile(currentWD + '/' + outPackageName, JSON.stringify(npmflat.packages,null,4), function(err){
                    if(!err) console.log('Writing flattened dependency graph:',outPackageName);
                    else console.log(err);
                });
            }
        }
    }

    function haveNPM(err,npm) {
        if(err){
            console.log('Error: ',err);
        }
        console.log('Discovering dependencies...');
        eachDep(inPackage.dependencies,npmflat.packages,processEachDep);
    }

    npm.load(haveNPM);
};

