
module.exports = install;

var npm = require('npm');
var fs = require('fs');
var rimraf = require('./rimraf');
var mkdirp = require('./mkdirp');
var fork = require('child_process').fork;

process.on('message',function(installDetails){
    console.log('hello: ',installDetails);
    installDetails.path = installDetails.path || __dirname;
    console.log('MLM: changing dir to: ',installDetails.path);
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
        console.log('starting executing... ',path);
        runningKid = true;
        //setTimeout(function() {
        //    runningKid = false;
        //},1000);
        var child = fork(__dirname + '/install.js');

        child.send({
            packages: packages,
            path: path
        });
        child.on('message',function(result){
            console.log('done executing... ',path);
            //console.log('parent got',result);
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
                if(pack !== '__VERSION__' && pack !== '__NUMDEPS__' && pack !== '__CHILD__'){
                    toInstall.push(pack +'@'+ packages[pack].__VERSION__);
                }
            }
            console.log('---- MLM: ',path,':');
            console.log(toInstall);
            //cb({
            //    success: true,
            //});
            npm.commands.install(toInstall, function(err,installed) {
                if(!err && installed){

                    for(var pack in packages){
                        if(pack !== '__VERSION__' && pack !== '__NUMDEPS__'){
                            runKid(packages[pack],path + '/node_modules/' + pack,cb);
                        }
                    }
                    //installed.forEach(function(item){
                        //console.log('next up..',item);
                    //});
                }
            });
        }else{
            cb({
                success: true
            });
        }
    });
}

