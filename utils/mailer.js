const nodemailer = require('nodemailer')
const { logger } = require('../utils/logger');

class Mailer {
    constructor () {
        this.transporter = nodemailer.createTransport({
            // 默认支持的邮箱服务包括：”QQ”、”163”、”126”、”iCloud”、”Hotmail”、”Yahoo”等
            service: "163",
            auth: {
                // 发件人邮箱账号
                user: 'zhishimao666666@163.com',
                //发件人邮箱的授权码 需要在自己的邮箱设置中生成,并不是邮件的登录密码
                pass: 'FUBRFWAUWMHYLTWF'
            }
        })
    }
    sendMail(code) {
        // 配置收件人信息
        const receiver = {
            // 发件人 邮箱  '昵称<发件人邮箱>'
            from: `zhishimao666666@163.com`,
            // 主题
            subject: '网盘助手',
            // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
            to: '294723284@qq.com',
            // 可以使用html标签
            html: `<h1>你好,欢迎注册网盘助手</h1>
            <br>
            <table width="100%" style="border-collapse: collapse; border-spacing: 0;border: 0;height:120px;">
                            <tr height="40px" style="padding: 0;border: 0;">
                                <td style="width: 20px;font-size: 16px;font-weight: bold;line-height: 21px;color: rgba(255, 95, 46, 1);"
                                    colspan="3">本次验证码:${code},有效时间:5分钟 </td>
                            </tr>
            </table>
            `
        }
        this.transporter.sendMail(receiver, (error, info) => {
            if (error) {
                return logger.error('发送失败:', error);
            }
            // this.transporter.close()
            logger.info('发送成功:', info.response)
        })
    }
}

 module.exports = new Mailer()