const express = require('express');

const {isLoggedIn} = require('./middlewares');
const User = require('../models/user');
const { Op } = require("sequelize");

const router = express.Router();

//팔로우하기 기능
router.post('/:id/follow',isLoggedIn, async (req,res,next) => {
    try{
        const user = await User.findOne({where: {id: req.user.id}});
        if(user) {
            await user.addFollowing(parseInt(req.params.id, 10));
            res.send('success');
        } else {
            res.status(400).send('no user');
        }

    }catch(error){
        console.error(error);
        next(error);
    }
});

//팔로우 취소 기능
router.delete('/:id/delFollow', isLoggedIn, async(req,res,next) => {
    try{
        const user = await User.findOne({where: {id: req.user.id}});
        const myId = parseInt(req.user.id,10);
        if(user) {
            await user.removeFollowing({
                where:{
                    followingId:req.params.id
                }
            });
            res.json(result);
        } else {
            res.status(400).send('no user');
        }
    }catch(error){
        console.error(error);
        next(error);
    }
})

module.exports = router;