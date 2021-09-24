import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Venue from 'App/Models/Venue'
import CreateVenueValidator from 'App/Validators/CreateVenueValidator'
import UpdateVenueValidator from 'App/Validators/UpdateVenueValidator'

export default class VenuesController {
  public async index({ request, response }: HttpContextContract) {
    const { name, address, phone } = request.qs()
    const venues = await Venue.query()
      .where('name', 'like', `%${name || ''}%`)
      .where('address', 'like', `%${address || ''}%`)
      .where('phone', 'like', `%${phone || ''}%`)
    response.ok({ message: 'Success.', data: venues })
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const { name, address, phone } = await request.validate(
      CreateVenueValidator
    )
    const user = await User.findOrFail(auth.user?.id)
    const newVenue = await user?.related('venues').create({
      name,
      address,
      phone,
    })
    response.created({ message: 'Created.', data: newVenue })
  }

  public async show({ params, response }: HttpContextContract) {
    const { id } = params
    const venue = await Venue.findOrFail(id)
    await venue.load('user')
    response.ok({ message: 'Success.', data: venue })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { name, address, phone } = await request.validate(
      UpdateVenueValidator
    )
    const { id } = params
    const venue = await Venue.findOrFail(id)
    await venue.merge({ name, address, phone }).save()
    response.ok({ message: 'Updated', data: venue })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { id } = params
    const venue = await Venue.findOrFail(id)
    await venue.delete()
    response.ok({ message: 'Deleted', data: venue })
  }
}
