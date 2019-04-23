const WXAPI = require('../../utils/wxapi/main')
const CONFIG = require('../../config.js')
let app = getApp();

import { View, star, getViewData, dateNow } from "../../utils/util.js"
let cityName;
Page({
  data: {
    allCity: [],
    cityHot: [],
    viewHot: [],
    viewList: [],
    active: true,
    viewDetail: [],
    loading: true,
    animationData: {},

    indicatorDots: true,
    autoplay: true,
    interval: 3000,
    duration: 1000,
    loadingHidden: false, // loading
    userInfo: {},
    swiperCurrent: 0,
    selectCurrent: 0,
    categories: [],
    activeCategoryId: 0,
    goods: [],
    scrollTop: 0,
    loadingMoreHidden: true,

    hasNoCoupons: true,
    coupons: [],
    searchInput: '',

    curPage: 1,
    pageSize: 20
  },
  //事件处理函数
  swiperchange: function (e) {
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  toDetailsTap: function (e) {
    wx.navigateTo({
      url: "/pages/index/goods-details/index?id=" + e.currentTarget.dataset.id
    })
  },
  tapBanner: function (e) {
    if (e.currentTarget.dataset.id != 0) {
      wx.navigateTo({
        url: "/pages/index/goods-details/index?id=" + e.currentTarget.dataset.id
      })
    }
  },

  showBanner:function(){
    var that = this;
    WXAPI.banners({
      type: 'index'
    }).then(function (res) {
      if (res.code == 700) {
        wx.showModal({
          title: '提示',
          content: '请在后台添加 banner 轮播图片，自定义类型填写 index',
          showCancel: false
        })
      } else {
        that.setData({
          banners: res.data
        });
      }
    })
  },
  destRecommend:function(categoryData){
    let that = this;
    that.setData({
      'categoryData':categoryData
    });
    
  },
  dealViewHot: function (categoryId) {
    let _this = this;
    var json={
      'categoryId':categoryId,
      'orderBy':'ordersDown',
      'pageSize':9
      // 'shopId':
    };
    WXAPI.goods(json).then(function(res){
        if(res.code == 0){
          var miniArr = res.data;

          //获取前9个景区信息
          let viewHot_1 = miniArr.splice(0, 3);
          let viewHot_2 = miniArr.splice(0, 3);
          let viewHot_3 = miniArr.splice(0, 3);
          // 数据结构满足[[],[],[]]结构，页面中for使用
          let arr = [];
          arr.push(viewHot_1);
          viewHot_2.length > 0 ? arr.push(viewHot_2) : "";
          viewHot_3.length > 0 ? arr.push(viewHot_3) : "";
          _this.setData({
            viewHot: arr
          })
        }
    });
    
  },
  dealTicketHot: function (categoryId) {
    let _this = this;
    var json = {
      'categoryId': categoryId,
      'orderBy': 'ordersDown',
      'pageSize': 9
      // 'shopId':
    };
    WXAPI.goods(json).then(function (res) {
      if (res.code == 0) {
        var miniArr = res.data;

        //获取前9个景区信息
        let viewHot_1 = miniArr.splice(0, 3);
        let viewHot_2 = miniArr.splice(0, 3);
        let viewHot_3 = miniArr.splice(0, 3);
        // 数据结构满足[[],[],[]]结构，页面中for使用
        let arr = [];
        arr.push(viewHot_1);
        viewHot_2.length > 0 ? arr.push(viewHot_2) : "";
        viewHot_3.length > 0 ? arr.push(viewHot_3) : "";
        _this.setData({
          ticketHot: arr
        })
      }
    });

  },
  onLoad() {
    let _this = this;
    _this.showBanner();
    // 获取热门城市
    new View("http://70989421.appservice.open.weixin.qq.com/data/city.json", "get").send((res) => {
      let data = res.data.result;
      dealCityHot(data);
      
    })
    _this.initPagesData();
   
  },

  //获得顶级分类
  initPagesData: function () {
    let _this = this;
    var categoryData = {};
    WXAPI.goodsCategory().then(function (res) {
      if (res.code === 0) {
        var data = res.data;
        for (var i = 0; i < res.data.length; i++) {
          if (data[i].level == 1) {
            categoryData[data[i].type] = data[i];
          }
        }
        // 获取热门景区
        _this.destRecommend(categoryData);
        //目的地推荐
        _this.dealViewHot(categoryData.tour.id);
        //自驾游推荐（就是门票）
        _this.dealTicketHot(categoryData.ticket.id);
        //住宿推荐
        _this.getHotelRecommand(categoryData.hotel.id);
      }
    });
  },
 
  getHotelRecommand:function(hotelId){
    var that = this;
    var data = {
      'categoryId': hotelId,
      'recommendStatus': '1',
      'shopId': '',
      'orderBy':'priceUp',
      'pageSize': '10'
    };
    WXAPI.goods(data).then(function(res){
      that.setData({
        viewList: res.data,
        loading: false
      })
      that.enterAnimate();
      wx.setStorageSync('hotelViewList', res.data)
      wx.setStorageSync('hotelViewListUpdateTime', Date.parse(new Date()));
     
    });
  },

/**
 * 特产推荐
 */
  getFoodRecommand: function (foodCategoryId) {
    console.log(foodCategoryId);
    var that = this;
    var data = {
      'categoryId': foodCategoryId,
      'recommendStatus': '1',
      'shopId': '',
      'orderBy': 'priceUp',
      'pageSize': '10'
    };
    WXAPI.goods(data).then(function (res) {
      that.setData({
        viewList: res.data,
        loading: false
      })
      that.enterAnimate();
      wx.setStorageSync('foodViewList', res.data)
      wx.setStorageSync('foodViewListUpdateTime', Date.parse(new Date()));
    });
  },
 

  chageTabView:function(e) {

    this.removeCache("hotelViewListUpdateTime", "hotelViewList");
    this.removeCache("foodViewListUpdateTime", "foodViewList");
    
    switch(e.currentTarget.dataset.type){
      case 'hotel':{
        this.tabGetData(true, "hotelViewList");
        break;
      }
      case 'food':{
        this.tabGetData(false, "foodViewList")
        break;
      }
    }
    
  },

  removeCache(lastUpdateTimeKey,key){
    var lastUpdateTime = wx.getStorageSync(lastUpdateTimeKey);
    var now = Date.parse(new Date());
    var temp = now - lastUpdateTime > 10 * 60 * 1000 ? wx.removeStorageSync(key) : "";
  },

  tabGetData(active, key) {
    let _this = this;
    this.leaveAnimate();
    this.setData({
      active: active,
      loading: true
    })
    if (wx.getStorageSync(key)) {
      this.setData({
        viewList: wx.getStorageSync(key),
        loading: false
      });
      this.enterAnimate();
    } else {
      switch(key){
        case "hotelViewList":
          _this.getHotelRecommand(this.data.categoryData.hotel.id);
          break;
        case "foodViewList":
          _this.getFoodRecommand(this.data.categoryData.food.id);
          break;
      }
    }
  },
  //点击分类功能
  enterViewList:function(e) {
    var nextViewText = "";

    switch(e.currentTarget.dataset.categorytype){
      case 'tour':
        {
          nextViewText = "景点";
          break;
        }
      case 'ticket':
        {
          nextViewText = "门票";
          break;
        }
      case 'hotel':
        {
          nextViewText = "住宿";
          break;
        }
      case 'food':
        {
          nextViewText = "特产"
          break;
        }
    }
  var nextviewUrl = 'view-list/view-list?type='+nextViewText+'&categoryId=' + e.currentTarget.dataset.categoryid;
  console.log(nextviewUrl);
    wx.navigateTo({
      url: nextviewUrl
    });
  },
 
  // 动画
  enterAnimate() {
    let animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease',
    })
    animation.opacity(1).step()
    this.setData({
      animationData: animation.export()
    })
  },
  leaveAnimate() {
    let animation = wx.createAnimation({
      duration: 100,
      timingFunction: 'ease',
    })
    animation.opacity(0).step()
    this.setData({
      animationData: animation.export()
    })
  },
  // 进入景点详情
  enterDetail(e) {

    let sid=e.currentTarget.dataset.id;
    wx.navigateTo({
      url: 'goods-details/index?sid='+sid+''
    })
  }
})
