import express from 'express';
import { changePasswordController, deleteDBController, emailVerifyController, followController, forgetPasswordController, getMeController, getUser, loginController, logoutController, oauthController, refreshTolenController, registerController, resenVerifyEmailVerifyController, resetpasswordController, unfollowController, updateMeController, verifyForgotPasswordTokenController } from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middleware';
import { accessTokenValidator, changePasswordValidator, emailVerifyTokenValidator, followValidator, forgotPasswordvalidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidor, unfollowValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from '~/middlewares/users.middlewares';
import { UpdateMeReqBody } from '~/models/requests/User.requests';
import { wrapRequestHandler } from '~/utils/handlers';
const userRouter = express.Router()
userRouter.use((req, res, next) => {
  next()
})
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
userRouter.get('/oauth/google', wrapRequestHandler(oauthController))
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTolenController))
userRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resenVerifyEmailVerifyController))
userRouter.post('/forgot-password', forgotPasswordvalidator, wrapRequestHandler(forgetPasswordController))
userRouter.post('/verify-forgot-password', verifyForgotPasswordTokenValidator, wrapRequestHandler(verifyForgotPasswordTokenController))
userRouter.post('/reset-password', resetPasswordValidor, wrapRequestHandler(resetpasswordController))
userRouter.put('/change-password', accessTokenValidator, verifiedUserValidator, changePasswordValidator, wrapRequestHandler(changePasswordController))
userRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))
userRouter.patch('/me', accessTokenValidator, verifiedUserValidator, updateMeValidator, filterMiddleware<UpdateMeReqBody>(['name', 'date_of_birth', 'bio', 'location', 'website', 'username', 'avatar', 'cover_photo']), wrapRequestHandler(updateMeController))
// twitter
userRouter.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapRequestHandler(followController))
userRouter.delete('/follow/:user_id', accessTokenValidator, verifiedUserValidator, unfollowValidator, wrapRequestHandler(unfollowController))
// delete full db
userRouter.get('/delete-db', wrapRequestHandler(deleteDBController))
// Get profile form username
userRouter.get('/:username', wrapRequestHandler(getUser))
export default userRouter