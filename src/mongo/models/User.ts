import { Schema, model, Document, Types } from "mongoose";
import { IUserRole } from "./UserRole";

export interface IUser extends Document {
  email: string;
  name: string;
  user_id: string;
  role: Types.ObjectId | IUserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    user_id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "RbacRole", required: true },
  },
  {
    timestamps: true,
    collection: "RbacUsers",
  }
);

export const User = model<IUser>("RbacUser", userSchema, "RbacUsers");
