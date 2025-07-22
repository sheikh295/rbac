import { Schema, model, Document } from "mongoose";

export interface IPermission extends Document {
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "Permissions",
  }
);

export const Permission = model<IPermission>("Permission", permissionSchema, "Permissions");
