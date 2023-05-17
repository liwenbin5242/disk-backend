前置条件
1. ubuntu服务器
2. 域名 
    mulu.xxxx.xx
    api.xxxx.xx
    disk.xxxx.xx
运行环境依赖:
    ubuntu  开启3101端口
    宝塔面板 开启3101端口
    nodejs
    nginx
    pgsql
    redis
    mongodb
1.代码依赖
    disk-backend  
        1.对应niginx配置需要添加  client_max_body_size 10000m 文件上传小大限制在10gb;
        2.配置config文件的BaiDuDisk信息
        3.配置PGDQL数据库密码
    disk-client 
        修改代码配置1.域名 2.api域名 3.百度网盘appid
        对应niginx配置需要添加 try_files $uri $uri/ /index.html;
    disk-mp
