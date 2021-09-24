import Mail from '@ioc:Adonis/Addons/Mail'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OtpCode from 'App/Models/OtpCode'
import User from 'App/Models/User'
import OtpValidator from 'App/Validators/OtpValidator'
import RegisterUserValidator from 'App/Validators/RegisterUserValidator'

export default class AuthController {
  public async login({ request, response }: HttpContextContract) {
    response.ok({ message: 'Login successful.' })
  }
  public async register({ request, response }: HttpContextContract) {
    // validate
    const { name, email, password, role } = await request.validate(
      RegisterUserValidator
    )
    const newUser = await User.create({ name, email, password, role })
    // send otp
    const otp_code = Math.floor(100000 + Math.random() * 900000)
    await Mail.send((message) => {
      message
        .from('owner@mainbareng.app')
        .to(email)
        .subject('Verification Email')
        .htmlView('emails/otp_confirmation', { otp_code })
    })
    // save otp
    await OtpCode.create({ otp_code, user_id: newUser.id })
    // response
    response.created({
      message: 'Registered. Please verify your email.',
      data: newUser,
    })
  }
  public async otpConfirmation({ request, response }: HttpContextContract) {
    const { email, otp_code } = await request.validate(OtpValidator)
    const user = await User.findByOrFail('email', email)
    const otpCheck = await OtpCode.findBy('otp_code', otp_code)
    if (user?.id === otpCheck?.user_id) {
      user.is_verified = true
      await user?.save()
      return response.ok({ message: 'Email verified successfully.' })
    } else {
      return response.badRequest({ message: 'Email verification failed.' })
    }
  }
}
