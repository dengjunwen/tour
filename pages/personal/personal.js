// pages/personal/personal.js

const CONFIG = require('../../config.js')
const WXAPI = require('../../utils/wxapi/main')

let app=getApp()
Page({
  data:{
    userInfo:{}
  },
  onLoad:function(options){

  },
  onShow() {
    let that = this;
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      app.goLoginPageTimeOut()
    } else {
      that.setData({
        userInfo: userInfo,
        version: CONFIG.mversion
      })
    }
    this.getUserApiInfo();
  },
  getUserApiInfo: function () {
    var that = this;
    WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {

        let _data = {}
        _data.apiUserInfoMap = res.data
        if (res.data.base.mobile) {
          _data.userMobile = res.data.base.mobile
        }
        that.setData(_data);
      }
    })
  },
  relogin:function(e){
    app.goLoginPageTimeOut();
  },
  gotoMyOrder: function (e) {
    wx.navigateTo({
      url: "/pages/index/order-list/index?type=" + e.currentTarget.dataset.type
    })
  },
  aboutUs: function () {
    wx.showModal({
      title: '合作或搭建小程序',
      content: '请联系13241485550，邮箱dengjunwen1992@163.com',
      showCancel: false
    })
  }
})