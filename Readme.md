#### 安装须知 ####
1. ubuntu() 云服务器
2. 自备域名，并且配置二级域名 
    mulu.xxxx.cn
    api.xxxx.cn
    disk.xxxx.cn
3. 运行环境依赖:
    3.1 nodejs v16.xx
    3.2 nginx
    3.3 pgsql 11.15
    3.4 redis 5.0
    3.5 mongodb 4.4
4. 代码依赖
    disk-backend后端 
        1.对应niginx配置需要添加  client_max_body_size 10000m 文件上传小大限制在10gb;
        2.配置config文件的BaiDuDisk 密钥信息
        3.配置PGSQL 版本11.15数据库密码, PGSQL需要配置全网可访问 host all all 0.0.0.0/0 trust
    disk-client前端后台管理
        修改代码配置1.域名 2.api域名 3.百度网盘appid
        对应niginx配置需要添加 try_files $uri $uri/ /index.html;
    disk-mp移动端
