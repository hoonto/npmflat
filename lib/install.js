
module.exports = install;

var npm = require('npm');
var fs = require('fs');
var rimraf = require('./rimraf');
var fork = require('child_process').fork;

process.on('message',function(installDetails){

    console.log('MLM: changing working directory to: ',installDetails.path);
    process.chdir(installDetails.path);

    function haveNPM(err,npm) {
        install(installDetails.packages,installDetails.path,function(result) {
            process.send(result);
        });
    }

    npm.load(haveNPM);


});

var runningKid = false;
function runKid(packages,path,cb){
    if(!runningKid){
        runningKid = true;
        var child = fork(__dirname + '/install.js');

        child.send({
            packages: packages,
            path: path
        });
        child.on('message',function(result){
            runningKid = false;
            cb({
                success: true,
            });
            //child.disconnect();
        });
    }else{
        setTimeout(runKid.bind(this,packages,path,cb),100);
    }
}

function install(packages,path,cb){

    rimraf(path + '/node_modules',function() {
        if(Object.keys(packages).length > 2){
            var toInstall = [];
            for(var pack in packages){
                if(pack !== '__VERSION__'){
                    toInstall.push(pack +'@'+ packages[pack].__VERSION__);
                }
            }
            npm.commands.install(toInstall, function(err,installed) {
                if(!err && installed){
                    for(var pack in packages){
                        if(pack !== '__VERSION__'){
                            runKid(packages[pack],path + '/node_modules/' + pack,cb);
                        }
                    }
                }
            });
        }else{
            cb({
                success: true
            });
        }
    });
}

