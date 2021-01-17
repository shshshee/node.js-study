//패스포트 모듈 작성
const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

//req.session 객체에 어떤 데이터를 저장할 지 선택 => 사용자 아이디만 저장
module.exports = () => {
    passport.serializeUser((user,done) => {
        done(null, user.id);
    });

    //라우터 접근 시 실행 ? 
    passport.deserializeUser((id,done) => {
        User.findOne({
            where: { id },
            include: [{
                model: User,
                attributes: ['id','nick'],
                as: 'Followers',
            }, {
                model: User,
                attributes: ['id','nick'],
                as: 'Followings',
            }],
        })
            .then(user => done(null,user))
            .catch(err => done(err));
    });

    local();
    kakao();
}