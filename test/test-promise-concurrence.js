const exec = require('child_process').exec;
const { wrap: async } = require('co');
const fs = require('fs');

var hello = async(function*(req, res) {
	var times = new Date().getTime();
    const projectPath = 'D:\\test1';
    let projectsDefault = fs.readdirSync(projectPath);
    let projects = [];
    projectsDefault.forEach(function(item) {
        if (item !== '.svn') {
            projects.push(item);
        }
    });
    var execCommandPromise = [];
    for (let item of projects) {
    	console.log(item)
    	yield execCommand(projectPath+"\\"+item);
        // execCommandPromise.push(execCommand(projectPath+"\\"+item));
    }
    // yield execCommandPromise;
    console.log(execCommandPromise)
    
    console.log(new Date().getTime()-times);
});

function execCommand(path) {
    return new Promise(function(resolve, reject) {
        exec('gfe output -all', { cwd: path }, function(error, stdout, stderr) {
            if (error) {
                reject(error);
            } else {
                if (path.indexOf('.svn') == -1) {
                    let configFilePath = path + '/config.json';
                    let configContent = JSON.parse(fs.readFileSync(configFilePath));
                    resolve(configContent);
                }
            }
        });
    });
}

hello();
