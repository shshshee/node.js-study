// 사용자가 로그인했는지 하지 않았는지 체크하는 미들웨어 작성

//req.isAuthenticated()는 로그인상태일 경우 true반환
exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('로그인필요');
    }
};

exports.isNotLoggedIn = (req,res,next) => {
    if(!req.isAuthenticated()){
        next();
    } else {
        const message = encodeURIComponent('로그인한 상태입니다');
        res.redirect(`/?error=${message}`);
    }
};