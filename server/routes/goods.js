var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Goods = require('../models/goods');

//连接MongoDB数据库
mongoose.connect('mongodb://root:123456@localhost:27017/dumall');

mongoose.connection.on("connected", function () {
  console.log("MongoDB connected success.");
});

mongoose.connection.on("error", function () {
  console.log("MongoDB connected fail.");
});

mongoose.connection.on("disconnected", function () {
  console.log("MongoDB connected disconnected.");
});

//查询商品列表
router.get('/', (req, res, next) => {
  let page = parseInt(req.param('page'));
  let pageSize = parseInt(req.param('pageSize'));
  let priceLevel = req.param('priceLevel');
  let sort = req.param('sort');
  if (!page || !pageSize || !(sort == 1 || sort == -1)) {
    res.json({
      status: '2',
      msg: '参数错误~'
    });
    return;
  }
  let skip = (page-1)*pageSize;
  var priceGt = '', priceLte = '';
  let params = {};
  if (priceLevel != 'all') {
    switch (priceLevel) {
      case '0': priceGt = 0;priceLte = 100;break;
      case '1': priceGt = 100;priceLte = 500;break;
      case '2': priceGt = 500;priceLte = 1000;break;
      case '3': priceGt = 1000;priceLte = 2000;break;
    }
    params.salePrice = {
      $gt: priceGt,
      $lte: priceLte
    }
  }
  let goodsModel = Goods.find(params).skip(skip).limit(pageSize);
  goodsModel.sort({'salePrice': sort});
  goodsModel.exec((err, doc) => {
    if (err) {
      res.json({
        status: '1',
        msg: err.message
      });
    } else {
      res.json({
        status: '0',
        msg: '',
        result: {
          count: doc.length,
          list: doc
        }
      });
    }
  });
});

//加入购物车
router.post('/addCart', (req, res, next) => {
  var userId = '100000077',productId = req.body.productId;
  var User = require('../models/user');

  User.findOne({ userId: userId }, (err, userData) => {
    if (err) {
      res.json({
        status: '1',
        msg: err.message
      });
    } else {
      if (userData) {
        let goodsItem = '';
        userData.cartList.forEach((item) => {
          if (item.productId == productId) {
            goodsItem = item;
            item.productNum ++;
          }
        });

        if (goodsItem) {
          userData.save((err2, doc2) => {
            if (err2) {
              res.json({
                status: '1',
                msg: err2.message
              });
            } else {
              res.json({
                status: '0',
                msg: '',
                result: 'success'
              });
            }
          });
        } else {
          Goods.findOne({productId: productId}, (err1, doc) => {
            if (err1) {
              res.json({
                status: '1',
                msg: err1.message
              });
            } else {
              if (doc) {
                var doc = doc.toObject();
                doc.productNum = 1;
                doc.checked = 1;
                userData.cartList.push(doc);
                userData.save((err2, doc2) => {
                  if (err2) {
                    res.json({
                      status: '1',
                      msg: err2.message
                    });
                  } else {
                    res.json({
                      status: '0',
                      msg: '',
                      result: 'success'
                    });
                  }
                });
              }
            }
          });
        }
      }
    }
  });
});

module.exports = router;
