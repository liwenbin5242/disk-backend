#### 使用须知 ####
1. 云服务器 (推荐配置2c4g)
2. 域名
3. 百度网盘开放平台注册应用,提供clientid、clientsecret、signKey、redirecturi，其中redirecturi格式建议使用 http://disk.你的域名/oauth_redirect
4. ex.配置如图所示的二级域名DNS指向云服务器
    aassc.cn
    api.aassc.cn
    disk.aassc.cn
    http://disk.aassc.cn/oauth_redirect
5. 运行环境依赖:
    3.1 nodejs v16.xx
    3.2 nginx
    3.3 mysql 5.5.x
    3.4 redis 5.0
    3.5 mongodb 4.4
6. 代码依赖
    disk-backend后端 (如果安装argon2不成功可以使用 npm install argon2 --build-from-source，也可以升级node到v20使用yarn安装 yarn install)
        1.对应niginx配置需要添加  client_max_body_size 10000m; 文件上传小大限制在10gb;(注意前后端代码都需要配置)
        2.配置config文件的BaiDuDisk 密钥信息
        3.配置mysql
    disk-client前端后台管理
        修改代码配置1.域名 2.api域名 3.百度网盘appid
        对应niginx配置需要添加 
            try_files $uri $uri/ /index.html;
            client_max_body_size 10000m;
    disk-mp移动端
        对应mginx配置需要添加 add_header Referrer-Policy "no-referrer";
