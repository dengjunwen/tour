const CONFIG = require('./config.js')
const API_BASE_URL_back = 'https://user.api.it120.cc'
const API_BASE_URL_front = 'https://api.it120.cc'

const request = (url, needSubDomain, method, data) => {
  let _url = "";
  if(needSubDomain){
     _url = API_BASE_URL_front +  '/' + CONFIG.subDomain + url
  }else{
     _url = API_BASE_URL_back  + url
  }
  if(!data.x_token){
    data.x_token = "";
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: _url,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-token': data.x_token
      },
      success(request) {
        resolve(request.data)
      },
      fail(error) {
        reject(error)
      },
      complete(aaa) {
        // 加载完成
      }
    })
  })
}

/**
 * 小程序的promise没有finally方法，自己扩展下
 */
Promise.prototype.finally = function (callback) {
  var Promise = this.constructor;
  return this.then(
    function (value) {
      Promise.resolve(callback()).then(
        function () {
          return value;
        }
      );
    },
    function (reason) {
      Promise.resolve(callback()).then(
        function () {
          throw reason;
        }
      );
    }
  );
}

module.exports = {
  request,
  /**
   * 管理员登陆
   */
  adminLogin: (data) => {
    return request('/login/key', false, 'post', data)
  },

  /**
  * 管理员手动登陆
  */
  adminManualLogin: (data) => {
    return request('/login/userName', false, 'post', data)
  },

  /**
  * 获取验证码
  */
  getCodeUri: (data) => {
    return API_BASE_URL_back +'/code?k=';
  },
  /**
   * 核销订单
   */
  hxOrder:(data) => {
    return request('/order/hx', true, 'post', data)
  },
  /**
   * 所有的订单列表
   */
  orderList:(data) => {
    return request('/user/apiExtOrder/list', false, 'post', data) 
  },
  isTokenExpire:(data) => {
    return request('/user/checkToken', false, 'get', data) 
  },
  /**
   * 从账户中扣除金额
   */
  deductFAsset(data){
    return request('/user/apiExtUserPay/save', false, 'post', data)  
  },
  /**
   * 查看某个用户的余额
   */
  userAmount(data){
    return request('/user/apiExtUserCash/list', false, 'post', data); 
  },
  cashLogs(data){
    return request('/user/apiExtUserCashLog/list', false, 'post', data); 
  }
}