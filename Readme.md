前置条件
1. ubuntu服务器
2. 域名 
    mulu.xxxx.xx
    api.xxxx.xx
    disk.xxxx.xx
运行环境依赖:
    nodejs v16.xx
    nginx
    pgsql 11.15
    redis
    mongodb 4.4
1.代码依赖
    disk-backend  
        1.对应niginx配置需要添加  client_max_body_size 10000m 文件上传小大限制在10gb;
        2.配置config文件的BaiDuDisk信息
        3.配置PGSQL 版本11.15数据库密码, PGSQL需要配置全网可访问 host all all 0.0.0.0/0 trust
    disk-client
        修改代码配置1.域名 2.api域名 3.百度网盘appid
        对应niginx配置需要添加 try_files $uri $uri/ /index.html;
    disk-mp
