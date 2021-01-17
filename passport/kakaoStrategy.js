//카카오 로그인 구현
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

//회원가입과 로그인이 전략에서 동시에 수행된다.
module.exports = () => {
    passport.use(new KakaoStrategy({
        clientID: process.env.KAKAO_ID,
        callbackURL: '/auth/kakao/callback', //로그인 후 결과를 전송해 줄 url
    }, async (accessToken, refreshToken, profile, done) => {
        console.log('kakao profile', profile); //가져온 프로필
        try{
            const exUser = await User.findOne({
                where: {snsId: profile.id, provider: 'kakao'},
            });
            if(exUser) {
                done(null,exUser); //존재하면 세션에 저장
            } else { //회원가입
                const newUser = await User.create({
                    email: profile._json && profile._json.kaccount_email,
                    nick: profile.displayName,
                    snsId: profile.id,
                    provider: 'kakao',
                });
                done(null,newUser);
            }
        }catch (error) {
            console.error(error);
            done(error);
        }
    }));
}

