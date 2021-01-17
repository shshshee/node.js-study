//회원가입 라우터 작성
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 회원가입 라우터
router.post('/join', isNotLoggedIn, async (req,res,next) => {
    const {email, nick, password} = req.body;
    try {
        const exUser = await User.findOne({where : {email}});
        if(exUser) {
            return res.redirect('/join?error=exist'); //1회성 쿼리스트링
        }
        const hash = await bcrypt.hash(password,12); // 비밀번호 암호화
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

//로그인 라우터 만들기
//passport.authenticate : 로컬전략
//authError: 인증과정중 에러 , user: 인증 성공 시 유저 정보 , info : 인증 오류에 대한 메세지
router.post('/login', isNotLoggedIn, (req,res,next) => {
    passport.authenticate('local', (authError, user, info) => {
        if(authError) { //인증에러
            console.error(authError);
            return next(authError);
        }
        if(!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        //세션에 유저정보 저장
        return req.login(user, (loginError) => {
            if(loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req,res,next); // 미들웨어 내의 미들웨어는 (req,res,next)를 붙임
});

router.get('/logout', isLoggedIn, (req,res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/kakao',passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
}), (req,res) => {
    res.redirect('/'); // 인증성공시 리다이렉트
});

module.exports = router;