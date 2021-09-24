import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Booking from 'App/Models/Booking'
import Field from 'App/Models/Field'
import Venue from 'App/Models/Venue'
import CreateBookingValidator from 'App/Validators/CreateBookingValidator'

export default class BookingsController {
  private serializeField = (booking) => {
    return booking.serialize({
      fields: { omit: ['field_id', 'user_id_booking'] },
      relations: {
        user_booking: { fields: ['id', 'name', 'email'] },
        field: {
          fields: { omit: ['created_at', 'updated_at', 'venue_id'] },
          relations: {
            venue: {
              fields: { omit: ['created_at', 'updated_at', 'user_id'] },
              relations: { owner: { fields: ['id', 'name', 'email'] } },
            },
          },
        },
      },
    })
  }

  public async index({ response }: HttpContextContract) {
    const bookings = await Booking.query()
      .preload('field', (field) => {
        field.preload('venue', (venue) => {
          venue.preload('user')
        })
      })
      .preload('user')
    const bookingsJSON = bookings.map((booking) => this.serializeField(booking))
    response.ok({ message: 'Success.', data: bookingsJSON })
  }

  public async store({ auth, params, request, response }: HttpContextContract) {
    const { field_id, play_date_start, play_date_end, total_players } =
      await request.validate(CreateBookingValidator)
    const venue = await Venue.findOrFail(params.id)
    const field = await Field.query()
      .where('id', field_id)
      .where('venue_id', venue.id)
      .firstOrFail()

    let isDouble = false
    const newBooking = await field
      .related('bookings')
      .create({
        play_date_start,
        play_date_end,
        total_players,
        user_id: auth.user?.id,
      })
      .catch((err) => {
        if (err.message.includes('Duplicate entry')) isDouble = true
      })
    if (isDouble) return response.badRequest({ message: 'Double booking.' })

    response.created({ message: 'Booking success.', data: newBooking })
  }

  public async show({}: HttpContextContract) {}

  public async join({}: HttpContextContract) {}

  public async unjoin({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
