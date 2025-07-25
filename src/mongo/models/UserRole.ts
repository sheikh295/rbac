import { Schema, model, Document, Types } from "mongoose";
import { IFeature } from "./Feature";
import { IPermission } from "./Permission";

export interface IUserRole extends Document {
  name: string;
  description: string;
  features?: IFeaturePermission[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeaturePermission {
  feature?: Types.ObjectId | IFeature;
  permissions?: Types.ObjectId[] | IPermission[];
}

const userRoleSchema = new Schema<IUserRole>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    features: [
      {
        feature: { type: Schema.Types.ObjectId, ref: "RbacFeature" },
        permissions: [{ type: Schema.Types.ObjectId, ref: "RbacPermission" }],
      },
    ],
  },
  {
    timestamps: true,
    collection: "RbacRoles",
  }
);

export const UserRole = model<IUserRole>("RbacRole", userRoleSchema, "RbacRoles");
