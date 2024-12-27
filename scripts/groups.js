'use strict';
const mongodber = require('../utils/mongodber');
const config = require('config');
const utils = require('../lib/utils');
const cookie = 'PSTM=1722769133; BIDUPSID=2087EA9652072FEB69B3E9FAA54015FD; Hm_lvt_95fc87a381fad8fcb37d76ac51fefcea=1730107836; BAIDUID=AAC13EF6FC2E83270F9589E64E705C7F:SL=0:NR=10:FG=1; Hm_lvt_7a3960b6f067eb0085b7f96ff5e660b0=1730259559; PANWEB=1; BAIDUID_BFESS=AAC13EF6FC2E83270F9589E64E705C7F:SL=0:NR=10:FG=1; ZFY=TTQH4r1ihIqbB52yeKbwKhmxM1B8OUBYfz1i6xKitlQ:C; H_WISE_SIDS_BFESS=61027_61217_61296_60851_61372; newlogin=1; BDUSS=YySXhzTlNyWThtdG82dTl-elM2N3dZdFYweG11eFpJb0phSGVVbU4tfk5ZWXRuRVFBQUFBJCQAAAAAAQAAAAEAAABHbaKE0KHD97~GvLzK~cLrteoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM3UY2fN1GNnQ2; BDUSS_BFESS=YySXhzTlNyWThtdG82dTl-elM2N3dZdFYweG11eFpJb0phSGVVbU4tfk5ZWXRuRVFBQUFBJCQAAAAAAQAAAAEAAABHbaKE0KHD97~GvLzK~cLrteoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM3UY2fN1GNnQ2; STOKEN=1f6207899b40f1e9ea493e978e45d53cba9b15093a943302da36d200fc506e71; RT="z=1&dm=baidu.com&si=9ad2076b-fb7b-4c3d-96b1-35614426c758&ss=m4v636ic&sl=g&tt=bxn&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=2jj5"; H_WISE_SIDS=61027_61217_61372_61392_61389_61426_61444_61467_60853_61491_61430_61518_61529; BDRCVFR[EiXQVvOKA3D]=mk3SLVN4HKm; H_PS_PSSID=61027_61217_61372_61392_61389_61426_61444_61467_60853_61491_61430_61518_61529_61539_61564; delPer=0; PSINO=1; BA_HECTOR=0hak8lahak2h000h8l01a00k0t0il01jmkal21v; BDORZ=FFFB88E999055A3F8A630C64834BD6D0; csrfToken=KKJqZqe8TYZsxNwChyVeQsGJ; Hm_lvt_182d6d59474cf78db37e0b2248640ea5=1734515895,1734916557,1735011772; PANPSC=8105236414382456721%3AC%2FqoofJ6HJOAk8J%2F0stkKnpqFxiqMUQ7qh40en%2BGNK4bH38P3MiKqdnzWX47O8AWP3KCAVEKQNp6g9ChlHbsrC78Y3Xhlnteg0WKLwNb85J8VChy0MPuaiWerPVEvzDK8QrbRNq5yeHCaCgG6Bk9Y5tLw07TWMfwLuNw%2BoMEynl6ahcYqjFEO6oeNHp%2FhjSuegjBempw95pipl3L3NnXeWH%2BXnDCXpBT; ndut_fmt=2BDC166473E45FC3F341309236DBAEA0BE50E40A70C2A6C9583ADCC5AF68D77E; Hm_lpvt_182d6d59474cf78db37e0b2248640ea5=1735025344; ab_sr=1.0.1_ZWU5YWU3ZjNlN2MwZDAwZmNkOTNjNjI3MmMwMjA2YWI3YmNlNzBjM2Q3ZDE5Yjg1YjliZjIzN2VmZTE2ZWZlOGExZDBjYzdhNzk0ZWJhMGE1YTIxY2I0ZmVlZmJmMWVmMjBiNGZmMDUwZmMyOTVkZGZhYjgwM2NiN2QyN2E0ZTJhMzhlN2M5ZjY2ODljMjg2YmIzZTIyMWNiMTUzZjI4NzQ5NDVhZDdjNzk5ZjhlYzg0ZWQ4YWExZjY2ZGM0ZmI1'
const bdstoken = '1d0e32d890c522ed4cac839e7281b426'
const disk_id = 'd5e828ab841fe7a511f43f83'
const uks = [1099706112244, 1099873382913, 1101348735357, 1100192019628]
async function initDb() {
    let databases = config.get('MONGODBS');
    await mongodber.init(databases);
}

async function get_group_list() {
    const data = await utils.bdapis.getGroups(cookie,0,100)
    const groups = data.data.records.filter(r => {return r.name.includes ('白金版试看群')})
    const diskDB = mongodber.use('disk');
    for(let group of groups) {
        let followers =  await diskDB.collection('disk_follower').find({disk_id,uk:{$nin:uks}, groups: {$size: 0}}).limit(196).toArray();
        const res = await utils.bdapis.addUser(cookie, group.gid, JSON.stringify(followers.map(f=> {return f.uk})), bdstoken)
        if(res.data.errno ==0) {
            await diskDB.collection('disk_follower').updateMany({_id:{$in: followers.map(f=> f._id)}}, {$push: {groups: group.gid}})
        }
        
    }
}


async function doIt () {
    await initDb()
    await get_group_list()
}

doIt()
