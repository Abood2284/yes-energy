import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const d_load_fcst = sqliteTable("d_load_fcst", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const j_load_fcst = sqliteTable("j_load_fcst", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const mm_load_fcst = sqliteTable("mm_load_fcst", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const mw_load_fcst = sqliteTable("mw_load_fcst", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const load_act = sqliteTable("load_act", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_act: text("load_act").notNull(), // Changed from load_fcst to load_act
});

export const d_load_fcst_full = sqliteTable("d_load_fcst_full", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const j_load_fcst_full = sqliteTable("j_load_fcst_full", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const mm_load_fcst_full = sqliteTable("mm_load_fcst_full", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const mw_load_fcst_full = sqliteTable("mw_load_fcst_full", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const load_act_full = sqliteTable("load_act_full", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_act: text("load_act").notNull(), // Changed from load_fcst to load_act
});

// Type definitions for better type inference
export type DLoadFcst = typeof d_load_fcst.$inferSelect;
export type JLoadFcst = typeof j_load_fcst.$inferSelect;
export type MMLoadFcst = typeof mm_load_fcst.$inferSelect;
export type MWLoadFcst = typeof mw_load_fcst.$inferSelect;
export type LoadAct = typeof load_act.$inferSelect;