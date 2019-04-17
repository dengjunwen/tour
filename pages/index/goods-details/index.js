const WXAPI = require('../../../utils/wxapi/main')
import { View, star, getViewData, dateNow, formatTime, formatLocation, fib, formatDateTime, tsFormatTime } from "../../../utils/util.js"
//获取应用实例
var app = getApp();
var WxParse = require('../../../utils/wxParse/wxParse.js');
var Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1];    // 加权因子   身份证校验
var ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; 
Page({
  data: {
    autoplay: true,
    interval: 3000,
    duration: 1000,
    goodsDetail: {},
    swiperCurrent: 0,
    hasMoreSelect: false,
    selectSize: "选择：",
    selectSizePrice: 0,
    totalScoreToPay: 0,
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,

    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
    shopCarInfo: {},
    shopType: "addShopCar", //购物类型，加入购物车或立即购买，默认为加入购物车
  },

  //事件处理函数
  swiperchange: function(e) {
    //console.log(e.detail.current)
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  onLoad: function(e) {

    if (e.inviter_id) {
      wx.setStorage({
        key: 'inviter_id_' + e.id,
        data: e.inviter_id
      })
      wx.setStorage({
        key: 'referrer',
        data: e.inviter_id
      })
    }
    var that = this;
    that.data.kjId = e.kjId;
    // 获取购物车数据
    wx.getStorage({
      key: 'shopCarInfo',
      success: function(res) {
        that.setData({
          shopCarInfo: res.data,
          shopNum: res.data.shopNum
        });
      }
    })


    WXAPI.goodsDetail(e.sid).then(function(res) {
      var selectSizeTemp = "";
      if (res.data.properties) {
        for (var i = 0; i < res.data.properties.length; i++) {
          selectSizeTemp = selectSizeTemp + " " + res.data.properties[i].name;
        }
        that.setData({
          hasMoreSelect: true,
          selectSize: that.data.selectSize + selectSizeTemp,
          selectSizePrice: res.data.basicInfo.minPrice,
          totalScoreToPay: res.data.basicInfo.minScore
        });
      }

      if (res.data.basicInfo.pingtuan) {
        that.pingtuanList(e.id)
      }
      that.data.goodsDetail = res.data;
      if (res.data.basicInfo.videoId) {
        that.getVideoSrc(res.data.basicInfo.videoId);
      }
      var buttonText = "立即购买";
      switch(res.data.category.type){
        case 'hotel':
        buttonText = "立即预定";
        break;
        case 'tour':
        buttonText = "立即参团";
        break;
        case 'ticket':
        buttonText = "立即订票";
        break;
      }
      
      //如果是酒店的话修改规格
      that.modifyProperty(that.data.goodsDetail.properties);
      //设置购买需要填写的信息
      that.setBuyInputInfo(that.data.goodsDetail);
      
      that.setData({
        buttonText : buttonText,
        goodsDetail: res.data,
        category: res.data.category.type,
        selectSizePrice: res.data.basicInfo.minPrice,
        totalScoreToPay: res.data.basicInfo.minScore,
        buyNumMax: that.data.buyNumMax == 0 ? res.data.basicInfo.stores : that.data.buyNumMax,
        buyNumber: (res.data.basicInfo.stores > 0) ? 1 : 0
      });
      
      WxParse.wxParse('article', 'html', res.data.content, that, 5);
    })
    this.reputation(e.id);
    this.getKanjiaInfo(e.id);
  },
  /**
   *显示信息输入框 
   */
  showInfoInput: function(data){
    
     //丹霞山景区显示身份证输入
    if(data.basicInfo.name.indexOf("丹霞山门票") != -1){
      this.setData({
        inputidcard : true,
        buyNumMax:3
      });
    }
    //景区都显示手机号输入，姓名输入
    if(data.category.type == 'ticket'){
      this.setData({
        inputname : true,
        inputphone: true
      });
    }
   
  },
  /**
   * 修改规格尺寸,将今天、明天改为具体日期
   */
  modifyProperty: function (childs){
    if(childs == undefined){
      return;
    }
    var that = this;
    for (var i = 0; i < childs.length; i++) {
      if (childs[i].name == "日期") {

        var dates = childs[i].childsCurGoods;
        //将今天 明天 昨天，改为具体的日期
        var timestamp = Date.parse(new Date());
        for (var j = 0; j < dates.length; j++) {
          switch (dates[j].name) {
            case '今天': {
              dates[j].name = '今天 ' + tsFormatTime(timestamp, "Y-M-D")+' 12:00 入住';
              break;
            }
            case '明天': {
              var temp = timestamp + (24 * 60 * 60 *1000);
              dates[j].name = '明天 ' + tsFormatTime(temp, "Y-M-D") + '12:00 入住';
              break;
            }
            case '后天': {
              var temp = timestamp + (24 * 60 * 60 *1000 *2);
              dates[j].name = '后天 ' + tsFormatTime(temp, "Y-M-D") + '12:00 入住';
              break;
            }
            default:
              break;
          }
        }
      }
    }
  },
  goShopCar: function() {
    wx.reLaunch({
      url: "/pages/shop-cart/index"
    });
  },
  toAddShopCar: function() {
    this.setData({
      shopType: "addShopCar"
    })
    this.bindGuiGeTap();
  },
  tobuy: function() {
    //判断是什么类型，如果是门票类型，则要求填写身份证，姓名，手机号
    this.setData({
      shopType: "tobuy",
      selectSizePrice: this.data.goodsDetail.basicInfo.minPrice
    });
    this.bindGuiGeTap();
  },
  toPingtuan: function(e) {
    let pingtuanopenid = 0
    if (e.currentTarget.dataset.pingtuanopenid) {
      pingtuanopenid = e.currentTarget.dataset.pingtuanopenid
    }
    this.setData({
      shopType: "toPingtuan",
      selectSizePrice: this.data.goodsDetail.basicInfo.pingtuanPrice,
      pingtuanopenid: pingtuanopenid
    });
    this.bindGuiGeTap();
  },
  /**
   * 规格选择弹出框
   */
  bindGuiGeTap: function() {
    this.setData({
      hideShopPopup: false
    })
  },
  /**
   * 规格选择弹出框隐藏
   */
  closePopupTap: function() {
    this.setData({
      hideShopPopup: true
    })
  },
  numJianTap: function() {
    if (this.data.buyNumber > this.data.buyNumMin) {
      var currentNum = this.data.buyNumber;
      currentNum--;
      this.setData({
        buyNumber: currentNum
      })
    }
  },
  numJiaTap: function() {
    if (this.data.buyNumber < this.data.buyNumMax) {
      var currentNum = this.data.buyNumber;
      currentNum++;
      this.setData({
        buyNumber: currentNum
      })
    }
  },
  /**
   * 选择商品规格
   * @param {Object} e
   */
  labelItemTap: function(e) {
    var that = this;
   
    // 取消该分类下的子栏目所有的选中状态
    var childs = that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods;
    for (var i = 0; i < childs.length; i++) {
      that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[i].active = false;

    }
    // 设置当前选中状态
    that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[e.currentTarget.dataset.propertychildindex].active = true;
    // 获取所有的选中规格尺寸数据
    var needSelectNum = that.data.goodsDetail.properties.length;
    var curSelectNum = 0;
    var propertyChildIds = "";
    var propertyChildNames = "";
    for (var i = 0; i < that.data.goodsDetail.properties.length; i++) {
      childs = that.data.goodsDetail.properties[i].childsCurGoods;
      for (var j = 0; j < childs.length; j++) {
        if (childs[j].active) {
          curSelectNum++;
          propertyChildIds = propertyChildIds + that.data.goodsDetail.properties[i].id + ":" + childs[j].id + ",";
          propertyChildNames = propertyChildNames + that.data.goodsDetail.properties[i].name + ":" + childs[j].name + "  ";
        }
      }
    }
    var canSubmit = false;
    if (needSelectNum == curSelectNum) {
      canSubmit = true;
    }
    // 计算当前价格
    if (canSubmit) {
      WXAPI.goodsPrice({
        goodsId: that.data.goodsDetail.basicInfo.id,
        propertyChildIds: propertyChildIds
      }).then(function(res) {
        that.setData({
          selectSizePrice: res.data.price,
          totalScoreToPay: res.data.score,
          propertyChildIds: propertyChildIds,
          propertyChildNames: propertyChildNames,
          buyNumMax: res.data.stores,
          buyNumber: (res.data.stores > 0) ? 1 : 0
        });
      })
    }


    this.setData({
      goodsDetail: that.data.goodsDetail,
      canSubmit: canSubmit
    })
  },
  /**
   * 加入购物车
   */
  addShopCar: function() {
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格！',
          showCancel: false
        })
      }
      this.bindGuiGeTap();
      return;
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0！',
        showCancel: false
      })
      return;
    }
    //组建购物车
    var shopCarInfo = this.bulidShopCarInfo();

    this.setData({
      shopCarInfo: shopCarInfo,
      shopNum: shopCarInfo.shopNum
    });

    // 写入本地存储
    wx.setStorage({
      key: 'shopCarInfo',
      data: shopCarInfo
    })
    this.closePopupTap();
    wx.showToast({
      title: '加入购物车成功',
      icon: 'success',
      duration: 2000
    })
    //console.log(shopCarInfo);

    //shopCarInfo = {shopNum:12,shopList:[]}
  },

  /**
   * 订票 输入姓名
   */
  inputName:function(e){
    this.setData({
      name: e.detail.value
    });
  },
  /**
   * 输入手机号
   */
  inputPhone:function(e){
    this.setData({
      phone:e.detail.value
    });
  },
  /**
   * 输入身份证号
   */
  inputIdcard:function(e){
    this.setData({
      idcard:e.detail.value
    });
  },
  /**
   * 检查身份证
   */
  checkIdcard:function(idcard){
    if(!this.idcaardValidate(idcard)){
      return "身份证号不合法，请检查"; 
    }
    return "";
  },

  idcaardValidate: function (idCard) {
    idCard = this.trim(idCard.replace(/ /g, ""));               //去掉字符串头尾空格                     
    if (idCard.length == 15) {
      return this.isValidityBrithBy15IdCard(idCard);       //进行15位身份证的验证    
    } else if (idCard.length == 18) {
      var a_idCard = idCard.split("");                // 得到身份证数组   
      if (this.isValidityBrithBy18IdCard(idCard) && this.isTrueValidateCodeBy18IdCard(a_idCard)) {   //进行18位身份证的基本验证和第18位的验证
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },
  /**  
   * 判断身份证号码为18位时最后的验证位是否正确  
   * @param a_idCard 身份证号码数组  
   * @return  
   */
  isTrueValidateCodeBy18IdCard: function (a_idCard) {
    var sum = 0;                             // 声明加权求和变量   
    if (a_idCard[17].toLowerCase() == 'x') {
      a_idCard[17] = 10;                    // 将最后位为x的验证码替换为10方便后续操作   
    }
    for (var i = 0; i < 17; i++) {
      sum += Wi[i] * a_idCard[i];            // 加权求和   
    }
    var valCodePosition = sum % 11;                // 得到验证码所位置   
    if (a_idCard[17] == ValideCode[valCodePosition]) {
      return true;
    } else {
      return false;
    }
  },
  /**  
    * 验证18位数身份证号码中的生日是否是有效生日  
    * @param idCard 18位书身份证字符串  
    * @return  
    */
  isValidityBrithBy18IdCard: function (idCard18) {
    var year = idCard18.substring(6, 10);
    var month = idCard18.substring(10, 12);
    var day = idCard18.substring(12, 14);
    var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
    // 这里用getFullYear()获取年份，避免千年虫问题   
    if (temp_date.getFullYear() != parseFloat(year)
      || temp_date.getMonth() != parseFloat(month) - 1
      || temp_date.getDate() != parseFloat(day)) {
      return false;
    } else {
      return true;
    }
  },
  /**  
   * 验证15位数身份证号码中的生日是否是有效生日  
   * @param idCard15 15位书身份证字符串  
   * @return  
   */
  isValidityBrithBy15IdCard: function (idCard15) {
    var year = idCard15.substring(6, 8);
    var month = idCard15.substring(8, 10);
    var day = idCard15.substring(10, 12);
    var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
    // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法   
    if (temp_date.getYear() != parseFloat(year)
      || temp_date.getMonth() != parseFloat(month) - 1
      || temp_date.getDate() != parseFloat(day)) {
      return false;
    } else {
      return true;
    }
  },
  //去掉字符串头尾空格   
  trim: function (str) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
  },
  // 判断是否为空
  isBlank: function (_value) {
    if (_value == null || _value == "" || _value == undefined) {
      return true;
    }
    return false;
  },


  /**
   *设置购买产品需要填写的信息 
   */
  setBuyInputInfo:function(data){
    //根据类型，选择显示信息输入框
    this.showInfoInput(data);
    
  },
  /**
   * 检查购买个数，不同景区的的门票每张身份证购买的个是绑定的
   */
  checkBuyNum:function(num){
    if(num > 3){
      return "一张身份证最多只能购买3张门票";
    }
    return;
  },
  /**
   * 检查手机号
   */
  checkPhone: function (mobile) {
    if (mobile.length != 11) {

      return "手机号长度有误";
    }
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    if (!myreg.test(mobile)) {
      wx.showToast({
        title: '手机号有误！',
        icon: 'success',
        duration: 1500
      });
      return "手机号拼写有误";
    }
    return "";
  },
  /**
   * 检查姓名
   */
  checkName:function(str){
    if (str == undefined || str == '' || str.length < 2){
      return "请输入合法姓名";
    }
    return "";
  },
  /**
   * 立即购买
   */
  buyNow: function(e) {
    let that = this
    let shoptype = e.currentTarget.dataset.shoptype
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格！',
          showCancel: false
        })
      }
      this.bindGuiGeTap();
      wx.showModal({
        title: '提示',
        content: '请先选择规格尺寸哦~',
        showCancel: false
      })
      return;
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0！',
        showCancel: false
      })
      return;
    }
    //如果商品类型为门票，则校验姓名和手机号
    var msg = '';
    if (msg == '' && this.data.inputname == true){
      msg = this.checkName(this.data.name); 
    }
    if(msg == '' && this.data.inputphone == true){
      msg = this.checkPhone(this.data.phone);
    }
    if (msg == '' && this.data.inputidcard == true){
      msg = this.checkIdcard(this.data.idcard);
    }
    if(msg != ''){
      wx.showModal({
        title: '提示',
        content: msg,
        showCancel: false
      })
      return;
    }


    //组建立即购买信息
    var buyNowInfo = this.buliduBuyNowInfo(shoptype);
    // 写入本地存储
    wx.setStorage({
      key: "buyNowInfo",
      data: buyNowInfo
    })
    this.closePopupTap();
    if (shoptype == 'toPingtuan') {
      if (this.data.pingtuanopenid) {
        wx.navigateTo({
          url: "/pages/index/to-pay-order/index?orderType=buyNow&pingtuanOpenId=" + this.data.pingtuanopenid
        })
      } else {
        WXAPI.pingtuanOpen(that.data.goodsDetail.basicInfo.id, wx.getStorageSync('token')).then(function(res) {
          if (res.code != 0) {
            wx.showToast({
              title: res.msg,
              icon: 'none',
              duration: 2000
            })
            return
          }
          wx.navigateTo({
            url: "/pages/index/to-pay-order/index?orderType=buyNow&pingtuanOpenId=" + res.data.id
          })
        })
      }
    } else {
      wx.navigateTo({
        url: "/pages/index/to-pay-order/index?orderType=buyNow"
      })
    }

  },
  /**
   * 组建购物车信息
   */
  bulidShopCarInfo: function() {
    // 加入购物车
    var shopCarMap = {};
    shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
    shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
    shopCarMap.name = this.data.goodsDetail.basicInfo.name;
    // shopCarMap.label=this.data.goodsDetail.basicInfo.id; 规格尺寸 
    shopCarMap.propertyChildIds = this.data.propertyChildIds;
    shopCarMap.label = this.data.propertyChildNames;
    shopCarMap.price = this.data.selectSizePrice;
    shopCarMap.score = this.data.totalScoreToPay;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;
    shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
    shopCarMap.logistics = this.data.goodsDetail.logistics;
    shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

    var shopCarInfo = this.data.shopCarInfo;
    if (!shopCarInfo.shopNum) {
      shopCarInfo.shopNum = 0;
    }
    if (!shopCarInfo.shopList) {
      shopCarInfo.shopList = [];
    }
    var hasSameGoodsIndex = -1;
    for (var i = 0; i < shopCarInfo.shopList.length; i++) {
      var tmpShopCarMap = shopCarInfo.shopList[i];
      if (tmpShopCarMap.goodsId == shopCarMap.goodsId && tmpShopCarMap.propertyChildIds == shopCarMap.propertyChildIds) {
        hasSameGoodsIndex = i;
        shopCarMap.number = shopCarMap.number + tmpShopCarMap.number;
        break;
      }
    }

    shopCarInfo.shopNum = shopCarInfo.shopNum + this.data.buyNumber;
    if (hasSameGoodsIndex > -1) {
      shopCarInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap);
    } else {
      shopCarInfo.shopList.push(shopCarMap);
    }
    shopCarInfo.kjId = this.data.kjId;
    return shopCarInfo;
  },
  /**
   * 组建立即购买信息
   */
  buliduBuyNowInfo: function(shoptype) {
    var shopCarMap = {};
    shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
    shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
    shopCarMap.name = this.data.goodsDetail.basicInfo.name; 
    shopCarMap.propertyChildIds = this.data.propertyChildIds;
    shopCarMap.label = this.data.propertyChildNames;
    shopCarMap.price = this.data.selectSizePrice;
    if (shoptype == 'toPingtuan') {
      shopCarMap.price = this.data.goodsDetail.basicInfo.pingtuanPrice;
    }
    shopCarMap.score = this.data.totalScoreToPay;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;
    shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
    shopCarMap.logistics = this.data.goodsDetail.logistics;
    shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

    shopCarMap.realname = this.data.name;//购票人姓名
    shopCarMap.phone = this.data.phone;//购票人的手机号
    shopCarMap.idcard = this.data.idcard;//购票人身份证
    shopCarMap.category = this.data.category;


    var buyNowInfo = {};
    if (!buyNowInfo.shopNum) {
      buyNowInfo.shopNum = 0;
    }
    if (!buyNowInfo.shopList) {
      buyNowInfo.shopList = [];
    }
    /*    var hasSameGoodsIndex = -1;
        for (var i = 0; i < toBuyInfo.shopList.length; i++) {
          var tmpShopCarMap = toBuyInfo.shopList[i];
          if (tmpShopCarMap.goodsId == shopCarMap.goodsId && tmpShopCarMap.propertyChildIds == shopCarMap.propertyChildIds) {
            hasSameGoodsIndex = i;
            shopCarMap.number = shopCarMap.number + tmpShopCarMap.number;
            break;
          }
        }
        toBuyInfo.shopNum = toBuyInfo.shopNum + this.data.buyNumber;
        if (hasSameGoodsIndex > -1) {
          toBuyInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap);
        } else {
          toBuyInfo.shopList.push(shopCarMap);
        }*/

    buyNowInfo.shopList.push(shopCarMap);
    buyNowInfo.kjId = this.data.kjId;
    return buyNowInfo;
  },
  onShareAppMessage: function() {
    return {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/index/goods-details/index?sid=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid'),
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  reputation: function(goodsId) {
    var that = this;
    WXAPI.goodsReputation({
      goodsId: goodsId
    }).then(function(res) {
      if (res.code == 0) {
        that.setData({
          reputation: res.data
        });
      }
    })
  },
  pingtuanList: function(goodsId) {
    var that = this;
    WXAPI.pingtuanList(goodsId).then(function(res) {
      if (res.code == 0) {
        that.setData({
          pingtuanList: res.data
        });
      }
    })
  },
  getVideoSrc: function(videoId) {
    var that = this;
    WXAPI.videoDetail(videoId).then(function(res) {
      if (res.code == 0) {
        that.setData({
          videoMp4Src: res.data.fdMp4
        });
      }
    })
  },
  getKanjiaInfo: function(gid) {
    var that = this;
    if (!app.globalData.kanjiaList || app.globalData.kanjiaList.length == 0) {
      that.setData({
        curGoodsKanjia: null
      });
      return;
    }
    let curGoodsKanjia = app.globalData.kanjiaList.find(ele => {
      return ele.goodsId == gid
    });
    if (curGoodsKanjia) {
      that.setData({
        curGoodsKanjia: curGoodsKanjia
      });
    } else {
      that.setData({
        curGoodsKanjia: null
      });
    }
  },
  goKanjia: function() {
    var that = this;
    if (!that.data.curGoodsKanjia) {
      return;
    }
    WXAPI.kanjiaJoin(that.data.curGoodsKanjia.id, wx.getStorageSync('token')).then(function(res) {
      if (res.code == 0) {
        wx.navigateTo({
          url: "/pages/kanjia/index?kjId=" + res.data.kjId + "&joiner=" + res.data.uid + "&id=" + res.data.goodsId
        })
      } else {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
      }
    })
  },
  joinPingtuan: function(e) {
    let pingtuanopenid = e.currentTarget.dataset.pingtuanopenid
    wx.navigateTo({
      url: "/pages/index/to-pay-order/index?orderType=buyNow&pingtuanOpenId=" + pingtuanopenid
    })
  }
})