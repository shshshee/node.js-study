const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares'); // middlewares.js에서 해당 라우터 불러오기
const { Post, User, Hashtag } = require('../models'); // post, user 가져오기
const { Op } = require("sequelize");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.use((req,res,next) => {
    res.locals.user = req.user;
    res.locals.followerCount = req.user ? req.user.Followers.length : 0;
    res.locals.followingCount = req.user ? req.user.Followings.length : 0;
    res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
    next();
});

try {
    fs.readdirSync('profiles');
}catch (error) {
    console.log('profiles 폴더가 없어 폴더를 생성합니다.');
    fs.mkdirSync('profiles'); // profiles 폴더 생성
}

//multer 함수로 미들웨어 생성
const upload = multer({
    // 이미지를 서버 디스크에 저장
    storage: multer.diskStorage({
        destination(req,file,cb) {
            cb(null,'profiles/'); // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
        },
        filename(req,file,cb) {
            const ext = path.extname(file.originalname); // ex photo.png
            cb(null,path.basename(file.originalname,ext)+Date.now()+ext); // basename: 파일이름 출력
        }
    }),
    limits: {fileSize: 5*1024*1024},
});

router.get('/profile', isLoggedIn, (req,res) => {
    res.render('profile', {title:'내 정보 - NodeBird'});
});

//프로필사진 보기
/*router.post('/photo', isLoggedIn, upload.single('img'), (req,res) => {
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}`}); // 저장된 파일에 대한 정보는 req.file 객체에 담김
});*/

router.post('/addPhoto',isLoggedIn,upload.single('img'), async(req,res,next)=> {
    try{
        const result = await User.update({
            photo: req.body.url
        },{
            where: {id:req.user.id}
        })
        res.redirect('/');
    }catch(error) {
        console.error(error);
        next(error);
    }
})

router.get('/join', isNotLoggedIn ,(req,res) => {
    res.render('join',{ title: '회원가입 - NodeBird'});
});

//메인페이지 요청 시 게시글을 먼저 조회한 후 템플릿 엔진 렌더링
router.get('/', async (req,res,next) => {
    try {
        const posts = await Post.findAll({
            include: {
                model: User,
                attributes:['id','nick'],
            },
            order: [['createdAt','DESC']],
        });
        res.render('main', {
            title: 'NodeBird',
            twits: posts,
        });
    } catch(err) {
        console.error(err);
        next(err);
    }
});

//유저 검색
router.get('/searchUser', async(req,res,next) => {
    const nickname = req.query.searchUser;
    //console.log(nickname);
    if(!nickname) { // 서버단으로 넘어온 쿼리스트링이 null인 경우
         return res.redirect('/');
    }
    try {
        const user = await User.findAll({
            where:{
                nick:{
                    [Op.like]:`%${nickname}%` //유사검색
                }
            }
        });

        console.log(user);
        return res.render('follow',{
            title:'NodeBird',
            users: user,
        })
    } catch (error) {
        console.log(error);
        return next(error);
    }
})

// 해시태그 검색
router.get('/hashtag', async(req,res,next) => {
    const query = req.query.hashtag;
    if(!query) {
        return res.redirect('/'); //없으면 메인화면으로 돌아가기
    }
    try {
        const hashtag = await Hashtag.findOne({where:{title:query}});
        let posts = [];
        if(hashtag) {
            posts = await hashtag.getPosts({include:[{model: User}]});
        }

        return res.render('main', {
            title: `${query} : NodeBird`,
            twits : posts,
        });

    } catch(error) {
        console.error(error);
        return next(error);
    }

})

module.exports = router;
