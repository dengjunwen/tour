// 发送请求
class View {
  constructor(url, method) {
    this.url = url;
    this.method = method;

  }
  sendhttp(url, method, fn) {
    wx.request({
      url: url,
      data: {},
      method: method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      success: function (res) {
        // success
        fn && fn(res);
      }
    })
  }
  send(cb) {
    this.cb = cb;
    this.sendhttp(this.url, this.method, this.getData.bind(this))
  }
  getData(res) {
    this.cb(res);
  }
}
// 处理评分
function star(score) {
  let arr = [];
  let intScore = parseInt(score);
  if (score != intScore) {
    score = score > intScore && score < (intScore + 0.5) ? Math.floor(score) : intScore + 0.5
  }

  for (let i = 1; i <= 5; i++) {
    // 全星
    if (i <=score) {
      arr.push(2)
      // 半星
    } else if (i - score == 0.5) {
      arr.push(1)
    } else {
      // 没有星
      arr.push(0)
    }

  }
  return arr
}
// 处理景区数据
function getViewData(allCity, cityName,fn) {
  let arr=[];
  // 获取城市的id
  for (let i = 0; i < allCity.length; i++) {
    if (allCity[i].cityName == cityName) {
      let provinceId = allCity[i].provinceId
      
      // 获取景区的的sid
      new View("http://70989421.appservice.open.weixin.qq.com/data/view.json", "get").send((res) => {
        // 搜索到相应的景区
        if (res.data.error_code == 0) {
          let data = res.data.result;
          arr=dealData(data, provinceId);
          fn&fn(arr);
        } else {
          // 没有获取到该地的景区
          //  此处调用查找全国景区api
          // 此处模拟数据全部置为四川
          new View("http://70989421.appservice.open.weixin.qq.com/data/view.json", "get").send((res) => {
            // 处理数据
            let data = res.data.result;  
           arr= dealData(data, 26);
              fn&fn(arr);
          })
        }
      })
    }
  }; 
}
function dealData(data, provinceId) {
  let resultArr = [];
  for (let i = 0, len = data.length; i < len; i++) {
    let dataIn = data[i];
    if (provinceId == dataIn.provinceId) {
      let item = {
        imgurl: dataIn.imgurl,
        title: dataIn.title,
        sid: dataIn.sid,
        now_price: dataIn.now_price,
        old_price: dataIn.old_price,
        address: dataIn.address,
        hot: dataIn.hot,
        free: dataIn.free,
        meal: dataIn.meal,
        desc: dataIn.desc,
        seller: dataIn.seller
      }
      resultArr.push(item)
    }
  }
  return resultArr;
}
function dateNow(){
  let arr=[];
  let date=new Date();
  let year=date.getFullYear();
  let month=date.getMonth()+1;
  let day=date.getDate();
  let week=date.getDay();
   switch(week){
      case 0: week=["日","一","二","三","四","五","六"];
      break;
      case 1: week=["一","二","三","四","五","六","日"];
      break;
      case 2: week=["二","三","四","五","六","日","一"];
      break;
      case 3: week=["三","四","五","六","日","一","二"];
      break;
      case 4: week=["四","五","六","日","一","二","三"];
      break;
      case 5: week=["五","六","日","一","二","三","四"];
      break;
      case 6: week=["六","日","一","二","三","四","五"];
      break;
    };
  for(let i=0;i<4;i++){
    arr.push({
        year:year,
        month:month,
        day:day+i,
        week:week[i]
    })
  }
  return arr;
   
}




function formatTime(time) {
  if (typeof time !== 'number' || time < 0) {
    return time
  }

  const hour = parseInt(time / 3600, 10)
  time %= 3600
  const minute = parseInt(time / 60, 10)
  time = parseInt(time % 60, 10)
  const second = time

  return ([hour, minute, second]).map(function (n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  }).join(':')
}

function formatLocation(longitude, latitude) {
  if (typeof longitude === 'string' && typeof latitude === 'string') {
    longitude = parseFloat(longitude)
    latitude = parseFloat(latitude)
  }

  longitude = longitude.toFixed(2)
  latitude = latitude.toFixed(2)

  return {
    longitude: longitude.toString().split('.'),
    latitude: latitude.toString().split('.')
  }
}

function fib(n) {
  if (n < 1) return 0
  if (n <= 2) return 1
  return fib(n - 1) + fib(n - 2)
}

function formatLeadingZeroNumber(n, digitNum = 2) {
  n = n.toString()
  const needNum = Math.max(digitNum - n.length, 0)
  return new Array(needNum).fill(0).join('') + n
}

function formatDateTime(date, withMs = false) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const ms = date.getMilliseconds()

  let ret = [year, month, day].map(value => formatLeadingZeroNumber(value, 2)).join('-') +
    ' ' + [hour, minute, second].map(value => formatLeadingZeroNumber(value, 2)).join(':')
  if (withMs) {
    ret += '.' + formatLeadingZeroNumber(ms, 3)
  }
  return ret
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
/**
 * 时间戳转化为年 月 日 时 分 秒
 * ts: 传入时间戳
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致
*/
function tsFormatTime(timestamp, format) {

  const formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
  let returnArr = [];

  let date = new Date(timestamp);
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  let hour = date.getHours()
  let minute = date.getMinutes()
  let second = date.getSeconds()
  returnArr.push(year, month, day, hour, minute, second);

  returnArr = returnArr.map(formatNumber);

  for (var i in returnArr) {
    format = format.replace(formateArr[i], returnArr[i]);
  }
  return format;

}

export { View, star, getViewData, dateNow, formatTime, formatLocation, fib, formatDateTime, tsFormatTime}


