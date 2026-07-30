import type { Model } from "mongoose";

export async function upsertById<T extends { id: string }>(
  model: Model<T>,
  doc: T,
): Promise<void> {
  const existing = await model.findOne({ id: doc.id });
  if (existing) {
    await model.updateOne({ id: doc.id }, { $set: doc });
  } else {
    await model.create(doc);
  }
}
