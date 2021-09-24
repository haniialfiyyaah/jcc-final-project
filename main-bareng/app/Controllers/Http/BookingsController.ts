import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Booking from 'App/Models/Booking'
import Field from 'App/Models/Field'
import User from 'App/Models/User'
import Venue from 'App/Models/Venue'
import CreateBookingValidator from 'App/Validators/CreateBookingValidator'

export default class BookingsController {
  private serializeField = (booking) => {
    return booking.serialize({
      fields: { omit: ['field_id', 'user_id_booking'] },
      relations: {
        players: {
          fields: ['id', 'name', 'email'],
        },
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
      .preload('players')
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

  public async show({ params, response }: HttpContextContract) {
    const booking = await Booking.query()
      .where('id', params.id)
      .preload('players')
      .preload('field', (field) => {
        field.preload('venue', (venue) => {
          venue.preload('user')
        })
      })
      .preload('user')
      .firstOrFail()
    const bookingJSON = this.serializeField(booking)
    //  const bookingJSON = booking.serialize({
    //   relations: {
    //     players: {
    //       fields: ['id', 'name', 'email'],
    //     },
    //   },
    // })
    response.ok({ message: 'Success', data: bookingJSON })
  }

  public async join({ auth, params, response }: HttpContextContract) {
    const user = await User.findOrFail(auth.user?.id)
    const booking = await Booking.findOrFail(params.id)
    await booking.related('players').attach([user.id])
    response.created({ message: 'Successfully join.', status: true })
  }

  public async unjoin({ auth, params, response }: HttpContextContract) {
    const user = await User.findOrFail(auth.user?.id)
    const booking = await Booking.findOrFail(params.id)
    await booking.related('players').detach([user.id])
    response.created({ message: 'Successfully unjoin.', status: true })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { id } = params
    const booking = await Booking.query().where('id', id).firstOrFail()
    await booking.delete()
    response.ok({ message: 'Deleted', data: booking })
  }

  public async schedules({ auth, response }: HttpContextContract) {
    const id: number = auth.user?.id || -1
    const userPlays = await User.query()
      .where('id', id)
      .preload('play_schedules', (booking) => {
        booking
          .preload('field', (field) => {
            field.preload('venue', (venue) => {
              venue.preload('user')
            })
          })
          .preload('user')
      })
      .firstOrFail()
    const userPlaysJSON = userPlays.serialize({
      fields: ['id', 'name', 'email'],
      relations: {
        play_schedules: {
          fields: {
            omit: [
              'created_at',
              'updated_at',
              'players',
              'field_id',
              'user_id_booking',
            ],
          },
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
        },
      },
    })
    response.ok({ message: 'Success', data: userPlaysJSON })
  }
}
