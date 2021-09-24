import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Field from './Field'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value ? value.toFormat('yyyy-MM-dd HH:mm:ss') : value
    },
  })
  public play_date_start: DateTime

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value ? value.toFormat('yyyy-MM-dd HH:mm:ss') : value
    },
  })
  public play_date_end: DateTime

  @column()
  public total_players: number

  @column()
  public field_id: number

  @column({ serializeAs: 'user_id_booking' })
  public user_id: number

  @column.dateTime({
    autoCreate: true,
    serialize: (value: DateTime | null) => {
      return value ? value.toFormat('yyyy-MM-dd HH:mm:ss') : value
    },
  })
  public createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serialize: (value: DateTime | null) => {
      return value ? value.toFormat('yyyy-MM-dd HH:mm:ss') : value
    },
  })
  public updatedAt: DateTime

  @belongsTo(() => Field, {
    foreignKey: 'field_id',
  })
  public field: BelongsTo<typeof Field>

  @belongsTo(() => User, {
    foreignKey: 'user_id',
    serializeAs: 'user_booking',
  })
  public user: BelongsTo<typeof User>
}