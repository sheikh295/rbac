import { Schema, model, Document } from "mongoose";

export interface IFeature extends Document {
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const featureSchema = new Schema<IFeature>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "RbacFeatures",
  }
);

export const Feature = model<IFeature>("RbacFeature", featureSchema, "RbacFeatures");
