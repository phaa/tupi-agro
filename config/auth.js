module.exports = {
  ensureAuthenticated : function(req,res,next) {
    if(req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg' , 'Faça login para visualizar essa página');
    res.redirect('/users/login');
  }
}