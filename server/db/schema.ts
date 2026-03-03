import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  characterType: text('character_type').notNull().default(''),
  unitType: text('unit_type').notNull().default('Primary'),
  unitTypeName: text('unit_type_name'),
  pc: real('pc'),
  sp: real('sp'),
  durability: integer('durability').notNull().default(0),
  stamina: integer('stamina').notNull().default(0),
  fp: integer('fp').notNull().default(0),
  era: text('era').notNull().default(''),
  swp: text('swp').notNull().default(''),
  swpCode: text('swp_code'),
  spt: text('spt'),
  thumbnail: text('thumbnail').notNull().default(''),
  cardFront: text('card_front').notNull().default(''),
  cardBack: text('card_back').notNull().default(''),
  orderCard: text('order_card'),
  stance1: text('stance1'),
  stance2: text('stance2'),
  model: text('model'),
  modelCount: integer('model_count'),
  characterExclusion: text('character_exclusion'),
  extraCards: text('extra_cards'),
  releaseDate: text('release_date').notNull().default(''),
})

export const characterTags = sqliteTable('character_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull(),
  tag: text('tag').notNull(),
})

export const missions = sqliteTable('missions', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  swp: text('swp').notNull().default(''),
  spt: text('spt'),
  card: text('card').notNull().default(''),
  struggle1a: text('struggle1a'),
  struggle1b: text('struggle1b'),
  struggle1c: text('struggle1c'),
  struggle2a: text('struggle2a'),
  struggle2b: text('struggle2b'),
  struggle2c: text('struggle2c'),
  struggle3a: text('struggle3a'),
  struggle3b: text('struggle3b'),
  struggle3c: text('struggle3c'),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  swp: text('swp').notNull().default(''),
  number: text('number'),
  era: text('era').notNull().default(''),
  description: text('description').notNull().default(''),
  thumbnail: text('thumbnail').notNull().default(''),
  mainImage: text('main_image'),
  assemblyUrl: text('assembly_url').notNull().default(''),
  storeLink: text('store_link').notNull().default(''),
})

export const productImages = sqliteTable('product_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
})

export const productModels = sqliteTable('product_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull(),
  characterName: text('character_name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
})
