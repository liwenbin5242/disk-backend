const axios = require('axios');
const qs = require('querystring');

// ====================== 配置区（仅需修改这一个地方！）======================
const COOKIE = 'b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; __sdid=AAQefbLxmWtvtjdc9VFz8z2Kk+EGRBEG9ygXQXREgw4z5gv6oTvSPXJhus8/3gPWEXksmNE/AySo8o50LzMkFYiDyr+pq2X1ZtZmfLg9zoOLOQ==; _UP_D_=pc; _UP_A4A_11_=wba29198c5ae47fbb9e81eb4fedc4664; _UP_30C_6A_=sta296201f4gb76vcdb723w9rl0z8029; _UP_TS_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_E37_B7_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_TG_=sta296201f4gb76vcdb723w9rl0z8029; _UP_335_2B_=1; __pus=2402e37f4a873eaaa9a3d1377c0a959bAASOXZVXFVkCsgngo4zl/wvCGEpirw114R4jYwhYnxX9eJaf3NmBa8jbUpMeNI1HzVXxHeqX07/Uda3q/tsYeu8K; __kp=29705270-fce6-11f0-bffe-05105f217963; __kps=AARVL1p0yub6Ld6xFpIaKZBu; __ktd=uvJoPN9QS2g2OBYY0i3KtQ==; __uid=AARVL1p0yub6Ld6xFpIaKZBu; cs_xcustomer_switch_user_key=27640a8c-23e6-4a81-83e6-c43b1af88b8b; xlly_s=1; __puus=1f7ddd76ee9319ed46c88572b978b3c3AAR5rduFrpXR/VxfoEQptOjt46Qn4w6uYmEtu4jBSRXUgWjM4Xz2fh0zD8Ku7xiO/IT0jyl8Tqt5e7kFSWX6H63SE82pPaKoDpNhqQJVxOUKlKXsWmajvhv/DMBgrZgHFjRGmfyal7ltjXFWdqeXm5uk08/fDC6s+T1Q4qnXu38GK3812MzXucmFciF1arvfS6u3BVb1ochIvjsYfnj0dG6S; tfstk=go6EmrcLyJeed1Uc0ivz3uW9RYppoLzX-TTWqgjkAeYHFWCP_gs4v3_CqU5ySgLHrL4Jzdb2mTZJ-LvM7FbGAvTWKUmPPg1CzgEpqUblzU1Q1-sdvLpulTybhMBOrxSPzBYHSFj9xU031BX5IOBalrwbhWmMUyzfAWwgDdxJSHxk-XqwI3KDEHvk-l8M4nho-avubl-2xHYkqv2is38MrLvlrGqwVFxHELbljl--NkshqA-XtkfIRuKj9lT6oMYZExovxBX0HekoUO8lbEjnMYDlQHRFQL0MsBRCZidAdiwrBpsVsdxPeocyzI5lddX3S-A9Z_7kX1UraE5lAsB6s0chbT8ei9AZ0Ajwp3bka1UqhHJC_IWF9u3GxZTFipIS0yswg1RvjCmrtp1fcTdcKJuv5IKP7I1Uuv7c440Jj49ce6uoaBx9bEZabqW1pk5iz08EwbdMHh8bAHG-wBx9bEZabbhJsnKwlktC.; isg=BAYGy3Izk5Dz10cN4UAUbQ5nV_yIZ0ohDsYtA_AvkykE86INWfKvMsvBzy8_20I5'; // 替换成自己的Cookie
const SHARE_URL = 'https://pan.quark.cn/s/0fb69ff566ad'; // 你的短分享链接
const TARGET_FILE_ID = '0'; // 转存目标文件夹ID，0=我的网盘根目录，可自定义子文件夹ID
// ==========================================================================

// 全局请求头配置（模拟浏览器，避免被风控）
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Cookie': COOKIE,
  'Referer': 'https://pan.quark.cn/',
  'Origin': 'https://pan.quark.cn',
  'Content-Type': 'application/json;charset=UTF-8'
};

// 实例化axios，禁止重定向（方便提取pwd_id）
const axiosInstance = axios.create({
  maxRedirects: 0, // 关键：关闭自动重定向，捕获302响应提取pwd_id
  validateStatus: status => status >= 200 && status < 400, // 允许302状态码
  headers: COMMON_HEADERS
});

/**
 * 步骤1：解析短分享链接，提取pwd_id
 */
async function getPwdId(shareUrl) {
  try {
    const res = await axiosInstance.get(shareUrl);
    // 夸克短链接会302重定向，pwd_id在重定向的location中
    const location = res.headers.location;
    if (!location) {
      throw new Error('解析短链接失败，未找到重定向地址');
    }
    // 从location中提取pwd_id参数
    const pwdIdMatch = location.match(/pwd_id=([^&]+)/);
    if (!pwdIdMatch) {
      throw new Error('从重定向地址中提取pwd_id失败');
    }
    const pwdId = pwdIdMatch[1];
    console.log(`✅ 解析成功，pwd_id：${pwdId}`);
    return pwdId;
  } catch (err) {
    throw new Error(`解析pwd_id失败：${err.message}`);
  }
}

/**
 * 步骤2：根据pwd_id获取共享资源的stoken
 * @param {string} pwdId - 共享资源的pwd_id
 */
async function getShareStoken(pwdId) {
  try {
    const res = await axios.post(
      'https://drive-pc.quark.cn/1/clouddrive/share/sharepage/token',
      JSON.stringify({ pwd_id: pwdId }),
      { headers: COMMON_HEADERS }
    );
    const { data, code } = res.data;
    if (code !== 0) {
      throw new Error(`获取stoken失败，服务端返回：${res.data.msg}`);
    }
    const stoken = data.stoken;
    console.log(`✅ 获取成功，stoken：${stoken}`);
    return stoken;
  } catch (err) {
    throw new Error(`获取stoken失败：${err.response?.data?.msg || err.message}`);
  }
}

/**
 * 步骤3：调用转存接口，将共享文件转存到自己的网盘
 * @param {string} pwdId - 共享资源pwd_id
 * @param {string} stoken - 共享资源stoken
 * @param {string} targetFileId - 目标文件夹file_id
 */
async function saveToMyPan(pwdId, stoken, targetFileId) {
  try {
    const res = await axios.post(
      'https://drive-pc.quark.cn/1/clouddrive/share/save',
      JSON.stringify({
        pwd_id: pwdId,
        stoken: stoken,
        file_id: targetFileId, // 转存目标文件夹ID
        save_type: 1 // 固定值，1=转存文件/文件夹
      }),
      { headers: COMMON_HEADERS }
    );
    const { code, msg } = res.data;
    if (code === 0) {
      console.log('🎉 转存成功！文件已保存到你的夸克网盘根目录');
      return true;
    } else {
      throw new Error(`转存失败，服务端返回：${msg}`);
    }
  } catch (err) {
    throw new Error(`转存接口调用失败：${err.response?.data?.msg || err.message}`);
  }
}

// 主执行函数
async function main() {
  try {
    console.log('🔍 开始解析短分享链接...');
    const pwdId = await getPwdId(SHARE_URL);

    console.log('🔑 开始获取共享资源stoken...');
    const stoken = await getShareStoken(pwdId);

    console.log('📤 开始执行转存操作...');
    await saveToMyPan(pwdId, stoken, TARGET_FILE_ID);
  } catch (err) {
    console.error('❌ 操作失败：', err.message);
  }
}

// 执行主函数
main();