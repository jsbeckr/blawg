
/*
 * GET home page.
 */

var mongoose = require('mongoose');

//var Post = mongoose.model('BlogPost');

exports.index = function(req, res){
	Post.find({}, function(err, docs) {
		res.render('index', { posts: docs });
	});
};

exports.admin = function(req, res) {
	res.render('admin');
};