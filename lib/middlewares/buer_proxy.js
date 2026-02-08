const proxy = require('express-http-proxy'); 
const { logger } = require('../../utils/logger');
const axios = require('axios')
class Proxy {
    constructor() {
        this.proxy = proxy;
    }
    proxyServer() {
        return this.proxy('buerchen.top', {
            proxyReqPathResolver: async (req) => {
                logger.info(`执行代理请求`)
                return req.originalUrl.replace(req.baseUrl ,'');
            },
            proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
                proxyReqOpts.headers['referer'] = 'https://buerchen.top';
                return proxyReqOpts;
            },
            userResDecorator: async function(proxyRes, proxyResData, userReq, userRes) {
                // 将代理响应数据存储到req中，供transfer中间件使用
                // proxyResData 是 Buffer 类型，需要转换为字符串
                let responseDataString;
                
                if (Buffer.isBuffer(proxyResData)) {
                    responseDataString = JSON.parse(proxyResData.toString('utf8'));
                    if(userReq.path.includes('api2/decrypt') || userReq.path.includes('other/save_url')) {
                        const result = await axios.post('http://127.0.0.1:3000/api/transfer', {
                            "path":"/",
                            "cookie":"b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; __sdid=AAQefbLxmWtvtjdc9VFz8z2Kk+EGRBEG9ygXQXREgw4z5gv6oTvSPXJhus8/3gPWEXksmNE/AySo8o50LzMkFYiDyr+pq2X1ZtZmfLg9zoOLOQ==; _UP_D_=pc; _UP_A4A_11_=wba29198c5ae47fbb9e81eb4fedc4664; _UP_30C_6A_=sta296201f4gb76vcdb723w9rl0z8029; _UP_TS_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_E37_B7_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_TG_=sta296201f4gb76vcdb723w9rl0z8029; _UP_335_2B_=1; __pus=2402e37f4a873eaaa9a3d1377c0a959bAASOXZVXFVkCsgngo4zl/wvCGEpirw114R4jYwhYnxX9eJaf3NmBa8jbUpMeNI1HzVXxHeqX07/Uda3q/tsYeu8K; __kp=29705270-fce6-11f0-bffe-05105f217963; __kps=AARVL1p0yub6Ld6xFpIaKZBu; __ktd=uvJoPN9QS2g2OBYY0i3KtQ==; __uid=AARVL1p0yub6Ld6xFpIaKZBu; __wpkreporterwid_=607d3eb7-2e6b-46f2-0203-02d44f155a7e; cs_xcustomer_switch_user_key=27640a8c-23e6-4a81-83e6-c43b1af88b8b; xlly_s=1; __chkey=; _er_uuid=BHHADAAIIACBG-HcbXna91IX; _er_is_back_to_node=0; ctoken=web_i-YmlnnGMCmfYS0K60sy; web-grey-id=8b419d34-1efd-f16e-83b8-ef22b7e8f437; web-grey-id.sig=CWKc66fOf0giz31FYaJVMyNmQS-lodL4vR4lS4q2J2M; grey-id=c63878d3-ca1f-c9c0-0a4b-364d41aa2ae8; grey-id.sig=bJLgCPul-vHR7HBCDFV_o1AnR_ytVTjgVXjW58XFrxY; isQuark=true; isQuark.sig=hUgqObykqFom5Y09bll94T1sS9abT1X-4Df_lzgl8nM; __puus=613ab2f958566bbded3069013bf9d51fAAR5rduFrpXR/VxfoEQptOjtAuAwB7gQGSjyDrEMv3S0ihh7qregN/YeP5hj7eT5NBmEz2nMo5XJ2eN3CNOzj6RmGkiHSjodod6XokcDONlfoYWy5HRooIBRH4BCa8DigBQOtVwzBiQe8dAk5H2Od8tAKzFNPhs5f9cTqlR+VWzxtfAVjvr5zdHB950zjRMALMnCgZ7ER61vmy3gPblJoKam; tfstk=gKJtoewrJ20MM7DIyRcnm9tkQvmHWXxwYF-7nZbgGeLp0ECcG1jGHsT1-dfcCNYLAGYWIr1fGMNBrGU6COTmHZtP8RYm_s2vJij_GrwbC61vygz6nZ11O96wKC2cSVWvcUXxr4DoEh-NUtgortNAURX5VRw_ossQdtjvfPQ-Eh-N3kr3lbABbxHkxnS1hE6COis1hG6b1DUCcww1cRsbRDIVRtsb1twIdgIzl-1XlHid0w_fh1TfdDIVRZ6fhjyZkwZ1o-dpApO0T4_Yh-9dX6GHfwaVOpsO6at6B-wb4GCOPh_KWSHQy6tVMKr4H_x6aESW5PgAupKBCQTS-5b6wiKkMUH73MR6Wp1vKmkJAOIANt1Lc-tddZ1WITM7JMRBjI9wWoefbdvlMa5Kc-5cdLfWNFEq4H61cE5yn4yN5ntyUQX-BzS9O3Bd47pkeiZ8raI01DnLgS51YwJa-Fic5QaPvamtHSPVTDSdrDnLgS51YMQoXmF4g6oF.; isg=BI-P2VQDOgMTcj4CUBMt2s-kHiOZtOPWb2W0TKGcCP4FcK5yqYXCJnhidqBOCLtO",
                            "url":responseDataString.data.url
                        })
                        return Buffer.from(JSON.stringify(result.data.data))    
                    }
                } else if (typeof proxyResData === 'string') {
                    responseDataString = proxyResData;
                } else {
                    // 如果已经是对象，直接转换为JSON字符串
                    responseDataString = (proxyResData);
                }

                
                // 返回原始数据给客户端
                return proxyResData;
            }
        });
    }
}
module.exports = new Proxy();