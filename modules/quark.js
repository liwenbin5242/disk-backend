'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); 
const urlencode = require('urlencode');
const urldecode = require('urldecode');
const rediser = require('../utils/rediser');

moment.locale('zh-cn');

/**
 * 获取用户关联的quark账号
 * @param {*} username
 */
async function getQuarkDisks(username) {
  const user = await diskDB.collection('users').findOne({ username });
  if (!user) {
    throw new Error('用户不存在');
  }
  const disks = await diskDB
    .collection('quark_disks')
    .find({ username: user.username })
    .sort({ ctm: -1 })
    .toArray();
    return {
      total: disks.length,
      list: disks.map((d) => {
        return Object.assign(
          d.info.data || {},
          d.quota.data || {},
          d.id,
          d.cookie,
          d.bdstoken,
          d.dir_tree_status,
          d.disabled || { disabled: true }
        );
      }),
    };
}

/**
 * 转存quark url
 * @param {String} url quark url
 * @param {String} title 标题
 */
async function saveUrl(url, title) {
  const res = await axios.post('https://buerchen.top/api/other/save_url', {
    title: urldecode(title),
    url,
  });
  // 转存数据到quark
  const res2 = await fetch("https://drive-h.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc&uc_param_str=", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "bx-ua": "231!HV+36+mU6Ek+joTBu478OKDjUGg0uSOn+fOSk+rou4DaIpSH/4rFBxXBdWVH/4OmBkPLH+4lDtyNnMy0rXrK7gWEL5ZgeFlGUaBYEMcfcBf+27IeGAMS/3Lv3nIMXKN2yizji0FhkaE+BXOria0Zzm84jC0XQ/qIP8Y5Yd+XWTMYlwGoMFDeGlLNUJ0d0J8A3OEfaKLDGNMtm7PBWQDG5FHwLhZO1H7D+itkQSJBRdtkh1d9g5L1PdoFKP6sxWVl9VFy3ko10Q3oyE+jauHhUiRJNiIGHkE+++3+qCS4+ItgU46/CmjCo+4oC4GyZg5Ng3o1yOX8j6Jkluu64yOXkpWZtAJhQXWCdq4UWR0G+baAFuQIgfYyE8YH8jNG55+rHjXnyUValuJ4kfuIdqxktqMob0W20cU/605waJCT+dIVIKLwUwrC8livli1mzoijz5PEYDRpDXfJ3nJjwGxGg8ItNCl2+eapV8fHSNXVtF5QRK6d+5BzuDiy/5BkCJ4qxvyIT5tevcIcYeythWxMhU+5XcT66kZk45FX+sML1LNDS9usOOqFLqvOXIKsFl1LELsf/w7x1Vo1jmponQ2b60jAzorL577ERu/0Nk1JmovYOXeFM67w30JfO3E6JMqWkJP7ibDLdcWyJbs1TqGS1US9BmRMGJlXwuEPwOHp7dFMJOjNHRk2wJjCewpJEZmyMlJGiQbDnXHgBecK1FeTeRKAfzoeqMdtavYO3z7iJ7G3jOsE2JFtb53rpcAy6v2Aw1sK64XFCs53GR/hAJFxDsuAUIuIJqo3GrMgakMOhsmEWT+c1nP4iUwVL27wgiAC0bzVHD+Yojq02D3t+PT/oWRBbsLb4bjD2/cVLBNqgqQ7iWs3E843epfMlJjvmsSoOTAjWO60V7p7oHKTr1PeRiz8y2ez6QBk2UxX+M+J9btjRsDRdMVVtW+5L2KSu0QFr03dNHj4v8im5OuM9GKbt68uxOZurvXdWlm5T7u2abp7fBpnRglKA8pCgvOSHirVbCjFxg19VlQV1fgY/Dgj6Wetwjh/G8UAvt7rsmADQOhQ7+TlpMly06ipcnqJ8bQjVS3tbtOxInBLcVkC0lZwfOF+Za5ET0D4nusBKIJGiy/zEN7T7o1K15u/ruKfJ+Ja6eIvOrmtDEA80pA4VW7MQGJ1ZjTL7cv+uZjYQkuwjMzhaA7HOGQuR+xi2OpxZleAcgidtDPDITb0ry6avq5o2RuXLLIDPgmgYwFPV2o6Oace9ueU4kldEJRFXqaTbkePyrB39sEZxxyPsZcejmSBfcKIDunigmjJETot/E1twyFaPS7jA0YitLh+nPf60w2q3xGNVpyag8777bTs+LnaztS4XOAyg/qA+RrxMPY7JFkngJcsJb19nXdnDne8QRmSFdY72YL4ilVT0ca4SulaRG/grdtm6RFvJfdiVV1qYCBeqWRTPaa3z4a/swIiMbLxqAzXman6QJdLuUNzNw66Z8/0JvHk7pSca59Qy7JQQHGju8gyw0/FWaVNSeKuLdSx",
      "bx-umidtoken": "T2gAqO0IEm7r-RnSaheag_FKzIGuKU0YrXHw101Y9KiYBgRMztRAgaaK_U-J66O2mD0=",
      "bx_et": "gp2omWttS7lSyoTVIek5GqlmdgCvwYMIlypKJv3FgqujJgZLYvJUJkH-TaZLo2u4RWeKT6Gq-Dzgw0oFrrj3yk9Kz4eKKXztUXN-J43nKkaGDNBOBuZSdA7OWO3A3-2iU0JyU4Se0DidD0-Djyeidv7OWIpENODQrRXU1brVmDnpU3zEaooqlctrL4leuIoZu2kU8XW2gcinY0oeUxSmAqorLvzE3imKu2kELyrqgS9ESJyb3NmGrc7ri82mqaULm19HLb9twVonkp7an0vs7uuDLpuaKQ-zmuQkCoH7pPmTytJuSkr_Tj2HuN0QnoyzToTl-YqYPRDzIav-Dxgr_Wlc4TrmE4c3KjxpNYVUPJc7ZHs_0Yzb1VGPGZi0eRhn5jYVzoEmzfV3yZ9Ey5q4ofevkdHa1r2n_ASr7IRwCjvI0Me2OBGrcm0OlpQaruxzxnIcmC1SamiRWijDOBGrcm0OmiA6Pboj2NC..",
      "content-type": "application/json",
      "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "cookie": "b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; __sdid=AAQefbLxmWtvtjdc9VFz8z2Kk+EGRBEG9ygXQXREgw4z5gv6oTvSPXJhus8/3gPWEXksmNE/AySo8o50LzMkFYiDyr+pq2X1ZtZmfLg9zoOLOQ==; _UP_D_=pc; _UP_A4A_11_=wba29198c5ae47fbb9e81eb4fedc4664; _UP_30C_6A_=sta296201f4gb76vcdb723w9rl0z8029; _UP_TS_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_E37_B7_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_TG_=sta296201f4gb76vcdb723w9rl0z8029; _UP_335_2B_=1; __pus=2402e37f4a873eaaa9a3d1377c0a959bAASOXZVXFVkCsgngo4zl/wvCGEpirw114R4jYwhYnxX9eJaf3NmBa8jbUpMeNI1HzVXxHeqX07/Uda3q/tsYeu8K; __kp=29705270-fce6-11f0-bffe-05105f217963; __kps=AARVL1p0yub6Ld6xFpIaKZBu; __ktd=uvJoPN9QS2g2OBYY0i3KtQ==; __uid=AARVL1p0yub6Ld6xFpIaKZBu; cs_xcustomer_switch_user_key=27640a8c-23e6-4a81-83e6-c43b1af88b8b; xlly_s=1; __puus=6b6b4ce2a59c440844069cd91a690419AAR5rduFrpXR/VxfoEQptOjtb9BD0tyUSMZ6IvnuSBt+brNh2aPg5Pa13Qztj1o808FW2V+8GoBMz/C2ATHmdj/KwylubsRbEg5N7sR0zMKxTCXKGNbpWmODTmWF4QAAG6V/UBdvLMcAPllnaO7AaSg5rxOrIush63NMEOZCyC//qxNcTp9ve4+Xr+/Eg09tqGABL0SLqJR9KDTBOHdX0wHT; tfstk=g1gn0nfYnDrCO86woTzBfRrgPBKOjya7CYQ8ezeybRy_eBG-az7rebUL4pG-I8yZF03843ZaE7kmvWPyKAAopb_8LJ38rukY8uiLeJeurbMD6KLvkXGQPrJvHEe97V008W7F8JRP_7NJ6W5GiY30PzJvHGQzAE4SKqxy1ulws7FR86kzYllaC72P4YyUbOP0GzyrUYrw7SV4T7rUaOzaC7zzUYzysPy_ZzyrUzRi_b6hz-0r5VJ0ipV2LXdrQWq33XyE9XuZxtejTRbPzJV3xslUIa7rS0klnKyec1e7JJG_tYTfRyro42UZ8d8zumMirozD2BamscnYxcvFrR3LCo0Uo_8Esy230VqVaaHqsboYjVd2ly4UL0UIwsvKs2DKOVcRaGz3Jcqm-r8fL8nti4VoPLTinblj4l0lKgWNbi7bjaNwwVS5VkP_s-p1yKknt6ll6CAGcHZU1WpvsCj5VkP_s-dMsi6QY5NpH; isg=BGVldXBaYODt44TAFiWnOCEqdCGfohk0cTuuDmdKQRyrfobwLfd0B9FWDOII_jHs",
      "Referer": "https://pan.quark.cn/"
    },
    "body": "{\"pwd_id\":\"cfd2b2c3ee16\",\"stoken\":\"foVEXRNdcUvZTqxGcuHz0vpV5rp5U/EEoNnmSYCGodc=\",\"pdir_fid\":\"0\",\"to_pdir_fid\":\"7cd58117371b48fb93051c8e4c4511c9\",\"pdir_save_all\":true,\"scene\":\"link\"}",
    "method": "POST"
  });
  const data = await res2.json();
  // 调用kuark官方api转存

  // 将数据转入redis
  await rediser.set('quark_url:' + res.data.data.id, JSON.stringify(res.data.data));
  // 设置过期时间为1天
  await rediser.expire('quark_url:' + res.data.data.id, 60 * 60 * 24);
  return res.data.data;
}

async function getNotice() {
  const notice = await diskDB.collection('quark_notice').findOne();
  if (!notice) {
    throw new Error('通知不存在');
  }
  return notice || {};
}

module.exports = {
    saveUrl,
    getNotice,
    getQuarkDisks,
};
