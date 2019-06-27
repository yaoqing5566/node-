var fs = require('fs')
var http = require('http')
var url = require('url')
var util = require('util')
var fetch = require("node-fetch")
var path = require("path")
var request = require("request")
var rp = require("request-promise")

var configFile = "input.txt"
var isCheckEnd = false
var queue = [];
var currentIndex = 0;
var isDownloading = false

fs.readFile(configFile, function(err, data) {
    if(err) {
        console.log(err);
    } else {
        // console.log(data.toString());
        handleData(JSON.parse(data.toString()))
    }
})

function handleData(config) {
    // console.log(config)
    // handleUser(config[0])
    for(let i in config) {
        handleUser(config[i])
    }
}

function handleUser(userData) {
    var dataId = userData.dataId;
    var gaUrl = "http://minhang.haizitong.com/2/system/gb/order/data?dataId=" + dataId
    http.get(gaUrl, function(res) {
       var resData = ""
       res.on("data", function(data) {
           resData += data;
       })
        res.on("end", function() {
            // console.log(resData)
            var item = JSON.parse(resData);
            console.log("orderId:", item.orderId)
            var dirPath = "" + item.orderId;
            ensurePath(dirPath);
            if(item.orderId == undefined) {
                console.log("undefind!! order: ", dataId, item);
            }
            // handleGrowthArchive(item.orderId, dirPath, JSON.parse(item.data));
            // handleDownload()
        });
    });
}

function ensurePath(dirPath) {
    var dir = path.join(__dirname, dirPath);
    console.log('checkPath: ' + dirPath, dir);
    if(!fs.existsSync(dir)) {
        console.log('to create: ' + dir);
        fs.mkdirSync(dir);
    }
}

function handleGrowthArchive(orderId, dirPath, arrs) {
    // console.log(arrs)
    for(let i in arrs){
        let das=arrs[i].data;
        for(let j in das){
            let das2=das[j].files;
            for(let h in das2){
                if(das2[h].picHeight==das2[h].picWidth){
                    let url=das2[h].url;
                    if(das2[h].type=='v'){
                        url+='/i'
                    }
                    var filePath = dirPath + path.sep + "page_" + arrs[i].id + "-" + "pic_" + h + ".jpg"
                    // download(url, filePath);
                    console.log('page'+arrs[i].id+":-->"+url)
                    var item = {
                        orderId: orderId,
                        url: url,
                        filePath: filePath
                    };
                    queue.push(item)
                    // console.log("push, ", item)
                }

            }
        }
    }
}

function download(url, filePath, index) {
    // reqPromise(url, filePath)
    var stream = fs.createWriteStream(path.join(__dirname, filePath));
    request(url).pipe(stream).on("close", function(err) {
        console.log(err || filePath);
        isDownloading = false;
        currentIndex++;
        handleDownload();
    });

    // return fetch(url, {
    //     method: 'GET',
    //     headers: { 'Content-Type': 'application/octet-stream' },
    // }).then(function(res){
    //     return res.buffer();
    // }).then(function(_){
    //     fs.writeFile(path, _, "binary", function(err) {
    //         console.log(err || p);
    //     });
    // }).catch(function(err) {
    //     console.log(err);
    // });
}

function handleDownload() {
    console.log("index=" + currentIndex)
    if(currentIndex >= queue.length) {
        console.log("finish!!!!");
        return
    }

    if(isDownloading) {
        return ;
    }

    isDownloading = true;

    var item = queue[currentIndex];
    // console.log(queue)
    console.log(item, currentIndex)
    download(item.url, item.filePath, currentIndex);
}

async function reqPromise(url, filePath) {
    let options = {
        method: 'GET',
        uri: url,
        headers: { 'Content-Type': 'application/octet-stream' }
    };
    let body = await rp(options);
    fs.writeFileSync(filePath, body, "binary");
    console.log(filePath);
}