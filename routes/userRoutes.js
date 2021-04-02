const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');



const Router = express.Router();

Router.post('/signup', authController.signup);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);

Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

Router.use(authController.protect); //All will be protected after this middleware

Router.patch(
  '/updateMyPassword' ,
    authController.updatePassword
  );

Router.get('/me', userController.getMe , userController.getUser);

Router.patch('/updateMe'  , userController.uploadUserPhoto , userController.resizeUserPhoto , userController.updateMe);
Router.delete('/deleteMe', userController.deleteMe);

Router.use(authController.restrictTo('admin')); //All routes after this will be restricted

Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createAllUsers);
Router.route('/:id')
  .get(userController.getUser)
  .post(userController.createUser)
  .delete(userController.deleteUser);



module.exports = Router;
