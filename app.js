const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // log
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv'); // 비밀키 저장
const passport = require('passport');

dotenv.config(); // 불러오기
const pageRouter = require('./routes/page'); // 아직 라우터 작성 x
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig(); // 패스포트 설정
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.log(err);
    });

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img',express.static(path.join(__dirname,'uploads'))); // upload 폴더에 저장된 이미지 제공
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET)); // cookieparser
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(passport.initialize()); // 요청객체에 Passport설정을 심음
app.use(passport.session()); // req.session 객체에 passport 정보를 저장 

//라우팅
app.use('/',pageRouter);
app.use('/auth',authRouter);
app.use('/post',postRouter);
app.use('/user',userRouter);

//미들웨어 작성 (라우터를 못찾았을 경우 np404처리)
app.use((req,res,next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

//에러처리 미들웨어
app.use((err,req,res,next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV != 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
})

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
})

//post 방식으로 전송되었을 때 전송된 데이터를 처리하기 위한 라우터 연결
// app.post('/upload',function(req,res){
//     res.send('업로드 성공!');
// })

