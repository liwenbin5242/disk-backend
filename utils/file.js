const fs = require('fs');
const path = require('path');
let toPdf = require('office-to-pdf');
class FileUtils {
    constructor() {}
    /**
   * 递归创建目录 异步方法
   * @param {*} dirname
   * @param {*} callback
   */
    MakeDirs(dirname, callback) {
        fs.stat(dirname, function (exists) {
            if (exists) {
                callback();
            } else {
                this.MakeDirs(path.dirname(dirname), function () {
                    fs.mkdir(dirname, callback);
                    console.log('在' + path.dirname(dirname) + '目录创建好' + dirname + '目录');
                });
            }
        });
    }
    /**
   * 递归创建目录 同步方法
   * @param {*} dirname
   */
    MkDirSync(dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (this.MkDirSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }

    /**
   *
   * @param {*} inpath
   * @param {*} outpath
   */
    async word2Pdf(inpath, outpath) {
        return new Promise(function (resolve, reject) {
            return fs.readFile(inpath, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    toPdf(result).then(
                        (pdfBuffer) => {
                            console.log(60, pdfBuffer);
                            fs.writeFileSync(outpath, pdfBuffer);
                            console.log('成功生成PDF文件'); // sendFileToServer('./pdf/test.pdf' , '/sftp/pdf/test.pdf')
                            resolve(outpath);
                        },
                        (err) => {
                            console.log(66, err);
                            reject(err);
                        }
                    );
                }
            });
        });
    }
}
module.exports = new FileUtils();
