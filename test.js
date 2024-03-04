const axios = require('axios');
const qs = require('qs');
let data = qs.stringify({
  'data': '{"send_type":3,"receiver":["1350897088"],"msg_type":1,"msg":"欢迎添加","fs_ids":[],"receiver_name":["不*能改"]}'
});

async function a () {
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://pan.baidu.com/imbox/msg/send?clienttype=0&app_id=250528&web=1',
        headers: { 
          'Host': 'pan.baidu.com', 
          'Connection': 'keep-alive', 
          'Content-Length': '212', 
          'Accept': 'application/json, text/plain, */*', 
          'X-Requested-With': 'XMLHttpRequest', 
          'User-Agent': 'Mozilla/5.0; (Windows NT 10.0; WOW64); AppleWebKit/537.36; (KHTML, like Gecko); Chrome/86.0.4240.198; Safari/537.36; netdisk;7.36.0.3;PC;PC-Windows;10.0.22000;WindowsBaiduYunGuanJia', 
          'Content-Type': 'application/x-www-form-urlencoded', 
          'Accept-Language': 'en-US,en;q=0.9', 
          'Origin': 'https://pan.baidu.com', 
          'Sec-Fetch-Site': 'same-origin', 
          'Sec-Fetch-Mode': 'cors', 
          'Sec-Fetch-Dest': 'empty', 
          'Referer': 'https://pan.baidu.com/disk/im?hideHeader=1&hideFirstNav=1&from=person-wins', 
          'Accept-Encoding': 'gzip, deflate, br', 
          'Cookie': 'BAIDUID=DF2AF3B3470C9B68C5B0B2C4F95059D4:FG=1; BAIDUID_BFESS=DF2AF3B3470C9B68C5B0B2C4F95059D4:FG=1; BDUSS=3NMTG84TWtZZHlYZ2Q3UTZYLXdaOHIwRE1SNlZlZWNsWWRJdTVQNEFhMVJ3ZFpsRVFBQUFBJCQAAAAAAAAAAAEAAAC-p9csZWFydGi637rfuf65~gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFE0r2VRNK9lR; STOKEN=98c803321a95c7136bad127a6ccabc31621c466a0c2a37436504d13dee1271a3; csrfToken=nFrBjOUxS9Ey9YtPE9iPOG4p; BDUSS_BFESS=3NMTG84TWtZZHlYZ2Q3UTZYLXdaOHIwRE1SNlZlZWNsWWRJdTVQNEFhMVJ3ZFpsRVFBQUFBJCQAAAAAAAAAAAEAAAC-p9csZWFydGi637rfuf65~gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFE0r2VRNK9lR; PANPSC=12768740088278174854%3ACU2JWesajwASvH%2BYG1HuUYYFB6Yu73HpdNVK4bzhrNviLuK4C6XezCBQrRnvj9jsWEpanCc0POUI5%2BB0eenXj%2FlimNTWerUR5zUXy1f38gUQhld0TWFyya5oGF6gyXnJZP8wreJm86jUl86%2BnzS%2BXUBb7VhrH%2FEtX2XlUsKRi0awbthkud9n5RkJMsEpLrsSMRmYrlFHgmq%2BCKxnUChbPxDmpK%2FQQBiX%2BBPsSDpTJNs%3D; BAIDUID=CC88A19811089D361F6D30FFC12281EC:FG=1; BAIDUID_BFESS=CC88A19811089D361F6D30FFC12281EC:FG=1'
        },
        data : data
      };
      
    const res =  await axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
      res
}
a()
