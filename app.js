const WXAPI = require('utils/wxapi/main')
App({
  navigateToLogin: false,
  onLaunch: function () {
    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: '当前无网络',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function (res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: '网络已断开',
          icon: 'loading',
          duration: 2000,
          complete: function () {
            that.goStartIndexPage()
          }
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    });
    //  获取商城名称
    WXAPI.queryConfig({
      key: 'mallName'
    }).then(function (res) {
      if (res.code == 0) {
        wx.setStorageSync('mallName', res.data.value);
      }
    })
    
    // 判断是否登录
    let token = wx.getStorageSync('token');
    if (!token) {
      that.goLoginPageTimeOut()
      return
    }
    WXAPI.checkToken(token).then(function (res) {
      if (res.code != 0) {
        wx.removeStorageSync('token')
        that.goLoginPageTimeOut()
      }
    })
  },
  
  goLoginPageTimeOut: function () {
    if (this.navigateToLogin) {
      return
    }
    this.navigateToLogin = true
    setTimeout(function () {
      wx.navigateTo({
        url: "/pages/other/authorize/authorize"
      })
    }, 1000)
  },
  goStartIndexPage: function () {
    setTimeout(function () {
      wx.redirectTo({
        url: "/pages/index/index"
      })
    }, 1000)
  },
  globalData: {
    isConnected: true
  },
  
})

 // {
      //   "pagePath": "pages/destination/destination",
      //   "text": "目的地",
      //   "iconPath": "/images/navbar/destination.png",
      //   "selectedIconPath": "/images/navbar/destination_active.png"
      // },
      // {
      //   "pagePath": "pages/find/find",
      //   "text": "发现",
      //   "iconPath": "/images/navbar/find.png",
      //   "selectedIconPath": "/images/navbar/find_active.png"
      // },