import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Field from 'App/Models/Field'
import Venue from 'App/Models/Venue'
import CreateFieldValidator from 'App/Validators/CreateFieldValidator'
import UpdateFieldValidator from 'App/Validators/UpdateFieldValidator'

export default class FieldsController {
  private serializeField = (field) => {
    return field.serialize({
      fields: { omit: ['venue_id'] },
      relations: {
        venue: {
          fields: { omit: ['created_at', 'updated_at', 'user_id'] },
          relations: { owner: { fields: ['id', 'name', 'email'] } },
        },
      },
    })
  }

  public async index({ params, request, response }: HttpContextContract) {
    const { venue_id } = params
    const { name, type } = request.qs()
    await Venue.findOrFail(venue_id) // not found error
    const fields = await Field.query()
      .where('venue_id', venue_id)
      .where('name', 'like', `%${name || ''}%`)
      .where('type', 'like', `%${type || ''}%`)
      .preload('venue', (venue) => {
        venue.preload('user')
      })
    const fieldsJSON = fields.map((field) => this.serializeField(field))
    response.ok({ message: 'Success.', data: fieldsJSON })
  }

  public async store({ params, request, response }: HttpContextContract) {
    const { name, type } = await request.validate(CreateFieldValidator)
    const { venue_id } = params
    const venue = await Venue.findOrFail(venue_id)
    const newField = await venue.related('fields').create({ name, type })
    response.created({ message: 'Created.', data: newField })
  }

  public async show({ params, response }: HttpContextContract) {
    const { venue_id, id } = params
    const field = await Field.query()
      .where('id', id)
      .where('venue_id', venue_id)
      .preload('venue', (venue) => {
        venue.preload('user')
      })
      .firstOrFail()
    //  select fields
    const fieldJSON = this.serializeField(field)
    response.ok({ message: 'Success.', data: fieldJSON })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { name, type } = await request.validate(UpdateFieldValidator)
    const { venue_id, id } = params

    const venue = await Venue.findOrFail(venue_id)
    const field = await Field.findOrFail(id)
    await field.merge({ name, type })
    await venue.related('fields').save(field)

    response.ok({ message: 'Updated', data: field })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { venue_id, id } = params
    const field = await Field.query()
      .where('id', id)
      .where('venue_id', venue_id)
      .firstOrFail()
    await field.delete()
    response.ok({ message: 'Deleted', data: field })
  }
}