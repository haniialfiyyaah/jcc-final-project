import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Fields extends BaseSchema {
  protected tableName = 'fields'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.enu(
        'type',
        ['soccer', 'minisoccer', 'futsal', 'basketball', 'volleyball'],
        {
          useNative: true,
          enumName: 'venue_type',
          existingType: false,
        }
      )
      table.integer('venue_id').unsigned().references('id').inTable('venues')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
