const WXAPI = require('../../../utils/wxapi/main')
const CONFIG = require('../../../config.js')

import { View, star, getViewData } from "../../../utils/util.js"
Page({
  data: {
    viewList: [],
    showMore: false
  },
 onLoad: function (options) {
    var categoryId = options.categoryId;
    let _this = this;
   wx.setNavigationBarTitle({
     title: options.type
   })
    var json = {
      'categoryId': categoryId,
      'orderBy': 'ordersDown',
      'pageSize': 50
    // 'shopId':
    };
    WXAPI.goods(json).then(function (res) {
      if (res.code == 0) {
        _this.setData({
          viewList: res.data
      })
    }
  });
},
  lower() {
    this.setData({
      showMore: true
    });
    wx.showNavigationBarLoading();
  },
  scroll() {
    if (this.data.showMore) {
      this.setData({
        showMore: false
      })
   wx.hideNavigationBarLoading();
    }
  },
   // 进入景点详情
  enterDetail(e) {
    let sid=e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../goods-details/index?sid='+sid+''
    })
  }
})