import { i } from "@instantdb/admin";

const _schema = i.schema({
  entities: {
    payments: i.entity({
      // The person who paid: Nhan, Thuong, or Dung
      name: i.string().indexed(),
      // Stored as x, displayed as x * 1000 VND
      money: i.number(),
      // Optional description/explanation
      description: i.string().optional(),
      // Telegram username who created this record
      createdBy: i.string(),
      // Telegram username who last updated this record
      updatedBy: i.string(),
      // Unix timestamp in ms when record was created
      createdAt: i.number(),
      // Unix timestamp in ms when record was last updated
      updatedAt: i.number(),
      // null = active, timestamp = soft-deleted
      deletedAt: i.number().optional(),
    }),
  },
});

export type AppSchema = typeof _schema;
export default _schema;
