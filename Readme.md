#### 安装须知 ####
1. 云服务器
2. 自备域名，并且配置如图所示的二级域名,例如域名是aassc.cn 
    mulu.aassc.cn
    api.aassc.cn
    disk.aassc.cn
3. 运行环境依赖:
    3.1 nodejs v16.xx
    3.2 nginx
    3.3 mysql 10.5
    3.4 redis 5.0
    3.5 mongodb 4.4
4. 代码依赖
    disk-backend后端 (安装argon2不成功可以使用 npm install argon2 --build-from-source)
        1.对应niginx配置需要添加  client_max_body_size 10000m 文件上传小大限制在10gb;(注意前后端代码都需要配置)
        2.配置config文件的BaiDuDisk 密钥信息
        3.配置mysql
    disk-client前端后台管理
        修改代码配置1.域名 2.api域名 3.百度网盘appid
        对应niginx配置需要添加 try_files $uri $uri/ /index.html;
    disk-mp移动端
