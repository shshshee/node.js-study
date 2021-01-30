//이미지업로드 라우터 구현
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag,User } = require('../models'); // 모델 가져오기
const {isLoggedIn} = require('./middlewares');

const router = express.Router();

try {
    fs.readdirSync('uploads'); // 디렉토리 검색 ?
}catch (error) {
    console.error('uploads 폴더가 없어 생성함');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({ // 이미지를 서버디스크에 저장
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req,file,cb) { // 저장 파일명
            const ext = path.extname(file.originalname); // 확장자
            // path.basename(file.originalname,ext) - 확장자를 제외한 나머지를 basename으로 지정
            //파일이름지정
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: {fileSize: 5 * 1024 * 1024},
});

// isloggedin ?? -> 로그인여부
// upload.single : req.file 객체에 한 개의 파일 업로드
// upload.none() : 파일 업로드 없이 텍스트 데이터만 multipart 형식으로 전송했을때
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file);
    res.json({url: `/img/${req.file.filename}`});
});

//이미지 업로드가 아닐경우
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(),async(req,res,next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        //일치하는 문자열의 배열 전환 (정규표현식)
        //공백문자 및 # 문자 제외하고 검색
        const hashtags = req.body.content.match(/#[^\s#]+/g);
        if(hashtags) {
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({
                        where: {title: tag.slice(1).toLowerCase() },
                    })
                }),
            );
            await post.addHashtags(result.map(r=>r[0]));
        }
        res.redirect('/');
    }catch(error) {
        console.error(error);
        next(error);
    }
});

// 해당 유저 포스팅 조회하기 라우터
router.get('/:id/getPosting',async(req,res,next)=>{
    try{
        const posts = await Post.findAll(
            {
                include: {
                    model: User,
                    attributes:['id','nick'],
                },
                where:{userId:req.params.id},
                order: [['createdAt','DESC']],
            },
        );
        res.render('userPosting',{
            title:'Nodebird',
            twits:posts,
        });

    }catch(err){
        console.error(err);
        next(err);
    }
})

// 본인 글 삭제하기
router.delete('/:postId/deleteTwit',async(req,res,next)=>{
    try{
        const result = await Post.destroy(
            {where:{id:req.params.postId}}
        )
        console.log("삭제결과::::"+result);
        res.json(result);
    }catch(err){
        console.error(err);
        next(err);
    }
})

module.exports = router;