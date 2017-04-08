let Client = require('ssh2-sftp-client');
const fs = require('fs');
let sftp = new Client();
// sftp.connect({
//     host: '192.168.195.128',
//     port: '22',
//     username: 'root',
//     password: 'liuzheng5@'
// }).then(() => {
//     return sftp.list('/hello');
// }).then((data) => {
// 	data = data.filter(function(item){
// 		return item.type !== 'd';
// 	}).sort(function(a,b){
// 		return a.modifyTime < b.modifyTime;
// 	});
//     console.log(data);
// }).catch((err) => {
//     console.log(err, 'catch error');
// });

sftp.connect({
    host: '192.168.195.128',
    port: '22',
    username: 'root',
    password: 'liuzheng5@'
}).then(() => {
    return sftp.get('/hello/file2');
}).then((data) => {
    // console.log(data.toString());
    data.pipe(fs.createWriteStream('d:\\test1\\hello'))
}).catch((err) => {
    console.log(err, 'catch error');
    // application/gzip
});


// [ { type: '-',
//     name: '.gtk-bookmarks',
//     size: 160,
//     modifyTime: 1488896961000,
//     accessTime: 1488896962000,
//     rights: { user: 'rw', group: 'r', other: 'r' },
//     owner: 0,
//     group: 0 },
//   { type: '-',
//     name: '.ICEauthority',
//     size: 3410,
//     modifyTime: 1488896959000,
//     accessTime: 1488896960000,
//     rights: { user: 'rw', group: '', other: '' },
//     owner: 0,
//     group: 0 }]