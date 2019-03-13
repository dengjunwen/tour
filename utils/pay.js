const WXAPI = require('../wxapi/main')
function wxpay(app, money, orderId, redirectUrl) {
  let remark = "支付";
  let payName = "支付";
  let nextAction = {};
  if(orderId == 0){
    remark = "充值";
    payName = "充值";
  }
  if (orderId != 0) {
    remark += "支付订单 ：" + orderId;
    nextAction = { type: 0, id: orderId };
  }
  WXAPI.wxpay({
    token: wx.getStorageSync('token'),
    money: money,
    remark: remark,
    payName: payName,
    nextAction: JSON.stringify(nextAction)
  }).then(function (res, lastfunction) {
    if (res.code == 0) {
      // 发起支付
      wx.requestPayment({
        timeStamp: res.data.timeStamp,
        nonceStr: res.data.nonceStr,
        package: 'prepay_id=' + res.data.prepayId,
        signType: 'MD5',
        paySign: res.data.sign,
        fail: function (aaa) {
          wx.showToast({ title: payName+'失败:' + aaa })
        },
        success: function () {
          // 保存 formid
          WXAPI.addTempleMsgFormid({
            token: wx.getStorageSync('token'),
            type: 'pay',
            formId: res.data.prepayId
          })
          // 提示支付成功
          wx.showToast({ title: payName+'成功' })
          if (redirectUrl + "1" == "1"){
            return ;
          }
          wx.redirectTo({
            url: redirectUrl
          });
        }
      })
    } else {
      wx.showModal({
        title: '出错了',
        content: res.code + ':' + res.msg + ':' + res.data,
        showCancel: false,
        success: function (res) {

        }
      })
    }
  })
}




function wxpaynow(app, money, orderId, redirectUrl, remark) {
  let now_remark = "在线充值";
  let now_nextAction = {};
  if (orderId != 0) {
    now_remark = "支付订单 ：" + orderId+","+remark;
    now_nextAction = { type: 0, id: orderId };
  }
  WXAPI.wxpaynow({
    token: wx.getStorageSync('token'),
    money: money,
    remark: now_remark,
    payName: "在线支付",
    nextAction: JSON.stringify(now_nextAction)
  }).then(function (res) {
    if (res.code == 0) {
      // 发起支付
      wx.requestPayment({
        timeStamp: res.data.timeStamp,
        nonceStr: res.data.nonceStr,
        package: 'prepay_id=' + res.data.prepayId,
        signType: 'MD5',
        paySign: res.data.sign,
        fail: function (aaa) {
          wx.showToast({ title: '支付失败:' + aaa })
        },
        success: function () {
          // 保存 formid
          WXAPI.addTempleMsgFormid({
            token: wx.getStorageSync('token'),
            type: 'pay',
            formId: res.data.prepayId
          })
          // 提示支付成功
          wx.showToast({ title: '支付成功' })
          if (redirectUrl + "1" == "1") {
            return;
          }
          wx.redirectTo({
            url: redirectUrl
          });
        }
      })
    } else {
      wx.showModal({
        title: '出错了',
        content: res.code + ':' + res.msg + ':' + res.data,
        showCancel: false,
        success: function (res) {

        }
      })
    }
  })
}

module.exports = {
  wxpay: wxpay,
  wxpaynow: wxpaynow
}
