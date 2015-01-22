var npmflat = module.exports;
var npm = require('npm');
var fs = require('fs');
var rimraf = require('./rimraf');
var mkdirp = require('./mkdirp');
var fork = require('child_process').fork;


npmflat.packageBuilder = new PackageBuilder();
npmflat.packages = {};
npmflat.maxDepsNum = 0;

function PackageBuilder() {
}

PackageBuilder.prototype.build = function(inPackageName,outPackageName){
    var inPackage = require('../'+inPackageName);
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
                    '__NUMDEPS__': totalDependencies,
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
            if(pack !== '__VERSION__' && pack !== '__NUMDEPS__'){
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
        child.send({ packages: packages });
        child.on('message',function(result){
            //console.log('parent got',result);
            //child.disconnect();
        });
        /*
        if(!path) path = '.';
        process.chdir(path);

        rimraf(path + '/node_modules',function() {
            if(Object.keys(packages).length > 2){
                var toInstall = [];
                for(var pack in packages){
                    if(pack !== '__VERSION__' && pack !== '__NUMDEPS__'){
                        toInstall.push(pack +'@'+ packages[pack].__VERSION__);
                    }
                }
                //console.log('MLM: installing: ',toInstall);
                npm.commands.install(toInstall, function(err,installed) {
                    if(!err && installed){

                        for(var pack in packages){
                            if(pack !== '__VERSION__' && pack !== '__NUMDEPS__'){
                                var newPath = path + '/node_modules/' + pack;
                                console.log('nextup: ',newPath,packages[pack]);
                                install(packages[pack],newPath);
                            }
                        }
                        //installed.forEach(function(item){
                            //console.log('next up..',item);
                        //});
                    }
                });
            }
        });
        */
    }

    function processEachDep(out,depth){
        if(depth === 0){
            console.log('compressing...');
            //fs.writeFile(__dirname + '/uncompressed.json', JSON.stringify(npmflat.packages,null,4), function(err){
            //    if(!err) console.log('it is written 1');
            //    else console.log(err);
            //});

            var marker;
            do {
                marker = { quit: true };
                compress(npmflat.packages,marker);
            }while(!marker.quit);

            install(npmflat.packages);

            fs.writeFile(outPackageName, JSON.stringify(npmflat.packages,null,4), function(err){
                if(!err) console.log('it is written 2');
                else console.log(err);
            });

        }

    }

    function haveNPM(err,npm) {
        if(err){
            console.log('Error: ',err);
        }
        console.log('discovering...');
        eachDep(inPackage.dependencies,npmflat.packages,processEachDep);
    }

    npm.load(haveNPM);
};

