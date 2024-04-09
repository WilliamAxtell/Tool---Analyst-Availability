import fs from 'fs';
import util from 'util';
const __dirname = import.meta.dirname;

const fileLog = fs.createWriteStream(__dirname + '/server.log', {flags : 'a'});
const errorLog = fs.createWriteStream(__dirname + '/error.log', {flags : 'a'});
const logOutput = process.stdout;
// the flag 'a' will update the stream log at every launch
console.log  = (e) => {
    fileLog.write(util.format(e) + " ~ " + Date(Date.now()) + '\n');
    logOutput.write(util.format(e) + '\n');
};

console.error = (e) => {
    errorLog.write(util.format(e) + " ~ " + Date(Date.now()) + '\n');
}

export default console;