module.exports = {
    // 检测
    HEALTH_CHECK: 2,
    // Success
    SUCCESS: 0, // 成功
    NO_ITEM_NOW: 1, // 成功，但是现阶段确实没有数据

    //
    AUTH_ERR: -1, // 认证错误
    账号或密码错误: -1, // 认证错误
    INTERNAL_ERR: 1000, // 内部错误
    PARAM_ERR: 1001, // 参数错误
    GLOBAL_ERR: 1002, // 全局异常
    NO_RIGHTS: 1003, // 无权操作
    ALREADY_EXISTS: 1004, // 已经存在指定资源 与OCCUPIED区别：ALREADY_EXISTS-欲添加一个已经添加了的资源，OCCUPIED-资源被其他资源占用。如“添加”绑定手机，但本账号已经有了绑定的手机，使用ALREADY_EXISTS；“添加”绑定手机，但手机号已经被别人绑定了，使用OCCUPIED。
    AUTH_FAIL: 1005, // 验证失败
    NOT_FOUND: 1006, // 未找到指定资源
    NOT_MATCH: 1007, // 数据不匹配
    OCCUPIED: 1008, // 资源已被占用
    API_CLOSED: 1009, // 接口已关闭
    NOT_ENOUGH: 1010, // 资源不足
    NO_PERMISSION: 2000, // 平台权限不足
};
